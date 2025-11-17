import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Chip, Divider, Grid, alpha, Skeleton, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LocationOn, AccessTime, Pets, Assignment } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';

const InfoRow = ({ icon, label, value }) => (
    <Stack direction="row" spacing={2} alignItems="center">
        <Box
            sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: alpha(COLORS.ERROR[100], 0.5),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {value || '—'}
            </Typography>
        </Box>
    </Stack>
);

const LeaderTaskDetailPage = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadTask = async () => {
            try {
                const data = await workingStaffApi.getTaskDetail(taskId);
                if (mounted) setTask(data);
            } catch (error) {
                console.error('Failed to load task detail', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (taskId) {
            loadTask();
        }
        return () => {
            mounted = false;
        };
    }, [taskId]);

    if (!taskId) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Typography>Task ID không hợp lệ.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100%' }}>
            {loading ? (
                <Skeleton variant="rounded" height={320} />
            ) : (
                <Stack spacing={3}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                Chi tiết nhiệm vụ
                            </Typography>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Theo dõi đầy đủ thông tin khu vực, loại công việc, khách hàng và thú cưng liên quan.
                            </Typography>
                        </Box>
                        <Button variant="outlined" onClick={() => navigate(-1)}>
                            Quay lại
                        </Button>
                    </Stack>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                    {task?.title}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Chip label={task?.status} color="primary" variant="outlined" />
                                    <Chip label={task?.priority} color="error" variant="outlined" />
                                </Stack>
                            </Stack>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                {task?.description || 'Chưa có mô tả chi tiết'}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <InfoRow
                                        icon={<AccessTime color="error" />}
                                        label="Thời gian"
                                        value={`${task?.start_time} - ${task?.end_time}`}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <InfoRow
                                        icon={<LocationOn color="error" />}
                                        label="Khu vực"
                                        value={task?.area?.name || 'Chưa cập nhật'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <InfoRow icon={<Assignment color="error" />} label="Nhóm" value={task?.team?.name} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <InfoRow
                                        icon={<Pets color="error" />}
                                        label="Thú cưng"
                                        value={`${task?.pet?.name || '—'} (${task?.pet?.type || 'Chưa rõ'})`}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <InfoRow
                                        icon={<Assignment color="error" />}
                                        label="Khách hàng"
                                        value={`${task?.customer?.name || '—'} • ${task?.customer?.phone || '—'}`}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
};

export default LeaderTaskDetailPage;

