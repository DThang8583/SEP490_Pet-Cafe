import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Stack,
    Avatar,
    Toolbar,
    TextField,
    InputAdornment,
    Button
} from '@mui/material';
import { Notifications as NotificationsIcon, Search as SearchIcon, AccessTime } from '@mui/icons-material';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import { useSignalR } from '../../utils/SignalRContext';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS } from '../../constants/colors';
import { notificationApi } from '../../api/notificationApi';

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
};

const isLeaveNotification = (notif) => {
    const type = (notif.notification_type || '').toString().toUpperCase();
    if (type.includes('LEAVE')) return true;
    const title = (notif.title || '').toString().toLowerCase();
    const message = (notif.message || notif.content || '').toString().toLowerCase();
    if (title.includes('nghỉ') || message.includes('nghỉ') || message.includes('duyệt') || message.includes('từ chối')) return true;
    return false;
};

const StaffLeaveNotificationsPage = () => {
    const signalRNotification = useSignalR();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [alert, setAlert] = useState({ open: false, title: '', message: '', type: 'info' });

    const loadNotifications = async () => {
        try {
            setLoading(true);
            let accountId = localStorage.getItem('accountId');
            if (!accountId) {
                const cu = localStorage.getItem('currentUser');
                let parsed = null;
                try { parsed = cu ? JSON.parse(cu) : null; } catch (e) {}
                if (parsed) {
                    accountId = parsed.account_id || parsed.id || accountId;
                }
            }
            const response = await notificationApi.getNotifications(1, 200, accountId);
            let data = response.data || [];
            data = data.filter(isLeaveNotification);
            data.sort((a, b) => new Date(b.sent_date || b.created_at || 0) - new Date(a.sent_date || a.created_at || 0));
            setNotifications(data);
        } catch (err) {
            console.error('[SalesStaffLeaveNotificationsPage] load failed', err);
            setNotifications([]);
            setAlert({ open: true, title: 'Lỗi', message: 'Không thể tải thông báo', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const markAndLoad = async () => {
            try {
                const accountId = localStorage.getItem('accountId');
                if (accountId) {
                    try {
                        await notificationApi.markAllAsRead(accountId);
                        await new Promise(r => setTimeout(r, 300));
                    } catch (e) {
                        // ignore
                    }
                }
            } finally {
                await loadNotifications();
            }
        };
        markAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!signalRNotification) return;
        try {
            if (isLeaveNotification(signalRNotification)) {
                setTimeout(() => loadNotifications(), 300);
            }
        } catch (e) {
            // ignore
        }
    }, [signalRNotification]);

    const filtered = useMemo(() => {
        if (!searchQuery) return notifications;
        const q = searchQuery.trim().toLowerCase();
        return notifications.filter(n => {
            return (n.title || '').toString().toLowerCase().includes(q) || (n.message || n.content || '').toString().toLowerCase().includes(q);
        });
    }, [notifications, searchQuery]);

    const paginated = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, page, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    if (loading) return <Loading fullScreen message="Đang tải thông báo..." />;

    return (
        <Box sx={{ p: 3 }}>
            <Box>
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ bgcolor: COLORS.PRIMARY[600], width: 56, height: 56 }}>
                        <NotificationsIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Thông báo
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Các thông báo của bạn
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, p: 2 }}>
                    <TextField
                        placeholder="Tìm thông báo..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 300 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                        }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <Button variant="outlined" onClick={loadNotifications}>Làm mới</Button>
                </Toolbar>
            </Paper>

            {paginated.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Avatar sx={{ bgcolor: 'transparent', mx: 'auto', mb: 2 }}>
                        <NotificationsIcon sx={{ fontSize: 44 }} />
                    </Avatar>
                    <Typography variant="h6">Không có thông báo liên quan đến đơn nghỉ phép</Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {paginated.map(n => (
                        <Paper key={n.id} sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: 'transparent' }}><NotificationsIcon /></Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{n.title || 'Thông báo'}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>{n.message || n.content}</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <AccessTime sx={{ fontSize: 14, color: 'text.disabled' }} />
                                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>{formatDate(n.sent_date || n.created_at)}</Typography>
                                    </Stack>
                                </Box>
                                <Chip label={n.is_read ? 'Đã đọc' : 'Chưa đọc'} color={n.is_read ? 'success' : 'warning'} />
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}

            <Box sx={{ mt: 2 }}>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filtered.length}
                    onPageChange={(p) => setPage(p)}
                    onItemsPerPageChange={(n) => { setItemsPerPage(n); setPage(1); }}
                />
            </Box>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert(s => ({ ...s, open: false }))}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default StaffLeaveNotificationsPage;


