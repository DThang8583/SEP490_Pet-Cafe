import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Chip,
    alpha,
    Fade,
    Paper
} from '@mui/material';
import {
    CheckCircle,
    ErrorOutline,
    Home,
    ShoppingCart
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const BookingPaymentSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('PENDING'); // PENDING | PAID | FAILED

    useEffect(() => {
        // Lấy order đã lưu lúc tạo đơn
        try {
            const saved = localStorage.getItem('last_booking_order');
            if (saved) {
                const parsed = JSON.parse(saved);
                setOrder(parsed);
                // Nếu backend đã cập nhật và bạn có gọi check status thêm,
                // có thể set từ parsed.payment_status / status
                setStatus(parsed.payment_status || parsed.status || 'PENDING');
            }
        } catch (err) {
            console.warn('[BookingPaymentSuccess] Cannot parse last_booking_order:', err);
        }

        // Nếu PayOS redirect kèm query (ví dụ status / code), có thể đọc ở đây
        const params = new URLSearchParams(location.search);
        const qStatus = params.get('status') || params.get('code');
        if (qStatus) {
            if (qStatus.toString().toUpperCase() === 'PAID' || qStatus.toString() === '00') {
                setStatus('PAID');
            } else if (qStatus.toString().toUpperCase() === 'FAILED') {
                setStatus('FAILED');
            }
        }
    }, [location.search]);

    const isPaid = status === 'PAID';
    const isFailed = status === 'FAILED';

    return (
        <Fade in timeout={800}>
            <Box
                sx={{
                    py: { xs: 3, md: 4 },
                    minHeight: '100vh',
                    background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.SUCCESS[50], 0.6)}, transparent 60%),
                                 radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                                 ${COLORS.BACKGROUND.NEUTRAL}`
                }}
            >
                <Box
                    sx={{
                        maxWidth: 720,
                        mx: 'auto',
                        px: { xs: 2, sm: 3 },
                    }}
                >
                    <Card
                        sx={{
                            borderRadius: 4,
                            boxShadow: 8,
                            border: `1px solid ${alpha(isPaid ? COLORS.SUCCESS[300] : isFailed ? COLORS.ERROR[300] : COLORS.WARNING[300], 0.8)}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER,
                            overflow: 'hidden'
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Stack spacing={3} alignItems="center" textAlign="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                    {isFailed ? (
                                        <ErrorOutline sx={{ fontSize: 64, color: COLORS.ERROR[500] }} />
                                    ) : (
                                        <CheckCircle sx={{ fontSize: 64, color: COLORS.SUCCESS[500] }} />
                                    )}
                                </Box>

                                <Box>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 900,
                                            color: isFailed ? COLORS.ERROR[700] : COLORS.SUCCESS[700],
                                            mb: 1
                                        }}
                                    >
                                        {isFailed
                                            ? 'Thanh toán thất bại'
                                            : isPaid
                                            ? 'Thanh toán thành công'
                                            : 'Đang chờ xác nhận thanh toán'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {isFailed
                                            ? 'Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ nhân viên để được hỗ trợ.'
                                            : isPaid
                                            ? 'Cảm ơn bạn đã thanh toán. Đơn đặt dịch vụ của bạn đã được ghi nhận.'
                                            : 'Hệ thống đang ghi nhận giao dịch. Nếu thanh toán thành công, nhân viên sẽ xác nhận lịch cho bạn.'}
                                    </Typography>
                                </Box>

                                {order && (
                                    <Box sx={{ alignSelf: 'stretch', mt: 1 }}>
                                        <Paper
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.INFO[50], 0.8),
                                                border: `1px solid ${alpha(COLORS.INFO[200], 0.9)}`
                                            }}
                                        >
                                            <Stack spacing={1.5}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}
                                                    >
                                                        Mã đơn hàng
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        color={isPaid ? 'success' : isFailed ? 'error' : 'warning'}
                                                        label={order.order_number || order.id || '—'}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </Stack>

                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: COLORS.TEXT.SECONDARY }}
                                                    >
                                                        Trạng thái
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: isPaid
                                                                ? COLORS.SUCCESS[700]
                                                                : isFailed
                                                                ? COLORS.ERROR[700]
                                                                : COLORS.WARNING[700]
                                                        }}
                                                    >
                                                        {isPaid
                                                            ? 'Đã thanh toán'
                                                            : isFailed
                                                            ? 'Thất bại'
                                                            : 'Chờ thanh toán'}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: COLORS.TEXT.SECONDARY }}
                                                    >
                                                        Số tiền
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}
                                                    >
                                                        {formatPrice(
                                                            order.total ||
                                                            order.final_amount ||
                                                            order.total_amount ||
                                                            0
                                                        )}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Box>
                                )}

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    sx={{ pt: 1, alignSelf: 'stretch' }}
                                >
                                    <Button
                                        variant="outlined"
                                        startIcon={<Home />}
                                        fullWidth
                                        onClick={() => navigate('/home')}
                                        sx={{
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Về trang chủ
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<ShoppingCart />}
                                        fullWidth
                                        onClick={() => navigate('/booking')}
                                        sx={{
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Đặt thêm dịch vụ
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Fade>
    );
};

export default BookingPaymentSuccessPage;

