import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, Grid, Avatar, Select, MenuItem, FormControl, InputLabel, Tooltip, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Schedule as ScheduleIcon, Public as PublicIcon, Lock as LockIcon, Visibility as VisibilityIcon, Assignment as AssignmentIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import TaskTemplateFormModal from '../../../components/modals/TaskTemplateFormModal';
import SlotFormModal from '../../../components/modals/SlotFormModal';
import SlotPublishModal from '../../../components/modals/SlotPublishModal';
import SlotDetailsModal from '../../../components/modals/SlotDetailsModal';
import taskTemplateApi, { TASK_STATUS, TASK_PRIORITY } from '../../../api/taskTemplateApi';
import slotApi, { SLOT_STATUS } from '../../../api/slotApi';
import serviceApi from '../../../api/serviceApi';
import * as areasApi from '../../../api/areasApi';
import petGroupsApi from '../../../api/petGroupsApi';
import * as teamApi from '../../../api/teamApi';
import DailyTasksTab from './DailyTasksTab';
import WorkTypeTab from './WorkTypeTab';

const TasksPage = () => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Loading states
    const [loading, setLoading] = useState(true);

    // Data
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [slots, setSlots] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [services, setServices] = useState([]);
    const [areas, setAreas] = useState([]);
    const [petGroups, setPetGroups] = useState([]);
    const [teams, setTeams] = useState([]);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTaskType, setFilterTaskType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterIsPublic, setFilterIsPublic] = useState('all');
    const [filterSlotStatus, setFilterSlotStatus] = useState('all');
    const [filterSlotTask, setFilterSlotTask] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [taskFormOpen, setTaskFormOpen] = useState(false);
    const [slotFormOpen, setSlotFormOpen] = useState(false);
    const [slotFormMode, setSlotFormMode] = useState('create');
    const [editingSlot, setEditingSlot] = useState(null);
    const [slotPublishOpen, setSlotPublishOpen] = useState(false);
    const [slotDetailsOpen, setSlotDetailsOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
    const [unpublishTarget, setUnpublishTarget] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Modal data
    const [selectedTask, setSelectedTask] = useState(null);

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuTask, setMenuTask] = useState(null);
    const [slotMenuAnchor, setSlotMenuAnchor] = useState(null);
    const [menuSlot, setMenuSlot] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const slotsByStatus = {
            total: slots.length,
            available: slots.filter(s => s.service_status === 'AVAILABLE').length,
            unavailable: slots.filter(s => s.service_status === 'UNAVAILABLE').length,
            booked: slots.filter(s => s.service_status === 'BOOKED').length,
            cancelled: slots.filter(s => s.service_status === 'CANCELLED').length
        };

        const tasksByWorkType = {};
        workTypes.forEach(workType => {
            tasksByWorkType[workType.id] = taskTemplates.filter(t =>
                t.work_type_id === workType.id
            ).length;
        });

        return {
            totalTasks: taskTemplates.length,
            totalSlots: slots.length,
            slotsByStatus,
            tasksByWorkType
        };
    }, [taskTemplates, slots, workTypes]);

    const PRIORITY_CONFIG = {
        [TASK_PRIORITY.URGENT]: {
            label: 'Khẩn cấp',
            color: COLORS.ERROR[700],
            bg: alpha(COLORS.ERROR[100], 0.85)
        },
        [TASK_PRIORITY.HIGH]: {
            label: 'Cao',
            color: COLORS.WARNING[700],
            bg: alpha(COLORS.WARNING[100], 0.85)
        },
        [TASK_PRIORITY.MEDIUM]: {
            label: 'Trung bình',
            color: COLORS.INFO[700],
            bg: alpha(COLORS.INFO[100], 0.85)
        },
        [TASK_PRIORITY.LOW]: {
            label: 'Thấp',
            color: COLORS.GRAY[700],
            bg: alpha(COLORS.GRAY[200], 0.75)
        }
    };

    const resolveWorkType = (task) => {
        if (task?.work_type) return task.work_type;
        return workTypes.find(wt => wt.id === task?.work_type_id) || null;
    };

    const resolveService = (task) => {
        if (!task) return null;
        if (task.service) return task.service;
        if (!task.service_id) return null;
        return services.find(service => service.id === task.service_id) || null;
    };

    const formatDateTime = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter task templates
    const filteredTemplates = useMemo(() => {
        return taskTemplates.filter(t => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = (t.title || t.name || '').toLowerCase().includes(searchLower) ||
                    t.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Work type filter
            if (filterTaskType !== 'all' && t.work_type_id !== filterTaskType) {
                return false;
            }

            // Status filter
            if (filterStatus !== 'all' && t.status !== filterStatus) {
                return false;
            }

            // Priority filter
            if (filterPriority !== 'all' && t.priority !== filterPriority) {
                return false;
            }

            // Is Public filter
            if (filterIsPublic !== 'all') {
                const isPublic = filterIsPublic === 'true';
                if (t.is_public !== isPublic) {
                    return false;
                }
            }

            return true;
        });
    }, [taskTemplates, searchQuery, filterTaskType, filterStatus, filterPriority, filterIsPublic]);

    // Filter slots
    const filteredSlots = useMemo(() => {
        return slots.filter(s => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = (s.start_time || '').includes(searchLower) ||
                    (s.end_time || '').includes(searchLower) ||
                    (s.task?.title || '').toLowerCase().includes(searchLower) ||
                    (s.team?.name || '').toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Status filter - use service_status from API
            if (filterSlotStatus !== 'all' && s.service_status !== filterSlotStatus) {
                return false;
            }

            // Task filter
            if (filterSlotTask !== 'all' && s.task_id !== filterSlotTask) {
                return false;
            }

            return true;
        });
    }, [slots, searchQuery, filterSlotStatus, filterSlotTask]);

    // Pagination
    const currentPageItems = useMemo(() => {
        const items = currentTab === 0 ? filteredTemplates : filteredSlots;
        const startIndex = (page - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [currentTab, filteredTemplates, filteredSlots, page, itemsPerPage]);

    const totalPages = useMemo(() => {
        const items = currentTab === 0 ? filteredTemplates : filteredSlots;
        return Math.ceil(items.length / itemsPerPage);
    }, [currentTab, filteredTemplates, filteredSlots, itemsPerPage]);

    // Load all data (resilient: don't block others if one fails)
    const loadData = async () => {
        setLoading(true);
        const results = await Promise.allSettled([
            loadTaskTemplates(),
            loadSlots(),
            loadWorkTypes(),
            loadServices(),
            loadAreas(),
            loadPetGroups(),
            loadTeams()
        ]);

        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length > 0) {
            setAlert({
                open: true,
                title: 'Cảnh báo',
                message: 'Một số dữ liệu không tải được. Các phần khác vẫn hiển thị bình thường.',
                type: 'warning'
            });
        }
        setLoading(false);
    };

    const loadTaskTemplates = async () => {
        try {
            const response = await taskTemplateApi.getAllTaskTemplates();
            setTaskTemplates(response.data || []);
        } catch (error) {
            throw error;
        }
    };

    const loadWorkTypes = async () => {
        try {
            const response = await taskTemplateApi.getWorkTypes();
            setWorkTypes(response.data || []);
        } catch (error) {
            console.error('Error loading work types:', error);
            setWorkTypes([]);
        }
    };

    const loadServices = async () => {
        try {
            const response = await serviceApi.getAllServices();
            setServices(response.data || []);
        } catch (error) {
            console.error('Error loading services:', error);
            setServices([]);
        }
    };

    const loadSlots = async () => {
        try {
            const response = await slotApi.getAllSlots();
            setSlots(response.data || []);
        } catch (error) {
            console.error('Error loading slots:', error);
            setSlots([]);
            throw error;
        }
    };

    const loadAreas = async () => {
        try {
            const response = await areasApi.getAllAreas();
            setAreas(response.data || []);
        } catch (error) {
            console.error('Error loading areas:', error);
        }
    };

    const loadPetGroups = async () => {
        try {
            const response = await petGroupsApi.getAllGroups({ page_size: 1000 });
            setPetGroups(response?.data || []);
        } catch (error) {
            console.error('Error loading pet groups:', error);
        }
    };

    const loadTeams = async () => {
        try {
            const response = await teamApi.getTeams({ page_index: 0, page_size: 1000 });
            if (response.success) {
                setTeams(response.data || []);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    };

    // Task Template handlers
    const handleCreateTask = () => {
        setEditingTask(null);
        setTaskFormOpen(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskFormOpen(true);
    };

    const handleDeleteTask = (task) => {
        setDeleteTarget({ type: 'task', data: task });
        setConfirmDeleteOpen(true);
    };

    const handleTaskFormSubmit = async (formData) => {
        try {
            if (editingTask) {
                await taskTemplateApi.updateTaskTemplate(editingTask.id, formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật task template thành công!',
                    type: 'success'
                });
            } else {
                await taskTemplateApi.createTaskTemplate(formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo task template thành công!',
                    type: 'success'
                });
            }
            await loadTaskTemplates();
            setTaskFormOpen(false);
        } catch (error) {
            throw error;
        }
    };

    // Slot handlers
    const handleCreateSlot = (task) => {
        setSelectedTask(task);
        setSlotFormMode('create');
        setEditingSlot(null);
        setSlotFormOpen(true);
    };

    const handleEditSlot = (slot) => {
        setSlotFormMode('edit');
        setEditingSlot(slot);
        setSlotFormOpen(true);
    };

    const handleSlotFormSubmit = async (slotsData) => {
        try {
            if (slotFormMode === 'edit' && editingSlot) {
                // Edit mode - single slot update
                await slotApi.updateSlot(editingSlot.id, slotsData);

                // Reload slots to get updated data with populated nested objects
                await loadSlots();

                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật ca thành công!',
                    type: 'success'
                });
            } else {
                // Create mode - can be array or single slot
                const slotsArray = Array.isArray(slotsData) ? slotsData : [slotsData];

                let successCount = 0;
                let failCount = 0;

                for (const slotData of slotsArray) {
                    try {
                        await slotApi.createSlot(slotData);
                        successCount++;
                    } catch (error) {
                        console.error('Error creating slot:', error);
                        failCount++;
                    }
                }

                // Reload slots after creation (with small delay to ensure backend is ready)
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadSlots();

                // Show result message
                if (failCount === 0) {
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: `Tạo thành công ${successCount} ca!`,
                        type: 'success'
                    });
                } else {
                    setAlert({
                        open: true,
                        title: 'Cảnh báo',
                        message: `Tạo thành công ${successCount} ca, thất bại ${failCount} ca`,
                        type: 'warning'
                    });
                }
            }

            setSlotFormOpen(false);
            setEditingSlot(null);
            setSlotFormMode('create');
        } catch (error) {
            throw error;
        }
    };

    const handleViewSlots = (task) => {
        setSelectedTask(task);
        setSlotDetailsOpen(true);
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
                message: 'Publish ca thành công!',
                type: 'success'
            });
            await loadSlots();
            setSlotPublishOpen(false);
        } catch (error) {
            throw error;
        }
    };

    const handleUnpublishSlot = (slot) => {
        setUnpublishTarget(slot);
        setConfirmUnpublishOpen(true);
    };

    const confirmUnpublishSlot = async () => {
        if (!unpublishTarget) return;

        try {
            await slotApi.unpublishSlot(unpublishTarget.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Hủy công khai ca thành công!',
                type: 'success'
            });
            await loadSlots();
        } catch (error) {
            console.error('Error unpublishing slot:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể hủy công khai ca',
                type: 'error'
            });
        } finally {
            setConfirmUnpublishOpen(false);
            setUnpublishTarget(null);
        }
    };

    const handleDeleteSlot = (slotOrId) => {
        // Handle both cases: slot object or slot ID
        const slotId = typeof slotOrId === 'string' ? slotOrId : slotOrId?.id;
        if (!slotId) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không tìm thấy ID của slot cần xóa',
                type: 'error'
            });
            return;
        }
        setDeleteTarget({ type: 'slot', data: { id: slotId } });
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'task') {
                await taskTemplateApi.deleteTaskTemplate(deleteTarget.data.id);
                await loadTaskTemplates();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa task template thành công!',
                    type: 'success'
                });
            } else if (deleteTarget.type === 'slot') {
                await slotApi.deleteSlot(deleteTarget.data.id);
                await loadSlots();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa ca thành công!',
                    type: 'success'
                });
            }
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Có lỗi xảy ra khi xóa',
                type: 'error'
            });
        }
    };

    // Get work type color (simple deterministic assignment based on name hash)
    const getWorkTypeColor = (workTypeName) => {
        if (!workTypeName) return COLORS.GRAY[500];
        const palette = [
            COLORS.PRIMARY[500],
            COLORS.SUCCESS[500],
            COLORS.INFO[500],
            COLORS.WARNING[500],
            COLORS.SECONDARY?.[500] || COLORS.PRIMARY[400]
        ];
        const hash = [...workTypeName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return palette[hash % palette.length] || COLORS.PRIMARY[500];
    };

    // Get task for slot
    const getTaskForSlot = (taskId) => {
        return taskTemplates.find(t => t.id === taskId);
    };

    // Get slots count for task
    const getSlotsCountForTask = (taskId) => {
        const taskSlots = slots.filter(s => s.task_id === taskId);
        return {
            total: taskSlots.length,
            // Public pill should show number of AVAILABLE slots for public tasks
            public: taskSlots.filter(s => s.service_status === 'AVAILABLE').length,
            internal: taskSlots.filter(s => s.service_status !== 'AVAILABLE').length
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
                    <AssignmentIcon sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                    <Typography variant="h4" fontWeight={600}>
                        Quản lý Nhiệm vụ & Tiến độ
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Quản lý nhiệm vụ và theo dõi tiến độ hoàn thành hằng ngày của team
                </Typography>
            </Box>

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
                    <Tab label={`Nhiệm vụ (${taskTemplates.length})`} />
                    <Tab label="Loại công việc" />
                    <Tab label="Nhiệm vụ hằng ngày" />
                </Tabs>
            </Paper>

            {/* Task Templates Tab */}
            {currentTab === 0 && (
                <>
                    {/* Statistics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tổng Nhiệm vụ
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                    {stats.totalTasks}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Đang hoạt động
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                    {taskTemplates.filter(t => t.status === 'ACTIVE').length}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Không hoạt động
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                    {taskTemplates.filter(t => t.status === 'INACTIVE').length}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tổng Ca
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                    {stats.totalSlots}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Toolbar */}
                    <Paper sx={{ mb: 2 }}>
                        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Tìm nhiệm vụ..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                size="small"
                                sx={{ minWidth: { xs: '100%', sm: 720 }, flexGrow: { xs: 1, sm: 0 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Loại nhiệm vụ</InputLabel>
                                <Select
                                    value={filterTaskType}
                                    onChange={(e) => {
                                        setFilterTaskType(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Loại nhiệm vụ"
                                >
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    {workTypes.map(workType => (
                                        <MenuItem key={workType.id} value={workType.id}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {workType.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    {workType.description}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => {
                                        setFilterStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value={TASK_STATUS.ACTIVE}>Đang hoạt động</MenuItem>
                                    <MenuItem value={TASK_STATUS.INACTIVE}>Không hoạt động</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Độ ưu tiên</InputLabel>
                                <Select
                                    value={filterPriority}
                                    onChange={(e) => {
                                        setFilterPriority(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Độ ưu tiên"
                                >
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value={TASK_PRIORITY.URGENT}>Khẩn cấp</MenuItem>
                                    <MenuItem value={TASK_PRIORITY.HIGH}>Cao</MenuItem>
                                    <MenuItem value={TASK_PRIORITY.MEDIUM}>Trung bình</MenuItem>
                                    <MenuItem value={TASK_PRIORITY.LOW}>Thấp</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Công khai</InputLabel>
                                <Select
                                    value={filterIsPublic}
                                    onChange={(e) => {
                                        setFilterIsPublic(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Công khai"
                                >
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value="true">Công khai</MenuItem>
                                    <MenuItem value="false">Nội bộ</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ flexGrow: 1 }} />

                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateTask}
                            >
                                Tạo nhiệm vụ
                            </Button>
                        </Toolbar>
                    </Paper>

                    {/* Table */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                                <TableRow>
                                    <TableCell width="5%">STT</TableCell>
                                    <TableCell width="12%">Loại</TableCell>
                                    <TableCell width="33%">Nhiệm vụ</TableCell>
                                    <TableCell width="8%" align="center">Ưu tiên</TableCell>
                                    <TableCell width="8%" align="center">Công khai</TableCell>
                                    <TableCell width="8%" align="center">Thời gian</TableCell>
                                    <TableCell width="8%" align="center">Ca</TableCell>
                                    <TableCell width="8%" align="center">Trạng thái</TableCell>
                                    <TableCell width="10%" align="center">Cập nhật</TableCell>
                                    <TableCell width="6%" align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPageItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                Không có Nhiệm vụ nào
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentPageItems.map((task, index) => {
                                        const slotsCount = getSlotsCountForTask(task.id);
                                        const workType = resolveWorkType(task);
                                        const service = resolveService(task);
                                        const workTypeColor = workType ? getWorkTypeColor(workType.name) : COLORS.GRAY[500];
                                        const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[TASK_PRIORITY.MEDIUM];
                                        const updatedAt = task.updated_at || task.created_at;

                                        return (
                                            <TableRow key={task.id} hover>
                                                <TableCell>
                                                    {(page - 1) * itemsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    {workType ? (
                                                        <Tooltip title={workType.description || ''} arrow>
                                                            <Chip
                                                                label={workType.name}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(workTypeColor, 0.15),
                                                                    color: workTypeColor,
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                        <Avatar
                                                            src={task.image_url || undefined}
                                                            alt={task.title || task.name}
                                                            variant="rounded"
                                                            sx={{
                                                                width: 48,
                                                                height: 48,
                                                                bgcolor: alpha(COLORS.PRIMARY[500], 0.15),
                                                                color: COLORS.PRIMARY[600],
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {(task.title || task.name || '?').charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {task.title || task.name}
                                                            </Typography>
                                                            {task.description && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ display: 'block', mt: 0.25 }}
                                                                >
                                                                    {task.description.length > 120
                                                                        ? `${task.description.substring(0, 120)}...`
                                                                        : task.description}
                                                                </Typography>
                                                            )}
                                                            {service?.name && (
                                                                <Chip
                                                                    label={`Dịch vụ: ${service.name}`}
                                                                    size="small"
                                                                    icon={<VisibilityIcon fontSize="inherit" />}
                                                                    sx={{
                                                                        mt: 1,
                                                                        bgcolor: alpha(COLORS.SECONDARY?.[100] || COLORS.PRIMARY[100], 0.6),
                                                                        color: COLORS.SECONDARY?.[700] || COLORS.PRIMARY[700],
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={priorityConfig.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: priorityConfig.bg,
                                                            color: priorityConfig.color,
                                                            fontWeight: 600,
                                                            minWidth: 90
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={task.is_public ? 'Công khai' : 'Nội bộ'}
                                                        size="small"
                                                        icon={task.is_public ? <PublicIcon fontSize="inherit" /> : <LockIcon fontSize="inherit" />}
                                                        sx={{
                                                            bgcolor: task.is_public
                                                                ? alpha(COLORS.SUCCESS[100], 0.8)
                                                                : alpha(COLORS.GRAY[200], 0.8),
                                                            color: task.is_public ? COLORS.SUCCESS[700] : COLORS.GRAY[700],
                                                            fontWeight: 600,
                                                            '& .MuiChip-icon': {
                                                                color: task.is_public ? COLORS.SUCCESS[600] : COLORS.GRAY[600]
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {task.estimated_hours > 0 ? (
                                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                            <ScheduleIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {task.estimated_hours} giờ
                                                            </Typography>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        <Tooltip title="Xem chi tiết ca">
                                                            <Chip
                                                                label={slotsCount.total}
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => handleViewSlots(task)}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.PRIMARY[100], 0.5)
                                                                    }
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        {task.is_public && (
                                                            <Tooltip title="Ca công khai">
                                                                <Chip
                                                                    label={`${slotsCount.public}P`}
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleViewSlots(task)}
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            opacity: 0.8
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Chip
                                                        label={task.status === TASK_STATUS.ACTIVE ? 'Đang hoạt động' : 'Không hoạt động'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: task.status === TASK_STATUS.ACTIVE
                                                                ? alpha(COLORS.SUCCESS[100], 0.8)
                                                                : alpha(COLORS.WARNING[100], 0.8),
                                                            color: task.status === TASK_STATUS.ACTIVE
                                                                ? COLORS.SUCCESS[700]
                                                                : COLORS.WARNING[700],
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDateTime(updatedAt)}
                                                    </Typography>
                                                </TableCell>

                                                {/* Thao tác */}
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            setMenuAnchor(e.currentTarget);
                                                            setMenuTask(task);
                                                        }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
                            totalItems={filteredTemplates.length}
                        />
                    </Box>
                </>
            )}

            {/* Work Type Tab */}
            {currentTab === 1 && (
                <WorkTypeTab
                    onAlert={(alert) => setAlert({ ...alert, open: true })}
                />
            )}

            {/* Daily Tasks Tab */}
            {currentTab === 2 && (
                <DailyTasksTab
                    taskTemplates={taskTemplates}
                    slots={slots}
                    onRefresh={loadData}
                />
            )}

            {/* Modals */}
            <TaskTemplateFormModal
                open={taskFormOpen}
                onClose={() => setTaskFormOpen(false)}
                onSubmit={handleTaskFormSubmit}
                initialData={editingTask}
                mode={editingTask ? 'edit' : 'create'}
                workTypes={workTypes}
                services={services}
            />

            <SlotFormModal
                open={slotFormOpen}
                onClose={() => {
                    setSlotFormOpen(false);
                    setEditingSlot(null);
                    setSlotFormMode('create');
                }}
                onSubmit={handleSlotFormSubmit}
                taskData={selectedTask}
                initialData={editingSlot}
                mode={slotFormMode}
                areas={areas}
                petGroups={petGroups}
                teams={teams}
            />

            <SlotPublishModal
                open={slotPublishOpen}
                onClose={() => setSlotPublishOpen(false)}
                onSubmit={handleSlotPublishSubmit}
                slotData={selectedSlot}
            />

            <SlotDetailsModal
                open={slotDetailsOpen}
                onClose={() => setSlotDetailsOpen(false)}
                taskData={selectedTask}
                slots={slots}
                onCreateSlot={handleCreateSlot}
                onEditSlot={handleEditSlot}
                onDeleteSlot={handleDeleteSlot}
                onRefresh={loadData}
                showCreateAction={true}
            />

            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Xóa ${deleteTarget?.type === 'task' ? 'Nhiệm vụ' : 'Ca'}?`}
                message={`Bạn có chắc chắn muốn xóa ${deleteTarget?.type === 'task' ? `nhiệm vụ "${deleteTarget?.data?.name}"` : 'ca này'}?`}
                confirmText="Xóa"
                type="error"
            />

            <ConfirmModal
                isOpen={confirmUnpublishOpen}
                onClose={() => {
                    setConfirmUnpublishOpen(false);
                    setUnpublishTarget(null);
                }}
                onConfirm={confirmUnpublishSlot}
                title="Hủy công khai Ca?"
                message="Bạn có chắc chắn muốn hủy công khai ca này? Ca sẽ không còn hiển thị cho khách hàng."
                confirmText="Hủy công khai"
                type="warning"
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Task Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuTask(null);
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
                        if (menuTask) handleCreateSlot(menuTask);
                        setMenuAnchor(null);
                        setMenuTask(null);
                    }}
                >
                    <ListItemIcon>
                        <AddIcon fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                    </ListItemIcon>
                    <ListItemText>Tạo Ca</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuTask) handleEditTask(menuTask);
                        setMenuAnchor(null);
                        setMenuTask(null);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuTask) handleDeleteTask(menuTask);
                        setMenuAnchor(null);
                        setMenuTask(null);
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>

            {/* Slot Actions Menu */}
            <Menu
                anchorEl={slotMenuAnchor}
                open={Boolean(slotMenuAnchor)}
                onClose={() => {
                    setSlotMenuAnchor(null);
                    setMenuSlot(null);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {menuSlot?.status === SLOT_STATUS.PUBLIC ? (
                    <MenuItem
                        onClick={() => {
                            if (menuSlot) handleUnpublishSlot(menuSlot);
                            setSlotMenuAnchor(null);
                            setMenuSlot(null);
                        }}
                    >
                        <ListItemIcon>
                            <LockIcon fontSize="small" sx={{ color: COLORS.WARNING[600] }} />
                        </ListItemIcon>
                        <ListItemText>Hủy công khai</ListItemText>
                    </MenuItem>
                ) : (
                    <>
                        <MenuItem
                            onClick={() => {
                                if (menuSlot) handlePublishSlot(menuSlot);
                                setSlotMenuAnchor(null);
                                setMenuSlot(null);
                            }}
                        >
                            <ListItemIcon>
                                <PublicIcon fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                            </ListItemIcon>
                            <ListItemText>Công khai</ListItemText>
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                if (menuSlot) handleDeleteSlot(menuSlot);
                                setSlotMenuAnchor(null);
                                setMenuSlot(null);
                            }}
                        >
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                            </ListItemIcon>
                            <ListItemText>Xóa</ListItemText>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Box>
    );
};

export default TasksPage;
