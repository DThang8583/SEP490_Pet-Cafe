import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, Avatar, alpha, Grid, Button, Divider, IconButton } from '@mui/material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import dailyScheduleApi from '../../api/dailyScheduleApi';
import { getTeams } from '../../api/teamApi';
import { FilterList, ChevronLeft, ChevronRight, CalendarToday } from '@mui/icons-material';

const STATUS_LABELS = {
    PENDING: 'Chờ điểm danh',
    PRESENT: 'Có mặt',
    ABSENT: 'Vắng mặt',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm'
};

const STATUS_COLORS = {
    PENDING: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] },
    PRESENT: { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700] },
    ABSENT: { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700] },
    LATE: { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] },
    EARLY_LEAVE: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] }
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekday = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${weekday}, ${day}/${month}/${year}`;
};

const formatTime = (timeString) => {
    if (!timeString) return '—';
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
};

const AttendanceTab = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [pagination, setPagination] = useState(null);

    // Filter states
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Month picker state
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Teams list
    const [teams, setTeams] = useState([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Get current month as default date range
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setFromDate(firstDay.toISOString().split('T')[0]);
        setToDate(lastDay.toISOString().split('T')[0]);
        setSelectedMonth(now.getMonth());
        setSelectedYear(now.getFullYear());
    }, []);

    // Update date range when month/year changes
    useEffect(() => {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        setFromDate(firstDay.toISOString().split('T')[0]);
        setToDate(lastDay.toISOString().split('T')[0]);
        setPage(1);
    }, [selectedMonth, selectedYear]);

    // Load teams
    useEffect(() => {
        const loadTeams = async () => {
            try {
                const response = await getTeams({ page_index: 0, page_size: 100 });
                if (response && response.data) {
                    setTeams(response.data);
                }
            } catch (error) {
                // Silently fail - teams are optional for filtering
            }
        };
        loadTeams();
    }, []);

    // Load all schedules for statistics (without pagination)
    const [allSchedules, setAllSchedules] = useState([]);

    // Load daily schedules
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setIsLoading(true);
                setError('');

                const params = {
                    page_index: page - 1, // Convert to 0-based index
                    page_size: itemsPerPage
                };

                if (selectedTeam !== 'all') {
                    params.TeamId = selectedTeam;
                }

                if (fromDate) {
                    params.FromDate = fromDate;
                }

                if (toDate) {
                    params.ToDate = toDate;
                }

                if (statusFilter !== 'all') {
                    params.Status = statusFilter;
                }

                const response = await dailyScheduleApi.getDailySchedules(params);

                if (response && response.success !== false) {
                    const schedulesData = response.data || [];
                    const paginationData = response.pagination || null;

                    // Validate pagination data
                    if (paginationData) {
                        // Ensure total_pages_count is calculated correctly
                        if (!paginationData.total_pages_count && paginationData.total_items_count) {
                            paginationData.total_pages_count = Math.ceil(paginationData.total_items_count / itemsPerPage);
                        }
                    }

                    setSchedules(schedulesData);
                    setPagination(paginationData);
                } else {
                    setSchedules([]);
                    setPagination(null);
                }
            } catch (e) {
                setError(e.message || 'Không thể tải danh sách điểm danh');
                setSchedules([]);
                setPagination(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Only load if we have date range
        if (fromDate && toDate) {
            loadSchedules();
        } else {
            // If no date range, clear data
            setSchedules([]);
            setPagination(null);
            setIsLoading(false);
        }
    }, [page, itemsPerPage, selectedTeam, fromDate, toDate, statusFilter]);

    // Load all schedules for statistics (separate from paginated data)
    useEffect(() => {
        const loadAllSchedules = async () => {
            try {
                const params = {
                    page_index: 0,
                    page_size: 1000 // Load all for statistics
                };

                if (selectedTeam !== 'all') {
                    params.TeamId = selectedTeam;
                }

                if (fromDate) {
                    params.FromDate = fromDate;
                }

                if (toDate) {
                    params.ToDate = toDate;
                }

                // Don't filter by status for statistics
                const response = await dailyScheduleApi.getDailySchedules(params);
                if (response && response.success !== false) {
                    setAllSchedules(response.data || []);
                }
            } catch (e) {
                setAllSchedules([]);
            }
        };

        if (fromDate && toDate) {
            loadAllSchedules();
        }
    }, [selectedTeam, fromDate, toDate]);

    // Calculate statistics
    const statistics = useMemo(() => {
        return {
            total: allSchedules.length,
            pending: allSchedules.filter(s => s.status === 'PENDING').length,
            present: allSchedules.filter(s => s.status === 'PRESENT').length,
            absent: allSchedules.filter(s => s.status === 'ABSENT').length,
            late: allSchedules.filter(s => s.status === 'LATE').length,
            earlyLeave: allSchedules.filter(s => s.status === 'EARLY_LEAVE').length
        };
    }, [allSchedules]);

    // Month navigation
    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const handleToday = () => {
        const now = new Date();
        setSelectedMonth(now.getMonth());
        setSelectedYear(now.getFullYear());
    };

    // Generate year options (current year - 2 to current year + 2)
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearOptions.push(i);
    }

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    if (isLoading && schedules.length === 0) {
        return (
            <Box sx={{ py: 4 }}>
                <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải danh sách điểm danh..." />
            </Box>
        );
    }

    return (
        <Box>
            {/* Statistics Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng số
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.PRIMARY[700]}>
                            {statistics.total}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Chờ điểm danh
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.WARNING[700]}>
                            {statistics.pending}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Có mặt
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.SUCCESS[700]}>
                            {statistics.present}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Vắng mặt
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.ERROR[700]}>
                            {statistics.absent}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Đi muộn
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.INFO[700]}>
                            {statistics.late}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}`, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW?.LIGHT || COLORS.GRAY[200], 0.1)}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Về sớm
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={COLORS.WARNING[700]}>
                            {statistics.earlyLeave}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, boxShadow: `0 2px 8px ${alpha(COLORS.GRAY[200], 0.1)}` }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <FilterList sx={{ color: COLORS.PRIMARY[600] }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                        Bộ lọc
                    </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                    {/* Month/Year Picker */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                            Chọn tháng/năm:
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CalendarToday />}
                                onClick={handleToday}
                                sx={{ minWidth: 120 }}
                            >
                                Hôm nay
                            </Button>

                            <Stack direction="row" alignItems="center" spacing={1} sx={{
                                border: `1px solid ${alpha(COLORS.PRIMARY[300], 0.5)}`,
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                bgcolor: alpha(COLORS.PRIMARY[50], 0.3)
                            }}>
                                <IconButton
                                    size="small"
                                    onClick={handlePrevMonth}
                                    sx={{
                                        color: COLORS.PRIMARY[600],
                                        '&:hover': { bgcolor: alpha(COLORS.PRIMARY[100], 0.5) }
                                    }}
                                >
                                    <ChevronLeft />
                                </IconButton>

                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <Select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        sx={{
                                            '& .MuiSelect-select': {
                                                py: 0.75,
                                                fontWeight: 600,
                                                color: COLORS.PRIMARY[700]
                                            }
                                        }}
                                    >
                                        {monthNames.map((month, index) => (
                                            <MenuItem key={index} value={index}>
                                                {month}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <Select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        sx={{
                                            '& .MuiSelect-select': {
                                                py: 0.75,
                                                fontWeight: 600,
                                                color: COLORS.PRIMARY[700]
                                            }
                                        }}
                                    >
                                        {yearOptions.map((year) => (
                                            <MenuItem key={year} value={year}>
                                                {year}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <IconButton
                                    size="small"
                                    onClick={handleNextMonth}
                                    sx={{
                                        color: COLORS.PRIMARY[600],
                                        '&:hover': { bgcolor: alpha(COLORS.PRIMARY[100], 0.5) }
                                    }}
                                >
                                    <ChevronRight />
                                </IconButton>
                            </Stack>

                            {fromDate && toDate && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    ({new Date(fromDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(toDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })})
                                </Typography>
                            )}
                        </Stack>
                    </Box>

                    {/* Advanced Filters */}
                    <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Nhóm</InputLabel>
                            <Select
                                label="Nhóm"
                                value={selectedTeam}
                                onChange={(e) => {
                                    setSelectedTeam(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="all">Tất cả nhóm</MenuItem>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            label="Từ ngày"
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(1);
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={{ minWidth: 180 }}
                        />

                        <TextField
                            size="small"
                            label="Đến ngày"
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(1);
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={{ minWidth: 180 }}
                        />

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                label="Trạng thái"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="PENDING">Chờ điểm danh</MenuItem>
                                <MenuItem value="PRESENT">Có mặt</MenuItem>
                                <MenuItem value="ABSENT">Vắng mặt</MenuItem>
                                <MenuItem value="LATE">Đi muộn</MenuItem>
                                <MenuItem value="EARLY_LEAVE">Về sớm</MenuItem>
                            </Select>
                        </FormControl>

                    </Toolbar>
                </Stack>
            </Paper>

            {/* Error Message */}
            {error && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(COLORS.ERROR[100], 0.3), border: `1px solid ${COLORS.ERROR[300]}` }}>
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                </Paper>
            )}

            {/* Schedules Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}` }}>
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }}>Nhân viên</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }}>Ca làm việc</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }}>Ngày</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }}>Trạng thái</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Ghi chú</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Stack alignItems="center" spacing={1}>
                                        <Typography variant="h6" color="text.secondary">
                                            Không có dữ liệu điểm danh
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Vui lòng thử lại với bộ lọc khác
                                        </Typography>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ) : (() => {
                            // Group schedules by team
                            const schedulesByTeam = {};
                            schedules.forEach((schedule) => {
                                const teamId = schedule.team_member?.team_id || 'no-team';
                                if (!schedulesByTeam[teamId]) {
                                    schedulesByTeam[teamId] = [];
                                }
                                schedulesByTeam[teamId].push(schedule);
                            });

                            // Sort teams: teams with names first, then "no-team"
                            const sortedTeamIds = Object.keys(schedulesByTeam).sort((a, b) => {
                                if (a === 'no-team') return 1;
                                if (b === 'no-team') return -1;
                                const teamA = teams.find(t => t.id === a);
                                const teamB = teams.find(t => t.id === b);
                                return (teamA?.name || '').localeCompare(teamB?.name || '');
                            });

                            return sortedTeamIds.map((teamId) => {
                                const teamSchedules = schedulesByTeam[teamId];
                                const team = teams.find(t => t.id === teamId);
                                const teamName = team?.name || 'Chưa phân nhóm';

                                return (
                                    <React.Fragment key={teamId}>
                                        {/* Team Header Row */}
                                        <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.4) }}>
                                            <TableCell colSpan={5} sx={{ py: 1.5, borderBottom: `2px solid ${COLORS.PRIMARY[300]}` }}>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Chip
                                                        label={teamName}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: COLORS.PRIMARY[500],
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            height: 28
                                                        }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                        ({teamSchedules.length} {teamSchedules.length === 1 ? 'bản ghi' : 'bản ghi'})
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>

                                        {/* Team Schedules */}
                                        {teamSchedules.map((schedule) => {
                                            const statusInfo = STATUS_COLORS[schedule.status] || STATUS_COLORS.PENDING;
                                            const statusLabel = STATUS_LABELS[schedule.status] || schedule.status;

                                            return (
                                                <TableRow key={schedule.id} hover sx={{ '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.3) } }}>
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Avatar
                                                                src={schedule.employee?.avatar_url}
                                                                alt={schedule.employee?.full_name}
                                                                sx={{ width: 42, height: 42, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.5)}` }}
                                                            >
                                                                {!schedule.employee?.avatar_url && schedule.employee?.full_name?.charAt(0)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                                                    {schedule.employee?.full_name || '—'}
                                                                </Typography>
                                                                {schedule.employee?.sub_role && (
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                                        {schedule.employee.sub_role === 'SALE_STAFF' ? 'Sale Staff' :
                                                                            schedule.employee.sub_role === 'WORKING_STAFF' ? 'Working Staff' :
                                                                                schedule.employee.sub_role}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                                                                {schedule.work_shift?.name || '—'}
                                                            </Typography>
                                                            {schedule.work_shift && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                                    {formatTime(schedule.work_shift.start_time)} - {formatTime(schedule.work_shift.end_time)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                            {formatDate(schedule.date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={statusLabel}
                                                            sx={{
                                                                background: statusInfo.bg,
                                                                color: statusInfo.color,
                                                                fontWeight: 700,
                                                                fontSize: '0.8rem',
                                                                height: 26,
                                                                minWidth: 100
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {schedule.notes || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination && pagination.total_items_count > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Pagination
                        page={page}
                        totalPages={Math.max(1, pagination.total_pages_count || Math.ceil(pagination.total_items_count / itemsPerPage))}
                        onPageChange={(newPage) => {
                            if (newPage !== page && newPage >= 1) {
                                setPage(newPage);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={pagination.total_items_count}
                    />
                </Box>
            )}
        </Box>
    );
};

export default AttendanceTab;

