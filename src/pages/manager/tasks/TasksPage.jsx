import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, Grid, Avatar, Select, MenuItem, FormControl, InputLabel, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Schedule as ScheduleIcon, Public as PublicIcon, Lock as LockIcon, Visibility as VisibilityIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import TaskTemplateFormModal from '../../../components/modals/TaskTemplateFormModal';
import SlotFormModal from '../../../components/modals/SlotFormModal';
import SlotPublishModal from '../../../components/modals/SlotPublishModal';
import SlotDetailsModal from '../../../components/modals/SlotDetailsModal';
import taskTemplateApi, { TASK_TYPES } from '../../../api/taskTemplateApi';
import slotApi, { SLOT_STATUS, WEEKDAY_LABELS } from '../../../api/slotApi';

const TasksPage = () => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Loading states
    const [loading, setLoading] = useState(true);

    // Data
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [slots, setSlots] = useState([]);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTaskType, setFilterTaskType] = useState('all');
    const [filterSlotStatus, setFilterSlotStatus] = useState('all');
    const [filterSlotTask, setFilterSlotTask] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [taskFormOpen, setTaskFormOpen] = useState(false);
    const [slotFormOpen, setSlotFormOpen] = useState(false);
    const [slotPublishOpen, setSlotPublishOpen] = useState(false);
    const [slotDetailsOpen, setSlotDetailsOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Modal data
    const [selectedTask, setSelectedTask] = useState(null);
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
            public: slots.filter(s => s.status === SLOT_STATUS.PUBLIC).length,
            internal: slots.filter(s => s.status === SLOT_STATUS.INTERNAL_ONLY).length,
            draft: slots.filter(s => s.status === SLOT_STATUS.DRAFT).length
        };

        const tasksByType = {};
        TASK_TYPES.forEach(type => {
            // Count tasks that match either by key (old) or name (new)
            tasksByType[type.key] = taskTemplates.filter(t =>
                t.task_type === type.key || t.task_type === type.name
            ).length;
        });

        return {
            totalTasks: taskTemplates.length,
            totalSlots: slots.length,
            slotsByStatus,
            tasksByType
        };
    }, [taskTemplates, slots]);

    // Filter task templates
    const filteredTemplates = useMemo(() => {
        return taskTemplates.filter(t => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = t.name.toLowerCase().includes(searchLower) ||
                    t.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Task type filter - support both key and name
            if (filterTaskType !== 'all') {
                const taskTypeInfo = TASK_TYPES.find(type => type.key === filterTaskType);
                if (taskTypeInfo) {
                    // Check if task matches by key or name
                    if (t.task_type !== taskTypeInfo.key && t.task_type !== taskTypeInfo.name) {
                        return false;
                    }
                } else if (t.task_type !== filterTaskType) {
                    // For custom types or direct comparison
                    return false;
                }
            }

            return true;
        });
    }, [taskTemplates, searchQuery, filterTaskType]);

    // Filter slots
    const filteredSlots = useMemo(() => {
        return slots.filter(s => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = s.start_time.includes(searchLower) ||
                    s.end_time.includes(searchLower);
                if (!matchSearch) return false;
            }

            // Status filter
            if (filterSlotStatus !== 'all' && s.status !== filterSlotStatus) {
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

    // Load all data
    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadTaskTemplates(),
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

    const loadSlots = async () => {
        try {
            const response = await slotApi.getAllSlots();
            setSlots(response.data || []);
        } catch (error) {
            throw error;
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
        setSlotFormOpen(true);
    };

    const handleSlotFormSubmit = async (slotsData) => {
        try {
            // Check if it's an array of slots (new format) or single slot (old format)
            const slotsArray = Array.isArray(slotsData) ? slotsData : [slotsData];

            // Create all slots
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

            // Show result message
            if (failCount === 0) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: `Tạo thành công ${successCount} slot${successCount > 1 ? 's' : ''}!`,
                    type: 'success'
                });
            } else {
                setAlert({
                    open: true,
                    title: 'Cảnh báo',
                    message: `Tạo thành công ${successCount} slots, thất bại ${failCount} slots`,
                    type: 'warning'
                });
            }

            await loadSlots();
            setSlotFormOpen(false);
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

    const handleDeleteSlot = (slot) => {
        setDeleteTarget({ type: 'slot', data: slot });
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
                    message: 'Xóa slot thành công!',
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

    // Get task type info - supports both key (old) and name (new), plus custom types
    const getTaskTypeInfo = (typeValue) => {
        // Try to find by key first (backward compatibility)
        let taskType = TASK_TYPES.find(t => t.key === typeValue);

        // If not found, try by name
        if (!taskType) {
            taskType = TASK_TYPES.find(t => t.name === typeValue);
        }

        // If still not found, it's a custom task type
        if (!taskType && typeValue) {
            return {
                key: typeValue,
                name: typeValue,
                icon: '📋',
                color: '#757575' // Gray color for custom types
            };
        }

        return taskType;
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
            public: taskSlots.filter(s => s.status === SLOT_STATUS.PUBLIC).length,
            internal: taskSlots.filter(s => s.status === SLOT_STATUS.INTERNAL_ONLY).length
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
                        Quản lý Task & Slot
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Tạo Task Template → Tạo Slot → Publish cho khách hàng
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
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Slots Public
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.slotsByStatus.public}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Slots Internal
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                            {stats.slotsByStatus.internal}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng Slots
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.totalSlots}
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
                    <Tab label={`Task Templates (${taskTemplates.length})`} />
                    <Tab label={`Slots (${slots.length})`} />
                </Tabs>
            </Paper>

            {/* Toolbar */}
            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder={currentTab === 0 ? "Tìm task..." : "Tìm slot..."}
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
                            <InputLabel>Task Type</InputLabel>
                            <Select
                                value={filterTaskType}
                                onChange={(e) => {
                                    setFilterTaskType(e.target.value);
                                    setPage(1);
                                }}
                                label="Task Type"
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                {TASK_TYPES.map(type => (
                                    <MenuItem key={type.key} value={type.key}>
                                        {type.icon} {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {currentTab === 1 && (
                        <>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterSlotStatus}
                                    onChange={(e) => {
                                        setFilterSlotStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Status"
                                >
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value={SLOT_STATUS.PUBLIC}>Public</MenuItem>
                                    <MenuItem value={SLOT_STATUS.INTERNAL_ONLY}>Internal Only</MenuItem>
                                    <MenuItem value={SLOT_STATUS.DRAFT}>Draft</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Task</InputLabel>
                                <Select
                                    value={filterSlotTask}
                                    onChange={(e) => {
                                        setFilterSlotTask(e.target.value);
                                        setPage(1);
                                    }}
                                    label="Task"
                                >
                                    <MenuItem value="all">Tất cả Task</MenuItem>
                                    {taskTemplates.map(task => (
                                        <MenuItem key={task.id} value={task.id}>
                                            {task.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton onClick={loadData} size="small">
                        <RefreshIcon />
                    </IconButton>

                    {currentTab === 0 && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateTask}
                        >
                            Tạo Task
                        </Button>
                    )}
                </Toolbar>
            </Paper>

            {/* Table - Task Templates */}
            {currentTab === 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                            <TableRow>
                                <TableCell width="5%">STT</TableCell>
                                <TableCell width="10%">Loại</TableCell>
                                <TableCell width="25%">Tên Task</TableCell>
                                <TableCell width="35%">Mô tả</TableCell>
                                <TableCell width="10%" align="center">Thời gian</TableCell>
                                <TableCell width="10%" align="center">Slots</TableCell>
                                <TableCell width="5%" align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            Không có task template nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageItems.map((task, index) => {
                                    const taskType = getTaskTypeInfo(task.task_type);
                                    const slotsCount = getSlotsCountForTask(task.id);

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
                                                    {task.description.length > 80
                                                        ? `${task.description.substring(0, 80)}...`
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
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Xem chi tiết slots">
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
                                                    <Tooltip title="Slots public">
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
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Tạo Slot">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCreateSlot(task)}
                                                            sx={{ color: COLORS.SUCCESS[600] }}
                                                        >
                                                            <AddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditTask(task)}
                                                            sx={{ color: COLORS.INFO[600] }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteTask(task)}
                                                            sx={{ color: COLORS.ERROR[600] }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
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

            {/* Table - Slots */}
            {currentTab === 1 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                            <TableRow>
                                <TableCell width="5%">STT</TableCell>
                                <TableCell width="20%">Task</TableCell>
                                <TableCell width="12%">Thời gian</TableCell>
                                <TableCell width="18%">Ngày áp dụng</TableCell>
                                <TableCell width="10%" align="center">Capacity</TableCell>
                                <TableCell width="12%" align="right">Giá</TableCell>
                                <TableCell width="13%" align="center">Trạng thái</TableCell>
                                <TableCell width="10%" align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            Không có slot nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageItems.map((slot, index) => {
                                    const task = getTaskForSlot(slot.task_id);
                                    const taskType = task ? getTaskTypeInfo(task.task_type) : null;

                                    return (
                                        <TableRow key={slot.id} hover>
                                            {/* STT */}
                                            <TableCell>
                                                {(page - 1) * itemsPerPage + index + 1}
                                            </TableCell>

                                            {/* Task */}
                                            <TableCell>
                                                {task && (
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {task.name}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Thời gian */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {slot.start_time} - {slot.end_time}
                                                </Typography>
                                            </TableCell>

                                            {/* Ngày áp dụng */}
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {slot.applicable_days.slice(0, 3).map(day => (
                                                        <Chip
                                                            key={day}
                                                            label={WEEKDAY_LABELS[day].substring(0, 3)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                    {slot.applicable_days.length > 3 && (
                                                        <Chip
                                                            label={`+${slot.applicable_days.length - 3}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>

                                            {/* Capacity */}
                                            <TableCell align="center">
                                                {slot.capacity ? (
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {slot.capacity}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Giá */}
                                            <TableCell align="right">
                                                {slot.price ? (
                                                    <Typography variant="body2" fontWeight={500} color={COLORS.SUCCESS[700]}>
                                                        {new Intl.NumberFormat('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND'
                                                        }).format(slot.price)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Trạng thái */}
                                            <TableCell align="center">
                                                <Chip
                                                    label={slot.status === SLOT_STATUS.PUBLIC ? 'Public' : 'Internal'}
                                                    size="small"
                                                    icon={slot.status === SLOT_STATUS.PUBLIC ? <PublicIcon /> : <LockIcon />}
                                                    color={slot.status === SLOT_STATUS.PUBLIC ? 'success' : 'default'}
                                                    sx={{
                                                        bgcolor: slot.status === SLOT_STATUS.PUBLIC
                                                            ? alpha(COLORS.SUCCESS[100], 0.8)
                                                            : alpha(COLORS.GRAY[200], 0.6),
                                                        color: slot.status === SLOT_STATUS.PUBLIC
                                                            ? COLORS.SUCCESS[700]
                                                            : COLORS.TEXT.SECONDARY
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Thao tác */}
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    {slot.status === SLOT_STATUS.PUBLIC ? (
                                                        <>
                                                            <Tooltip title="Unpublish">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleUnpublishSlot(slot)}
                                                                    sx={{ color: COLORS.WARNING[600] }}
                                                                >
                                                                    <LockIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Tooltip title="Publish">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handlePublishSlot(slot)}
                                                                    sx={{ color: COLORS.SUCCESS[600] }}
                                                                >
                                                                    <PublicIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Xóa">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteSlot(slot)}
                                                                    sx={{ color: COLORS.ERROR[600] }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
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
                        totalItems={currentTab === 0 ? filteredTemplates.length : filteredSlots.length}
                    />
                </Box>
            )}

            {/* Modals */}
            <TaskTemplateFormModal
                open={taskFormOpen}
                onClose={() => setTaskFormOpen(false)}
                onSubmit={handleTaskFormSubmit}
                initialData={editingTask}
                mode={editingTask ? 'edit' : 'create'}
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

            <ConfirmModal
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Xóa ${deleteTarget?.type === 'task' ? 'Task Template' : 'Slot'}?`}
                message={`Bạn có chắc chắn muốn xóa ${deleteTarget?.type === 'task' ? `task "${deleteTarget?.data?.name}"` : 'slot này'}?`}
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

export default TasksPage;
