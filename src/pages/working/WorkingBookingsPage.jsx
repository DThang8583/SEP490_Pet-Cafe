import React, { useEffect, useState, useMemo } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Snackbar, Alert, Skeleton, InputAdornment, TableContainer } from '@mui/material';
import { ReceiptLong, Phone, CalendarToday, Search, FilterList, AccessTime } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { getBookings, updateBooking } from '../../api/bookingApi';
import { COLORS } from '../../constants/colors';
import Pagination from '../../components/common/Pagination';

const BOOKING_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' }
];

const getStatusColor = (status) => {
    switch (status) {
        case 'PENDING':
            return COLORS.WARNING[500];
        case 'CONFIRMED':
            return COLORS.INFO[500];
        case 'IN_PROGRESS':
            return COLORS.PRIMARY[500];
        case 'COMPLETED':
            return COLORS.SUCCESS[500];
        case 'CANCELLED':
            return COLORS.ERROR[500];
        default:
            return COLORS.GRAY[500];
    }
};

const getStatusLabel = (status) => {
    const option = BOOKING_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
};

const formatDateTime = (dateTime) => {
    if (!dateTime) return '--';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatTime = (time) => {
    if (!time) return '--';
    return time.substring(0, 5); // HH:mm
};

const WorkingBookingsPage = () => {
    const profile = workingStaffApi.getProfile();
    const isLeader = profile?.leader || false;
    const [teams, setTeams] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState(null);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    // Filters
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [bookingStatus, setBookingStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({
        total_items_count: 0,
        page_size: 10,
        total_pages_count: 0,
        page_index: 0,
        has_next: false,
        has_previous: false
    });

    // Load teams
    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                if (mounted) {
                    setTeams(data);
                    // Auto-select first team if available
                    if (data.length > 0 && !selectedTeamId) {
                        setSelectedTeamId(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load teams', error);
                if (mounted) {
                    setSnackbar({ message: 'Không thể tải danh sách nhóm', severity: 'error' });
                }
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load bookings
    useEffect(() => {
        if (!selectedTeamId) {
            setBookings([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        const loadBookings = async () => {
            setLoading(true);
            try {
                const params = {
                    team_id: selectedTeamId,
                    page,
                    limit
                };

                if (bookingStatus) params.booking_status = bookingStatus;
                if (fromDate) params.from_date = fromDate;
                if (toDate) params.to_date = toDate;

                const response = await getBookings(params);
                if (mounted) {
                    setBookings(response.data || []);
                    setPagination(response.pagination || {
                        total_items_count: 0,
                        page_size: limit,
                        total_pages_count: 0,
                        page_index: page - 1,
                        has_next: false,
                        has_previous: false
                    });
                }
            } catch (error) {
                console.error('Failed to load bookings', error);
                if (mounted) {
                    setSnackbar({
                        message: error.message || 'Không thể tải danh sách booking',
                        severity: 'error'
                    });
                    setBookings([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadBookings();
        return () => {
            mounted = false;
        };
    }, [selectedTeamId, bookingStatus, fromDate, toDate, page, limit]);

    // Check if user is leader of the team for a booking
    const isLeaderOfTeam = (booking) => {
        if (!isLeader) return false;
        if (!booking.team_id) return false;

        // Check if user is leader of this team
        const team = teams.find(t => t.id === booking.team_id);
        if (!team) return false;

        const profileId = profile.id || profile.employee_id || profile.account_id;
        const teamLeaderId = team.leader_id || team.leader?.id || team.leader?.account_id;

        return profileId === teamLeaderId;
    };

    // Handle booking status update
    const handleStatusChange = async (bookingId, newStatus) => {
        setUpdatingBookingId(bookingId);
        try {
            await updateBooking(bookingId, { booking_status: newStatus });

            // Update local state
            setBookings(prev => prev.map(booking =>
                booking.id === bookingId
                    ? { ...booking, booking_status: newStatus }
                    : booking
            ));

            setSnackbar({
                message: 'Cập nhật trạng thái booking thành công',
                severity: 'success'
            });
        } catch (error) {
            console.error('Failed to update booking status:', error);
            setSnackbar({
                message: error.message || 'Không thể cập nhật trạng thái booking',
                severity: 'error'
            });
        } finally {
            setUpdatingBookingId(null);
        }
    };

    // Filter bookings by search query
    const filteredBookings = useMemo(() => {
        if (!searchQuery.trim()) return bookings;

        const query = searchQuery.toLowerCase();
        return bookings.filter(booking => {
            const serviceName = booking.service?.name?.toLowerCase() || '';
            const customerName = booking.customer?.full_name?.toLowerCase() || '';
            const notes = booking.notes?.toLowerCase() || '';
            const teamName = booking.team?.name?.toLowerCase() || '';

            return serviceName.includes(query) ||
                customerName.includes(query) ||
                notes.includes(query) ||
                teamName.includes(query);
        });
    }, [bookings, searchQuery]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    // Get status options for dropdown (exclude "Tất cả")
    const statusOptionsForEdit = useMemo(() => {
        return BOOKING_STATUS_OPTIONS.filter(opt => opt.value !== '');
    }, []);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh' }}>
            <Stack spacing={3}>
                {/* Header */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <ReceiptLong sx={{ color: COLORS.PRIMARY[500], fontSize: 40 }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Xem Booking
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Xem các booking của các team mà bạn thuộc về
                        </Typography>
                    </Box>
                </Stack>

                {/* Filters */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FilterList sx={{ color: COLORS.PRIMARY[500] }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Bộ lọc
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Nhóm"
                                    value={selectedTeamId}
                                    onChange={(e) => {
                                        setSelectedTeamId(e.target.value);
                                        setPage(1);
                                    }}
                                    required
                                >
                                    {teams.map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.name}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    fullWidth
                                    select
                                    label="Trạng thái"
                                    value={bookingStatus}
                                    onChange={(e) => {
                                        setBookingStatus(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    {BOOKING_STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Từ ngày"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setPage(1);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Đến ngày"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPage(1);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>

                            <TextField
                                fullWidth
                                placeholder="Tìm kiếm theo dịch vụ, khách hàng, ghi chú..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Stack>
                    </Stack>
                </Paper>

                {/* Bookings Table */}
                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <Skeleton variant="rounded" height={400} />
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: COLORS.PRIMARY[50] }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Dịch vụ</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Nhóm</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                                            {isLeader && (
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>Hành động</TableCell>
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredBookings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={isLeader ? 7 : 6} align="center" sx={{ py: 6, color: COLORS.TEXT.SECONDARY }}>
                                                    {selectedTeamId ? 'Không có booking nào cho nhóm này.' : 'Vui lòng chọn nhóm để xem booking.'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredBookings.map((booking) => {
                                                const canEdit = isLeaderOfTeam(booking);
                                                return (
                                                    <TableRow key={booking.id} hover>
                                                        <TableCell>
                                                            <Stack spacing={0.5}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                    {booking.service?.name || '--'}
                                                                </Typography>
                                                                {booking.service?.description && (
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                        {booking.service.description.substring(0, 50)}...
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack spacing={0.5}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                    {booking.customer?.full_name || '--'}
                                                                </Typography>
                                                                {booking.customer?.phone && (
                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                        <Phone fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                            {booking.customer.phone}
                                                                        </Typography>
                                                                    </Stack>
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack spacing={0.5}>
                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                    <CalendarToday fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                                    <Typography variant="body2">
                                                                        {formatDateTime(booking.booking_date)}
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                    <AccessTime fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {booking.team?.name || '--'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={getStatusLabel(booking.booking_status)}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: getStatusColor(booking.booking_status),
                                                                    color: 'white',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                {booking.notes || '--'}
                                                            </Typography>
                                                        </TableCell>
                                                        {isLeader && (
                                                            <TableCell align="center">
                                                                {canEdit ? (
                                                                    <TextField
                                                                        select
                                                                        size="small"
                                                                        value={booking.booking_status}
                                                                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                                        disabled={updatingBookingId === booking.id}
                                                                        sx={{ minWidth: 150 }}
                                                                    >
                                                                        {statusOptionsForEdit.map((option) => (
                                                                            <MenuItem key={option.value} value={option.value}>
                                                                                {option.label}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </TextField>
                                                                ) : (
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                        --
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {pagination.total_items_count > 0 && (
                                <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={pagination.total_pages_count}
                                        itemsPerPage={limit}
                                        totalItems={pagination.total_items_count}
                                        onPageChange={handlePageChange}
                                        onItemsPerPageChange={handleLimitChange}
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            </Stack>

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default WorkingBookingsPage;

