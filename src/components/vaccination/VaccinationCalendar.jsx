import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Grid, alpha, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, Divider } from '@mui/material';
import { ChevronLeft, ChevronRight, Close, Vaccines, Pets } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { API_BASE_URL } from '../../config/config';

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const VaccinationCalendar = ({ upcomingVaccinations }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Helper function to get image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        const baseUrl = API_BASE_URL.replace('/api', '');
        return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
    };

    // Helper function to get pet image URL
    const getPetImageUrl = (pet) => {
        const imageUrl = pet?.image || pet?.image_url || pet?.avatar;
        return imageUrl ? getImageUrl(imageUrl) : undefined;
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Navigate to previous month
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    // Navigate to next month
    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    // Navigate to today
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Get days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Group vaccinations by date
    const vaccinationsByDate = useMemo(() => {
        const grouped = {};
        upcomingVaccinations.forEach(vaccination => {
            const date = new Date(vaccination.scheduled_date);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(vaccination);
        });
        return grouped;
    }, [upcomingVaccinations]);

    // Get vaccinations for a specific date
    const getVaccinationsForDate = (day) => {
        const dateKey = `${currentYear}-${currentMonth}-${day}`;
        return vaccinationsByDate[dateKey] || [];
    };

    // Check if date has vaccinations
    const hasVaccinations = (day) => {
        return getVaccinationsForDate(day).length > 0;
    };

    // Check if date is today
    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    // Handle date click
    const handleDateClick = (day) => {
        const vaccinations = getVaccinationsForDate(day);
        if (vaccinations.length > 0) {
            setSelectedDate({ day, month: currentMonth, year: currentYear, vaccinations });
            setDetailDialogOpen(true);
        }
    };

    // Generate calendar days
    const calendarDays = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<Box key={`empty-${i}`} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const hasVacc = hasVaccinations(day);
        const isCurrentDay = isToday(day);
        const vaccCount = getVaccinationsForDate(day).length;

        calendarDays.push(
            <Paper
                key={day}
                elevation={hasVacc ? 1 : 0}
                onClick={() => handleDateClick(day)}
                sx={{
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: hasVacc ? 'pointer' : 'default',
                    position: 'relative',
                    borderRadius: 1.5,
                    border: isCurrentDay ? `2px solid ${COLORS.PRIMARY[500]}` : '1px solid',
                    borderColor: hasVacc ? COLORS.WARNING[300] : alpha(COLORS.BORDER.PRIMARY, 0.2),
                    bgcolor: hasVacc
                        ? alpha(COLORS.WARNING[50], 0.8)
                        : isCurrentDay
                            ? alpha(COLORS.PRIMARY[50], 0.5)
                            : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': hasVacc ? {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 3px 8px ${alpha(COLORS.WARNING[500], 0.25)}`,
                        bgcolor: alpha(COLORS.WARNING[100], 0.9)
                    } : {}
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: '0.875rem',
                        fontWeight: isCurrentDay ? 700 : hasVacc ? 600 : 500,
                        color: isCurrentDay
                            ? COLORS.PRIMARY[700]
                            : hasVacc
                                ? COLORS.WARNING[800]
                                : COLORS.TEXT.PRIMARY
                    }}
                >
                    {day}
                </Typography>
                {hasVacc && (
                    <Chip
                        label={vaccCount}
                        size="small"
                        sx={{
                            height: 16,
                            minWidth: 16,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            bgcolor: COLORS.WARNING[500],
                            color: 'white',
                            mt: 0.3,
                            '& .MuiChip-label': {
                                px: 0.4
                            }
                        }}
                    />
                )}
            </Paper>
        );
    }

    return (
        <>
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`,
                    maxWidth: 900,
                    mx: 'auto'
                }}
            >
                {/* Calendar Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Vaccines sx={{ fontSize: 28, color: COLORS.PRIMARY[600] }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                            {MONTHS[currentMonth]} {currentYear}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleToday}
                            sx={{ fontWeight: 700 }}
                        >
                            Hôm nay
                        </Button>
                        <IconButton
                            onClick={handlePrevMonth}
                            sx={{
                                bgcolor: alpha(COLORS.PRIMARY[50], 0.5),
                                '&:hover': { bgcolor: alpha(COLORS.PRIMARY[100], 0.7) }
                            }}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton
                            onClick={handleNextMonth}
                            sx={{
                                bgcolor: alpha(COLORS.PRIMARY[50], 0.5),
                                '&:hover': { bgcolor: alpha(COLORS.PRIMARY[100], 0.7) }
                            }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </Stack>
                </Stack>

                {/* Days of Week */}
                <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
                    {DAYS_OF_WEEK.map((day, index) => (
                        <Grid item key={day} sx={{ width: `${100 / 7}%` }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    color: index === 0 ? COLORS.ERROR[500] : COLORS.TEXT.SECONDARY,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.3
                                }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                {/* Calendar Grid */}
                <Grid container spacing={0.5}>
                    {calendarDays.map((day, index) => (
                        <Grid item key={index} sx={{ width: `${100 / 7}%` }}>
                            {day}
                        </Grid>
                    ))}
                </Grid>

                {/* Summary */}
                {useMemo(() => {
                    const vaccinationsThisMonth = upcomingVaccinations.filter(v => {
                        const date = new Date(v.scheduled_date);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                    });
                    return (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.1)}` }}
                        >
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 0.75,
                                            border: `2px solid ${COLORS.PRIMARY[500]}`,
                                            bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, fontSize: '0.7rem' }}>
                                        Hôm nay
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 0.75,
                                            bgcolor: alpha(COLORS.WARNING[50], 0.8),
                                            border: `1px solid ${COLORS.WARNING[300]}`
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, fontSize: '0.7rem' }}>
                                        Có lịch tiêm
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.WARNING[700], fontSize: '0.75rem' }}>
                                {vaccinationsThisMonth.length} lịch hẹn trong tháng
                            </Typography>
                        </Stack>
                    );
                }, [upcomingVaccinations, currentMonth, currentYear])}
            </Paper>

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.PRIMARY[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: COLORS.WARNING[500],
                        color: '#fff',
                        fontWeight: 800,
                        py: 2.5
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Vaccines sx={{ fontSize: 28 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Lịch tiêm ngày {selectedDate?.day}/{selectedDate?.month + 1}/{selectedDate?.year}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                    {selectedDate?.vaccinations?.length || 0} lịch hẹn
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton
                            onClick={() => setDetailDialogOpen(false)}
                            sx={{
                                color: '#fff',
                                '&:hover': { background: alpha('#fff', 0.2) }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    <Stack spacing={2}>
                        {selectedDate?.vaccinations?.map((vaccination, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: alpha(COLORS.WARNING[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.WARNING[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar
                                        src={getPetImageUrl(vaccination.pet)}
                                        alt={vaccination.pet?.name}
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            border: `2px solid ${COLORS.WARNING[300]}`
                                        }}
                                    >
                                        <Pets />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                            <Pets sx={{ fontSize: 18, color: COLORS.PRIMARY[600] }} />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                                {vaccination.pet?.name}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Vaccines sx={{ fontSize: 16, color: COLORS.WARNING[600] }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.WARNING[700] }}>
                                                {vaccination.vaccine_type?.name}
                                            </Typography>
                                        </Stack>
                                        {vaccination.notes && (
                                            <>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                    📝 {vaccination.notes}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                    <Chip
                                        label={vaccination.vaccine_type?.is_required ? 'Bắt buộc' : 'Không bắt buộc'}
                                        size="small"
                                        color={vaccination.vaccine_type?.is_required ? 'error' : 'info'}
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                    <Button
                        onClick={() => setDetailDialogOpen(false)}
                        variant="contained"
                        sx={{
                            background: COLORS.WARNING[500],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: COLORS.WARNING[600]
                            }
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default VaccinationCalendar;