import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, IconButton, Divider, Paper, Grid, Avatar, List, ListItem, ListItemText } from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon, Schedule as ScheduleIcon, Image as ImageIcon, Task as TaskIcon, CheckCircle as CheckIcon, Cancel as CancelIcon, Delete as DeleteIcon, Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { alpha } from '@mui/material/styles';
import serviceApi from '../../api/serviceApi';
import Loading from '../loading/Loading';
import { formatPrice } from '../../utils/formatPrice';

const ServiceDetailModal = ({ open, onClose, service }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

    const [serviceDetail, setServiceDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && service?.id) {
            loadServiceDetail();
            loadFeedbacks();
        } else if (!open) {
            setServiceDetail(null);
            setFeedbacks([]);
        }
    }, [service, open]);

    const loadServiceDetail = async () => {
        if (!service?.id) return;

        setLoading(true);
        try {
            const detail = await serviceApi.getServiceById(service.id);
            setServiceDetail(detail);
        } catch (error) {
            console.error('Error loading service detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFeedbacks = async () => {
        if (!service?.id) {
            setFeedbacks([]);
            return;
        }
        setLoadingFeedbacks(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = `https://petcafes.azurewebsites.net/api/feedbacks?service_id=${service.id}`;
            const resp = await fetch(url, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            if (!resp.ok) throw new Error('Failed to fetch feedbacks');
            const json = await resp.json();
            console.log('feedbacks:', json.data);
            setFeedbacks(Array.isArray(json?.data) ? json.data : []);
        } catch (err) {
            console.error('Error fetching feedbacks:', err);
            setFeedbacks([]);
        } finally {
            setLoadingFeedbacks(false);
        }
    };

    const deleteFeedback = async (feedbackId) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error('No auth token found');
                return;
            }

            const url = `https://petcafes.azurewebsites.net/api/feedbacks/${feedbackId}`;
            const resp = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!resp.ok) throw new Error('Failed to delete feedback');
            // Reload feedbacks after successful deletion
            await loadFeedbacks();
        } catch (err) {
            console.error('Error deleting feedback:', err);
        }
    };

    if (!service) return null;

    const displayService = serviceDetail || service;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    minHeight: '60vh'
                }
            }}
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon />
                    📋 Chi tiết dịch vụ: {displayService.name}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <Loading />
                    </Box>
                ) : (
                    <Box>
                        {/* Image and Basic Info Section */}
                        <Box sx={{ p: 3, bgcolor: COLORS.GRAY[50] }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={5}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            overflow: 'hidden',
                                            borderRadius: 2,
                                            bgcolor: 'white',
                                            border: `1px solid ${COLORS.GRAY[200]}`
                                        }}
                                    >
                                        {displayService.image_url ? (
                                            <Box
                                                component="img"
                                                src={displayService.image_url}
                                                alt={displayService.name}
                                                sx={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    display: 'block',
                                                    maxHeight: 350,
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
                                                <ImageIcon sx={{ fontSize: 64, color: COLORS.GRAY[400], mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Không có ảnh
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={7}>
                                    <Stack spacing={2.5}>
                                        {/* Name */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                                                Tên dịch vụ
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ mt: 1, lineHeight: 1.3 }}>
                                                {displayService.name}
                                            </Typography>
                                        </Box>

                                        {/* Status */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Trạng thái
                                            </Typography>
                                            <Chip
                                                label={displayService.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                icon={displayService.is_active ? <CheckIcon /> : <CancelIcon />}
                                                size="medium"
                                                sx={{
                                                    bgcolor: displayService.is_active
                                                        ? COLORS.SUCCESS[100]
                                                        : COLORS.GRAY[200],
                                                    color: displayService.is_active
                                                        ? COLORS.SUCCESS[700]
                                                        : COLORS.TEXT.SECONDARY,
                                                    fontWeight: 600,
                                                    px: 1,
                                                    '& .MuiChip-icon': {
                                                        color: displayService.is_active
                                                            ? COLORS.SUCCESS[700]
                                                            : COLORS.TEXT.SECONDARY
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Duration and Price in a row */}
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                        Thời lượng
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <ScheduleIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 20 }} />
                                                        <Typography variant="h6" fontWeight={600}>
                                                            {displayService.duration_minutes} phút
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                        Giá cơ bản
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="h6" fontWeight={700} color={COLORS.SUCCESS[700]}>
                                                            {formatPrice(displayService.base_price)}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Description Section */}
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, color: COLORS.PRIMARY[700] }}>
                                Mô tả
                            </Typography>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    bgcolor: COLORS.GRAY[50],
                                    borderRadius: 2,
                                    border: `1px solid ${COLORS.GRAY[200]}`
                                }}
                            >
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                    {displayService.description || 'Không có mô tả'}
                                </Typography>
                            </Paper>
                        </Box>

                        {/* Thumbnails Section */}
                        {displayService.thumbnails && displayService.thumbnails.length > 0 && (
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, color: COLORS.PRIMARY[700] }}>
                                    Ảnh phụ ({displayService.thumbnails.length})
                                </Typography>
                                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                                    {displayService.thumbnails.map((thumbnail, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                overflow: 'hidden',
                                                borderRadius: 2,
                                                border: `1px solid ${COLORS.GRAY[200]}`,
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                    boxShadow: 2
                                                }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={thumbnail}
                                                alt={`Thumbnail ${index + 1}`}
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Feedbacks Section */}
                        <Box sx={{ px: 3, pb: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, color: COLORS.PRIMARY[700] }}>
                                Đánh giá ({feedbacks.length})
                            </Typography>
                            {loadingFeedbacks ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <Loading />
                                </Box>
                            ) : feedbacks.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">Chưa có đánh giá cho dịch vụ này.</Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {feedbacks.map((f) => (
                                        <Paper key={f.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${COLORS.GRAY[200]}` }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar src={f.customer?.avatar_url} alt={f.customer?.full_name} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography fontWeight={700}>{f.customer?.full_name || 'Khách hàng'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{f.feedback_date ? new Date(f.feedback_date).toLocaleString('vi-VN') : ''}</Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ display: 'flex', gap: 0.3 }}>
                                                        {Array.from({ length: 5 }).map((_, i) => {
                                                            const filled = (f.rating || 0) > i;
                                                            return filled ? (
                                                                <StarIcon key={i} sx={{ fontSize: 16, color: COLORS.WARNING[500] }} />
                                                            ) : (
                                                                <StarBorderIcon key={i} sx={{ fontSize: 16, color: COLORS.WARNING[300] }} />
                                                            );
                                                        })}
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => deleteFeedback(f.id)}
                                                        sx={{
                                                            color: COLORS.ERROR[600],
                                                            '&:hover': { bgcolor: alpha(COLORS.ERROR[100], 0.5) }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                            {f.comment ? <Typography sx={{ mt: 1, color: COLORS.TEXT.SECONDARY }}>{f.comment}</Typography> : null}
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        {/* Task Information Section */}
                        {displayService.task && (
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <TaskIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 24 }} />
                                    <Typography variant="h6" fontWeight={600} sx={{ color: COLORS.PRIMARY[700] }}>
                                        Thông tin Nhiệm vụ
                                    </Typography>
                                </Stack>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        bgcolor: COLORS.PRIMARY[50],
                                        borderRadius: 2,
                                        border: `1px solid ${COLORS.PRIMARY[200]}`
                                    }}
                                >
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Tên nhiệm vụ
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {displayService.task.title || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Trạng thái
                                            </Typography>
                                            <Chip
                                                label={displayService.task.status || 'N/A'}
                                                size="small"
                                                sx={{
                                                    bgcolor: displayService.task.status === 'ACTIVE'
                                                        ? COLORS.SUCCESS[100]
                                                        : COLORS.GRAY[200],
                                                    color: displayService.task.status === 'ACTIVE'
                                                        ? COLORS.SUCCESS[700]
                                                        : COLORS.TEXT.SECONDARY,
                                                    fontWeight: 600
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Độ ưu tiên
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {displayService.task.priority || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Thời gian ước tính
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {displayService.task.estimated_hours ? `${displayService.task.estimated_hours} giờ` : 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', display: 'block', mb: 1 }}>
                                                Mô tả nhiệm vụ
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                {displayService.task.description || 'Không có mô tả'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceDetailModal;

