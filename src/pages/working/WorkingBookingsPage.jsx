import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Stack,
    TextField,
    MenuItem,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Snackbar,
    Alert,
    Skeleton,
    InputAdornment,
    TableContainer,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Menu,
    ListItemIcon
} from '@mui/material';
import {
    ReceiptLong,
    Phone,
    CalendarToday,
    Search,
    FilterList,
    AccessTime,
    MoreVert,
    Group,
    Note,
    Person,
    Visibility,
    Edit
} from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { getBookings, updateBooking } from '../../api/bookingApi';
import { COLORS } from '../../constants/colors';
import Pagination from '../../components/common/Pagination';
import EditBookingModal from '../../components/modals/EditBookingModal';
import PageTitle from '../../components/common/PageTitle';
import Loading from '../../components/loading/Loading';

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
    const [teams, setTeams] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState(null);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    // Filters
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [bookingStatus, setBookingStatus] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Edit modal state for leaders
    const [editingBooking, setEditingBooking] = useState(null);

    // Chi tiết booking cho mọi thành viên
    const [detailBooking, setDetailBooking] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Action menu (MoreVert) state
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [actionMenuBooking, setActionMenuBooking] = useState(null);

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
                if (selectedServiceId) params.service_id = selectedServiceId;
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
    }, [selectedTeamId, bookingStatus, selectedServiceId, fromDate, toDate, page, limit]);

    // Check if user is leader of any team & specific team
    const profileId = profile.id || profile.employee_id || profile.account_id;

    const isLeaderOfAnyTeam = useMemo(() => {
        if (!profileId || !Array.isArray(teams)) return false;
        return teams.some(team => {
            const teamLeaderId = team.leader_id || team.leader?.id || team.leader?.account_id;
            return teamLeaderId && teamLeaderId === profileId;
        });
    }, [teams, profileId]);

    const isLeaderOfTeam = (booking) => {
        if (!profileId || !booking?.team_id) return false;

        // Check if user is leader of this specific team
        const team = teams.find(t => t.id === booking.team_id);
        if (!team) return false;

        const teamLeaderId = team.leader_id || team.leader?.id || team.leader?.account_id;
        return teamLeaderId && teamLeaderId === profileId;
    };

    // Handle booking status update (and optional notes / cancel_reason)
    const handleStatusChange = async (bookingId, newStatus, notes = '', cancelReason = '') => {
        setUpdatingBookingId(bookingId);
        try {
            await updateBooking(bookingId, {
                booking_status: newStatus,
                notes: notes || '',
                cancel_reason: cancelReason || ''
            });

            // Update local state
            setBookings(prev => prev.map(booking =>
                booking.id === bookingId
                    ? {
                        ...booking,
                        booking_status: newStatus,
                        notes: notes,
                        cancel_reason: cancelReason
                    }
                    : booking
            ));

            setSnackbar({
                message: 'Cập nhật thông tin booking thành công',
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

    // Build service options based on bookings of selected team
    const serviceOptions = useMemo(() => {
        const map = new Map();
        (bookings || []).forEach((booking) => {
            const serviceId = booking.service?.id || booking.service_id;
            const serviceName = booking.service?.name || 'Dịch vụ không xác định';
            if (serviceId && !map.has(serviceId)) {
                map.set(serviceId, serviceName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [bookings]);

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

    // Group filtered bookings by service, then by slot (ngày + khung giờ)
    const groupedBookings = useMemo(() => {
        const map = new Map();
        (filteredBookings || []).forEach((booking) => {
            const serviceId = booking.service?.id || booking.service_id || 'unknown';
            const serviceName = booking.service?.name || 'Dịch vụ khác';
            const serviceDescription = booking.service?.description || '';
            const bookingDate = booking.booking_date || booking.bookingDateTime;
            const start = booking.start_time || '';
            const end = booking.end_time || '';

            const slotKey = `${bookingDate || 'unknown'}_${start}_${end}`;

            if (!map.has(serviceId)) {
                map.set(serviceId, {
                    id: serviceId,
                    name: serviceName,
                    description: serviceDescription,
                    items: [],
                    _slotMap: new Map()
                });
            }

            const group = map.get(serviceId);
            group.items.push(booking);

            if (!group._slotMap.has(slotKey)) {
                // Tạo label slot: "HH:mm - HH:mm, dd/MM/yyyy"
                let dateLabel = '--';
                if (bookingDate) {
                    const d = new Date(bookingDate);
                    dateLabel = d.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
                const timeLabel =
                    start && end
                        ? `${formatTime(start)} - ${formatTime(end)}`
                        : '--';

                group._slotMap.set(slotKey, {
                    key: slotKey,
                    date: bookingDate,
                    start_time: start,
                    end_time: end,
                    label: `${timeLabel} • ${dateLabel}`,
                    items: []
                });
            }

            group._slotMap.get(slotKey).items.push(booking);
        });

        // Chuyển từng group thành object final với mảng slots đã sort
        return Array.from(map.values())
            .map(group => {
                const slots = Array.from(group._slotMap.values()).sort((a, b) => {
                    const da = a.date || '';
                    const db = b.date || '';
                    if (da !== db) return da.localeCompare(db);
                    const sa = a.start_time || '';
                    const sb = b.start_time || '';
                    return sa.localeCompare(sb);
                });

                const { _slotMap, ...rest } = group;
                return {
                    ...rest,
                    slots
                };
            })
            .sort((a, b) =>
                a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
            );
    }, [filteredBookings]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    // Get status options for dropdown (exclude "Tất cả")
    const statusOptionsForEdit = useMemo(
        () => BOOKING_STATUS_OPTIONS.filter(opt => opt.value !== ''),
        []
    );

    const handleOpenEditDialog = (booking) => {
        setEditingBooking(booking);
    };

    const handleCloseEditDialog = () => {
        if (updatingBookingId && editingBooking && updatingBookingId === editingBooking.id) return;
        setEditingBooking(null);
    };

    const handleSaveEditDialog = async ({ status, notes, cancelReason }) => {
        if (!editingBooking) return;
        // Nếu hủy thì cần lý do, validation hiển thị trong modal rồi nên chỉ cần double-check an toàn
        if (status === 'CANCELLED' && !cancelReason?.trim()) {
            setSnackbar({
                message: 'Vui lòng nhập lý do hủy booking.',
                severity: 'warning'
            });
            return;
        }
        await handleStatusChange(editingBooking.id, status, notes, cancelReason);
        setEditingBooking(null);
    };

    // Action menu handlers
    const handleCloseActionMenu = () => {
        setActionMenuAnchor(null);
        setActionMenuBooking(null);
    };

    const handleViewDetailsFromMenu = () => {
        if (!actionMenuBooking) return;
        setDetailBooking(actionMenuBooking);
        setIsDetailOpen(true);
        handleCloseActionMenu();
    };

    const handleEditFromMenu = () => {
        if (!actionMenuBooking) return;
        if (!isLeaderOfTeam(actionMenuBooking)) {
            handleCloseActionMenu();
            return;
        }
        handleOpenEditDialog(actionMenuBooking);
        handleCloseActionMenu();
    };

    // Quick statistics for management view
    const bookingStats = useMemo(() => {
        const source = bookings || [];
        const total = source.length;
        const pending = source.filter(b => b.booking_status === 'PENDING').length;
        const confirmed = source.filter(b => b.booking_status === 'CONFIRMED').length;
        const inProgress = source.filter(b => b.booking_status === 'IN_PROGRESS').length;
        const completed = source.filter(b => b.booking_status === 'COMPLETED').length;
        const cancelled = source.filter(b => b.booking_status === 'CANCELLED').length;
        return { total, pending, confirmed, inProgress, completed, cancelled };
    }, [bookings]);

    // Show fullScreen loading like manager pages
    if (loading) {
        return <Loading message="Đang tải dữ liệu booking..." fullScreen variant="dots" />;
    }

    return (
        <Box
            sx={{
                bgcolor: COLORS.BACKGROUND.NEUTRAL,
                minHeight: '100vh',
                width: '100%',
                p: { xs: 2, md: 4 }
            }}
        >
            <Stack spacing={3}>
                {/* Header */}
                <Box>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]}, ${COLORS.PRIMARY[600]})`,
                                boxShadow: `0 10px 24px ${COLORS.SHADOW.DARK}33`
                            }}
                        >
                            <ReceiptLong sx={{ color: 'white', fontSize: 26 }} />
                        </Box>
                        <Box>
                                <PageTitle title="Xem Booking" subtitle="Theo dõi lịch booking dịch vụ của các nhóm mà bạn đang tham gia, hỗ trợ xử lý và cập nhật trạng thái nhanh chóng" center={false} />
                        </Box>
                        </Stack>
                    </Stack>
                </Box>

                {/* Filters */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        backgroundColor: 'white',
                        boxShadow: `0 10px 30px ${COLORS.SHADOW.LIGHT}1F`
                    }}
                >
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FilterList sx={{ color: COLORS.PRIMARY[500] }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Bộ lọc booking
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                {/* Nhóm */}
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

                                {/* Dịch vụ */}
                                <TextField
                                    fullWidth
                                    select
                                    label="Dịch vụ"
                                    value={selectedServiceId}
                                    onChange={(e) => {
                                        setSelectedServiceId(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">
                                        Tất cả dịch vụ
                                    </MenuItem>
                                    {serviceOptions.map((service) => (
                                        <MenuItem key={service.id} value={service.id}>
                                            {service.name}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {/* Trạng thái */}
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

                                {/* Từ ngày */}
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

                                {/* Đến ngày */}
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

                {/* Summary + Bookings Table */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        backgroundColor: 'white',
                        boxShadow: `0 12px 32px ${COLORS.SHADOW.LIGHT}20`
                    }}
                >
                    {/* Summary bar */}
                    <Box
                        sx={{
                            px: 3,
                            py: 2,
                            borderBottom: `1px solid ${COLORS.BORDER.DEFAULT}`,
                            bgcolor: COLORS.PRIMARY[50]
                        }}
                    >
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            justifyContent="space-between"
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Tổng quan booking
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                            >
                                <Chip
                                    label={`Tổng: ${bookingStats.total}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.PRIMARY[100], color: COLORS.PRIMARY[700], fontWeight: 600 }}
                                />
                                <Chip
                                    label={`Chờ xử lý: ${bookingStats.pending}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.WARNING[100], color: COLORS.WARNING[700], fontWeight: 600 }}
                                />
                                <Chip
                                    label={`Đã xác nhận: ${bookingStats.confirmed}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.INFO[100], color: COLORS.INFO[700], fontWeight: 600 }}
                                />
                                <Chip
                                    label={`Đang thực hiện: ${bookingStats.inProgress}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.PRIMARY[100], color: COLORS.PRIMARY[700], fontWeight: 600 }}
                                />
                                <Chip
                                    label={`Hoàn thành: ${bookingStats.completed}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.SUCCESS[100], color: COLORS.SUCCESS[700], fontWeight: 600 }}
                                />
                                <Chip
                                    label={`Đã hủy: ${bookingStats.cancelled}`}
                                    size="small"
                                    sx={{ bgcolor: COLORS.ERROR[100], color: COLORS.ERROR[700], fontWeight: 600 }}
                                />
                            </Stack>
                        </Stack>
                    </Box>
                    <Divider />
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <Loading message="Đang tải dữ liệu booking..." variant="dots" />
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table size="medium" stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: COLORS.PRIMARY[50] }}>
                                            <TableCell sx={{ fontWeight: 800 }}>Dịch vụ</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Nhóm</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Ghi chú</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredBookings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                    <Stack spacing={1} alignItems="center">
                                                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                                            {selectedTeamId ? 'Không có booking nào cho nhóm này.' : 'Vui lòng chọn nhóm để xem booking.'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            Điều chỉnh bộ lọc ở phía trên để xem các khoảng thời gian hoặc trạng thái khác.
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            groupedBookings.map((group) => (
                                                <React.Fragment key={group.id}>
                                                    {/* Service group header row */}
                                                    <TableRow
                                                        sx={{
                                                            backgroundColor: COLORS.PRIMARY[50],
                                                            '& > td': {
                                                                borderBottom: `1px solid ${COLORS.BORDER.DEFAULT}`
                                                            }
                                                        }}
                                                    >
                                                        <TableCell colSpan={7}>
                                                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                                    <Box
                                                                        sx={{
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: 1.5,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            backgroundColor: COLORS.PRIMARY[100]
                                                                        }}
                                                                    >
                                                                        <ReceiptLong sx={{ fontSize: 18, color: COLORS.PRIMARY[700] }} />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                                                            {group.name}
                                                                        </Typography>
                                                                        {group.description && (
                                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                                {group.description}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                                <Chip
                                                                    label={`${group.items.length} booking`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: COLORS.PRIMARY[100],
                                                                        color: COLORS.PRIMARY[700],
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Rows for this service, grouped by slot */}
                                                    {group.slots.map((slot) => (
                                                        <React.Fragment key={slot.key}>
                                                            {/* Slot header row */}
                                                            <TableRow
                                                                sx={{
                                                                    backgroundColor: COLORS.BACKGROUND.NEUTRAL,
                                                                    '& > td': {
                                                                        borderBottom: `1px dashed ${COLORS.BORDER.DEFAULT}`
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell colSpan={7}>
                                                                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <AccessTime fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                {slot.label}
                                                                            </Typography>
                                                                        </Stack>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                            {slot.items.length} booking trong slot này
                                                                        </Typography>
                                                                    </Stack>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Booking rows trong slot */}
                                                            {slot.items.map((booking) => {
                                                                const canEdit = isLeaderOfTeam(booking);
                                                                return (
                                                                    <TableRow key={booking.id} hover>
                                                                        <TableCell>
                                                                            <Stack spacing={0.5}>
                                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                                                                        <TableCell align="center">
                                                                            <IconButton
                                                                                size="small"
                                                                                disabled={updatingBookingId === booking.id}
                                                                                onClick={(event) => {
                                                                                    setActionMenuAnchor(event.currentTarget);
                                                                                    setActionMenuBooking(booking);
                                                                                }}
                                                                            >
                                                                                <MoreVert fontSize="small" />
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {pagination.total_items_count > 0 && (
                                <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                                    <Pagination
                                        page={page}
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

            {/* Action menu cho MoreVert */}
            <Menu
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={handleCloseActionMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={handleViewDetailsFromMenu}>
                    <ListItemIcon sx={{ minWidth: 32, color: COLORS.INFO[600] }}>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">Xem chi tiết</Typography>
                </MenuItem>
                {actionMenuBooking && isLeaderOfTeam(actionMenuBooking) && (
                    <MenuItem onClick={handleEditFromMenu}>
                        <ListItemIcon sx={{ minWidth: 32, color: COLORS.PRIMARY[600] }}>
                            <Edit fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2">Chỉnh sửa booking</Typography>
                    </MenuItem>
                )}
            </Menu>

            {/* Modal xem chi tiết booking - cho mọi thành viên trong nhóm */}
            {detailBooking && (
                <Dialog
                    open={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setDetailBooking(null);
                    }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5
                        }}
                    >
                        <ReceiptLong sx={{ fontSize: 22 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Chi tiết booking
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            {/* Dịch vụ */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Dịch vụ
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {detailBooking.service?.name || '--'}
                                </Typography>
                                {detailBooking.service?.description && (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                        {detailBooking.service.description}
                                    </Typography>
                                )}
                            </Box>

                            {/* Khách hàng */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Khách hàng
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Person fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {detailBooking.customer?.full_name || '--'}
                                    </Typography>
                                </Stack>
                                {detailBooking.customer?.phone && (
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                        <Phone fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {detailBooking.customer.phone}
                                        </Typography>
                                    </Stack>
                                )}
                            </Box>

                            {/* Thời gian */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Thời gian
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <CalendarToday fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                        <Typography variant="body2">
                                            {formatDateTime(detailBooking.booking_date || detailBooking.bookingDateTime)}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <AccessTime fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {formatTime(detailBooking.start_time)} - {formatTime(detailBooking.end_time)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Nhóm phụ trách */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Nhóm phụ trách
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Group fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {detailBooking.team?.name || '--'}
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Trạng thái */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Trạng thái
                                </Typography>
                                <Chip
                                    label={getStatusLabel(detailBooking.booking_status)}
                                    size="small"
                                    sx={{
                                        bgcolor: getStatusColor(detailBooking.booking_status),
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                            </Box>

                            {/* Ghi chú */}
                            {detailBooking.notes && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Ghi chú
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                        <Note fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.3 }} />
                                        <Typography variant="body2">
                                            {detailBooking.notes}
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

                            {/* Lý do hủy */}
                            {detailBooking.booking_status === 'CANCELLED' && detailBooking.cancel_reason && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Lý do hủy
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {detailBooking.cancel_reason}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions
                        sx={{
                            px: 3,
                            py: 2,
                            borderTop: `1px solid ${COLORS.BORDER.DEFAULT}`
                        }}
                    >
                        <Button
                            onClick={() => {
                                setIsDetailOpen(false);
                                setDetailBooking(null);
                            }}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Edit Booking Modal (Leader only) */}
            {editingBooking && (
                <EditBookingModal
                    isOpen={Boolean(editingBooking)}
                    booking={editingBooking}
                    onClose={handleCloseEditDialog}
                    onSubmit={handleSaveEditDialog}
                    isSubmitting={updatingBookingId === editingBooking.id}
                />
            )}

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

