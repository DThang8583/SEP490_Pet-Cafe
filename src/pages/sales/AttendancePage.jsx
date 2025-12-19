import React, { useEffect, useState, useMemo, useCallback, useTransition, useDeferredValue } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Chip, Button, Table, TableHead, TableBody, TableRow, TableCell, Alert, Snackbar, Skeleton, Avatar, Divider, Select, FormControl, InputLabel, alpha, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, IconButton, Tooltip, Card, CardContent } from '@mui/material';
import { ChecklistRtl, CheckCircle, AccessTime, Block, Person, Groups, Event, Close, Edit, CalendarToday, ChevronLeft, ChevronRight } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';
import { getDailySchedules } from '../../api/dailyScheduleApi';
import apiClient from '../../config/config';
import { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';
import Loading from '../../components/loading/Loading';

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chưa điểm danh', icon: <AccessTime fontSize="small" />, color: 'warning' },
    { value: 'PRESENT', label: 'Có mặt', icon: <CheckCircle fontSize="small" />, color: 'success' },
    { value: 'ABSENT', label: 'Vắng mặt', icon: <Block fontSize="small" />, color: 'error' },
    { value: 'EXCUSED', label: 'Vắng có phép', icon: <CheckCircle fontSize="small" />, color: 'info' },
    { value: 'LATE', label: 'Đi muộn', icon: <AccessTime fontSize="small" />, color: 'warning' }
];

const STATUS_COLORS = {
    PENDING: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] },
    PRESENT: { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700] },
    ABSENT: { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700] },
    EXCUSED: { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] },
    LATE: { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] }
};

// Map sub_role sang nhãn tiếng Việt cho UI
const mapSubRoleLabel = (subRole) => {
    if (!subRole) return '';
    switch (subRole) {
        case 'WORKING_STAFF':
            return 'Nhân viên chăm sóc';
        case 'SALE_STAFF':
            return 'Nhân viên bán hàng';
        case 'MANAGER':
            return 'Quản lý';
        default:
            return subRole;
    }
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
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
};

const getDayKeyFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const jsDay = date.getDay(); // 0 = Sunday
    const index = jsDay === 0 ? 6 : jsDay - 1;
    return WEEKDAYS[index];
};

const normalizeDateOnly = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

// Kiểm tra một ngày có phải là ngày hôm nay (theo thời gian thực) hay không
const isToday = (dateString) => {
    const normalized = normalizeDateOnly(dateString);
    if (!normalized) return false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return normalized === todayStr;
};

const AttendancePage = () => {
    const [isPending, startTransition] = useTransition();

    const [profileData] = useState(() => {
        const p = workingStaffApi.getProfile();
        return {
            id: p?.id,
            employee_id: p?.employee_id,
            account_id: p?.account_id,
            leader: p?.leader || false
        };
    });
    const isLeader = profileData.leader;
    const [teams, setTeams] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('day');
    const [attendanceDialog, setAttendanceDialog] = useState(null);
    const [activeDayTab, setActiveDayTab] = useState({});
    const [pendingChanges, setPendingChanges] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState({});

    const fetchSchedulesForTeams = useCallback(async (teamIds, params) => {
        if (!Array.isArray(teamIds) || teamIds.length === 0) {
            return [];
        }

        const schedulePromises = teamIds.map((teamId) =>
            getDailySchedules({
                ...params,
                TeamId: teamId
            }).catch((error) => {
                console.error(`Failed to fetch schedules for team ${teamId}:`, error);
                return { success: true, data: [] };
            })
        );

        const responses = await Promise.all(schedulePromises);

        let combined = [];
        responses.forEach((response) => {
            if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                combined.push(...response.data);
            }
        });

        return combined;
    }, []);

    // Deferred values to smooth out heavy recalculations on big data sets
    const deferredTeams = useDeferredValue(teams);
    const deferredAttendance = useDeferredValue(attendance);
    const upsertAttendanceRecord = useCallback((record) => {
        if (!record) return;
        const targetMemberId = record.team_member_id || record.team_member?.id;
        if (!targetMemberId) return;
        const targetDate = normalizeDateOnly(record.date);

        setAttendance((prev) => {
            let updated = false;
            const next = prev.map((item) => {
                const itemMemberId = item.team_member_id || item.team_member?.id;
                const itemDate = normalizeDateOnly(item.date);
                if (
                    itemMemberId === targetMemberId &&
                    (!targetDate || !itemDate || itemDate === targetDate)
                ) {
                    updated = true;
                    return {
                        ...item,
                        ...record,
                        date: record.date || item.date,
                        team_member: record.team_member || item.team_member
                    };
                }
                return item;
            });
            if (!updated) {
                next.push({
                    ...record,
                    date: record.date || new Date().toISOString(),
                    team_member_id: targetMemberId
                });
            }
            return next;
        });
    }, []);

    // Load teams data
    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                if (mounted) {
                    setTeams(data);
                }
            } catch (error) {
                console.error('Failed to load teams', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, []);

    // Calculate date range for month view
    const dateRange = useMemo(() => {
        if (viewMode === 'day') {
            return { fromDate: selectedDate, toDate: selectedDate };
        } else {
            const firstDay = new Date(selectedYear, selectedMonth, 1);
            const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
            return {
                fromDate: firstDay.toISOString().split('T')[0],
                toDate: lastDay.toISOString().split('T')[0]
            };
        }
    }, [viewMode, selectedDate, selectedMonth, selectedYear]);

    // Load attendance data for teams user belongs to
    useEffect(() => {
        if (teams.length === 0) return;
        let mounted = true;
        const loadAttendance = async () => {
            try {
                const teamIds = teams.map(team => team.id).filter(Boolean);

                if (teamIds.length === 0) {
                    if (mounted) setAttendance([]);
                    return;
                }

                const baseParams = {
                    page_index: 0,
                    page_size: 1000,
                    FromDate: dateRange.fromDate
                };

                if (dateRange.toDate !== dateRange.fromDate) {
                    baseParams.ToDate = dateRange.toDate;
                }

                let allSchedules = await fetchSchedulesForTeams(teamIds, baseParams);

                const validTeamIds = new Set(teamIds);
                allSchedules = allSchedules.filter(schedule => {
                    const scheduleTeamId = schedule.team_member?.team_id || schedule.team_id;
                    return scheduleTeamId && validTeamIds.has(scheduleTeamId);
                });

                if (mounted) setAttendance(allSchedules);
            } catch (error) {
                console.error('Failed to load attendance', error);
                if (mounted) setSnackbar({ message: 'Không thể tải dữ liệu điểm danh', severity: 'error' });
            }
        };
        loadAttendance();
        return () => {
            mounted = false;
        };
    }, [teams, dateRange.fromDate, dateRange.toDate, isLeader, profileData.id, profileData.employee_id, profileData.account_id, fetchSchedulesForTeams]);

    // Get all team members including leader (with deduplication)
    const getAllTeamMembers = (team) => {
        const members = [];
        const seenIds = new Set(); // Track seen member IDs to avoid duplicates
        const leaderId = team.leader_id;
        const leaderAccountId = team.leader?.account_id;
        let leaderTeamMemberId = null;

        // First, find if Leader is in team.members list
        if (team.members && team.members.length > 0) {
            const leaderMember = team.members.find(tm => {
                const tmEmployeeId = tm.employee_id || tm.employee?.id;
                const tmEmployeeAccountId = tm.employee?.account_id;
                return (
                    (leaderId && (tmEmployeeId === leaderId || tmEmployeeAccountId === leaderId)) ||
                    (leaderAccountId && (tmEmployeeId === leaderAccountId || tmEmployeeAccountId === leaderAccountId))
                );
            });
            if (leaderMember) {
                leaderTeamMemberId = leaderMember.id;
            }
        }

        if (team.leader) {
            const leaderMemberId = team.leader.id || team.leader.account_id;
            if (leaderMemberId && !seenIds.has(leaderMemberId)) {
                seenIds.add(leaderMemberId);
                members.push({
                    ...team.leader,
                    isLeader: true,
                    team_member_id: leaderTeamMemberId
                });
            }
        }

        (team.members || []).forEach((tm) => {
            if (tm.employee) {
                const tmEmployeeId = tm.employee_id || tm.employee?.id;
                const tmEmployeeAccountId = tm.employee?.account_id;
                const memberId = tmEmployeeId || tmEmployeeAccountId;

                if (memberId && seenIds.has(memberId)) {
                    return;
                }

                const isLeaderMember =
                    (leaderId && (tmEmployeeId === leaderId || tmEmployeeAccountId === leaderId)) ||
                    (leaderAccountId && (tmEmployeeId === leaderAccountId || tmEmployeeAccountId === leaderAccountId));

                if (!isLeaderMember && memberId) {
                    seenIds.add(memberId);
                    members.push({
                        ...tm.employee,
                        isLeader: false,
                        team_member_id: tm.id
                    });
                }
            }
        });
        return members;
    };

    // Calculate dates for a specific day of week in the date range
    const getDatesForDayOfWeek = (dayKey, fromDate, toDate) => {
        const dates = [];
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const targetDayIndex = WEEKDAYS.indexOf(dayKey);
        if (targetDayIndex === -1) return dates;

        const current = new Date(start);
        while (current <= end) {
            const dayIndex = current.getDay();
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            if (adjustedIndex === targetDayIndex) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // Build candidate IDs for current user
    const candidateIds = useMemo(() => {
        const ids = [
            profileData.id,
            profileData.employee_id,
            profileData.account_id
        ];
        return Array.from(new Set(ids.filter(Boolean)));
    }, [profileData.id, profileData.employee_id, profileData.account_id]);

    // Organize attendance by team -> shift -> day
    const attendanceByTeam = useMemo(() => {
        const result = [];
        deferredTeams.forEach((team) => {
            const leaderAccountId = team.leader?.account_id;
            const leaderId = team.leader?.id;
            const isTeamLeader = candidateIds.some(id =>
                id === team.leader_id ||
                id === leaderId ||
                id === leaderAccountId
            );

            const allMembers = getAllTeamMembers(team);

            const teamShifts = [];
            (team.team_work_shifts || []).forEach((shiftInfo) => {
                const shift = shiftInfo.work_shift || shiftInfo;
                const workingDays = normalizeWorkingDays(
                    shiftInfo.working_days?.length ? shiftInfo.working_days : shift?.applicable_days
                );

                const shiftDays = [];

                if (viewMode === 'day') {
                    const selected = new Date(selectedDate);
                    const selectedDayIndex = selected.getDay();
                    const adjustedIndex = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
                    const selectedDayKey = WEEKDAYS[adjustedIndex];

                    workingDays.forEach((dayKey) => {
                        const targetDayIndex = WEEKDAYS.indexOf(dayKey);
                        const currentDayIndex = adjustedIndex;
                        const daysToAdd = targetDayIndex - currentDayIndex;
                        const dateForThisDay = new Date(selected);
                        dateForThisDay.setDate(dateForThisDay.getDate() + daysToAdd);

                        const dateStr = dateForThisDay.toISOString().split('T')[0];

                        let dayMembers;

                        if (isTeamLeader) {
                            dayMembers = allMembers.map((member) => {
                                const existingRecord = deferredAttendance.find((schedule) => {
                                    const scheduleTeamId = schedule.team_member?.team_id || schedule.team_id;
                                    const scheduleShiftId = schedule.work_shift_id || schedule.work_shift?.id;
                                    const scheduleDate = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : null;
                                    const scheduleEmployeeId = schedule.employee_id || schedule.employee?.id || schedule.team_member?.employee_id;
                                    const scheduleAccountId = schedule.employee?.account_id;

                                    return (
                                        scheduleTeamId === team.id &&
                                        scheduleShiftId === shift.id &&
                                        scheduleDate === dateStr &&
                                        (scheduleEmployeeId === member.id ||
                                            scheduleAccountId === member.account_id ||
                                            scheduleEmployeeId === member.account_id)
                                    );
                                });

                                const teamMemberId = member.team_member_id ||
                                    existingRecord?.team_member_id ||
                                    existingRecord?.team_member?.id ||
                                    null;

                                return {
                                    member,
                                    date: dateStr,
                                    schedule: existingRecord || null,
                                    teamMemberId
                                };
                            });
                        } else {
                            dayMembers = deferredAttendance
                                .filter((schedule) => {
                                    const scheduleTeamId = schedule.team_member?.team_id || schedule.team_id;
                                    const scheduleShiftId = schedule.work_shift_id || schedule.work_shift?.id;
                                    const scheduleDate = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : null;
                                    return (
                                        scheduleTeamId === team.id &&
                                        scheduleShiftId === shift.id &&
                                        scheduleDate === dateStr
                                    );
                                })
                                .map((existingRecord) => {
                                    const scheduleEmployeeId = existingRecord.employee_id || existingRecord.employee?.id || existingRecord.team_member?.employee_id;
                                    const scheduleAccountId = existingRecord.employee?.account_id;

                                    const member = allMembers.find(m =>
                                        m.id === scheduleEmployeeId ||
                                        m.account_id === scheduleAccountId ||
                                        m.account_id === scheduleEmployeeId
                                    ) || existingRecord.employee || { full_name: 'N/A', id: scheduleEmployeeId };

                                    const teamMemberId = existingRecord.team_member_id || existingRecord.team_member?.id;

                                    return {
                                        member,
                                        date: dateStr,
                                        schedule: existingRecord,
                                        teamMemberId
                                    };
                                });
                        }

                        shiftDays.push({
                            dayKey: dayKey,
                            dates: [dateForThisDay],
                            members: dayMembers
                        });
                    });
                } else {
                    workingDays.forEach((dayKey) => {
                        const dates = getDatesForDayOfWeek(dayKey, dateRange.fromDate, dateRange.toDate);

                        if (dates.length === 0) return;

                        let dayMembers;

                        if (isTeamLeader) {
                            const seenKeys = new Set();
                            dayMembers = dates.map((date) => {
                                const dateStr = date.toISOString().split('T')[0];
                                return allMembers.map((member) => {
                                    const memberKey = `${member.id || member.account_id}-${dateStr}`;
                                    if (seenKeys.has(memberKey)) {
                                        return null;
                                    }
                                    seenKeys.add(memberKey);

                                    const existingRecord = attendance.find((schedule) => {
                                        const scheduleTeamId = schedule.team_member?.team_id || schedule.team_id;
                                        const scheduleShiftId = schedule.work_shift_id || schedule.work_shift?.id;
                                        const scheduleDate = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : null;
                                        const scheduleEmployeeId = schedule.employee_id || schedule.employee?.id || schedule.team_member?.employee_id;
                                        const scheduleAccountId = schedule.employee?.account_id;
                                        return (
                                            scheduleTeamId === team.id &&
                                            scheduleShiftId === shift.id &&
                                            scheduleDate === dateStr &&
                                            (scheduleEmployeeId === member.id ||
                                                scheduleAccountId === member.account_id ||
                                                scheduleEmployeeId === member.account_id)
                                        );
                                    });

                                    const teamMemberId = member.team_member_id ||
                                        existingRecord?.team_member_id ||
                                        existingRecord?.team_member?.id ||
                                        null;

                                    return {
                                        member,
                                        date: dateStr,
                                        schedule: existingRecord || null,
                                        teamMemberId
                                    };
                                });
                            }).flat().filter(Boolean);
                        } else {
                            dayMembers = deferredAttendance
                                .filter((schedule) => {
                                    const scheduleTeamId = schedule.team_member?.team_id || schedule.team_id;
                                    const scheduleShiftId = schedule.work_shift_id || schedule.work_shift?.id;
                                    const scheduleDate = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : null;

                                    if (scheduleTeamId !== team.id || scheduleShiftId !== shift.id) {
                                        return false;
                                    }

                                    return dates.some(date => date.toISOString().split('T')[0] === scheduleDate);
                                })
                                .map((existingRecord) => {
                                    const scheduleEmployeeId = existingRecord.employee_id || existingRecord.employee?.id || existingRecord.team_member?.employee_id;
                                    const scheduleAccountId = existingRecord.employee?.account_id;
                                    const scheduleDate = existingRecord.date ? new Date(existingRecord.date).toISOString().split('T')[0] : null;

                                    const member = allMembers.find(m =>
                                        m.id === scheduleEmployeeId ||
                                        m.account_id === scheduleAccountId ||
                                        m.account_id === scheduleEmployeeId
                                    ) || existingRecord.employee || { full_name: 'N/A', id: scheduleEmployeeId };

                                    const teamMemberId = existingRecord.team_member_id || existingRecord.team_member?.id;

                                    return {
                                        member,
                                        date: scheduleDate,
                                        schedule: existingRecord,
                                        teamMemberId
                                    };
                                });
                        }

                        if (dayMembers.length > 0) {
                            shiftDays.push({
                                dayKey,
                                dates,
                                members: dayMembers
                            });
                        }
                    });
                }

                if (shiftDays.length > 0 || workingDays.length > 0) {
                    teamShifts.push({
                        shiftInfo,
                        shift,
                        workingDays,
                        days: shiftDays
                    });
                }
            });

            if (teamShifts.length > 0 || allMembers.length > 0) {
                result.push({
                    team,
                    isTeamLeader,
                    allMembers,
                    shifts: teamShifts
                });
            }
        });
        return result;
    }, [deferredTeams, deferredAttendance, isLeader, profileData, viewMode, selectedDate, dateRange, candidateIds]);

    // Calculate statistics
    const attendanceStats = useMemo(() => {
        const stats = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            pending: 0
        };

        deferredAttendance.forEach((schedule) => {
            stats.total++;
            const status = schedule.status || 'PENDING';
            if (status === 'PRESENT') stats.present++;
            else if (status === 'ABSENT') stats.absent++;
            else if (status === 'LATE') stats.late++;
            else if (status === 'EXCUSED') stats.excused++;
            else stats.pending++;
        });

        return stats;
    }, [deferredAttendance]);

    const handleStatusClick = (memberData, newStatus, teamId, shiftId, date, dayKey, isTeamLeaderForThisTeam = false) => {
        if (!isTeamLeaderForThisTeam || !teamId) {
            setSnackbar({ message: 'Bạn không có quyền điểm danh', severity: 'error' });
            return;
        }

        const member = memberData.member || memberData.employee || memberData.team_member?.employee || {};
        const schedule = memberData.schedule || memberData;
        const dailyScheduleId = schedule?.id;
        const teamMemberId = schedule?.team_member_id || schedule?.team_member?.id || memberData.teamMemberId;

        const recordId = dailyScheduleId || teamMemberId;

        if (!recordId) {
            setSnackbar({
                message: 'Không tìm thấy thông tin thành viên. Vui lòng thử lại.',
                severity: 'error'
            });
            return;
        }

        const key = `${teamId}-${shiftId}-${dayKey}`;
        setPendingChanges(prev => {
            const existing = prev[key] || [];
            const existingIndex = existing.findIndex(
                item => item.recordId === recordId
            );

            // Giữ nguyên trạng thái gốc ngay từ lần đầu leader bấm
            const baseOriginalStatus = schedule?.status || 'PENDING';
            const previousChange = existingIndex >= 0 ? existing[existingIndex] : null;
            const originalStatus = previousChange?.originalStatus || baseOriginalStatus;

            const newChange = {
                recordId,
                dailyScheduleId,
                teamMemberId,
                status: newStatus,
                notes: schedule?.notes || '',
                memberName: member.full_name || member.name,
                date: date || schedule.date,
                originalStatus
            };

            let updated;
            if (existingIndex >= 0) {
                updated = [...existing];
                updated[existingIndex] = newChange;
            } else {
                updated = [...existing, newChange];
            }

            return {
                ...prev,
                [key]: updated
            };
        });

        setHasUnsavedChanges(prev => ({ ...prev, [key]: true }));

        setAttendance(prevAttendance => {
            if (dailyScheduleId) {
                return prevAttendance.map(item => {
                    if (item.id === dailyScheduleId) {
                        return {
                            ...item,
                            status: newStatus,
                            notes: schedule?.notes || item.notes
                        };
                    }
                    return item;
                });
            }
            return prevAttendance;
        });

        setSnackbar({
            message: `Đã đánh dấu ${member.full_name || 'thành viên'} là "${STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus}". Nhấn "Lưu" để cập nhật.`,
            severity: 'info'
        });
    };

    // Mở dialog để nhập / chỉnh sửa ghi chú cho từng người (không gọi API, chỉ lưu tạm để bấm Lưu chung)
    const handleOpenNotesDialog = (memberData, teamId, shiftId, date, dayKey, isTeamLeaderForThisTeam = false) => {
        if (!isTeamLeaderForThisTeam || !teamId) {
            setSnackbar({ message: 'Bạn không có quyền chỉnh sửa ghi chú', severity: 'error' });
            return;
        }

        const member = memberData.member || memberData.employee || memberData.team_member?.employee || {};
        const schedule = memberData.schedule || memberData;
        const dailyScheduleId = schedule?.id;
        const teamMemberId = schedule?.team_member_id || schedule?.team_member?.id || memberData.teamMemberId;
        const recordId = dailyScheduleId || teamMemberId;

        if (!recordId) {
            setSnackbar({
                message: 'Không tìm thấy thông tin điểm danh để ghi chú. Vui lòng thử lại.',
                severity: 'error'
            });
            return;
        }

        const key = `${teamId}-${shiftId}-${dayKey}`;
        const existingChanges = pendingChanges[key] || [];
        const existingChange = existingChanges.find((item) => item.recordId === recordId);

        const initialNotes = existingChange?.notes ?? schedule?.notes ?? '';
        const effectiveStatus = existingChange?.status || schedule?.status || 'PENDING';

        setAttendanceDialog({
            open: true,
            memberData,
            teamId,
            shiftId,
            date,
            dayKey,
            recordId,
            status: effectiveStatus,
            notes: initialNotes
        });
    };

    const handleBulkSave = async (teamId, shiftId, dayKey) => {
        const key = `${teamId}-${shiftId}-${dayKey}`;
        const changes = pendingChanges[key];

        if (!changes || changes.length === 0) {
            setSnackbar({ message: 'Không có thay đổi nào cần lưu.', severity: 'info' });
            return;
        }

        try {
            setLoading(true);

            const payload = changes.map(change => ({
                id: change.recordId,
                status: change.status,
                notes: change.notes || ''
            }));

            const response = await apiClient.put(`/teams/${teamId}/daily-schedules`, payload, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });

            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });

            setHasUnsavedChanges(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });

            setSnackbar({
                message: `Đã lưu điểm danh thành công cho ${changes.length} thành viên! Đang tải lại dữ liệu...`,
                severity: 'success'
            });

            // Delay nhỏ để đảm bảo backend đã xử lý xong
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reload data để hiển thị thông tin mới nhất
            const teamIds = teams.map(team => team.id).filter(Boolean);
            if (teamIds.length > 0) {
                const updatedSchedules = await fetchSchedulesForTeams(teamIds, {
                    page_index: 0,
                    page_size: 1000,
                    FromDate: dateRange.fromDate,
                    ToDate: dateRange.toDate
                });
                setAttendance(updatedSchedules);
            }

        } catch (error) {
            console.error('[Bulk Update] Error:', error);
            setSnackbar({
                message: error.response?.data?.message || error.response?.data?.error || error.message || 'Không thể lưu điểm danh. Vui lòng thử lại.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearChanges = async (teamId, shiftId, dayKey) => {
        const key = `${teamId}-${shiftId}-${dayKey}`;

        try {
            setLoading(true);

            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });

            setHasUnsavedChanges(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });

            setSnackbar({
                message: 'Đã hủy các thay đổi chưa lưu. Đang tải lại dữ liệu...',
                severity: 'info'
            });

            // Reload data để hiển thị lại trạng thái ban đầu
            const teamIds = teams.map(team => team.id).filter(Boolean);
            if (teamIds.length > 0) {
                const updatedSchedules = await fetchSchedulesForTeams(teamIds, {
                    page_index: 0,
                    page_size: 1000,
                    FromDate: dateRange.fromDate,
                    ToDate: dateRange.toDate
                });
                setAttendance(updatedSchedules);
            }
        } catch (error) {
            console.error('[Clear Changes] Error:', error);
            setSnackbar({
                message: 'Không thể tải lại dữ liệu. Vui lòng làm mới trang.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Hủy trạng thái điểm danh tạm thời cho 1 thành viên (trước khi Lưu)
    const handleResetMemberStatus = (teamId, shiftId, dayKey, recordId) => {
        const key = `${teamId}-${shiftId}-${dayKey}`;
        const changesForKey = pendingChanges[key] || [];
        const targetChange = changesForKey.find(c => c.recordId === recordId);
        const remainingChanges = changesForKey.filter(c => c.recordId !== recordId);

        // Cập nhật pendingChanges (xóa change của member đó)
        setPendingChanges(prev => {
            const updated = { ...prev };
            if (remainingChanges.length > 0) {
                updated[key] = remainingChanges;
            } else {
                delete updated[key];
            }
            return updated;
        });

        // Cập nhật cờ hasUnsavedChanges cho key đó
        setHasUnsavedChanges(prev => {
            const updated = { ...prev };
            if (remainingChanges.length > 0) {
                updated[key] = true;
            } else {
                delete updated[key];
            }
            return updated;
        });

        // Nếu có dailyScheduleId & originalStatus thì revert lại status trên UI
        if (targetChange?.dailyScheduleId && targetChange?.originalStatus) {
            setAttendance(prev =>
                prev.map(item =>
                    item.id === targetChange.dailyScheduleId
                        ? { ...item, status: targetChange.originalStatus }
                        : item
                )
            );
        }

        setSnackbar({
            message: 'Đã hủy trạng thái điểm danh tạm thời. Bạn có thể chọn lại trạng thái khác.',
            severity: 'info'
        });
    };

    const handleStatusChange = () => {
        if (!attendanceDialog) return;

        const { memberData, teamId, shiftId, date, notes, recordId, dayKey, status } = attendanceDialog;
        const member = memberData.member || memberData.employee || memberData.team_member?.employee || {};
        const schedule = memberData.schedule || memberData;
        const dailyScheduleId = schedule?.id;
        const teamMemberId = schedule?.team_member_id || schedule?.team_member?.id || memberData.teamMemberId;
        const effectiveRecordId = recordId || dailyScheduleId || teamMemberId;

        if (!teamId || !shiftId || !dayKey || !effectiveRecordId) {
            setSnackbar({
                message: 'Không đủ thông tin để lưu ghi chú. Vui lòng thử lại.',
                severity: 'error'
            });
            setAttendanceDialog(null);
            return;
        }

        const key = `${teamId}-${shiftId}-${dayKey}`;

        setPendingChanges((prev) => {
            const existing = prev[key] || [];
            const existingIndex = existing.findIndex((item) => item.recordId === effectiveRecordId);

            const newChange = {
                recordId: effectiveRecordId,
                dailyScheduleId,
                teamMemberId,
                status: existingIndex >= 0 ? existing[existingIndex].status : (status || schedule?.status || 'PENDING'),
                notes: notes || '',
                memberName: member.full_name || member.name,
                date: date || schedule.date
            };

            let updated;
            if (existingIndex >= 0) {
                updated = [...existing];
                updated[existingIndex] = newChange;
            } else {
                updated = [...existing, newChange];
            }

            return {
                ...prev,
                [key]: updated
            };
        });

        // Cập nhật notes hiển thị trong bảng cho record hiện tại
        if (dailyScheduleId) {
            setAttendance((prevAttendance) =>
                prevAttendance.map((item) => {
                    if (item.id === dailyScheduleId) {
                        return {
                            ...item,
                            notes: notes || ''
                        };
                    }
                    return item;
                })
            );
        }

        setSnackbar({
            message: 'Đã cập nhật ghi chú. Nhấn "Lưu" để gửi lên hệ thống.',
            severity: 'info'
        });
        setAttendanceDialog(null);
    };

    const handleMonthChange = (delta) => {
        if (selectedMonth + delta < 0) {
            startTransition(() => {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            });
        } else if (selectedMonth + delta > 11) {
            startTransition(() => {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            });
        } else {
            const nextMonth = selectedMonth + delta;
            startTransition(() => setSelectedMonth(nextMonth));
        }
    };

    return (
        <Box
            sx={{
                p: { xs: 2, md: 4 },
                bgcolor: COLORS.BACKGROUND.NEUTRAL,
                minHeight: '100vh',
                opacity: isPending ? 0.6 : 1,
                transition: 'opacity 0.2s ease-out'
            }}
        >
            <Stack spacing={4}>
                {/* Header Section */}
                <Box>
                    <Stack direction="row" spacing={2.5} alignItems="flex-start">
                        <Avatar
                            sx={{
                                bgcolor: COLORS.ERROR[500],
                                width: 56,
                                height: 56,
                                boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.3)}`
                            }}
                        >
                            <ChecklistRtl sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box flex={1}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY, mb: 1 }}>
                                Điểm danh
                            </Typography>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, lineHeight: 1.6 }}>
                                {isLeader
                                    ? 'Quản lý và đánh dấu điểm danh cho các thành viên trong team theo từng ca làm việc'
                                    : 'Xem trạng thái điểm danh của bạn trong team theo từng ngày/tháng'}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Statistics Cards - Professional Design */}
                {isLeader && attendanceStats.total > 0 && (
                    <Grid container spacing={2.5}>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.INFO[500]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Tổng số
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.INFO[700] }}>
                                    {attendanceStats.total}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.SUCCESS[500]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Có mặt
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                    {attendanceStats.present}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.ERROR[500]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Vắng mặt
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.ERROR[700] }}>
                                    {attendanceStats.absent}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.WARNING[500]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Chưa điểm danh
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                    {attendanceStats.pending}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.WARNING[400]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Đi muộn
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                    {attendanceStats.late}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    borderTop: `4px solid ${COLORS.INFO[500]}`,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `4px 8px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.3)}, 0 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 500 }}>
                                    Vắng có phép
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.INFO[700] }}>
                                    {attendanceStats.excused}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Filters - Professional Design */}
                <Card
                    sx={{
                        borderRadius: 3,
                        boxShadow: `0px 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                        border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                            <FormControl fullWidth>
                                <InputLabel>Chế độ xem</InputLabel>
                                <Select
                                    value={viewMode}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        startTransition(() => setViewMode(value));
                                    }}
                                    label="Chế độ xem"
                                >
                                    <MenuItem value="day">Theo ngày</MenuItem>
                                    <MenuItem value="month">Theo tháng</MenuItem>
                                </Select>
                            </FormControl>

                            {viewMode === 'day' ? (
                                <TextField
                                    type="date"
                                    label="Ngày"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        startTransition(() => setSelectedDate(value));
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: <CalendarToday sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                                    }}
                                />
                            ) : (
                                <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                                    <IconButton
                                        onClick={() => handleMonthChange(-1)}
                                        sx={{
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                            '&:hover': { bgcolor: COLORS.BACKGROUND.NEUTRAL }
                                        }}
                                    >
                                        <ChevronLeft />
                                    </IconButton>
                                    <TextField
                                        select
                                        value={selectedMonth}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            startTransition(() => setSelectedMonth(value));
                                        }}
                                        sx={{ flex: 1 }}
                                        label="Tháng"
                                        InputLabelProps={{ shrink: true }}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <MenuItem key={i} value={i}>
                                                Tháng {i + 1}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        type="number"
                                        value={selectedYear}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            startTransition(() => setSelectedYear(value));
                                        }}
                                        sx={{ width: 120 }}
                                        label="Năm"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <IconButton
                                        onClick={() => handleMonthChange(1)}
                                        sx={{
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                            '&:hover': { bgcolor: COLORS.BACKGROUND.NEUTRAL }
                                        }}
                                    >
                                        <ChevronRight />
                                    </IconButton>
                                </Stack>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Teams with Shifts and Days */}
                {loading ? (
                    <Stack spacing={2.5}>
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <Skeleton key={idx} variant="rounded" height={400} sx={{ borderRadius: 3 }} />
                        ))}
                    </Stack>
                ) : attendanceByTeam.length === 0 ? (
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: `0px 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                            border: `1px dashed ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`
                        }}
                    >
                        <CardContent sx={{ p: 8, textAlign: 'center' }}>
                            <ChecklistRtl sx={{ fontSize: 80, color: COLORS.TEXT.SECONDARY, mb: 3, opacity: 0.3 }} />
                            <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1.5, fontWeight: 600 }}>
                                {isLeader
                                    ? 'Chưa có dữ liệu điểm danh'
                                    : 'Bạn chưa có lịch điểm danh'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                {isLeader
                                    ? 'Chưa có dữ liệu điểm danh cho các team bạn phụ trách trong khoảng thời gian này.'
                                    : 'Bạn chưa có lịch điểm danh trong khoảng thời gian này.'}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Stack spacing={3}>
                        {attendanceByTeam.map(({ team, isTeamLeader, shifts }) => (
                            <Card
                                key={team.id}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    boxShadow: `0px 8px 24px ${alpha(COLORS.SHADOW.LIGHT, 0.12)}`,
                                    border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                    transition: 'box-shadow 0.3s',
                                    '&:hover': {
                                        boxShadow: `0px 12px 32px ${alpha(COLORS.SHADOW.LIGHT, 0.16)}`
                                    }
                                }}
                            >
                                {/* Team Header */}
                                <Box
                                    sx={{
                                        bgcolor: isTeamLeader ? COLORS.ERROR[50] : COLORS.INFO[50],
                                        p: 3.5,
                                        borderBottom: `2px solid ${alpha(isTeamLeader ? COLORS.ERROR[200] : COLORS.INFO[200], 0.6)}`
                                    }}
                                >
                                    <Stack direction="row" spacing={2.5} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={2.5} alignItems="center" flex={1}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: isTeamLeader ? COLORS.ERROR[500] : COLORS.INFO[500],
                                                    width: 64,
                                                    height: 64,
                                                    boxShadow: `0 4px 12px ${alpha(isTeamLeader ? COLORS.ERROR[500] : COLORS.INFO[500], 0.3)}`
                                                }}
                                            >
                                                <Groups sx={{ fontSize: 32 }} />
                                            </Avatar>
                                            <Box flex={1}>
                                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                        {team.name}
                                                    </Typography>
                                                    {isTeamLeader && (
                                                        <Chip
                                                            label="Leader"
                                                            color="error"
                                                            size="small"
                                                            sx={{ fontWeight: 700, height: 26 }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1.5 }}>
                                                    {team.work_type?.name || 'Nhóm dịch vụ'} • {team.area?.name || 'Khu vực chung'}
                                                </Typography>
                                                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                                    <Chip
                                                        icon={<Person fontSize="small" />}
                                                        label={`Leader: ${team.leader?.full_name || team.leader?.name || 'N/A'}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ bgcolor: 'white', fontWeight: 500 }}
                                                    />
                                                    <Chip
                                                        icon={<Groups fontSize="small" />}
                                                        label={`${team.members?.length || 0} thành viên`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ bgcolor: 'white', fontWeight: 500 }}
                                                    />
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </Box>

                                {/* Shifts */}
                                <CardContent sx={{ p: 3.5 }}>
                                    <Stack spacing={3.5}>
                                        {shifts.map(({ shiftInfo, shift, workingDays, days }, shiftIdx) => (
                                            <Card
                                                key={shift.id || shiftIdx}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                    borderLeft: `4px solid ${COLORS.ERROR[500]}`,
                                                    bgcolor: alpha(COLORS.ERROR[50] || '#fff5f5', 0.3),
                                                    boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.05)}`
                                                }}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    <Stack spacing={3}>
                                                        {/* Shift Header */}
                                                        <Stack spacing={1.5}>
                                                            <Stack direction="row" spacing={2} alignItems="center">
                                                                <Box
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderRadius: 2,
                                                                        bgcolor: COLORS.ERROR[100],
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <AccessTime sx={{ color: COLORS.ERROR[600], fontSize: 28 }} />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                                        {shift.name || 'Ca làm việc'}
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                                                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                            {shift.description && (
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, pl: 7 }}>
                                                                    {shift.description}
                                                                </Typography>
                                                            )}
                                                            {workingDays.length > 0 && (
                                                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, pl: 7 }}>
                                                                    {workingDays.map((day) => (
                                                                        <Chip
                                                                            key={day}
                                                                            label={WEEKDAY_LABELS[day]}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: 'white', fontWeight: 500 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            )}
                                                        </Stack>

                                                        <Divider />

                                                        {/* Days with Attendance - Professional Tabs Design */}
                                                        {days.length === 0 ? (
                                                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                                                <Event sx={{ fontSize: 48, color: COLORS.TEXT.SECONDARY, mb: 2, opacity: 0.3 }} />
                                                                <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                                                    Chưa có dữ liệu điểm danh cho ca này.
                                                                </Typography>
                                                            </Box>
                                                        ) : (
                                                            <Box>
                                                                {/* Day Tabs - Professional Design */}
                                                                <Box sx={{ mb: 3 }}>
                                                                    <Stack direction="row" spacing={1} sx={{
                                                                        borderBottom: `2px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                                        pb: 0.5
                                                                    }}>
                                                                        {days.map(({ dayKey }, tabIdx) => {
                                                                            const tabKey = `${shift.id}-${dayKey}`;
                                                                            const selectedDayIndex = new Date(selectedDate).getDay();
                                                                            const adjustedSelectedIndex = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
                                                                            const selectedDayKey = WEEKDAYS[adjustedSelectedIndex];
                                                                            const isActive = activeDayTab[tabKey] !== undefined
                                                                                ? activeDayTab[tabKey]
                                                                                : (viewMode === 'day' ? dayKey === selectedDayKey : tabIdx === 0);
                                                                            return (
                                                                                <Button
                                                                                    key={dayKey}
                                                                                    onClick={() => {
                                                                                        setActiveDayTab(prev => ({
                                                                                            ...prev,
                                                                                            [tabKey]: true
                                                                                        }));
                                                                                        days.forEach((d, idx) => {
                                                                                            if (idx !== tabIdx) {
                                                                                                const otherKey = `${shift.id}-${d.dayKey}`;
                                                                                                setActiveDayTab(prev => ({
                                                                                                    ...prev,
                                                                                                    [otherKey]: false
                                                                                                }));
                                                                                            }
                                                                                        });
                                                                                    }}
                                                                                    sx={{
                                                                                        px: 3,
                                                                                        py: 1.5,
                                                                                        borderRadius: 2,
                                                                                        borderRadiusBottomLeft: 0,
                                                                                        borderRadiusBottomRight: 0,
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 700,
                                                                                        fontSize: '0.95rem',
                                                                                        color: isActive ? COLORS.ERROR[600] : COLORS.TEXT.SECONDARY,
                                                                                        bgcolor: isActive ? COLORS.ERROR[50] : 'transparent',
                                                                                        borderBottom: isActive ? `3px solid ${COLORS.ERROR[500]}` : '3px solid transparent',
                                                                                        '&:hover': {
                                                                                            bgcolor: isActive ? COLORS.ERROR[50] : alpha(COLORS.ERROR[50], 0.5),
                                                                                            color: COLORS.ERROR[600]
                                                                                        },
                                                                                        transition: 'all 0.2s',
                                                                                        position: 'relative',
                                                                                        bottom: -2
                                                                                    }}
                                                                                >
                                                                                    <Event sx={{ fontSize: 18, mr: 1 }} />
                                                                                    {WEEKDAY_LABELS[dayKey]}
                                                                                    {viewMode === 'month' && days[tabIdx]?.members?.length > 0 && (
                                                                                        <Chip
                                                                                            label={days[tabIdx].members.length}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                ml: 1,
                                                                                                height: 20,
                                                                                                fontSize: '0.7rem',
                                                                                                fontWeight: 700,
                                                                                                bgcolor: isActive ? COLORS.ERROR[200] : COLORS.GRAY[200],
                                                                                                color: isActive ? COLORS.ERROR[700] : COLORS.TEXT.SECONDARY
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                </Button>
                                                                            );
                                                                        })}
                                                                    </Stack>
                                                                </Box>

                                                                {/* Attendance Tables for Each Day */}
                                                                {days.map(({ dayKey, members: dayMembers, dates }, dayIdx) => {
                                                                    const displayData = dayMembers || [];
                                                                    const tabKey = `${shift.id}-${dayKey}`;
                                                                    const selectedDayIndex = new Date(selectedDate).getDay();
                                                                    const adjustedSelectedIndex = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
                                                                    const selectedDayKey = WEEKDAYS[adjustedSelectedIndex];
                                                                    const isActive = activeDayTab[tabKey] !== undefined
                                                                        ? activeDayTab[tabKey]
                                                                        : (viewMode === 'day' ? dayKey === selectedDayKey : dayIdx === 0);

                                                                    return (
                                                                        <Box key={dayKey} sx={{ display: isActive ? 'block' : 'none' }}>

                                                                            {displayData.length === 0 ? (
                                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, pl: 6 }}>
                                                                                    {isTeamLeader
                                                                                        ? 'Chưa có thành viên nào trong team này.'
                                                                                        : 'Chưa có dữ liệu điểm danh cho ngày này.'}
                                                                                </Typography>
                                                                            ) : (
                                                                                <>
                                                                                    <TableContainer
                                                                                        component={Paper}
                                                                                        sx={{
                                                                                            borderRadius: 2,
                                                                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                                                            boxShadow: `0 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                                                                                            overflowX: 'auto',
                                                                                            overflowY: 'hidden',
                                                                                            bgcolor: 'white'
                                                                                        }}
                                                                                    >
                                                                                        <Table size="medium" stickyHeader>
                                                                                            <TableHead>
                                                                                                <TableRow>
                                                                                                    <TableCell sx={{
                                                                                                        fontWeight: 800,
                                                                                                        bgcolor: COLORS.ERROR[50],
                                                                                                        py: 2.5,
                                                                                                        borderBottom: `2px solid ${COLORS.ERROR[200]}`,
                                                                                                        fontSize: '0.875rem',
                                                                                                        color: COLORS.ERROR[700]
                                                                                                    }}>
                                                                                                        Thành viên
                                                                                                    </TableCell>
                                                                                                    <TableCell sx={{
                                                                                                        fontWeight: 800,
                                                                                                        bgcolor: COLORS.ERROR[50],
                                                                                                        py: 2.5,
                                                                                                        borderBottom: `2px solid ${COLORS.ERROR[200]}`,
                                                                                                        fontSize: '0.875rem',
                                                                                                        color: COLORS.ERROR[700]
                                                                                                    }}>
                                                                                                        Ngày làm việc
                                                                                                    </TableCell>
                                                                                                    <TableCell sx={{
                                                                                                        fontWeight: 800,
                                                                                                        bgcolor: COLORS.ERROR[50],
                                                                                                        py: 2.5,
                                                                                                        borderBottom: `2px solid ${COLORS.ERROR[200]}`,
                                                                                                        fontSize: '0.875rem',
                                                                                                        color: COLORS.ERROR[700]
                                                                                                    }}>
                                                                                                        Ghi chú
                                                                                                    </TableCell>
                                                                                                    <TableCell align="center" sx={{
                                                                                                        fontWeight: 800,
                                                                                                        bgcolor: COLORS.ERROR[50],
                                                                                                        py: 2.5,
                                                                                                        borderBottom: `2px solid ${COLORS.ERROR[200]}`,
                                                                                                        fontSize: '0.875rem',
                                                                                                        color: COLORS.ERROR[700],
                                                                                                        minWidth: 500
                                                                                                    }}>
                                                                                                        Trạng thái điểm danh
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            </TableHead>
                                                                                            <TableBody>
                                                                                                {displayData.map((item, idx) => {
                                                                                                    const isMemberView = item.member !== undefined;
                                                                                                    const member = isMemberView ? item.member : (item.employee || item.team_member?.employee || {});
                                                                                                    const schedule = isMemberView ? item.schedule : item;
                                                                                                    const dateStr = isMemberView ? item.date : (schedule?.date || '');

                                                                                                    const key = `${team.id}-${shift.id}-${dayKey}`;
                                                                                                    const recordId = schedule?.id || item.teamMemberId;
                                                                                                    const pendingChange = pendingChanges[key]?.find(c => c.recordId === recordId);
                                                                                                    const currentStatus = pendingChange?.status || schedule?.status || 'PENDING';
                                                                                                    const isTodayAttendance = isToday(dateStr);

                                                                                                    const memberData = isMemberView
                                                                                                        ? item
                                                                                                        : {
                                                                                                            member,
                                                                                                            date: dateStr,
                                                                                                            schedule,
                                                                                                            teamMemberId: schedule?.team_member_id ||
                                                                                                                schedule?.team_member?.id ||
                                                                                                                member.team_member_id ||
                                                                                                                null
                                                                                                        };

                                                                                                    return (
                                                                                                        <TableRow
                                                                                                            key={isMemberView ? `${member.id}-${dateStr}-${idx}` : (schedule?.id || idx)}
                                                                                                            hover
                                                                                                            sx={{
                                                                                                                '&:hover': {
                                                                                                                    bgcolor: alpha(COLORS.PRIMARY[50], 0.3)
                                                                                                                }
                                                                                                            }}
                                                                                                        >
                                                                                                            <TableCell sx={{ py: 2 }}>
                                                                                                                <Stack direction="row" spacing={2} alignItems="center">
                                                                                                                    <Avatar
                                                                                                                        src={member.avatar_url}
                                                                                                                        sx={{
                                                                                                                            width: 44,
                                                                                                                            height: 44,
                                                                                                                            border: `2px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {member.full_name?.charAt(0) || '?'}
                                                                                                                    </Avatar>
                                                                                                                    <Box>
                                                                                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                                                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                                                                                {member.full_name || 'N/A'}
                                                                                                                            </Typography>
                                                                                                                            {isMemberView && member.isLeader && (
                                                                                                                                <Chip
                                                                                                                                    label="Leader"
                                                                                                                                    size="small"
                                                                                                                                    color="error"
                                                                                                                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                                                                                                                                />
                                                                                                                            )}
                                                                                                                        </Stack>
                                                                                                                        {member.sub_role && (
                                                                                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                                                                                                                {mapSubRoleLabel(member.sub_role)}
                                                                                                                            </Typography>
                                                                                                                        )}
                                                                                                                    </Box>
                                                                                                                </Stack>
                                                                                                            </TableCell>
                                                                                                            <TableCell sx={{ py: 2 }}>
                                                                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                                                    {formatDate(dateStr)}
                                                                                                                </Typography>
                                                                                                            </TableCell>
                                                                                                            <TableCell sx={{ py: 2 }}>
                                                                                                                <Tooltip
                                                                                                                    title={
                                                                                                                        isTeamLeader
                                                                                                                            ? (schedule?.notes ? 'Nhấn để sửa ghi chú' : 'Nhấn để thêm ghi chú')
                                                                                                                            : ''
                                                                                                                    }
                                                                                                                    placement="top"
                                                                                                                    arrow
                                                                                                                >
                                                                                                                    <Typography
                                                                                                                        variant="body2"
                                                                                                                        onClick={
                                                                                                                            isTeamLeader
                                                                                                                                ? () =>
                                                                                                                                    handleOpenNotesDialog(
                                                                                                                                        memberData || { member, date: dateStr, schedule },
                                                                                                                                        team.id,
                                                                                                                                        shift.id,
                                                                                                                                        dateStr,
                                                                                                                                        dayKey,
                                                                                                                                        isTeamLeader
                                                                                                                                    )
                                                                                                                                : undefined
                                                                                                                        }
                                                                                                                        sx={{
                                                                                                                            color: schedule?.notes ? COLORS.TEXT.PRIMARY : COLORS.TEXT.SECONDARY,
                                                                                                                            fontStyle: schedule?.notes ? 'normal' : 'italic',
                                                                                                                            maxWidth: 300,
                                                                                                                            overflow: 'hidden',
                                                                                                                            textOverflow: 'ellipsis',
                                                                                                                            whiteSpace: 'nowrap',
                                                                                                                            fontWeight: schedule?.notes ? 500 : 400,
                                                                                                                            cursor: isTeamLeader ? 'pointer' : 'default',
                                                                                                                            textDecoration: isTeamLeader ? 'underline dotted' : 'none'
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {schedule?.notes || (isTeamLeader ? 'Thêm ghi chú' : '—')}
                                                                                                                    </Typography>
                                                                                                                </Tooltip>
                                                                                                            </TableCell>
                                                                                                            <TableCell align="center" sx={{ py: 2.5 }}>
                                                                                                                {isTeamLeader && isTodayAttendance ? (
                                                                                                                    currentStatus === 'PENDING' ? (
                                                                                                                        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
                                                                                                                            <Chip
                                                                                                                                icon={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.icon}
                                                                                                                                label={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.label || currentStatus}
                                                                                                                                sx={{
                                                                                                                                    bgcolor: STATUS_COLORS[currentStatus]?.bg || COLORS.GRAY[100],
                                                                                                                                    color: STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700],
                                                                                                                                    fontWeight: 700,
                                                                                                                                    height: 36,
                                                                                                                                    fontSize: '0.875rem',
                                                                                                                                    border: `2px solid ${alpha(STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700], 0.3)}`
                                                                                                                                }}
                                                                                                                                size="medium"
                                                                                                                            />
                                                                                                                            {STATUS_OPTIONS.filter(option =>
                                                                                                                                option.value !== 'PENDING'
                                                                                                                            ).map((option) => (
                                                                                                                                <Tooltip key={option.value} title={`Đánh dấu: ${option.label}`} arrow placement="top">
                                                                                                                                    <Button
                                                                                                                                        variant="outlined"
                                                                                                                                        color={option.color}
                                                                                                                                        size="small"
                                                                                                                                        startIcon={option.icon}
                                                                                                                                        onClick={() => handleStatusClick(
                                                                                                                                            memberData || { member, date: dateStr, schedule },
                                                                                                                                            option.value,
                                                                                                                                            team.id,
                                                                                                                                            shift.id,
                                                                                                                                            dateStr,
                                                                                                                                            dayKey,
                                                                                                                                            isTeamLeader
                                                                                                                                        )}
                                                                                                                                        sx={{
                                                                                                                                            borderRadius: 2,
                                                                                                                                            minWidth: 110,
                                                                                                                                            textTransform: 'none',
                                                                                                                                            fontWeight: 600,
                                                                                                                                            px: 2,
                                                                                                                                            py: 0.75,
                                                                                                                                            fontSize: '0.8rem',
                                                                                                                                            borderWidth: 2,
                                                                                                                                            '&:hover': {
                                                                                                                                                borderWidth: 2,
                                                                                                                                                boxShadow: `0 4px 12px ${alpha(COLORS[option.color.toUpperCase()]?.[500] || COLORS.PRIMARY[500], 0.25)}`,
                                                                                                                                                transform: 'translateY(-2px)',
                                                                                                                                                bgcolor: alpha(COLORS[option.color.toUpperCase()]?.[50] || COLORS.PRIMARY[50], 0.5)
                                                                                                                                            },
                                                                                                                                            transition: 'all 0.2s'
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {option.label}
                                                                                                                                    </Button>
                                                                                                                                </Tooltip>
                                                                                                                            ))}
                                                                                                                        </Stack>
                                                                                                                    ) : (
                                                                                                                        <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
                                                                                                                            <Chip
                                                                                                                                icon={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.icon}
                                                                                                                                label={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.label || currentStatus}
                                                                                                                                sx={{
                                                                                                                                    bgcolor: STATUS_COLORS[currentStatus]?.bg || COLORS.GRAY[100],
                                                                                                                                    color: STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700],
                                                                                                                                    fontWeight: 700,
                                                                                                                                    height: 36,
                                                                                                                                    fontSize: '0.875rem',
                                                                                                                                    border: `2px solid ${alpha(STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700], 0.3)}`,
                                                                                                                                    boxShadow: `0 2px 8px ${alpha(STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700], 0.15)}`
                                                                                                                                }}
                                                                                                                                size="medium"
                                                                                                                            />
                                                                                                                            {pendingChange && (
                                                                                                                                <Button
                                                                                                                                    variant="outlined"
                                                                                                                                    color="inherit"
                                                                                                                                    size="small"
                                                                                                                                    startIcon={<Close />}
                                                                                                                                    onClick={() => handleResetMemberStatus(team.id, shift.id, dayKey, recordId)}
                                                                                                                                    sx={{
                                                                                                                                        borderRadius: 2,
                                                                                                                                        textTransform: 'none',
                                                                                                                                        fontWeight: 600,
                                                                                                                                        borderWidth: 2,
                                                                                                                                        '&:hover': {
                                                                                                                                            borderWidth: 2
                                                                                                                                        }
                                                                                                                                    }}
                                                                                                                                >
                                                                                                                                    Hủy
                                                                                                                                </Button>
                                                                                                                            )}
                                                                                                                        </Stack>
                                                                                                                    )
                                                                                                                ) : (
                                                                                                                    <Chip
                                                                                                                        icon={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.icon}
                                                                                                                        label={STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.label || currentStatus}
                                                                                                                        sx={{
                                                                                                                            bgcolor: STATUS_COLORS[currentStatus]?.bg || COLORS.GRAY[100],
                                                                                                                            color: STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700],
                                                                                                                            fontWeight: 700,
                                                                                                                            height: 36,
                                                                                                                            fontSize: '0.875rem',
                                                                                                                            border: `2px solid ${alpha(STATUS_COLORS[currentStatus]?.color || COLORS.GRAY[700], 0.3)}`
                                                                                                                        }}
                                                                                                                        size="medium"
                                                                                                                    />
                                                                                                                )}
                                                                                                            </TableCell>
                                                                                                        </TableRow>
                                                                                                    );
                                                                                                })}
                                                                                            </TableBody>
                                                                                        </Table>

                                                                                        {/* Bulk Save Controls */}
                                                                                        {isTeamLeader && (() => {
                                                                                            const key = `${team.id}-${shift.id}-${dayKey}`;
                                                                                            const changes = pendingChanges[key] || [];
                                                                                            const hasChanges = hasUnsavedChanges[key] && changes.length > 0;

                                                                                            return hasChanges ? (
                                                                                                <Box sx={{ p: 3, pt: 0 }}>
                                                                                                    <Stack
                                                                                                        direction="row"
                                                                                                        spacing={2}
                                                                                                        justifyContent="flex-end"
                                                                                                        alignItems="center"
                                                                                                        sx={{
                                                                                                            mt: 3,
                                                                                                            pt: 3,
                                                                                                            borderTop: `2px dashed ${alpha(COLORS.WARNING[500], 0.4)}`,
                                                                                                            bgcolor: alpha(COLORS.WARNING[50], 0.3),
                                                                                                            p: 2.5,
                                                                                                            borderRadius: 2
                                                                                                        }}
                                                                                                    >
                                                                                                        <Chip
                                                                                                            icon={<Edit fontSize="small" />}
                                                                                                            label={`${changes.length} thành viên chưa lưu`}
                                                                                                            color="warning"
                                                                                                            sx={{ fontWeight: 700, height: 36 }}
                                                                                                        />
                                                                                                        <Button
                                                                                                            variant="outlined"
                                                                                                            color="inherit"
                                                                                                            startIcon={<Close />}
                                                                                                            onClick={() => handleClearChanges(team.id, shift.id, dayKey)}
                                                                                                            sx={{
                                                                                                                borderRadius: 2,
                                                                                                                textTransform: 'none',
                                                                                                                fontWeight: 600,
                                                                                                                borderWidth: 2,
                                                                                                                '&:hover': {
                                                                                                                    borderWidth: 2
                                                                                                                }
                                                                                                            }}
                                                                                                        >
                                                                                                            Hủy thay đổi
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            variant="contained"
                                                                                                            color="success"
                                                                                                            startIcon={<CheckCircle />}
                                                                                                            onClick={() => handleBulkSave(team.id, shift.id, dayKey)}
                                                                                                            sx={{
                                                                                                                borderRadius: 2,
                                                                                                                textTransform: 'none',
                                                                                                                fontWeight: 700,
                                                                                                                minWidth: 180,
                                                                                                                height: 42,
                                                                                                                fontSize: '0.95rem',
                                                                                                                boxShadow: `0 4px 16px ${alpha(COLORS.SUCCESS[500], 0.35)}`,
                                                                                                                '&:hover': {
                                                                                                                    boxShadow: `0 6px 20px ${alpha(COLORS.SUCCESS[500], 0.45)}`,
                                                                                                                    transform: 'translateY(-2px)'
                                                                                                                },
                                                                                                                transition: 'all 0.2s'
                                                                                                            }}
                                                                                                        >
                                                                                                            Lưu ({changes.length})
                                                                                                        </Button>
                                                                                                    </Stack>
                                                                                                </Box>
                                                                                            ) : null;
                                                                                        })()}
                                                                                    </TableContainer>
                                                                                </>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Stack>

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>}
            </Snackbar>

            {/* Attendance Dialog for Notes */}
            <Dialog
                open={attendanceDialog?.open || false}
                onClose={() => setAttendanceDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 12px 40px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}`
                    }
                }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Ghi chú điểm danh
                            {attendanceDialog?.status && (
                                <>
                                    {' - '}
                                    {STATUS_OPTIONS.find((opt) => opt.value === attendanceDialog.status)?.label ||
                                        attendanceDialog.status}
                                </>
                            )}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setAttendanceDialog(null)}
                            sx={{
                                color: COLORS.TEXT.SECONDARY,
                                '&:hover': { bgcolor: COLORS.BACKGROUND.NEUTRAL }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {attendanceDialog && (
                            <>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        bgcolor: COLORS.BACKGROUND.NEUTRAL,
                                        borderColor: alpha(COLORS.BORDER.DEFAULT, 0.2)
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Person sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Thành viên:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {attendanceDialog.memberData.member?.full_name || 'N/A'}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Event sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Ngày:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {formatDate(attendanceDialog.date)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Paper>
                                <TextField
                                    label="Ghi chú"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={attendanceDialog.notes}
                                    onChange={(e) => setAttendanceDialog({ ...attendanceDialog, notes: e.target.value })}
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
                    <Button
                        onClick={() => setAttendanceDialog(null)}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 100,
                            borderColor: alpha(COLORS.BORDER.DEFAULT, 0.5)
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleStatusChange}
                        variant="contained"
                        color="primary"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 120,
                            boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`,
                            '&:hover': {
                                boxShadow: `0 6px 16px ${alpha(COLORS.PRIMARY[500], 0.4)}`
                            }
                        }}
                    >
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendancePage;

