import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip, Stack, Button, Divider, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, IconButton, Tooltip, alpha, Skeleton } from '@mui/material';
import { EmojiPeople, Groups, AssignmentTurnedIn, AccessTime, ArrowForward, EventAvailable, PlaylistAddCheck, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';

const StatCard = ({ title, value, subtitle, icon, accent = COLORS.ERROR[100], loading = false }) => (
    <Paper
        elevation={0}
        sx={{
            borderRadius: 4,
            p: 3,
            height: '100%',
            bgcolor: alpha(accent, 0.45),
            border: `1px solid ${alpha(accent, 0.8)}`
        }}
    >
        {loading ? (
            <Skeleton variant="rounded" height={120} />
        ) : (
            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.ERROR[500], 0.15), color: COLORS.ERROR[600] }}>
                        {icon}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY }}>
                            {value}
                        </Typography>
                    </Box>
                </Stack>
                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                    {subtitle}
                </Typography>
            </Stack>
        )}
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
        const totalTasks = tasks.length;
        const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
        const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const completionRate = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);
        return {
            totalTasks,
            completed,
            inProgress,
            completionRate,
            totalTeams: teams.length,
            scheduleBlocks: schedules.length
        };
    }, [tasks, teams.length, schedules.length]);

    const todaySchedules = schedules.slice(0, 4);
    const highlightTasks = tasks.slice(0, 4);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100%' }}>
            <Stack spacing={4}>
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
                                    <Chip icon={<EmojiPeople />} label="Working Staff" color="error" variant="outlined" />
                                    <Chip icon={<Groups />} label={`${teams.length} nhóm`} variant="outlined" />
                                    {profile.leader && (
                                        <Chip
                                            icon={<AssignmentTurnedIn />}
                                            label="Team Leader"
                                            sx={{ bgcolor: alpha(COLORS.SUCCESS[100], 0.8) }}
                                        />
                                    )}
                                </Stack>
                                <Typography variant="body1" sx={{ mt: 2, color: COLORS.TEXT.SECONDARY }}>
                                    Theo dõi lịch làm việc, nhiệm vụ và các đội nhóm bạn tham gia. Mọi thông tin đều được tổng hợp
                                    trong một bảng điều khiển trực quan dành riêng cho nhân viên vận hành.
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
                    ) : (
                        <Skeleton variant="rounded" height={160} />
                    )}
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <StatCard
                            title="Nhiệm vụ hôm nay"
                            value={stats.totalTasks}
                            subtitle="Tổng số nhiệm vụ được giao"
                            icon={<AssignmentTurnedIn />}
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard
                            title="Đang thực hiện"
                            value={stats.inProgress}
                            subtitle="Cần theo dõi trong ca làm"
                            icon={<AccessTime />}
                            accent={COLORS.WARNING[100]}
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard
                            title="Hoàn thành"
                            value={`${stats.completionRate}%`}
                            subtitle={`${stats.completed}/${stats.totalTasks} nhiệm vụ`}
                            icon={<PlaylistAddCheck />}
                            accent={COLORS.SUCCESS[100]}
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard
                            title="Nhóm tham gia"
                            value={stats.totalTeams}
                            subtitle={`${stats.scheduleBlocks} khung giờ trong ngày`}
                            icon={<Groups />}
                            accent={COLORS.INFO[100]}
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        Lịch trong ngày
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                                    </Typography>
                                </Box>
                                <Button size="small" onClick={() => navigate('/staff/schedules')}>
                                    Chi tiết
                                </Button>
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <List>
                                {loading
                                    ? Array.from({ length: 3 }).map((_, idx) => (
                                        <ListItem key={idx} disableGutters sx={{ mb: 2 }}>
                                            <Skeleton variant="rounded" width="100%" height={72} />
                                        </ListItem>
                                    ))
                                    : todaySchedules.map((schedule) => (
                                        <ListItem
                                            key={schedule.id}
                                            sx={{
                                                borderRadius: 3,
                                                mb: 2,
                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.8)}`
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: COLORS.ERROR[100], color: COLORS.ERROR[600] }}>
                                                    <EventAvailable />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                            {schedule.work_type?.name || 'Công việc'}
                                                        </Typography>
                                                        <Chip
                                                            label={`${schedule.slot?.start_time || '--'} - ${schedule.slot?.end_time || '--'}`}
                                                            size="small"
                                                        />
                                                    </Stack>
                                                }
                                                secondary={
                                                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {schedule.team?.name || 'Nhóm chung'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {schedule.area?.name}
                                                        </Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                {!loading && todaySchedules.length === 0 && (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Bạn chưa có lịch làm trong ngày hôm nay.
                                    </Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Nhiệm vụ nổi bật
                                </Typography>
                                <Button size="small" onClick={() => navigate('/staff/daily-tasks')}>
                                    Xem tất cả
                                </Button>
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Stack spacing={2}>
                                {loading
                                    ? Array.from({ length: 3 }).map((_, idx) => (
                                        <Skeleton key={idx} variant="rounded" height={82} />
                                    ))
                                    : highlightTasks.map((task) => (
                                        <Paper
                                            key={task.id}
                                            variant="outlined"
                                            sx={{ p: 2.5, borderRadius: 3, borderColor: alpha(COLORS.BORDER.DEFAULT, 0.8) }}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                        {task.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {task.team?.name} • {task.area?.name}
                                                    </Typography>
                                                </Box>
                                                <Stack spacing={1} alignItems="flex-end">
                                                    <Chip
                                                        label={task.status}
                                                        size="small"
                                                        color={
                                                            task.status === 'COMPLETED'
                                                                ? 'success'
                                                                : task.status === 'IN_PROGRESS'
                                                                    ? 'warning'
                                                                    : 'default'
                                                        }
                                                    />
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {task.start_time} - {task.end_time}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    ))}
                                {!loading && highlightTasks.length === 0 && (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Chưa có nhiệm vụ được phân công trong ngày.
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>
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
                        {loading
                            ? Array.from({ length: 2 }).map((_, idx) => (
                                <Grid item xs={12} md={6} key={idx}>
                                    <Skeleton variant="rounded" height={180} />
                                </Grid>
                            ))
                            : teams.map((team) => (
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
                                            <Typography variant="body2">
                                                Leader:{' '}
                                                <strong>{team.leader?.full_name || team.leader?.name || 'Chưa cập nhật'}</strong>
                                            </Typography>
                                            <Stack direction="row" spacing={2}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        Thành viên
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                        {team.members?.length || 0}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        Hoàn thành
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Box sx={{ width: 120 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={team.stats?.completed_rate || 0}
                                                                sx={{ height: 8, borderRadius: 5 }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2">
                                                            {team.stats?.completed_rate || 0}%
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                        {!loading && teams.length === 0 && (
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Bạn chưa được phân vào nhóm nào. Vui lòng liên hệ quản lý.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Stack>
        </Box>
    );
};

export default WorkingDashboardPage;

