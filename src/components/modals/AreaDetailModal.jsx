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
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '60vh'
                }
            }}
        >
            {/* Title */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.PRIMARY[50],
                    borderBottom: `1px solid ${COLORS.GRAY[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <InfoIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={600}>
                            Chi tiết khu vực
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {area.name}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
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
            <DialogActions sx={{ p: 2.5, bgcolor: COLORS.GRAY[50], borderTop: `1px solid ${COLORS.GRAY[200]}` }}>
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

