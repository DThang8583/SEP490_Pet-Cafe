import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Tooltip
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { Pets } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

// CSS Animations
const pulse = keyframes`
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
`;

// Add global styles for animations
const globalStyles = `
    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.7;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

// Inject global styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
}

const CalendarGrid = ({ formData, onSlotSelect, availableSlots, service }) => {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [selectedPeriod, setSelectedPeriod] = useState('morning');
    const scrollContainerRef = useRef(null);

    const isCafe = service?.petRequired === false;
    const periodStart = service?.serviceStartDate ? new Date(service.serviceStartDate) : null;
    const periodEnd = service?.serviceEndDate ? new Date(service.serviceEndDate) : null;

    // Ensure currentWeek falls within cafe period on mount/update
    useEffect(() => {
        if (!isCafe || !periodStart || !periodEnd) return;
        const cw = new Date(currentWeek);
        const cwStart = new Date(cw);
        cwStart.setDate(cw.getDate() - cw.getDay() + 1);
        const cwEnd = new Date(cwStart);
        cwEnd.setDate(cwStart.getDate() + 6);

        if (cwEnd < periodStart || cwStart > periodEnd) {
            // Jump to periodStart's week
            const startWeek = new Date(periodStart);
            setCurrentWeek(startWeek);
        }
    }, [isCafe, periodStart, periodEnd]);

    // Calendar functions
    const getWeekDates = (date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            weekDates.push(day);
        }
        return weekDates;
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const navigateWeek = (direction) => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(currentWeek.getDate() + (direction * 7));

        // Business Rule: Chỉ ngăn chặn khi tuần mới hoàn toàn đã qua (tất cả slot đều closed)
        const weekDates = getWeekDates(newWeek);
        // Cafe service: block navigation outside period entirely
        if (isCafe && periodStart && periodEnd) {
            const newStart = weekDates[0];
            const newEnd = weekDates[6];
            if (newEnd < periodStart || newStart > periodEnd) {
                return;
            }
        }
        let hasBookableSlot = false;

        // Kiểm tra xem tuần mới có còn slot nào có thể đặt lịch không
        for (let date of weekDates) {
            const timeSlots = getTimeSlots();
            for (let time of timeSlots) {
                const availability = getSlotAvailability(date, time);
                // Chỉ khóa khi slot là 'closed' (đã qua hoặc admin khóa)
                if (availability !== 'closed') {
                    hasBookableSlot = true;
                    break;
                }
            }
            if (hasBookableSlot) break;
        }

        // Nếu tuần mới không còn slot nào có thể đặt lịch, không cho phép navigate
        if (!hasBookableSlot) {
            return; // Không cho phép navigate
        }

        setCurrentWeek(newWeek);
    };

    const getTimeSlots = () => {
        // If cafe service, derive fixed sessions per day
        const isCafe = service?.petRequired === false;
        if (isCafe) {
            const startMinutes = service?.serviceStartTime ?? 9 * 60; // default 09:00
            const endMinutes = service?.serviceEndTime ?? 17 * 60;   // default 17:00
            const sessionDuration = service?.sessionDurationMinutes ?? 90; // default 90 minutes/ca
            const sessionsPerDay = service?.sessionsPerDay; // optional explicit number per day

            const out = [];
            if (sessionsPerDay && sessionsPerDay > 0) {
                let m = startMinutes;
                for (let i = 0; i < sessionsPerDay; i++) {
                    if (m + sessionDuration > endMinutes) break; // avoid overflow beyond window
                    const hh = String(Math.floor(m / 60)).padStart(2, '0');
                    const mm = String(m % 60).padStart(2, '0');
                    out.push(`${hh}:${mm}`);
                    m += sessionDuration;
                }
            } else {
                // Fill sequentially by duration within window
                for (let m = startMinutes; m + sessionDuration <= endMinutes; m += sessionDuration) {
                    const hh = String(Math.floor(m / 60)).padStart(2, '0');
                    const mm = String(m % 60).padStart(2, '0');
                    out.push(`${hh}:${mm}`);
                }
            }
            return out;
        }
        // Default pet-care grid
        return [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
        ];
    };

    const scrollToPeriod = (period) => {
        setSelectedPeriod(period);
        if (scrollContainerRef.current) {
            const periodElement = scrollContainerRef.current.querySelector(`[data-period="${period}"]`);
            if (periodElement) {
                // Sử dụng scrollTop với offset để scroll chính xác
                const container = scrollContainerRef.current;
                const containerTop = container.offsetTop;
                const elementTop = periodElement.offsetTop;
                const scrollTop = elementTop - containerTop;
                container.scrollTop = scrollTop;
            }
        }
    };

    const getTimeSlotPeriod = (time) => {
        if (isCafe) return 'session';
        const hour = parseInt(time.split(':')[0]);
        const minute = parseInt(time.split(':')[1]);

        if (hour >= 8 && hour < 12) return 'morning';           // 8:00-11:59
        if (hour >= 12 && hour < 16) return 'afternoon';       // 12:00-15:59
        if (hour >= 16 && hour < 20) return 'evening';          // 16:00-19:59
        return 'morning';
    };

    const getPeriodInfo = (period) => {
        switch (period) {
            case 'morning': return { label: 'Buổi sáng', emoji: '🌅', color: COLORS.WARNING[500] };
            case 'afternoon': return { label: 'Buổi chiều', emoji: '☀️', color: COLORS.INFO[500] };
            case 'evening': return { label: 'Buổi tối', emoji: '🌆', color: COLORS.PRIMARY[500] };
            case 'session': return { label: 'Các ca', emoji: '🗓️', color: COLORS.PRIMARY[500] };
            default: return { label: 'Buổi sáng', emoji: '🌅', color: COLORS.WARNING[500] };
        }
    };

    const getSlotAvailability = (date, time) => {
        const dateStr = date.toISOString().split('T')[0];
        const today = new Date();
        const now = new Date();

        // Cafe service: restrict to service period window
        const isCafe = service?.petRequired === false;
        if (isCafe) {
            if (service?.serviceStartDate && dateStr < service.serviceStartDate) return 'closed';
            if (service?.serviceEndDate && dateStr > service.serviceEndDate) return 'closed';
        }

        // Business Rule: Không thể đặt lịch cho ngày đã qua
        const isPastDate = date < today.setHours(0, 0, 0, 0);
        if (isPastDate) {
            console.log(`❌ Past date: ${dateStr} ${time}`);
            return 'closed';
        }

        // Business Rule: Không thể đặt lịch cho khung giờ đã qua trong ngày hôm nay
        if (date.toDateString() === today.toDateString()) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const slotHour = parseInt(time.split(':')[0]);
            const slotMinute = parseInt(time.split(':')[1]);

            // Tính toán thời gian hiện tại và thời gian slot (tính bằng phút)
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const slotTimeInMinutes = slotHour * 60 + slotMinute;

            // Nếu khung giờ đã qua trong ngày hôm nay (slot time < current time)
            if (slotTimeInMinutes < currentTimeInMinutes) {
                console.log(`❌ Past time: ${time} (current: ${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
                return 'closed';
            }

            // Business Rule: Phải đặt trước ít nhất 10 phút
            const timeDifference = slotTimeInMinutes - currentTimeInMinutes;
            if (timeDifference < 10) {
                console.log(`❌ Too close: ${time} (${timeDifference} minutes ahead)`);
                return 'closed';
            }
        }

        // Business Rule: Quán mở cửa từ 8:00 đến 20:00 (or service window for cafe)
        const slotHour = parseInt(time.split(':')[0]);
        const slotMinute = parseInt(time.split(':')[1]);

        if (!isCafe && (slotHour < 8 || slotHour >= 20)) {
            console.log(`❌ Outside hours: ${time} (shop hours: 8:00-20:00)`);
            return 'closed';
        }

        if (isCafe) {
            const startMinutes = service?.serviceStartTime ?? 9 * 60;
            const endMinutes = service?.serviceEndTime ?? 17 * 60;
            const t = slotHour * 60 + slotMinute;
            if (t < startMinutes || t >= endMinutes) {
                return 'closed';
            }
        }

        // REMOVED: Giờ nghỉ trưa - Quán mở cửa liên tục từ 8:00-20:00
        // if (slotHour === 12 && slotMinute < 30) {
        //     console.log(`❌ Lunch break: ${time}`);
        //     return 'closed';
        // }


        // Check if it's a closed day (Monday for example) - REMOVED FOR TESTING
        // if (date.getDay() === 1) {
        //     console.log(`❌ Closed day (Monday): ${dateStr} ${time}`);
        //     return 'closed';
        // }

        // REMOVED: Weekend restrictions - Cafe mở cửa tất cả các ngày trong tuần
        // if ((date.getDay() === 0 || date.getDay() === 6) && time >= '17:00') {
        //     console.log(`❌ Weekend evening: ${dateStr} ${time}`);
        //     return 'closed';
        // }

        // if ((date.getDay() === 0 || date.getDay() === 6) && getTimeSlotPeriod(time) === 'evening') {
        //     console.log(`❌ Weekend evening period: ${dateStr} ${time}`);
        //     return 'closed';
        // }

        // For demo purposes, make most slots available
        // In real app, this would check against actual availability
        const hour = parseInt(time.split(':')[0]);
        const minute = parseInt(time.split(':')[1]);

        // Make some slots unavailable for demo (distributed across periods)
        if (hour === 10 && minute === 0) {
            console.log(`❌ Demo unavailable: ${time}`);
            return 'unavailable'; // 10:00 unavailable (morning)
        }
        if (hour === 12 && minute === 30) {
            console.log(`❌ Demo unavailable: ${time}`);
            return 'unavailable'; // 12:30 unavailable (afternoon)
        }
        if (hour === 16 && minute === 0) {
            console.log(`❌ Demo unavailable: ${time}`);
            return 'unavailable'; // 16:00 unavailable (evening)
        }
        if (hour === 19 && minute === 30) {
            console.log(`❌ Demo unavailable: ${time}`);
            return 'unavailable'; // 19:30 unavailable (night)
        }

        // Check if slot is available from API
        const slot = availableSlots.find(s => s.time === time);
        if (!slot) {
            console.log(`✅ Available: ${dateStr} ${time}`);
            return 'available'; // Default to available if no API data
        }

        // Business Rule: Admin/Manager có thể khóa slot khi quán cần sửa chữa hoặc nghỉ lễ
        // Điều này được xử lý thông qua API availableSlots
        // Nếu slot bị admin/manager khóa, sẽ có trong availableSlots với status 'closed'
        if (slot.status === 'closed') {
            console.log(`❌ Admin/Manager closed: ${dateStr} ${time}`);
            return 'closed';
        }

        console.log(`✅ Available: ${dateStr} ${time}`);
        return 'available';
    };

    const getSlotSymbol = (availability) => {
        // Sử dụng PetsIcon thay vì emoji
        return 'pets';
    };

    const getSlotColor = (availability) => {
        switch (availability) {
            case 'available': return COLORS.SUCCESS[600];
            case 'unavailable': return COLORS.ERROR[600];
            case 'closed': return COLORS.GRAY[500];
            default: return COLORS.GRAY[500];
        }
    };

    const handleSlotClick = (date, time) => {
        const availability = getSlotAvailability(date, time);
        if (availability === 'available') {
            const dateStr = date.toISOString().split('T')[0];
            onSlotSelect(dateStr, time);
        }
    };

    // For cafe services: only show dates within service period
    const weekDates = getWeekDates(currentWeek);
    const shownDates = (() => {
        if (!(isCafe && periodStart && periodEnd)) return weekDates;
        const startDay = new Date(periodStart); startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(periodEnd); endDay.setHours(23, 59, 59, 999);
        return weekDates.filter(d => d >= startDay && d <= endDay);
    })();

    return (
        <Card sx={{
            borderRadius: 2,
            background: COLORS.BACKGROUND.DEFAULT,
            border: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}`,
            boxShadow: `0 2px 8px ${alpha(COLORS.GRAY[300], 0.1)}`,
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
                boxShadow: `0 4px 16px ${alpha(COLORS.GRAY[400], 0.15)}`
            }
        }}>
            <CardContent sx={{
                p: { xs: 2, sm: 3, md: 4 }
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    pb: 2,
                    borderBottom: `1px solid ${alpha(COLORS.GRAY[200], 0.3)}`
                }}>
                    <Typography variant="h6" sx={{
                        fontWeight: 600,
                        color: COLORS.TEXT.PRIMARY,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.01em'
                    }}>
                        Chọn ngày và giờ
                    </Typography>
                </Box>


                {/* Simple Week Navigation */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigateWeek(-1)}
                        disabled={(() => {
                            // Business Rule: Disable nút "Tuần trước" chỉ khi TẤT CẢ ngày và khung giờ trong tuần đã bị khóa
                            const today = new Date();
                            const weekDates = getWeekDates(currentWeek);

                            // Kiểm tra xem có còn slot nào có thể đặt lịch không (available hoặc unavailable)
                            for (let date of weekDates) {
                                const timeSlots = getTimeSlots();
                                for (let time of timeSlots) {
                                    const availability = getSlotAvailability(date, time);
                                    // Chỉ khóa khi slot là 'closed' (đã qua hoặc admin khóa)
                                    if (availability !== 'closed') {
                                        return false; // Còn slot có thể đặt lịch, không disable
                                    }
                                }
                            }

                            // Tất cả slot đã bị khóa (closed), disable nút
                            return true;
                        })()}
                        sx={{
                            borderRadius: 1,
                            px: 2,
                            py: 1,
                            borderColor: COLORS.GRAY[300],
                            color: COLORS.TEXT.PRIMARY,
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            '&:hover': {
                                borderColor: COLORS.PRIMARY[400],
                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.5)
                            },
                            '&:disabled': {
                                borderColor: COLORS.GRAY[200],
                                color: COLORS.GRAY[400],
                                backgroundColor: COLORS.GRAY[50],
                                opacity: 0.6,
                                cursor: 'not-allowed',
                                pointerEvents: 'none',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        ← Tuần trước
                    </Button>

                    <Typography variant="body1" sx={{
                        fontWeight: 600,
                        color: COLORS.TEXT.PRIMARY,
                        fontSize: '1rem'
                    }}>
                        {(shownDates[0] || weekDates[0]).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })} - {(shownDates[shownDates.length - 1] || weekDates[6]).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() => navigateWeek(1)}
                        sx={{
                            borderRadius: 1,
                            px: 2,
                            py: 1,
                            borderColor: COLORS.GRAY[300],
                            color: COLORS.TEXT.PRIMARY,
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            '&:hover': {
                                borderColor: COLORS.PRIMARY[400],
                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.5)
                            }
                        }}
                    >
                        Tuần tới →
                    </Button>
                </Box>

                {/* Period Filter (only for pet-care services) */}
                {!isCafe && (
                    <Box sx={{
                        mb: 2,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {['morning', 'afternoon', 'evening'].map((period) => {
                            const periodInfo = getPeriodInfo(period);
                            return (
                                <Chip
                                    key={period}
                                    label={`${periodInfo.emoji} ${periodInfo.label}`}
                                    onClick={() => scrollToPeriod(period)}
                                    variant={selectedPeriod === period ? 'filled' : 'outlined'}
                                    sx={{
                                        backgroundColor: selectedPeriod === period ? periodInfo.color : 'transparent',
                                        color: selectedPeriod === period ? 'white' : periodInfo.color,
                                        borderColor: periodInfo.color,
                                        fontWeight: 600,
                                        '&:hover': {
                                            backgroundColor: alpha(periodInfo.color, 0.1)
                                        }
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}

                {/* Simple Legend */}
                <Box sx={{
                    mb: 2,
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Pets
                            sx={{
                                fontSize: '1.2rem',
                                color: COLORS.TEXT.PRIMARY,
                                stroke: COLORS.TEXT.PRIMARY,
                                strokeWidth: 1.5,
                                fill: 'transparent'
                            }}
                        />
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                            Còn chỗ
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.WARNING[500],
                            borderRadius: '50%'
                        }}>
                            <Pets sx={{ fontSize: '1rem', color: 'white' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                            Đầy
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.GRAY[500],
                            borderRadius: '50%'
                        }}>
                            <Pets sx={{ fontSize: '1rem', color: 'white' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                            Đóng cửa
                        </Typography>
                    </Box>
                </Box>

                {/* Clean Calendar Grid */}
                <Box sx={{
                    border: `1px solid ${alpha(COLORS.GRAY[200], 0.3)}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: COLORS.BACKGROUND.DEFAULT,
                    boxShadow: `0 2px 8px ${alpha(COLORS.GRAY[300], 0.1)}`
                }}>
                    {/* Clean Header Row - Fixed */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: `100px repeat(${shownDates.length}, 1fr)`,
                        background: `linear-gradient(135deg, ${COLORS.GRAY[50]} 0%, ${COLORS.GRAY[100]} 100%)`,
                        borderBottom: `2px solid ${alpha(COLORS.GRAY[200], 0.3)}`,
                        boxShadow: `0 2px 4px ${alpha(COLORS.GRAY[200], 0.1)}`
                    }}>
                        <Box sx={{
                            p: 1.5,
                            borderRight: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: COLORS.GRAY[100]
                        }}>
                            <Typography variant="body2" sx={{
                                fontWeight: 600,
                                color: COLORS.TEXT.PRIMARY,
                                fontSize: '0.9rem'
                            }}>
                            </Typography>
                        </Box>
                        {shownDates.map((date, index) => {
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <Box key={index} sx={{
                                    p: 1.25,
                                    borderRight: index < shownDates.length - 1 ? `1px solid ${alpha(COLORS.GRAY[200], 0.5)}` : 'none',
                                    textAlign: 'center',
                                    background: COLORS.GRAY[100]
                                }}>
                                    <Box sx={{
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        px: 1.25,
                                        py: 0.75,
                                        borderRadius: 2,
                                        backgroundColor: isToday ? alpha(COLORS.PRIMARY[100], 0.6) : 'white',
                                        border: `1px solid ${alpha(COLORS.GRAY[300], 0.8)}`,
                                        boxShadow: isToday ? `0 2px 6px ${alpha(COLORS.PRIMARY[300], 0.25)}` : 'none'
                                    }}>
                                        <Typography variant="caption" sx={{
                                            fontWeight: 700,
                                            color: isWeekend ? (date.getDay() === 0 ? COLORS.ERROR[600] : COLORS.PRIMARY[600]) : COLORS.TEXT.PRIMARY,
                                            letterSpacing: 0.2
                                        }}>
                                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: COLORS.TEXT.PRIMARY,
                                            mt: 0.25
                                        }}>
                                            {String(date.getDate()).padStart(2, '0')}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Scrollable Time Slots Container */}
                    <Box
                        ref={scrollContainerRef}
                        sx={{
                            height: '400px',
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
                        }}
                    >
                        {/* Time Slots Grouped by Period - Full View */}
                        <Box>
                            {(isCafe ? ['session'] : ['morning', 'afternoon', 'evening']).map((period) => {
                                const periodInfo = getPeriodInfo(period);
                                const periodSlots = getTimeSlots().filter(time => getTimeSlotPeriod(time) === period);

                                return (
                                    <Box
                                        key={period}
                                        data-period={period}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >

                                        {/* All Time Slots for this period in one view */}
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {periodSlots.map((time, timeIndex) => (
                                                <Box key={`${period}-${timeIndex}`} sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: `140px repeat(${shownDates.length}, 1fr)`,
                                                    borderBottom: `1px solid ${alpha(COLORS.GRAY[200], 0.25)}`,
                                                    minHeight: '56px',
                                                    '&:nth-of-type(even)': {
                                                        backgroundColor: alpha(COLORS.GRAY[50], 0.6)
                                                    }
                                                }}>
                                                    {/* Time Label */}
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRight: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: COLORS.GRAY[50],
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 1
                                                    }}>
                                                        {(() => {
                                                            if (!isCafe) {
                                                                return (
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                                                        {time}
                                                                    </Typography>
                                                                );
                                                            }
                                                            const [h, m] = time.split(':').map(Number);
                                                            const start = h * 60 + m;
                                                            const dur = service?.sessionDurationMinutes ?? 90;
                                                            const end = start + dur;
                                                            const eh = String(Math.floor(end / 60)).padStart(2, '0');
                                                            const em = String(end % 60).padStart(2, '0');
                                                            const index = periodSlots.findIndex(t => t === time);
                                                            return (
                                                                <Chip
                                                                    label={`Ca ${index + 1}`}
                                                                    size="small"
                                                                    sx={{
                                                                        mr: 1,
                                                                        fontWeight: 700,
                                                                        backgroundColor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                        color: COLORS.PRIMARY[700],
                                                                        border: `1px solid ${alpha(COLORS.PRIMARY[300], 0.6)}`
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                        {isCafe && (
                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                                                {(() => {
                                                                    const [h, m] = time.split(':').map(Number);
                                                                    const start = h * 60 + m;
                                                                    const dur = service?.sessionDurationMinutes ?? 90;
                                                                    const end = start + dur;
                                                                    const eh = String(Math.floor(end / 60)).padStart(2, '0');
                                                                    const em = String(end % 60).padStart(2, '0');
                                                                    return `${time} - ${eh}:${em}`;
                                                                })()}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* Day Slots */}
                                                    {shownDates.map((date, dayIndex) => {
                                                        const availability = getSlotAvailability(date, time);
                                                        const isSelected = formData.selectedDate === date.toISOString().split('T')[0] &&
                                                            formData.selectedTime === time;

                                                        return (
                                                            <Tooltip key={`tip-${dayIndex}`} title={`${date.toLocaleDateString('vi-VN')} • ${time}`}>
                                                                <Box
                                                                    key={dayIndex}
                                                                    onClick={() => handleSlotClick(date, time)}
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderRight: dayIndex < shownDates.length - 1 ? `1px solid ${alpha(COLORS.GRAY[200], 0.3)}` : 'none',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: availability === 'available' ? 'pointer' : 'default',
                                                                        backgroundColor: isSelected ? alpha(COLORS.SUCCESS[100], 0.7) :
                                                                            availability === 'available' ? 'white' :
                                                                                availability === 'unavailable' ? COLORS.WARNING[500] : COLORS.GRAY[500],
                                                                        border: isSelected ? `2px solid ${COLORS.SUCCESS[500]}` :
                                                                            `1px solid ${alpha(COLORS.GRAY[200], 0.4)}`,
                                                                        borderRadius: 2,
                                                                        transition: 'all 0.2s ease',
                                                                        boxShadow: isSelected ? `0 2px 10px ${alpha(COLORS.SUCCESS[300], 0.35)}` : 'none',
                                                                        '&:hover': availability === 'available' ? {
                                                                            backgroundColor: alpha(COLORS.SUCCESS[50], 0.6),
                                                                            borderColor: COLORS.SUCCESS[400],
                                                                            transform: 'scale(1.02)',
                                                                            boxShadow: `0 4px 10px ${alpha(COLORS.SUCCESS[300], 0.25)}`
                                                                        } : {}
                                                                    }}
                                                                >
                                                                    <Pets
                                                                        sx={{
                                                                            fontSize: '1rem',
                                                                            color: availability === 'available' ? COLORS.TEXT.PRIMARY :
                                                                                availability === 'unavailable' ? 'white' :
                                                                                    'white',
                                                                            stroke: availability === 'available' ? COLORS.TEXT.PRIMARY : 'none',
                                                                            strokeWidth: availability === 'available' ? 1.5 : 0,
                                                                            fill: availability === 'available' ? 'transparent' :
                                                                                availability === 'unavailable' ? 'white' : 'white'
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CalendarGrid;
