import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip, Stack, Button, Divider, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, IconButton, Tooltip, alpha, Container } from '@mui/material';
import { EmojiPeople, Groups, AssignmentTurnedIn, AccessTime, ArrowForward, EventAvailable, PlaylistAddCheck, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';

// Helper function để map task status sang tiếng Việt
const mapTaskStatus = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'COMPLETED':
            return 'Hoàn thành';
        case 'IN_PROGRESS':
            return 'Đang thực hiện';
        case 'PENDING':
            return 'Chờ xử lý';
        case 'CANCELLED':
            return 'Đã hủy';
        default:
            return status || 'Không xác định';
    }
};

const StatCard = ({ title, value, subtitle, icon, accent = COLORS.ERROR[100], loading = false }) => (
    <Paper
        elevation={0}
        sx={{
            borderRadius: 3,
            p: 3,
            height: '100%',
            bgcolor: alpha(accent, 0.4),
            border: `1px solid ${alpha(accent, 0.6)}`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(accent, 0.3)}`
            }
        }}
    >
        <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: alpha(COLORS.ERROR[500], 0.15), color: COLORS.ERROR[600], width: 56, height: 56 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, fontSize: '0.875rem' }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY, mt: 0.5 }}>
                        {loading ? '—' : value}
                    </Typography>
                </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.813rem' }}>
                {subtitle}
            </Typography>
        </Stack>
    </Paper>
);

const WorkingDashboardPage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [teams, setTeams] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                const profileData = workingStaffApi.getProfile();
                const [teamData, scheduleData, taskData] = await Promise.all([
                    workingStaffApi.getMyTeams(),
                    workingStaffApi.getMySchedules(new Date()),
                    workingStaffApi.getTeamDailyTasks(null, new Date())
                ]);
                if (!mounted) return;
                setProfile(profileData);
                setTeams(teamData);
                setSchedules(scheduleData);
                setTasks(taskData);
            } catch (error) {
                console.error('Failed to load working dashboard', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadData();
        return () => {
            mounted = false;
        };
    }, []);

    const stats = useMemo(() => {
        // Filter tasks to only include those assigned to the current working_staff
        const candidateIds = profile ? [
            profile.id,
            profile.employee_id,
            profile.account_id,
            profile.account?.id,
            profile.account?.account_id,
            profile.employee?.id,
            profile.employee?.employee_id,
            profile.employee?.account_id
        ].filter(Boolean) : [];

        // Filter tasks by employee/assigned_to
        const myTasks = tasks.filter((task) => {
            if (candidateIds.length === 0) return false;

            const taskEmployeeId = task.employee_id || task.assigned_to || task.employee?.id || task.assigned_employee_id;
            const taskAccountId = task.employee?.account_id || task.assigned_account_id;

            return (
                (taskEmployeeId && candidateIds.includes(taskEmployeeId)) ||
                (taskAccountId && candidateIds.includes(taskAccountId))
            );
        });

        // Also filter by assigned_date to ensure we only count today's tasks
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = myTasks.filter((task) => {
            const taskDate = task.assigned_date || task.date || task.task_date;
            if (!taskDate) return false;
            const taskDateStr = taskDate instanceof Date
                ? taskDate.toISOString().split('T')[0]
                : new Date(taskDate).toISOString().split('T')[0];
            return taskDateStr === todayStr;
        });

        const totalTasks = todayTasks.length;
        const completed = todayTasks.filter((task) => task.status === 'COMPLETED').length;
        const inProgress = todayTasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const completionRate = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);
        return {
            totalTasks,
            completed,
            inProgress,
            completionRate,
            totalTeams: teams.length,
            scheduleBlocks: schedules.length
        };
    }, [tasks, teams.length, schedules.length, profile]);


    if (loading) {
        return (
            <Box sx={{
                p: { xs: 2, md: 4 },
                bgcolor: COLORS.BACKGROUND.NEUTRAL,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Loading message="Đang tải dữ liệu tổng quan..." size="large" variant="default" fullScreen={false} />
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                py: { xs: 2, md: 3 },
                bgcolor: COLORS.BACKGROUND.NEUTRAL,
                minHeight: '100vh',
                background: [
                    'radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%)',
                    'radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%)',
                    'radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%)',
                    COLORS.BACKGROUND.NEUTRAL
                ].join(', ')
            }}
        >
            <Container maxWidth="xl">
                <Stack spacing={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: { xs: 3, md: 4 },
                            background: `linear-gradient(120deg, ${alpha(COLORS.SECONDARY[100], 0.9)}, ${alpha(COLORS.PRIMARY[50], 0.8)})`,
                            border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.6)}`
                        }}
                    >
                        {profile ? (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                                <Avatar
                                    src={profile.avatar}
                                    sx={{
                                        width: 96,
                                        height: 96,
                                        bgcolor: COLORS.ERROR[500],
                                        fontSize: 36,
                                        fontWeight: 700
                                    }}
                                >
                                    {profile.name?.charAt(0) ?? 'W'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                        Xin chào, {profile.name}
                                    </Typography>
                                    <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                        <Chip icon={<EmojiPeople />} label="Nhân viên chăm sóc" color="error" variant="outlined" />
                                        <Chip icon={<Groups />} label={`${teams.length} nhóm`} variant="outlined" />
                                        {profile.leader && (
                                            <Chip
                                                icon={<AssignmentTurnedIn />}
                                                label="Trưởng nhóm"
                                                sx={{ bgcolor: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700] }}
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" sx={{ mt: 2, color: COLORS.TEXT.SECONDARY, lineHeight: 1.6 }}>
                                        Theo dõi lịch làm việc, nhiệm vụ và các đội nhóm bạn tham gia. Mọi thông tin đều được tổng hợp
                                        trong một bảng điều khiển trực quan dành riêng cho nhân viên chăm sóc.
                                    </Typography>
                                </Box>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/staff/daily-tasks')}
                                        sx={{ minWidth: 200, borderRadius: 2 }}
                                    >
                                        Vào nhiệm vụ hôm nay
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => navigate('/staff/schedules')}
                                        sx={{ minWidth: 200, borderRadius: 2 }}
                                    >
                                        Xem lịch
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : null}
                    </Paper>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                title="Nhiệm vụ hôm nay"
                                value={stats.totalTasks}
                                subtitle="Tổng số nhiệm vụ được giao"
                                icon={<AssignmentTurnedIn />}
                                loading={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                title="Đang thực hiện"
                                value={stats.inProgress}
                                subtitle="Cần theo dõi trong ca làm"
                                icon={<AccessTime />}
                                accent={COLORS.WARNING[100]}
                                loading={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                title="Hoàn thành"
                                value={`${stats.completionRate}%`}
                                subtitle={`${stats.completed}/${stats.totalTasks} nhiệm vụ`}
                                icon={<PlaylistAddCheck />}
                                accent={COLORS.SUCCESS[100]}
                                loading={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatCard
                                title="Nhóm tham gia"
                                value={stats.totalTeams}
                                subtitle={`${stats.scheduleBlocks} khung giờ trong ngày`}
                                icon={<Groups />}
                                accent={COLORS.INFO[100]}
                                loading={false}
                            />
                        </Grid>
                    </Grid>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                Nhóm tham gia
                            </Typography>
                            <Button size="small" onClick={() => navigate('/staff/teams')}>
                                Quản lý nhóm
                            </Button>
                        </Stack>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {teams.map((team) => (
                                <Grid item xs={12} md={6} key={team.id}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            borderColor: alpha(COLORS.BORDER.DEFAULT, 0.8),
                                            height: '100%'
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {team.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {team.work_type?.name || 'Chưa cập nhật'} • {team.area?.name || 'Khu vực chung'}
                                                </Typography>
                                            </Box>
                                            <Tooltip title="Xem nhiệm vụ nhóm">
                                                <IconButton onClick={() => navigate('/staff/daily-tasks', { state: { teamId: team.id } })}>
                                                    <ChevronRight />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={1.5}>
                                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                                Trưởng nhóm:{' '}
                                                <strong>{team.leader?.full_name || team.leader?.name || 'Chưa cập nhật'}</strong>
                                            </Typography>
                                            <Stack direction="row" spacing={3}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.75rem' }}>
                                                        Thành viên
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                                                        {team.members?.length || 0}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.75rem' }}>
                                                        Tỷ lệ hoàn thành
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                                                        <Box sx={{ flex: 1, maxWidth: 120 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={team.stats?.completed_rate || 0}
                                                                sx={{
                                                                    height: 8,
                                                                    borderRadius: 5,
                                                                    bgcolor: alpha(COLORS.BORDER.DEFAULT, 0.2),
                                                                    '& .MuiLinearProgress-bar': {
                                                                        bgcolor: COLORS.SUCCESS[500]
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                                                            {team.stats?.completed_rate || 0}%
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                            {teams.length === 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 3 }}>
                                        Bạn chưa được phân vào nhóm nào. Vui lòng liên hệ quản lý.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
};

export default WorkingDashboardPage;

