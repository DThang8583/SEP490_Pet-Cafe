import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Toolbar, Button, FormControl, InputLabel, Select, MenuItem, Tooltip, alpha, Menu, ListItemIcon, ListItemText, Tabs, Tab } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, PlayArrow, Cancel, NavigateBefore, NavigateNext, TrendingUp, Notes as NotesIcon, Flag, Block, SkipNext, MoreVert as MoreVertIcon, Add as AddIcon, Visibility as VisibilityIcon, CalendarMonth, ViewWeek } from '@mui/icons-material';
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
        completion_rate: 0,
        week_completion_rate: 0,
        month_completion_rate: 0
    });

    // View mode: 'week' or 'month'
    const [viewMode, setViewMode] = useState('week');

    // Week navigation
    const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

    // Month navigation
    const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    // Filters (Only Status and Team as per API parameters)
    const [filterStatus, setFilterStatus] = useState('all');
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

    // Get month start (first day of month)
    function getMonthStart(date) {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Get month end (last day of month)
    function getMonthEnd(monthStart) {
        const d = new Date(monthStart);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0); // Last day of previous month
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Load data when view mode, date, or filters change
    useEffect(() => {
        loadDailyTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, currentWeekStart, currentMonth, filterStatus, filterTeam]);

    // Reset page when filters or view mode change
    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterTeam, viewMode]);

    const loadDailyTasks = async () => {
        try {
            setLoading(true);

            // Format dates for API (YYYY-MM-DD)
            const formatDateForAPI = (date) => {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Determine date range based on view mode
            let startDate, endDate;
            if (viewMode === 'month') {
                startDate = getMonthStart(currentMonth);
                endDate = getMonthEnd(currentMonth);
            } else {
                startDate = currentWeekStart;
                endDate = getWeekEnd(currentWeekStart);
            }

            const fromDate = formatDateForAPI(startDate);
            const toDate = formatDateForAPI(endDate);

            console.log('📅 Loading daily tasks:', {
                viewMode,
                fromDate,
                toDate,
                filterTeam,
                filterStatus
            });

            // Get daily tasks from official API
            // Try without date filters first to see if API returns any data
            const response = await dailyTasksApi.getDailyTasksFromAPI({
                page_index: 0,
                page_size: 1000, // Get all tasks for the week
                // Temporarily remove date filters to test if API returns data
                // FromDate: fromDate,
                // ToDate: toDate,
                TeamId: filterTeam !== 'all' ? filterTeam : null,
                Status: filterStatus !== 'all' ? filterStatus : null
            });

            console.log('✅ Daily tasks response:', {
                success: response.success,
                dataLength: response.data?.length,
                data: response.data
            });

            let allTasks = [];
            if (response.success) {
                allTasks = response.data || [];
            } else {
                console.warn('⚠️ API response was not successful:', response);
                allTasks = [];
            }

            // Filter by date range on client side (since we're not using date filters in API for now)
            const filterStartDate = new Date(startDate);
            filterStartDate.setHours(0, 0, 0, 0);
            const filterEndDate = new Date(endDate);
            filterEndDate.setHours(23, 59, 59, 999);

            const tasksInRange = allTasks.filter(task => {
                if (!task.assigned_date) return false;
                const taskDate = new Date(task.assigned_date);
                return taskDate >= filterStartDate && taskDate <= filterEndDate;
            });

            console.log('📊 Filtered tasks:', {
                viewMode,
                allTasksCount: allTasks.length,
                filteredTasksCount: tasksInRange.length,
                dateRange: {
                    from: filterStartDate.toISOString(),
                    to: filterEndDate.toISOString()
                }
            });

            setDailyTasks(tasksInRange);
            const total = tasksInRange.length;
            const scheduled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SCHEDULED).length;
            const in_progress = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.IN_PROGRESS).length;
            const completed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.COMPLETED).length;
            const cancelled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.CANCELLED).length;
            const missed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.MISSED).length;
            const skipped = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SKIPPED).length;
            const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Calculate week completion rate for the currently viewed week
            const viewedWeekStart = currentWeekStart;
            const viewedWeekEnd = getWeekEnd(viewedWeekStart);
            const weekStartDate = new Date(viewedWeekStart);
            weekStartDate.setHours(0, 0, 0, 0);
            const weekEndDate = new Date(viewedWeekEnd);
            weekEndDate.setHours(23, 59, 59, 999);

            const weekTasks = allTasks.filter(task => {
                if (!task.assigned_date) return false;
                const taskDate = new Date(task.assigned_date);
                return taskDate >= weekStartDate && taskDate <= weekEndDate;
            });
            const weekTotal = weekTasks.length;
            const weekCompleted = weekTasks.filter(dt => dt.status === DAILY_TASK_STATUS.COMPLETED).length;
            const week_completion_rate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

            // Calculate month completion rate for the currently viewed month
            const viewedMonthStart = getMonthStart(currentMonth);
            const viewedMonthEnd = getMonthEnd(viewedMonthStart);
            const monthStartDate = new Date(viewedMonthStart);
            monthStartDate.setHours(0, 0, 0, 0);
            const monthEndDate = new Date(viewedMonthEnd);
            monthEndDate.setHours(23, 59, 59, 999);

            const monthTasks = allTasks.filter(task => {
                if (!task.assigned_date) return false;
                const taskDate = new Date(task.assigned_date);
                return taskDate >= monthStartDate && taskDate <= monthEndDate;
            });
            const monthTotal = monthTasks.length;
            const monthCompleted = monthTasks.filter(dt => dt.status === DAILY_TASK_STATUS.COMPLETED).length;
            const month_completion_rate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

            setStats({
                total,
                scheduled,
                in_progress,
                completed,
                cancelled,
                missed,
                skipped,
                completion_rate,
                week_completion_rate,
                month_completion_rate
            });
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

    // Month navigation
    const goToPreviousMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setCurrentMonth(newMonth);
    };

    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
    };

    const goToCurrentMonth = () => {
        setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    };

    // Get month name in Vietnamese
    const getMonthName = (date) => {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return months[date.getMonth()];
    };

    // Get date range string
    const getDateRangeString = () => {
        if (viewMode === 'month') {
            const monthStart = getMonthStart(currentMonth);
            const monthEnd = getMonthEnd(currentMonth);
            return `${monthStart.toLocaleDateString('vi-VN')} - ${monthEnd.toLocaleDateString('vi-VN')}`;
        } else {
            const weekEnd = getWeekEnd(currentWeekStart);
            return `${currentWeekStart.toLocaleDateString('vi-VN')} - ${weekEnd.toLocaleDateString('vi-VN')}`;
        }
    };

    // Filter daily tasks (Only Status and Team as per API parameters)
    const filteredDailyTasks = useMemo(() => {
        let filtered = [...dailyTasks];

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(dt => dt.status === filterStatus);
        }

        // Team filter
        if (filterTeam !== 'all') {
            filtered = filtered.filter(dt => dt.team_id === filterTeam);
        }

        // Sort by assigned_date descending (newest first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.assigned_date);
            const dateB = new Date(b.assigned_date);
            return dateB - dateA; // Descending order (mới nhất lên đầu)
        });

        return filtered;
    }, [dailyTasks, filterStatus, filterTeam]);

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
                    { label: 'Tổng số', value: stats.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Hoàn thành', value: stats.completed, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Đang làm', value: stats.in_progress, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
                    { label: 'Chưa làm', value: stats.scheduled, color: COLORS.GRAY[500], valueColor: COLORS.GRAY[700] },
                    { label: 'Bỏ lỡ', value: stats.missed, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
                    { label: 'Bỏ qua', value: stats.skipped, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Đã hủy', value: stats.cancelled, color: COLORS.WARNING[400], valueColor: COLORS.WARNING[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${8 * 16}px) / 9)`;
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

                {/* Week Progress Card */}
                <Box
                    sx={{
                        flex: `0 0 calc((100% - ${8 * 16}px) / 9)`,
                        width: `calc((100% - ${8 * 16}px) / 9)`,
                        maxWidth: `calc((100% - ${8 * 16}px) / 9)`,
                        minWidth: 0
                    }}
                >
                    <Paper sx={{
                        p: 2.5,
                        borderTop: `4px solid ${COLORS.SUCCESS[400]}`,
                        borderRadius: 2,
                        height: '100%',
                        boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <ViewWeek sx={{ fontSize: 18, color: COLORS.SUCCESS[600] }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Tiến độ tuần
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem' }}>
                            {currentWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {getWeekEnd(currentWeekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.week_completion_rate}%
                            </Typography>
                            <TrendingUp fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                        </Stack>
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: alpha(COLORS.SUCCESS[200], 0.3),
                            borderRadius: 0
                        }}>
                            <Box sx={{
                                height: '100%',
                                width: `${stats.week_completion_rate}%`,
                                bgcolor: COLORS.SUCCESS[600],
                                transition: 'width 0.5s ease',
                                borderRadius: 0
                            }} />
                        </Box>
                    </Paper>
                </Box>

                {/* Month Progress Card */}
                <Box
                    sx={{
                        flex: `0 0 calc((100% - ${8 * 16}px) / 9)`,
                        width: `calc((100% - ${8 * 16}px) / 9)`,
                        maxWidth: `calc((100% - ${8 * 16}px) / 9)`,
                        minWidth: 0
                    }}
                >
                    <Paper sx={{
                        p: 2.5,
                        borderTop: `4px solid ${COLORS.SUCCESS[500]}`,
                        borderRadius: 2,
                        height: '100%',
                        boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <CalendarMonth sx={{ fontSize: 18, color: COLORS.SUCCESS[600] }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Tiến độ tháng
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem' }}>
                            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.month_completion_rate}%
                            </Typography>
                            <TrendingUp fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                        </Stack>
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: alpha(COLORS.SUCCESS[200], 0.3),
                            borderRadius: 0
                        }}>
                            <Box sx={{
                                height: '100%',
                                width: `${stats.month_completion_rate}%`,
                                bgcolor: COLORS.SUCCESS[600],
                                transition: 'width 0.5s ease',
                                borderRadius: 0
                            }} />
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* View Mode Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={viewMode}
                    onChange={(e, newValue) => setViewMode(newValue)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: 48
                        }
                    }}
                >
                    <Tab
                        icon={<ViewWeek sx={{ fontSize: 20 }} />}
                        iconPosition="start"
                        label="Theo tuần"
                        value="week"
                        sx={{ minWidth: 150 }}
                    />
                    <Tab
                        icon={<CalendarMonth sx={{ fontSize: 20 }} />}
                        iconPosition="start"
                        label="Theo tháng"
                        value="month"
                        sx={{ minWidth: 150 }}
                    />
                </Tabs>
            </Paper>

            {/* Date Navigation */}
            <Paper sx={{ mb: 2, p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                            onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
                            size="small"
                        >
                            <NavigateBefore />
                        </IconButton>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={700} color={COLORS.PRIMARY[700]}>
                                {viewMode === 'month'
                                    ? `${getMonthName(currentMonth)} ${currentMonth.getFullYear()}`
                                    : `Tuần ${Math.ceil((currentWeekStart.getDate() + 6) / 7)}`
                                }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {getDateRangeString()}
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
                            size="small"
                        >
                            <NavigateNext />
                        </IconButton>

                        <Button
                            size="small"
                            variant="outlined"
                            onClick={viewMode === 'week' ? goToCurrentWeek : goToCurrentMonth}
                        >
                            {viewMode === 'month' ? 'Tháng này' : 'Tuần này'}
                        </Button>
                    </Stack>

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
            </Toolbar>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }} width="3%">STT</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="7%">Ngày</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="15%">Nhiệm vụ</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="12%">Team</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="8%">Ưu tiên</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="10%">Thời gian</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="12%">Trạng thái</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="10%">Hoàn thành</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="5%">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedDailyTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {viewMode === 'month'
                                            ? 'Không có nhiệm vụ nào trong tháng này'
                                            : 'Không có nhiệm vụ nào trong tuần này'
                                        }
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedDailyTasks.map((dailyTask, index) => {
                                const statusDisplay = getStatusDisplay(dailyTask.status);
                                // Get priority from task template, fallback to daily task
                                const taskPriority = dailyTask.task?.priority || dailyTask.priority;
                                const priorityDisplay = getPriorityDisplay(taskPriority);
                                const assignedDate = dailyTask.assigned_date ? new Date(dailyTask.assigned_date) : new Date();

                                // Get task info from task template
                                const taskTitle = dailyTask.task?.title || dailyTask.task?.name || dailyTask.title;
                                const taskDescription = dailyTask.task?.description || dailyTask.description;

                                // Get time from slot, fallback to daily task
                                const startTime = dailyTask.slot?.start_time || dailyTask.start_time;
                                const endTime = dailyTask.slot?.end_time || dailyTask.end_time;

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
                                            <Tooltip title={taskDescription || ''}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {taskTitle}
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
                                                {startTime?.substring(0, 5)} - {endTime?.substring(0, 5)}
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
                    page={page}
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
