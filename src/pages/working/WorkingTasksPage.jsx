import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Chip, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, alpha, Snackbar, Alert, Skeleton, Tabs, Tab, IconButton } from '@mui/material';
import { Assignment, TaskAlt, ViewWeek, CalendarMonth, NavigateBefore, NavigateNext } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';
import { useLocation } from 'react-router-dom';

const statusColorMap = {
    SCHEDULED: {
        label: 'Đã lên lịch',
        color: 'default',
        bgColor: alpha(COLORS.GRAY[500], 0.1),
        textColor: COLORS.GRAY[700]
    },
    IN_PROGRESS: {
        label: 'Đang làm',
        color: 'warning',
        bgColor: alpha(COLORS.WARNING[500], 0.1),
        textColor: COLORS.WARNING[700]
    },
    COMPLETED: {
        label: 'Hoàn thành',
        color: 'success',
        bgColor: alpha(COLORS.SUCCESS[500], 0.1),
        textColor: COLORS.SUCCESS[700]
    },
    CANCELLED: {
        label: 'Đã hủy',
        color: 'error',
        bgColor: alpha(COLORS.ERROR[500], 0.1),
        textColor: COLORS.ERROR[700]
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
        if (selectedTeam === 'all' && teams.length === 0) return; // Wait for teams to load
        if (selectedTeam !== 'all' && !selectedTeam) return; // Wait for team selection

        let mounted = true;
        const loadTasks = async () => {
            setLoading(true);
            try {
                let allTasks = [];

                if (selectedTeam === 'all') {
                    // Load tasks for all teams
                    if (teams.length === 0) {
                        if (mounted) setTasks([]);
                        return;
                    }
                    const teamTasksPromises = teams.map(team =>
                        workingStaffApi.getTeamDailyTasksInRange(team.id, dateRange.fromDate, dateRange.toDate)
                    );
                    const results = await Promise.allSettled(teamTasksPromises);
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            allTasks.push(...result.value);
                        } else {
                            console.warn(`Failed to load tasks for team ${teams[index]?.name}`, result.reason);
                        }
                    });
                } else if (selectedTeam) {
                    // Load tasks for selected team
                    const data = await workingStaffApi.getTeamDailyTasksInRange(selectedTeam, dateRange.fromDate, dateRange.toDate);
                    allTasks = data;
                }

                // Remove duplicates and sort by date and time
                const uniqueTasks = Array.from(
                    new Map(allTasks.map(task => [task.id, task])).values()
                );
                uniqueTasks.sort((a, b) => {
                    const dateCompare = (a.assigned_date || '').localeCompare(b.assigned_date || '');
                    if (dateCompare !== 0) return dateCompare;
                    return (a.start_time || '').localeCompare(b.start_time || '');
                });

                if (mounted) setTasks(uniqueTasks);
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


    const handleUpdateStatus = async (taskId, status) => {
        try {
            await workingStaffApi.updateDailyTaskStatus(taskId, status);
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
            setSnackbar({ message: 'Cập nhật trạng thái thành công', severity: 'success' });
        } catch (error) {
            console.error('Failed to update task status', error);
            setSnackbar({ message: 'Không thể cập nhật trạng thái', severity: 'error' });
        }
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
                                            Thời gian
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Khu vực
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Khách hàng
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY, py: 2 }}>
                                            Trạng thái
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
                                                    6
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
                                            const statusInfo = statusColorMap[task.status] || statusColorMap.SCHEDULED;
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
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.TEXT.PRIMARY }}>
                                                                {task.customer?.name || 'Khách lẻ'}
                                                            </Typography>
                                                            {task.pet?.name && (
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {task.pet.name}{task.pet?.type ? ` • ${task.pet.type}` : ''}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 2.5 }}>
                                                        <Chip
                                                            label={statusInfo.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: statusInfo.bgColor,
                                                                color: statusInfo.textColor,
                                                                fontWeight: 600,
                                                                minWidth: 110,
                                                                height: 28,
                                                                fontSize: '0.75rem',
                                                                border: `1px solid ${alpha(statusInfo.textColor, 0.2)}`
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 2.5 }}>
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            {task.status === 'SCHEDULED' && (
                                                                <>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                                                        sx={{
                                                                            borderColor: COLORS.PRIMARY[600],
                                                                            color: COLORS.PRIMARY[600],
                                                                            fontWeight: 600,
                                                                            textTransform: 'uppercase',
                                                                            fontSize: '0.75rem',
                                                                            px: 2,
                                                                            py: 0.75,
                                                                            '&:hover': {
                                                                                borderColor: COLORS.PRIMARY[700],
                                                                                bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                                                            }
                                                                        }}
                                                                    >
                                                                        BẮT ĐẦU
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="success"
                                                                        onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            textTransform: 'uppercase',
                                                                            fontSize: '0.75rem',
                                                                            px: 2,
                                                                            py: 0.75
                                                                        }}
                                                                    >
                                                                        HOÀN THÀNH
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {task.status === 'IN_PROGRESS' && (
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        textTransform: 'uppercase',
                                                                        fontSize: '0.75rem',
                                                                        px: 2,
                                                                        py: 0.75
                                                                    }}
                                                                >
                                                                    HOÀN THÀNH
                                                                </Button>
                                                            )}
                                                            {(task.status === 'COMPLETED' || task.status === 'CANCELLED') && (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: COLORS.TEXT.SECONDARY,
                                                                        fontStyle: 'italic',
                                                                        alignSelf: 'center',
                                                                        px: 2
                                                                    }}
                                                                >
                                                                    —
                                                                </Typography>
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
                </Paper>
            </Stack>

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

