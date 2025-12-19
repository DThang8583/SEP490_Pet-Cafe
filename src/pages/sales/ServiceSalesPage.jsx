import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, TextField, Button, Stack, Badge, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Divider, Tooltip, alpha, Paper, CircularProgress } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowBack, Close, CheckCircle, Info, AccessTime, AttachMoney, Pets, Spa, CalendarToday, People, Note } from '@mui/icons-material';
import { WEEKDAY_LABELS } from '../../api/slotApi';
import serviceApi from '../../api/serviceApi';

const ServiceSalesPage = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [selectedSlotDate, setSelectedSlotDate] = useState(null);
    const [slotModalOpen, setSlotModalOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [detailService, setDetailService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotQuantity, setSlotQuantity] = useState('1'); // số lượng chỗ khách muốn đặt

    useEffect(() => {
        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                // Official services API
                const resp = await fetch('https://petcafes.azurewebsites.net/api/services');
                if (!resp.ok) {
                    const errorText = await resp.text();
                    console.error('[ServiceSalesPage] Lỗi khi tải dịch vụ:', {
                        status: resp.status,
                        statusText: resp.statusText,
                        response: errorText
                    });
                    throw new Error(`Lỗi ${resp.status}: Không thể tải dịch vụ`);
                }
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setServices(list);
            } catch (e) {
                console.error('[ServiceSalesPage] Lỗi không thể thanh toán/tải dịch vụ:', e);
                setError(e.message || 'Không thể tải dịch vụ');
            }
        };
        load();
    }, []);

    useEffect(() => {
        const refreshCount = () => {
            try {
                const saved = localStorage.getItem('sales_cart');
                const arr = saved ? JSON.parse(saved) : [];
                setCartCount(Array.isArray(arr) ? arr.length : 0);
            } catch {
                setCartCount(0);
            }
        };
        refreshCount();
        window.addEventListener('cartUpdated', refreshCount);
        return () => window.removeEventListener('cartUpdated', refreshCount);
    }, []);

    const filtered = useMemo(() => services.filter(s => (s.name || '').toLowerCase().includes(keyword.toLowerCase())), [services, keyword]);

    const notifyCartChanged = (next) => {
        try { localStorage.setItem('sales_cart', JSON.stringify(next)); } catch { }
        try { window.dispatchEvent(new Event('cartUpdated')); } catch { }
    };

    // Fetch slots from API when modal opens
    useEffect(() => {
        const loadSlots = async () => {
            if (!slotModalOpen || !selectedService?.id) {
                setSlots([]);
                return;
            }

            setLoadingSlots(true);
            try {
                // Fetch all slots (use a high limit to get all slots)
                const result = await serviceApi.getSlotsByServiceId(selectedService.id, { page: 0, limit: 100 });
                setSlots(result.data || []);
            } catch (error) {
                console.error('[ServiceSalesPage] Error loading slots:', error);
                setSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [slotModalOpen, selectedService?.id]);

    const handleCardClick = (svc) => {
        setSelectedService(svc);
        setSelectedSlotId(null);
        setSelectedSlotDate(null);
        setSlotQuantity('1');
        setSlotModalOpen(true);
    };

    const getCartItems = () => {
        try {
            const saved = localStorage.getItem('sales_cart');
            const arr = saved ? JSON.parse(saved) : [];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    };

    // Tính số chỗ còn lại cho slot + ngày đang chọn (đã trừ chỗ đã đặt & đã có trong giỏ)
    const getSelectedRemainingCapacity = () => {
        if (!selectedService || !selectedSlotId || !selectedSlotDate) return null;
        const all = getAvailableSlotsWithDates();
        const item = all.find(
            (i) => i.slot.id === selectedSlotId && i.date === selectedSlotDate
        );
        if (!item) return null;

        const maxCapacity = item.availability?.max_capacity ?? item.slot.max_capacity ?? 0;
        const bookedCount = item.availability?.booked_count ?? 0;

        const cartItems = getCartItems();
        const existingInCart = cartItems
            .filter((ci) => ci.slot_id === selectedSlotId && ci.booking_date === selectedSlotDate)
            .reduce((sum, ci) => sum + (ci.quantity || 0), 0);

        const remaining = maxCapacity - bookedCount - existingInCart;
        return Math.max(remaining, 0);
    };

    const handleAddToCart = () => {
        if (!selectedService || !selectedSlotId || !selectedSlotDate) {
            console.warn('[ServiceSalesPage] Không thể thêm vào giỏ: Chưa chọn slot hoặc ngày');
            alert('Vui lòng chọn slot và ngày');
            return;
        }

        const remainingCapacity = getSelectedRemainingCapacity();
        if (remainingCapacity == null || remainingCapacity <= 0) {
            alert('Slot này hiện đã hết chỗ khả dụng. Vui lòng chọn slot khác.');
            return;
        }

        let quantity = parseInt(slotQuantity || '1', 10);
        if (Number.isNaN(quantity) || quantity < 1) quantity = 1;
        if (quantity > remainingCapacity) {
            alert(`Số lượng tối đa có thể đặt cho slot này là ${remainingCapacity}. Vui lòng giảm số lượng.`);
            return;
        }

        const selectedSlot = selectedService.slots.find(s => s.id === selectedSlotId);

        if (!selectedSlot) {
            console.error('[ServiceSalesPage] Lỗi: Slot không hợp lệ', { selectedSlotId, serviceId: selectedService.id });
            alert('Slot không hợp lệ');
            return;
        }

        // Use slot price if available and valid, otherwise use service base_price
        // Ensure price is a number and not null/undefined
        const slotPriceNum = selectedSlot.price != null ? Number(selectedSlot.price) : null;
        const price = (slotPriceNum != null && slotPriceNum > 0) ? slotPriceNum : (selectedService.base_price || 0);

        const item = {
            id: `svc-${selectedSlotId}-${selectedSlotDate}`,
            name: selectedService.name,
            price: price,
            quantity,
            slot_id: selectedSlotId,
            service_id: selectedService.id,
            booking_date: selectedSlotDate // Lưu ngày đã chọn
        };

        try {
            const current = getCartItems();
            const idx = current.findIndex(i => i.id === item.id);
            let next;
            if (idx >= 0) {
                next = [...current];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            } else {
                next = [...current, item];
            }
            notifyCartChanged(next);
            setSlotModalOpen(false);
            setSelectedService(null);
            setSelectedSlotId(null);
            setSelectedSlotDate(null);
        } catch (e) {
            console.error('[ServiceSalesPage] Lỗi khi thêm vào giỏ hàng:', e);
            try {
                notifyCartChanged([item]);
                setSlotModalOpen(false);
                setSelectedService(null);
                setSelectedSlotId(null);
                setSelectedSlotDate(null);
            } catch (err) {
                console.error('[ServiceSalesPage] Lỗi nghiêm trọng khi xử lý giỏ hàng:', err);
            }
        }
    };

    const getDayOfWeekLabel = (day) => {
        const days = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        };
        return days[day] || day;
    };

    // Get dates for day_of_week in next 4 weeks (giống BookingDateModal)
    const getDatesForDayOfWeek = (dayOfWeek) => {
        const dates = [];
        const dayMap = {
            'MONDAY': 1,
            'TUESDAY': 2,
            'WEDNESDAY': 3,
            'THURSDAY': 4,
            'FRIDAY': 5,
            'SATURDAY': 6,
            'SUNDAY': 0
        };

        const targetDay = dayMap[dayOfWeek];
        if (targetDay === undefined) return dates;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get next 4 occurrences of this day
        for (let week = 0; week < 4; week++) {
            const current = new Date(today);
            const currentDay = current.getDay();
            let daysUntilTarget = (targetDay - currentDay + 7) % 7;
            if (daysUntilTarget === 0 && week === 0) daysUntilTarget = 7; // If today is target day, get next week
            daysUntilTarget += week * 7;

            const targetDate = new Date(current);
            targetDate.setDate(current.getDate() + daysUntilTarget);

            // Only add future dates
            if (targetDate >= today) {
                dates.push(targetDate);
            }
        }

        return dates;
    };

    // Get available slots with dates (giống BookingDateModal)
    const getAvailableSlotsWithDates = () => {
        if (!slots || slots.length === 0) return [];

        const slotsWithDates = [];

        slots
            .filter(slot => slot && !slot.is_deleted && slot.service_status === 'AVAILABLE')
            .forEach(slot => {
                if (slot.specific_date) {
                    // Specific date slot
                    const date = new Date(slot.specific_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (date >= today) {
                        // Format date as YYYY-MM-DD using local timezone
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        // Find slot_availabilities for this date
                        const availability = slot.slot_availabilities?.find(
                            av => av.booking_date === dateStr
                        ) || null;

                        // Check if slot is full (booked_count >= max_capacity)
                        const maxCapacity = availability?.max_capacity ?? slot.max_capacity ?? 0;
                        const bookedCount = availability?.booked_count ?? 0;
                        const isFull = maxCapacity > 0 && bookedCount >= maxCapacity;

                        slotsWithDates.push({
                            slot,
                            date: dateStr,
                            dateObj: date,
                            isAvailable: !isFull,
                            availability
                        });
                    }
                } else if (slot.day_of_week) {
                    // Recurring slot - get dates for next 4 weeks
                    const dates = getDatesForDayOfWeek(slot.day_of_week);
                    dates.forEach(dateObj => {
                        // Format date as YYYY-MM-DD using local timezone
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        // Find slot_availabilities for this date
                        const availability = slot.slot_availabilities?.find(
                            av => av.booking_date === dateStr
                        ) || null;

                        // Check if slot is full (booked_count >= max_capacity)
                        const maxCapacity = availability?.max_capacity ?? slot.max_capacity ?? 0;
                        const bookedCount = availability?.booked_count ?? 0;
                        const isFull = maxCapacity > 0 && bookedCount >= maxCapacity;

                        slotsWithDates.push({
                            slot,
                            date: dateStr,
                            dateObj,
                            isAvailable: !isFull,
                            availability
                        });
                    });
                }
            });

        // Remove duplicates: same slot.id + date combination
        const uniqueSlots = [];
        const seenKeys = new Set();

        slotsWithDates.forEach(item => {
            const key = `${item.slot.id}-${item.date}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueSlots.push(item);
            }
        });

        // Sort by date, then by start_time
        return uniqueSlots.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return (a.slot.start_time || '').localeCompare(b.slot.start_time || '');
        });
    };

    return (
        <Box sx={{ py: 3, backgroundColor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh' }}>
            <Container maxWidth="xl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', color: COLORS.ERROR[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Bán dịch vụ</Typography>
                    <Badge color="error" badgeContent={cartCount} showZero>
                        <Button startIcon={<ShoppingCart />} variant="contained" color="error" onClick={() => navigate('/sales/cart')}>
                            Giỏ hàng
                        </Button>
                    </Badge>
                </Stack>

                <TextField fullWidth placeholder="Tìm dịch vụ..." value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ mb: 2 }} />

                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

                <Box sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                        xs: 'repeat(1, 1fr)',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(4, 1fr)'
                    }
                }}>
                    {filtered.map(s => (
                        <Box key={s.id} sx={{ height: '100%' }}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    height: '100%',
                                    overflow: 'hidden',
                                    boxShadow: 6,
                                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 10, cursor: 'pointer' },
                                    display: 'flex', flexDirection: 'column'
                                }}
                                onClick={() => handleCardClick(s)}
                            >
                                <Box sx={{ width: '100%', height: 180, position: 'relative', flexShrink: 0, backgroundColor: alpha(COLORS.ERROR[50], 0.3) }}>
                                    {s.image_url ? (
                                        <Box component="img" src={s.image_url} alt={s.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Box sx={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[100], 0.5)} 0%, ${alpha(COLORS.SECONDARY[100], 0.5)} 100%)`
                                        }}>
                                            <Pets sx={{ fontSize: 64, color: COLORS.ERROR[400], opacity: 0.6 }} />
                                        </Box>
                                    )}
                                </Box>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, position: 'relative', pb: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{s.name}</Typography>
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.9375rem', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40, lineHeight: 1.5, fontWeight: 400 }}>
                                        {s.description || 'Dịch vụ tại Pet Cafe'}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: COLORS.ERROR[600], mb: 1, letterSpacing: '-0.01em' }}>{(s.base_price || 0).toLocaleString('vi-VN')} ₫</Typography>
                                    <Box sx={{ flexGrow: 1 }} />

                                    {/* Info Icon - Góc dưới */}
                                    <Tooltip title="Xem chi tiết">
                                        <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetailService(s);
                                                setShowDetails(true);
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 8,
                                                right: 8,
                                                border: `2px solid ${alpha(COLORS.ERROR[300], 0.5)}`,
                                                color: COLORS.ERROR[600],
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                '&:hover': {
                                                    backgroundColor: alpha(COLORS.ERROR[100], 0.8),
                                                    borderColor: COLORS.ERROR[400],
                                                    transform: 'scale(1.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Container>

            {/* Slot Selection Modal */}
            <Dialog
                open={slotModalOpen}
                onClose={() => {
                    setSlotModalOpen(false);
                    setSelectedService(null);
                    setSelectedSlotId(null);
                    setSelectedSlotDate(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        boxShadow: 6,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT,
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                {selectedService && (
                    <>
                        <DialogTitle sx={{
                            background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[600]} 100%)`,
                            color: 'white',
                            py: 2
                        }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {(() => {
                                        const hasPetSlots = selectedService.slots && selectedService.slots.length > 0
                                            ? selectedService.slots.some(slot => slot?.pet_group_id || slot?.pet_id)
                                            : false;
                                        return hasPetSlots ? <Pets sx={{ fontSize: 24 }} /> : <Spa sx={{ fontSize: 24 }} />;
                                    })()}
                                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                                        Chọn slot - {selectedService.name}
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={() => {
                                        setSlotModalOpen(false);
                                        setSelectedService(null);
                                        setSelectedSlotId(null);
                                        setSelectedSlotDate(null);
                                    }}
                                    sx={{ color: 'white' }}
                                >
                                    <Close />
                                </IconButton>
                            </Stack>
                        </DialogTitle>
                        <DialogContent
                            sx={{
                                pt: 3,
                                pb: 2
                            }}
                            dividers
                        >
                            <Stack spacing={3}>
                                {/* Service Image */}
                                {selectedService.image_url && (
                                    <Box
                                        component="img"
                                        src={selectedService.image_url || (selectedService.thumbnails && selectedService.thumbnails[0]) || ''}
                                        alt={selectedService.name}
                                        sx={{
                                            width: '100%',
                                            height: 200,
                                            objectFit: 'cover',
                                            borderRadius: 3
                                        }}
                                        onError={(e) => {
                                            if (selectedService.image_url && selectedService.thumbnails && selectedService.thumbnails[0]) {
                                                e.target.src = selectedService.thumbnails[0];
                                            }
                                        }}
                                    />
                                )}

                                {/* Service Description */}
                                {selectedService.description && (
                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, lineHeight: 1.6 }}>
                                        {selectedService.description}
                                    </Typography>
                                )}

                                {/* Service Basic Info */}
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 2,
                                    p: 2.5,
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.3),
                                    borderRadius: 3
                                }}>
                                    <Box>
                                        <Typography variant="subtitle2" color={COLORS.ERROR[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                            Giá cơ bản
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                            {(selectedService.base_price || 0).toLocaleString('vi-VN')} ₫
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color={COLORS.ERROR[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                            Thời lượng
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedService.duration_minutes ? (
                                                selectedService.duration_minutes < 60
                                                    ? `${selectedService.duration_minutes} phút`
                                                    : `${Math.floor(selectedService.duration_minutes / 60)} giờ ${selectedService.duration_minutes % 60 > 0 ? `${selectedService.duration_minutes % 60} phút` : ''}`
                                            ) : 'Không xác định'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider />

                                {/* Slot Selection */}
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: COLORS.TEXT.PRIMARY, fontSize: '1rem' }}>
                                        Chọn slot khả dụng:
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2
                                    }}>
                                        {loadingSlots ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                                                <CircularProgress />
                                            </Box>
                                        ) : (() => {
                                            const availableSlots = getAvailableSlotsWithDates();
                                            if (availableSlots.length === 0) {
                                                return (
                                                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: alpha(COLORS.GRAY[50], 0.5) }}>
                                                        <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            Không có slot nào khả dụng cho dịch vụ này
                                                        </Typography>
                                                    </Paper>
                                                );
                                            }
                                            return availableSlots.map((item, index) => {
                                                const isAvailable = item.isAvailable;
                                                // Chỉ được chọn 1 slot + date duy nhất (không phải tất cả slots cùng id)
                                                const isSelected = selectedSlotId === item.slot.id && selectedSlotDate === item.date;
                                                // Ensure price is a number and not null/undefined
                                                const slotPriceNum = item.slot.price != null ? Number(item.slot.price) : null;
                                                const slotPrice = (slotPriceNum != null && slotPriceNum > 0) ? slotPriceNum : (selectedService.base_price || 0);

                                                // Check if slot is full
                                                const maxCapacity = item.availability?.max_capacity ?? item.slot.max_capacity ?? 0;
                                                const bookedCount = item.availability?.booked_count ?? 0;
                                                const isFull = maxCapacity > 0 && bookedCount >= maxCapacity;

                                                return (
                                                    <Paper
                                                        key={`${item.slot.id}-${item.date}-${index}`}
                                                        onClick={() => {
                                                            if (isAvailable && !isFull) {
                                                                // Chọn slot này và ngày này, bỏ chọn các slot khác
                                                                setSelectedSlotId(item.slot.id);
                                                                setSelectedSlotDate(item.date);
                                                            }
                                                        }}
                                                        elevation={0}
                                                        sx={{
                                                            p: 3,
                                                            border: `2px solid ${isSelected
                                                                ? COLORS.ERROR[600]
                                                                : isFull
                                                                    ? COLORS.ERROR[300]
                                                                    : isAvailable
                                                                        ? alpha(COLORS.ERROR[300], 0.5)
                                                                        : alpha(COLORS.GRAY[300], 0.3)}`,
                                                            borderRadius: 2,
                                                            cursor: (isAvailable && !isFull) ? 'pointer' : 'not-allowed',
                                                            opacity: (isAvailable && !isFull) ? 1 : 0.6,
                                                            bgcolor: isSelected
                                                                ? alpha(COLORS.ERROR[50], 0.8)
                                                                : isFull
                                                                    ? alpha(COLORS.ERROR[50], 0.3)
                                                                    : 'transparent',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': (isAvailable && !isFull) ? {
                                                                borderColor: COLORS.ERROR[600],
                                                                bgcolor: alpha(COLORS.ERROR[50], 0.5),
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[300], 0.3)}`
                                                            } : {}
                                                        }}
                                                    >
                                                        <Stack spacing={2}>
                                                            {/* Header with Status and Price */}
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                                    <Chip
                                                                        label={
                                                                            isFull
                                                                                ? 'Hết chỗ'
                                                                                : isAvailable
                                                                                    ? 'Có sẵn'
                                                                                    : 'Không khả dụng'
                                                                        }
                                                                        size="small"
                                                                        color={isFull ? 'error' : isAvailable ? 'success' : 'default'}
                                                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                                    />
                                                                    {isSelected && (
                                                                        <CheckCircle sx={{ color: COLORS.ERROR[600], fontSize: 22 }} />
                                                                    )}
                                                                </Stack>
                                                                {slotPrice > 0 && (
                                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600], fontSize: '1.25rem' }}>
                                                                        {slotPrice.toLocaleString('vi-VN')} ₫
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            {/* Date */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <CalendarToday sx={{ fontSize: 20, color: (isAvailable && !isFull) ? COLORS.ERROR[500] : COLORS.GRAY[400] }} />
                                                                <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1rem' }}>
                                                                    {item.dateObj.toLocaleDateString('vi-VN', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </Typography>
                                                            </Box>

                                                            {/* Time Range */}
                                                            {item.slot.start_time && item.slot.end_time && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <AccessTime sx={{ fontSize: 20, color: (isAvailable && !isFull) ? COLORS.ERROR[500] : COLORS.GRAY[400] }} />
                                                                    <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.9375rem' }}>
                                                                        {item.slot.start_time.substring(0, 5)} - {item.slot.end_time.substring(0, 5)}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {/* Max Capacity */}
                                                            {item.slot.max_capacity !== null && item.slot.max_capacity !== undefined && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <People sx={{ fontSize: 20, color: (isAvailable && !isFull) ? COLORS.ERROR[500] : COLORS.GRAY[400] }} />
                                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                                        Sức chứa tối đa: <strong style={{ color: COLORS.TEXT.PRIMARY }}>{item.slot.max_capacity}</strong> {(() => {
                                                                            const hasPetSlots = selectedService.slots && selectedService.slots.length > 0
                                                                                ? selectedService.slots.some(s => s?.pet_group_id || s?.pet_id)
                                                                                : false;
                                                                            return hasPetSlots ? 'chỗ' : 'người';
                                                                        })()}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {/* Slot Availability Info */}
                                                            {item.availability && (
                                                                <Box sx={{
                                                                    p: 2,
                                                                    borderRadius: 1.5,
                                                                    backgroundColor: isFull
                                                                        ? alpha(COLORS.ERROR[50], 0.5)
                                                                        : alpha(COLORS.SUCCESS[50], 0.5),
                                                                    border: `1px solid ${isFull
                                                                        ? alpha(COLORS.ERROR[200], 0.3)
                                                                        : alpha(COLORS.SUCCESS[200], 0.3)}`
                                                                }}>
                                                                    <Stack spacing={1}>
                                                                        <Typography variant="subtitle2" fontWeight="bold" sx={{
                                                                            color: isFull ? COLORS.ERROR[700] : COLORS.SUCCESS[700],
                                                                            mb: 0.5,
                                                                            fontSize: '0.8125rem'
                                                                        }}>
                                                                            Thông tin đặt chỗ
                                                                        </Typography>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                            <People sx={{ fontSize: 18, color: isFull ? COLORS.ERROR[600] : COLORS.SUCCESS[600] }} />
                                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                                                Đã đặt: <strong style={{ color: COLORS.TEXT.PRIMARY }}>{item.availability.booked_count}</strong> / <strong style={{ color: COLORS.TEXT.PRIMARY }}>{item.availability.max_capacity}</strong> {(() => {
                                                                                    const hasPetSlots = selectedService.slots && selectedService.slots.length > 0
                                                                                        ? selectedService.slots.some(s => s?.pet_group_id || s?.pet_id)
                                                                                        : false;
                                                                                    return hasPetSlots ? 'chỗ' : 'người';
                                                                                })()}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </Box>
                                                            )}

                                                            {/* Pet Group Info */}
                                                            {item.slot.pet_group && (
                                                                <Box sx={{
                                                                    p: 2,
                                                                    borderRadius: 1.5,
                                                                    backgroundColor: alpha(COLORS.INFO[50], 0.4),
                                                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.4)}`
                                                                }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                                                                        <Pets sx={{ fontSize: 20, color: COLORS.INFO[600], mt: 0.25 }} />
                                                                        <Box>
                                                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.INFO[700], fontSize: '0.875rem' }}>
                                                                                Nhóm thú cưng: {item.slot.pet_group.name}
                                                                            </Typography>
                                                                            {item.slot.pet_group.description && (
                                                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                                                                                    {item.slot.pet_group.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            )}

                                                            {/* Special Notes */}
                                                            {item.slot.special_notes && (
                                                                <Box sx={{
                                                                    p: 2,
                                                                    borderRadius: 1.5,
                                                                    backgroundColor: alpha(COLORS.WARNING[50], 0.5),
                                                                    border: `1px solid ${alpha(COLORS.WARNING[200], 0.4)}`
                                                                }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                                                                        <Note sx={{ fontSize: 20, color: COLORS.WARNING[600], mt: 0.25 }} />
                                                                        <Box>
                                                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.WARNING[700], fontSize: '0.875rem' }}>
                                                                                Ghi chú đặc biệt:
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                                                                                {item.slot.special_notes}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                );
                                            });
                                        })()}
                                    </Box>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 2, alignItems: 'center' }}>
                            {/* Số lượng chỗ muốn đặt */}
                            {(() => {
                                const remaining = getSelectedRemainingCapacity();
                                if (remaining == null) return null;
                                return (
                                    <TextField
                                        type="number"
                                        label="Số lượng chỗ"
                                        size="small"
                                        value={slotQuantity}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === '') {
                                                setSlotQuantity('');
                                                return;
                                            }
                                            let n = parseInt(raw, 10);
                                            if (Number.isNaN(n) || n < 1) n = 1;
                                            if (remaining > 0 && n > remaining) n = remaining;
                                            setSlotQuantity(String(n));
                                        }}
                                        InputProps={{
                                            inputProps: {
                                                min: 1,
                                                ...(remaining > 0 ? { max: remaining } : {})
                                            }
                                        }}
                                        helperText={`Tối đa còn lại: ${remaining}`}
                                        sx={{ width: 160, mr: 'auto' }}
                                    />
                                );
                            })()}

                            <Button
                                onClick={() => {
                                    setSlotModalOpen(false);
                                    setSelectedService(null);
                                    setSelectedSlotId(null);
                                    setSelectedSlotDate(null);
                                    setSlotQuantity('1');
                                }}
                                color="inherit"
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleAddToCart}
                                disabled={!selectedSlotId || !selectedSlotDate || (getSelectedRemainingCapacity() ?? 0) <= 0}
                                startIcon={<ShoppingCart />}
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.ERROR[700]} 100%)`
                                    }
                                }}
                            >
                                Thêm vào giỏ
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Service Details Modal */}
            <Dialog
                open={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setDetailService(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT
                    }
                }}
            >
                {detailService && (
                    <>
                        <DialogTitle sx={{
                            background: `linear-gradient(135deg, 
                                ${COLORS.ERROR[500]} 0%, 
                                ${COLORS.ERROR[600]} 100%
                            )`,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {(() => {
                                    const hasPetSlots = detailService.slots && detailService.slots.length > 0
                                        ? detailService.slots.some(slot => slot?.pet_group_id || slot?.pet_id)
                                        : false;
                                    return hasPetSlots ? <Pets sx={{ fontSize: 24 }} /> : <Spa sx={{ fontSize: 24 }} />;
                                })()}
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                                    {detailService.name}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => {
                                    setShowDetails(false);
                                    setDetailService(null);
                                }}
                                sx={{ color: 'white' }}
                            >
                                <Close />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                {/* Service Image */}
                                {detailService.image_url && (
                                    <Box
                                        component="img"
                                        src={detailService.image_url || (detailService.thumbnails && detailService.thumbnails[0]) || ''}
                                        alt={detailService.name}
                                        sx={{
                                            width: '100%',
                                            height: 250,
                                            objectFit: 'cover',
                                            borderRadius: 3
                                        }}
                                        onError={(e) => {
                                            if (detailService.image_url && detailService.thumbnails && detailService.thumbnails[0]) {
                                                e.target.src = detailService.thumbnails[0];
                                            } else {
                                                e.target.src = `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`;
                                            }
                                        }}
                                    />
                                )}

                                {/* Description */}
                                {detailService.description && (
                                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {detailService.description}
                                    </Typography>
                                )}

                                {/* Service Type Info */}
                                {(() => {
                                    const hasPetSlots = detailService.slots && detailService.slots.length > 0
                                        ? detailService.slots.some(slot => slot?.pet_group_id || slot?.pet_id)
                                        : false;
                                    return (
                                        <Box sx={{
                                            p: 3,
                                            backgroundColor: hasPetSlots ?
                                                alpha(COLORS.INFO[100], 0.3) :
                                                alpha(COLORS.WARNING[100], 0.3),
                                            borderRadius: 3,
                                            border: `2px solid ${hasPetSlots ?
                                                alpha(COLORS.INFO[300], 0.5) :
                                                alpha(COLORS.WARNING[300], 0.5)}`,
                                            mb: 3
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                {hasPetSlots ? (
                                                    <Pets sx={{ fontSize: 24, color: COLORS.INFO[500] }} />
                                                ) : (
                                                    <Spa sx={{ fontSize: 24, color: COLORS.WARNING[500] }} />
                                                )}
                                                <Typography variant="h6" sx={{
                                                    color: hasPetSlots ? COLORS.INFO[700] : COLORS.WARNING[700],
                                                    fontWeight: 'bold'
                                                }}>
                                                    {hasPetSlots ? '🐕 Chăm sóc pet' : '🐾 Dịch vụ của cửa hàng'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {hasPetSlots ?
                                                    'Cần mang theo pet của bạn để thực hiện dịch vụ' :
                                                    'Sử dụng pet của cafe - Không cần mang theo pet của bạn'}
                                            </Typography>
                                        </Box>
                                    );
                                })()}

                                {/* Service Basic Info */}
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 2,
                                    p: 3,
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.3),
                                    borderRadius: 3
                                }}>
                                    <Box>
                                        <Typography variant="subtitle2" color={COLORS.ERROR[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                            Giá cơ bản
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                            {(detailService.base_price || 0).toLocaleString('vi-VN')} ₫
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color={COLORS.ERROR[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                            Thời lượng
                                        </Typography>
                                        <Typography variant="body1">
                                            {detailService.duration_minutes ? (
                                                detailService.duration_minutes < 60
                                                    ? `${detailService.duration_minutes} phút`
                                                    : `${Math.floor(detailService.duration_minutes / 60)} giờ ${detailService.duration_minutes % 60 > 0 ? `${detailService.duration_minutes % 60} phút` : ''}`
                                            ) : 'Không xác định'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Available Slots */}
                                {detailService.slots && detailService.slots.length > 0 && (
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 2, color: COLORS.ERROR[700], fontWeight: 'bold' }}>
                                            Lịch trình có sẵn
                                        </Typography>
                                        <Stack spacing={2}>
                                            {detailService.slots
                                                .filter(slot => slot && !slot.is_deleted)
                                                .map((slot, index) => {
                                                    // Ensure price is a number and not null/undefined
                                                    const slotPriceNum = slot.price != null ? Number(slot.price) : null;
                                                    const slotPrice = (slotPriceNum != null && slotPriceNum > 0) ? slotPriceNum : (detailService.base_price || 0);
                                                    const isAvailable = slot.service_status === 'AVAILABLE';

                                                    return (
                                                        <Box
                                                            key={slot.id || index}
                                                            sx={{
                                                                p: 2.5,
                                                                borderRadius: 2,
                                                                border: `2px solid ${isAvailable ? alpha(COLORS.ERROR[300], 0.5) : alpha(COLORS.GRAY[300], 0.3)}`,
                                                                backgroundColor: isAvailable ? alpha(COLORS.ERROR[50], 0.5) : alpha(COLORS.GRAY[50], 0.3),
                                                                opacity: isAvailable ? 1 : 0.6
                                                            }}
                                                        >
                                                            <Stack spacing={1.5}>
                                                                {/* Status Badge */}
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Chip
                                                                        label={isAvailable ? 'Có sẵn' : 'Không khả dụng'}
                                                                        size="small"
                                                                        color={isAvailable ? 'success' : 'default'}
                                                                        sx={{ fontWeight: 'bold' }}
                                                                    />
                                                                    {slotPrice > 0 && (
                                                                        <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                                                            {slotPrice.toLocaleString('vi-VN')} ₫
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                {/* Day of Week */}
                                                                {slot.day_of_week && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CalendarToday sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                                        <Typography variant="body1" fontWeight={600}>
                                                                            {WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                                        </Typography>
                                                                        {slot.is_recurring && (
                                                                            <Chip label="Lặp lại" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                                                        )}
                                                                    </Box>
                                                                )}

                                                                {/* Specific Date */}
                                                                {slot.specific_date && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CalendarToday sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                                        <Typography variant="body1">
                                                                            Ngày: {new Date(slot.specific_date).toLocaleDateString('vi-VN')}
                                                                        </Typography>
                                                                    </Box>
                                                                )}

                                                                {/* Time Range */}
                                                                {slot.start_time && slot.end_time && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <AccessTime sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                                        <Typography variant="body1">
                                                                            {slot.start_time} - {slot.end_time}
                                                                        </Typography>
                                                                    </Box>
                                                                )}

                                                                {/* Max Capacity */}
                                                                {slot.max_capacity !== null && slot.max_capacity !== undefined && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <People sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Sức chứa tối đa: <strong>{slot.max_capacity}</strong> {(() => {
                                                                                const hasPetSlots = detailService.slots && detailService.slots.length > 0
                                                                                    ? detailService.slots.some(s => s?.pet_group_id || s?.pet_id)
                                                                                    : false;
                                                                                return hasPetSlots ? 'thú cưng' : 'người';
                                                                            })()}
                                                                        </Typography>
                                                                    </Box>
                                                                )}

                                                                {/* Pet Group Info */}
                                                                {slot.pet_group && (
                                                                    <Box sx={{
                                                                        p: 1.5,
                                                                        borderRadius: 1,
                                                                        backgroundColor: alpha(COLORS.INFO[100], 0.3),
                                                                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                                            <Pets sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.25 }} />
                                                                            <Box>
                                                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                                                                    Nhóm thú cưng: {slot.pet_group.name}
                                                                                </Typography>
                                                                                {slot.pet_group.description && (
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        {slot.pet_group.description}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                )}

                                                                {/* Special Notes */}
                                                                {slot.special_notes && (
                                                                    <Box sx={{
                                                                        p: 1.5,
                                                                        borderRadius: 1,
                                                                        backgroundColor: alpha(COLORS.WARNING[50], 0.5),
                                                                        border: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                                            <Note sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.25 }} />
                                                                            <Box>
                                                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.WARNING[700] }}>
                                                                                    Ghi chú đặc biệt:
                                                                                </Typography>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {slot.special_notes}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                    );
                                                })}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Task Information */}
                                {detailService.task && (
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 2, color: COLORS.ERROR[700], fontWeight: 'bold' }}>
                                            Thông tin nhiệm vụ
                                        </Typography>
                                        <Box sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            backgroundColor: alpha(COLORS.ERROR[50], 0.5),
                                            border: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`
                                        }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                                {detailService.task.title}
                                            </Typography>
                                            {detailService.task.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                    {detailService.task.description}
                                                </Typography>
                                            )}
                                            {detailService.task.estimated_hours && (
                                                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccessTime sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Thời gian ước tính: <strong>{detailService.task.estimated_hours} giờ</strong>
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, gap: 2 }}>
                            <Button
                                onClick={() => {
                                    setShowDetails(false);
                                    setDetailService(null);
                                }}
                                sx={{
                                    color: COLORS.GRAY[600],
                                    '&:hover': {
                                        backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                                    }
                                }}
                            >
                                Đóng
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => {
                                    setShowDetails(false);
                                    setDetailService(null);
                                    handleCardClick(detailService);
                                }}
                            >
                                Chọn slot
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default ServiceSalesPage;



