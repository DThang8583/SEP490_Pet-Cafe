import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button,
    Chip, Stack, TextField, InputAdornment, FormControl, InputLabel,
    Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, Pagination, Fade, alpha, Avatar, Divider,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper
} from '@mui/material';
import {
    Search, FilterList, Schedule, Pets, Star,
    Visibility, Cancel, Refresh, Feedback, CalendarToday,
    AccessTime, LocationOn, Person, CheckCircle, Warning,
    Error as ErrorIcon, Pending, Group, Image as ImageIcon, Note
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { bookingApi } from '../../api/bookingApi';
import { authApi } from '../../api/authApi';
import Loading from '../loading/Loading';
import AlertModal from '../modals/AlertModal';
import FeedbackModal from './FeedbackModal';

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
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackBooking, setFeedbackBooking] = useState(null);

    const itemsPerPage = 10;

    // Load booking history when modal opens or filters change
    useEffect(() => {
        if (open) {
            loadBookingHistory();
        }
    }, [open, statusFilter, dateFilter]);

    // Filter bookings when search term changes (client-side filtering)
    useEffect(() => {
        filterBookings();
    }, [bookings, searchTerm]);

    const loadBookingHistory = async () => {
        try {
            setLoading(true);
            setError('');

            // Build filters for API
            const filters = {};
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }
            if (dateFilter === 'this_month') {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                filters.dateFrom = startOfMonth.toISOString().split('T')[0];
            } else if (dateFilter === 'last_month') {
                const now = new Date();
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                filters.dateFrom = startOfLastMonth.toISOString().split('T')[0];
                filters.dateTo = endOfLastMonth.toISOString().split('T')[0];
            } else if (dateFilter === 'last_3_months') {
                const now = new Date();
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                filters.dateFrom = threeMonthsAgo.toISOString().split('T')[0];
            }

            console.log('[BookingHistory] Loading bookings with filters:', filters);
            const res = await bookingApi.getMyBookings(filters);
            console.log('[BookingHistory] API response:', res);

            if (res.success) {
                console.log('[BookingHistory] Loaded bookings:', res.data);
                console.log('[BookingHistory] Bookings count:', res.data?.length || 0);
                console.log('[BookingHistory] Is array?', Array.isArray(res.data));
                setBookings(res.data || []);
            } else {
                console.error('[BookingHistory] API returned success=false');
                setError('Không thể tải lịch sử đặt lịch');
                setBookings([]);
            }
        } catch (err) {
            console.error('[BookingHistory] Error loading bookings:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Search filter (client-side only)
        if (searchTerm) {
            filtered = filtered.filter(booking =>
                booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.pet_group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.area?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredBookings(filtered);
        setCurrentPage(1);
    };

    // Get status info
    const getStatusInfo = (status) => {
        const statusUpper = (status || '').toUpperCase();
        switch (statusUpper) {
            case 'PENDING':
                return {
                    label: 'Chờ xác nhận',
                    color: 'warning',
                    icon: <Pending />,
                    bgColor: COLORS.WARNING[100],
                    textColor: COLORS.WARNING[700]
                };
            case 'CONFIRMED':
                return {
                    label: 'Đã xác nhận',
                    color: 'info',
                    icon: <CheckCircle />,
                    bgColor: COLORS.INFO[100],
                    textColor: COLORS.INFO[700]
                };
            case 'IN_PROGRESS':
                return {
                    label: 'Đang thực hiện',
                    color: 'primary',
                    icon: <Schedule />,
                    bgColor: COLORS.PRIMARY[100],
                    textColor: COLORS.PRIMARY[700]
                };
            case 'COMPLETED':
                return {
                    label: 'Hoàn thành',
                    color: 'success',
                    icon: <CheckCircle />,
                    bgColor: COLORS.SUCCESS[100],
                    textColor: COLORS.SUCCESS[700]
                };
            case 'CANCELLED':
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

    // Format price (show VNĐ)
    const formatPrice = (price) => {
        const num = Number(price || 0);
        if (Number.isNaN(num)) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + ' VNĐ';
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        let date;
        if (dateStr.includes('T')) {
            date = new Date(dateStr);
        } else {
            const [year, month, day] = dateStr.split('-').map(Number);
            date = new Date(year, month - 1, day);
        }
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Tìm kiếm theo dịch vụ, nhóm thú cưng..."
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
                                <Grid size={{ xs: 12, md: 3 }}>
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
                                <Grid size={{ xs: 12, md: 3 }}>
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
                                <Grid size={{ xs: 12, md: 2 }}>
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
                                {bookings.length !== filteredBookings.length && (
                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: COLORS.GRAY[500] }}>
                                        (Tổng: {bookings.length})
                                    </Typography>
                                )}
                            </Typography>
                            <Chip
                                icon={<FilterList />}
                                label={`Trang ${currentPage}/${totalPages || 1}`}
                                variant="outlined"
                                sx={{ borderColor: COLORS.PRIMARY[300] }}
                            />
                        </Box>

                        {/* Booking Table */}
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
                                <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ '& th': { backgroundColor: alpha(COLORS.INFO[50], 0.8), fontWeight: 700 } }}>
                                                <TableCell>Dịch vụ</TableCell>
                                                <TableCell>Ngày đặt</TableCell>
                                                <TableCell>Thời gian slot</TableCell>
                                                <TableCell>Trạng thái</TableCell>
                                                <TableCell align="right">Hành động</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentBookings.map((booking) => {
                                                const statusInfo = getStatusInfo(booking.booking_status || booking.status);
                                                const bookingStatus = (booking.booking_status || booking.status || '').toUpperCase();
                                                const isCompleted = bookingStatus === 'COMPLETED';

                                                return (
                                                    <TableRow
                                                        key={booking.id}
                                                        hover
                                                        sx={{
                                                            '&:nth-of-type(odd)': { backgroundColor: alpha(COLORS.GRAY[50], 0.3) },
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.3)
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowDetails(true);
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                {booking.service?.image_url ? (
                                                                    <Avatar
                                                                        src={booking.service.image_url}
                                                                        variant="rounded"
                                                                        sx={{ width: 48, height: 48 }}
                                                                    >
                                                                        <ImageIcon />
                                                                    </Avatar>
                                                                ) : (
                                                                    <Avatar
                                                                        variant="rounded"
                                                                        sx={{
                                                                            width: 48,
                                                                            height: 48,
                                                                            bgcolor: COLORS.PRIMARY[100],
                                                                            color: COLORS.PRIMARY[700]
                                                                        }}
                                                                    >
                                                                        <Schedule />
                                                                    </Avatar>
                                                                )}
                                                                <Box>
                                                                    <Typography variant="body1" fontWeight={600}>
                                                                        {booking.service?.name || 'Dịch vụ không xác định'}
                                                                    </Typography>
                                                                    {booking.pet_group && (
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                                            <Pets sx={{ fontSize: 14 }} />
                                                                            {booking.pet_group.name}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            {booking.bookingDateTime && (
                                                                <Typography variant="body2">
                                                                    {formatDate(booking.bookingDateTime)}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {booking.start_time && booking.end_time && (
                                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <AccessTime sx={{ fontSize: 16 }} />
                                                                    {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                icon={statusInfo.icon}
                                                                label={statusInfo.label}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: statusInfo.bgColor,
                                                                    color: statusInfo.textColor,
                                                                    fontWeight: 'bold',
                                                                    '& .MuiChip-icon': {
                                                                        color: statusInfo.textColor
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<Visibility />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
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
                                                                {isCompleted && (
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={<Feedback />}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFeedbackBooking(booking);
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
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
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
                    PaperProps={{
                        sx: { borderRadius: 4 }
                    }}
                >
                    <DialogTitle sx={{
                        background: `linear-gradient(135deg, 
                            ${COLORS.INFO[500]} 0%, 
                            ${COLORS.INFO[600]} 100%
                        )`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Schedule />
                            <Typography variant="h6" fontWeight="bold">
                                Chi tiết lịch hẹn
                            </Typography>
                        </Box>
                        <Button
                            onClick={() => setShowDetails(false)}
                            sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                        >
                            ×
                        </Button>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {/* Service Info */}
                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ p: 2, backgroundColor: alpha(COLORS.PRIMARY[50], 0.3) }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {selectedBooking.service?.image_url && (
                                            <Avatar
                                                src={selectedBooking.service.image_url}
                                                variant="rounded"
                                                sx={{ width: 80, height: 80 }}
                                            />
                                        )}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                                                {selectedBooking.service?.name || 'Dịch vụ không xác định'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedBooking.service?.description}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" fontWeight="bold" sx={{ color: COLORS.ERROR[600] }}>
                                                    {formatPrice(selectedBooking.finalPrice || selectedBooking.service?.base_price || 0)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid>

                            {/* Booking Date */}
                            {selectedBooking.bookingDateTime && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CalendarToday sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Ngày đặt
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {formatDate(selectedBooking.bookingDateTime)}
                                    </Typography>
                                </Grid>
                            )}

                            {/* Slot Time */}
                            {selectedBooking.start_time && selectedBooking.end_time && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccessTime sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Thời gian slot
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedBooking.start_time.substring(0, 5)} - {selectedBooking.end_time.substring(0, 5)}
                                    </Typography>
                                </Grid>
                            )}

                            {/* Pet Group */}
                            {selectedBooking.pet_group && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Pets sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nhóm thú cưng
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedBooking.pet_group.name}
                                    </Typography>
                                    {selectedBooking.pet_group.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {selectedBooking.pet_group.description}
                                        </Typography>
                                    )}
                                </Grid>
                            )}

                            {/* Area */}
                            {selectedBooking.area && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <LocationOn sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Khu vực
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedBooking.area.name}
                                    </Typography>
                                    {selectedBooking.area.location && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {selectedBooking.area.location}
                                        </Typography>
                                    )}
                                </Grid>
                            )}

                            {/* Team */}
                            {selectedBooking.team && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Group sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nhóm phụ trách
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedBooking.team.name}
                                    </Typography>
                                    {selectedBooking.team.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {selectedBooking.team.description}
                                        </Typography>
                                    )}
                                </Grid>
                            )}

                            {/* Status */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <CheckCircle sx={{ fontSize: 20, color: COLORS.INFO[500] }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Trạng thái
                                    </Typography>
                                </Box>
                                <Chip
                                    icon={getStatusInfo(selectedBooking.booking_status || selectedBooking.status).icon}
                                    label={getStatusInfo(selectedBooking.booking_status || selectedBooking.status).label}
                                    sx={{
                                        backgroundColor: getStatusInfo(selectedBooking.booking_status || selectedBooking.status).bgColor,
                                        color: getStatusInfo(selectedBooking.booking_status || selectedBooking.status).textColor,
                                        fontWeight: 'bold'
                                    }}
                                />
                            </Grid>

                            {/* Notes */}
                            {selectedBooking.notes && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                        <Note sx={{ fontSize: 20, color: COLORS.INFO[500], mt: 0.5 }} />
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Ghi chú
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        {selectedBooking.notes}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}` }}>
                        <Button
                            onClick={() => setShowDetails(false)}
                            variant="outlined"
                            sx={{
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: COLORS.GRAY[300],
                                color: COLORS.GRAY[700],
                                '&:hover': {
                                    borderColor: COLORS.GRAY[400],
                                    backgroundColor: alpha(COLORS.GRAY[50], 0.5)
                                }
                            }}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
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

            {/* Feedback Modal */}
            <FeedbackModal
                open={showFeedback}
                onClose={() => {
                    setShowFeedback(false);
                    setFeedbackBooking(null);
                }}
                booking={feedbackBooking}
                onSubmit={async (feedbackData) => {
                    console.log('[BookingHistory] onSubmit called with:', feedbackData);
                    console.log('[BookingHistory] feedbackBooking:', feedbackBooking);
                    
                    try {
                        // Lấy customer_id từ login
                        const currentUser = authApi.getCurrentUser();
                        console.log('[BookingHistory] Current user:', currentUser);
                        
                        const customerId = currentUser?.customer_id || currentUser?.id || null;
                        
                        if (!customerId) {
                            const error = new Error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
                            console.error('[BookingHistory] No customer ID found');
                            throw error;
                        }

                        // Map dữ liệu theo format API yêu cầu
                        const apiPayload = {
                            customer_booking_id: feedbackBooking?.id || '',
                            service_id: feedbackBooking?.service?.id || '',
                            rating: feedbackData.overallRating || 0,
                            comment: feedbackData.comment || ''
                        };

                        console.log('[BookingHistory] Submitting feedback:', apiPayload);
                        console.log('[BookingHistory] Customer ID:', customerId);
                        console.log('[BookingHistory] API URL: https://petcafes.azurewebsites.net/api/feedbacks');

                        const token = localStorage.getItem('authToken');
                        console.log('[BookingHistory] Auth token exists:', !!token);
                        
                        const resp = await fetch('https://petcafes.azurewebsites.net/api/feedbacks', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : '',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(apiPayload)
                        });

                        console.log('[BookingHistory] API Response status:', resp.status);
                        console.log('[BookingHistory] API Response ok:', resp.ok);

                        if (!resp.ok) {
                            const errorText = await resp.text();
                            console.error('[BookingHistory] API Error response:', errorText);
                            
                            let errorData = {};
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (e) {
                                console.error('[BookingHistory] Failed to parse error response as JSON');
                            }
                            
                            // Parse error message từ các field có thể có
                            let errorMessage = errorData?.error || errorData?.detail || errorData?.message;
                            
                            // Nếu errorMessage là object, lấy giá trị đầu tiên
                            if (typeof errorMessage === 'object' && errorMessage !== null) {
                                errorMessage = Object.values(errorMessage)[0] || errorText;
                            }
                            
                            // Nếu vẫn không có, dùng errorText
                            if (!errorMessage || errorMessage === errorText) {
                                errorMessage = errorText || 'Không thể gửi đánh giá';
                            }
                            
                            console.error('[BookingHistory] Error message:', errorMessage);
                            throw new Error(errorMessage);
                        }

                        const result = await resp.json();
                        console.log('[BookingHistory] Feedback submitted successfully:', result);

                        setAlert({
                            open: true,
                            title: 'Thành công',
                            message: 'Cảm ơn bạn đã đánh giá dịch vụ!',
                            type: 'success'
                        });
                    } catch (err) {
                        console.error('[BookingHistory] Feedback submit error:', err);
                        console.error('[BookingHistory] Error stack:', err.stack);
                        
                        // Re-throw error để FeedbackModal có thể catch và hiển thị
                        setAlert({
                            open: true,
                            title: 'Lỗi',
                            message: err.message || 'Có lỗi xảy ra khi gửi đánh giá',
                            type: 'error'
                        });
                        
                        // Throw error để FeedbackModal có thể hiển thị trong modal
                        throw err;
                    }
                }}
            />

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

