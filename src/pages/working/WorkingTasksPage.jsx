import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Chip, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, alpha, Snackbar, Alert, Skeleton, Tabs, Tab, IconButton, Menu, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { Assignment, TaskAlt, ViewWeek, CalendarMonth, NavigateBefore, NavigateNext, CheckCircle, PlayArrow, Cancel, Block, RadioButtonUnchecked, MoreVert, Visibility, Add, SkipNext } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';
import { useLocation } from 'react-router-dom';
import DailyTaskDetailsModal from '../../components/modals/DailyTaskDetailsModal';
import VaccinationRecordModal from '../../components/modals/VaccinationRecordModal';
import { TASK_PRIORITY } from '../../api/dailyTasksApi';
import { createVaccinationRecord } from '../../api/vaccinationRecordsApi';
import { updateVaccinationSchedule, getVaccinationScheduleById } from '../../api/vaccinationSchedulesApi';

const getStatusDisplay = (status) => {
    switch (status) {
        case 'COMPLETED':
            return {
                icon: <CheckCircle fontSize="small" />,
                label: 'Hoàn thành',
                color: COLORS.SUCCESS[600],
                bg: alpha(COLORS.SUCCESS[100], 0.8)
            };
        case 'IN_PROGRESS':
            return {
                icon: <PlayArrow fontSize="small" />,
                label: 'Đang làm',
                color: COLORS.INFO[600],
                bg: alpha(COLORS.INFO[100], 0.8)
            };
        case 'CANCELLED':
            return {
                icon: <Cancel fontSize="small" />,
                label: 'Đã hủy',
                color: COLORS.WARNING[600],
                bg: alpha(COLORS.WARNING[100], 0.8)
            };
        case 'MISSED':
            return {
                icon: <Block fontSize="small" />,
                label: 'Bỏ lỡ',
                color: COLORS.ERROR[600],
                bg: alpha(COLORS.ERROR[100], 0.8)
            };
        case 'SKIPPED':
            return {
                icon: <SkipNext fontSize="small" />,
                label: 'Bỏ qua',
                color: COLORS.WARNING[600],
                bg: alpha(COLORS.WARNING[100], 0.8)
            };
        default: // SCHEDULED
            return {
                icon: <RadioButtonUnchecked fontSize="small" />,
                label: 'Đã lên lịch',
                color: COLORS.GRAY[600],
                bg: alpha(COLORS.GRAY[100], 0.8)
            };
    }
};

// Format time from "07:17:34.2390000" to "07:17"
const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    // Extract HH:mm from time string
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    if (match) {
        return `${match[1]}:${match[2]}`;
    }
    return timeStr.substring(0, 5); // Fallback
};

// Format completion date from ISO string to "DD/MM/YYYY HH:mm"
const formatCompletionDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.warn('Failed to format completion date:', dateStr, error);
        return '—';
    }
};

// Priority display
const getPriorityDisplay = (priority) => {
    switch (priority) {
        case TASK_PRIORITY.URGENT:
            return { label: 'Khẩn cấp', color: COLORS.ERROR[600], bg: alpha(COLORS.ERROR[100], 0.8) };
        case TASK_PRIORITY.HIGH:
            return { label: 'Cao', color: COLORS.WARNING[600], bg: alpha(COLORS.WARNING[100], 0.8) };
        case TASK_PRIORITY.MEDIUM:
            return { label: 'Trung bình', color: COLORS.INFO[600], bg: alpha(COLORS.INFO[100], 0.8) };
        case TASK_PRIORITY.LOW:
            return { label: 'Thấp', color: COLORS.GRAY[600], bg: alpha(COLORS.GRAY[100], 0.8) };
        default:
            return { label: priority || 'N/A', color: COLORS.GRAY[600], bg: alpha(COLORS.GRAY[100], 0.8) };
    }
};

const WorkingTasksPage = () => {
    const location = useLocation();
    const locationTeamId = location.state?.teamId;
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        // Get Monday of current week
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

    // Menu state for MoreVert
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // Detail modal state
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // VaccinationRecord modal state
    const [vaccinationRecordModalOpen, setVaccinationRecordModalOpen] = useState(false);
    const [selectedVaccinationSchedule, setSelectedVaccinationSchedule] = useState(null);
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);

    // Get current user profile (EXACTLY like WorkingAttendancePage line 92-100)
    const [profileData] = useState(() => {
        const p = workingStaffApi.getProfile();
        return {
            id: p?.id,
            employee_id: p?.employee_id,
            account_id: p?.account_id,
            email: p?.email || p?.account?.email,
            leader: p?.leader || false
        };
    });

    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                if (mounted) {
                    setTeams(data);
                    if (locationTeamId) {
                        setSelectedTeam(locationTeamId);
                    } else if (data.length > 0) {
                        // Default to first team, not 'all'
                        setSelectedTeam(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load teams', error);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, [locationTeamId]);

    // Helper function to get week start (Monday)
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    // Calculate date range based on viewMode
    useEffect(() => {
        let fromDate, toDate;

        if (viewMode === 'week') {
            fromDate = new Date(currentWeekStart);
            toDate = new Date(currentWeekStart);
            toDate.setDate(toDate.getDate() + 6);
            toDate.setHours(23, 59, 59, 999);
        } else {
            // Month
            fromDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            toDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            toDate.setHours(23, 59, 59, 999);
        }

        setDateRange({
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0]
        });
    }, [viewMode, currentWeekStart, currentMonth]);

    // Navigation functions
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
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    // Get month name in Vietnamese
    const getMonthName = (date) => {
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return monthNames[date.getMonth()];
    };

    // Get week number (ISO week number)
    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Format date range string
    const getDateRangeString = () => {
        if (!dateRange.fromDate || !dateRange.toDate) return '';
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        };
        return `${formatDate(dateRange.fromDate)} - ${formatDate(dateRange.toDate)}`;
    };

    useEffect(() => {
        if (!dateRange.fromDate || !dateRange.toDate) return;
        if (teams.length === 0) return; // Wait for teams to load
        if (selectedTeam !== 'all' && !selectedTeam) return; // Wait for team selection

        let mounted = true;
        const loadTasks = async () => {
            setLoading(true);
            try {
                let allTasks = [];

                if (selectedTeam === 'all') {
                    // Load tasks for all teams that user belongs to (only user's teams)
                    if (teams.length === 0) {
                        if (mounted) setTasks([]);
                        return;
                    }
                    // Get team IDs that user belongs to
                    const userTeamIds = teams.map(team => team.id);

                    // Load tasks for each team using TeamId parameter
                    const teamTasksPromises = userTeamIds.map(teamId =>
                        workingStaffApi.getTeamDailyTasksInRange(teamId, dateRange.fromDate, dateRange.toDate)
                    );
                    const results = await Promise.allSettled(teamTasksPromises);
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            // Filter to ensure tasks belong to user's teams
                            const teamTasks = (result.value || []).filter(task => {
                                const taskTeamId = task.team_id || task.team?.id;
                                return userTeamIds.includes(taskTeamId);
                            });
                            allTasks.push(...teamTasks);
                        } else {
                            console.warn(`Failed to load tasks for team ${teams[index]?.name}`, result.reason);
                        }
                    });
                } else if (selectedTeam) {
                    // Load tasks for selected team (must be one of user's teams)
                    const isUserTeam = teams.some(team => team.id === selectedTeam);
                    if (!isUserTeam) {
                        console.warn('Selected team is not one of user\'s teams');
                        if (mounted) setTasks([]);
                        return;
                    }
                    const data = await workingStaffApi.getTeamDailyTasksInRange(selectedTeam, dateRange.fromDate, dateRange.toDate);
                    // Filter to ensure tasks belong to selected team
                    allTasks = (data || []).filter(task => {
                        const taskTeamId = task.team_id || task.team?.id;
                        return taskTeamId === selectedTeam;
                    });
                }

                // Remove duplicates and sort by date and time
                const uniqueTasks = Array.from(
                    new Map(allTasks.map(task => [task.id, task])).values()
                );

                // Auto-mark MISSED for tasks past their assigned date that are still SCHEDULED
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tasksWithAutoMissed = [];
                const tasksToUpdate = [];

                for (const task of uniqueTasks) {
                    if (task.status === 'SCHEDULED' && task.assigned_date) {
                        const assignedDate = new Date(task.assigned_date);
                        assignedDate.setHours(0, 0, 0, 0);

                        if (assignedDate < today) {
                            tasksWithAutoMissed.push({ ...task, status: 'MISSED' });
                            tasksToUpdate.push({ taskId: task.id, status: 'MISSED' });
                        } else {
                            tasksWithAutoMissed.push(task);
                        }
                    } else {
                        tasksWithAutoMissed.push(task);
                    }
                }

                // Silently update MISSED status in background
                if (tasksToUpdate.length > 0 && mounted) {
                    Promise.allSettled(
                        tasksToUpdate.map(({ taskId, status }) =>
                            workingStaffApi.updateDailyTaskStatus(taskId, status).catch(() => null)
                        )
                    );
                }

                tasksWithAutoMissed.sort((a, b) => {
                    const dateCompare = (a.assigned_date || '').localeCompare(b.assigned_date || '');
                    if (dateCompare !== 0) return dateCompare;
                    return (a.start_time || '').localeCompare(b.start_time || '');
                });

                if (mounted) setTasks(tasksWithAutoMissed);
            } catch (error) {
                console.error('Failed to load tasks', error);
                if (mounted) {
                    setSnackbar({ message: 'Không thể tải danh sách nhiệm vụ', severity: 'error' });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadTasks();
        return () => {
            mounted = false;
        };
    }, [selectedTeam, dateRange, teams]);

    const selectedTeamObject = useMemo(() => {
        if (selectedTeam === 'all' || !selectedTeam) return null;
        return teams.find((team) => team.id === selectedTeam);
    }, [teams, selectedTeam]);


    // Check if current user is leader of the team for a task by comparing email
    const isLeaderOfTaskTeam = useMemo(() => {
        return (task) => {
            if (!task || !profileData.email) return false;

            const taskTeamId = task.team_id || task.team?.id;
            if (!taskTeamId) return false;

            let team = task.team;
            if (!team || !team.leader) {
                team = teams.find(t => t.id === taskTeamId);
            }

            if (!team?.leader?.email) return false;

            return profileData.email.toLowerCase().trim() === team.leader.email.toLowerCase().trim();
        };
    }, [teams, profileData.email]);


    const handleUpdateStatus = async (taskId, status) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            await workingStaffApi.updateDailyTaskStatus(taskId, status);

            // If task is cancelled, missed, or skipped, cancel related vaccination schedule
            if ((status === 'CANCELLED' || status === 'MISSED' || status === 'SKIPPED') && task?.vaccination_schedule_id) {
                try {
                    await updateVaccinationSchedule(task.vaccination_schedule_id, { status: 'CANCELLED' });
                    console.log('✅ Vaccination schedule cancelled:', task.vaccination_schedule_id);
                } catch (error) {
                    console.error('Failed to cancel vaccination schedule:', error);
                    // Don't show error to user, just log it
                }
            }

            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
            setSnackbar({ message: 'Cập nhật trạng thái thành công', severity: 'success' });
            setMenuAnchor(null);
            setSelectedTask(null);
        } catch (error) {
            console.error('Failed to update task status', error);
            setSnackbar({ message: 'Không thể cập nhật trạng thái', severity: 'error' });
        }
    };

    const handleOpenVaccinationRecordModal = async (task) => {
        if (!task.vaccination_schedule_id) {
            setSnackbar({ message: 'Không tìm thấy lịch tiêm liên quan', severity: 'error' });
            return;
        }

        try {
            // Fetch vaccination schedule details
            const schedule = await getVaccinationScheduleById(task.vaccination_schedule_id);
            setSelectedVaccinationSchedule(schedule);
            setSelectedTask(task);
            setVaccinationRecordModalOpen(true);
        } catch (error) {
            console.error('Failed to load vaccination schedule:', error);
            setSnackbar({ message: 'Không thể tải thông tin lịch tiêm', severity: 'error' });
        }
    };

    const handleCreateVaccinationRecord = async (recordData) => {
        if (!selectedTask || !selectedVaccinationSchedule) return;

        setIsCreatingRecord(true);
        try {
            // Create vaccination record
            await createVaccinationRecord(recordData);

            // Update vaccination schedule status to COMPLETED
            await updateVaccinationSchedule(selectedVaccinationSchedule.id, { status: 'COMPLETED' });

            // Update task in local state
            setTasks((prev) => prev.map((task) =>
                task.id === selectedTask.id
                    ? { ...task, vaccination_schedule: { ...task.vaccination_schedule, status: 'COMPLETED' } }
                    : task
            ));

            setSnackbar({ message: 'Tạo hồ sơ tiêm phòng và cập nhật lịch tiêm thành công', severity: 'success' });
            setVaccinationRecordModalOpen(false);
            setSelectedVaccinationSchedule(null);
            setSelectedTask(null);
        } catch (error) {
            console.error('Failed to create vaccination record:', error);
            const errorMessage = error.message || 'Không thể tạo hồ sơ tiêm phòng';
            setSnackbar({ message: errorMessage, severity: 'error' });
        } finally {
            setIsCreatingRecord(false);
        }
    };

    const handleOpenMenu = (event, task) => {
        setMenuAnchor(event.currentTarget);
        setSelectedTask(task);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        // Don't clear selectedTask here, it will be cleared when modal closes
    };

    const handleViewDetails = () => {
        setMenuAnchor(null); // Close menu first
        // Use setTimeout to ensure menu closes before opening modal
        setTimeout(() => {
            setDetailModalOpen(true);
        }, 100);
    };

    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
        setSelectedTask(null); // Clear selectedTask when modal closes
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100%' }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Nhiệm vụ hằng ngày
                    </Typography>
                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        Xem và quản lý các nhiệm vụ hằng ngày của các đội nhóm bạn tham gia. Chọn nhóm và ngày để xem chi tiết nhiệm vụ, cập nhật tiến độ trong ca làm.
                    </Typography>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        mb: 2
                    }}
                >
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Chọn nhóm
                        </Typography>
                        <TextField
                            select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            placeholder="Chọn nhóm"
                            fullWidth
                        >
                            <MenuItem value="all">
                                <Typography sx={{ fontWeight: 600 }}>Tất cả</Typography>
                            </MenuItem>
                            {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    {team.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Paper>

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
                            },
                            '& .Mui-selected': {
                                color: COLORS.PRIMARY[700]
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: COLORS.PRIMARY[700]
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
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }
                                }}
                            >
                                <NavigateBefore />
                            </IconButton>

                            <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                                <Typography variant="h6" fontWeight={700} color={COLORS.PRIMARY[700]}>
                                    {viewMode === 'month'
                                        ? `${getMonthName(currentMonth)} ${currentMonth.getFullYear()}`
                                        : `Tuần ${getWeekNumber(currentWeekStart)}`
                                    }
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {getDateRangeString()}
                                </Typography>
                            </Box>

                            <IconButton
                                onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
                                size="small"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }
                                }}
                            >
                                <NavigateNext />
                            </IconButton>

                            <Button
                                size="small"
                                variant="outlined"
                                onClick={viewMode === 'week' ? goToCurrentWeek : goToCurrentMonth}
                                sx={{
                                    borderColor: COLORS.PRIMARY[600],
                                    color: COLORS.PRIMARY[600],
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    '&:hover': {
                                        borderColor: COLORS.PRIMARY[700],
                                        bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                    }
                                }}
                            >
                                {viewMode === 'month' ? 'THÁNG NÀY' : 'TUẦN NÀY'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {(selectedTeamObject || selectedTeam === 'all') && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                            <Stack spacing={1}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {selectedTeam === 'all' ? 'Tất cả các nhóm' : selectedTeamObject?.name}
                                </Typography>
                                {selectedTeam === 'all' ? (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Nhiệm vụ từ tất cả các đội nhóm bạn tham gia
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {selectedTeamObject?.work_type?.name || 'Loại công việc'} •{' '}
                                        {selectedTeamObject?.area?.name || 'Khu vực'}
                                    </Typography>
                                )}
                                {dateRange.fromDate && dateRange.toDate && (
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                        Khoảng thời gian: {getDateRangeString()}
                                    </Typography>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <Chip icon={<Assignment />} label={`${tasks.length} nhiệm vụ`} />
                                {selectedTeam === 'all' ? (
                                    <Chip icon={<TaskAlt />} label={`${teams.length} nhóm`} />
                                ) : (
                                    <Chip icon={<TaskAlt />} label={`${selectedTeamObject?.members?.length || 0} thành viên`} />
                                )}
                            </Stack>
                        </Stack>
                    </Paper>
                )}

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                    }}
                >
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <Skeleton variant="rounded" height={300} />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[50], 0.3) }}>
                                        {selectedTeam === 'all' && (
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                                Nhóm
                                            </TableCell>
                                        )}
                                        {viewMode === 'month' && (
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                                Ngày
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Nhiệm vụ
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Độ ưu tiên
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Thời gian
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Khu vực
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Trạng thái
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Thời gian hoàn thành
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Hành động
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    (selectedTeam === 'all' ? 1 : 0) +
                                                    (viewMode === 'month' ? 1 : 0) +
                                                    7
                                                }
                                                align="center"
                                                sx={{
                                                    py: 8,
                                                    color: COLORS.TEXT.SECONDARY,
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                <Stack spacing={1} alignItems="center">
                                                    <Typography variant="body1">
                                                        {dateRange.fromDate && dateRange.toDate
                                                            ? `Không có nhiệm vụ nào trong khoảng thời gian ${getDateRangeString()}.`
                                                            : 'Không có nhiệm vụ nào.'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tasks.map((task, index) => {
                                            const taskTeam = teams.find(t => t.id === task.team_id);
                                            const statusDisplay = getStatusDisplay(task.status);
                                            const formatTaskDate = (dateStr) => {
                                                if (!dateStr) return '—';
                                                const d = new Date(dateStr);
                                                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                            };
                                            return (
                                                <TableRow
                                                    key={task.id}
                                                    hover
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor: alpha(COLORS.PRIMARY[50], 0.05)
                                                        },
                                                        borderBottom: index < tasks.length - 1 ? `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` : 'none'
                                                    }}
                                                >
                                                    {selectedTeam === 'all' && (
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                                                {taskTeam?.name || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                    )}
                                                    {viewMode === 'month' && (
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY }}>
                                                                {formatTaskDate(task.assigned_date)}
                                                            </Typography>
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                                                {task.title}
                                                            </Typography>
                                                            {task.work_type?.name && (
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {task.work_type.name}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        {(() => {
                                                            const taskPriority = task.task?.priority || task.priority;
                                                            const priorityDisplay = getPriorityDisplay(taskPriority);
                                                            return (
                                                                <Chip
                                                                    label={priorityDisplay.label}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: priorityDisplay.bg,
                                                                        color: priorityDisplay.color,
                                                                        fontWeight: 600,
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY, fontFamily: 'monospace' }}>
                                                            {formatTime(task.start_time)} - {formatTime(task.end_time)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Typography variant="body2" sx={{ color: task.area?.name ? COLORS.TEXT.PRIMARY : COLORS.TEXT.SECONDARY }}>
                                                            {task.area?.name || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Typography variant="body2" sx={{ color: task.completion_date ? COLORS.TEXT.PRIMARY : COLORS.TEXT.SECONDARY }}>
                                                            {formatCompletionDate(task.completion_date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.5 }}>
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
                                                    <TableCell align="right" sx={{ py: 2.5 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                                                            {/* Show "Tạo VaccinationRecord" button for completed tasks with vaccination_schedule_id */}
                                                            {(() => {
                                                                const canUpdate = isLeaderOfTaskTeam(task);
                                                                const isCompleted = task.status === 'COMPLETED';
                                                                const hasVaccinationSchedule = task.vaccination_schedule_id;
                                                                const scheduleNotCompleted = !task.vaccination_schedule || task.vaccination_schedule.status !== 'COMPLETED';

                                                                if (canUpdate && isCompleted && hasVaccinationSchedule && scheduleNotCompleted) {
                                                                    return (
                                                                        <Tooltip title="Tạo hồ sơ tiêm phòng" arrow placement="top">
                                                                            <Button
                                                                                size="small"
                                                                                variant="contained"
                                                                                color="success"
                                                                                startIcon={<Add fontSize="small" />}
                                                                                onClick={() => handleOpenVaccinationRecordModal(task)}
                                                                                sx={{
                                                                                    textTransform: 'none',
                                                                                    fontWeight: 600,
                                                                                    fontSize: '0.75rem',
                                                                                    px: 2,
                                                                                    py: 0.75,
                                                                                    borderRadius: 2
                                                                                }}
                                                                            >
                                                                                Tạo Hồ Sơ
                                                                            </Button>
                                                                        </Tooltip>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleOpenMenu(e, task)}
                                                                sx={{
                                                                    color: COLORS.TEXT.SECONDARY,
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.PRIMARY[50], 0.5),
                                                                        color: COLORS.PRIMARY[600]
                                                                    }
                                                                }}
                                                            >
                                                                <MoreVert fontSize="small" />
                                                            </IconButton>
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
                </Paper>
            </Stack>

            {/* MoreVert Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
            >
                <MenuItem onClick={handleViewDetails}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                {selectedTask && (() => {
                    const canUpdate = isLeaderOfTaskTeam(selectedTask);
                    const taskStatus = selectedTask.status || 'SCHEDULED';

                    if (!canUpdate || (taskStatus !== 'SCHEDULED' && taskStatus !== 'IN_PROGRESS')) {
                        return null;
                    }

                    if (taskStatus === 'SCHEDULED') {
                        return (
                            <>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'IN_PROGRESS');
                                }}>
                                    <ListItemIcon>
                                        <PlayArrow fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Bắt đầu</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'COMPLETED');
                                }}>
                                    <ListItemIcon>
                                        <CheckCircle fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Hoàn thành</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'CANCELLED');
                                }}>
                                    <ListItemIcon>
                                        <Cancel fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Hủy</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'SKIPPED');
                                }}>
                                    <ListItemIcon>
                                        <SkipNext fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Bỏ qua</ListItemText>
                                </MenuItem>
                            </>
                        );
                    }

                    if (taskStatus === 'IN_PROGRESS') {
                        return (
                            <>
                            <MenuItem onClick={() => {
                                handleUpdateStatus(selectedTask.id, 'COMPLETED');
                            }}>
                                <ListItemIcon>
                                    <CheckCircle fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Hoàn thành</ListItemText>
                            </MenuItem>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'CANCELLED');
                                }}>
                                    <ListItemIcon>
                                        <Cancel fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Hủy</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    handleUpdateStatus(selectedTask.id, 'SKIPPED');
                                }}>
                                    <ListItemIcon>
                                        <SkipNext fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Bỏ qua</ListItemText>
                                </MenuItem>
                            </>
                        );
                    }

                    return null;
                })()}
            </Menu>

            {/* Daily Task Details Modal */}
            {selectedTask && (
                <DailyTaskDetailsModal
                    open={detailModalOpen}
                    onClose={handleCloseDetailModal}
                    dailyTask={selectedTask}
                />
            )}

            {/* VaccinationRecord Modal */}
            {selectedTask && selectedVaccinationSchedule && (
                <VaccinationRecordModal
                    open={vaccinationRecordModalOpen}
                    onClose={() => {
                        setVaccinationRecordModalOpen(false);
                        setSelectedVaccinationSchedule(null);
                    }}
                    onSubmit={handleCreateVaccinationRecord}
                    dailyTask={selectedTask}
                    vaccinationSchedule={selectedVaccinationSchedule}
                    isLoading={isCreatingRecord}
                />
            )}

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default WorkingTasksPage;

