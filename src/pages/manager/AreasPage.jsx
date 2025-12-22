import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, Menu, MenuItem, ListItemIcon, ListItemText, Avatar, Switch, FormControl, InputLabel, Select } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocationOn as LocationIcon, People as PeopleIcon, MoreVert as MoreVertIcon, Assignment as AssignmentIcon, MeetingRoom as RoomIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AreaDetailModal from '../../components/modals/AreaDetailModal';
import AreaFormModal from '../../components/modals/AreaFormModal';
import * as areasApi from '../../api/areasApi';
import * as workTypeApi from '../../api/workTypeApi';

const AreasPage = () => {
    // Loading & Data
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalCapacity: 0, averageCapacity: 0 });
    const [workTypes, setWorkTypes] = useState([]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
    const [filterWorkTypeId, setFilterWorkTypeId] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, areaId: null });
    const [confirmToggle, setConfirmToggle] = useState({ open: false, area: null });
    const [workTypesModal, setWorkTypesModal] = useState({ open: false, area: null });
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', area: null });

    // Menu
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuArea, setMenuArea] = useState(null);

    // Helper function to calculate stats from areas array
    const calculateStats = (areasArray) => {
        const active = areasArray.filter(a => a.is_active).length;
        const inactive = areasArray.filter(a => !a.is_active).length;
        const totalCapacity = areasArray.reduce((sum, a) => {
            const capacity = Number(a.max_capacity) || 0;
            return sum + capacity;
        }, 0);
        const averageCapacity = areasArray.length > 0
            ? Math.round(totalCapacity / areasArray.length)
            : 0;

        return {
            total: areasArray.length,
            active,
            inactive,
            totalCapacity: totalCapacity || 0,
            averageCapacity: averageCapacity || 0
        };
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const isActiveParam = filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : null;
            const workTypeIdParam = filterWorkTypeId !== 'all' ? filterWorkTypeId : null;

            let areasData = [];
            let statsResponse;
            let workTypesResponse;

            // If filter is "all", fetch both active and inactive areas separately
            // because API might default to active only when IsActive parameter is not provided
            if (filterStatus === 'all') {
                const [activeResponse, inactiveResponse, stats, workTypes] = await Promise.all([
                    areasApi.getAllAreas({
                        page_index: 0,
                        page_size: 1000,
                        is_active: true,
                        work_type_id: workTypeIdParam
                    }),
                    areasApi.getAllAreas({
                        page_index: 0,
                        page_size: 1000,
                        is_active: false,
                        work_type_id: workTypeIdParam
                    }),
                    areasApi.getAreasStatistics(),
                    workTypeApi.getWorkTypes()
                ]);

                // Merge active and inactive areas
                const activeAreas = activeResponse?.data || [];
                const inactiveAreas = inactiveResponse?.data || [];
                areasData = [...activeAreas, ...inactiveAreas];
                statsResponse = stats;
                workTypesResponse = workTypes;
            } else {
                // For "active" or "inactive" filter, use single request
                const [response, stats, workTypes] = await Promise.all([
                    areasApi.getAllAreas({
                        page_index: 0,
                        page_size: 1000,
                        is_active: isActiveParam,
                        work_type_id: workTypeIdParam
                    }),
                    areasApi.getAreasStatistics(),
                    workTypeApi.getWorkTypes()
                ]);

                areasData = response?.data || response || [];
                statsResponse = stats;
                workTypesResponse = workTypes;
            }

            // Set state
            setAreas(Array.isArray(areasData) ? areasData : []);
            setStats(statsResponse || { total: 0, active: 0, inactive: 0, totalCapacity: 0, averageCapacity: 0 });

            // Handle workTypeApi response structure: { success: true, data: [...] }
            const workTypesData = workTypesResponse?.data || workTypesResponse || [];
            setWorkTypes(Array.isArray(workTypesData) ? workTypesData : []);
        } catch (error) {
            console.error('Error loading areas:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không thể tải dữ liệu khu vực',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount and when filters change
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus, filterWorkTypeId]);

    // Filtered areas (client-side search only, status and workType are filtered server-side)
    const filteredAreas = useMemo(() => {
        return areas.filter(area => {
            // Search
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = (area.name || '').toLowerCase().includes(searchLower) ||
                    (area.description || '').toLowerCase().includes(searchLower) ||
                    (area.location || '').toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            return true;
        });
    }, [areas, searchQuery]);

    // Paginated areas
    const paginatedAreas = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredAreas.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAreas, page, itemsPerPage]);

    const totalPages = Math.ceil(filteredAreas.length / itemsPerPage);

    // Handlers
    const handleMenuOpen = (event, area) => {
        setMenuAnchor(event.currentTarget);
        setMenuArea(area);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuArea(null);
    };

    const handleToggleStatusClick = (area, event) => {
        // Prevent the switch from toggling immediately
        event.preventDefault();
        event.stopPropagation();

        setConfirmToggle({ open: true, area });
    };

    const handleConfirmToggleStatus = async () => {
        const area = confirmToggle.area;
        if (!area) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không tìm thấy thông tin khu vực',
                type: 'error'
            });
            setConfirmToggle({ open: false, area: null });
            return;
        }

        try {
            await areasApi.toggleAreaStatus(area.id);

            // Always change filter to "all" when toggling status
            // This ensures the area is still visible after toggle (not filtered out)
            if (filterStatus !== 'all') {
                setFilterStatus('all');
            } else {
                await loadData();
            }

            setAlert({
                open: true,
                title: 'Thành công',
                message: `${area.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'} khu vực thành công!`,
                type: 'success'
            });

            setConfirmToggle({ open: false, area: null });
        } catch (error) {
            console.error('Error toggling status:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể thay đổi trạng thái',
                type: 'error'
            });
        }
    };

    const handleDeleteClick = (area) => {
        setConfirmDelete({ open: true, areaId: area.id });
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        try {
            await areasApi.deleteArea(confirmDelete.areaId);

            // Close confirm modal first
            setConfirmDelete({ open: false, areaId: null });

            // Remove deleted area and recalculate stats
            setAreas(prevAreas => {
                const updatedAreas = prevAreas.filter(a => a.id !== confirmDelete.areaId);
                setStats(calculateStats(updatedAreas));
                return updatedAreas;
            });

            // Show success alert
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa khu vực thành công!',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting area:', error);

            // Close confirm modal first
            setConfirmDelete({ open: false, areaId: null });

            // Show error alert
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa khu vực',
                type: 'error'
            });
        }
    };

    const handleOpenWorkTypesModal = (area) => {
        setWorkTypesModal({ open: true, area });
        handleMenuClose();
    };

    const handleCloseWorkTypesModal = () => {
        setWorkTypesModal({ open: false, area: null });
    };

    const handleOpenCreateModal = () => {
        setFormModal({ open: true, mode: 'create', area: null });
    };

    const handleOpenEditModal = (area) => {
        setFormModal({ open: true, mode: 'edit', area });
        handleMenuClose();
    };

    const handleCloseFormModal = () => {
        setFormModal({ open: false, mode: 'create', area: null });
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (formModal.mode === 'create') {
                await areasApi.createArea(formData);

                // Close modal first
                handleCloseFormModal();

                // Set alert immediately (before reload to ensure it shows)
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo khu vực mới thành công!',
                    type: 'success'
                });

                // Reload data from API to get the latest information (don't block on this)
                loadData().catch(err => {
                    console.error('Error reloading data after create:', err);
                });
            } else {
                // Validate area and areaId
                if (!formModal.area || !formModal.area.id) {
                    throw new Error('Không tìm thấy thông tin khu vực cần cập nhật');
                }

                const areaId = formModal.area.id;
                await areasApi.updateArea(areaId, formData);

                // Close modal first
                handleCloseFormModal();

                // Set alert immediately (before reload to ensure it shows)
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật khu vực thành công!',
                    type: 'success'
                });

                // Reload data from API to get the latest information (don't block on this)
                loadData().catch(err => {
                    console.error('Error reloading data after update:', err);
                });
            }
        } catch (error) {
            console.error('Error saving area:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || `Không thể ${formModal.mode === 'create' ? 'tạo' : 'cập nhật'} khu vực`,
                type: 'error'
            });
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filterStatus, filterWorkTypeId]);

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RoomIcon sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                    Quản lý Khu vực
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Quản lý các khu vực hoạt động trong cafe
                </Typography>
            </Box>

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
                    { label: 'Tổng khu vực', value: stats.total ?? 0, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Đang hoạt động', value: stats.active ?? 0, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Không hoạt động', value: stats.inactive ?? 0, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Tổng sức chứa', value: stats.totalCapacity ?? 0, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${3 * 16}px) / 4)`;
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
            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Tìm kiếm khu vực..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ width: '1000px', flexShrink: 0 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            label="Trạng thái"
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="active">Hoạt động</MenuItem>
                            <MenuItem value="inactive">Không hoạt động</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Loại công việc</InputLabel>
                        <Select
                            value={filterWorkTypeId}
                            onChange={(e) => setFilterWorkTypeId(e.target.value)}
                            label="Loại công việc"
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            {workTypes.map(wt => (
                                <MenuItem key={wt.id} value={wt.id}>{wt.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal}
                        sx={{
                            bgcolor: COLORS.PRIMARY[600],
                            '&:hover': { bgcolor: COLORS.PRIMARY[700] }
                        }}
                    >
                        Tạo khu vực
                    </Button>
                </Toolbar>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }} width="5%">STT</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="6%">Ảnh</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="25%">Tên khu vực</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="20%">Vị trí</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="10%">Sức chứa</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="20%">Trạng thái</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="14%">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedAreas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Không có khu vực nào
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedAreas.map((area, index) => (
                                <TableRow key={area.id || `area-${index}`} hover>
                                    {/* STT */}
                                    <TableCell>
                                        {(page - 1) * itemsPerPage + index + 1}
                                    </TableCell>

                                    {/* Ảnh */}
                                    <TableCell>
                                        <Avatar
                                            src={area.image_url || ''}
                                            variant="rounded"
                                            sx={{ width: 48, height: 48 }}
                                        >
                                            <RoomIcon />
                                        </Avatar>
                                    </TableCell>

                                    {/* Tên khu vực */}
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {area.name || ''}
                                        </Typography>
                                    </TableCell>

                                    {/* Vị trí */}
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <LocationIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {area.location || ''}
                                            </Typography>
                                        </Stack>
                                    </TableCell>

                                    {/* Sức chứa */}
                                    <TableCell align="center">
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                            <PeopleIcon fontSize="small" color="action" />
                                            <Typography variant="body2" fontWeight={500}>
                                                {area.max_capacity ?? 0}
                                            </Typography>
                                        </Stack>
                                    </TableCell>

                                    {/* Trạng thái */}
                                    <TableCell align="center">
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                            <Switch
                                                checked={area.is_active}
                                                onChange={(e) => handleToggleStatusClick(area, e)}
                                                size="small"
                                            />
                                            <Chip
                                                label={area.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                size="small"
                                                color={area.is_active ? 'success' : 'default'}
                                                sx={{
                                                    fontWeight: 600,
                                                    minWidth: 100
                                                }}
                                            />
                                        </Stack>
                                    </TableCell>

                                    {/* Thao tác */}
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, area)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ mt: 2 }}>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setPage(1);
                    }}
                    totalItems={filteredAreas.length}
                />
            </Box>

            {/* Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => menuArea && handleOpenWorkTypesModal(menuArea)}>
                    <ListItemIcon>
                        <AssignmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => menuArea && handleOpenEditModal(menuArea)}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => menuArea && handleDeleteClick(menuArea)}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>Xóa</ListItemText>
                </MenuItem>
            </Menu>

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, areaId: null })}
                onConfirm={handleConfirmDelete}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa khu vực này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
            />

            {/* Confirm Toggle Status Modal */}
            {confirmToggle.area && (
                <ConfirmModal
                    isOpen={confirmToggle.open}
                    onClose={() => setConfirmToggle({ open: false, area: null })}
                    onConfirm={handleConfirmToggleStatus}
                    title={confirmToggle.area.is_active ? "Xác nhận vô hiệu hóa" : "Xác nhận kích hoạt"}
                    message={
                        confirmToggle.area.is_active
                            ? `Bạn có chắc chắn muốn vô hiệu hóa khu vực "${confirmToggle.area.name}"? Khu vực sẽ tạm thời không hoạt động.`
                            : `Bạn có chắc chắn muốn kích hoạt khu vực "${confirmToggle.area.name}"?`
                    }
                    confirmText={confirmToggle.area.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                    cancelText="Hủy"
                />
            )}

            {/* Area Detail Modal */}
            <AreaDetailModal
                open={workTypesModal.open}
                onClose={handleCloseWorkTypesModal}
                area={workTypesModal.area}
            />

            {/* Area Form Modal (Create/Edit) */}
            <AreaFormModal
                open={formModal.open}
                onClose={handleCloseFormModal}
                onSubmit={handleFormSubmit}
                area={formModal.area}
                workTypes={workTypes}
                mode={formModal.mode}
            />
        </Box>
    );
};

export default AreasPage;
