import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
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

    // Smooth concurrent transitions for filters / search / pagination
    const [isPending, startTransition] = useTransition();

    // Local pets data & pagination for server-side pagination (independent from PetsPage)
    const [petsPageData, setPetsPageData] = useState([]);
    const [petsPagination, setPetsPagination] = useState({
        total_items_count: 0,
        page_size: petItemsPerPage,
        total_pages_count: 0,
        page_index: 0
    });
    const [isLoadingPets, setIsLoadingPets] = useState(false);

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

    // Smooth search input so typing không bị khựng
    const deferredSearchPet = useDeferredValue(searchPet);

    // Helper function to capitalize first letter
    const capitalizeName = useCallback((name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    }, []);

    // Precompute species name + color map to stay in sync with BreedsTab / GroupsTab
    const speciesNameMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();
        return new Map(species.map(s => [s.id, capitalizeName(s.name)]));
    }, [species, capitalizeName]);

    const speciesColorMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();

        const colorPairs = [
            { bg: COLORS.WARNING[100], text: COLORS.WARNING[800] }, // Chó
            { bg: COLORS.INFO[100], text: COLORS.INFO[800] },       // Mèo
            { bg: COLORS.SUCCESS[100], text: COLORS.SUCCESS[800] },
            { bg: COLORS.ERROR[100], text: COLORS.ERROR[800] }
        ];

        const map = new Map();
        species.forEach((s, index) => {
            map.set(s.id, colorPairs[index % colorPairs.length]);
        });

        return map;
    }, [species]);

    // Get species name by ID
    const getSpeciesName = useCallback((speciesId) => {
        if (!speciesId) return '—';
        return speciesNameMap.get(speciesId) || '—';
    }, [speciesNameMap]);

    const getSpeciesChipColors = useCallback((speciesId) => {
        if (!speciesId) {
            return { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
        }
        return speciesColorMap.get(speciesId) || { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
    }, [speciesColorMap]);

    // Precompute breed name map for O(1) lookup
    const breedNameMap = useMemo(() => {
        if (!Array.isArray(breeds)) return new Map();
        return new Map(breeds.map(b => [b.id, b.name]));
    }, [breeds]);

    // Get breed name by ID
    const getBreedName = useCallback((breedId) => {
        if (!breedId) return '—';
        return breedNameMap.get(breedId) || '—';
    }, [breedNameMap]);

    // Get pet health status from API health_status field
    const getPetHealthStatus = (pet) => {
        const healthStatus = pet.health_status || 'HEALTHY';

        const statusMap = {
            // Khỏe mạnh – xanh lá
            'HEALTHY': {
                label: 'Khỏe mạnh',
                color: COLORS.SUCCESS,
                bg: COLORS.SUCCESS[100]
            },
            // Ốm – đỏ
            'SICK': {
                label: 'Ốm',
                color: COLORS.ERROR,
                bg: COLORS.ERROR[100]
            },
            // Đang hồi phục – cam (WARNING)
            'RECOVERING': {
                label: 'Đang hồi phục',
                color: COLORS.WARNING,
                bg: COLORS.WARNING[100]
            },
            // Đang theo dõi – xanh dương (INFO)
            'UNDER_OBSERVATION': {
                label: 'Đang theo dõi',
                color: COLORS.INFO,
                bg: COLORS.INFO[100]
            },
            // Cách ly – secondary (cam đậm hơn)
            'QUARANTINE': {
                label: 'Cách ly',
                color: COLORS.SECONDARY,
                bg: COLORS.SECONDARY[100]
            }
        };

        return statusMap[healthStatus] || statusMap['HEALTHY'];
    };

    // Load pets page from API using page & limit (server-side pagination)
    const loadPetsPage = useCallback(async () => {
        try {
            setIsLoadingPets(true);

            // Áp dụng filter Loài & Giống xuống BE, các filter khác xử lý client-side
            const speciesFilter = filterSpecies !== 'all' ? filterSpecies : null;
            const breedFilter = filterBreed !== 'all' ? filterBreed : null;

            const response = await petsApi.getAllPets({
                page: petPage - 1,
                limit: petItemsPerPage,
                species_id: speciesFilter,
                breed_id: breedFilter
            });

            const data = response?.data || [];
            const pagination = response?.pagination || {};

            setPetsPageData(Array.isArray(data) ? data : []);
            setPetsPagination({
                total_items_count: pagination.total_items_count ?? data.length,
                page_size: pagination.page_size ?? petItemsPerPage,
                total_pages_count: pagination.total_pages_count ?? 1,
                page_index: pagination.page_index ?? (petPage - 1)
            });
        } catch (error) {
            console.error('Error loading pets page:', error);
            setPetsPageData([]);
        } finally {
            setIsLoadingPets(false);
        }
    }, [filterBreed, filterSpecies, petItemsPerPage, petPage]);

    // Trigger load khi đổi page / pageSize / filter Loài, Giống
    useEffect(() => {
        loadPetsPage();
    }, [loadPetsPage]);

    // Reset về trang 1 khi đổi filter/phím search để tránh trang rỗng
    useEffect(() => {
        setPetPage(1);
    }, [filterSpecies, filterBreed, filterGender, filterHealthStatus, searchPet]);

    // Statistics (dựa trên toàn bộ pets từ PetsPage để giữ đúng tổng)
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

    // Filtered pets (áp dụng search, giới tính, health client-side trên data page hiện tại)
    const filteredPets = useMemo(() => {
        const searchLower = deferredSearchPet.trim().toLowerCase();

        return petsPageData.filter(pet => {
            const matchSearch =
                searchLower
                    ? pet.name?.toLowerCase().includes(searchLower) ||
                    pet.color?.toLowerCase().includes(searchLower)
                    : true;
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
    }, [petsPageData, deferredSearchPet, filterSpecies, filterBreed, filterGender, filterHealthStatus]);

    // Pagination
    const petTotalPages = petsPagination.total_pages_count || 1;
    const currentPagePets = useMemo(() => {
        // Server-side pagination: filteredPets đã là dữ liệu của page hiện tại
        return filteredPets;
    }, [filteredPets]);

    // Handle pet add/edit
    const handleOpenPetDialog = useCallback((pet = null) => {
        if (pet) {
            setEditMode(true);
            setSelectedPet(pet);
        } else {
            setEditMode(false);
            setSelectedPet(null);
        }
        setPetDialogOpen(true);
    }, []);

    const handleSubmitPet = useCallback(async (petFormData) => {
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
    }, [editMode, onDataChange, selectedPet]);

    // Handle delete
    const handleDelete = useCallback((id) => {
        setDeleteTarget(id);
        setConfirmDeleteOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
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
    }, [deleteTarget, onDataChange]);

    // Handle view pet details
    const handleViewPetDetails = useCallback(async (pet) => {
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
    }, []);

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
                    // Đồng bộ với chip trạng thái: HEALTHY -> SUCCESS
                    { label: 'Khỏe mạnh', value: stats.healthy, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    // SICK -> ERROR
                    { label: 'Ốm', value: stats.sick, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
                    // RECOVERING -> WARNING
                    { label: 'Đang hồi phục', value: stats.recovering, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    // UNDER_OBSERVATION -> INFO
                    { label: 'Đang theo dõi', value: stats.underObservation, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
                    // QUARANTINE -> SECONDARY
                    { label: 'Cách ly', value: stats.quarantine, color: COLORS.SECONDARY[500], valueColor: COLORS.SECONDARY[700] }
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
                    onChange={(e) => {
                        const value = e.target.value;
                        startTransition(() => {
                            setSearchPet(value);
                        });
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                />
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select
                        label="Loài"
                        value={filterSpecies}
                        onChange={(e) => {
                            const value = e.target.value;
                            startTransition(() => {
                                setFilterSpecies(value);
                            });
                        }}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Giống</InputLabel>
                    <Select
                        label="Giống"
                        value={filterBreed}
                        onChange={(e) => {
                            const value = e.target.value;
                            startTransition(() => {
                                setFilterBreed(value);
                            });
                        }}
                    >
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
                    <Select
                        label="Giới tính"
                        value={filterGender}
                        onChange={(e) => {
                            const value = e.target.value;
                            startTransition(() => {
                                setFilterGender(value);
                            });
                        }}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="Male">Đực</MenuItem>
                        <MenuItem value="Female">Cái</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                        label="Trạng thái"
                        value={filterHealthStatus}
                        onChange={(e) => {
                            const value = e.target.value;
                            startTransition(() => {
                                setFilterHealthStatus(value);
                            });
                        }}
                    >
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
                    boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`,
                    opacity: isPending ? 0.6 : 1,
                    transition: 'opacity 0.2s ease-out'
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
                            {isLoadingPets ? null : currentPagePets.map((pet) => (
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
                                                bgcolor: alpha(getSpeciesChipColors(pet.species_id).bg, 0.9),
                                                color: getSpeciesChipColors(pet.species_id).text,
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
            {petsPagination.total_items_count > 0 && (
                <Pagination
                    page={petPage}
                    totalPages={petTotalPages}
                    onPageChange={(newPage) => {
                        startTransition(() => {
                            setPetPage(newPage);
                        });
                    }}
                    itemsPerPage={petItemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        startTransition(() => {
                            setPetItemsPerPage(newValue);
                            setPetPage(1);
                        });
                    }}
                    totalItems={petsPagination.total_items_count}
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