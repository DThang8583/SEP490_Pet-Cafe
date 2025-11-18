import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, IconButton, Divider, Paper, List, ListItem, ListItemText, ListItemIcon, Avatar, Grid } from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon, LocationOn as LocationIcon, People as PeopleIcon, Work as WorkIcon, Image as ImageIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { alpha } from '@mui/material/styles';
import * as areasApi from '../../api/areasApi';
import Loading from '../loading/Loading';

const AreaDetailModal = ({ open, onClose, area }) => {
    const [areaDetail, setAreaDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && area?.id) {
            loadAreaDetail();
        } else if (!open) {
            setAreaDetail(null);
        }
    }, [area, open]);

    const loadAreaDetail = async () => {
        if (!area?.id) return;

        setLoading(true);
        try {
            const detail = await areasApi.getAreaById(area.id);
            setAreaDetail(detail);
        } catch (error) {
            console.error('Error loading area detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!area) return null;

    const currentWorkTypes = areaDetail?.area_work_types || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
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
                    <LocationIcon />
                    📍 Chi tiết khu vực: {area.name}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Loading />
                    </Box>
                ) : areaDetail ? (
                    <Stack spacing={3}>
                        {/* Image and Basic Info */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        bgcolor: COLORS.GRAY[50],
                                        borderRadius: 2,
                                        minHeight: 200
                                    }}
                                >
                                    {areaDetail.image_url ? (
                                        <Avatar
                                            src={areaDetail.image_url}
                                            variant="rounded"
                                            sx={{ width: '100%', height: 200, maxWidth: 300 }}
                                        />
                                    ) : (
                                        <Stack alignItems="center" spacing={1}>
                                            <ImageIcon sx={{ fontSize: 48, color: COLORS.GRAY[400] }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Chưa có ảnh
                                            </Typography>
                                        </Stack>
                                    )}
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Stack spacing={2}>
                                    {/* Name */}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                            Tên khu vực
                                        </Typography>
                                        <Typography variant="h6" fontWeight={600}>
                                            {areaDetail.name || 'N/A'}
                                        </Typography>
                                    </Box>

                                    {/* Location */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <LocationIcon sx={{ fontSize: 18, color: COLORS.GRAY[500] }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    Vị trí
                                                </Typography>
                                                <Typography variant="body1">
                                                    {areaDetail.location || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Capacity */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <PeopleIcon sx={{ fontSize: 18, color: COLORS.GRAY[500] }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    Sức chứa tối đa
                                                </Typography>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {areaDetail.max_capacity ?? 0} người
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Status */}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                            Trạng thái
                                        </Typography>
                                        <Chip
                                            label={areaDetail.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                            size="small"
                                            color={areaDetail.is_active ? 'success' : 'default'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Description */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Mô tả
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: COLORS.GRAY[50], borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {areaDetail.description || 'Chưa có mô tả'}
                                </Typography>
                            </Paper>
                        </Box>

                        <Divider />

                        {/* Work Types */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <WorkIcon sx={{ fontSize: 20, color: COLORS.PRIMARY[600] }} />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Loại công việc ({currentWorkTypes.length})
                                </Typography>
                            </Stack>
                            {currentWorkTypes.length === 0 ? (
                                <Paper sx={{ p: 2, bgcolor: COLORS.GRAY[50] }}>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        Chưa có loại công việc nào được gán
                                    </Typography>
                                </Paper>
                            ) : (
                                <List sx={{ bgcolor: COLORS.GRAY[50], borderRadius: 1 }}>
                                    {currentWorkTypes.map((awt, index) => (
                                        <ListItem
                                            key={awt.work_type?.id || awt.id || `awt-${index}`}
                                            sx={{
                                                borderBottom: index < currentWorkTypes.length - 1
                                                    ? `1px solid ${COLORS.GRAY[200]}`
                                                    : 'none',
                                                '&:last-child': {
                                                    borderBottom: 'none'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <WorkIcon sx={{ color: COLORS.PRIMARY[600] }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {awt.work_type?.name || 'N/A'}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="text.secondary">
                                                        {awt.work_type?.description || 'Chưa có mô tả'}
                                                    </Typography>
                                                }
                                            />
                                            <Chip
                                                label={awt.work_type?.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                size="small"
                                                color={awt.work_type?.is_active ? 'success' : 'default'}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Không thể tải thông tin chi tiết
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        minWidth: 100,
                        bgcolor: COLORS.PRIMARY[600],
                        '&:hover': { bgcolor: COLORS.PRIMARY[700] }
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AreaDetailModal;

