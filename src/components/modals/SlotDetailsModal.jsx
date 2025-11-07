import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Paper, Tooltip, Alert, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const SlotDetailsModal = ({
    open,
    onClose,
    taskData,
    slots = [],
    onCreateSlot,
    onEditSlot,
    onDeleteSlot,
    onRefresh,
    showCreateAction = false
}) => {
    const [taskSlots, setTaskSlots] = useState([]);

    useEffect(() => {
        if (open && taskData && slots) {
            // Filter slots for this task
            const filtered = slots.filter(slot => slot.task_id === taskData.id);

            // Sort by weekday order (Monday first)
            const weekdayOrder = {
                'MONDAY': 0,
                'TUESDAY': 1,
                'WEDNESDAY': 2,
                'THURSDAY': 3,
                'FRIDAY': 4,
                'SATURDAY': 5,
                'SUNDAY': 6
            };

            filtered.sort((a, b) => {
                const dayA = a.day_of_week || 'MONDAY';
                const dayB = b.day_of_week || 'MONDAY';
                const orderA = weekdayOrder[dayA] !== undefined ? weekdayOrder[dayA] : 999;
                const orderB = weekdayOrder[dayB] !== undefined ? weekdayOrder[dayB] : 999;

                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return (a.start_time || '').localeCompare(b.start_time || '');
            });

            setTaskSlots(filtered);
        }
    }, [open, taskData, slots]);

    if (!taskData) return null;

    const stats = {
        total: taskSlots.length,
        available: taskSlots.filter(s => s.service_status === 'AVAILABLE').length,
        unavailable: taskSlots.filter(s => s.service_status === 'UNAVAILABLE').length,
        booked: taskSlots.filter(s => s.service_status === 'BOOKED').length
    };

    const getStatusChip = (status) => {
        const statusMap = {
            'AVAILABLE': { label: 'Có sẵn', color: COLORS.SUCCESS[700], bg: COLORS.SUCCESS[50] },
            'UNAVAILABLE': { label: 'Không khả dụng', color: COLORS.WARNING[700], bg: COLORS.WARNING[50] },
            'BOOKED': { label: 'Đã đặt', color: COLORS.INFO[700], bg: COLORS.INFO[50] },
            'CANCELLED': { label: 'Đã hủy', color: COLORS.ERROR[700], bg: COLORS.ERROR[50] }
        };
        const config = statusMap[status] || statusMap['AVAILABLE'];
        return (
            <Chip
                label={config.label}
                size="small"
                sx={{
                    bgcolor: alpha(config.bg, 0.8),
                    color: config.color,
                    fontWeight: 600
                }}
            />
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: `2px solid ${COLORS.PRIMARY[100]}`,
                pb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color={COLORS.PRIMARY[700]}>
                        Chi tiết Ca làm việc
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {taskData?.title || taskData?.name}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {/* Statistics */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.PRIMARY[50], 0.5),
                        border: `1px solid ${COLORS.PRIMARY[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.PRIMARY[700]}>
                            {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tổng Ca
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.SUCCESS[50], 0.5),
                        border: `1px solid ${COLORS.SUCCESS[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.SUCCESS[700]}>
                            {stats.available}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Có sẵn
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.WARNING[50], 0.5),
                        border: `1px solid ${COLORS.WARNING[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.WARNING[700]}>
                            {stats.unavailable}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Không khả dụng
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.INFO[50], 0.5),
                        border: `1px solid ${COLORS.INFO[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.INFO[700]}>
                            {stats.booked}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Đã đặt
                        </Typography>
                    </Paper>
                </Stack>

                {/* Action Buttons */}
                {showCreateAction && (
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                onCreateSlot(taskData);
                                onClose();
                            }}
                            sx={{
                                bgcolor: COLORS.SUCCESS[600],
                                '&:hover': {
                                    bgcolor: COLORS.SUCCESS[700]
                                }
                            }}
                        >
                            Tạo Ca mới
                        </Button>
                    </Stack>
                )}

                {/* Slots Table */}
                {taskSlots.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Chưa có slot nào cho task này. Hãy tạo slot đầu tiên!
                        </Typography>
                    </Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                                <TableRow>
                                    <TableCell width="3%">STT</TableCell>
                                    <TableCell width="8%">Ngày</TableCell>
                                    <TableCell width="10%">Thời gian</TableCell>
                                    <TableCell width="12%">Team</TableCell>
                                    <TableCell width="12%">Khu vực</TableCell>
                                    <TableCell width="12%">Nhóm Pet</TableCell>
                                    <TableCell width="10%" align="center">Sức chứa</TableCell>
                                    {taskData.is_public && <TableCell width="10%" align="right">Giá</TableCell>}
                                    <TableCell width="10%" align="center">Trạng thái</TableCell>
                                    <TableCell width="8%" align="center">Ghi chú</TableCell>
                                    <TableCell width="8%" align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {taskSlots.map((slot, index) => (
                                    <TableRow key={slot.id} hover>
                                        <TableCell>{index + 1}</TableCell>

                                        {/* Ngày */}
                                        <TableCell>
                                            <Chip
                                                label={WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        </TableCell>

                                        {/* Thời gian */}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {slot.start_time} - {slot.end_time}
                                            </Typography>
                                        </TableCell>

                                        {/* Team */}
                                        <TableCell>
                                            {slot.team ? (
                                                <Tooltip title={slot.team.description || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.team.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Khu vực */}
                                        <TableCell>
                                            {slot.area ? (
                                                <Tooltip title={`${slot.area.location || ''}`}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.area.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Pet Group */}
                                        <TableCell>
                                            {slot.pet_group ? (
                                                <Tooltip title={slot.pet_group.description || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.pet_group.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Sức chứa */}
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={500}>
                                                {slot.max_capacity || 0}
                                            </Typography>
                                        </TableCell>

                                        {/* Giá - Chỉ hiển thị nếu là nhiệm vụ công khai */}
                                        {taskData.is_public && (
                                            <TableCell align="right">
                                                {slot.price && slot.price > 0 ? (
                                                    <Typography variant="body2" fontWeight={500} color={COLORS.SUCCESS[700]}>
                                                        {new Intl.NumberFormat('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND'
                                                        }).format(slot.price)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Trạng thái */}
                                        <TableCell align="center">
                                            {getStatusChip(slot.service_status)}
                                        </TableCell>

                                        {/* Ghi chú */}
                                        <TableCell align="center">
                                            {slot.special_notes ? (
                                                <Tooltip title={slot.special_notes}>
                                                    <IconButton size="small" color="info">
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Thao tác */}
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="Sửa">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEditSlot(slot)}
                                                        sx={{
                                                            color: COLORS.PRIMARY[500],
                                                            '&:hover': {
                                                                bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDeleteSlot(slot.id)}
                                                        sx={{
                                                            color: COLORS.ERROR[500],
                                                            '&:hover': {
                                                                bgcolor: alpha(COLORS.ERROR[50], 0.5)
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotDetailsModal;
