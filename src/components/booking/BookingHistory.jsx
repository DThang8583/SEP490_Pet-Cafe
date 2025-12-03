import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, Button,
    Chip, Stack, TextField, InputAdornment, FormControl, InputLabel,
    Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, Pagination, Fade, alpha, Avatar, Divider
} from '@mui/material';
import {
    Search, FilterList, Schedule, Pets, Star, AttachMoney,
    Visibility, Cancel, Refresh, Feedback, CalendarToday,
    AccessTime, LocationOn, Person, CheckCircle, Warning,
    Error as ErrorIcon, Pending
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { feedbackApi } from '../../api/feedbackApi';
import { bookingApi } from '../../api/bookingApi';
import Loading from '../loading/Loading';
import FeedbackModal from './FeedbackModal';
import AlertModal from '../modals/AlertModal';

const BookingHistory = ({ open, onClose }) => {
    // State management
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    const itemsPerPage = 6;

    // Load booking history
    useEffect(() => {
        if (open) {
            loadBookingHistory();
        }
    }, [open]);

    // Filter bookings when search term or filters change
    useEffect(() => {
        filterBookings();
    }, [bookings, searchTerm, statusFilter, dateFilter]);

    const loadBookingHistory = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get current user from localStorage
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) {
                setError('Chưa đăng nhập');
                setLoading(false);
                return;
            }
            
            const currentUser = JSON.parse(currentUserStr);
            const customerId = currentUser.id;
            
            if (!customerId) {
                setError('Không tìm thấy thông tin khách hàng');
                setLoading(false);
                return;
            }
            
            // Get auth token
            const token = localStorage.getItem('authToken');
            
            // Call API to get bookings
            const response = await fetch(
                `https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/customers/${customerId}/bookings`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                }
            );
            
            const rawText = await response.text();
            let jsonData = null;
            
            try {
                jsonData = JSON.parse(rawText);
            } catch (e) {
                console.error('Error parsing response:', e);
                throw new Error('Phản hồi từ server không hợp lệ');
            }
            
            if (!response.ok) {
                const errorMsg = jsonData?.message || jsonData?.error || 'Không thể tải lịch sử đặt lịch';
                throw new Error(errorMsg);
            }
            
            // Parse response data
            const bookingsData = jsonData?.data || jsonData || [];
            
            // Map API response to component format
            const mappedBookings = Array.isArray(bookingsData) ? bookingsData.map(booking => {
                // Map from API response format to component format
                return {
                    id: booking.id || booking.booking_id,
                    service: {
                        id: booking.service_id || booking.service?.id,
                        name: booking.service_name || booking.service?.name || 'Dịch vụ không xác định',
                        description: booking.service?.description,
                        base_price: booking.service?.base_price || booking.price || 0
                    },
                    pet: booking.pet ? {
                        id: booking.pet.id || booking.pet_id,
                        name: booking.pet.name || booking.pet_name
                    } : null,
                    bookingDateTime: booking.booking_date || booking.bookingDateTime || booking.created_at,
                    finalPrice: booking.final_amount || booking.total_amount || booking.price || 0,
                    status: booking.status?.toLowerCase() || 'pending',
                    notes: booking.notes || '',
                    feedback: booking.feedback ? {
                        overallRating: booking.feedback.overall_rating || booking.feedback.rating || 0,
                        comment: booking.feedback.comment || booking.feedback.feedback_text || ''
                    } : null,
                    slot: booking.slot,
                    payment_status: booking.payment_status,
                    payment_method: booking.payment_method,
                    // Keep original data for reference
                    ...booking
                };
            }) : [];
            
            setBookings(mappedBookings);
        } catch (err) {
            console.error('[BookingHistory] Error loading bookings:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(booking =>
                booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(booking => booking.status === statusFilter);
        }

        // Date filter
        const now = new Date();
        if (dateFilter === 'this_month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(booking =>
                new Date(booking.bookingDateTime) >= startOfMonth
            );
        } else if (dateFilter === 'last_month') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.bookingDateTime);
                return bookingDate >= startOfLastMonth && bookingDate <= endOfLastMonth;
            });
        } else if (dateFilter === 'last_3_months') {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            filtered = filtered.filter(booking =>
                new Date(booking.bookingDateTime) >= threeMonthsAgo
            );
        }

        setFilteredBookings(filtered);
        setCurrentPage(1);
    };

    // Get status info
    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Chờ xác nhận',
                    color: 'warning',
                    icon: <Pending />,
                    bgColor: COLORS.WARNING[100],
                    textColor: COLORS.WARNING[700]
                };
            case 'confirmed':
                return {
                    label: 'Đã xác nhận',
                    color: 'info',
                    icon: <CheckCircle />,
                    bgColor: COLORS.INFO[100],
                    textColor: COLORS.INFO[700]
                };
            case 'in_progress':
                return {
                    label: 'Đang thực hiện',
                    color: 'primary',
                    icon: <Schedule />,
                    bgColor: COLORS.PRIMARY[100],
                    textColor: COLORS.PRIMARY[700]
                };
            case 'completed':
                return {
                    label: 'Hoàn thành',
                    color: 'success',
                    icon: <CheckCircle />,
                    bgColor: COLORS.SUCCESS[100],
                    textColor: COLORS.SUCCESS[700]
                };
            case 'cancelled':
                return {
                    label: 'Đã hủy',
                    color: 'error',
                    icon: <Cancel />,
                    bgColor: COLORS.ERROR[100],
                    textColor: COLORS.ERROR[700]
                };
            default:
                return {
                    label: 'Không xác định',
                    color: 'default',
                    icon: <ErrorIcon />,
                    bgColor: COLORS.GRAY[100],
                    textColor: COLORS.GRAY[700]
                };
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Format date and time
    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString('vi-VN'),
            time: date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' })
        };
    };

    // Handle cancel booking
    const handleCancelBooking = (bookingId) => {
        setBookingToCancel(bookingId);
        setConfirmCancel(true);
    };

    const confirmCancelBooking = async () => {
        try {
            setActionLoading(true);
            const response = await bookingApi.cancelBooking(bookingToCancel, 'Khách hàng hủy');

            if (response.success) {
                await loadBookingHistory();
                setShowDetails(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Hủy lịch hẹn thành công!',
                    type: 'success'
                });
            }
        } catch (err) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: err.message || 'Có lỗi xảy ra khi hủy lịch hẹn',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
            setConfirmCancel(false);
            setBookingToCancel(null);
        }
    };

    // Handle feedback submission
    const handleFeedbackSubmit = async (feedbackData) => {
        try {
            const response = await feedbackApi.submitFeedback(feedbackData);

            if (response.success) {
                await loadBookingHistory();
                setShowFeedback(false);
            }
        } catch (err) {
            throw new Error(err.message || 'Có lỗi xảy ra khi gửi phản hồi');
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    maxHeight: '90vh',
                    background: `linear-gradient(135deg, 
                        ${COLORS.BACKGROUND.DEFAULT} 0%, 
                        ${alpha(COLORS.PRIMARY[50], 0.8)} 100%
                    )`
                }
            }}
        >
            <DialogTitle sx={{
                background: `linear-gradient(135deg, 
                    ${COLORS.PRIMARY[500]} 0%, 
                    ${COLORS.PRIMARY[600]} 100%
                )`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Schedule />
                    <Typography variant="h6" fontWeight="bold">
                        Lịch sử đặt lịch
                    </Typography>
                </Box>
                <Button
                    onClick={onClose}
                    sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                >
                    ×
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ p: 4 }}>
                        <Loading />
                    </Box>
                ) : (
                    <Box sx={{ p: 4 }}>
                        {/* Filters */}
                        <Box sx={{ mb: 4 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        placeholder="Tìm kiếm theo dịch vụ, thú cưng..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Trạng thái</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            label="Trạng thái"
                                            sx={{ borderRadius: 3 }}
                                        >
                                            <MenuItem value="all">Tất cả</MenuItem>
                                            <MenuItem value="pending">Chờ xác nhận</MenuItem>
                                            <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                                            <MenuItem value="in_progress">Đang thực hiện</MenuItem>
                                            <MenuItem value="completed">Hoàn thành</MenuItem>
                                            <MenuItem value="cancelled">Đã hủy</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Thời gian</InputLabel>
                                        <Select
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            label="Thời gian"
                                            sx={{ borderRadius: 3 }}
                                        >
                                            <MenuItem value="all">Tất cả</MenuItem>
                                            <MenuItem value="this_month">Tháng này</MenuItem>
                                            <MenuItem value="last_month">Tháng trước</MenuItem>
                                            <MenuItem value="last_3_months">3 tháng gần đây</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Refresh />}
                                        onClick={loadBookingHistory}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 3,
                                            borderColor: COLORS.PRIMARY[400],
                                            color: COLORS.PRIMARY[600]
                                        }}
                                    >
                                        Làm mới
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Results Summary */}
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body1" color="text.secondary">
                                Tìm thấy <strong>{filteredBookings.length}</strong> lịch hẹn
                            </Typography>
                            <Chip
                                icon={<FilterList />}
                                label={`Trang ${currentPage}/${totalPages}`}
                                variant="outlined"
                                sx={{ borderColor: COLORS.PRIMARY[300] }}
                            />
                        </Box>

                        {/* Booking Cards */}
                        {currentBookings.length === 0 ? (
                            <Box sx={{
                                textAlign: 'center',
                                py: 8,
                                background: `linear-gradient(135deg, 
                                    ${alpha(COLORS.GRAY[100], 0.8)} 0%, 
                                    ${alpha(COLORS.GRAY[50], 0.6)} 100%
                                )`,
                                borderRadius: 4,
                                border: `2px dashed ${alpha(COLORS.GRAY[300], 0.5)}`
                            }}>
                                <Schedule sx={{ fontSize: 60, color: COLORS.GRAY[400], mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                    Không tìm thấy lịch hẹn nào
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Thử thay đổi bộ lọc hoặc tạo lịch hẹn mới
                                </Typography>
                            </Box>
                        ) : (
                            <Fade in timeout={500}>
                                <Grid container spacing={3}>
                                    {currentBookings.map((booking) => {
                                        const statusInfo = getStatusInfo(booking.status);
                                        const dateTime = formatDateTime(booking.bookingDateTime);

                                        return (
                                            <Grid item xs={12} md={6} key={booking.id}>
                                                <Card sx={{
                                                    border: `2px solid ${alpha(statusInfo.bgColor, 0.3)}`,
                                                    borderRadius: 4,
                                                    background: `linear-gradient(135deg, 
                                                        ${COLORS.BACKGROUND.DEFAULT} 0%, 
                                                        ${alpha(statusInfo.bgColor, 0.1)} 100%
                                                    )`,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: `0 8px 25px ${alpha(statusInfo.bgColor, 0.3)}`
                                                    }
                                                }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        {/* Header */}
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                                                                    {booking.service?.name}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                    <Avatar sx={{
                                                                        width: 24,
                                                                        height: 24,
                                                                        backgroundColor: COLORS.SECONDARY[500],
                                                                        fontSize: '0.8rem'
                                                                    }}>
                                                                        {booking.pet?.name?.charAt(0)}
                                                                    </Avatar>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {booking.pet?.name}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Chip
                                                                icon={statusInfo.icon}
                                                                label={statusInfo.label}
                                                                sx={{
                                                                    backgroundColor: statusInfo.bgColor,
                                                                    color: statusInfo.textColor,
                                                                    fontWeight: 'bold',
                                                                    '& .MuiChip-icon': {
                                                                        color: statusInfo.textColor
                                                                    }
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Date & Time */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarToday sx={{ fontSize: 16, color: COLORS.INFO[500] }} />
                                                                <Typography variant="body2">
                                                                    {dateTime.date}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AccessTime sx={{ fontSize: 16, color: COLORS.INFO[500] }} />
                                                                <Typography variant="body2">
                                                                    {dateTime.time}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Price */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AttachMoney sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                                <Typography variant="body1" fontWeight="bold" sx={{ color: COLORS.ERROR[600] }}>
                                                                    {formatPrice(booking.finalPrice)}
                                                                </Typography>
                                                            </Box>
                                                            {booking.feedback && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Star sx={{ fontSize: 16, color: COLORS.WARNING[500] }} />
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {booking.feedback.overallRating}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>

                                                        {/* Actions */}
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<Visibility />}
                                                                onClick={() => {
                                                                    setSelectedBooking(booking);
                                                                    setShowDetails(true);
                                                                }}
                                                                sx={{
                                                                    borderColor: COLORS.INFO[300],
                                                                    color: COLORS.INFO[600],
                                                                    '&:hover': {
                                                                        borderColor: COLORS.INFO[400],
                                                                        backgroundColor: alpha(COLORS.INFO[100], 0.8)
                                                                    }
                                                                }}
                                                            >
                                                                Chi tiết
                                                            </Button>

                                                            {booking.status === 'completed' && !booking.feedback && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<Feedback />}
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setShowFeedback(true);
                                                                    }}
                                                                    sx={{
                                                                        borderColor: COLORS.WARNING[300],
                                                                        color: COLORS.WARNING[600],
                                                                        '&:hover': {
                                                                            borderColor: COLORS.WARNING[400],
                                                                            backgroundColor: alpha(COLORS.WARNING[100], 0.8)
                                                                        }
                                                                    }}
                                                                >
                                                                    Đánh giá
                                                                </Button>
                                                            )}

                                                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<Cancel />}
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    disabled={actionLoading}
                                                                    sx={{
                                                                        borderColor: COLORS.ERROR[300],
                                                                        color: COLORS.ERROR[600],
                                                                        '&:hover': {
                                                                            borderColor: COLORS.ERROR[400],
                                                                            backgroundColor: alpha(COLORS.ERROR[100], 0.8)
                                                                        }
                                                                    }}
                                                                >
                                                                    Hủy
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Fade>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, page) => setCurrentPage(page)}
                                    color="primary"
                                    size="large"
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Booking Details Dialog */}
            {showDetails && selectedBooking && (
                <Dialog
                    open={showDetails}
                    onClose={() => setShowDetails(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Chi tiết lịch hẹn
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Dịch vụ
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                        {selectedBooking.service?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Thú cưng
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                        {selectedBooking.pet?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Ngày giờ
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                        {formatDateTime(selectedBooking.bookingDateTime).date} lúc {formatDateTime(selectedBooking.bookingDateTime).time}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Giá tiền
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                        {formatPrice(selectedBooking.finalPrice)}
                                    </Typography>
                                </Grid>
                                {selectedBooking.notes && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Ghi chú
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            {selectedBooking.notes}
                                        </Typography>
                                    </Grid>
                                )}
                                {selectedBooking.feedback && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Đánh giá
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Star sx={{ color: COLORS.WARNING[500] }} />
                                            <Typography variant="body1" fontWeight="bold">
                                                {selectedBooking.feedback.overallRating}/5
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2">
                                            {selectedBooking.feedback.comment}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDetails(false)}>
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Feedback Modal */}
            {showFeedback && selectedBooking && (
                <FeedbackModal
                    open={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    booking={selectedBooking}
                    onSubmit={handleFeedbackSubmit}
                />
            )}

            {/* Confirm Cancel Dialog */}
            <Dialog
                open={confirmCancel}
                onClose={() => setConfirmCancel(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Xác nhận hủy lịch hẹn</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn hủy lịch hẹn này?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setConfirmCancel(false)}
                        disabled={actionLoading}
                    >
                        Không
                    </Button>
                    <Button
                        onClick={confirmCancelBooking}
                        variant="contained"
                        color="error"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Hủy lịch hẹn'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Dialog>
    );
};

export default BookingHistory;
