import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    TextField,
    Stack,
    Toolbar,
    Avatar,
    alpha,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    AccessTime,
    ShoppingCart,
    CalendarToday,
    Assignment,
    Settings
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { notificationApi } from '../../api/notificationApi';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/loading/Loading';
import { useSignalR } from '../../utils/SignalRContext';
import AlertModal from '../../components/modals/AlertModal';

// Helper functions
const mapNotificationType = (type) => {
    const types = {
        'ORDER': { label: 'Đơn hàng', icon: <ShoppingCart />, color: COLORS.SUCCESS[500] },
        'BOOKING': { label: 'Đặt lịch', icon: <CalendarToday />, color: COLORS.INFO[500] },
        'TASK': { label: 'Nhiệm vụ', icon: <Assignment />, color: COLORS.WARNING[500] },
        'SYSTEM': { label: 'Hệ thống', icon: <Settings />, color: COLORS.ERROR[500] }
    };
    return types[(type || '').toUpperCase()] || { label: type || 'Khác', icon: <NotificationsIcon />, color: COLORS.TEXT.SECONDARY };
};

const mapPriority = (priority) => {
    const priorities = {
        'HIGH': { label: 'Cao', color: 'error' },
        'NORMAL': { label: 'Thường', color: 'info' },
        'LOW': { label: 'Thấp', color: 'default' }
    };
    return priorities[(priority || '').toUpperCase()] || priorities['NORMAL'];
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

const NotificationsPage = () => {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    const signalRNotification = useSignalR();
    const hasMarkedOnThisVisit = React.useRef(false);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const accountId = localStorage.getItem('accountId');

            if (!accountId) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: 'Không tìm thấy thông tin tài khoản',
                    type: 'error'
                });
                return;
            }

            const response = await notificationApi.getNotifications(1, 200, accountId);
            let notificationsData = response.data || [];

            // Sort by date (newest first)
            notificationsData.sort((a, b) => {
                const dateA = new Date(a.sent_date || a.created_at || a.sent_at || 0);
                const dateB = new Date(b.sent_date || b.created_at || b.sent_at || 0);
                return dateB - dateA;
            });

            setNotifications(notificationsData);

            // Calculate stats
            const unread = notificationsData.filter(n => !n.is_read).length;
            const read = notificationsData.filter(n => n.is_read).length;
            setStats({
                total: notificationsData.length,
                unread,
                read
            });
        } catch (err) {
            console.error('[NotificationsPage] Error loading notifications:', err);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không thể tải thông báo. Vui lòng thử lại sau.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Initial load and mark as read
    useEffect(() => {
        const markAndLoad = async () => {
            let accountId = localStorage.getItem('accountId');

            if (!accountId) {
                try {
                    const currentUserStr = localStorage.getItem('currentUser');
                    if (currentUserStr) {
                        const currentUser = JSON.parse(currentUserStr);
                        accountId = currentUser.account_id || currentUser.id;
                    }
                } catch (e) {
                    console.error('[NotificationsPage] Error parsing currentUser:', e);
                }
            }

            if (!accountId) {
                await loadNotifications();
                return;
            }

            // Mark as read once
            if (!hasMarkedOnThisVisit.current) {
                try {
                    await notificationApi.markAllAsRead(accountId);
                    window.dispatchEvent(new Event('notificationsMarkedAsRead'));
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    hasMarkedOnThisVisit.current = true;
                } catch (markError) {
                    console.error('[NotificationsPage] markAllAsRead failed:', markError);
                }
            }

            await loadNotifications();
        };

        markAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset flag on unmount
    useEffect(() => {
        return () => {
            hasMarkedOnThisVisit.current = false;
        };
    }, []);

    // Listen for realtime notifications
    useEffect(() => {
        if (signalRNotification) {
            const accountId = localStorage.getItem('accountId');
            const notificationAccountId = signalRNotification.accountId || signalRNotification.account_id;

            if (accountId && notificationAccountId === accountId) {
                const timeoutId = setTimeout(() => {
                    loadNotifications();
                }, 500);
                return () => clearTimeout(timeoutId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signalRNotification]);

    // Filtered notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notif => {
            // Search
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = (notif.title || '').toLowerCase().includes(searchLower) ||
                    (notif.message || '').toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Type filter
            if (filterType !== 'all' && (notif.notification_type || '').toUpperCase() !== filterType.toUpperCase()) {
                return false;
            }

            // Priority filter
            if (filterPriority !== 'all' && (notif.priority || '').toUpperCase() !== filterPriority.toUpperCase()) {
                return false;
            }

            // Status filter
            if (filterStatus === 'read' && !notif.is_read) return false;
            if (filterStatus === 'unread' && notif.is_read) return false;

            return true;
        });
    }, [notifications, searchQuery, filterType, filterPriority, filterStatus]);

    // Paginated notifications
    const paginatedNotifications = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredNotifications, page, itemsPerPage]);

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        color: COLORS.TEXT.PRIMARY,
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <NotificationsIcon sx={{ fontSize: 28, color: COLORS.PRIMARY[600] }} />
                    Quản lý Thông báo
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: COLORS.TEXT.SECONDARY }}
                >
                    Xem và quản lý tất cả thông báo hệ thống
                </Typography>
            </Box>

            {/* Main Content */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}` }}>
                {/* Toolbar */}
                <Toolbar
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        borderBottom: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: { xs: 'stretch', md: 'center' }
                    }}
                >
                    <TextField
                        placeholder="Tìm kiếm thông báo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: '100%', md: 300 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />

                    <Stack direction="row" spacing={1.5} sx={{ flex: 1, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Loại</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                label="Loại"
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="ORDER">Đơn hàng</MenuItem>
                                <MenuItem value="BOOKING">Đặt lịch</MenuItem>
                                <MenuItem value="TASK">Nhiệm vụ</MenuItem>
                                <MenuItem value="SYSTEM">Hệ thống</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Ưu tiên</InputLabel>
                            <Select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                label="Ưu tiên"
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="HIGH">Cao</MenuItem>
                                <MenuItem value="NORMAL">Thường</MenuItem>
                                <MenuItem value="LOW">Thấp</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Trạng thái"
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="unread">Chưa đọc</MenuItem>
                                <MenuItem value="read">Đã đọc</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Toolbar>

                {/* List */}
                <Box sx={{ p: 3 }}>
                    {paginatedNotifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 10 }}>
                            <Avatar
                                sx={{
                                    width: 64,
                                    height: 64,
                                    bgcolor: alpha(COLORS.TEXT.SECONDARY, 0.1),
                                    color: COLORS.TEXT.SECONDARY,
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <NotificationsIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                Không có thông báo
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                Chưa có thông báo nào phù hợp với bộ lọc
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={3}>
                            {paginatedNotifications.map((notif) => {
                                const typeInfo = mapNotificationType(notif.notification_type);
                                const priorityInfo = mapPriority(notif.priority);
                                const isUnread = !notif.is_read;
                                const sentDate = notif.sent_date || notif.created_at || notif.sent_at;

                                return (
                                    <Paper
                                        key={notif.id}
                                        elevation={1}
                                        sx={{
                                            p: 3,
                                            bgcolor: isUnread ? alpha(COLORS.INFO[50], 0.5) : 'white',
                                            border: `2px solid ${isUnread ? COLORS.INFO[300] : alpha(COLORS.BORDER.DEFAULT, 0.25)}`,
                                            borderRadius: 2.5,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: isUnread ? alpha(COLORS.INFO[100], 0.6) : alpha(COLORS.PRIMARY[50], 0.3),
                                                boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.2)}`,
                                                transform: 'translateY(-2px)',
                                                borderColor: isUnread ? COLORS.INFO[400] : COLORS.PRIMARY[300]
                                            }
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            {/* Icon */}
                                            <Avatar
                                                sx={{
                                                    bgcolor: alpha(typeInfo.color, 0.12),
                                                    color: typeInfo.color,
                                                    width: 44,
                                                    height: 44
                                                }}
                                            >
                                                {typeInfo.icon}
                                            </Avatar>

                                            {/* Content */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: isUnread ? 700 : 600,
                                                        color: COLORS.TEXT.PRIMARY,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {notif.title || 'Thông báo'}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: COLORS.TEXT.SECONDARY,
                                                        mb: 1.5,
                                                        lineHeight: 1.6
                                                    }}
                                                >
                                                    {notif.message || 'Không có nội dung'}
                                                </Typography>

                                                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        icon={typeInfo.icon}
                                                        label={typeInfo.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(typeInfo.color, 0.1),
                                                            color: typeInfo.color,
                                                            fontWeight: 600,
                                                            height: 24,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />

                                                    <Chip
                                                        label={priorityInfo.label}
                                                        size="small"
                                                        color={priorityInfo.color}
                                                        variant="outlined"
                                                        sx={{
                                                            fontWeight: 600,
                                                            height: 24,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />

                                                    <Chip
                                                        label={isUnread ? 'Chưa đọc' : 'Đã đọc'}
                                                        size="small"
                                                        color={isUnread ? 'warning' : 'success'}
                                                        sx={{
                                                            fontWeight: 600,
                                                            height: 24,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <AccessTime sx={{ fontSize: 14, color: COLORS.TEXT.DISABLED }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.DISABLED, fontWeight: 500 }}>
                                                            {formatDate(sentDate)}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Box>

                {/* Pagination */}
                <Box sx={{ p: 2 }}>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setPage(1);
                        }}
                        totalItems={filteredNotifications.length}
                    />
                </Box>
            </Paper>

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default NotificationsPage;
