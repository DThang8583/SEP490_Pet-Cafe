import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Snackbar, Alert, Skeleton } from '@mui/material';
import { ReceiptLong, Phone, Pets } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { COLORS } from '../../constants/colors';

const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const LeaderBookingsPage = () => {
    const profile = workingStaffApi.getProfile();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

    useEffect(() => {
        if (!profile.leader) return;
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                const leaderTeams = data.filter((team) => team.leader_id === profile.id || team.leader_id === profile.employee_id);
                if (mounted) {
                    setTeams(leaderTeams);
                    if (leaderTeams.length > 0) {
                        setSelectedTeam(leaderTeams[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load teams for bookings', error);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, [profile.id, profile.employee_id, profile.leader]);

    useEffect(() => {
        if (!selectedTeam) return;
        let mounted = true;
        const loadBookings = async () => {
            setLoading(true);
            try {
                const data = await workingStaffApi.getBookings(selectedTeam);
                if (mounted) setBookings(data);
            } catch (error) {
                console.error('Failed to load bookings', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadBookings();
        return () => {
            mounted = false;
        };
    }, [selectedTeam]);

    const handleStatusChange = async (bookingId, status) => {
        try {
            await workingStaffApi.updateBookingStatus(bookingId, status);
            setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)));
            setSnackbar({ message: 'Cập nhật booking thành công', severity: 'success' });
        } catch (error) {
            console.error('Failed to update booking', error);
            setSnackbar({ message: 'Không thể cập nhật booking', severity: 'error' });
        }
    };

    if (!profile.leader) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Alert severity="info">Bạn cần quyền leader để xem và cập nhật booking của khách hàng.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <ReceiptLong sx={{ color: COLORS.ERROR[500] }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Booking khách hàng
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Theo dõi lịch đặt dịch vụ trong nhóm và cập nhật trạng thái cho khách.
                        </Typography>
                    </Box>
                </Stack>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Stack spacing={1} flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Nhóm
                            </Typography>
                            <TextField select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack spacing={1} flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Tổng booking
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                                    {bookings.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Đang chờ xử lý: {bookings.filter((b) => b.status === 'pending').length}
                                </Typography>
                            </Paper>
                        </Stack>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <Skeleton variant="rounded" height={280} />
                        </Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Dịch vụ</TableCell>
                                    <TableCell>Khách hàng</TableCell>
                                    <TableCell>Thú cưng</TableCell>
                                    <TableCell>Thời gian</TableCell>
                                    <TableCell align="center">Trạng thái</TableCell>
                                    <TableCell align="right">Hành động</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: COLORS.TEXT.SECONDARY }}>
                                            Không có booking nào cho nhóm này.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.map((booking) => (
                                        <TableRow key={booking.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    {booking.service?.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {booking.notes}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">{booking.customer?.name}</Typography>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Phone fontSize="small" sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {booking.customer?.phone}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Pets fontSize="small" />
                                                        <Typography variant="body2">{booking.pet?.name}</Typography>
                                                    </Stack>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {booking.pet?.type}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(booking.bookingDateTime).toLocaleString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={booking.status} size="small" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    select
                                                    size="small"
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                    sx={{ minWidth: 140 }}
                                                >
                                                    {statusOptions.map((status) => (
                                                        <MenuItem key={status} value={status}>
                                                            {status}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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

export default LeaderBookingsPage;

