import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Toolbar, Grid, Button, FormControl, InputLabel, Select, MenuItem, Tooltip, alpha, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, PlayArrow, Cancel, Refresh as RefreshIcon, NavigateBefore, NavigateNext, TrendingUp, Notes as NotesIcon, Flag, Block, SkipNext, MoreVert as MoreVertIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import Pagination from '../../../components/common/Pagination';
import AlertModal from '../../../components/modals/AlertModal';
import DailyTaskNotesModal from '../../../components/modals/DailyTaskNotesModal';
import DailyTaskFormModal from '../../../components/modals/DailyTaskFormModal';
import DailyTaskDetailsModal from '../../../components/modals/DailyTaskDetailsModal';
import dailyTasksApi, { DAILY_TASK_STATUS, TASK_PRIORITY } from '../../../api/dailyTasksApi';
import { WEEKDAY_LABELS } from '../../../api/slotApi';

const DailyTasksTab = ({ taskTemplates, slots, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [dailyTasks, setDailyTasks] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        missed: 0,
        skipped: 0,
        completion_rate: 0
    });

    // Week navigation
    const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTask, setFilterTask] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterTeam, setFilterTeam] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Notes modal
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [selectedDailyTask, setSelectedDailyTask] = useState(null);
    const [pendingStatus, setPendingStatus] = useState(null);

    // Form modal
    const [formModalOpen, setFormModalOpen] = useState(false);

    // Details modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null);

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuTask, setMenuTask] = useState(null);

    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Get Monday of the week
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Get week end (Sunday)
    function getWeekEnd(weekStart) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Load data when week changes
    useEffect(() => {
        loadDailyTasks();
    }, [currentWeekStart, taskTemplates, slots]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterTask, filterPriority, filterTeam]);

    const loadDailyTasks = async () => {
        try {
            setLoading(true);

            const weekEnd = getWeekEnd(currentWeekStart);

            // Get daily tasks for current week (will auto-generate if needed)
            const response = await dailyTasksApi.getDailyTasksForDateRange(
                currentWeekStart,
                weekEnd,
                taskTemplates,
                slots
            );

            if (response.success) {
                setDailyTasks(response.data);
            }

            // Get statistics
            const statsResponse = await dailyTasksApi.getDailyTasksStatistics(
                currentWeekStart,
                weekEnd
            );
            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
        } catch (error) {
            console.error('Error loading daily tasks:', error);
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

    // Navigate week
    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
    };

    // Filter daily tasks
    const filteredDailyTasks = useMemo(() => {
        let filtered = [...dailyTasks];

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(dt => dt.status === filterStatus);
        }

        // Task filter
        if (filterTask !== 'all') {
            filtered = filtered.filter(dt => dt.task_id === filterTask);
        }

        // Priority filter
        if (filterPriority !== 'all') {
            filtered = filtered.filter(dt => dt.priority === filterPriority);
        }

        // Team filter
        if (filterTeam !== 'all') {
            filtered = filtered.filter(dt => dt.team_id === filterTeam);
        }

        return filtered;
    }, [dailyTasks, filterStatus, filterTask, filterPriority, filterTeam]);

    // Paginated daily tasks
    const paginatedDailyTasks = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDailyTasks.slice(startIndex, endIndex);
    }, [filteredDailyTasks, page, itemsPerPage]);

    // Total pages
    const totalPages = Math.ceil(filteredDailyTasks.length / itemsPerPage);

    // Get task name
    const getTaskName = (taskId) => {
        const task = taskTemplates.find(t => t.id === taskId);
        return task ? (task.name || task.title) : '—';
    };

    // Get slot info
    const getSlotInfo = (slotId) => {
        const slot = slots.find(s => s.id === slotId);
        return slot ? `${slot.start_time} - ${slot.end_time}` : '—';
    };

    // Open notes modal for status update
    const handleUpdateStatus = (dailyTask, newStatus) => {
        setSelectedDailyTask(dailyTask);
        setPendingStatus(newStatus);
        setNotesModalOpen(true);
    };

    // Submit status update with notes
    const handleNotesSubmit = async (notes) => {
        if (!selectedDailyTask || !pendingStatus) return;

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await dailyTasksApi.updateDailyTaskStatus(selectedDailyTask.id, {
                status: pendingStatus,
                updated_by: currentUser.id || '00000000-0000-0000-0000-000000000000',
                notes: notes
            });

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật trạng thái thành công!',
                    type: 'success'
                });

                // Reload data
                await loadDailyTasks();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật trạng thái',
                type: 'error'
            });
            throw error;
        }
    };

    // Create manual daily task
    const handleCreateDailyTask = async (formData) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await dailyTasksApi.createManualDailyTask({
                ...formData,
                created_by: currentUser.id || '00000000-0000-0000-0000-000000000000'
            });

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo nhiệm vụ thành công!',
                    type: 'success'
                });

                // Reload data
                await loadDailyTasks();
            }
        } catch (error) {
            console.error('Error creating daily task:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tạo nhiệm vụ',
                type: 'error'
            });
            throw error;
        }
    };

    // Get unique teams from daily tasks
    const uniqueTeams = useMemo(() => {
        const teamsMap = new Map();
        dailyTasks.forEach(dt => {
            if (dt.team && dt.team_id) {
                teamsMap.set(dt.team_id, dt.team);
            }
        });
        return Array.from(teamsMap.values());
    }, [dailyTasks]);

    // Status icon and color
    const getStatusDisplay = (status) => {
        switch (status) {
            case DAILY_TASK_STATUS.COMPLETED:
                return {
                    icon: <CheckCircle fontSize="small" />,
                    label: 'Hoàn thành',
                    color: COLORS.SUCCESS[600],
                    bg: alpha(COLORS.SUCCESS[100], 0.8)
                };
            case DAILY_TASK_STATUS.IN_PROGRESS:
                return {
                    icon: <PlayArrow fontSize="small" />,
                    label: 'Đang thực hiện',
                    color: COLORS.INFO[600],
                    bg: alpha(COLORS.INFO[100], 0.8)
                };
            case DAILY_TASK_STATUS.CANCELLED:
                return {
                    icon: <Cancel fontSize="small" />,
                    label: 'Đã hủy',
                    color: COLORS.WARNING[600],
                    bg: alpha(COLORS.WARNING[100], 0.8)
                };
            case DAILY_TASK_STATUS.MISSED:
                return {
                    icon: <Block fontSize="small" />,
                    label: 'Bỏ lỡ',
                    color: COLORS.ERROR[600],
                    bg: alpha(COLORS.ERROR[100], 0.8)
                };
            case DAILY_TASK_STATUS.SKIPPED:
                return {
                    icon: <SkipNext fontSize="small" />,
                    label: 'Bỏ qua',
                    color: COLORS.WARNING[500],
                    bg: alpha(COLORS.WARNING[50], 0.8)
                };
            default: // SCHEDULED
                return {
                    icon: <RadioButtonUnchecked fontSize="small" />,
                    label: 'Chưa bắt đầu',
                    color: COLORS.GRAY[600],
                    bg: alpha(COLORS.GRAY[100], 0.8)
                };
        }
    };

    // Priority display
    const getPriorityDisplay = (priority) => {
        switch (priority) {
            case TASK_PRIORITY.URGENT:
                return { label: 'Khẩn cấp', color: COLORS.ERROR[600] };
            case TASK_PRIORITY.HIGH:
                return { label: 'Cao', color: COLORS.WARNING[600] };
            case TASK_PRIORITY.MEDIUM:
                return { label: 'Trung bình', color: COLORS.INFO[600] };
            case TASK_PRIORITY.LOW:
                return { label: 'Thấp', color: COLORS.GRAY[600] };
            default:
                return { label: priority, color: COLORS.GRAY[600] };
        }
    };

    // Get week date range string
    const getWeekDateRange = () => {
        const weekEnd = getWeekEnd(currentWeekStart);
        return `${currentWeekStart.toLocaleDateString('vi-VN')} - ${weekEnd.toLocaleDateString('vi-VN')}`;
    };

    // Get weekday name from date
    const getWeekdayName = (dateStr) => {
        const date = new Date(dateStr);
        const dayIndex = date.getDay();
        return WEEKDAY_LABELS[dayIndex];
    };

    if (loading && dailyTasks.length === 0) {
        return <Loading message="Đang tải nhiệm vụ hằng ngày..." />;
    }

    return (
        <Box>
            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng số
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                            {stats.total}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Hoàn thành
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.completed}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Đang làm
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                            {stats.in_progress}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.GRAY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Chưa làm
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.GRAY[700]}>
                            {stats.scheduled}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Bỏ lỡ
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                            {stats.missed}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Bỏ qua
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.skipped}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[400]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Đã hủy
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.cancelled}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[400]}`, position: 'relative', overflow: 'hidden' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tiến độ
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.completion_rate}%
                            </Typography>
                            <TrendingUp fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                        </Stack>
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: alpha(COLORS.SUCCESS[200], 0.3)
                        }}>
                            <Box sx={{
                                height: '100%',
                                width: `${stats.completion_rate}%`,
                                bgcolor: COLORS.SUCCESS[600],
                                transition: 'width 0.5s ease'
                            }} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Week Navigation */}
            <Paper sx={{ mb: 2, p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton onClick={goToPreviousWeek} size="small">
                            <NavigateBefore />
                        </IconButton>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={700} color={COLORS.PRIMARY[700]}>
                                Tuần {Math.ceil((currentWeekStart.getDate() + 6) / 7)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {getWeekDateRange()}
                            </Typography>
                        </Box>

                        <IconButton onClick={goToNextWeek} size="small">
                            <NavigateNext />
                        </IconButton>

                        <Button
                            size="small"
                            variant="outlined"
                            onClick={goToCurrentWeek}
                        >
                            Tuần này
                        </Button>
                    </Stack>

                    <IconButton onClick={loadDailyTasks} size="small">
                        <RefreshIcon />
                    </IconButton>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setFormModalOpen(true)}
                    >
                        Tạo nhiệm vụ
                    </Button>
                </Stack>
            </Paper>

            {/* Filters */}
            <Toolbar sx={{ gap: 2, flexWrap: 'wrap', px: 0 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        label="Trạng thái"
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.SCHEDULED}>Chưa bắt đầu</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.IN_PROGRESS}>Đang làm</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.COMPLETED}>Hoàn thành</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.CANCELLED}>Đã hủy</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.MISSED}>Bỏ lỡ</MenuItem>
                        <MenuItem value={DAILY_TASK_STATUS.SKIPPED}>Bỏ qua</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Nhiệm vụ</InputLabel>
                    <Select
                        value={filterTask}
                        onChange={(e) => setFilterTask(e.target.value)}
                        label="Nhiệm vụ"
                    >
                        <MenuItem value="all">Tất cả nhiệm vụ</MenuItem>
                        {taskTemplates.map(task => (
                            <MenuItem key={task.id} value={task.id}>
                                {task.name || task.title}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Team</InputLabel>
                    <Select
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        label="Team"
                    >
                        <MenuItem value="all">Tất cả team</MenuItem>
                        {[...new Set(dailyTasks.map(dt => dt.team_id))].map(teamId => {
                            const task = dailyTasks.find(dt => dt.team_id === teamId);
                            return task && task.team ? (
                                <MenuItem key={teamId} value={teamId}>
                                    {task.team.name}
                                </MenuItem>
                            ) : null;
                        })}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Độ ưu tiên</InputLabel>
                    <Select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        label="Độ ưu tiên"
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value={TASK_PRIORITY.URGENT}>Khẩn cấp</MenuItem>
                        <MenuItem value={TASK_PRIORITY.HIGH}>Cao</MenuItem>
                        <MenuItem value={TASK_PRIORITY.MEDIUM}>Trung bình</MenuItem>
                        <MenuItem value={TASK_PRIORITY.LOW}>Thấp</MenuItem>
                    </Select>
                </FormControl>
            </Toolbar>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                        <TableRow>
                            <TableCell width="3%">STT</TableCell>
                            <TableCell width="7%">Ngày</TableCell>
                            <TableCell width="15%">Nhiệm vụ</TableCell>
                            <TableCell width="12%">Team</TableCell>
                            <TableCell width="8%">Ưu tiên</TableCell>
                            <TableCell width="10%">Thời gian</TableCell>
                            <TableCell width="12%">Trạng thái</TableCell>
                            <TableCell width="10%">Hoàn thành</TableCell>
                            <TableCell width="5%" align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedDailyTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Không có nhiệm vụ nào trong tuần này
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedDailyTasks.map((dailyTask, index) => {
                                const statusDisplay = getStatusDisplay(dailyTask.status);
                                const priorityDisplay = getPriorityDisplay(dailyTask.priority);
                                const assignedDate = dailyTask.assigned_date ? new Date(dailyTask.assigned_date) : new Date();

                                return (
                                    <TableRow key={dailyTask.id} hover>
                                        <TableCell>{(page - 1) * itemsPerPage + index + 1}</TableCell>

                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {getWeekdayName(dailyTask.assigned_date)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {assignedDate.toLocaleDateString('vi-VN')}
                                                </Typography>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip title={dailyTask.description || ''}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {dailyTask.title}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell>
                                            {dailyTask.team ? (
                                                <Tooltip title={dailyTask.team.description || ''}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {dailyTask.team.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Flag fontSize="small" sx={{ color: priorityDisplay.color }} />
                                                <Typography variant="caption" color={priorityDisplay.color} fontWeight={600}>
                                                    {priorityDisplay.label}
                                                </Typography>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {dailyTask.start_time?.substring(0, 5)} - {dailyTask.end_time?.substring(0, 5)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                icon={statusDisplay.icon}
                                                label={statusDisplay.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusDisplay.bg,
                                                    color: statusDisplay.color,
                                                    fontWeight: 600
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            {dailyTask.completion_date ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(dailyTask.completion_date).toLocaleDateString('vi-VN')}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setMenuAnchor(e.currentTarget);
                                                    setMenuTask(dailyTask);
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
            {filteredDailyTasks.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredDailyTasks.length}
                    onPageChange={setPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                        setItemsPerPage(newItemsPerPage);
                        setPage(1); // Reset to first page
                    }}
                />
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuTask(null);
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {menuTask && (
                    <MenuItem
                        onClick={() => {
                            setSelectedTaskForDetails(menuTask);
                            setDetailsModalOpen(true);
                            setMenuAnchor(null);
                            setMenuTask(null);
                        }}
                    >
                        <ListItemIcon>
                            <VisibilityIcon fontSize="small" sx={{ color: COLORS.PRIMARY[600] }} />
                        </ListItemIcon>
                        <ListItemText>Xem chi tiết</ListItemText>
                    </MenuItem>
                )}

                {menuTask && menuTask.status !== DAILY_TASK_STATUS.COMPLETED &&
                    menuTask.status !== DAILY_TASK_STATUS.CANCELLED &&
                    menuTask.status !== DAILY_TASK_STATUS.MISSED &&
                    menuTask.status !== DAILY_TASK_STATUS.SKIPPED && (
                        <>
                            {menuTask.status !== DAILY_TASK_STATUS.IN_PROGRESS && (
                                <MenuItem
                                    onClick={() => {
                                        handleUpdateStatus(menuTask, DAILY_TASK_STATUS.IN_PROGRESS);
                                        setMenuAnchor(null);
                                        setMenuTask(null);
                                    }}
                                >
                                    <ListItemIcon>
                                        <PlayArrow fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                                    </ListItemIcon>
                                    <ListItemText>Đánh dấu đang làm</ListItemText>
                                </MenuItem>
                            )}

                            <MenuItem
                                onClick={() => {
                                    handleUpdateStatus(menuTask, DAILY_TASK_STATUS.COMPLETED);
                                    setMenuAnchor(null);
                                    setMenuTask(null);
                                }}
                            >
                                <ListItemIcon>
                                    <CheckCircle fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                                </ListItemIcon>
                                <ListItemText>Hoàn thành</ListItemText>
                            </MenuItem>

                            <MenuItem
                                onClick={() => {
                                    handleUpdateStatus(menuTask, DAILY_TASK_STATUS.SKIPPED);
                                    setMenuAnchor(null);
                                    setMenuTask(null);
                                }}
                            >
                                <ListItemIcon>
                                    <SkipNext fontSize="small" sx={{ color: COLORS.WARNING[500] }} />
                                </ListItemIcon>
                                <ListItemText>Bỏ qua</ListItemText>
                            </MenuItem>

                            <MenuItem
                                onClick={() => {
                                    handleUpdateStatus(menuTask, DAILY_TASK_STATUS.MISSED);
                                    setMenuAnchor(null);
                                    setMenuTask(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Block fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                                </ListItemIcon>
                                <ListItemText>Bỏ lỡ</ListItemText>
                            </MenuItem>

                            <MenuItem
                                onClick={() => {
                                    handleUpdateStatus(menuTask, DAILY_TASK_STATUS.CANCELLED);
                                    setMenuAnchor(null);
                                    setMenuTask(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Cancel fontSize="small" sx={{ color: COLORS.WARNING[600] }} />
                                </ListItemIcon>
                                <ListItemText>Hủy bỏ</ListItemText>
                            </MenuItem>
                        </>
                    )}
            </Menu>

            {/* Create Form Modal */}
            <DailyTaskFormModal
                open={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSubmit={handleCreateDailyTask}
                teams={uniqueTeams}
                tasks={taskTemplates}
                slots={slots}
            />

            {/* Details Modal */}
            <DailyTaskDetailsModal
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedTaskForDetails(null);
                }}
                dailyTask={selectedTaskForDetails}
            />

            {/* Notes Modal */}
            <DailyTaskNotesModal
                open={notesModalOpen}
                onClose={() => {
                    setNotesModalOpen(false);
                    setSelectedDailyTask(null);
                    setPendingStatus(null);
                }}
                onSubmit={handleNotesSubmit}
                dailyTask={selectedDailyTask}
                newStatus={pendingStatus}
                taskName={selectedDailyTask ? selectedDailyTask.title : ''}
                slotInfo={selectedDailyTask ? `${selectedDailyTask.start_time?.substring(0, 5)} - ${selectedDailyTask.end_time?.substring(0, 5)}` : ''}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default DailyTasksTab;
