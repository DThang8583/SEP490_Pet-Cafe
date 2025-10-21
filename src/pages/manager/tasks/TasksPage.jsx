import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Stack, Chip, Button, Grid, Paper, Toolbar, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Assignment, Pending, CheckCircle, Schedule, Warning, Search, FilterList, Refresh } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import TaskList from './TaskList';
import TaskFormModal from './TaskFormModal';
import TaskDetailsModal from './TaskDetailsModal';
import { getAllTasksData } from '../../../api/tasksApi';

const TasksPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsTask, setDetailsTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Task data
    const [services, setServices] = useState([]);
    const [areas, setAreas] = useState([]);
    const [staff, setStaff] = useState([]);
    const [petGroupNames, setPetGroupNames] = useState([]);
    const [petGroupsMap, setPetGroupsMap] = useState({});

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, internal, service
    const [filterTimeframe, setFilterTimeframe] = useState('all'); // all, day, week, month
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, in_progress, completed, overdue, upcoming

    useEffect(() => {
        // Load tasks data
        const loadData = async () => {
            try {
                const data = await getAllTasksData();
                setServices(data.services);
                setAreas(data.areas);
                setStaff(data.staff);
                setPetGroupNames(data.petGroupNames);
                setPetGroupsMap(data.petGroupsMap);
            } catch (error) {
                console.error('Failed to load tasks data', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // Load tasks from localStorage
        const saved = localStorage.getItem('mgr_tasks_v2');
        if (saved) {
            try {
                setTasks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse tasks', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('mgr_tasks_v2', JSON.stringify(tasks));
    }, [tasks]);

    // Compute task status helper
    const computeTaskStatus = (task) => {
        const now = new Date();
        const daily = task.dailyStatuses || [];

        // Completed
        if (daily.length && daily.every(d => d.status === 'done')) return 'completed';

        // In progress
        const todayKey = now.toISOString().slice(0, 10);
        const todayEntry = daily.find(d => d.date === todayKey);
        if (todayEntry && todayEntry.status !== 'done') return 'in_progress';

        // Upcoming
        if (daily.length) {
            const allFuture = daily.every(d => new Date(d.date) > now);
            if (allFuture) return 'upcoming';
        }

        // Overdue
        if (task.timeframeType === 'day' && task.date) {
            const taskDate = new Date(task.date);
            if (taskDate < now && (!daily.length || !daily.every(d => d.status === 'done'))) {
                return 'overdue';
            }
        }

        return 'pending';
    };

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Filter by type
            if (filterType !== 'all' && task.type !== filterType) return false;

            // Filter by timeframe
            if (filterTimeframe !== 'all' && task.timeframeType !== filterTimeframe) return false;

            // Filter by status
            if (filterStatus !== 'all' && computeTaskStatus(task) !== filterStatus) return false;

            // Filter by search term
            if (searchTerm) {
                const taskName = task.type === 'internal' ? task.internalName :
                    (services.find(s => s.id === task.serviceId)?.name || '');
                const searchLower = searchTerm.toLowerCase();
                const nameMatch = taskName.toLowerCase().includes(searchLower);

                // Also search in shifts
                const shiftsText = (task.shifts || []).join(' ').toLowerCase();
                const shiftsMatch = shiftsText.includes(searchLower);

                return nameMatch || shiftsMatch;
            }

            return true;
        });
    }, [tasks, searchTerm, filterType, filterTimeframe, filterStatus, services]);

    // Statistics (based on all tasks, not filtered)
    const stats = useMemo(() => {
        return {
            total: tasks.length,
            pending: tasks.filter(t => computeTaskStatus(t) === 'pending').length,
            inProgress: tasks.filter(t => computeTaskStatus(t) === 'in_progress').length,
            completed: tasks.filter(t => computeTaskStatus(t) === 'completed').length,
            upcoming: tasks.filter(t => computeTaskStatus(t) === 'upcoming').length,
            overdue: tasks.filter(t => computeTaskStatus(t) === 'overdue').length
        };
    }, [tasks]);

    const handleCreateTask = (newTask) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleUpdateTask = (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setWizardOpen(true);
    };

    const handleDeleteTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        setTaskToDelete(task);
        setConfirmDeleteOpen(true);
    };

    const confirmDeleteTask = () => {
        if (taskToDelete) {
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        }
        setConfirmDeleteOpen(false);
        setTaskToDelete(null);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
        setEditingTask(null);
    };

    const handleViewTask = (task) => {
        setDetailsTask(task);
        setDetailsOpen(true);
    };

    if (isLoading) {
        return <Loading message="Đang tải..." fullScreen />;
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 2.5,
                                background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.3)}`
                            }}
                        >
                            <Assignment sx={{ fontSize: 30, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600], lineHeight: 1.2 }}>
                                Quản lý nhiệm vụ
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                Phân công và theo dõi nhiệm vụ hàng ngày
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => window.location.reload()}
                            sx={{
                                borderColor: COLORS.ERROR[300],
                                color: COLORS.ERROR[600],
                                fontWeight: 600,
                                '&:hover': {
                                    borderColor: COLORS.ERROR[500],
                                    bgcolor: alpha(COLORS.ERROR[50], 0.5)
                                }
                            }}
                        >
                            Làm mới
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setWizardOpen(true)}
                            sx={{
                                backgroundColor: COLORS.ERROR[500],
                                fontWeight: 700,
                                px: 3,
                                boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.3)}`,
                                '&:hover': {
                                    backgroundColor: COLORS.ERROR[600],
                                    boxShadow: `0 6px 16px ${alpha(COLORS.ERROR[600], 0.4)}`
                                }
                            }}
                        >
                            Tạo nhiệm vụ mới
                        </Button>
                    </Stack>
                </Stack>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Assignment sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                    {stats.total}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600 }}>
                                    Tổng nhiệm vụ
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.8)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.INFO[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Schedule sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                    {stats.upcoming}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.INFO[600], fontWeight: 600 }}>
                                    Sắp tới
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.8)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.WARNING[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.WARNING[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.WARNING[400]} 0%, ${COLORS.WARNING[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Pending sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                    {stats.inProgress}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.WARNING[600], fontWeight: 600 }}>
                                    Đang thực hiện
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.8)} 0%, ${alpha(COLORS.SUCCESS[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.SUCCESS[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.SUCCESS[400]} 0%, ${COLORS.SUCCESS[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                    {stats.completed}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600 }}>
                                    Hoàn thành
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.ERROR[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Warning sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                    {stats.overdue}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], fontWeight: 600 }}>
                                    Quá hạn
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Search and Filters */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 3,
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                        background: alpha(COLORS.BACKGROUND.PAPER, 0.6)
                    }}
                >
                    <Stack spacing={2.5}>
                        {/* Header */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <FilterList sx={{ color: COLORS.ERROR[600], fontSize: 24 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[700] }}>
                                Bộ lọc & Tìm kiếm
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Chip
                                label={`${filteredTasks.length} nhiệm vụ`}
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    bgcolor: alpha(COLORS.ERROR[100], 0.8),
                                    color: COLORS.ERROR[700]
                                }}
                            />
                        </Stack>

                        <Divider />

                        {/* Search */}
                        <TextField
                            placeholder="Tìm kiếm theo tên nhiệm vụ, ca làm việc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: COLORS.ERROR[400] }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: COLORS.ERROR[400]
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: COLORS.ERROR[500],
                                        borderWidth: 2
                                    }
                                }
                            }}
                        />

                        {/* Filters Row */}
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            <FormControl sx={{ minWidth: 200, flex: 1 }}>
                                <InputLabel sx={{ fontWeight: 600 }}>Loại nhiệm vụ</InputLabel>
                                <Select
                                    label="Loại nhiệm vụ"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(COLORS.ERROR[300], 0.5)
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[400]
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[500],
                                            borderWidth: 2
                                        }
                                    }}
                                >
                                    <MenuItem value="all">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Assignment sx={{ fontSize: 18 }} />
                                            <span>Tất cả loại</span>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="internal">
                                        <Chip label="Nội bộ" size="small" color="primary" />
                                    </MenuItem>
                                    <MenuItem value="service">
                                        <Chip label="Dịch vụ" size="small" color="secondary" />
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl sx={{ minWidth: 200, flex: 1 }}>
                                <InputLabel sx={{ fontWeight: 600 }}>Khung thời gian</InputLabel>
                                <Select
                                    label="Khung thời gian"
                                    value={filterTimeframe}
                                    onChange={(e) => setFilterTimeframe(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(COLORS.ERROR[300], 0.5)
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[400]
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[500],
                                            borderWidth: 2
                                        }
                                    }}
                                >
                                    <MenuItem value="all">Tất cả khung giờ</MenuItem>
                                    <MenuItem value="day">📅 Theo ngày</MenuItem>
                                    <MenuItem value="week">📆 Theo tuần</MenuItem>
                                    <MenuItem value="month">🗓️ Theo tháng</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl sx={{ minWidth: 200, flex: 1 }}>
                                <InputLabel sx={{ fontWeight: 600 }}>Trạng thái</InputLabel>
                                <Select
                                    label="Trạng thái"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(COLORS.ERROR[300], 0.5)
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[400]
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: COLORS.ERROR[500],
                                            borderWidth: 2
                                        }
                                    }}
                                >
                                    <MenuItem value="all">Tất cả trạng thái</MenuItem>
                                    <MenuItem value="pending">
                                        <Chip
                                            label="Chưa bắt đầu"
                                            size="small"
                                            sx={{ bgcolor: alpha(COLORS.TEXT.SECONDARY, 0.1) }}
                                        />
                                    </MenuItem>
                                    <MenuItem value="in_progress">
                                        <Chip
                                            label="Đang thực hiện"
                                            size="small"
                                            color="warning"
                                        />
                                    </MenuItem>
                                    <MenuItem value="completed">
                                        <Chip
                                            label="Hoàn thành"
                                            size="small"
                                            color="success"
                                        />
                                    </MenuItem>
                                    <MenuItem value="upcoming">
                                        <Chip
                                            label="Sắp tới"
                                            size="small"
                                            color="info"
                                        />
                                    </MenuItem>
                                    <MenuItem value="overdue">
                                        <Chip
                                            label="Quá hạn"
                                            size="small"
                                            color="error"
                                        />
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Task List */}
                <TaskList
                    tasks={filteredTasks}
                    services={services}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onViewTask={handleViewTask}
                />
            </Box>

            {/* Task Creation/Edit Wizard */}
            <TaskFormModal
                open={wizardOpen}
                onClose={handleCloseWizard}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                editingTask={editingTask}
                services={services}
                areas={areas}
                staff={staff}
                petGroupNames={petGroupNames}
                petGroupsMap={petGroupsMap}
            />

            {/* Task Details */}
            <TaskDetailsModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                task={detailsTask}
                services={services}
                areas={areas}
                staff={staff}
                petGroupsMap={petGroupsMap}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={confirmDeleteTask}
                title="Xóa nhiệm vụ"
                message={`Bạn có chắc chắn muốn xóa nhiệm vụ "${taskToDelete?.internalName || taskToDelete?.serviceName || ''}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />
        </Box>
    );
};

export default TasksPage;
