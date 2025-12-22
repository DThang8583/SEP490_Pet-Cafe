import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Paper, Tooltip, Alert, Collapse } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close as CloseIcon, Info as InfoIcon, Schedule as ScheduleIcon, LocationOn as LocationIcon, Pets as PetsIcon, CalendarToday as CalendarIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/slotApi';
import serviceApi from '../../api/serviceApi';
import Loading from '../loading/Loading';
import Pagination from '../common/Pagination';
import AlertModal from './AlertModal';

// Constants
const WEEKDAY_ORDER = {
    'MONDAY': 0,
    'TUESDAY': 1,
    'WEDNESDAY': 2,
    'THURSDAY': 3,
    'FRIDAY': 4,
    'SATURDAY': 5,
    'SUNDAY': 6
};

const ServiceSlotsModal = ({
    open,
    onClose,
    service
}) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalItems: 0
    });
    const [alert, setAlert] = useState({ open: false, title: '', message: '', type: 'info' });
    const [expandedSlots, setExpandedSlots] = useState(new Set());

    // Load slots when modal opens
    useEffect(() => {
        if (open && service?.id) {
            loadSlots(1, 10); // Use default limit on initial load
        } else {
            setSlots([]);
            setPagination({
                page: 1,
                totalPages: 1,
                totalItems: 0
            });
            setExpandedSlots(new Set()); // Reset expanded slots when modal closes
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, service?.id]);

    const loadSlots = useCallback(async (page = 1, limit = 10) => {
        if (!service?.id) return;

        try {
            setLoading(true);
            const response = await serviceApi.getSlotsByServiceId(service.id, {
                page: page - 1, // API uses 0-based page
                limit
            });

            setSlots(response.data || []);
            setPagination({
                page,
                totalPages: response.pagination?.total_pages_count || 1,
                totalItems: response.pagination?.total_items_count || 0
            });
        } catch (error) {
            console.error('[ServiceSlotsModal] Error loading slots:', error);
            setSlots([]);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [service?.id]);

    // Sort slots by weekday and time
    const sortedSlots = useMemo(() => {
        if (!slots || !Array.isArray(slots)) return [];

        return [...slots].sort((a, b) => {
            const dayA = a.day_of_week || 'MONDAY';
            const dayB = b.day_of_week || 'MONDAY';
            const orderA = WEEKDAY_ORDER[dayA] ?? 999;
            const orderB = WEEKDAY_ORDER[dayB] ?? 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
    }, [slots]);

    // Status map
    const statusMap = useMemo(() => ({
        'AVAILABLE': { label: 'Có sẵn', color: COLORS.SUCCESS[700], bg: COLORS.SUCCESS[50] },
        'UNAVAILABLE': { label: 'Không khả dụng', color: COLORS.WARNING[700], bg: COLORS.WARNING[50] },
        'MAINTENANCE': { label: 'Bảo trì', color: COLORS.INFO[700], bg: COLORS.INFO[50] },
        'CANCELLED': { label: 'Đã hủy', color: COLORS.ERROR[700], bg: COLORS.ERROR[50] }
    }), []);

    const getStatusChip = useCallback((status) => {
        const config = statusMap[status] || statusMap['AVAILABLE'];
        return (
            <Chip
                label={config.label}
                size="small"
                sx={{
                    bgcolor: alpha(config.bg, 0.8),
                    color: config.color,
                    fontWeight: 600
                }}
            />
        );
    }, [statusMap]);

    // Format price
    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }, []);

    // Format date
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }, []);

    // Toggle slot expansion
    const toggleSlotExpansion = useCallback((slotId) => {
        setExpandedSlots(prev => {
            const newSet = new Set(prev);
            if (newSet.has(slotId)) {
                newSet.delete(slotId);
            } else {
                newSet.add(slotId);
            }
            return newSet;
        });
    }, []);

    if (!service) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    maxHeight: '90vh'
                }
            }}
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <ScheduleIcon />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Ca làm việc: {service.name}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                                {sortedSlots.length} ca làm việc
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: COLORS.PRIMARY[700],
                            '&:hover': {
                                bgcolor: alpha(COLORS.PRIMARY[100], 0.5)
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Loading />
                    </Box>
                ) : sortedSlots.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Chưa có ca làm việc nào cho dịch vụ này.
                        </Typography>
                    </Alert>
                ) : (
                    <>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead sx={{ bgcolor: alpha(COLORS.PRIMARY[50], 0.3) }}>
                                    <TableRow>
                                        <TableCell width="3%" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>STT</TableCell>
                                        <TableCell width="10%" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ngày</TableCell>
                                        <TableCell width="11%" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Thời gian</TableCell>
                                        <TableCell width="12%" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Khu vực</TableCell>
                                        <TableCell width="12%" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Nhóm Pet</TableCell>
                                        <TableCell width="8%" align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Sức chứa</TableCell>
                                        <TableCell width="9%" align="right" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Giá</TableCell>
                                        <TableCell width="9%" align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Trạng thái</TableCell>
                                        <TableCell width="8%" align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ghi chú</TableCell>
                                        <TableCell width="18%" align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Lịch đặt</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedSlots.map((slot, index) => {
                                        const stt = (pagination.page - 1) * itemsPerPage + index + 1;
                                        return (
                                            <React.Fragment key={slot.id}>
                                                <TableRow hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {stt}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Ngày */}
                                                    <TableCell>
                                                        {slot.is_recurring ? (
                                                            <Chip
                                                                label={WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label={formatDate(slot.specific_date)}
                                                                size="small"
                                                                variant="outlined"
                                                                color="secondary"
                                                            />
                                                        )}
                                                    </TableCell>

                                                    {/* Thời gian */}
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <ScheduleIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {slot.start_time} - {slot.end_time}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>

                                                    {/* Khu vực */}
                                                    <TableCell>
                                                        {slot.area ? (
                                                            <Tooltip title={`${slot.area.location || ''} - ${slot.area.description || ''}`}>
                                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                    <LocationIcon fontSize="small" color="action" />
                                                                    <Typography variant="body2" noWrap>
                                                                        {slot.area.name}
                                                                    </Typography>
                                                                </Stack>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Nhóm Pet */}
                                                    <TableCell>
                                                        {slot.pet_group ? (
                                                            <Tooltip title={slot.pet_group.description || ''}>
                                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                    <PetsIcon fontSize="small" color="action" />
                                                                    <Typography variant="body2" noWrap>
                                                                        {slot.pet_group.name}
                                                                    </Typography>
                                                                </Stack>
                                                            </Tooltip>
                                                        ) : slot.pet ? (
                                                            <Typography variant="body2" noWrap>
                                                                {slot.pet.name}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Sức chứa */}
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {slot.max_capacity || 0}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Giá */}
                                                    <TableCell align="right">
                                                        {slot.price && slot.price > 0 ? (
                                                            <Typography variant="body2" fontWeight={500} color={COLORS.SUCCESS[700]}>
                                                                {formatPrice(slot.price)}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatPrice(service.base_price || 0)}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Trạng thái */}
                                                    <TableCell align="center">
                                                        {getStatusChip(slot.service_status)}
                                                    </TableCell>

                                                    {/* Ghi chú */}
                                                    <TableCell align="center">
                                                        {slot.special_notes ? (
                                                            <Tooltip title={slot.special_notes} arrow>
                                                                <IconButton size="small" color="info">
                                                                    <InfoIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Lịch đặt */}
                                                    <TableCell align="center">
                                                        {slot.slot_availabilities && slot.slot_availabilities.length > 0 ? (
                                                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                                                <Chip
                                                                    label={`${slot.slot_availabilities.length} ngày`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(COLORS.INFO[50], 0.8),
                                                                        color: COLORS.INFO[700],
                                                                        fontWeight: 600,
                                                                        fontSize: '0.75rem',
                                                                        height: 24
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => toggleSlotExpansion(slot.id)}
                                                                    sx={{
                                                                        color: COLORS.INFO[600],
                                                                        '&:hover': {
                                                                            bgcolor: alpha(COLORS.INFO[50], 0.5)
                                                                        }
                                                                    }}
                                                                >
                                                                    {expandedSlots.has(slot.id) ? (
                                                                        <ExpandLessIcon fontSize="small" />
                                                                    ) : (
                                                                        <ExpandMoreIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                {/* Expanded row for slot availabilities */}
                                                {slot.slot_availabilities && slot.slot_availabilities.length > 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={10} sx={{ py: 0, border: 'none' }}>
                                                            <Collapse in={expandedSlots.has(slot.id)} timeout="auto" unmountOnExit>
                                                                <Box sx={{ py: 2, bgcolor: alpha(COLORS.GRAY[50], 0.3) }}>
                                                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: COLORS.TEXT.PRIMARY, px: 2 }}>
                                                                        Chi tiết lịch đặt ({slot.slot_availabilities.length} ngày)
                                                                    </Typography>
                                                                    <TableContainer component={Paper} variant="outlined" sx={{ mx: 2 }}>
                                                                        <Table size="small">
                                                                            <TableHead>
                                                                                <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[50], 0.2) }}>
                                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>STT</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Ngày đặt</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Đã đặt</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Sức chứa</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Tỷ lệ</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Trạng thái</TableCell>
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {slot.slot_availabilities.map((avail, idx) => {
                                                                                    const percentage = avail.max_capacity > 0
                                                                                        ? Math.round((avail.booked_count / avail.max_capacity) * 100)
                                                                                        : 0;
                                                                                    const isFull = avail.booked_count >= avail.max_capacity;
                                                                                    const isNearFull = percentage > 80;

                                                                                    return (
                                                                                        <TableRow key={avail.id || idx} hover>
                                                                                            <TableCell>
                                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                                    {idx + 1}
                                                                                                </Typography>
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                                                                                    <CalendarIcon fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                                                                                                    <Typography variant="body2" fontWeight={500}>
                                                                                                        {formatDate(avail.booking_date)}
                                                                                                    </Typography>
                                                                                                </Stack>
                                                                                            </TableCell>
                                                                                            <TableCell align="center">
                                                                                                <Typography
                                                                                                    variant="body2"
                                                                                                    fontWeight={600}
                                                                                                    sx={{
                                                                                                        color: isFull
                                                                                                            ? COLORS.ERROR[700]
                                                                                                            : isNearFull
                                                                                                                ? COLORS.WARNING[700]
                                                                                                                : COLORS.SUCCESS[700]
                                                                                                    }}
                                                                                                >
                                                                                                    {avail.booked_count}
                                                                                                </Typography>
                                                                                            </TableCell>
                                                                                            <TableCell align="center">
                                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                                    {avail.max_capacity}
                                                                                                </Typography>
                                                                                            </TableCell>
                                                                                            <TableCell align="center">
                                                                                                <Chip
                                                                                                    label={`${percentage}%`}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        bgcolor: isFull
                                                                                                            ? alpha(COLORS.ERROR[50], 0.8)
                                                                                                            : isNearFull
                                                                                                                ? alpha(COLORS.WARNING[50], 0.8)
                                                                                                                : alpha(COLORS.SUCCESS[50], 0.8),
                                                                                                        color: isFull
                                                                                                            ? COLORS.ERROR[700]
                                                                                                            : isNearFull
                                                                                                                ? COLORS.WARNING[700]
                                                                                                                : COLORS.SUCCESS[700],
                                                                                                        fontWeight: 600,
                                                                                                        fontSize: '0.75rem',
                                                                                                        height: 22
                                                                                                    }}
                                                                                                />
                                                                                            </TableCell>
                                                                                            <TableCell align="center">
                                                                                                <Chip
                                                                                                    label={isFull ? 'Đầy' : isNearFull ? 'Gần đầy' : 'Còn chỗ'}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        bgcolor: isFull
                                                                                                            ? alpha(COLORS.ERROR[50], 0.8)
                                                                                                            : isNearFull
                                                                                                                ? alpha(COLORS.WARNING[50], 0.8)
                                                                                                                : alpha(COLORS.SUCCESS[50], 0.8),
                                                                                                        color: isFull
                                                                                                            ? COLORS.ERROR[700]
                                                                                                            : isNearFull
                                                                                                                ? COLORS.WARNING[700]
                                                                                                                : COLORS.SUCCESS[700],
                                                                                                        fontWeight: 600,
                                                                                                        fontSize: '0.75rem',
                                                                                                        height: 22
                                                                                                    }}
                                                                                                />
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    );
                                                                                })}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </TableContainer>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <Box sx={{ mt: 2 }}>
                                <Pagination
                                    page={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(newPage) => loadSlots(newPage, itemsPerPage)}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        loadSlots(1, value);
                                    }}
                                    totalItems={pagination.totalItems}
                                />
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 100
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Dialog>
    );
};

export default ServiceSlotsModal;
