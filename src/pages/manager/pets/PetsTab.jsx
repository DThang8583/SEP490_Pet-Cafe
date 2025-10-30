import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Pets as PetsIcon, Visibility, Close, Vaccines, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddPetModal from '../../../components/modals/AddPetModal';
import { petApi } from '../../../api/petApi';
import { vaccinationApi } from '../../../api/vaccinationApi';

const PetsTab = ({ pets, species, breeds, groups, onDataChange }) => {
    const [searchPet, setSearchPet] = useState('');
    const [filterSpecies, setFilterSpecies] = useState('all');
    const [filterBreed, setFilterBreed] = useState('all');
    const [filterGender, setFilterGender] = useState('all');
    const [filterHealthStatus, setFilterHealthStatus] = useState('all');
    const [petPage, setPetPage] = useState(1);
    const [petItemsPerPage, setPetItemsPerPage] = useState(10);

    const [petDialogOpen, setPetDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuPet, setMenuPet] = useState(null);

    const [petDetailDialog, setPetDetailDialog] = useState({ open: false, pet: null, vaccinations: [] });
    const [detailLoading, setDetailLoading] = useState(false);

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

    // Filtered pets
    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            const matchSearch = pet.name?.toLowerCase().includes(searchPet.toLowerCase()) ||
                pet.color?.toLowerCase().includes(searchPet.toLowerCase());
            const matchSpecies = filterSpecies === 'all' || pet.species_id === filterSpecies;
            const matchBreed = filterBreed === 'all' || pet.breed_id === filterBreed;
            const matchGender = filterGender === 'all' || pet.gender === filterGender;

            let matchHealthStatus = true;
            if (filterHealthStatus !== 'all') {
                const healthStatus = getPetHealthStatus(pet);
                if (filterHealthStatus === 'healthy') {
                    matchHealthStatus = healthStatus.label === 'Khỏe mạnh';
                } else if (filterHealthStatus === 'needMonitoring') {
                    matchHealthStatus = healthStatus.label === 'Cần theo dõi';
                } else if (filterHealthStatus === 'needCheckup') {
                    matchHealthStatus = healthStatus.label === 'Cần kiểm tra';
                }
            }

            return matchSearch && matchSpecies && matchBreed && matchGender && matchHealthStatus;
        });
    }, [pets, searchPet, filterSpecies, filterBreed, filterGender, filterHealthStatus]);

    // Pagination
    const petTotalPages = Math.ceil(filteredPets.length / petItemsPerPage);
    const currentPagePets = useMemo(() => {
        const startIndex = (petPage - 1) * petItemsPerPage;
        return filteredPets.slice(startIndex, startIndex + petItemsPerPage);
    }, [petPage, petItemsPerPage, filteredPets]);

    // Handle pet add/edit
    const handleOpenPetDialog = (pet = null) => {
        if (pet) {
            setEditMode(true);
            setSelectedPet(pet);
        } else {
            setEditMode(false);
            setSelectedPet(null);
        }
        setPetDialogOpen(true);
    };

    const handleSubmitPet = async (petFormData) => {
        try {
            setIsSubmitting(true);

            // Base data for both create and edit
            const baseData = {
                name: (petFormData.name || '').trim(),
                age: parseInt(petFormData.age || 0),
                species_id: petFormData.species_id,
                breed_id: petFormData.breed_id,
                color: (petFormData.color || '').trim(),
                weight: parseFloat(petFormData.weight || 0),
                preferences: (petFormData.preferences || '').trim(),
                special_notes: (petFormData.special_notes || '').trim(),
                image_url: (petFormData.image || petFormData.image_url || '').trim(),
                arrival_date: new Date(petFormData.arrival_date).toISOString(),
                gender: petFormData.gender
            };

            let response;
            if (editMode && selectedPet) {
                // Edit: include group_id
                const editData = {
                    ...baseData,
                    group_id: petFormData.group_id || null
                };
                response = await petApi.updatePet(selectedPet.id, editData);
            } else {
                // Create: NO group_id (match API)
                response = await petApi.addPet(baseData);
            }

            if (response.success) {
                await onDataChange();
                setPetDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editMode ? 'Cập nhật thú cưng thành công!' : 'Thêm thú cưng mới thành công!',
                    type: 'success'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin thú cưng',
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
            const response = await petApi.deletePet(deleteTarget);
            if (response.success) {
                await onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa thú cưng thành công!',
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

    // Handle view pet details
    const handleViewPetDetails = async (pet) => {
        try {
            setDetailLoading(true);
            setPetDetailDialog({ open: true, pet, vaccinations: [] });

            const vaccinationRes = await vaccinationApi.getVaccinationRecords(pet.id);
            if (vaccinationRes.success) {
                setPetDetailDialog(prev => ({ ...prev, vaccinations: vaccinationRes.data }));
            }
        } catch (error) {
            console.error('Error loading pet details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên, màu sắc..."
                    value={searchPet}
                    onChange={(e) => setSearchPet(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 280 } }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Giống</InputLabel>
                    <Select label="Giống" value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {breeds
                            .filter(b => filterSpecies === 'all' || b.species_id === filterSpecies)
                            .map(b => (
                                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                            ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Giới tính</InputLabel>
                    <Select label="Giới tính" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="Male">Đực</MenuItem>
                        <MenuItem value="Female">Cái</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select label="Trạng thái" value={filterHealthStatus} onChange={(e) => setFilterHealthStatus(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="healthy">Khỏe mạnh</MenuItem>
                        <MenuItem value="needMonitoring">Cần theo dõi</MenuItem>
                        <MenuItem value="needCheckup">Cần kiểm tra</MenuItem>
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenPetDialog()}
                    sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                >
                    Thêm thú cưng
                </Button>
            </Toolbar>

            {/* Pets Table */}
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <PetsIcon sx={{ color: COLORS.ERROR[700], fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                        Danh sách thú cưng
                    </Typography>
                    <Chip
                        label={filteredPets.length}
                        size="small"
                        sx={{
                            background: alpha(COLORS.ERROR[100], 0.7),
                            color: COLORS.ERROR[800],
                            fontWeight: 700
                        }}
                    />
                </Stack>
                <TableContainer
                    sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5) }}>Thú cưng</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5) }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5) }}>Giống</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), display: { xs: 'none', sm: 'table-cell' } }}>Tuổi</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Cân nặng</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Giới tính</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), display: { xs: 'none', xl: 'table-cell' } }}>Màu sắc</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.ERROR[50], 0.5), textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPagePets.map((pet) => (
                                <TableRow
                                    key={pet.id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            background: alpha(COLORS.ERROR[50], 0.3)
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Avatar
                                                src={pet.image || pet.image_url}
                                                alt={pet.name}
                                                sx={{ width: 40, height: 40 }}
                                            />
                                            <Typography sx={{ fontWeight: 600 }}>{pet.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={getSpeciesName(pet.species_id)}
                                            sx={{
                                                background: alpha(COLORS.ERROR[100], 0.7),
                                                color: COLORS.ERROR[700],
                                                fontWeight: 700
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{getBreedName(pet.breed_id)}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{pet.age} tuổi</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{pet.weight} kg</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {pet.gender === 'Male' ? 'Đực' : 'Cái'}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>{pet.color}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {(() => {
                                            const status = getPetHealthStatus(pet);
                                            return (
                                                <Chip
                                                    size="small"
                                                    label={status.label}
                                                    sx={{
                                                        bgcolor: alpha(status.color[600], 0.2),
                                                        color: status.color[700],
                                                        fontWeight: 600
                                                    }}
                                                />
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setMenuAnchor(e.currentTarget);
                                                setMenuPet(pet);
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
            {filteredPets.length > 0 && (
                <Pagination
                    page={petPage}
                    totalPages={petTotalPages}
                    onPageChange={setPetPage}
                    itemsPerPage={petItemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        setPetItemsPerPage(newValue);
                        setPetPage(1);
                    }}
                    totalItems={filteredPets.length}
                />
            )}

            {/* Add/Edit Modal */}
            <AddPetModal
                isOpen={petDialogOpen}
                onClose={() => setPetDialogOpen(false)}
                onSubmit={handleSubmitPet}
                editMode={editMode}
                initialData={selectedPet}
                isLoading={isSubmitting}
                breeds={breeds}
                species={species}
                groups={groups || []}
            />

            {/* Detail Dialog */}
            <Dialog
                open={petDetailDialog.open}
                onClose={() => setPetDetailDialog({ open: false, pet: null, vaccinations: [] })}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.ERROR[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100%)`,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        py: 2.5
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <PetsIcon sx={{ fontSize: 32 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                            Chi tiết thú cưng
                        </Typography>
                        <IconButton
                            onClick={() => setPetDetailDialog({ open: false, pet: null, vaccinations: [] })}
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
                    {detailLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Loading message="Đang tải thông tin..." />
                        </Box>
                    ) : petDetailDialog.pet && (
                        <Stack spacing={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.ERROR[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700], mb: 2 }}>
                                    🐾 Thông tin cơ bản
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Avatar
                                                src={petDetailDialog.pet.image || petDetailDialog.pet.image_url}
                                                alt={petDetailDialog.pet.name}
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    margin: '0 auto',
                                                    border: `3px solid ${COLORS.ERROR[300]}`,
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.2)}`
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tên:</Typography>
                                                <Typography sx={{ fontWeight: 700, flex: 1 }}>{petDetailDialog.pet.name}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Loài:</Typography>
                                                <Typography sx={{ flex: 1 }}>{getSpeciesName(petDetailDialog.pet.species_id)}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Giống:</Typography>
                                                <Typography sx={{ flex: 1 }}>{getBreedName(petDetailDialog.pet.breed_id)}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tuổi:</Typography>
                                                <Typography sx={{ flex: 1 }}>{petDetailDialog.pet.age} tuổi</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Cân nặng:</Typography>
                                                <Typography sx={{ flex: 1 }}>{petDetailDialog.pet.weight} kg</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Giới tính:</Typography>
                                                <Typography sx={{ flex: 1 }}>
                                                    {petDetailDialog.pet.gender === 'Male' ? '♂️ Đực' : '♀️ Cái'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Màu sắc:</Typography>
                                                <Typography sx={{ flex: 1 }}>{petDetailDialog.pet.color}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Ngày đến quán:</Typography>
                                                <Typography sx={{ flex: 1 }}>
                                                    {petDetailDialog.pet.arrival_date ? new Date(petDetailDialog.pet.arrival_date).toLocaleDateString('vi-VN') : '—'}
                                                </Typography>
                                            </Stack>
                                            {petDetailDialog.pet.group_id && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Nhóm:</Typography>
                                                    <Typography sx={{ flex: 1 }}>
                                                        {groups.find(g => g.id === petDetailDialog.pet.group_id)?.name || '—'}
                                                    </Typography>
                                                </Stack>
                                            )}
                                            {petDetailDialog.pet.preferences && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Sở thích:</Typography>
                                                    <Typography sx={{ flex: 1 }}>{petDetailDialog.pet.preferences}</Typography>
                                                </Stack>
                                            )}
                                            {petDetailDialog.pet.special_notes && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography sx={{ width: '140px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Ghi chú đặc biệt:</Typography>
                                                    <Typography sx={{ flex: 1 }}>{petDetailDialog.pet.special_notes}</Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.SUCCESS[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <Vaccines sx={{ color: COLORS.SUCCESS[700], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                        Hồ sơ tiêm phòng
                                    </Typography>
                                    <Chip
                                        label={petDetailDialog.vaccinations.length}
                                        size="small"
                                        sx={{
                                            background: alpha(COLORS.SUCCESS[100], 0.7),
                                            color: COLORS.SUCCESS[800],
                                            fontWeight: 700
                                        }}
                                    />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                {petDetailDialog.vaccinations.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {petDetailDialog.vaccinations.map((vaccination, index) => (
                                            <Paper
                                                key={index}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    background: '#fff',
                                                    border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                                    borderRadius: 2
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                                            {vaccination.vaccine_type?.name || 'Vaccine'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            Ngày tiêm: {new Date(vaccination.vaccination_date).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 2 }}>
                                        Chưa có hồ sơ tiêm phòng
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                    <Button
                        onClick={() => setPetDetailDialog({ open: false, pet: null, vaccinations: [] })}
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100())`,
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.ERROR[800]} 100())`
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
                title="Xóa thú cưng"
                message="Bạn có chắc chắn muốn xóa thú cưng này? Hành động này không thể hoàn tác."
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

            {/* Pet Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuPet(null);
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
                        if (menuPet) {
                            handleViewPetDetails(menuPet);
                        }
                        setMenuAnchor(null);
                        setMenuPet(null);
                    }}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuPet) {
                            handleOpenPetDialog(menuPet);
                        }
                        setMenuAnchor(null);
                        setMenuPet(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuPet) {
                            handleDelete(menuPet.id);
                        }
                        setMenuAnchor(null);
                        setMenuPet(null);
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

export default PetsTab;

