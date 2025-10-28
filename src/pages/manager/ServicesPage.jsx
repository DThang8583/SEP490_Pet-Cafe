import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, Grid, FormControl, InputLabel, Select, MenuItem, Switch, Tooltip, Tabs, Tab } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Schedule as ScheduleIcon, Check as CheckIcon, Close as CloseIcon, MiscellaneousServices as ServicesIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AlertModal from '../../components/modals/AlertModal';
import ServiceFormModal from '../../components/modals/ServiceFormModal';
import SlotDetailsModal from '../../components/modals/SlotDetailsModal';
import SlotFormModal from '../../components/modals/SlotFormModal';
import SlotPublishModal from '../../components/modals/SlotPublishModal';
import taskTemplateApi, { TASK_TYPES } from '../../api/taskTemplateApi';
import serviceApi, { SERVICE_STATUS } from '../../api/serviceApi';
import slotApi from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';

const ServicesPage = () => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Loading states
    const [loading, setLoading] = useState(true);

    // Data
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [services, setServices] = useState([]);
    const [slots, setSlots] = useState([]);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterServiceStatus, setFilterServiceStatus] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [serviceFormOpen, setServiceFormOpen] = useState(false);
    const [slotDetailsOpen, setSlotDetailsOpen] = useState(false);
    const [slotFormOpen, setSlotFormOpen] = useState(false);
    const [slotPublishOpen, setSlotPublishOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Modal data
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const servicedTaskIds = services.map(s => s.task_id);
        const availableTasks = taskTemplates.filter(t => !servicedTaskIds.includes(t.id));

        return {
            totalTasks: taskTemplates.length,
            availableTasks: availableTasks.length,
            totalServices: services.length,
            enabledServices: services.filter(s => s.status === SERVICE_STATUS.ENABLED).length,
            disabledServices: services.filter(s => s.status === SERVICE_STATUS.DISABLED).length
        };
    }, [taskTemplates, services]);

    // Calculate available tasks (without services, only service type)
    const availableTasks = useMemo(() => {
        const servicedTaskIds = services.map(s => s.task_id);
        return taskTemplates.filter(t =>
            !servicedTaskIds.includes(t.id) && (t.task_type === 'service' || t.task_type === 'Làm service')
        );
    }, [taskTemplates, services]);

    // Filter available tasks
    const filteredAvailableTasks = useMemo(() => {
        return availableTasks.filter(task => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = task.name.toLowerCase().includes(searchLower) ||
                    task.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            return true;
        });
    }, [availableTasks, searchQuery]);

    // Filter services
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = service.name.toLowerCase().includes(searchLower) ||
                    service.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Status filter
            if (filterServiceStatus !== 'all' && service.status !== filterServiceStatus) {
                return false;
            }

            return true;
        });
    }, [services, searchQuery, filterServiceStatus]);

    // Pagination
    const currentPageItems = useMemo(() => {
        const items = currentTab === 0 ? filteredServices : filteredAvailableTasks;
        const startIndex = (page - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [currentTab, filteredAvailableTasks, filteredServices, page, itemsPerPage]);

    const totalPages = useMemo(() => {
        const items = currentTab === 0 ? filteredServices : filteredAvailableTasks;
        return Math.ceil(items.length / itemsPerPage);
    }, [currentTab, filteredAvailableTasks, filteredServices, itemsPerPage]);

    // Load all data
    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadTaskTemplates(),
                loadServices(),
                loadSlots()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadTaskTemplates = async () => {
        try {
            const response = await taskTemplateApi.getAllTaskTemplates();
            setTaskTemplates(response.data || []);
        } catch (error) {
            throw error;
        }
    };

    const loadServices = async () => {
        try {
            const response = await serviceApi.getAllServices();
            setServices(response.data || []);
        } catch (error) {
            throw error;
        }
    };

    const loadSlots = async () => {
        try {
            const response = await slotApi.getAllSlots();
            setSlots(response.data || []);
        } catch (error) {
            throw error;
        }
    };

    // Service handlers
    const handleCreateService = (task) => {
        setSelectedTask(task);
        setEditingService(null);
        setServiceFormOpen(true);
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setSelectedTask(null);
        setServiceFormOpen(true);
    };

    const handleServiceFormSubmit = async (formData) => {
        try {
            if (editingService) {
                await serviceApi.updateService(editingService.id, formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật service thành công!',
                    type: 'success'
                });
            } else {
                await serviceApi.createService(formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo service thành công!',
                    type: 'success'
                });
            }
            await loadServices();
            setServiceFormOpen(false);
        } catch (error) {
            throw error;
        }
    };

    const handleToggleStatus = async (service) => {
        try {
            await serviceApi.toggleServiceStatus(service.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: `Service đã được ${service.status === SERVICE_STATUS.ENABLED ? 'vô hiệu hóa' : 'kích hoạt'}!`,
                type: 'success'
            });
            await loadServices();
        } catch (error) {
            console.error('Error toggling service status:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể thay đổi trạng thái service',
                type: 'error'
            });
        }
    };

    const handleDeleteService = (service) => {
        setDeleteTarget(service);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await serviceApi.deleteService(deleteTarget.id);
            await loadServices();
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa service thành công!',
                type: 'success'
            });
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Có lỗi xảy ra khi xóa',
                type: 'error'
            });
        }
    };

    // Slot handlers
    const handleViewSlots = (service) => {
        // Find task for this service
        const task = taskTemplates.find(t => t.id === service.task_id);
        if (task) {
            setSelectedTask(task);
            setSlotDetailsOpen(true);
        }
    };

    const handleCreateSlot = (task) => {
        setSelectedTask(task);
        setSlotFormOpen(true);
    };

    const handleSlotFormSubmit = async (formData) => {
        try {
            await slotApi.createSlot(formData);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Tạo slot thành công!',
                type: 'success'
            });
            await loadSlots();
            setSlotFormOpen(false);
        } catch (error) {
            throw error;
        }
    };

    const handlePublishSlot = (slot) => {
        setSelectedSlot(slot);
        setSlotPublishOpen(true);
    };

    const handleSlotPublishSubmit = async (formData) => {
        try {
            await slotApi.publishSlot(selectedSlot.id, formData);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Publish slot thành công!',
                type: 'success'
            });
            await loadSlots();
            setSlotPublishOpen(false);
        } catch (error) {
            throw error;
        }
    };

    const handleUnpublishSlot = async (slot) => {
        try {
            await slotApi.unpublishSlot(slot.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Unpublish slot thành công!',
                type: 'success'
            });
            await loadSlots();
        } catch (error) {
            console.error('Error unpublishing slot:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể unpublish slot',
                type: 'error'
            });
        }
    };

    const handleDeleteSlot = async (slot) => {
        try {
            await slotApi.deleteSlot(slot.id);
            await loadSlots();
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa slot thành công!',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting slot:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa slot',
                type: 'error'
            });
        }
    };

    // Get task type info (support both key and name)
    const getTaskTypeInfo = (typeKeyOrName) => {
        return TASK_TYPES.find(t => t.key === typeKeyOrName || t.name === typeKeyOrName);
    };

    // Get task for service
    const getTaskForService = (taskId) => {
        return taskTemplates.find(t => t.id === taskId);
    };

    // Get slots count for service (by task_id)
    const getSlotsCountForService = (taskId) => {
        const serviceSlots = slots.filter(s => s.task_id === taskId);
        return {
            total: serviceSlots.length,
            public: serviceSlots.filter(s => s.status === 'public').length,
            internal: serviceSlots.filter(s => s.status === 'internal_only').length
        };
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <ServicesIcon sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                    <Typography variant="h4" fontWeight={600}>
                        Quản lý Service
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Tạo Service từ Task Template (1 Task = 1 Service)
                </Typography>
            </Box>

            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng Task Templates
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                            {stats.totalTasks}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tasks chưa có Service
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.availableTasks}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Services Enabled
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.enabledServices}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng Services
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                            {stats.totalServices}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, v) => {
                        setCurrentTab(v);
                        setPage(1);
                        setSearchQuery('');
                    }}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.9375rem'
                        }
                    }}
                >
                    <Tab label={`Services (${services.length})`} />
                    <Tab label={`Tasks chưa có Service (${availableTasks.length})`} />
                </Tabs>
            </Paper>

            {/* Toolbar */}
            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder={currentTab === 0 ? "Tìm service..." : "Tìm task..."}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        sx={{ minWidth: 250 }}
                    />


                    {currentTab === 0 && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterServiceStatus}
                                onChange={(e) => {
                                    setFilterServiceStatus(e.target.value);
                                    setPage(1);
                                }}
                                label="Status"
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value={SERVICE_STATUS.ENABLED}>Kích hoạt</MenuItem>
                                <MenuItem value={SERVICE_STATUS.DISABLED}>Vô hiệu hóa</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton onClick={loadData} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Toolbar>
            </Paper>

            {/* Table - Available Tasks */}
            {currentTab === 1 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                            <TableRow>
                                <TableCell width="5%">STT</TableCell>
                                <TableCell width="10%">Loại</TableCell>
                                <TableCell width="25%">Tên Task</TableCell>
                                <TableCell width="40%">Mô tả</TableCell>
                                <TableCell width="10%" align="center">Thời gian</TableCell>
                                <TableCell width="10%" align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {searchQuery
                                                ? 'Không tìm thấy task nào'
                                                : '🎉 Tuyệt vời! Tất cả Task đã có Service.'
                                            }
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageItems.map((task, index) => {
                                    const taskType = getTaskTypeInfo(task.task_type);

                                    return (
                                        <TableRow key={task.id} hover>
                                            <TableCell>
                                                {(page - 1) * itemsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {taskType && (
                                                    <Chip
                                                        label={taskType.name}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: `${taskType.color}20`,
                                                            color: taskType.color,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {task.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {task.description.length > 100
                                                        ? `${task.description.substring(0, 100)}...`
                                                        : task.description
                                                    }
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                    <ScheduleIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {task.estimate_duration}p
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleCreateService(task)}
                                                    sx={{
                                                        bgcolor: COLORS.SUCCESS[600],
                                                        '&:hover': {
                                                            bgcolor: COLORS.SUCCESS[700]
                                                        }
                                                    }}
                                                >
                                                    Tạo Service
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Table - Services */}
            {currentTab === 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                            <TableRow>
                                <TableCell width="4%">STT</TableCell>
                                <TableCell width="8%">Loại</TableCell>
                                <TableCell width="18%">Tên Service</TableCell>
                                <TableCell width="25%">Mô tả</TableCell>
                                <TableCell width="7%" align="center">Thời gian</TableCell>
                                <TableCell width="9%" align="right">Giá</TableCell>
                                <TableCell width="8%" align="center">Slots</TableCell>
                                <TableCell width="12%" align="center">Trạng thái</TableCell>
                                <TableCell width="9%" align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            Không có service nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageItems.map((service, index) => {
                                    const taskType = getTaskTypeInfo(service.task_type);
                                    const task = getTaskForService(service.task_id);

                                    return (
                                        <TableRow key={service.id} hover>
                                            {/* STT */}
                                            <TableCell>
                                                {(page - 1) * itemsPerPage + index + 1}
                                            </TableCell>

                                            {/* Loại */}
                                            <TableCell>
                                                {taskType && (
                                                    <Chip
                                                        label={taskType.name}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: `${taskType.color}20`,
                                                            color: taskType.color,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </TableCell>

                                            {/* Tên Service */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {service.name}
                                                </Typography>
                                                {task && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Task: {task.name}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Mô tả */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {service.description.length > 80
                                                        ? `${service.description.substring(0, 80)}...`
                                                        : service.description
                                                    }
                                                </Typography>
                                            </TableCell>

                                            {/* Thời gian */}
                                            <TableCell align="center">
                                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                    <ScheduleIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {service.estimate_duration}p
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            {/* Giá */}
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                                    {formatPrice(service.price)}
                                                </Typography>
                                            </TableCell>

                                            {/* Slots */}
                                            <TableCell align="center">
                                                {(() => {
                                                    const slotsCount = getSlotsCountForService(service.task_id);
                                                    return (
                                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                                            <Tooltip title="Xem chi tiết slots">
                                                                <Chip
                                                                    label={slotsCount.total}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => handleViewSlots(service)}
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            bgcolor: alpha(COLORS.PRIMARY[100], 0.5)
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Slots public">
                                                                <Chip
                                                                    label={`${slotsCount.public}P`}
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleViewSlots(service)}
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            opacity: 0.8
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </Stack>
                                                    );
                                                })()}
                                            </TableCell>

                                            {/* Trạng thái */}
                                            <TableCell align="center">
                                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                                    <Switch
                                                        checked={service.status === SERVICE_STATUS.ENABLED}
                                                        onChange={() => handleToggleStatus(service)}
                                                        size="small"
                                                        color="success"
                                                    />
                                                    <Chip
                                                        label={service.status === SERVICE_STATUS.ENABLED ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                                        size="small"
                                                        icon={service.status === SERVICE_STATUS.ENABLED ? <CheckIcon /> : <CloseIcon />}
                                                        sx={{
                                                            bgcolor: service.status === SERVICE_STATUS.ENABLED
                                                                ? alpha(COLORS.SUCCESS[100], 0.8)
                                                                : alpha(COLORS.GRAY[200], 0.6),
                                                            color: service.status === SERVICE_STATUS.ENABLED
                                                                ? COLORS.SUCCESS[700]
                                                                : COLORS.TEXT.SECONDARY
                                                        }}
                                                    />
                                                </Stack>
                                            </TableCell>

                                            {/* Thao tác */}
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditService(service)}
                                                            sx={{ color: COLORS.INFO[600] }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={service.status === SERVICE_STATUS.ENABLED ? "Phải disabled trước khi xóa" : "Xóa"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteService(service)}
                                                                disabled={service.status === SERVICE_STATUS.ENABLED}
                                                                sx={{
                                                                    color: service.status === SERVICE_STATUS.ENABLED
                                                                        ? COLORS.GRAY[400]
                                                                        : COLORS.ERROR[600]
                                                                }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
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
                        totalItems={currentTab === 0 ? filteredServices.length : filteredAvailableTasks.length}
                    />
                </Box>
            )}

            {/* Modals */}
            <ServiceFormModal
                open={serviceFormOpen}
                onClose={() => setServiceFormOpen(false)}
                onSubmit={handleServiceFormSubmit}
                taskData={selectedTask}
                initialData={editingService}
                mode={editingService ? 'edit' : 'create'}
            />

            <SlotDetailsModal
                open={slotDetailsOpen}
                onClose={() => setSlotDetailsOpen(false)}
                taskData={selectedTask}
                slots={slots}
                onCreateSlot={handleCreateSlot}
                onPublishSlot={handlePublishSlot}
                onUnpublishSlot={handleUnpublishSlot}
                onDeleteSlot={handleDeleteSlot}
                onRefresh={loadData}
            />

            <SlotFormModal
                open={slotFormOpen}
                onClose={() => setSlotFormOpen(false)}
                onSubmit={handleSlotFormSubmit}
                taskData={selectedTask}
            />

            <SlotPublishModal
                open={slotPublishOpen}
                onClose={() => setSlotPublishOpen(false)}
                onSubmit={handleSlotPublishSubmit}
                slotData={selectedSlot}
            />

            <ConfirmModal
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa Service?"
                message={`Bạn có chắc chắn muốn xóa service "${deleteTarget?.name}"?`}
                confirmText="Xóa"
                confirmColor="error"
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default ServicesPage;
