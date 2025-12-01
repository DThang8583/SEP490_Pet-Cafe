import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, Avatar, alpha, Button, Divider, IconButton, Menu } from '@mui/material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import dailyScheduleApi from '../../api/dailyScheduleApi';
import { getTeams, getTeamMembers, getTeamWorkShifts } from '../../api/teamApi';
import { WEEKDAYS } from '../../api/workShiftApi';
import apiClient from '../../config/config';
import { MoreVert, FilterList, ChevronLeft, ChevronRight } from '@mui/icons-material';

const STATUS_LABELS = {
    PENDING: 'Chờ điểm danh',
    PRESENT: 'Có mặt',
    ABSENT: 'Vắng mặt',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm'
};

// Thứ tự hiển thị trạng thái trong menu MoreVert (ưu tiên các trạng thái thực tế)
const STATUS_ORDER = ['PRESENT', 'ABSENT', 'EARLY_LEAVE', 'LATE', 'PENDING'];

const STATUS_COLORS = {
    PENDING: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] },
    PRESENT: { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700] },
    ABSENT: { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700] },
    LATE: { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] },
    EARLY_LEAVE: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] }
};

const DAY_ALIASES = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY',
    THU2: 'MONDAY',
    THU3: 'TUESDAY',
    THU4: 'WEDNESDAY',
    THU5: 'THURSDAY',
    THU6: 'FRIDAY',
    THU7: 'SATURDAY',
    CHUNHAT: 'SUNDAY'
};

const normalizeWorkingDays = (workingDays) => {
    if (!workingDays) return [];
    if (Array.isArray(workingDays)) {
        return workingDays
            .map((day) => {
                const key = day?.toString?.().replace(/\s+/g, '').toUpperCase();
                return DAY_ALIASES[key] || key;
            })
            .filter((day) => WEEKDAYS.includes(day));
    }
    if (typeof workingDays === 'string') {
        return workingDays
            .split(',')
            .map((day) => {
                const key = day.trim().replace(/\s+/g, '').toUpperCase();
                return DAY_ALIASES[key] || key;
            })
            .filter((day) => WEEKDAYS.includes(day));
    }
    return [];
};

const getDayKeyFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const jsDay = date.getDay(); // 0 = Sunday
    const index = jsDay === 0 ? 6 : jsDay - 1;
    return WEEKDAYS[index];
};

// Build full member list cho team: bao gồm cả Leader + members (tránh trùng)
const getAllTeamMembersForManager = (team) => {
    const members = [];
    const seenIds = new Set();

    const leader = team.leader;
    const leaderId = leader?.id || leader?.employee_id || leader?.account_id || team.leader_id;

    if (leader && leaderId && !seenIds.has(leaderId)) {
        seenIds.add(leaderId);
        members.push({
            id: leader.team_member_id || `leader-${leaderId}`,
            employee_id: leader.id || leader.employee_id,
            employee: {
                ...leader,
                isLeader: true
            }
        });
    }

    // Hợp nhất tất cả nguồn member có thể có (team.members từ getTeams, team_members từ getTeamMembers)
    const rawMembers = [
        ...((team.members && Array.isArray(team.members)) ? team.members : []),
        ...((team.team_members && Array.isArray(team.team_members)) ? team.team_members : [])
    ];

    rawMembers.forEach((tm) => {
        // tm có thể là team_member (có field employee) hoặc employee thẳng
        const emp = tm.employee || tm || {};
        const empId = emp.id || tm.employee_id;
        const key = empId || emp.account_id;
        if (!key || seenIds.has(key)) return;
        seenIds.add(key);
        members.push({
            ...tm,
            employee: {
                ...emp,
                isLeader: false
            }
        });
    });

    return members;
};

// Manager cập nhật trạng thái điểm danh trực tiếp cho 1 bản ghi
const updateAttendanceStatusForManager = async (schedule, newStatus, setError, setRefreshKey, setIsLoading) => {
    if (!schedule) return;

    const teamId = schedule.team_member?.team_id || schedule.team_id;
    const teamMemberId = schedule.team_member?.id || schedule.team_member_id;
    const recordId = schedule.id || teamMemberId;

    if (!teamId || !recordId) {
        setError('Không tìm thấy thông tin điểm danh để cập nhật.');
        return;
    }

    try {
        setIsLoading(true);
        const payload = [
            {
                id: recordId,
                status: newStatus,
                notes: schedule.notes || ''
            }
        ];

        await apiClient.put(`/teams/${teamId}/daily-schedules`, payload, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        // Trigger reload
        setRefreshKey(prev => prev + 1);
    } catch (error) {
        const msg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể cập nhật điểm danh';
        setError(msg);
    } finally {
        setIsLoading(false);
    }
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

// --- Statistics helpers ------------------------------------------------------

const buildStatistics = (allSchedules) => ({
    total: allSchedules.length,
    pending: allSchedules.filter(s => s.status === 'PENDING').length,
    present: allSchedules.filter(s => s.status === 'PRESENT').length,
    absent: allSchedules.filter(s => s.status === 'ABSENT').length,
    late: allSchedules.filter(s => s.status === 'LATE').length,
    earlyLeave: allSchedules.filter(s => s.status === 'EARLY_LEAVE').length
});

// --- Weeks helpers -----------------------------------------------------------

const buildWeeksForMonth = (year, month) => {
    const result = [];
    if (year === undefined || year === null || month === undefined || month === null) {
        return result;
    }

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Tìm thứ Hai của tuần chứa ngày 1
    const firstDayOfWeek = firstOfMonth.getDay(); // 0=CN,1=T2,...
    const diffToMonday = (firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek);
    const currentMonday = new Date(firstOfMonth);
    currentMonday.setDate(firstOfMonth.getDate() + diffToMonday);

    let index = 1;
    while (currentMonday <= lastOfMonth) {
        const weekStart = new Date(currentMonday);
        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Giới hạn trong phạm vi tháng
        const fromDate = weekStart < firstOfMonth ? firstOfMonth : weekStart;
        const toDate = weekEnd > lastOfMonth ? lastOfMonth : weekEnd;

        const fromStr = fromDate.toISOString().split('T')[0];
        const toStr = toDate.toISOString().split('T')[0];

        const formatVN = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const label = `Tuần ${index} (${formatVN(fromDate)} - ${formatVN(toDate)})`;

        result.push({ id: String(index), from: fromStr, to: toStr, label, fromDate, toDate });

        currentMonday.setDate(currentMonday.getDate() + 7);
        index += 1;
    }

    return result;
};

// --- Sub components ----------------------------------------------------------

const StatisticsSection = ({ statistics }) => (
    <Box
        sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 2.5,
            mb: 4,
            width: '100%',
            overflow: 'visible'
        }}
    >
        {[
            { label: 'Tổng số', value: statistics.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
            { label: 'Chờ điểm danh', value: statistics.pending, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
            { label: 'Có mặt', value: statistics.present, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
            { label: 'Vắng mặt', value: statistics.absent, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] },
            { label: 'Đi muộn', value: statistics.late, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
            { label: 'Về sớm', value: statistics.earlyLeave, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] }
        ].map((stat, index) => {
            const cardWidth = `calc((100% - ${5 * 20}px) / 6)`;
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
                    <Paper
                        sx={{
                            p: 2.5,
                            borderTop: `4px solid ${stat.color}`,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {stat.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={stat.valueColor}>
                            {stat.value}
                        </Typography>
                    </Paper>
                </Box>
            );
        })}
    </Box>
);

const MonthWeekFilter = ({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    monthNames,
    yearOptions,
    weeksInMonth,
    selectedWeekId,
    setSelectedWeekId,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    setPage
}) => {
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

    const handleThisWeek = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Nếu đang xem đúng tháng/năm hiện tại -> chỉ cần chọn lại tuần chứa hôm nay
        if (selectedYear === year && selectedMonth === month && weeksInMonth.length) {
            const today = new Date();
            const currentWeek =
                weeksInMonth.find(w => today >= w.fromDate && today <= w.toDate) ||
                weeksInMonth[0];
            if (currentWeek) {
                setSelectedWeekId(currentWeek.id);
                setFromDate(currentWeek.from);
                setToDate(currentWeek.to);
            }
        } else {
            // Nhảy về đúng tháng/năm hiện tại rồi chọn tuần chứa hôm nay
            setSelectedMonth(month);
            setSelectedYear(year);

            const weeksForCurrent = buildWeeksForMonth(year, month);
            const today = new Date();
            const currentWeek =
                weeksForCurrent.find(w => today >= w.fromDate && today <= w.toDate) ||
                weeksForCurrent[0];
            if (currentWeek) {
                setSelectedWeekId(currentWeek.id);
                setFromDate(currentWeek.from);
                setToDate(currentWeek.to);
            }
        }
        setPage(1);
    };

    const currentWeekLabel = useMemo(() => {
        const w = weeksInMonth.find(x => x.id === selectedWeekId) || weeksInMonth[0];
        return w ? w.label.split('(')[0].trim() : '';
    }, [selectedWeekId, weeksInMonth]);

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Chọn tháng / tuần:
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap' }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ flexWrap: 'wrap' }}
                >
                    {/* Chọn tháng / năm */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            border: `1px solid ${alpha(COLORS.PRIMARY[300], 0.5)}`,
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5,
                            bgcolor: alpha(COLORS.PRIMARY[50], 0.3)
                        }}
                    >
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

                        <FormControl size="small" sx={{ minWidth: 160 }}>
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

                        <FormControl size="small" sx={{ minWidth: 120 }}>
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

                    {/* Filter theo từng tuần (card style, luôn có 1 tuần được chọn) */}
                    {weeksInMonth.length > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                borderColor: COLORS.PRIMARY[200],
                                bgcolor: alpha(COLORS.PRIMARY[50], 0.2),
                                minWidth: 260
                            }}
                        >
                            {/* Tuần trước */}
                            <IconButton
                                size="small"
                                onClick={() => {
                                    const currentIndex = weeksInMonth.findIndex(w => w.id === selectedWeekId);
                                    if (currentIndex > 0) {
                                        const w = weeksInMonth[currentIndex - 1];
                                        setSelectedWeekId(w.id);
                                        setFromDate(w.from);
                                        setToDate(w.to);
                                    }
                                    setPage(1);
                                }}
                                sx={{ mr: 1 }}
                            >
                                <ChevronLeft fontSize="small" />
                            </IconButton>

                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                    {currentWeekLabel}
                                </Typography>
                                {fromDate && toDate && (
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(fromDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} -{' '}
                                        {new Date(toDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </Typography>
                                )}
                            </Box>

                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ mx: 1, textTransform: 'uppercase', fontSize: 11 }}
                                onClick={handleThisWeek}
                            >
                                Tuần này
                            </Button>

                            {/* Tuần sau */}
                            <IconButton
                                size="small"
                                onClick={() => {
                                    const currentIndex = weeksInMonth.findIndex(w => w.id === selectedWeekId);
                                    if (currentIndex < weeksInMonth.length - 1) {
                                        const w = weeksInMonth[currentIndex + 1];
                                        setSelectedWeekId(w.id);
                                        setFromDate(w.from);
                                        setToDate(w.to);
                                    }
                                    setPage(1);
                                }}
                                sx={{ ml: 1 }}
                            >
                                <ChevronRight fontSize="small" />
                            </IconButton>
                        </Paper>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};

const buildGroupedSchedules = (schedules, teams) => {
    if (!schedules || !schedules.length) return [];

    const schedulesByTeam = {};
    schedules.forEach((schedule) => {
        const teamId = schedule.team_member?.team_id || 'no-team';
        if (!schedulesByTeam[teamId]) {
            schedulesByTeam[teamId] = [];
        }
        schedulesByTeam[teamId].push(schedule);
    });

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
        return { teamId, teamName, teamSchedules };
    });
};

// --- Main page ---------------------------------------------------------------

// Trang Điểm danh cho Manager
const ManagerAttendancePage = () => {
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

    // Teams list (đã enrich: team_members + team_work_shifts)
    const [teams, setTeams] = useState([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(999); // hiển thị gần như toàn bộ bản ghi trên 1 trang
    const [selectedWeekId, setSelectedWeekId] = useState(null); // id tuần trong tháng (luôn chọn 1 tuần khi dùng card)
    const [refreshKey, setRefreshKey] = useState(0);

    // Action menu state (MoreVert per row)
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, schedule: null });

    // Schedules thô từ BE dùng cho thống kê
    const [rawSchedules, setRawSchedules] = useState([]);

    // Set default month/year to current time, nhưng KHÔNG tự động set Từ ngày / Đến ngày
    useEffect(() => {
        const now = new Date();
        setSelectedMonth(now.getMonth());
        setSelectedYear(now.getFullYear());
    }, []);

    // Load full teams data: tất cả team + members + team_work_shifts (reuse logic tương tự WorkShiftPage)
    useEffect(() => {
        const loadTeams = async () => {
            try {
                // Lấy tối đa 1000 team - giống WorkShiftPage nhưng không phân trang UI
                const response = await getTeams({
                    page: 0,
                    limit: 1000
                });

                if (!response.success || !Array.isArray(response.data)) {
                    setTeams([]);
                    return;
                }

                const teamsWithData = await Promise.all(
                    response.data.map(async (team) => {
                        try {
                            const [membersResp, workShiftsResp] = await Promise.allSettled([
                                getTeamMembers(team.id),
                                getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 })
                            ]);

                            const teamMembers = membersResp.status === 'fulfilled' && membersResp.value.success
                                ? membersResp.value.data || []
                                : [];

                            const teamWorkShifts = workShiftsResp.status === 'fulfilled' && workShiftsResp.value.success
                                ? workShiftsResp.value.data || []
                                : [];

                            return {
                                ...team,
                                team_members: teamMembers,
                                team_work_shifts: teamWorkShifts
                            };
                        } catch (error) {
                            console.error('[Manager Attendance] Failed to enrich team data:', error);
                            return {
                                ...team,
                                team_members: [],
                                team_work_shifts: []
                            };
                        }
                    })
                );

                setTeams(teamsWithData);
            } catch (error) {
                console.error('[Manager Attendance] Failed to load teams:', error);
                setTeams([]);
            }
        };
        loadTeams();
    }, []);

    // Helper: fetch schedules cho nhiều team giống WorkingAttendancePage
    const fetchSchedulesForTeams = useCallback(async (teamIds, params) => {
        if (!Array.isArray(teamIds) || teamIds.length === 0) {
            return [];
        }

        const schedulePromises = teamIds.map((teamId) =>
            dailyScheduleApi.getDailySchedules({
                ...params,
                TeamId: teamId
            }).catch((error) => {
                console.error(`[Manager Attendance] Failed to fetch schedules for team ${teamId}:`, error);
                return { success: true, data: [] };
            })
        );

        const responses = await Promise.all(schedulePromises);

        let combined = [];
        responses.forEach((response) => {
            if (response && response.success !== false && Array.isArray(response.data) && response.data.length > 0) {
                combined.push(...response.data);
            }
        });

        return combined;
    }, []);

    // Load daily schedules + expand theo workshift để có đủ tất cả team/ca/ngày/member
    useEffect(() => {
        const loadSchedules = async () => {
            try {
                setIsLoading(true);
                setError('');

                const today = new Date().toISOString().split('T')[0];
                const effectiveFromDate = fromDate || today;
                const effectiveToDate = toDate || today;

                if (!teams || teams.length === 0) {
                    setSchedules([]);
                    setPagination(null);
                    return;
                }

                // 1) Lấy attendance thật từ daily-schedules cho các team đang xem
                const allTeamIds = (selectedTeam === 'all'
                    ? teams.map(t => t.id)
                    : teams.filter(t => t.id === selectedTeam).map(t => t.id)
                ).filter(Boolean);

                const baseParams = {
                    page_index: 0,
                    page_size: 1000,
                    FromDate: effectiveFromDate,
                    ToDate: effectiveToDate
                };

                const rawSchedules = await fetchSchedulesForTeams(allTeamIds, baseParams);
                setRawSchedules(rawSchedules || []);

                // Index nhanh để tra cứu theo team/shift/ngày/employee
                const scheduleIndex = new Map();
                rawSchedules.forEach((s) => {
                    const teamId = s.team_member?.team_id || s.team_id;
                    const shiftId = s.work_shift_id || s.work_shift?.id;
                    const dateStr = s.date ? new Date(s.date).toISOString().split('T')[0] : null;
                    const employeeId = s.employee_id || s.employee?.id || s.team_member?.employee_id;
                    if (!teamId || !shiftId || !dateStr || !employeeId) return;
                    const key = `${teamId}|${shiftId}|${dateStr}|${employeeId}`;
                    scheduleIndex.set(key, s);
                });

                // 2) Expand theo workshift + members để sinh đủ record
                const from = new Date(effectiveFromDate);
                const to = new Date(effectiveToDate);
                const allDates = [];
                for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                    allDates.push(new Date(d));
                }

                const expanded = [];

                teams.forEach((team) => {
                    if (selectedTeam !== 'all' && team.id !== selectedTeam) return;

                    const teamMembers = getAllTeamMembersForManager(team);
                    const teamShifts = team.team_work_shifts || [];

                    teamShifts.forEach((tws) => {
                        const shift = tws.work_shift || tws;
                        if (!shift) return;

                        const workingDays = (() => {
                            const days = normalizeWorkingDays(tws.working_days);
                            if (days.length > 0) return days;
                            return normalizeWorkingDays(shift.applicable_days);
                        })();
                        if (workingDays.length === 0) return;

                        allDates.forEach((dateObj) => {
                            const dateStr = dateObj.toISOString().split('T')[0];
                            const dayKey = getDayKeyFromDate(dateStr);
                            if (!dayKey || !workingDays.includes(dayKey)) return;

                            teamMembers.forEach((tm) => {
                                const employee = tm.employee || {};
                                const employeeId = employee.id || tm.employee_id;
                                if (!employeeId) return;

                                const key = `${team.id}|${shift.id}|${dateStr}|${employeeId}`;
                                const existing = scheduleIndex.get(key);

                                const status = existing?.status || 'PENDING';
                                if (statusFilter !== 'all' && status !== statusFilter) {
                                    return;
                                }

                                expanded.push({
                                    id: existing?.id || key,
                                    team_member: existing?.team_member || {
                                        id: tm.id,
                                        team_id: team.id,
                                        employee_id: employeeId,
                                        employee
                                    },
                                    employee: existing?.employee || employee,
                                    work_shift: existing?.work_shift || shift,
                                    date: existing?.date || dateStr,
                                    status,
                                    notes: existing?.notes || null
                                });
                            });
                        });
                    });
                });

                // Bổ sung các bản ghi attendance từ BE mà không nằm trong danh sách members (phòng trường hợp team thiếu member)
                const existingKeys = new Set(
                    expanded.map((rec) => {
                        const tId = rec.team_member?.team_id || rec.team_id;
                        const sId = rec.work_shift?.id || rec.work_shift_id;
                        const dStr = rec.date ? new Date(rec.date).toISOString().split('T')[0] : null;
                        const empId = rec.employee?.id || rec.employee_id || rec.team_member?.employee_id;
                        return tId && sId && dStr && empId ? `${tId}|${sId}|${dStr}|${empId}` : null;
                    }).filter(Boolean)
                );

                rawSchedules.forEach((s) => {
                    const teamId = s.team_member?.team_id || s.team_id;
                    const shiftId = s.work_shift_id || s.work_shift?.id;
                    const dateStr = s.date ? new Date(s.date).toISOString().split('T')[0] : null;
                    const employeeId = s.employee_id || s.employee?.id || s.team_member?.employee_id;
                    if (!teamId || !shiftId || !dateStr || !employeeId) return;
                    const key = `${teamId}|${shiftId}|${dateStr}|${employeeId}`;
                    if (existingKeys.has(key)) return;

                    const status = s.status || 'PENDING';
                    if (statusFilter !== 'all' && status !== statusFilter) {
                        return;
                    }

                    expanded.push({
                        id: s.id || key,
                        team_member: s.team_member || null,
                        employee: s.employee || { id: employeeId, full_name: s.employee_name || 'N/A' },
                        work_shift: s.work_shift || null,
                        date: s.date || dateStr,
                        status,
                        notes: s.notes || null
                    });
                });

                // Sort theo ngày
                expanded.sort((a, b) => {
                    const dateA = new Date(a.date || 0).getTime();
                    const dateB = new Date(b.date || 0).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                    return (a.employee?.full_name || '').localeCompare(b.employee?.full_name || '');
                });

                const totalItems = expanded.length;
                const startIndex = (page - 1) * itemsPerPage;
                const pagedData = expanded.slice(startIndex, startIndex + itemsPerPage);

                setSchedules(pagedData);
                setPagination({
                    total_items_count: totalItems,
                    page_size: itemsPerPage,
                    page_index: page - 1,
                    total_pages_count: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
                    has_next: startIndex + itemsPerPage < totalItems,
                    has_previous: page > 1
                });
            } catch (e) {
                console.error('[Manager Attendance] loadSchedules error:', e);
                setError(e.message || 'Không thể tải danh sách điểm danh');
                setSchedules([]);
                setPagination(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadSchedules();
    }, [page, itemsPerPage, selectedTeam, fromDate, toDate, statusFilter, teams, fetchSchedulesForTeams, refreshKey]);

    // Calculate statistics
    const statistics = useMemo(() => buildStatistics(rawSchedules), [rawSchedules]);

    // Generate year / month options (evaluate 1 lần ở client)
    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => {
        const options = [];
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            options.push(i);
        }
        return options;
    }, [currentYear]);

    const monthNames = useMemo(
        () => [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ],
        []
    );

    const groupedSchedules = useMemo(
        () => buildGroupedSchedules(schedules, teams),
        [schedules, teams]
    );

    // Tính các tuần trong tháng hiện tại (Thứ 2 - Chủ nhật, cắt theo tháng)
    const weeksInMonth = useMemo(
        () => buildWeeksForMonth(selectedYear, selectedMonth),
        [selectedMonth, selectedYear]
    );

    // Xác định tuần chứa "hôm nay" trong tháng đang chọn (nếu có)
    const currentWeekInMonth = useMemo(() => {
        if (!weeksInMonth.length) return null;
        const today = new Date();
        return weeksInMonth.find((w) => today >= w.fromDate && today <= w.toDate) || null;
    }, [weeksInMonth]);

    // Khi đổi tháng/năm, luôn auto chọn 1 tuần (ưu tiên tuần chứa hôm nay nếu cùng tháng/năm, không còn trạng thái "Tất cả tuần")
    useEffect(() => {
        if (!weeksInMonth.length) return;

        let targetWeek = null;

        // Nếu tuần đang chọn vẫn tồn tại trong tháng mới -> giữ nguyên
        if (selectedWeekId) {
            targetWeek = weeksInMonth.find((w) => w.id === selectedWeekId) || null;
        }

        // Nếu không, ưu tiên tuần chứa "hôm nay" trong tháng đó
        if (!targetWeek && currentWeekInMonth) {
            targetWeek = currentWeekInMonth;
        }

        // Nếu vẫn chưa có thì chọn Tuần 1
        if (!targetWeek) {
            targetWeek = weeksInMonth[0];
        }

        if (targetWeek) {
            setSelectedWeekId(targetWeek.id);
            setFromDate(targetWeek.from);
            setToDate(targetWeek.to);
        }
    }, [weeksInMonth, currentWeekInMonth]);

    // Loading toàn trang (đồng bộ style với StaffPage, WorkShiftPage, ...)
    if (isLoading) {
        return (
            <Box
                sx={{
                    background: COLORS.BACKGROUND.NEUTRAL,
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Loading
                    fullScreen={false}
                    variant="cafe"
                    size="large"
                    message="Đang tải trang Điểm danh..."
                />
            </Box>
        );
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Page Title */}
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 900,
                        color: COLORS.ERROR[600],
                        mb: 3
                    }}
                >
                    Điểm danh
                </Typography>

                {/* Statistics Cards */}
                <StatisticsSection statistics={statistics} />

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
                        {/* Month / Year / Week Picker */}
                        <MonthWeekFilter
                            selectedMonth={selectedMonth}
                            setSelectedMonth={setSelectedMonth}
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                            monthNames={monthNames}
                            yearOptions={yearOptions}
                            weeksInMonth={weeksInMonth}
                            selectedWeekId={selectedWeekId}
                            setSelectedWeekId={setSelectedWeekId}
                            fromDate={fromDate}
                            toDate={toDate}
                            setFromDate={setFromDate}
                            setToDate={setToDate}
                            setPage={setPage}
                        />

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

                            <FormControl size="small" sx={{ minWidth: 160 }}>
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
                                <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.PRIMARY[50], 0.5) }} align="right">
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                // Lần load đầu: chỉ hiển thị header, body rỗng
                                null
                            ) : schedules.length === 0 ? (
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
                            ) : (
                                groupedSchedules.map(({ teamId, teamName, teamSchedules }) => (
                                    <React.Fragment key={teamId}>
                                        {/* Team Header Row */}
                                        <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.4) }}>
                                            <TableCell colSpan={6} sx={{ py: 1.5, borderBottom: `2px solid ${COLORS.PRIMARY[300]}` }}>
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
                                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                                                        {schedule.employee?.full_name || '—'}
                                                                    </Typography>
                                                                    {schedule.employee?.isLeader && (
                                                                        <Chip
                                                                            label="Leader"
                                                                            size="small"
                                                                            color="error"
                                                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                                {schedule.employee?.sub_role && !schedule.employee?.isLeader && (
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
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(event) => setActionMenu({ anchorEl: event.currentTarget, schedule })}
                                                        >
                                                            <MoreVert fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Action menu cho Manager điểm danh thay */}
                <Menu
                    anchorEl={actionMenu.anchorEl}
                    open={Boolean(actionMenu.anchorEl)}
                    onClose={() => setActionMenu({ anchorEl: null, schedule: null })}
                >
                    {STATUS_ORDER.map((statusKey) => (
                        <MenuItem
                            key={statusKey}
                            selected={statusKey === actionMenu.schedule?.status}
                            onClick={async () => {
                                const current = actionMenu.schedule;
                                setActionMenu({ anchorEl: null, schedule: null });
                                if (current) {
                                    // Confirm khi chuyển sang các trạng thái "xấu"
                                    if (
                                        ['ABSENT', 'EARLY_LEAVE'].includes(statusKey) &&
                                        !window.confirm(`Xác nhận đánh dấu "${STATUS_LABELS[statusKey]}" cho ${current.employee?.full_name || 'nhân viên'}?`)
                                    ) {
                                        return;
                                    }
                                    await updateAttendanceStatusForManager(
                                        current,
                                        statusKey,
                                        setError,
                                        setRefreshKey,
                                        setIsLoading
                                    );
                                }
                            }}
                        >
                            {STATUS_LABELS[statusKey]}
                        </MenuItem>
                    ))}
                </Menu>

                {/* Pagination */}
                {pagination && pagination.total_items_count > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Pagination
                            page={page}
                            totalPages={pagination.total_pages_count}
                            onPageChange={setPage}
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
        </Box>
    );
};

export default ManagerAttendancePage;


