import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Paper, Tooltip, Alert, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close as CloseIcon, Add as AddIcon, Public as PublicIcon, Lock as LockIcon, Delete as DeleteIcon, Refresh as RefreshIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { SLOT_STATUS, WEEKDAY_LABELS } from '../../api/slotApi';
import ConfirmModal from './ConfirmModal';

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
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuSlot, setMenuSlot] = useState(null);
    const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
    const [unpublishTarget, setUnpublishTarget] = useState(null);

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
                // Get first day of each slot for sorting
                const dayA = a.applicable_days?.[0] || 'MONDAY';
                const dayB = b.applicable_days?.[0] || 'MONDAY';
                const orderA = weekdayOrder[dayA] !== undefined ? weekdayOrder[dayA] : 999;
                const orderB = weekdayOrder[dayB] !== undefined ? weekdayOrder[dayB] : 999;

                // Sort by day, then by start_time
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return (a.start_time || '').localeCompare(b.start_time || '');
            });

            console.log('🔍 SlotDetailsModal - Sorted slots:', filtered);
            setTaskSlots(filtered);
        }
    }, [open, taskData, slots]);

    const confirmUnpublish = async () => {
        if (!unpublishTarget) return;

        setConfirmUnpublishOpen(false);
        setUnpublishTarget(null);

        try {
            await onUnpublishSlot(unpublishTarget);
        } catch (error) {
            console.error('Error unpublishing slot:', error);
        }
    };

    if (!taskData) return null;

    const stats = {
        total: taskSlots.length,
        public: taskSlots.filter(s => s.status === SLOT_STATUS.PUBLIC).length,
        internal: taskSlots.filter(s => s.status === SLOT_STATUS.INTERNAL_ONLY).length,
        draft: taskSlots.filter(s => s.status === SLOT_STATUS.DRAFT).length
    };

    return (
        <>
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
                            📋 Ca của Nhiệm vụ: {taskData.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Quản lý tất cả ca cho nhiệm vụ này
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
                                {stats.public}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Công khai
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
                                Nội bộ
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
                            Tạo Ca mới
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
                                        <TableCell width="10%" align="center">Chỗ ngồi</TableCell>
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
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {Array.isArray(slot.applicable_days) && slot.applicable_days.length > 0 ? (
                                                        <>
                                                            {slot.applicable_days.slice(0, 3).map(day => {
                                                                const label = WEEKDAY_LABELS[day] || day;
                                                                return (
                                                                    <Chip
                                                                        key={day}
                                                                        label={label}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mb: 0.5 }}
                                                                    />
                                                                );
                                                            })}
                                                            {slot.applicable_days.length > 3 && (
                                                                <Chip
                                                                    label={`+${slot.applicable_days.length - 3}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Chưa có ngày
                                                        </Typography>
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
                                                    label={slot.status === SLOT_STATUS.PUBLIC ? 'Công khai' : 'Nội bộ'}
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
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        setMenuAnchor(e.currentTarget);
                                                        setMenuSlot(slot);
                                                    }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
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

                {/* Slot Actions Menu */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => {
                        setMenuAnchor(null);
                        setMenuSlot(null);
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {menuSlot?.status === SLOT_STATUS.PUBLIC ? (
                        <MenuItem
                            onClick={() => {
                                if (menuSlot) {
                                    setUnpublishTarget(menuSlot);
                                    setConfirmUnpublishOpen(true);
                                }
                                setMenuAnchor(null);
                                setMenuSlot(null);
                            }}
                        >
                            <ListItemIcon>
                                <LockIcon fontSize="small" sx={{ color: COLORS.WARNING[600] }} />
                            </ListItemIcon>
                            <ListItemText>Hủy công khai</ListItemText>
                        </MenuItem>
                    ) : (
                        <>
                            <MenuItem
                                onClick={() => {
                                    if (menuSlot) {
                                        onPublishSlot(menuSlot);
                                        onClose();
                                    }
                                    setMenuAnchor(null);
                                    setMenuSlot(null);
                                }}
                            >
                                <ListItemIcon>
                                    <PublicIcon fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                                </ListItemIcon>
                                <ListItemText>Công khai</ListItemText>
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    if (menuSlot) {
                                        onDeleteSlot(menuSlot);
                                        onClose();
                                    }
                                    setMenuAnchor(null);
                                    setMenuSlot(null);
                                }}
                            >
                                <ListItemIcon>
                                    <DeleteIcon fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                                </ListItemIcon>
                                <ListItemText>Xóa</ListItemText>
                            </MenuItem>
                        </>
                    )}
                </Menu>
            </Dialog>

            {/* Confirm Unpublish Modal - Outside parent Dialog */}
            <ConfirmModal
                isOpen={confirmUnpublishOpen}
                onClose={() => {
                    setConfirmUnpublishOpen(false);
                    setUnpublishTarget(null);
                }}
                onConfirm={confirmUnpublish}
                title="Hủy công khai Ca?"
                message={`Bạn có chắc chắn muốn hủy công khai ca này? Ca sẽ không còn hiển thị cho khách hàng.`}
                confirmText="Hủy công khai"
                type="warning"
            />
        </>
    );
};

export default SlotDetailsModal;

