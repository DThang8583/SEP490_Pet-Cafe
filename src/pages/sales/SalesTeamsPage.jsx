import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Chip, Divider, Avatar, Container } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Event, AccessTime, Person, PeopleAlt, LocalFireDepartment } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { authApi } from '../../api/authApi';
import { getTeams, getTeamMembers, getTeamWorkShifts } from '../../api/teamApi';
import { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';

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

const collectTeamWorkingDays = (team) => {
    const daySet = new Set();
    (team.team_work_shifts || []).forEach((shiftInfo) => {
        const days = normalizeWorkingDays(
            shiftInfo.working_days?.length ? shiftInfo.working_days : shiftInfo.work_shift?.applicable_days
        );
        days.forEach((day) => daySet.add(day));
    });
    return WEEKDAYS.filter((day) => daySet.has(day));
};

const TeamShiftCard = ({ team }) => {
    const members = (team.members || []).map((m) => m.employee?.full_name || m.employee?.name).filter(Boolean);
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 3,
                borderColor: alpha(COLORS.BORDER.DEFAULT, 0.6),
                bgcolor: '#fff'
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {team.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            {team.work_type?.name || 'Nhóm dịch vụ'} • {team.area?.name || 'Khu vực chung'}
                        </Typography>
                    </Stack>
                    <Chip label={`${members.length || 0} thành viên`} size="small" />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Person sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 16 }} />
                        <Typography variant="body2">
                            Leader: {team.leader?.full_name || team.leader?.name || 'Chưa cập nhật'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <PeopleAlt sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 16 }} />
                        <Typography variant="body2">
                            Thành viên: {members.join(', ') || '—'}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
};

const ShiftBlock = ({ shift, entries }) => {
    const workingDays = normalizeWorkingDays(
        shift.working_days?.length ? shift.working_days : shift.applicable_days
    );
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.7)}`,
                bgcolor: alpha(COLORS.ERROR[50] || '#fff5f5', 0.5)
            }}
        >
            <Stack spacing={1.5}>
                <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime sx={{ color: COLORS.ERROR[500] }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {shift.name || 'Ca làm việc'}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        {shift.start_time || '--'} - {shift.end_time || '--'}
                    </Typography>
                    {shift.description && (
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            {shift.description}
                        </Typography>
                    )}
                    {workingDays.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                            {workingDays.map((day) => (
                                <Chip key={day} label={WEEKDAY_LABELS[day]} size="small" variant="outlined" />
                            ))}
                        </Stack>
                    )}
                </Stack>
                <Stack spacing={1.5}>
                    {entries.map(({ team }) => (
                        <TeamShiftCard key={team.id} team={team} />
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
};

const groupEntriesByShift = (entries = []) => {
    const map = new Map();
    entries.forEach((entry) => {
        const shift = entry.shiftInfo?.work_shift || entry.shiftInfo;
        const key = shift?.id || entry.shiftInfo?.id || `${shift?.name}-${shift?.start_time}-${shift?.end_time}`;
        if (!map.has(key)) {
            map.set(key, { key, shift: shift || {}, entries: [] });
        }
        map.get(key).entries.push(entry);
    });
    return Array.from(map.values());
};

const TeamInfoCard = ({ team }) => {
    const workingDays = collectTeamWorkingDays(team);
    const members = (team.members || []).map((m) => m.employee?.full_name || m.employee?.name).filter(Boolean);
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                borderRadius: 3,
                borderColor: alpha(COLORS.BORDER.DEFAULT, 0.6),
                height: '100%'
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack spacing={0.5}>
                        <Chip
                            icon={<Groups fontSize="small" />}
                            label={team.work_type?.name || 'Nhóm dịch vụ'}
                            size="small"
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {team.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            {team.area?.name || 'Khu vực chung'}
                        </Typography>
                    </Stack>
                    <Chip label={`${members.length || 0} thành viên`} size="small" />
                </Stack>
                <Divider />
                <Stack spacing={0.75}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Person sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 16 }} />
                        <Typography variant="body2">
                            Leader: {team.leader?.full_name || team.leader?.name || 'Chưa cập nhật'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <PeopleAlt sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 16 }} />
                        <Typography variant="body2">
                            Thành viên: {members.join(', ') || '—'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocalFireDepartment sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 16 }} />
                        <Typography variant="body2">
                            Trạng thái: {team.is_active ? 'Hoạt động' : 'Ngưng'}
                        </Typography>
                    </Stack>
                    {workingDays.length > 0 && (
                        <Stack>
                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Ngày làm việc:
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                {workingDays.map((day) => (
                                    <Chip key={day} label={WEEKDAY_LABELS[day]} size="small" variant="outlined" />
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Paper>
    )
};

// Helper function để get teams cho sales_staff (tương tự workingStaffApi.getMyTeams)
const getMyTeamsForSales = async () => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
    }

    const buildCandidateIds = (profile = {}) => {
        const ids = [
            profile?.id,
            profile?.employee_id,
            profile?.account_id,
            profile?.account?.id,
            profile?.account?.account_id,
            profile?.employee?.id,
            profile?.employee?.employee_id,
            profile?.employee?.account_id
        ];
        return Array.from(new Set(ids.filter(Boolean)));
    };

    const candidateIds = buildCandidateIds(currentUser);

    try {
        let pageIndex = 0;
        const pageSize = 50;
        let hasNext = true;
        const allTeams = [];

        while (hasNext) {
            const response = await getTeams({ page_index: pageIndex, page_size: pageSize });
            const teams = response.data || [];
            allTeams.push(...teams);
            const pagination = response.pagination || {};
            hasNext = Boolean(pagination.has_next);
            pageIndex += 1;
            if (!hasNext) break;
        }

        const teamsWithMembers = await Promise.all(
            allTeams.map(async (team) => {
                try {
                    const [membersResp, workShiftsResp] = await Promise.allSettled([
                        getTeamMembers(team.id),
                        getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 })
                    ]);
                    const members = membersResp.status === 'fulfilled' ? membersResp.value.data || [] : [];
                    const teamWorkShifts = workShiftsResp.status === 'fulfilled' ? workShiftsResp.value.data || [] : [];
                    return {
                        ...team,
                        members,
                        team_work_shifts: teamWorkShifts
                    };
                } catch (error) {
                    console.warn('Load team data failed', error);
                    return {
                        ...team,
                        members: [],
                        team_work_shifts: []
                    };
                }
            })
        );

        const filtered = teamsWithMembers.filter((team) => {
            const leaderAccountId = team.leader?.account_id;
            const isLeaderMatch =
                (team.leader_id && candidateIds.includes(team.leader_id)) ||
                (leaderAccountId && candidateIds.includes(leaderAccountId));

            if (isLeaderMatch) {
                return true;
            }

            if (Array.isArray(team.members) && team.members.length > 0) {
                return team.members.some((m) => {
                    const memberEmployeeId = m.employee_id || m.employee?.id;
                    const memberAccountId = m.employee?.account_id;
                    return (
                        (memberEmployeeId && candidateIds.includes(memberEmployeeId)) ||
                        (memberAccountId && candidateIds.includes(memberAccountId))
                    );
                });
            }
            return false;
        });

        return filtered;
    } catch (error) {
        console.warn('getMyTeamsForSales error', error);
        return [];
    }
};

const SalesTeamsPage = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await getMyTeamsForSales();
                if (mounted) {
                    setTeams(data);
                }
            } catch (error) {
                console.error('Failed to load sales-staff teams', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, []);

    const scheduleByDay = useMemo(() => {
        const map = {};
        WEEKDAYS.forEach((day) => {
            map[day] = [];
        });

        teams.forEach((team) => {
            (team.team_work_shifts || []).forEach((shiftInfo) => {
                const days = (() => {
                    const workingDays = normalizeWorkingDays(shiftInfo.working_days);
                    if (workingDays.length > 0) return workingDays;
                    return normalizeWorkingDays(shiftInfo.work_shift?.applicable_days);
                })();
                days.forEach((day) => {
                    if (map[day]) {
                        map[day].push({ team, shiftInfo });
                    }
                });
            });
        });

        return map;
    }, [teams]);


    if (loading) {
        return (
            <Box sx={{
                py: { xs: 2, md: 3 },
                bgcolor: COLORS.BACKGROUND.NEUTRAL,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Loading message="Đang tải lịch & nhóm..." size="large" fullScreen={false} />
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{
            py: { xs: 2, md: 3 },
            bgcolor: COLORS.BACKGROUND.NEUTRAL,
            minHeight: '100vh',
            background: [
                'radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%)',
                'radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%)',
                'radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%)',
                COLORS.BACKGROUND.NEUTRAL
            ].join(', ')
        }}>
            <Container maxWidth="xl">
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Lịch & nhóm của tôi
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 1 }}>
                            Xem nhanh các nhóm bạn tham gia, ca làm theo từng ngày và thông tin leader, thành viên.
                        </Typography>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Nhóm bạn tham gia
                            </Typography>
                            {teams.length === 0 ? (
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Bạn chưa được phân vào nhóm nào. Liên hệ quản lý để được phân công.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {teams.map((team) => (
                                        <Grid item xs={12} md={6} key={team.id}>
                                            <TeamInfoCard team={team} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Stack>
                    </Paper>

                    {WEEKDAYS.map((dayKey) => {
                        const entries = scheduleByDay[dayKey] || [];
                        const shiftGroups = groupEntriesByShift(entries);
                        return (
                            <Paper key={dayKey} sx={{ p: 3, borderRadius: 4 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar sx={{ bgcolor: COLORS.ERROR[100], color: COLORS.ERROR[600] }}>
                                            <Event />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {WEEKDAY_LABELS[dayKey]}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {shiftGroups.length > 0
                                                    ? `${shiftGroups.length} ca làm việc`
                                                    : 'Chưa có ca nào'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Chip
                                        label={WEEKDAY_LABELS[dayKey]}
                                        color={shiftGroups.length > 0 ? 'error' : 'default'}
                                        variant={shiftGroups.length > 0 ? 'filled' : 'outlined'}
                                    />
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={2}>
                                    {shiftGroups.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Bạn chưa có lịch làm việc nào trong ngày này.
                                        </Typography>
                                    ) : (
                                        shiftGroups.map((group) => (
                                            <ShiftBlock
                                                key={`${dayKey}-${group.key}`}
                                                shift={group.shift}
                                                entries={group.entries}
                                            />
                                        ))
                                    )}
                                </Stack>
                            </Paper>
                        );
                    })}

                    {teams.length === 0 && (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Bạn chưa được phân vào nhóm nào. Liên hệ quản lý để được phân công.
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            </Container>
        </Box>
    );
};

export default SalesTeamsPage;
