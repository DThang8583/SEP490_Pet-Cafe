import React, { useState } from 'react';
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
    alpha
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

const BookingDateModal = ({ open, onClose, service, onConfirm }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

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

    // Get available slots with dates
    const getAvailableSlotsWithDates = () => {
        if (!service || !service.slots) return [];
        
        const slotsWithDates = [];
        
        service.slots
            .filter(slot => slot && !slot.is_deleted)
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
                        
                        slotsWithDates.push({
                            slot,
                            date: dateStr,
                            dateObj: date,
                            isAvailable: slot.service_status === 'AVAILABLE'
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
                        
                        slotsWithDates.push({
                            slot,
                            date: dateStr,
                            dateObj,
                            isAvailable: slot.service_status === 'AVAILABLE'
                        });
                    });
                }
            });
        
        // Sort by date, then by start_time
        return slotsWithDates.sort((a, b) => {
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
                                            border: `2px solid ${
                                                selectedDate === item.date && selectedSlot?.id === item.slot.id
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
                                                    label={item.isAvailable ? 'Có sẵn' : 'Không khả dụng'}
                                                    size="small"
                                                    color={item.isAvailable ? 'success' : 'default'}
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
                                                {item.slot.is_recurring && (
                                                    <Chip label="Lặp lại" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                                )}
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
                                                        Sức chứa tối đa: <strong>{item.slot.max_capacity}</strong> {service?.petRequired ? 'chỗ' : 'người'}
                                                    </Typography>
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
                        {availableSlots.length === 0 && (
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

