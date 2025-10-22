import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import { Add, Edit, Delete, Category, Pets as PetsIcon, Visibility, Close } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddPetBreedModal from '../../../components/modals/AddPetBreedModal';
import { petApi } from '../../../api/petApi';

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

    const [breedDetailDialog, setBreedDetailDialog] = useState({ open: false, breed: null, pets: [] });

    // Get species name by ID
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? sp.name : '—';
    };

    // Get breed name by ID
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '—';
    };

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

    // Filtered breeds
    const filteredBreeds = useMemo(() => {
        return breeds.filter(breed => {
            const matchSearch = breed.name?.toLowerCase().includes(searchBreed.toLowerCase());
            const matchSpecies = breedFilterSpecies === 'all' || breed.species_id === breedFilterSpecies;
            return matchSearch && matchSpecies;
        });
    }, [breeds, searchBreed, breedFilterSpecies]);

    // Pagination
    const breedTotalPages = Math.ceil(filteredBreeds.length / breedItemsPerPage);
    const currentPageBreeds = useMemo(() => {
        const startIndex = (breedPage - 1) * breedItemsPerPage;
        return filteredBreeds.slice(startIndex, startIndex + breedItemsPerPage);
    }, [breedPage, breedItemsPerPage, filteredBreeds]);

    // Handle breed add/edit
    const handleOpenBreedDialog = (breed = null) => {
        if (breed) {
            setEditMode(true);
            setSelectedBreed(breed);
        } else {
            setEditMode(false);
            setSelectedBreed(null);
        }
        setBreedDialogOpen(true);
    };

    const handleSubmitBreed = async (breedFormData) => {
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
                response = await petApi.updatePetBreed(selectedBreed.id, breedData);
            } else {
                response = await petApi.createPetBreed(breedData);
            }

            if (response.success) {
                await onDataChange();
                setBreedDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editMode ? 'Cập nhật giống thành công!' : 'Thêm giống mới thành công!',
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
    };

    // Handle delete
    const handleDelete = (id) => {
        setDeleteTarget(id);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await petApi.deletePetBreed(deleteTarget);
            if (response.success) {
                await onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa giống thành công!',
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
    };

    // Handle view breed details
    const handleViewBreedDetails = (breed) => {
        const breedPets = pets.filter(p => p.breed_id === breed.id);
        setBreedDetailDialog({ open: true, breed, pets: breedPets });
    };

    return (
        <Box>
            {/* Toolbar */}
            <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên giống..."
                    value={searchBreed}
                    onChange={(e) => setSearchBreed(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 280 } }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={breedFilterSpecies} onChange={(e) => setBreedFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenBreedDialog()}
                    sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
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
                            background: alpha(COLORS.INFO[100], 0.7),
                            color: COLORS.INFO[800],
                            fontWeight: 700
                        }}
                    />
                </Stack>
                <TableContainer
                    sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5) }}>Tên giống</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5) }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5), display: { xs: 'none', sm: 'table-cell' } }}>Cân nặng TB</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Tuổi thọ TB</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.INFO[50], 0.5), textAlign: 'right' }}>Hành động</TableCell>
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
                                                background: alpha(COLORS.INFO[100], 0.7),
                                                color: COLORS.INFO[800],
                                                fontWeight: 700
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
                                            sx={{ color: COLORS.INFO[600] }}
                                            onClick={() => handleViewBreedDetails(breed)}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenBreedDialog(breed)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(breed.id)}
                                        >
                                            <Delete fontSize="small" />
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
                        background: `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[700]} 100())`,
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
                                                        src={pet.image_url}
                                                        alt={pet.name}
                                                        sx={{ width: 40, height: 40 }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 700 }}>{pet.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {pet.age} tuổi • {pet.weight} kg • {pet.gender === 'male' ? 'Đực' : 'Cái'}
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
                            background: `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[700]} 100())`,
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[800]} 100())`
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
        </Box>
    );
};

export default BreedsTab;

