import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Paper,
    Chip,
    alpha,
    CircularProgress
} from '@mui/material';
import {
    CalendarToday,
    AccessTime,
    People,
    Note,
    Pets
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';
import serviceApi from '../../api/serviceApi';

const BookingDateModal = ({ open, onClose, service, onConfirm }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [petGroupsMap, setPetGroupsMap] = useState({});

    // Get dates for day_of_week in next 4 weeks
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

    // Fetch slots from API
    useEffect(() => {
        const loadSlots = async () => {
            if (!open || !service?.id) {
                setSlots([]);
                return;
            }

            setLoading(true);
            try {
                // Fetch all slots (use a high limit to get all slots)
                const result = await serviceApi.getSlotsByServiceId(service.id, { page: 0, limit: 100 });
                const fetchedSlots = result.data || [];
                setSlots(fetchedSlots);

                // Collect unique pet_group ids from slots and fetch details
                try {
                    const token = localStorage.getItem('authToken');
                    const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' };
                    const petGroupIds = Array.from(new Set(fetchedSlots.map(s => s?.pet_group?.id).filter(Boolean)));
                    if (petGroupIds.length > 0) {
                        const map = {};
                        await Promise.all(petGroupIds.map(async (id) => {
                            try {
                                const resp = await fetch(`https://petcafes.azurewebsites.net/api/pet-groups/${id}`, { headers });
                                if (!resp.ok) {
                                    console.warn('[BookingDateModal] pet-group fetch failed', id, resp.status);
                                    return;
                                }
                                const json = await resp.json();
                                // API may return group in json.data or full object
                                const group = json?.data || json || null;
                                if (group) map[id] = group;
                            } catch (e) {
                                console.error('[BookingDateModal] error fetching pet-group', id, e);
                            }
                        }));
                        setPetGroupsMap(map);
                    }
                } catch (e) {
                    console.error('[BookingDateModal] error fetching pet-groups', e);
                }
            } catch (error) {
                console.error('[BookingDateModal] Error loading slots:', error);
                setSlots([]);
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [open, service?.id]);

    // Get available slots with dates
    const getAvailableSlotsWithDates = () => {
        if (!slots || slots.length === 0) return [];
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const results = [];
        const dedupeMap = new Map(); // key = slotId + date
    
        const formatDate = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
    
        const isSlotFull = (slot, availability) => {
            const max = availability?.max_capacity ?? slot.max_capacity ?? 0;
            const booked = availability?.booked_count ?? 0;
            return max > 0 && booked >= max;
        };
    
        /**
         * 1️⃣ Xử lý slot CÓ specific_date (ưu tiên)
         */
        slots
            .filter(s => s && !s.is_deleted && s.service_status === 'AVAILABLE' && s.specific_date)
            .forEach(slot => {
                const dateObj = new Date(slot.specific_date);
                if (dateObj < today) return;
    
                const dateStr = formatDate(dateObj);
                const availability = slot.slot_availabilities?.find(
                    av => av.booking_date === dateStr
                ) || null;
    
                const isAvailable = !isSlotFull(slot, availability);
                const key = `${slot.id}-${dateStr}`;
    
                dedupeMap.set(key, {
                    slot,
                    date: dateStr,
                    dateObj,
                    availability,
                    isAvailable
                });
            });
    
        /**
         * 2️⃣ Xử lý slot RECURRING (day_of_week)
         *    ❌ KHÔNG sinh nếu ngày đó đã có specific_date
         */
        slots
            .filter(s => s && !s.is_deleted && s.service_status === 'AVAILABLE' && !s.specific_date && s.day_of_week)
            .forEach(slot => {
                const dates = getDatesForDayOfWeek(slot.day_of_week);
    
                dates.forEach(dateObj => {
                    if (dateObj < today) return;
    
                    const dateStr = formatDate(dateObj);
                    const key = `${slot.id}-${dateStr}`;
    
                    // ⛔ Bỏ qua nếu đã có slot specific_date
                    if (dedupeMap.has(key)) return;
    
                    const availability = slot.slot_availabilities?.find(
                        av => av.booking_date === dateStr
                    ) || null;
    
                    const isAvailable = !isSlotFull(slot, availability);
    
                    dedupeMap.set(key, {
                        slot,
                        date: dateStr,
                        dateObj,
                        availability,
                        isAvailable
                    });
                });
            });
    
        /**
         * 3️⃣ Sort theo ngày → giờ
         */
        return Array.from(dedupeMap.values()).sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return (a.slot.start_time || '').localeCompare(b.slot.start_time || '');
        });
    };
    
    const handleSlotSelect = (item) => {
        if (item.isAvailable) {
            setSelectedDate(item.date);
            setSelectedSlot(item.slot);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate || !selectedSlot) {
            return;
        }
        onConfirm(selectedSlot, selectedDate);
        // Reset state
        setSelectedDate('');
        setSelectedSlot(null);
    };

    const handleClose = () => {
        setSelectedDate('');
        setSelectedSlot(null);
        onClose();
    };

    const availableSlots = getAvailableSlotsWithDates();

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW?.DARK || COLORS.GRAY[900], 0.3)}`
                }
            }}
        >
            <DialogTitle sx={{
                background: `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.SUCCESS[500]} 100%)`,
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <CalendarToday />
                Chọn ngày và khung giờ đặt lịch
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {service && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {service.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {service.description}
                        </Typography>
                    </Box>
                )}

                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                        Lịch trình có sẵn:
                    </Typography>
                    <Box sx={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px'
                        },
                        '&::-webkit-scrollbar-track': {
                            background: COLORS.GRAY[50]
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: COLORS.GRAY[300],
                            borderRadius: '4px',
                            '&:hover': {
                                background: COLORS.GRAY[400]
                            }
                        }
                    }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {availableSlots.map((item, index) => {
                                    const slotPrice = item.slot.price !== null && item.slot.price !== undefined
                                        ? item.slot.price
                                        : (service?.base_price || 0);

                                    return (
                                        <Paper
                                            key={`${item.slot.id}-${item.date}-${index}`}
                                            onClick={() => handleSlotSelect(item)}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 2,
                                                border: `2px solid ${selectedDate === item.date && selectedSlot?.id === item.slot.id
                                                    ? COLORS.SUCCESS[500]
                                                    : item.isAvailable
                                                        ? alpha(COLORS.INFO[300], 0.5)
                                                        : alpha(COLORS.GRAY[300], 0.3)
                                                    }`,
                                                backgroundColor: selectedDate === item.date && selectedSlot?.id === item.slot.id
                                                    ? alpha(COLORS.SUCCESS[50], 0.8)
                                                    : item.isAvailable
                                                        ? alpha(COLORS.INFO[50], 0.5)
                                                        : alpha(COLORS.GRAY[50], 0.3),
                                                opacity: item.isAvailable ? 1 : 0.5,
                                                cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s ease',
                                                '&:hover': item.isAvailable ? {
                                                    backgroundColor: alpha(COLORS.INFO[100], 0.7),
                                                    borderColor: COLORS.INFO[400],
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.3)}`
                                                } : {}
                                            }}
                                        >
                                            <Stack spacing={1.5}>
                                                {/* Status and Price */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip
                                                        label={
                                                            item.isAvailable
                                                                ? 'Có sẵn'
                                                                : (item.availability && item.availability.booked_count >= (item.availability.max_capacity ?? item.slot.max_capacity ?? 0))
                                                                    ? 'Hết chỗ'
                                                                    : 'Không khả dụng'
                                                        }
                                                        size="small"
                                                        color={item.isAvailable ? 'success' : 'error'}
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                    {slotPrice > 0 && (
                                                        <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                                            {formatPrice(slotPrice)}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {/* Date */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarToday sx={{ fontSize: 18, color: item.isAvailable ? COLORS.INFO[500] : COLORS.GRAY[400] }} />
                                                    <Typography variant="body1" fontWeight={600}>
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AccessTime sx={{ fontSize: 18, color: item.isAvailable ? COLORS.INFO[500] : COLORS.GRAY[400] }} />
                                                        <Typography variant="body1" fontWeight={600}>
                                                            {item.slot.start_time.substring(0, 5)} - {item.slot.end_time.substring(0, 5)}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* Max Capacity */}
                                                {item.slot.max_capacity !== null && item.slot.max_capacity !== undefined && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <People sx={{ fontSize: 18, color: item.isAvailable ? COLORS.INFO[500] : COLORS.GRAY[400] }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Sức chứa tối đa: <strong>{item.slot.max_capacity}</strong> chỗ
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* Slot Availability Info */}
                                                {item.availability && (
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        backgroundColor: alpha(COLORS.SUCCESS[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                                                    }}>
                                                        <Stack spacing={1}>
                                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: COLORS.SUCCESS[700], mb: 0.5 }}>
                                                                Thông tin đặt chỗ
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <People sx={{ fontSize: 16, color: COLORS.SUCCESS[600] }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Đã đặt: <strong style={{ color: COLORS.TEXT.PRIMARY }}>{item.availability.booked_count}</strong> / <strong style={{ color: COLORS.TEXT.PRIMARY }}>{item.availability.max_capacity}</strong> {service?.petRequired ? 'chỗ' : 'người'}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                )}

                                                {/* Pet Group Info */}
                                                {item.slot.pet_group && (
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        backgroundColor: alpha(COLORS.INFO[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                            <Pets sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.25 }} />
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.INFO[700] }}>
                                                                    Nhóm thú cưng: {item.slot.pet_group.name}
                                                                </Typography>
                                                                {item.slot.pet_group.description && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {item.slot.pet_group.description}
                                                                    </Typography>
                                                                )}
                                                                {/* show pet names from fetched pet-group details if available */}
                                                                {petGroupsMap[item.slot.pet_group.id]?.pets && petGroupsMap[item.slot.pet_group.id].pets.length > 0 && (
                                                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                        {petGroupsMap[item.slot.pet_group.id].pets.slice(0, 6).map(pet => (
                                                                            <Chip key={pet.id || pet.name} label={pet.name || 'Thú cưng'} size="small" sx={{ background: alpha(COLORS.SECONDARY[50], 0.7) }} />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                )}

                                                {/* Special Notes */}
                                                {item.slot.special_notes && (
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        backgroundColor: alpha(COLORS.WARNING[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                            <Note sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.25 }} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.slot.special_notes}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        )}
                        {!loading && availableSlots.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Không có lịch trình nào khả dụng
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        color: COLORS.GRAY[600],
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                        }
                    }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={!selectedDate || !selectedSlot}
                    sx={{
                        background: `linear-gradient(135deg, ${COLORS.SUCCESS[500]} 0%, ${COLORS.INFO[500]} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${COLORS.SUCCESS[600]} 0%, ${COLORS.INFO[600]} 100%)`
                        },
                        '&:disabled': {
                            background: alpha(COLORS.GRAY[300], 0.6),
                            color: COLORS.GRAY[500]
                        }
                    }}
                >
                    Xác nhận
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingDateModal;

