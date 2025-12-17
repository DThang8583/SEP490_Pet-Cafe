import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    MenuItem,
    alpha
} from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' }
];

const EditBookingModal = ({
    isOpen = false,
    onClose,
    booking,
    onSubmit,
    isSubmitting = false
}) => {
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && booking) {
            setStatus(booking.booking_status || '');
            setNotes(booking.notes || '');
            setCancelReason(booking.cancel_reason || '');
            setErrors({});
        }
    }, [isOpen, booking]);

    const handleClose = () => {
        if (isSubmitting) return;
        onClose?.();
    };

    const validate = () => {
        const newErrors = {};
        if (!status) {
            newErrors.status = 'Vui lòng chọn trạng thái booking';
        }
        if (status === 'CANCELLED' && !cancelReason.trim()) {
            newErrors.cancelReason = 'Vui lòng nhập lý do hủy booking';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!booking) return;
        if (!validate()) return;
        onSubmit?.({ status, notes, cancelReason });
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`
                }
            }}
        >
            {/* Header - đồng bộ style với các modal quản lý */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        color: COLORS.PRIMARY[700],
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]}, ${COLORS.PRIMARY[600]})`,
                            boxShadow: `0 6px 16px ${alpha(COLORS.PRIMARY[400], 0.4)}`
                        }}
                    >
                        <ReceiptLong sx={{ fontSize: 18, color: 'white' }} />
                    </Box>
                    Chỉnh sửa booking
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {!booking ? (
                    <Typography variant="body2" color="text.secondary">
                        Không tìm thấy thông tin booking.
                    </Typography>
                ) : (
                    <Stack spacing={2.5}>
                        {/* Service info */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Dịch vụ:
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {booking.service?.name || '—'}
                            </Typography>
                        </Box>
                        {/* Team info */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Nhóm phụ trách:
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {booking.team?.name || '—'}
                            </Typography>
                        </Box>

                        {/* Status */}
                        <TextField
                            select
                            fullWidth
                            required
                            label="Trạng thái booking"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            error={Boolean(errors.status)}
                            helperText={errors.status}
                            size="small"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* Notes */}
                        <TextField
                            label="Ghi chú"
                            fullWidth
                            multiline
                            minRows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            size="small"
                        />

                        {/* Cancel reason */}
                        <TextField
                            label="Lý do hủy (bắt buộc nếu hủy)"
                            fullWidth
                            multiline
                            minRows={2}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            error={Boolean(errors.cancelReason)}
                            helperText={errors.cancelReason}
                            size="small"
                        />
                    </Stack>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`
                }}
            >
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !booking}
                    variant="contained"
                    sx={{
                        backgroundColor: COLORS.PRIMARY[500],
                        '&:hover': { backgroundColor: COLORS.PRIMARY[600] }
                    }}
                >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditBookingModal;
