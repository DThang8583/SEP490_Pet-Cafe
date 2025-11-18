import { useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Pets as PetsIcon, Visibility, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddPetModal from '../../../components/modals/AddPetModal';
import ViewPetDetailsModal from '../../../components/modals/ViewPetDetailsModal';
import petsApi from '../../../api/petsApi';

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

    const [petDetailDialog, setPetDetailDialog] = useState({ open: false, pet: null, vaccinations: [], healthRecords: [] });
    const [detailLoading, setDetailLoading] = useState(false);

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Get species name by ID
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? capitalizeName(sp.name) : '—';
    };

    // Get breed name by ID
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '—';
    };

    // Get pet health status from API health_status field
    const getPetHealthStatus = (pet) => {
        const healthStatus = pet.health_status || 'HEALTHY';

        const statusMap = {
            'HEALTHY': { label: 'Khỏe mạnh', color: COLORS.SUCCESS, bg: COLORS.SUCCESS[100] },
            'SICK': { label: 'Ốm', color: COLORS.ERROR, bg: COLORS.ERROR[100] },
            'RECOVERING': { label: 'Đang hồi phục', color: COLORS.WARNING, bg: COLORS.WARNING[100] },
            'UNDER_OBSERVATION': { label: 'Đang theo dõi', color: COLORS.WARNING, bg: COLORS.WARNING[100] },
            'QUARANTINE': { label: 'Cách ly', color: COLORS.ERROR, bg: COLORS.ERROR[100] }
        };

        return statusMap[healthStatus] || statusMap['HEALTHY'];
    };

    // Statistics
    const stats = useMemo(() => {
        const stats = {
            total: pets.length,
            male: 0,
            female: 0,
            healthy: 0,
            sick: 0,
            recovering: 0,
            underObservation: 0,
            quarantine: 0
        };

        pets.forEach(pet => {
            // Count gender
            if (pet.gender === 'Male') {
                stats.male++;
            } else if (pet.gender === 'Female') {
                stats.female++;
            }

            // Count health status based on API health_status field
            const healthStatus = pet.health_status || 'HEALTHY';
            if (healthStatus === 'HEALTHY') {
                stats.healthy++;
            } else if (healthStatus === 'SICK') {
                stats.sick++;
            } else if (healthStatus === 'RECOVERING') {
                stats.recovering++;
            } else if (healthStatus === 'UNDER_OBSERVATION') {
                stats.underObservation++;
            } else if (healthStatus === 'QUARANTINE') {
                stats.quarantine++;
            }
        });

        return stats;
    }, [pets]);

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
                const healthStatus = pet.health_status || 'HEALTHY';
                if (filterHealthStatus === 'healthy') {
                    matchHealthStatus = healthStatus === 'HEALTHY';
                } else if (filterHealthStatus === 'needMonitoring') {
                    matchHealthStatus = healthStatus === 'UNDER_OBSERVATION';
                } else if (filterHealthStatus === 'needCheckup') {
                    matchHealthStatus = healthStatus === 'SICK' || healthStatus === 'QUARANTINE';
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
                // Edit: include group_id and health_status
                const editData = {
                    ...baseData,
                    group_id: petFormData.group_id || null,
                    health_status: petFormData.health_status || selectedPet.health_status || 'HEALTHY'
                };
                response = await petsApi.updatePet(selectedPet.id, editData);
            } else {
                // Create: NO group_id, include health_status
                const createData = {
                    ...baseData,
                    health_status: petFormData.health_status || 'HEALTHY'
                };
                response = await petsApi.createPet(createData);
            }

            if (response.success) {
                await onDataChange();
                setPetDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || (editMode ? 'Cập nhật thú cưng thành công!' : 'Thêm thú cưng mới thành công!'),
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
            const response = await petsApi.deletePet(deleteTarget);
            if (response.success) {
                await onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Xóa thú cưng thành công!',
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
            setPetDetailDialog({ open: true, pet, vaccinations: [], healthRecords: [] });

            // Load both vaccination records and health records in parallel
            const [vaccinationRes, healthRecordsRes] = await Promise.all([
                petsApi.getPetVaccinationRecords(pet.id),
                petsApi.getPetHealthRecords(pet.id)
            ]);

            setPetDetailDialog(prev => ({
                ...prev,
                vaccinations: (vaccinationRes?.data && Array.isArray(vaccinationRes.data)) ? vaccinationRes.data : [],
                healthRecords: (healthRecordsRes?.data && Array.isArray(healthRecordsRes.data)) ? healthRecordsRes.data : []
            }));
        } catch (error) {
            console.error('Error loading pet details:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải thông tin chi tiết',
                type: 'error'
            });
            setPetDetailDialog(prev => ({ ...prev, vaccinations: [], healthRecords: [] }));
        } finally {
            setDetailLoading(false);
        }
    };

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
                    { label: 'Tổng thú cưng', value: stats.total, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
                    { label: 'Đực', value: stats.male, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Cái', value: stats.female, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
                    { label: 'Khỏe mạnh', value: stats.healthy, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Ốm', value: stats.sick, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
                    { label: 'Đang hồi phục', value: stats.recovering, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Đang theo dõi', value: stats.underObservation, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Cách ly', value: stats.quarantine, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${7 * 16}px) / 8)`;
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
                    placeholder="Tìm theo tên, màu sắc..."
                    value={searchPet}
                    onChange={(e) => setSearchPet(e.target.value)}
                    sx={{ flex: 1, minWidth: 0 }}
                />
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
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
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Giới tính</InputLabel>
                    <Select label="Giới tính" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="Male">Đực</MenuItem>
                        <MenuItem value="Female">Cái</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select label="Trạng thái" value={filterHealthStatus} onChange={(e) => setFilterHealthStatus(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="healthy">Khỏe mạnh</MenuItem>
                        <MenuItem value="needMonitoring">Cần theo dõi</MenuItem>
                        <MenuItem value="needCheckup">Cần kiểm tra</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenPetDialog()}
                    sx={{
                        backgroundColor: COLORS.ERROR[500],
                        '&:hover': { backgroundColor: COLORS.ERROR[600] },
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
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
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                        boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Thú cưng</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Giống</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Tuổi</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Cân nặng</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Giới tính</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', xl: 'table-cell' } }}>Màu sắc</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
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
            <ViewPetDetailsModal
                isOpen={petDetailDialog.open}
                onClose={() => setPetDetailDialog({ open: false, pet: null, vaccinations: [], healthRecords: [] })}
                pet={petDetailDialog.pet}
                vaccinations={petDetailDialog.vaccinations}
                healthRecords={petDetailDialog.healthRecords}
                species={species}
                breeds={breeds}
                groups={groups}
                isLoading={detailLoading}
            />

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