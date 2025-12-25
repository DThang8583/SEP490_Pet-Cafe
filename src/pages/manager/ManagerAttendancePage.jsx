import React, { useEffect, useState, useMemo, useCallback, memo, useTransition, useDeferredValue } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, Avatar, alpha, Button, IconButton, Menu } from '@mui/material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import dailyScheduleApi from '../../api/dailyScheduleApi';
import { getTeams, getTeamMembers, getTeamWorkShifts } from '../../api/teamApi';
import { WEEKDAYS } from '../../api/workShiftApi';
import apiClient from '../../config/config';
import { MoreVert, ChevronLeft, ChevronRight, ChecklistRtl } from '@mui/icons-material';

const STATUS_LABELS = {
    PENDING: 'Chờ điểm danh',
    PRESENT: 'Có mặt',
    ABSENT: 'Vắng mặt',
    EXCUSED: 'Vắng có phép',
    LATE: 'Đi muộn',
    EARLY_LEAVE: 'Về sớm'
};

// Thứ tự hiển thị trạng thái trong menu MoreVert (ưu tiên các trạng thái thực tế)
const STATUS_ORDER = ['PRESENT', 'ABSENT', 'EXCUSED', 'EARLY_LEAVE', 'LATE', 'PENDING'];

const STATUS_COLORS = {
    PENDING: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] },
    PRESENT: { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700] },
    ABSENT: { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700] },
    EXCUSED: { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] },
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
    const jsDay = date.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    return WEEKDAYS[index];
};

// Extract error message from API error response
const extractErrorMessage = (error, fallback) => {
    if (error?.response?.data) {
        const { message, error: err, errors } = error.response.data;
        if (Array.isArray(message)) return message.join('. ');
        if (typeof message === 'string') return message;
        if (Array.isArray(err)) return err.join('. ');
        if (typeof err === 'string') return err;
        if (errors && typeof errors === 'object') {
            const combined = Object.values(errors).flat().join('. ');
            if (combined) return combined;
        }
    }
    return error?.message || fallback;
};

// Build full member list for team: includes Leader + members (avoid duplicates)
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

    // Merge all possible member sources (team.members from getTeams, team_members from getTeamMembers)
    const rawMembers = [
        ...((team.members && Array.isArray(team.members)) ? team.members : []),
        ...((team.team_members && Array.isArray(team.team_members)) ? team.team_members : [])
    ];

    rawMembers.forEach((tm) => {
        // tm can be team_member (has employee field) or employee directly
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

// Manager updates attendance status directly for a record
const updateAttendanceStatusForManager = async (schedule, newStatus, setAlert, setRefreshKey) => {
    if (!schedule) return;

    const teamId = schedule.team_member?.team_id || schedule.team_id;
    const teamMemberId = schedule.team_member?.id || schedule.team_member_id;
    const recordId = schedule.id || teamMemberId;

    if (!teamId || !recordId) {
        setAlert({
            open: true,
            title: 'Lỗi',
            message: 'Không tìm thấy thông tin điểm danh để cập nhật.',
            type: 'error'
        });
        return;
    }

    try {
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

        setAlert({
            open: true,
            title: 'Thành công',
            message: 'Cập nhật trạng thái điểm danh thành công!',
            type: 'success'
        });
    } catch (error) {
        const errorMessage = extractErrorMessage(error, 'Không thể cập nhật điểm danh');
        setAlert({
            open: true,
            title: 'Lỗi',
            message: errorMessage,
            type: 'error'
        });
    }
};

// Format functions with caching for better performance
const dateFormatCache = new Map();
const formatDate = (dateString) => {
    if (!dateString) return '—';
    if (dateFormatCache.has(dateString)) {
        return dateFormatCache.get(dateString);
    }
    const date = new Date(dateString);
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekday = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${weekday}, ${day}/${month}/${year}`;
    dateFormatCache.set(dateString, formatted);
    // Limit cache size to prevent memory issues
    if (dateFormatCache.size > 1000) {
        const firstKey = dateFormatCache.keys().next().value;
        dateFormatCache.delete(firstKey);
    }
    return formatted;
};

const timeFormatCache = new Map();
const formatTime = (timeString) => {
    if (!timeString) return '—';
    if (timeFormatCache.has(timeString)) {
        return timeFormatCache.get(timeString);
    }
    const parts = timeString.split(':');
    const formatted = `${parts[0]}:${parts[1]}`;
    timeFormatCache.set(timeString, formatted);
    if (timeFormatCache.size > 500) {
        const firstKey = timeFormatCache.keys().next().value;
        timeFormatCache.delete(firstKey);
    }
    return formatted;
};

// --- Statistics helpers ------------------------------------------------------

const buildStatistics = (allSchedules) => {
    let pending = 0;
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    let earlyLeave = 0;

    for (let i = 0; i < allSchedules.length; i++) {
        const status = allSchedules[i]?.status;
        switch (status) {
            case 'PENDING':
                pending++;
                break;
            case 'PRESENT':
                present++;
                break;
            case 'ABSENT':
                absent++;
                break;
            case 'EXCUSED':
                excused++;
                break;
            case 'LATE':
                late++;
                break;
            case 'EARLY_LEAVE':
                earlyLeave++;
                break;
        }
    }

    return {
        total: allSchedules.length,
        pending,
        present,
        absent,
        excused,
        late,
        earlyLeave
    };
};

// --- Weeks helpers -----------------------------------------------------------

const buildWeeksForMonth = (year, month) => {
    const result = [];
    if (year === undefined || year === null || month === undefined || month === null) {
        return result;
    }

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Find Monday of the week containing day 1
    const firstDayOfWeek = firstOfMonth.getDay();
    const diffToMonday = (firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek);
    const currentMonday = new Date(firstOfMonth);
    currentMonday.setDate(firstOfMonth.getDate() + diffToMonday);

    let index = 1;
    while (currentMonday <= lastOfMonth) {
        const weekStart = new Date(currentMonday);
        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Limit within month range
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

const StatisticsSection = memo(({ statistics }) => (
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
            { label: 'Vắng có phép', value: statistics.excused, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
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
                        <Typography variant="h4" fontWeight={600} color={stat.valueColor}>
                            {stat.value}
                        </Typography>
                    </Paper>
                </Box>
            );
        })}
    </Box>
));
StatisticsSection.displayName = 'StatisticsSection';

const MonthWeekFilter = memo(({
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
    const handlePrevMonth = useCallback(() => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    }, [selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

    const handleNextMonth = useCallback(() => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    }, [selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

    const handleThisWeek = useCallback(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

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
    }, [selectedYear, selectedMonth, weeksInMonth, setSelectedMonth, setSelectedYear, setSelectedWeekId, setFromDate, setToDate, setPage]);

    const currentWeekLabel = useMemo(() => {
        const w = weeksInMonth.find(x => x.id === selectedWeekId) || weeksInMonth[0];
        return w ? w.label.split('(')[0].trim() : '';
    }, [selectedWeekId, weeksInMonth]);

    const handlePrevWeek = useCallback(() => {
        const currentIndex = weeksInMonth.findIndex(w => w.id === selectedWeekId);
        if (currentIndex > 0) {
            const w = weeksInMonth[currentIndex - 1];
            setSelectedWeekId(w.id);
            setFromDate(w.from);
            setToDate(w.to);
        }
        setPage(1);
    }, [weeksInMonth, selectedWeekId, setSelectedWeekId, setFromDate, setToDate, setPage]);

    const handleNextWeek = useCallback(() => {
        const currentIndex = weeksInMonth.findIndex(w => w.id === selectedWeekId);
        if (currentIndex < weeksInMonth.length - 1) {
            const w = weeksInMonth[currentIndex + 1];
            setSelectedWeekId(w.id);
            setFromDate(w.from);
            setToDate(w.to);
        }
        setPage(1);
    }, [weeksInMonth, selectedWeekId, setSelectedWeekId, setFromDate, setToDate, setPage]);

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
                                onClick={handlePrevWeek}
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
                                onClick={handleNextWeek}
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
});
MonthWeekFilter.displayName = 'MonthWeekFilter';

// Memoized Schedule Row Component for better performance
const ScheduleRow = memo(({ schedule, onMenuOpen }) => {
    const statusInfo = useMemo(() => STATUS_COLORS[schedule.status] || STATUS_COLORS.PENDING, [schedule.status]);
    const statusLabel = useMemo(() => STATUS_LABELS[schedule.status] || schedule.status, [schedule.status]);
    const formattedDate = useMemo(() => formatDate(schedule.date), [schedule.date]);
    const timeRange = useMemo(() => {
        if (!schedule.work_shift) return null;
        return `${formatTime(schedule.work_shift.start_time)} - ${formatTime(schedule.work_shift.end_time)}`;
    }, [schedule.work_shift]);

    return (
        <TableRow hover sx={{ '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.3) } }}>
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
                                {schedule.employee.sub_role === 'SALE_STAFF' ? 'Nhân viên bán hàng' :
                                    schedule.employee.sub_role === 'WORKING_STAFF' ? 'Nhân viên chăm sóc' :
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
                    {timeRange && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {timeRange}
                        </Typography>
                    )}
                </Box>
            </TableCell>
            <TableCell>
                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {formattedDate}
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
                    onClick={(event) => onMenuOpen(event, schedule)}
                >
                    <MoreVert fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
});
ScheduleRow.displayName = 'ScheduleRow';

const buildGroupedSchedules = (schedules, teams) => {
    if (!schedules || !schedules.length) return [];

    // Use Map for better performance
    const schedulesByTeam = new Map();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    schedules.forEach((schedule) => {
        const teamId = schedule.team_member?.team_id || 'no-team';
        if (!schedulesByTeam.has(teamId)) {
            schedulesByTeam.set(teamId, []);
        }
        schedulesByTeam.get(teamId).push(schedule);
    });

    const sortedTeamIds = Array.from(schedulesByTeam.keys()).sort((a, b) => {
        if (a === 'no-team') return 1;
        if (b === 'no-team') return -1;
        const teamA = teamMap.get(a);
        const teamB = teamMap.get(b);
        return (teamA?.name || '').localeCompare(teamB?.name || '');
    });

    return sortedTeamIds.map((teamId) => {
        const teamSchedules = schedulesByTeam.get(teamId);
        const team = teamMap.get(teamId);
        const teamName = team?.name || 'Chưa phân nhóm';
        return { teamId, teamName, teamSchedules };
    });
};

// --- Main page ---------------------------------------------------------------

// Manager Attendance Page
const ManagerAttendancePage = () => {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    const [error, setError] = useState('');
    const [alert, setAlert] = useState({ open: false, title: 'Thông báo', message: '', type: 'info' });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState(null); // { schedule, statusKey }
    const [isConfirming, setIsConfirming] = useState(false);
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

    // Teams list (enriched with team_members + team_work_shifts)
    const [teams, setTeams] = useState([]);

    // Pagination state
    const [page, setPage] = useState(1);
    // Mặc định 50 bản ghi/trang để Select "Hiển thị" không bị rỗng
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [selectedWeekId, setSelectedWeekId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Action menu state
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, schedule: null });

    // Raw schedules from BE for statistics
    const [rawSchedules, setRawSchedules] = useState([]);

    // Deferred values for non-urgent updates
    const deferredSchedules = useDeferredValue(schedules);
    const deferredPagination = useDeferredValue(pagination);

    // Handlers
    const handleActionMenuOpen = useCallback((event, schedule) => {
        setActionMenu({ anchorEl: event.currentTarget, schedule });
    }, []);

    const handleActionMenuClose = useCallback(() => {
        setActionMenu({ anchorEl: null, schedule: null });
    }, []);

    const handleUpdateStatus = useCallback(async (schedule, newStatus) => {
        await updateAttendanceStatusForManager(
            schedule,
            newStatus,
            setAlert,
            setRefreshKey
        );
    }, []);

    // Set default month/year to current time
    useEffect(() => {
        const now = new Date();
        setSelectedMonth(now.getMonth());
        setSelectedYear(now.getFullYear());
    }, []);

    // Load full teams data: all teams + members + team_work_shifts
    useEffect(() => {
        const loadTeams = async () => {
            try {
                setIsLoading(true);
                const response = await getTeams({
                    page: 0,
                    limit: 1000
                });

                if (!response.success || !Array.isArray(response.data)) {
                    setTeams([]);
                    setAlert({
                        open: true,
                        title: 'Cảnh báo',
                        message: 'Không thể tải danh sách nhóm. Vui lòng thử lại sau.',
                        type: 'warning'
                    });
                    setIsLoading(false);
                    return;
                }

                let enrichFailedCount = 0;
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

                            // Track if enrichment failed
                            if (membersResp.status === 'rejected' || workShiftsResp.status === 'rejected') {
                                enrichFailedCount++;
                            }

                            return {
                                ...team,
                                team_members: teamMembers,
                                team_work_shifts: teamWorkShifts
                            };
                        } catch (error) {
                            enrichFailedCount++;
                            console.error('[Manager Attendance] Failed to enrich team data:', error);
                            return {
                                ...team,
                                team_members: [],
                                team_work_shifts: []
                            };
                        }
                    })
                );

                // Show warning if many teams failed to enrich
                if (enrichFailedCount > 0 && enrichFailedCount >= response.data.length / 2) {
                    setAlert({
                        open: true,
                        title: 'Cảnh báo',
                        message: `Không thể tải đầy đủ thông tin cho ${enrichFailedCount}/${response.data.length} nhóm. Một số dữ liệu có thể không hiển thị.`,
                        type: 'warning'
                    });
                }

                setTeams(teamsWithData);
            } catch (error) {
                console.error('[Manager Attendance] Failed to load teams:', error);
                setTeams([]);
                const errorMessage = extractErrorMessage(error, 'Không thể tải danh sách nhóm');
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: errorMessage,
                    type: 'error'
                });
                setIsLoading(false);
            }
        };
        loadTeams();
    }, []);

    // Fetch schedules for multiple teams
    const fetchSchedulesForTeams = useCallback(async (teamIds, params, setAlert) => {
        if (!Array.isArray(teamIds) || teamIds.length === 0) {
            return [];
        }

        let failedCount = 0;
        const schedulePromises = teamIds.map((teamId) =>
            dailyScheduleApi.getDailySchedules({
                ...params,
                TeamId: teamId
            }).catch((error) => {
                failedCount++;
                console.error(`[Manager Attendance] Failed to fetch schedules for team ${teamId}:`, error);
                return { success: false, data: [], error };
            })
        );

        const responses = await Promise.all(schedulePromises);

        // Show alert if all teams failed
        if (failedCount === teamIds.length && setAlert) {
            const errorMessage = extractErrorMessage(
                responses.find(r => r.error)?.error || new Error('Không thể tải lịch điểm danh'),
                'Không thể tải lịch điểm danh cho tất cả nhóm'
            );
            setAlert({
                open: true,
                title: 'Lỗi',
                message: errorMessage,
                type: 'error'
            });
        } else if (failedCount > 0 && failedCount < teamIds.length && setAlert) {
            // Show warning if some teams failed
            setAlert({
                open: true,
                title: 'Cảnh báo',
                message: `Không thể tải lịch điểm danh cho ${failedCount}/${teamIds.length} nhóm. Dữ liệu có thể không đầy đủ.`,
                type: 'warning'
            });
        }

        return responses
            .filter(response => response && response.success !== false && Array.isArray(response.data) && response.data.length > 0)
            .flatMap(response => response.data);
    }, []);

    // Memoized values
    const allTeamIds = useMemo(() => {
        if (!teams || teams.length === 0) return [];
        if (selectedTeam === 'all') {
            return teams.map(t => t.id).filter(Boolean);
        }
        return teams.filter(t => t.id === selectedTeam).map(t => t.id).filter(Boolean);
    }, [teams, selectedTeam]);

    const dateRange = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            from: fromDate || today,
            to: toDate || today
        };
    }, [fromDate, toDate]);

    const filteredTeams = useMemo(() => {
        if (selectedTeam === 'all') return teams;
        return teams.filter(t => t.id === selectedTeam);
    }, [teams, selectedTeam]);

    // Load daily schedules and expand by workshift to get all team/shift/date/member records
    useEffect(() => {
        const loadSchedules = async () => {
            if (teams.length === 0) {
                return;
            }

            try {
                setIsLoading(true);
                setError('');

                if (allTeamIds.length === 0) {
                    startTransition(() => {
                        setSchedules([]);
                        setPagination(null);
                    });
                    setIsLoading(false);
                    return;
                }

                const baseParams = {
                    page_index: 0,
                    page_size: 1000,
                    FromDate: dateRange.from,
                    ToDate: dateRange.to
                };

                const rawSchedules = await fetchSchedulesForTeams(allTeamIds, baseParams, setAlert);
                setRawSchedules(rawSchedules || []);

                // Fast index for lookup by team/shift/date/employee
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

                // Expand by workshift + members to generate all records
                // Optimize date generation
                const from = new Date(dateRange.from);
                const to = new Date(dateRange.to);
                const allDates = [];
                const fromTime = from.getTime();
                const toTime = to.getTime();
                const ONE_DAY_MS = 86400000;
                // Pre-allocate array size for better performance
                const dateCount = Math.ceil((toTime - fromTime) / ONE_DAY_MS) + 1;
                allDates.length = dateCount;
                let dateIndex = 0;
                for (let time = fromTime; time <= toTime; time += ONE_DAY_MS) {
                    allDates[dateIndex++] = new Date(time);
                }

                const expanded = [];
                const teamMembersMap = new Map();
                filteredTeams.forEach((team) => {
                    teamMembersMap.set(team.id, getAllTeamMembersForManager(team));
                });

                filteredTeams.forEach((team) => {
                    const teamMembers = teamMembersMap.get(team.id);
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

                        const workingDaysSet = new Set(workingDays);

                        allDates.forEach((dateObj) => {
                            const dateStr = dateObj.toISOString().split('T')[0];
                            const dayKey = getDayKeyFromDate(dateStr);
                            if (!dayKey || !workingDaysSet.has(dayKey)) return;

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

                                // Merge existing employee data with team member employee data to preserve isLeader flag
                                const mergedEmployee = existing?.employee
                                    ? {
                                        ...existing.employee,
                                        // Preserve isLeader flag from team member if it exists
                                        isLeader: employee.isLeader !== undefined ? employee.isLeader : existing.employee.isLeader
                                    }
                                    : employee;

                                expanded.push({
                                    id: existing?.id || key,
                                    team_member: existing?.team_member || {
                                        id: tm.id,
                                        team_id: team.id,
                                        employee_id: employeeId,
                                        employee: mergedEmployee
                                    },
                                    employee: mergedEmployee,
                                    work_shift: existing?.work_shift || shift,
                                    date: existing?.date || dateStr,
                                    status,
                                    notes: existing?.notes || null
                                });
                            });
                        });
                    });
                });

                // Add attendance records from BE that are not in member list (in case team is missing members)
                // Use Set for O(1) lookup performance
                const existingKeys = new Set();
                expanded.forEach((rec) => {
                    const tId = rec.team_member?.team_id || rec.team_id;
                    const sId = rec.work_shift?.id || rec.work_shift_id;
                    const dStr = rec.date ? new Date(rec.date).toISOString().split('T')[0] : null;
                    const empId = rec.employee?.id || rec.employee_id || rec.team_member?.employee_id;
                    if (tId && sId && dStr && empId) {
                        existingKeys.add(`${tId}|${sId}|${dStr}|${empId}`);
                    }
                });

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

                    // Try to find the team and check if this employee is a leader
                    const team = filteredTeams.find(t => t.id === teamId);
                    let isLeader = false;
                    if (team) {
                        const leader = team.leader;
                        const leaderIds = [
                            leader?.id,
                            leader?.employee_id,
                            leader?.account_id,
                            team.leader_id
                        ].filter(Boolean);

                        const employeeIds = [
                            employeeId,
                            s.employee?.id,
                            s.employee?.employee_id,
                            s.employee?.account_id,
                            s.team_member?.employee_id
                        ].filter(Boolean);

                        isLeader = leaderIds.some(lid => employeeIds.includes(lid));
                    }

                    expanded.push({
                        id: s.id || key,
                        team_member: s.team_member || null,
                        employee: {
                            ...(s.employee || { id: employeeId, full_name: s.employee_name || 'N/A' }),
                            isLeader
                        },
                        work_shift: s.work_shift || null,
                        date: s.date || dateStr,
                        status,
                        notes: s.notes || null
                    });
                });

                // Sort by date
                expanded.sort((a, b) => {
                    const dateA = new Date(a.date || 0).getTime();
                    const dateB = new Date(b.date || 0).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                    return (a.employee?.full_name || '').localeCompare(b.employee?.full_name || '');
                });

                const totalItems = expanded.length;
                const startIndex = (page - 1) * itemsPerPage;
                const pagedData = expanded.slice(startIndex, startIndex + itemsPerPage);

                // Use startTransition for non-urgent state updates
                startTransition(() => {
                    setSchedules(pagedData);
                    setPagination({
                        total_items_count: totalItems,
                        page_size: itemsPerPage,
                        page_index: page - 1,
                        total_pages_count: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
                        has_next: startIndex + itemsPerPage < totalItems,
                        has_previous: page > 1
                    });
                });
            } catch (e) {
                console.error('[Manager Attendance] loadSchedules error:', e);
                const errorMessage = extractErrorMessage(e, 'Không thể tải danh sách điểm danh');
                setError(errorMessage);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: errorMessage,
                    type: 'error'
                });
                setSchedules([]);
                setPagination(null);
            } finally {
                setIsLoading(false);
                setHasInitialLoad(true);
            }
        };

        loadSchedules();
    }, [page, itemsPerPage, selectedTeam, dateRange.from, dateRange.to, statusFilter, filteredTeams, allTeamIds, fetchSchedulesForTeams, refreshKey]);

    // Memoized computed values
    const statistics = useMemo(() => buildStatistics(rawSchedules), [rawSchedules]);

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
        () => buildGroupedSchedules(deferredSchedules, teams),
        [deferredSchedules, teams]
    );

    const weeksInMonth = useMemo(
        () => buildWeeksForMonth(selectedYear, selectedMonth),
        [selectedMonth, selectedYear]
    );

    const currentWeekInMonth = useMemo(() => {
        if (!weeksInMonth.length) return null;
        const today = new Date();
        return weeksInMonth.find((w) => today >= w.fromDate && today <= w.toDate) || null;
    }, [weeksInMonth]);

    // Auto-select week when month/year changes (prioritize current week if in same month/year)
    useEffect(() => {
        if (!weeksInMonth.length) return;

        let targetWeek = null;

        if (selectedWeekId) {
            targetWeek = weeksInMonth.find((w) => w.id === selectedWeekId) || null;
        }

        if (!targetWeek && currentWeekInMonth) {
            targetWeek = currentWeekInMonth;
        }

        if (!targetWeek) {
            targetWeek = weeksInMonth[0];
        }

        if (targetWeek && (selectedWeekId !== targetWeek.id || fromDate !== targetWeek.from || toDate !== targetWeek.to)) {
            startTransition(() => {
                setSelectedWeekId(targetWeek.id);
                setFromDate(targetWeek.from);
                setToDate(targetWeek.to);
            });
        }
    }, [weeksInMonth, currentWeekInMonth, selectedWeekId, fromDate, toDate]);

    // Show loading until initial load is complete
    if (isLoading || !hasInitialLoad) {
        return <Loading fullScreen />;
    }

    // Show pending indicator for non-urgent updates
    const showPendingIndicator = isPending && hasInitialLoad;

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Page Header */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <ChecklistRtl sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                        <Typography variant="h4" fontWeight={600}>
                            Quản lý Điểm danh
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Theo dõi và cập nhật trạng thái điểm danh cho các nhóm nhân viên theo ca làm việc và tuần làm việc
                    </Typography>
                </Box>

                {/* Statistics Cards */}
                <StatisticsSection statistics={statistics} />

                {/* Pending indicator for non-urgent updates */}
                {showPendingIndicator && (
                    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
                        <Chip
                            label="Đang tải..."
                            size="small"
                            sx={{
                                bgcolor: COLORS.INFO[500],
                                color: 'white',
                                fontWeight: 600
                            }}
                        />
                    </Box>
                )}

                {/* Filters */}
                <Paper sx={{ mb: 2 }}>
                    <Stack spacing={2} sx={{ p: 2.5 }}>
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
                    </Stack>
                </Paper>

                {/* Advanced Filters */}
                <Paper sx={{ mb: 2 }}>
                    <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', p: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Nhóm</InputLabel>
                            <Select
                                label="Nhóm"
                                value={selectedTeam}
                                onChange={(e) => {
                                    startTransition(() => {
                                        setSelectedTeam(e.target.value);
                                        setPage(1);
                                    });
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
                                startTransition(() => {
                                    setFromDate(e.target.value);
                                    setPage(1);
                                });
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
                                startTransition(() => {
                                    setToDate(e.target.value);
                                    setPage(1);
                                });
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
                                    startTransition(() => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    });
                                }}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="PENDING">Chờ điểm danh</MenuItem>
                                <MenuItem value="EXCUSED">Vắng có phép</MenuItem>
                                <MenuItem value="PRESENT">Có mặt</MenuItem>
                                <MenuItem value="ABSENT">Vắng mặt</MenuItem>
                                <MenuItem value="LATE">Đi muộn</MenuItem>
                                <MenuItem value="EARLY_LEAVE">Về sớm</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ flexGrow: 1 }} />
                    </Toolbar>
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
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
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
                            {deferredSchedules.length === 0 ? (
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
                                        {teamSchedules.map((schedule) => (
                                            <ScheduleRow
                                                key={schedule.id}
                                                schedule={schedule}
                                                onMenuOpen={handleActionMenuOpen}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Action menu for Manager to update attendance */}
                <Menu
                    anchorEl={actionMenu.anchorEl}
                    open={Boolean(actionMenu.anchorEl)}
                    onClose={handleActionMenuClose}
                >
                    {STATUS_ORDER.map((statusKey) => {
                        const statusLabel = STATUS_LABELS[statusKey];
                        if (!statusLabel) return null;

                        return (
                            <MenuItem
                                key={statusKey}
                                selected={statusKey === actionMenu.schedule?.status}
                                onClick={async () => {
                                    const current = actionMenu.schedule;
                                    handleActionMenuClose();
                                    if (!current) return;
                                    if (['ABSENT', 'EARLY_LEAVE'].includes(statusKey)) {
                                        setConfirmPayload({ schedule: current, statusKey });
                                        setConfirmOpen(true);
                                    } else {
                                        await handleUpdateStatus(current, statusKey);
                                    }
                                }}
                            >
                                {statusLabel}
                            </MenuItem>
                        );
                    }).filter(Boolean)}
                </Menu>
                <ConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => { setConfirmOpen(false); setConfirmPayload(null); }}
                    onConfirm={async () => {
                        if (!confirmPayload) return;
                        setIsConfirming(true);
                        try {
                            await handleUpdateStatus(confirmPayload.schedule, confirmPayload.statusKey);
                        } finally {
                            setIsConfirming(false);
                            setConfirmOpen(false);
                            setConfirmPayload(null);
                        }
                    }}
                    title="Xác nhận"
                    message={confirmPayload ? `Xác nhận đánh dấu "${STATUS_LABELS[confirmPayload.statusKey] || confirmPayload.statusKey}" cho ${confirmPayload.schedule?.employee?.full_name || 'nhân viên'}?` : 'Xác nhận hành động?'}
                    confirmText="Xác nhận"
                    cancelText="Hủy"
                    type="warning"
                    isLoading={isConfirming}
                />

                {/* Pagination */}
                {deferredPagination && deferredPagination.total_items_count > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Pagination
                            page={page}
                            totalPages={deferredPagination.total_pages_count}
                            onPageChange={(newPage) => {
                                startTransition(() => {
                                    setPage(newPage);
                                });
                            }}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(newValue) => {
                                startTransition(() => {
                                    setItemsPerPage(newValue);
                                    setPage(1);
                                });
                            }}
                            totalItems={deferredPagination.total_items_count}
                        />
                    </Box>
                )}

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alert.open}
                    onClose={() => setAlert({ ...alert, open: false })}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                />
            </Box>
        </Box>
    );
};

export default ManagerAttendancePage;


