import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Stack, TextField, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Chip, alpha, InputAdornment, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Search, Vaccines, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import VaccineTypeModal from '../../components/modals/VaccineTypeModal';
import Pagination from '../../components/common/Pagination';
import vaccineTypesApi from '../../api/vaccineTypesApi';

const VaccineTypesTab = ({ species: speciesProp = [], onVaccineTypeChange }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [vaccineTypes, setVaccineTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSpecies, setFilterSpecies] = useState('');

    // Ensure species is always an array
    const species = useMemo(() => {
        return Array.isArray(speciesProp) ? speciesProp : [];
    }, [speciesProp]);

    // Pagination - Server-side
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentVaccineType, setCurrentVaccineType] = useState(null);

    // Alert
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vaccineToDelete, setVaccineToDelete] = useState(null);

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuVaccineType, setMenuVaccineType] = useState(null);

    useEffect(() => {
        loadVaccineTypes();
    }, [page, itemsPerPage, filterSpecies]);

    const loadVaccineTypes = async () => {
        try {
            setIsLoading(true);
            const response = await vaccineTypesApi.getAllVaccineTypes({
                page_index: page - 1, // API uses 0-based indexing
                page_size: itemsPerPage,
                species_id: filterSpecies || null
            });

            setVaccineTypes(response.data || []);
            if (response.pagination) {
                setTotalPages(response.pagination.total_pages_count);
            }
        } catch (error) {
            console.error('Error loading vaccine types:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu vaccine types',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side search only (server handles species filtering & pagination)
    const filteredVaccineTypes = useMemo(() => {
        if (!searchQuery) {
            return vaccineTypes;
        }
        const searchLower = searchQuery.toLowerCase();
        return vaccineTypes.filter(vt => {
            return vt.name.toLowerCase().includes(searchLower) ||
                vt.description?.toLowerCase().includes(searchLower);
        });
    }, [vaccineTypes, searchQuery]);

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Precompute species name & color maps to keep colors consistent với các tab khác
    const speciesNameMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();
        return new Map(species.map(s => [s.id, capitalizeName(s.name)]));
    }, [species]);

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

    const getSpeciesChipColors = (speciesId) => {
        if (!speciesId) {
            return { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
        }
        return speciesColorMap.get(speciesId) || { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
    };

    const getSpeciesIdFromVaccineType = (vt) => {
        if (vt.species && typeof vt.species === 'object' && vt.species.id) {
            return vt.species.id;
        }
        if (vt.species_id) {
            return vt.species_id;
        }
        return null;
    };

    // Get species name - Use populated species object or fallback to prop
    const getSpeciesName = (vt) => {
        const speciesId = getSpeciesIdFromVaccineType(vt);
        if (speciesId && speciesNameMap.has(speciesId)) {
            return speciesNameMap.get(speciesId);
        }

        if (vt.species) {
            if (typeof vt.species === 'object' && vt.species !== null && vt.species.name) {
                return capitalizeName(String(vt.species.name));
            }
            if (typeof vt.species === 'string') {
                return capitalizeName(vt.species);
            }
        }
        if (vt.species_id) {
            const speciesObj = species.find(s => s.id === vt.species_id);
            if (speciesObj?.name) {
                return capitalizeName(String(speciesObj.name));
            }
        }
        return '—';
    };

    // Handle open dialog
    const handleOpenDialog = (vaccineType = null) => {
        setEditMode(!!vaccineType);
        setCurrentVaccineType(vaccineType);
        setDialogOpen(true);
    };

    // Handle close dialog
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditMode(false);
        setCurrentVaccineType(null);
    };

    // Handle save - Include required_doses
    const handleSave = async (formData) => {
        try {
            setIsLoading(true);

            const vaccineData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                species_id: formData.species_id,
                interval_months: parseInt(formData.interval_months),
                is_required: formData.is_required,
                required_doses: parseInt(formData.required_doses)
            };

            let response;
            if (editMode) {
                response = await vaccineTypesApi.updateVaccineType(currentVaccineType.id, vaccineData);
            } else {
                response = await vaccineTypesApi.createVaccineType(vaccineData);
            }

            if (response.success) {
                await loadVaccineTypes();
                // Notify parent component to reload vaccine types
                if (onVaccineTypeChange) {
                    await onVaccineTypeChange();
                }
                handleCloseDialog();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || (editMode ? 'Cập nhật loại vaccine thành công' : 'Tạo loại vaccine thành công'),
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving vaccine type:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu loại vaccine',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete
    const handleOpenDeleteDialog = (vaccineType) => {
        setVaccineToDelete(vaccineType);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setVaccineToDelete(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setIsLoading(true);
            const response = await vaccineTypesApi.deleteVaccineType(vaccineToDelete.id);

            if (response.success) {
                await loadVaccineTypes();
                // Notify parent component to reload vaccine types
                if (onVaccineTypeChange) {
                    await onVaccineTypeChange();
                }
                handleCloseDeleteDialog();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Xóa vaccine type thành công',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error deleting vaccine type:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa vaccine type',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && vaccineTypes.length === 0) {
        return <Loading message="Đang tải vaccine types..." />;
    }

    return (
        <Box>
            {/* Header & Filters */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.3)}`,
                    boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[200], 0.15)}`
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
                    <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                        <TextField
                            placeholder="Tìm kiếm vaccine..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            sx={{ flex: 1, width: '800px' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: COLORS.TEXT.SECONDARY }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Lọc theo loài</InputLabel>
                            <Select
                                value={filterSpecies}
                                onChange={(e) => setFilterSpecies(e.target.value)}
                                label="Lọc theo loài"
                            >
                                <MenuItem value="">
                                    <em>Tất cả</em>
                                </MenuItem>
                                {Array.isArray(species) && species.filter(s => s.is_active === true).map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {capitalizeName(s.name) || '—'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            bgcolor: COLORS.PRIMARY[500],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: COLORS.PRIMARY[600]
                            }
                        }}
                    >
                        Thêm Vaccine
                    </Button>
                </Stack>
            </Paper>

            {/* Table */}
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.SUCCESS[200], 0.15)}`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Vaccines sx={{ color: COLORS.SUCCESS[700], fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                        Danh sách Vaccine Types
                    </Typography>
                    <Chip
                        label={filteredVaccineTypes.length}
                        size="small"
                        sx={{
                            bgcolor: alpha(COLORS.SUCCESS[600], 0.2),
                            color: COLORS.SUCCESS[700],
                            fontWeight: 600
                        }}
                    />
                </Stack>
                {filteredVaccineTypes.length > 0 ? (
                    <>
                        <TableContainer
                            component={Paper}
                            sx={{
                                borderRadius: 3,
                                border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`,
                                boxShadow: `0 10px 24px ${alpha(COLORS.SUCCESS[200], 0.15)}`,
                                overflowX: 'auto'
                            }}
                        >
                            <Table size="medium" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Tên vaccine</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Loài</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Lịch tiêm kế tiếp</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Số mũi</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Bắt buộc</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredVaccineTypes.map((vt) => (
                                        <TableRow
                                            key={vt.id}
                                            hover
                                            sx={{
                                                '&:hover': {
                                                    background: alpha(COLORS.SUCCESS[50], 0.3)
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                                        {vt.name}
                                                    </Typography>
                                                    {vt.description && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: COLORS.TEXT.SECONDARY,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {vt.description}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getSpeciesName(vt)}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(getSpeciesChipColors(getSpeciesIdFromVaccineType(vt)).bg, 0.9),
                                                        color: getSpeciesChipColors(getSpeciesIdFromVaccineType(vt)).text,
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {vt.interval_months} tháng
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Chip
                                                    label={`${vt.required_doses || 0} mũi`}
                                                    size="small"
                                                    sx={{
                                                        background: alpha(COLORS.PRIMARY[100], 0.6),
                                                        color: COLORS.PRIMARY[800],
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {vt.is_required ? (
                                                    <Chip
                                                        label="Bắt buộc"
                                                        size="small"
                                                        sx={{
                                                            background: alpha(COLORS.ERROR[100], 0.7),
                                                            color: COLORS.ERROR[800],
                                                            fontWeight: 700
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Không bắt buộc"
                                                        size="small"
                                                        sx={{
                                                            background: alpha(COLORS.SUCCESS[100], 0.7),
                                                            color: COLORS.SUCCESS[800],
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        setMenuAnchor(e.currentTarget);
                                                        setMenuVaccineType(vt);
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
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(newValue) => {
                                setItemsPerPage(newValue);
                                setPage(1);
                            }}
                            totalItems={filteredVaccineTypes.length}
                            itemsPerPageOptions={[10, 20, 50]}
                        />
                    </>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Không tìm thấy vaccine type nào
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Vaccine Type Modal */}
            <VaccineTypeModal
                isOpen={dialogOpen}
                onClose={handleCloseDialog}
                onSubmit={handleSave}
                editMode={editMode}
                initialData={currentVaccineType}
                species={species}
                isLoading={isLoading}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Xóa vaccine type"
                message={`Bạn có chắc chắn muốn xóa vaccine type "${vaccineToDelete?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
                isLoading={isLoading}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Vaccine Type Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuVaccineType(null);
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
                        if (menuVaccineType) {
                            handleOpenDialog(menuVaccineType);
                        }
                        setMenuAnchor(null);
                        setMenuVaccineType(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.WARNING[700] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuVaccineType) {
                            handleOpenDeleteDialog(menuVaccineType);
                        }
                        setMenuAnchor(null);
                        setMenuVaccineType(null);
                    }}
                >
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[700] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default VaccineTypesTab;