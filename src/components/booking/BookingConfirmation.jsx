import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Grid, Card, CardContent, Button, Stack, Divider,
    Chip, Avatar, alpha, Zoom, Fade
} from '@mui/material';
import {
    CheckCircle, Close, Schedule, Person, Pets, LocationOn,
    Phone, Email, AttachMoney, CalendarToday, AccessTime,
    Print, Share, Feedback, BookmarkAdd, Home
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const BookingConfirmation = ({ open, onClose, booking, onNewBooking, onFeedback, onBackToPage }) => {
    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Format date and time
    const formatDateTime = (dateTime) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    // Generate booking reference
    const getBookingReference = (booking) => {
        if (!booking) return '';
        return `PC${booking.id?.slice(-6)?.toUpperCase() || 'XXXXXX'}`;
    };

    // Handle print booking
    const handlePrint = () => {
        window.print();
    };

    // Handle share booking
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Đặt lịch Pet Cafe',
                text: `Đã đặt lịch ${booking?.service?.name} cho ${booking?.pet?.name}`,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const bookingInfo = `
Đặt lịch Pet Cafe
Mã đặt lịch: ${getBookingReference(booking)}
Dịch vụ: ${booking?.service?.name}
Thú cưng: ${booking?.pet?.name}
Thời gian: ${formatDateTime(booking?.bookingDateTime).date} lúc ${formatDateTime(booking?.bookingDateTime).time}
            `.trim();

            navigator.clipboard.writeText(bookingInfo);
            // Could show a toast notification here
        }
    };

    if (!booking) return null;

    const dateTime = formatDateTime(booking.bookingDateTime);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    background: `linear-gradient(135deg, 
                        ${COLORS.BACKGROUND.DEFAULT} 0%, 
                        ${alpha(COLORS.SUCCESS[50], 0.8)} 100%
                    )`
                }
            }}
        >
            <DialogTitle sx={{
                background: `linear-gradient(135deg, 
                    ${COLORS.SUCCESS[500]} 0%, 
                    ${COLORS.SUCCESS[600]} 100%
                )`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Đặt lịch thành công!
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Mã đặt lịch: {getBookingReference(booking)}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    onClick={onClose}
                    sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                >
                    <Close />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Fade in timeout={800}>
                    <Box sx={{ p: 4 }}>
                        {/* Success Message */}
                        <Box sx={{
                            textAlign: 'center',
                            mb: 4,
                            p: 3,
                            background: `linear-gradient(135deg, 
                                ${alpha(COLORS.SUCCESS[100], 0.8)} 0%, 
                                ${alpha(COLORS.SUCCESS[50], 0.6)} 100%
                            )`,
                            borderRadius: 4,
                            border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.5)}`
                        }}>
                            <CheckCircle sx={{
                                fontSize: 60,
                                color: COLORS.SUCCESS[500],
                                mb: 2
                            }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: COLORS.SUCCESS[700] }}>
                                Cảm ơn bạn đã tin tưởng Pet Cafe!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Chúng tôi đã nhận được yêu cầu đặt lịch và sẽ liên hệ xác nhận trong thời gian sớm nhất.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            {/* Left Column - Booking Details */}
                            <Grid item xs={12} md={8}>
                                <Stack spacing={3}>
                                    {/* Service Information */}
                                    <Card sx={{
                                        border: `2px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                            ${alpha(COLORS.INFO[50], 0.8)} 100%
                                        )`
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{
                                                mb: 3,
                                                color: COLORS.INFO[700],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <Pets />
                                                Thông tin dịch vụ
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={8}>
                                                    <Stack spacing={2}>
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Dịch vụ
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight="bold">
                                                                {booking.service?.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {booking.service?.description}
                                                            </Typography>
                                                        </Box>

                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Thời gian dự kiến
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight="bold">
                                                                {Math.floor(booking.service?.duration / 60)}h {booking.service?.duration % 60}p
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Box
                                                        component="img"
                                                        src={(booking.service?.images && booking.service.images[0]) || `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=300&auto=format&fit=crop`}
                                                        alt={booking.service?.name}
                                                        sx={{
                                                            width: '100%',
                                                            height: 120,
                                                            objectFit: 'cover',
                                                            borderRadius: 3
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>

                                    {/* Schedule Information */}
                                    <Card sx={{
                                        border: `2px solid ${alpha(COLORS.WARNING[200], 0.3)}`,
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                            ${alpha(COLORS.WARNING[50], 0.8)} 100%
                                        )`
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{
                                                mb: 3,
                                                color: COLORS.WARNING[700],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <Schedule />
                                                Lịch hẹn
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                        <CalendarToday sx={{ color: COLORS.WARNING[500] }} />
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Ngày
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight="bold">
                                                                {dateTime.date}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                        <AccessTime sx={{ color: COLORS.WARNING[500] }} />
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Giờ
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight="bold">
                                                                {dateTime.time}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            <Box sx={{
                                                mt: 2,
                                                p: 2,
                                                backgroundColor: alpha(COLORS.WARNING[100], 0.5),
                                                borderRadius: 2,
                                                border: `1px solid ${alpha(COLORS.WARNING[300], 0.3)}`
                                            }}>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocationOn sx={{ fontSize: 16 }} />
                                                    <strong>Địa điểm:</strong> Pet Cafe - 123 Nguyễn Văn Linh, Q.7, TP.HCM
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Pet & Customer Information */}
                                    <Card sx={{
                                        border: `2px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`,
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                            ${alpha(COLORS.SECONDARY[50], 0.8)} 100%
                                        )`
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{
                                                mb: 3,
                                                color: COLORS.SECONDARY[700],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <Person />
                                                Thông tin khách hàng & thú cưng
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                        <Avatar sx={{
                                                            backgroundColor: COLORS.SECONDARY[500],
                                                            color: 'white',
                                                            width: 50,
                                                            height: 50
                                                        }}>
                                                            {booking.pet?.name?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {booking.pet?.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {booking.pet?.breed} • {booking.pet?.age} tuổi • {booking.pet?.gender}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Stack spacing={1}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Person sx={{ fontSize: 16, color: COLORS.SECONDARY[500] }} />
                                                            <Typography variant="body2">
                                                                <strong>{booking.customerInfo?.name}</strong>
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Phone sx={{ fontSize: 16, color: COLORS.SECONDARY[500] }} />
                                                            <Typography variant="body2">
                                                                {booking.customerInfo?.phone}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Email sx={{ fontSize: 16, color: COLORS.SECONDARY[500] }} />
                                                            <Typography variant="body2">
                                                                {booking.customerInfo?.email}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Grid>
                                            </Grid>

                                            {booking.notes && (
                                                <Box sx={{
                                                    mt: 2,
                                                    p: 2,
                                                    backgroundColor: alpha(COLORS.SECONDARY[100], 0.3),
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha(COLORS.SECONDARY[300], 0.3)}`
                                                }}>
                                                    <Typography variant="body2">
                                                        <strong>Ghi chú:</strong> {booking.notes}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Stack>
                            </Grid>

                            {/* Right Column - Payment & Actions */}
                            <Grid item xs={12} md={4}>
                                <Stack spacing={3}>
                                    {/* Payment Summary */}
                                    <Card sx={{
                                        border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                            ${alpha(COLORS.ERROR[50], 0.8)} 100%
                                        )`
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{
                                                mb: 3,
                                                color: COLORS.ERROR[700],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <AttachMoney />
                                                Thanh toán
                                            </Typography>

                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">
                                                        Giá dịch vụ:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {formatPrice(booking.service?.price || 0)}
                                                    </Typography>
                                                </Box>

                                                {booking.finalPrice > booking.service?.price && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Phụ phí:
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            +{formatPrice((booking.finalPrice || 0) - (booking.service?.price || 0))}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Divider />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Tổng cộng:
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.ERROR[600] }}>
                                                        {formatPrice(booking.finalPrice || 0)}
                                                    </Typography>
                                                </Box>

                                                {booking.paymentStatus === 'paid' ? (
                                                    <Chip
                                                        label="Đã thanh toán"
                                                        color="success"
                                                        sx={{ fontWeight: 'bold', '& .MuiChip-label': { px: 2 } }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Chưa thanh toán"
                                                        color="warning"
                                                        sx={{ fontWeight: 'bold', '& .MuiChip-label': { px: 2 } }}
                                                    />
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {/* Status */}
                                    <Card sx={{ border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.3)}` }}>
                                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                            <CheckCircle sx={{ fontSize: 40, color: COLORS.SUCCESS[500], mb: 1 }} />
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: COLORS.SUCCESS[700] }}>
                                                {booking.status === 'completed' ? 'Đã hoàn thành' : booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Đang chờ'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {booking.status === 'completed' ? 'Dịch vụ đã được hoàn thành. Cảm ơn bạn đã sử dụng!' : booking.status === 'confirmed' ? 'Lịch hẹn đã được xác nhận.' : 'Chúng tôi sẽ liên hệ sớm để xác nhận lịch hẹn.'}
                                            </Typography>
                                        </CardContent>
                                    </Card>

                                    {/* Action Buttons */}
                                    <Stack spacing={2}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Print />}
                                            onClick={handlePrint}
                                            sx={{
                                                py: 1.5,
                                                borderColor: COLORS.INFO[400],
                                                color: COLORS.INFO[600],
                                                '&:hover': {
                                                    borderColor: COLORS.INFO[500],
                                                    backgroundColor: alpha(COLORS.INFO[100], 0.8)
                                                }
                                            }}
                                        >
                                            In phiếu đặt lịch
                                        </Button>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Share />}
                                            onClick={handleShare}
                                            sx={{
                                                py: 1.5,
                                                borderColor: COLORS.SECONDARY[400],
                                                color: COLORS.SECONDARY[600],
                                                '&:hover': {
                                                    borderColor: COLORS.SECONDARY[500],
                                                    backgroundColor: alpha(COLORS.SECONDARY[100], 0.8)
                                                }
                                            }}
                                        >
                                            Chia sẻ
                                        </Button>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Feedback />}
                                            onClick={onFeedback}
                                            sx={{
                                                py: 1.5,
                                                borderColor: COLORS.WARNING[400],
                                                color: COLORS.WARNING[600],
                                                '&:hover': {
                                                    borderColor: COLORS.WARNING[500],
                                                    backgroundColor: alpha(COLORS.WARNING[100], 0.8)
                                                }
                                            }}
                                        >
                                            Đánh giá dịch vụ
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
                {onBackToPage && (
                    <Button
                        variant="outlined"
                        onClick={onBackToPage}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderColor: COLORS.INFO[400],
                            color: COLORS.INFO[600],
                            '&:hover': {
                                borderColor: COLORS.INFO[500],
                                backgroundColor: alpha(COLORS.INFO[100], 0.8)
                            }
                        }}
                    >
                        Quay về trang đặt dịch vụ
                    </Button>
                )}
                {booking.status === 'completed' && (
                    <Button
                        variant="outlined"
                        startIcon={<BookmarkAdd />}
                        onClick={onFeedback}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderColor: COLORS.WARNING[400],
                            color: COLORS.WARNING[600],
                            '&:hover': {
                                borderColor: COLORS.WARNING[500],
                                backgroundColor: alpha(COLORS.WARNING[100], 0.8)
                            }
                        }}
                    >
                        Đánh giá dịch vụ
                    </Button>
                )}
                <Button
                    variant="contained"
                    startIcon={<Home />}
                    onClick={onNewBooking}
                    sx={{
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(135deg, 
                            ${COLORS.ERROR[500]} 0%, 
                            ${COLORS.ERROR[600]} 100%
                        )`,
                        '&:hover': {
                            background: `linear-gradient(135deg, 
                                ${COLORS.ERROR[600]} 0%, 
                                ${COLORS.ERROR[700]} 100%
                            )`
                        }
                    }}
                >
                    Đặt lịch mới
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingConfirmation;