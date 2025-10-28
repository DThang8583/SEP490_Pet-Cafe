import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Paper, Tooltip, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close as CloseIcon, Add as AddIcon, Public as PublicIcon, Lock as LockIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { SLOT_STATUS, WEEKDAY_LABELS } from '../../api/slotApi';

const SlotDetailsModal = ({
    open,
    onClose,
    taskData,
    slots = [],
    onCreateSlot,
    onPublishSlot,
    onUnpublishSlot,
    onDeleteSlot,
    onRefresh
}) => {
    const [taskSlots, setTaskSlots] = useState([]);

    useEffect(() => {
        if (open && taskData && slots) {
            // Filter slots for this task
            const filtered = slots.filter(slot => slot.task_id === taskData.id);
            setTaskSlots(filtered);
        }
    }, [open, taskData, slots]);

    if (!taskData) return null;

    const stats = {
        total: taskSlots.length,
        public: taskSlots.filter(s => s.status === SLOT_STATUS.PUBLIC).length,
        internal: taskSlots.filter(s => s.status === SLOT_STATUS.INTERNAL_ONLY).length,
        draft: taskSlots.filter(s => s.status === SLOT_STATUS.DRAFT).length
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                borderBottom: `2px solid ${COLORS.PRIMARY[100]}`,
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={600} color={COLORS.PRIMARY[700]}>
                        📋 Slots của Task: {taskData.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Quản lý tất cả slots cho task này
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
                            Tổng Slots
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.SUCCESS[50], 0.5),
                        border: `1px solid ${COLORS.SUCCESS[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.SUCCESS[700]}>
                            {stats.public}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Public
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.INFO[50], 0.5),
                        border: `1px solid ${COLORS.INFO[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.INFO[700]}>
                            {stats.internal}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Internal
                        </Typography>
                    </Paper>
                </Stack>

                {/* Action Buttons */}
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
                        Tạo Slot mới
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                    >
                        Làm mới
                    </Button>
                </Stack>

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
                                    <TableCell width="5%">STT</TableCell>
                                    <TableCell width="20%">Thời gian</TableCell>
                                    <TableCell width="25%">Ngày áp dụng</TableCell>
                                    <TableCell width="10%" align="center">Capacity</TableCell>
                                    <TableCell width="15%" align="right">Giá</TableCell>
                                    <TableCell width="15%" align="center">Trạng thái</TableCell>
                                    <TableCell width="10%" align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {taskSlots.map((slot, index) => (
                                    <TableRow key={slot.id} hover>
                                        <TableCell>{index + 1}</TableCell>

                                        {/* Thời gian */}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {slot.start_time} - {slot.end_time}
                                            </Typography>
                                        </TableCell>

                                        {/* Ngày áp dụng */}
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                {slot.applicable_days?.slice(0, 3).map(day => (
                                                    <Chip
                                                        key={day}
                                                        label={WEEKDAY_LABELS[day]?.substring(0, 3)}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                                {slot.applicable_days?.length > 3 && (
                                                    <Chip
                                                        label={`+${slot.applicable_days.length - 3}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>

                                        {/* Capacity */}
                                        <TableCell align="center">
                                            {slot.capacity ? (
                                                <Typography variant="body2" fontWeight={500}>
                                                    {slot.capacity}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* Giá */}
                                        <TableCell align="right">
                                            {slot.price ? (
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

                                        {/* Trạng thái */}
                                        <TableCell align="center">
                                            <Chip
                                                label={slot.status === SLOT_STATUS.PUBLIC ? 'Public' : 'Internal'}
                                                size="small"
                                                icon={slot.status === SLOT_STATUS.PUBLIC ? <PublicIcon /> : <LockIcon />}
                                                sx={{
                                                    bgcolor: slot.status === SLOT_STATUS.PUBLIC
                                                        ? alpha(COLORS.SUCCESS[100], 0.8)
                                                        : alpha(COLORS.GRAY[200], 0.6),
                                                    color: slot.status === SLOT_STATUS.PUBLIC
                                                        ? COLORS.SUCCESS[700]
                                                        : COLORS.TEXT.SECONDARY
                                                }}
                                            />
                                        </TableCell>

                                        {/* Thao tác */}
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                {slot.status === SLOT_STATUS.PUBLIC ? (
                                                    <Tooltip title="Unpublish">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                onUnpublishSlot(slot);
                                                                onClose();
                                                            }}
                                                            sx={{ color: COLORS.WARNING[600] }}
                                                        >
                                                            <LockIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <>
                                                        <Tooltip title="Publish">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    onPublishSlot(slot);
                                                                    onClose();
                                                                }}
                                                                sx={{ color: COLORS.SUCCESS[600] }}
                                                            >
                                                                <PublicIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    onDeleteSlot(slot);
                                                                    onClose();
                                                                }}
                                                                sx={{ color: COLORS.ERROR[600] }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${COLORS.GRAY[200]}`,
                px: 3,
                py: 2
            }}>
                <Button onClick={onClose} variant="outlined">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotDetailsModal;

