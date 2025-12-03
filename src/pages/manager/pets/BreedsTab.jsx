import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Category, Pets as PetsIcon, Visibility, Close, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddPetBreedModal from '../../../components/modals/AddPetBreedModal';
import petBreedsApi from '../../../api/petBreedsApi';

const BreedsTab = ({ pets, species, breeds, onDataChange }) => {
    const [searchBreed, setSearchBreed] = useState('');
    const [breedFilterSpecies, setBreedFilterSpecies] = useState('all');
    const [breedPage, setBreedPage] = useState(1);
    const [breedItemsPerPage, setBreedItemsPerPage] = useState(10);

    const [breedDialogOpen, setBreedDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedBreed, setSelectedBreed] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuBreed, setMenuBreed] = useState(null);

    const [breedDetailDialog, setBreedDetailDialog] = useState({ open: false, breed: null, pets: [] });

    // Helper function to capitalize first letter
    const capitalizeName = useCallback((name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    }, []);

    // Pre-compute species name map to avoid repeated array scans
    const speciesNameMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();
        return new Map(species.map((s) => [s.id, capitalizeName(s.name)]));
    }, [species, capitalizeName]);

    // Map mỗi speciesId sang một cặp màu riêng để chip "Loài" dễ phân biệt
    const speciesColorMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();

        const colorPairs = [
            { bg: COLORS.INFO[100], text: COLORS.INFO[700] },
            { bg: COLORS.ERROR[100], text: COLORS.ERROR[700] },
            { bg: COLORS.SUCCESS[100], text: COLORS.SUCCESS[700] },
            { bg: COLORS.WARNING[100], text: COLORS.WARNING[700] },
            { bg: COLORS.PRIMARY?.[100] || COLORS.INFO[100], text: COLORS.PRIMARY?.[700] || COLORS.INFO[700] }
        ];

        const map = new Map();
        species.forEach((s, index) => {
            const palette = colorPairs[index % colorPairs.length];
            map.set(s.id, palette);
        });
        return map;
    }, [species]);

    // Get species name by ID (O(1) lookup)
    const getSpeciesName = useCallback(
        (speciesId) => {
            if (!speciesId) return '—';
            return speciesNameMap.get(speciesId) || '—';
        },
        [speciesNameMap]
    );

    const getSpeciesChipColors = useCallback(
        (speciesId) => {
            if (!speciesId) {
                return { bg: alpha(COLORS.INFO[100], 0.6), text: COLORS.INFO[700] };
            }
            return speciesColorMap.get(speciesId) || { bg: alpha(COLORS.INFO[100], 0.6), text: COLORS.INFO[700] };
        },
        [speciesColorMap]
    );

    // Colors for dog & cat stats cards – đồng bộ với chip Loài
    const dogSpeciesColors = useMemo(() => {
        let palette = null;
        species.forEach((s) => {
            if ((s.name || '').toLowerCase() === 'chó') {
                palette = speciesColorMap.get(s.id) || palette;
            }
        });
        return palette || { bg: COLORS.ERROR[100], text: COLORS.ERROR[700] };
    }, [species, speciesColorMap]);

    const catSpeciesColors = useMemo(() => {
        let palette = null;
        species.forEach((s) => {
            if ((s.name || '').toLowerCase() === 'mèo') {
                palette = speciesColorMap.get(s.id) || palette;
            }
        });
        return palette || { bg: COLORS.PRIMARY?.[100] || COLORS.INFO[100], text: COLORS.PRIMARY?.[700] || COLORS.INFO[700] };
    }, [species, speciesColorMap]);

    // Get pet health status
    const getPetHealthStatus = (pet) => {
        if (pet.age < 1 || pet.age > 12) {
            return { label: 'Cần theo dõi', color: COLORS.WARNING, bg: COLORS.WARNING[100] };
        }
        if (pet.weight < 2 || pet.weight > 50) {
            return { label: 'Cần kiểm tra', color: COLORS.INFO, bg: COLORS.INFO[100] };
        }
        return { label: 'Khỏe mạnh', color: COLORS.SUCCESS, bg: COLORS.SUCCESS[100] };
    };

    // Smooth search input using deferred value (avoid blocking while typing)
    const deferredSearch = useDeferredValue(searchBreed);

    // Statistics (based on full dataset)
    const stats = useMemo(() => {
        const total = breeds.length;
        const active = breeds.filter(b => b.is_active !== false).length;
        const inactive = breeds.filter(b => b.is_active === false).length;

        // Đếm riêng số giống chó / mèo theo tên loài
        let dogCount = 0;
        let catCount = 0;

        breeds.forEach((breed) => {
            const speciesName = (speciesNameMap.get(breed.species_id) || '').toLowerCase();
            if (speciesName === 'chó') {
                dogCount += 1;
            } else if (speciesName === 'mèo') {
                catCount += 1;
            }
        });

        return {
            total,
            active,
            inactive,
            dogs: dogCount,
            cats: catCount
        };
    }, [breeds, speciesNameMap]);

    // Filtered breeds
    const filteredBreeds = useMemo(() => {
        const searchLower = deferredSearch.trim().toLowerCase();

        return breeds.filter((breed) => {
            const matchSearch = searchLower
                ? (breed.name || '').toLowerCase().includes(searchLower)
                : true;

            const matchSpecies =
                breedFilterSpecies === 'all' || breed.species_id === breedFilterSpecies;

            return matchSearch && matchSpecies;
        });
    }, [breeds, deferredSearch, breedFilterSpecies]);

    // Pagination
    const breedTotalPages = Math.ceil(filteredBreeds.length / breedItemsPerPage);
    const currentPageBreeds = useMemo(() => {
        const startIndex = (breedPage - 1) * breedItemsPerPage;
        return filteredBreeds.slice(startIndex, startIndex + breedItemsPerPage);
    }, [breedPage, breedItemsPerPage, filteredBreeds]);

    // Handle breed add/edit
    const handleOpenBreedDialog = useCallback((breed = null) => {
        if (breed) {
            setEditMode(true);
            setSelectedBreed(breed);
        } else {
            setEditMode(false);
            setSelectedBreed(null);
        }
        setBreedDialogOpen(true);
    }, []);

    const handleSubmitBreed = useCallback(async (breedFormData) => {
        try {
            setIsSubmitting(true);

            const breedData = {
                name: breedFormData.name.trim(),
                species_id: breedFormData.species_id,
                description: breedFormData.description.trim(),
                average_weight: parseFloat(breedFormData.average_weight),
                average_lifespan: parseInt(breedFormData.average_lifespan)
            };

            let response;
            if (editMode && selectedBreed) {
                response = await petBreedsApi.updateBreed(selectedBreed.id, breedData);
            } else {
                response = await petBreedsApi.createBreed(breedData);
            }

            if (response.success) {
                await onDataChange();
                setBreedDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || (editMode ? 'Cập nhật giống thành công!' : 'Thêm giống mới thành công!'),
                    type: 'success'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin giống',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [editMode, onDataChange, selectedBreed]);

    // Handle delete
    const handleDelete = useCallback((id) => {
        setDeleteTarget(id);
        setConfirmDeleteOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        try {
            const response = await petBreedsApi.deleteBreed(deleteTarget);
            if (response.success) {
                await onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Xóa giống thành công!',
                    type: 'success'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa',
                type: 'error'
            });
        } finally {
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, onDataChange]);

    // Handle view breed details
    const handleViewBreedDetails = useCallback((breed) => {
        const breedPets = pets.filter(p => p.breed_id === breed.id);
        setBreedDetailDialog({ open: true, breed, pets: breedPets });
    }, [pets]);

    return (
        <Box>
            {/* Statistics */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: 2,
                    mb: 4,
                    width: '100%',
                    overflow: 'visible'
                }}
            >
                {[
                    { label: 'Tổng giống', value: stats.total, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
                    { label: 'Đang hoạt động', value: stats.active, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Tổng giống chó', value: stats.dogs, color: dogSpeciesColors.bg, valueColor: dogSpeciesColors.text },
                    { label: 'Tổng giống mèo', value: stats.cats, color: catSpeciesColors.bg, valueColor: catSpeciesColors.text }
                ].map((stat, index, arr) => {
                    const cardWidth = `calc((100% - ${(arr.length - 1) * 16}px) / ${arr.length})`;
                    return (
                        <Box
                            key={index}
                            sx={{
                                flex: `0 0 ${cardWidth}`,
                                width: cardWidth,
                                maxWidth: cardWidth,
                                minWidth: 0
                            }}
                        >
                            <Paper sx={{
                                p: 2.5,
                                borderTop: `4px solid ${stat.color}`,
                                borderRadius: 2,
                                height: '100%',
                                boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                            }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {stat.label}
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={stat.valueColor}>
                                    {stat.value}
                                </Typography>
                            </Paper>
                        </Box>
                    );
                })}
            </Box>

            {/* Toolbar */}
            <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'nowrap', mb: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên giống..."
                    value={searchBreed}
                    onChange={(e) => setSearchBreed(e.target.value)}
                    sx={{ flex: 1, minWidth: 0 }}
                />
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={breedFilterSpecies} onChange={(e) => setBreedFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenBreedDialog()}
                    sx={{
                        backgroundColor: COLORS.ERROR[500],
                        '&:hover': { backgroundColor: COLORS.ERROR[600] },
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
                >
                    Thêm giống
                </Button>
            </Toolbar>

            {/* Breeds Table */}
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.INFO[200], 0.15)}`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Category sx={{ color: COLORS.INFO[700], fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                        Danh sách giống
                    </Typography>
                    <Chip
                        label={filteredBreeds.length}
                        size="small"
                        sx={{
                            bgcolor: alpha(COLORS.INFO[600], 0.2),
                            color: COLORS.INFO[700],
                            fontWeight: 600
                        }}
                    />
                </Stack>
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                        boxShadow: `0 10px 24px ${alpha(COLORS.INFO[200], 0.15)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Tên giống</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Cân nặng TB</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Tuổi thọ TB</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageBreeds.map((breed) => (
                                <TableRow
                                    key={breed.id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            background: alpha(COLORS.INFO[50], 0.3)
                                        }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600 }}>{breed.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={getSpeciesName(breed.species_id)}
                                            sx={{
                                                bgcolor: alpha(getSpeciesChipColors(breed.species_id).bg, 0.9),
                                                color: getSpeciesChipColors(breed.species_id).text,
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 300 }}>
                                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {breed.description || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {breed.average_weight} kg
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {breed.average_lifespan} năm
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setMenuAnchor(e.currentTarget);
                                                setMenuBreed(breed);
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Pagination */}
            {filteredBreeds.length > 0 && (
                <Pagination
                    page={breedPage}
                    totalPages={breedTotalPages}
                    onPageChange={setBreedPage}
                    itemsPerPage={breedItemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        setBreedItemsPerPage(newValue);
                        setBreedPage(1);
                    }}
                    totalItems={filteredBreeds.length}
                />
            )}

            {/* Add/Edit Modal */}
            <AddPetBreedModal
                isOpen={breedDialogOpen}
                onClose={() => setBreedDialogOpen(false)}
                onSubmit={handleSubmitBreed}
                editMode={editMode}
                initialData={selectedBreed}
                isLoading={isSubmitting}
                species={species}
            />

            {/* Detail Dialog */}
            <Dialog
                open={breedDetailDialog.open}
                onClose={() => setBreedDetailDialog({ open: false, breed: null, pets: [] })}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.INFO[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: COLORS.INFO[600],
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        py: 2.5
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Category sx={{ fontSize: 32 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                            Chi tiết giống
                        </Typography>
                        <IconButton
                            onClick={() => setBreedDetailDialog({ open: false, breed: null, pets: [] })}
                            sx={{
                                color: '#fff',
                                '&:hover': {
                                    background: alpha('#fff', 0.2)
                                }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    {breedDetailDialog.breed && (
                        <Stack spacing={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.INFO[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[700], mb: 2 }}>
                                    📦 Thông tin giống
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tên giống:</Typography>
                                        <Typography sx={{ fontWeight: 700, flex: 1 }}>{breedDetailDialog.breed.name}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Loài:</Typography>
                                        <Typography sx={{ flex: 1 }}>{getSpeciesName(breedDetailDialog.breed.species_id)}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Cân nặng trung bình:</Typography>
                                        <Typography sx={{ flex: 1 }}>{breedDetailDialog.breed.average_weight} kg</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tuổi thọ trung bình:</Typography>
                                        <Typography sx={{ flex: 1 }}>{breedDetailDialog.breed.average_lifespan} năm</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Mô tả:</Typography>
                                        <Typography sx={{ flex: 1 }}>{breedDetailDialog.breed.description || '—'}</Typography>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.ERROR[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <PetsIcon sx={{ color: COLORS.ERROR[700], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                        Danh sách thú cưng
                                    </Typography>
                                    <Chip
                                        label={breedDetailDialog.pets.length}
                                        size="small"
                                        sx={{
                                            background: alpha(COLORS.ERROR[100], 0.7),
                                            color: COLORS.ERROR[800],
                                            fontWeight: 700
                                        }}
                                    />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                {breedDetailDialog.pets.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {breedDetailDialog.pets.map((pet) => (
                                            <Paper
                                                key={pet.id}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    background: '#fff',
                                                    border: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                                    borderRadius: 2
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        src={pet.image || pet.image_url}
                                                        alt={pet.name}
                                                        sx={{ width: 40, height: 40 }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 700 }}>{pet.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {pet.age} tuổi • {pet.weight} kg • {pet.gender === 'Male' ? 'Đực' : 'Cái'}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={getPetHealthStatus(pet).label}
                                                        size="small"
                                                        sx={{
                                                            background: alpha(getPetHealthStatus(pet).bg, 0.7),
                                                            color: getPetHealthStatus(pet).color[800],
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 2 }}>
                                        Chưa có thú cưng thuộc giống này
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                    <Button
                        onClick={() => setBreedDetailDialog({ open: false, breed: null, pets: [] })}
                        variant="contained"
                        sx={{
                            bgcolor: COLORS.INFO[600],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: COLORS.INFO[700]
                            }
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={confirmDelete}
                title="Xóa giống"
                message="Bạn có chắc chắn muốn xóa giống này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Breed Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuBreed(null);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (menuBreed) {
                            handleViewBreedDetails(menuBreed);
                        }
                        setMenuAnchor(null);
                        setMenuBreed(null);
                    }}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuBreed) {
                            handleOpenBreedDialog(menuBreed);
                        }
                        setMenuAnchor(null);
                        setMenuBreed(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuBreed) {
                            handleDelete(menuBreed.id);
                        }
                        setMenuAnchor(null);
                        setMenuBreed(null);
                    }}
                >
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default BreedsTab;
