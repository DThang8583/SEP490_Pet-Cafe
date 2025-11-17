import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Chip, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, alpha, Snackbar, Alert, Skeleton } from '@mui/material';
import { Assignment, TaskAlt } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';
import { useLocation } from 'react-router-dom';

const statusColorMap = {
    SCHEDULED: 'default',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error'
};

const WorkingTasksPage = () => {
    const location = useLocation();
    const locationTeamId = location.state?.teamId;
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

    useEffect(() => {
        if (!selectedTeam) return;
        let mounted = true;
        const loadTasks = async () => {
            setLoading(true);
            try {
                const data = await workingStaffApi.getTeamDailyTasks(selectedTeam, selectedDate);
                if (mounted) setTasks(data);
            } catch (error) {
                console.error('Failed to load tasks', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadTasks();
        return () => {
            mounted = false;
        };
    }, [selectedTeam, selectedDate]);

    const selectedTeamObject = useMemo(() => teams.find((team) => team.id === selectedTeam), [teams, selectedTeam]);

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
                        Nhiệm vụ theo đội
                    </Typography>
                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        Chọn nhóm và ngày để xem chi tiết nhiệm vụ, cập nhật tiến độ trong ca làm.
                    </Typography>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 3
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
                        >
                            {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    {team.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Ngày làm việc
                        </Typography>
                        <TextField type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </Stack>
                </Paper>

                {selectedTeamObject && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                            <Stack spacing={1}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {selectedTeamObject.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    {selectedTeamObject.work_type?.name || 'Loại công việc'} •{' '}
                                    {selectedTeamObject.area?.name || 'Khu vực'}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <Chip icon={<Assignment />} label={`${tasks.length} nhiệm vụ`} />
                                <Chip icon={<TaskAlt />} label={`${selectedTeamObject.members?.length || 0} thành viên`} />
                            </Stack>
                        </Stack>
                    </Paper>
                )}

                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <Skeleton variant="rounded" height={300} />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nhiệm vụ</TableCell>
                                        <TableCell>Thời gian</TableCell>
                                        <TableCell>Khu vực</TableCell>
                                        <TableCell>Khách hàng</TableCell>
                                        <TableCell align="center">Trạng thái</TableCell>
                                        <TableCell align="right">Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6, color: COLORS.TEXT.SECONDARY }}>
                                                Không có nhiệm vụ nào trong ngày được chọn.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tasks.map((task) => (
                                            <TableRow key={task.id} hover>
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            {task.title}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {task.work_type?.name}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {task.start_time} - {task.end_time}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{task.area?.name}</TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="body2">{task.customer?.name || 'Khách lẻ'}</Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {task.pet?.name} • {task.pet?.type}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={task.status}
                                                        size="small"
                                                        color={statusColorMap[task.status] || 'default'}
                                                        sx={{ minWidth: 120 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                                        >
                                                            Bắt đầu
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                        >
                                                            Hoàn thành
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
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

