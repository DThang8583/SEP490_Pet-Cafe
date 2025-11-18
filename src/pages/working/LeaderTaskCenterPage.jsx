import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Grid, Chip, Button, alpha, Snackbar, Alert, Divider, Skeleton } from '@mui/material';
import { AssignmentTurnedIn, Vaccines, Pets } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';

const LeaderTaskCenterPage = () => {
    const profile = workingStaffApi.getProfile();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [tasks, setTasks] = useState([]);
    const [notesMap, setNotesMap] = useState({});
    const [snackbar, setSnackbar] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!profile.leader) return;
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                const leaderTeams = data.filter((team) => team.leader_id === profile.id || team.leader_id === profile.employee_id);
                if (mounted) {
                    setTeams(leaderTeams);
                    if (leaderTeams.length > 0) {
                        setSelectedTeam(leaderTeams[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load leader teams', error);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, [profile.id, profile.employee_id, profile.leader]);

    useEffect(() => {
        if (!selectedTeam) return;
        let mounted = true;
        const loadTasks = async () => {
            setLoading(true);
            try {
                const data = await workingStaffApi.getTeamDailyTasks(selectedTeam, new Date());
                if (mounted) setTasks(data);
            } catch (error) {
                console.error('Failed to load leader tasks', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadTasks();
        return () => {
            mounted = false;
        };
    }, [selectedTeam]);

    const handleStatus = async (taskId, status) => {
        try {
            await workingStaffApi.updateDailyTaskStatus(taskId, status);
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
            setSnackbar({ message: 'Cập nhật nhiệm vụ thành công', severity: 'success' });
        } catch (error) {
            console.error('Failed to update leader task', error);
            setSnackbar({ message: 'Không thể cập nhật nhiệm vụ', severity: 'error' });
        }
    };

    const handleNoteChange = (taskId, note) => {
        setNotesMap((prev) => ({ ...prev, [taskId]: note }));
    };

    if (!profile.leader) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Alert severity="info">
                    Chỉ leader mới có quyền truy cập Trung tâm nhiệm vụ. Hãy đăng nhập bằng tài khoản leader để tiếp tục.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <AssignmentTurnedIn sx={{ color: COLORS.ERROR[500] }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Trung tâm nhiệm vụ Leader
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Theo dõi và cập nhật trạng thái nhiệm vụ, ghi chú vaccine/pet care nhanh chóng.
                        </Typography>
                    </Box>
                </Stack>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Stack spacing={1} flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Nhóm phụ trách
                            </Typography>
                            <TextField select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack spacing={1} flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Tổng nhiệm vụ hôm nay
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                                    {tasks.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Bao gồm cả công việc chăm sóc và tiêm phòng
                                </Typography>
                            </Paper>
                        </Stack>
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    {loading
                        ? Array.from({ length: 4 }).map((_, idx) => (
                            <Grid item xs={12} key={idx}>
                                <Skeleton variant="rounded" height={180} />
                            </Grid>
                        ))
                        : tasks.map((task) => (
                            <Grid item xs={12} key={task.id}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        borderColor: alpha(COLORS.BORDER.DEFAULT, 0.8)
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                                            <Stack spacing={0.5}>
                                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                    {task.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {task.pet?.name} • {task.customer?.name}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Chip label={task.status} color="primary" variant="outlined" />
                                                <Chip label={task.priority} color="error" variant="outlined" />
                                                <Chip label={`${task.start_time} - ${task.end_time}`} />
                                            </Stack>
                                        </Stack>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        Khu vực
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                        {task.area?.name}
                                                    </Typography>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        Nhóm thực hiện
                                                    </Typography>
                                                    <Typography variant="body1">{task.team?.name}</Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Pets sx={{ color: COLORS.ERROR[500] }} />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            Ghi chú chăm sóc
                                                        </Typography>
                                                    </Stack>
                                                    <TextField
                                                        multiline
                                                        minRows={3}
                                                        value={notesMap[task.id] || task.notes || ''}
                                                        onChange={(e) => handleNoteChange(task.id, e.target.value)}
                                                        placeholder="Nhập ghi chú nhanh cho đội..."
                                                        sx={{ mt: 1 }}
                                                    />
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Vaccines color="error" />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            Vaccine / Health record
                                                        </Typography>
                                                    </Stack>
                                                    <TextField
                                                        multiline
                                                        minRows={3}
                                                        placeholder="Tình trạng sau tiêm, liều lượng..."
                                                        sx={{ mt: 1 }}
                                                    />
                                                </Paper>
                                            </Grid>
                                        </Grid>

                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button variant="outlined" onClick={() => handleStatus(task.id, 'IN_PROGRESS')}>
                                                Đánh dấu đang làm
                                            </Button>
                                            <Button variant="contained" color="success" onClick={() => handleStatus(task.id, 'COMPLETED')}>
                                                Hoàn thành nhiệm vụ
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    {!loading && tasks.length === 0 && (
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                                <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Không có nhiệm vụ nào được phân cho nhóm trong ngày hôm nay.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Stack>

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default LeaderTaskCenterPage;

