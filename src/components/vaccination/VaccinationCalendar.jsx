import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Grid, alpha, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, Divider } from '@mui/material';
import { ChevronLeft, ChevronRight, Close, Vaccines, Pets, CheckCircle, Cancel, Schedule as ScheduleIcon, CalendarToday, Category } from '@mui/icons-material';
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
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: `0 8px 32px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: COLORS.PRIMARY[600],
                        color: '#fff',
                        fontWeight: 700,
                        py: 2.5,
                        px: 3
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Vaccines sx={{ fontSize: 32 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, fontSize: '1.25rem' }}>
                                    Lịch tiêm ngày {selectedDate?.day}/{selectedDate?.month + 1}/{selectedDate?.year}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25, fontSize: '0.875rem' }}>
                                    {selectedDate?.vaccinations?.length || 0} lịch hẹn
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton
                            onClick={() => setDetailDialogOpen(false)}
                            sx={{
                                color: '#fff',
                                '&:hover': {
                                    bgcolor: alpha('#fff', 0.15)
                                }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                        {selectedDate?.vaccinations?.map((vaccination, index) => {
                            const getStatusDisplay = (status) => {
                                switch (status) {
                                    case 'COMPLETED':
                                        return {
                                            label: 'Đã hoàn thành',
                                            icon: <CheckCircle fontSize="small" />,
                                            color: COLORS.SUCCESS[700],
                                            bg: alpha(COLORS.SUCCESS[50], 0.6),
                                            borderColor: alpha(COLORS.SUCCESS[300], 0.4)
                                        };
                                    case 'CANCELLED':
                                        return {
                                            label: 'Đã hủy',
                                            icon: <Cancel fontSize="small" />,
                                            color: COLORS.ERROR[700],
                                            bg: alpha(COLORS.ERROR[50], 0.6),
                                            borderColor: alpha(COLORS.ERROR[300], 0.4)
                                        };
                                    case 'SCHEDULED':
                                    default:
                                        return {
                                            label: 'Đã lên lịch',
                                            icon: <ScheduleIcon fontSize="small" />,
                                            color: COLORS.INFO[700],
                                            bg: alpha(COLORS.INFO[50], 0.6),
                                            borderColor: alpha(COLORS.INFO[300], 0.4)
                                        };
                                }
                            };

                            const statusDisplay = getStatusDisplay(vaccination.status);

                            return (
                                <Grid item xs={12} md={6} key={index}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.12)}`,
                                            bgcolor: '#fff',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.12)}`,
                                                borderColor: alpha(COLORS.PRIMARY[300], 0.3)
                                            }
                                        }}
                                    >
                                        <Stack spacing={2.5} sx={{ flex: 1 }}>
                                            {/* Header: Pet Info & Status */}
                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                <Avatar
                                                    src={getPetImageUrl(vaccination.pet)}
                                                    alt={vaccination.pet?.name}
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.5)}`
                                                    }}
                                                >
                                                    <Pets sx={{ fontSize: 32 }} />
                                                </Avatar>

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: COLORS.TEXT.PRIMARY,
                                                            mb: 0.5,
                                                            lineHeight: 1.3,
                                                            fontSize: '1.125rem'
                                                        }}
                                                    >
                                                        {vaccination.pet?.name}
                                                    </Typography>

                                                    {/* Species & Breed */}
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: COLORS.TEXT.SECONDARY,
                                                            fontWeight: 500,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        {[vaccination.pet?.species?.name, vaccination.pet?.breed?.name]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </Typography>
                                                </Box>

                                                {/* Status Badge */}
                                                <Chip
                                                    icon={statusDisplay.icon}
                                                    label={statusDisplay.label}
                                                    sx={{
                                                        height: 32,
                                                        fontWeight: 600,
                                                        fontSize: '0.8125rem',
                                                        bgcolor: statusDisplay.bg,
                                                        color: statusDisplay.color,
                                                        border: `1px solid ${alpha(statusDisplay.borderColor, 0.5)}`,
                                                        '& .MuiChip-icon': {
                                                            color: statusDisplay.color,
                                                            fontSize: 18
                                                        }
                                                    }}
                                                />
                                            </Stack>

                                            <Divider />

                                            {/* Vaccine Info */}
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                    <Vaccines sx={{ fontSize: 20, color: COLORS.WARNING[600] }} />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: COLORS.TEXT.SECONDARY,
                                                            fontWeight: 600,
                                                            fontSize: '0.8125rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: 0.5
                                                        }}
                                                    >
                                                        Loại vaccine
                                                    </Typography>
                                                </Stack>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: COLORS.TEXT.PRIMARY,
                                                        lineHeight: 1.4,
                                                        fontSize: '0.9375rem',
                                                        mb: 0.75
                                                    }}
                                                >
                                                    {vaccination.vaccine_type?.name}
                                                </Typography>
                                                {vaccination.vaccine_type?.is_required && (
                                                    <Chip
                                                        label="Bắt buộc"
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            bgcolor: alpha(COLORS.ERROR[50], 0.8),
                                                            color: COLORS.ERROR[700],
                                                            border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}`
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Completion Date */}
                                            {vaccination.completed_date && (
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 1.5,
                                                        bgcolor: alpha(COLORS.SUCCESS[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <CalendarToday sx={{ fontSize: 20, color: COLORS.SUCCESS[600] }} />
                                                        <Box>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display: 'block',
                                                                    color: COLORS.SUCCESS[700],
                                                                    fontWeight: 600,
                                                                    fontSize: '0.75rem',
                                                                    mb: 0.25
                                                                }}
                                                            >
                                                                Đã hoàn thành
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: COLORS.SUCCESS[800],
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                {new Date(vaccination.completed_date).toLocaleDateString('vi-VN', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Spacer để đẩy notes xuống dưới */}
                                            <Box sx={{ flexGrow: 1 }} />

                                            {/* Notes */}
                                            {vaccination.notes && (
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 1.5,
                                                        bgcolor: alpha(COLORS.GRAY[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}`
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: COLORS.TEXT.SECONDARY,
                                                            lineHeight: 1.6,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <strong style={{ color: COLORS.TEXT.PRIMARY }}>Ghi chú:</strong> {vaccination.notes}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogContent>
                <DialogActions
                    sx={{
                        p: 2.5,
                        borderTop: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.1)}`,
                        bgcolor: alpha(COLORS.GRAY[50], 0.3)
                    }}
                >
                    <Button
                        onClick={() => setDetailDialogOpen(false)}
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: COLORS.PRIMARY[600],
                            color: '#fff',
                            fontWeight: 600,
                            py: 1.25,
                            px: 4,
                            fontSize: '0.9375rem',
                            textTransform: 'none',
                            borderRadius: 1.5,
                            '&:hover': {
                                bgcolor: COLORS.PRIMARY[700]
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