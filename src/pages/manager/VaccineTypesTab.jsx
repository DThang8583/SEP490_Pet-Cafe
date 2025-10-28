import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Stack, TextField, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, alpha, Tooltip, InputAdornment, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import { Add, Edit, Delete, Search, Vaccines, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import VaccineTypeModal from '../../components/modals/VaccineTypeModal';
import Pagination from '../../components/common/Pagination';
import { vaccinationApi } from '../../api/vaccinationApi';

const VaccineTypesTab = ({ species = [] }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [vaccineTypes, setVaccineTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSpecies, setFilterSpecies] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
    }, []);

    const loadVaccineTypes = async () => {
        try {
            setIsLoading(true);
            const response = await vaccinationApi.getVaccineTypes();
            if (response.success) {
                setVaccineTypes(response.data);
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

    // Filter and search
    const filteredVaccineTypes = useMemo(() => {
        return vaccineTypes.filter(vt => {
            const matchSearch = searchQuery === '' ||
                vt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vt.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchSpecies = filterSpecies === '' || vt.species_id === filterSpecies;

            return matchSearch && matchSpecies;
        });
    }, [vaccineTypes, searchQuery, filterSpecies]);

    // Pagination
    const paginatedVaccineTypes = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVaccineTypes.slice(startIndex, endIndex);
    }, [filteredVaccineTypes, page, itemsPerPage]);

    const totalPages = Math.ceil(filteredVaccineTypes.length / itemsPerPage);

    // Get species name
    const getSpeciesName = (speciesId) => {
        const speciesObj = species.find(s => s.id === speciesId);
        return speciesObj ? speciesObj.name : '—';
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

    // Handle save
    const handleSave = async (formData) => {
        try {
            setIsLoading(true);

            const vaccineData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                species_id: formData.species_id,
                interval_months: parseInt(formData.interval_months),
                required_doses: parseInt(formData.required_doses) || 0,
                is_required: formData.is_required
            };

            let response;
            if (editMode) {
                response = await vaccinationApi.updateVaccineType(currentVaccineType.id, vaccineData);
            } else {
                response = await vaccinationApi.createVaccineType(vaccineData);
            }

            if (response.success) {
                await loadVaccineTypes();
                handleCloseDialog();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editMode ? 'Cập nhật vaccine type thành công' : 'Tạo vaccine type thành công',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving vaccine type:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu vaccine type',
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
            const response = await vaccinationApi.deleteVaccineType(vaccineToDelete.id);

            if (response.success) {
                await loadVaccineTypes();
                handleCloseDeleteDialog();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa vaccine type thành công',
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
                            sx={{ flex: 1, maxWidth: { md: 400 } }}
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
                                {species.map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name}
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
                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[700]} 100%)`,
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.PRIMARY[600]} 0%, ${COLORS.PRIMARY[800]} 100%)`
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
                {paginatedVaccineTypes.length > 0 ? (
                    <>
                        <TableContainer
                            sx={{
                                borderRadius: 2,
                                border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                overflowX: 'auto'
                            }}
                        >
                            <Table size="medium" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Tên vaccine</TableCell>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Loài</TableCell>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Chu kỳ tiêm lại</TableCell>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Số mũi</TableCell>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Bắt buộc</TableCell>
                                        <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedVaccineTypes.map((vt) => (
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
                                                    label={getSpeciesName(vt.species_id)}
                                                    size="small"
                                                    sx={{
                                                        background: alpha(COLORS.INFO[100], 0.5),
                                                        color: COLORS.INFO[800],
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {vt.interval_months} tháng
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {vt.required_doses || 0}
                                                </Typography>
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                maxWidth="sm"
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
                        fontWeight: 800
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Delete sx={{ fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Xác nhận xóa
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    <Typography variant="body1">
                        Bạn có chắc chắn muốn xóa vaccine type <strong>{vaccineToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 1 }}>
                        Hành động này không thể hoàn tác.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleCloseDeleteDialog} sx={{ fontWeight: 600 }}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100%)`,
                            color: '#fff',
                            fontWeight: 700,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.ERROR[800]} 100%)`
                            }
                        }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

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

