import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    Stack,
    Chip,
    Divider,
    Fade,
    InputAdornment,
    Avatar,
    Paper,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import {
    CalendarToday,
    Schedule,
    Person,
    Phone,
    Email,
    LocationOn,
    CheckCircle,
    ArrowBack,
    Payment,
    Pets,
    Favorite,
    Star,
    Home,
    Cake
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { bookingApi } from '../../api/bookingApi';
import { petApi } from '../../api/petApi';
import { formatPrice } from '../../utils/formatPrice';

const BookingForm = ({ service, onBack, onSubmit }) => {
    const [formData, setFormData] = useState({
        selectedDate: '',
        selectedTime: '',
        petId: '',
        petInfo: {
            species: '',
            breed: '',
            weight: ''
        },
        customerInfo: {
            name: '',
            phone: '',
            email: '',
            address: ''
        }
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [pets, setPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        if (service.petRequired === false) return;

        setLoadingPets(true);
        try {
            const response = await petApi.getMyPets();
            setPets(response.data || []);
        } catch (error) {
            console.error('Error loading pets:', error);
            setPets([]);
        } finally {
            setLoadingPets(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };

    const checkAvailability = async (date) => {
        if (!date) {
            setAvailableSlots([]);
            return;
        }

        const today = new Date();
        const selectedDate = new Date(date);
        const isToday = selectedDate.toDateString() === today.toDateString();

        // Tạo một bản sao của today để so sánh ngày
        const todayForComparison = new Date();
        todayForComparison.setHours(0, 0, 0, 0);
        const isPastDate = selectedDate < todayForComparison;

        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        console.log('Date check:', {
            selectedDate: selectedDate.toDateString(),
            today: today.toDateString(),
            isToday,
            isPastDate,
            currentHour,
            currentMinute,
            currentTime
        });

        // Nếu chọn ngày quá khứ, không hiển thị giờ nào
        if (isPastDate) {
            setAvailableSlots([]);
            return;
        }

        // Luôn hiển thị khung giờ cố định, không cần API
        const allSlots = [
            { time: '08:00', available: true },
            { time: '09:00', available: true },
            { time: '10:00', available: true },
            { time: '11:00', available: true },
            { time: '14:00', available: true },
            { time: '15:00', available: true },
            { time: '16:00', available: true },
            { time: '17:00', available: true }
        ];

        // Nếu chọn ngày hôm nay, chỉ hiển thị các giờ trong tương lai
        let filteredSlots = allSlots;
        if (isToday) {
            console.log('Today selected - Current time:', currentTime, 'Current hour:', currentHour, 'Current minute:', currentMinute);
            console.log('All slots before filtering:', allSlots);

            filteredSlots = allSlots.filter(slot => {
                const [slotHour, slotMinute] = slot.time.split(':').map(Number);
                const slotTime = slotHour * 60 + slotMinute;
                const isFuture = slotTime > currentTime;
                console.log(`Slot ${slot.time}: ${slotTime} > ${currentTime} = ${isFuture}`);
                // Chỉ hiển thị giờ trong tương lai (lớn hơn giờ hiện tại)
                return isFuture;
            });
            console.log('Filtered slots for today:', filteredSlots);
        }

        setAvailableSlots(filteredSlots);
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear related errors
        setErrors(prev => ({
            ...prev,
            [field]: null
        }));

        // Check availability when date changes
        if (field === 'selectedDate') {
            setFormData(prev => ({
                ...prev,
                selectedTime: '' // Clear selected time when date changes
            }));

            // Real-time validation for date selection
            if (value) {
                const today = new Date();
                const selectedDate = new Date(value);

                if (selectedDate < today.setHours(0, 0, 0, 0)) {
                    setErrors(prev => ({
                        ...prev,
                        selectedDate: 'Không thể chọn ngày trong quá khứ',
                        selectedTime: null // Clear time error when date is invalid
                    }));
                } else {
                    // Clear date error if date is valid
                    setErrors(prev => ({
                        ...prev,
                        selectedDate: null
                    }));
                }
            }

            checkAvailability(value);
        }

        // Real-time validation for time selection
        if (field === 'selectedTime' && value) {
            const today = new Date();
            const selectedDate = new Date(formData.selectedDate);
            const isToday = selectedDate.toDateString() === today.toDateString();

            if (isToday) {
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();
                const currentTime = currentHour * 60 + currentMinute;
                const [selectedHour, selectedMinute] = value.split(':').map(Number);
                const selectedTime = selectedHour * 60 + selectedMinute;

                if (selectedTime <= currentTime) {
                    setErrors(prev => ({
                        ...prev,
                        selectedTime: 'Không thể chọn giờ trong quá khứ'
                    }));
                } else {
                    // Clear error if time is valid
                    setErrors(prev => ({
                        ...prev,
                        selectedTime: null
                    }));
                }
            }
        }
    };

    const handlePetInfoChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            petInfo: {
                ...prev.petInfo,
                [field]: value
            }
        }));

        // Clear related errors
        setErrors(prev => ({
            ...prev,
            petInfo: {
                ...prev.petInfo,
                [field]: null
            }
        }));
    };

    const handleCustomerInfoChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            customerInfo: {
                ...prev.customerInfo,
                [field]: value
            }
        }));

        // Clear related errors
        setErrors(prev => ({
            ...prev,
            customerInfo: {
                ...prev.customerInfo,
                [field]: null
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.selectedDate) {
            newErrors.selectedDate = 'Vui lòng chọn ngày';
        } else {
            // Kiểm tra ngày không được là hôm nay hoặc quá khứ
            const today = new Date();
            const selectedDate = new Date(formData.selectedDate);
            const isToday = selectedDate.toDateString() === today.toDateString();

            if (selectedDate < today.setHours(0, 0, 0, 0)) {
                newErrors.selectedDate = 'Không thể chọn ngày trong quá khứ';
            } else if (isToday && formData.selectedTime) {
                // Kiểm tra giờ nếu chọn ngày hôm nay
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();
                const currentTime = currentHour * 60 + currentMinute;
                const [selectedHour, selectedMinute] = formData.selectedTime.split(':').map(Number);
                const selectedTime = selectedHour * 60 + selectedMinute;

                if (selectedTime <= currentTime) {
                    newErrors.selectedTime = 'Không thể chọn giờ trong quá khứ';
                }
            }
        }

        if (!formData.selectedTime) {
            newErrors.selectedTime = 'Vui lòng chọn khung giờ';
        }

        // Removed petId validation since we're using petInfo instead

        // Validate pet info
        if (!formData.petInfo?.species) {
            newErrors.petInfo = { ...newErrors.petInfo, species: 'Vui lòng chọn loài thú cưng' };
        }

        if (!formData.petInfo?.breed?.trim()) {
            newErrors.petInfo = { ...newErrors.petInfo, breed: 'Vui lòng nhập giống thú cưng' };
        }

        if (!formData.petInfo?.weight?.trim()) {
            newErrors.petInfo = { ...newErrors.petInfo, weight: 'Vui lòng nhập cân nặng thú cưng' };
        }

        if (!formData.customerInfo.name.trim()) {
            newErrors.customerInfo = { ...newErrors.customerInfo, name: 'Vui lòng nhập họ tên' };
        }

        if (!formData.customerInfo.phone.trim()) {
            newErrors.customerInfo = { ...newErrors.customerInfo, phone: 'Vui lòng nhập số điện thoại' };
        }

        if (!formData.customerInfo.email.trim()) {
            newErrors.customerInfo = { ...newErrors.customerInfo, email: 'Vui lòng nhập email' };
        }

        // Removed address validation since we removed the address field

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateEndTime = (date, startTime, duration) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDateTime = new Date(date);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
        return endDateTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const bookingData = {
            serviceId: service.id,
            date: formData.selectedDate,
            time: formData.selectedTime,
            pet: null, // Using petInfo instead of pet selection
            petInfo: formData.petInfo,
            customerInfo: formData.customerInfo,
            cafePets: service.petRequired === false ? service.cafePets : null,
            experienceType: service.petRequired === false ? service.experienceType : null
        };

        onSubmit(bookingData);
    };

    if (loadingPets) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loading message="Đang tải thông tin thú cưng..." />
            </Box>
        );
    }

    return (
        <Fade in timeout={800}>
            <Box sx={{
                width: '100%',
                maxWidth: '100%',
                mx: 0,
                px: 3,
                py: 2,
                minHeight: '80vh',
                background: `
                    radial-gradient(circle at 20% 20%, ${alpha(COLORS.WARNING[100], 0.2)} 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, ${alpha(COLORS.SECONDARY[100], 0.15)} 0%, transparent 50%),
                    linear-gradient(135deg, 
                        ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                        ${alpha(COLORS.SECONDARY[50], 0.6)} 100%
                    )
                `,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 15% 15%, ${alpha(COLORS.ERROR[100], 0.08)} 0 6px, transparent 7px),
                        radial-gradient(circle at 85% 85%, ${alpha(COLORS.INFO[100], 0.08)} 0 4px, transparent 5px)
                    `,
                    backgroundSize: '150px 150px',
                    pointerEvents: 'none'
                }
            }}>
                {/* Header với thiết kế dễ thương */}
                <Card sx={{
                    mb: 4,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, 
                        ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                        ${alpha(COLORS.WARNING[50], 0.8)} 30%,
                        ${alpha(COLORS.SECONDARY[50], 0.9)} 100%
                    )`,
                    border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`,
                    boxShadow: `0 6px 24px ${alpha(COLORS.WARNING[200], 0.15)}`,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, 
                            ${COLORS.ERROR[300]} 0%, 
                            ${COLORS.WARNING[300]} 25%,
                            ${COLORS.SECONDARY[300]} 50%,
                            ${COLORS.INFO[300]} 75%,
                            ${COLORS.ERROR[300]} 100%
                        )`
                    }
                }}>
                    <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={2.5} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Button
                                        startIcon={<ArrowBack />}
                                        onClick={onBack}
                                        sx={{
                                            color: COLORS.WARNING[600],
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            fontSize: '0.85rem',
                                            py: 0.8,
                                            px: 1.5,
                                            borderRadius: 2,
                                            background: alpha(COLORS.WARNING[100], 0.6),
                                            '&:hover': {
                                                background: alpha(COLORS.WARNING[200], 0.8),
                                                transform: 'translateY(-2px)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        🐾 Quay lại
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                    <Avatar sx={{
                                        bgcolor: COLORS.WARNING[500],
                                        width: 38,
                                        height: 38,
                                        fontSize: '1.1rem'
                                    }}>
                                        🐕
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" sx={{
                                            fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            mb: 0.5,
                                            fontSize: '1.3rem',
                                            fontFamily: '"Comic Sans MS", cursive'
                                        }}>
                                            🐾 Đặt lịch: {service.name}
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: COLORS.TEXT.SECONDARY,
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic'
                                        }}>
                                            {service.description}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* HÀNG 1: Chọn ngày và Chọn giờ - Layout tối ưu */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Chọn ngày - 50% */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            borderRadius: 4,
                            border: `2px solid ${alpha(COLORS.WARNING[300], 0.4)}`,
                            boxShadow: `0 6px 18px ${alpha(COLORS.WARNING[200], 0.12)}`,
                            background: `linear-gradient(135deg, 
                                ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                                ${alpha(COLORS.WARNING[50], 0.8)} 50%,
                                ${alpha(COLORS.ERROR[50], 0.6)} 100%
                            )`,
                            minHeight: '170px',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                width: 45,
                                height: 45,
                                background: `radial-gradient(circle, ${alpha(COLORS.WARNING[200], 0.25)} 0%, transparent 70%)`,
                                borderRadius: '50%'
                            }
                        }}>
                            <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <Avatar sx={{
                                        bgcolor: COLORS.WARNING[500],
                                        width: 34,
                                        height: 34,
                                        fontSize: '1rem'
                                    }}>
                                        📅
                                    </Avatar>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 'bold',
                                        color: COLORS.WARNING[700],
                                        fontSize: '0.95rem',
                                        fontFamily: '"Comic Sans MS", cursive'
                                    }}>
                                        🐾 Chọn ngày dịch vụ
                                    </Typography>
                                </Box>

                                <TextField
                                    fullWidth
                                    type="date"
                                    value={formData.selectedDate}
                                    onChange={(e) => handleFieldChange('selectedDate', e.target.value)}
                                    inputProps={{
                                        min: getMinDate(),
                                        max: getMaxDate()
                                    }}
                                    error={!!errors.selectedDate}
                                    helperText={errors.selectedDate}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                            minHeight: '48px',
                                            border: `2px solid ${alpha(COLORS.WARNING[300], 0.3)}`,
                                            '&:hover': {
                                                borderColor: COLORS.WARNING[400],
                                                boxShadow: `0 4px 12px ${alpha(COLORS.WARNING[300], 0.2)}`
                                            },
                                            '&.Mui-focused': {
                                                borderColor: COLORS.WARNING[500],
                                                boxShadow: `0 0 0 3px ${alpha(COLORS.WARNING[300], 0.2)}`
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            fontSize: '0.9rem',
                                            padding: '12px 14px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />

                                {errors.selectedDate && (
                                    <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, py: 1 }}>
                                        {errors.selectedDate}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Chọn giờ - 50% */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            borderRadius: 4,
                            border: `2px solid ${alpha(COLORS.INFO[300], 0.4)}`,
                            boxShadow: `0 6px 18px ${alpha(COLORS.INFO[200], 0.12)}`,
                            background: `linear-gradient(135deg, 
                                ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                                ${alpha(COLORS.INFO[50], 0.8)} 50%,
                                ${alpha(COLORS.SECONDARY[50], 0.6)} 100%
                            )`,
                            minHeight: '170px',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: -6,
                                left: -6,
                                width: 45,
                                height: 45,
                                background: `radial-gradient(circle, ${alpha(COLORS.INFO[200], 0.25)} 0%, transparent 70%)`,
                                borderRadius: '50%'
                            }
                        }}>
                            <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <Avatar sx={{
                                        bgcolor: COLORS.INFO[500],
                                        width: 34,
                                        height: 34,
                                        fontSize: '1rem'
                                    }}>
                                        ⏰
                                    </Avatar>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 'bold',
                                        color: COLORS.INFO[700],
                                        fontSize: '0.95rem',
                                        fontFamily: '"Comic Sans MS", cursive'
                                    }}>
                                        🐾 Chọn khung giờ
                                    </Typography>
                                </Box>

                                {!formData.selectedDate && (
                                    <Alert
                                        severity="info"
                                        sx={{
                                            mb: 1.5,
                                            borderRadius: 2,
                                            background: alpha(COLORS.INFO[50], 0.8),
                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`,
                                            fontSize: '0.85rem',
                                            py: 1
                                        }}
                                        icon={<Pets sx={{ color: COLORS.INFO[600] }} />}
                                    >
                                        🐾 Vui lòng chọn ngày trước để xem các khung giờ có sẵn
                                    </Alert>
                                )}

                                {formData.selectedDate && (() => {
                                    const today = new Date();
                                    const selectedDate = new Date(formData.selectedDate);
                                    const isToday = selectedDate.toDateString() === today.toDateString();

                                    if (isToday) {
                                        return (
                                            <Alert
                                                severity="warning"
                                                sx={{
                                                    mb: 1.5,
                                                    borderRadius: 2,
                                                    background: alpha(COLORS.WARNING[50], 0.8),
                                                    border: `1px solid ${alpha(COLORS.WARNING[200], 0.5)}`,
                                                    fontSize: '0.85rem',
                                                    py: 1
                                                }}
                                                icon={<Schedule sx={{ color: COLORS.WARNING[600] }} />}
                                            >
                                                ⚠️ Chỉ hiển thị các giờ trong tương lai
                                            </Alert>
                                        );
                                    }
                                    return null;
                                })()}

                                {checkingAvailability && (
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <Loading
                                            message="🔍 Đang kiểm tra lịch trống..."
                                            size="small"
                                            variant="dots"
                                        />
                                    </Box>
                                )}

                                {errors.availability && (
                                    <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 1 }}>
                                        {errors.availability}
                                    </Alert>
                                )}


                                {availableSlots.length > 0 && (
                                    <>
                                        <Grid container spacing={0.8}>
                                            {availableSlots.map((slot) => (
                                                <Grid item xs={6} sm={4} md={4} lg={4} xl={4} key={slot.time}>
                                                    <Button
                                                        fullWidth
                                                        variant={formData.selectedTime === slot.time ? 'contained' : 'outlined'}
                                                        disabled={!slot.available}
                                                        onClick={() => handleFieldChange('selectedTime', slot.time)}
                                                        sx={{
                                                            py: 0.8,
                                                            px: 0.5,
                                                            borderRadius: 2.5,
                                                            textTransform: 'none',
                                                            minHeight: '44px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600,
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            ...(slot.available ? {
                                                                borderColor: formData.selectedTime === slot.time ?
                                                                    COLORS.INFO[500] : alpha(COLORS.INFO[300], 0.5),
                                                                color: formData.selectedTime === slot.time ?
                                                                    'white' : COLORS.INFO[700],
                                                                backgroundColor: formData.selectedTime === slot.time ?
                                                                    `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[600]} 100%)` :
                                                                    alpha(COLORS.INFO[50], 0.8),
                                                                '&:hover': {
                                                                    backgroundColor: formData.selectedTime === slot.time ?
                                                                        `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[700]} 100%)` :
                                                                        alpha(COLORS.INFO[100], 0.9),
                                                                    borderColor: COLORS.INFO[400],
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: `0 6px 16px ${alpha(COLORS.INFO[300], 0.3)}`
                                                                },
                                                                '&::before': formData.selectedTime === slot.time ? {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    background: `radial-gradient(circle at 50% 0%, ${alpha(COLORS.INFO[200], 0.3)} 0%, transparent 70%)`,
                                                                    pointerEvents: 'none'
                                                                } : {}
                                                            } : {
                                                                borderColor: alpha(COLORS.GRAY[300], 0.5),
                                                                color: COLORS.GRAY[400],
                                                                backgroundColor: alpha(COLORS.GRAY[100], 0.5)
                                                            }),
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                                            <Typography variant="body2" sx={{
                                                                fontWeight: 'bold',
                                                                fontSize: '0.65rem'
                                                            }}>
                                                                {slot.time}
                                                            </Typography>
                                                        </Box>
                                                    </Button>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </>
                                )}

                                {formData.selectedDate && availableSlots.length === 0 && (() => {
                                    const today = new Date();
                                    const selectedDate = new Date(formData.selectedDate);
                                    const isPastDate = selectedDate < today.setHours(0, 0, 0, 0);

                                    if (isPastDate) {
                                        return (
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    mb: 1.5,
                                                    borderRadius: 2,
                                                    background: alpha(COLORS.ERROR[50], 0.8),
                                                    border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                                    fontSize: '0.85rem',
                                                    py: 1
                                                }}
                                                icon={<Schedule sx={{ color: COLORS.ERROR[600] }} />}
                                            >
                                                ❌ Không thể chọn giờ cho ngày quá khứ. Vui lòng chọn ngày khác.
                                            </Alert>
                                        );
                                    } else {
                                        return (
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    mb: 1.5,
                                                    borderRadius: 2,
                                                    background: alpha(COLORS.ERROR[50], 0.8),
                                                    border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                                    fontSize: '0.85rem',
                                                    py: 1
                                                }}
                                                icon={<Schedule sx={{ color: COLORS.ERROR[600] }} />}
                                            >
                                                ❌ Không có giờ khả dụng cho ngày hôm nay. Vui lòng chọn ngày khác.
                                            </Alert>
                                        );
                                    }
                                })()}

                                {errors.selectedTime && (
                                    <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, py: 1 }}>
                                        {errors.selectedTime}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* HÀNG 2: Thông tin thú cưng - Layout tối ưu */}
                <Box sx={{ mb: 4 }}>
                    <Card sx={{
                        borderRadius: 4,
                        border: `2px solid ${alpha(COLORS.INFO[300], 0.4)}`,
                        boxShadow: `0 6px 18px ${alpha(COLORS.INFO[200], 0.12)}`,
                        background: `linear-gradient(135deg, 
                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.INFO[50], 0.8)} 50%,
                            ${alpha(COLORS.WARNING[50], 0.6)} 100%
                        )`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -12,
                            left: -12,
                            width: 70,
                            height: 70,
                            background: `radial-gradient(circle, ${alpha(COLORS.INFO[200], 0.15)} 0%, transparent 70%)`,
                            borderRadius: '50%'
                        }
                    }}>
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Avatar sx={{
                                    bgcolor: COLORS.INFO[500],
                                    width: 34,
                                    height: 34,
                                    fontSize: '1rem'
                                }}>
                                    🐕
                                </Avatar>
                                <Typography variant="h6" sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.INFO[700],
                                    fontSize: '0.95rem',
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}>
                                    🐾 Thông tin thú cưng
                                </Typography>
                            </Box>

                            <Grid container spacing={2.5}>
                                {/* Hàng 1: Loài và Giống */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.petInfo?.species}>
                                        <Select
                                            value={formData.petInfo.species}
                                            onChange={(e) => handlePetInfoChange('species', e.target.value)}
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.INFO[500], fontStyle: 'italic' }}>
                                                            <Typography sx={{ color: COLORS.INFO[500], fontStyle: 'italic' }}>
                                                                Chọn loài thú cưng
                                                            </Typography>
                                                        </Box>
                                                    );
                                                }
                                                const options = {
                                                    dog: { emoji: '🐕', text: 'Chó' },
                                                    cat: { emoji: '🐱', text: 'Mèo' },
                                                    bird: { emoji: '🐦', text: 'Chim' },
                                                    rabbit: { emoji: '🐰', text: 'Thỏ' },
                                                    hamster: { emoji: '🐹', text: 'Hamster' },
                                                    other: { emoji: '🐾', text: 'Khác' }
                                                };
                                                const option = options[selected];
                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography>{option.emoji}</Typography>
                                                        <Typography>{option.text}</Typography>
                                                    </Box>
                                                );
                                            }}
                                            sx={{
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.INFO[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.INFO[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.INFO[300], 0.2)}`
                                                },
                                                '& .MuiSelect-select': {
                                                    fontSize: '0.9rem',
                                                    padding: '14px 18px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }
                                            }}
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <Pets sx={{ color: COLORS.INFO[600] }} />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="dog">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐕</Typography>
                                                    <Typography>Chó</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="cat">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐱</Typography>
                                                    <Typography>Mèo</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="bird">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐦</Typography>
                                                    <Typography>Chim</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="rabbit">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐰</Typography>
                                                    <Typography>Thỏ</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="hamster">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐹</Typography>
                                                    <Typography>Hamster</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="other">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography>🐾</Typography>
                                                    <Typography>Khác</Typography>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                        {errors.petInfo?.species && (
                                            <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5 }}>
                                                {errors.petInfo.species}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập giống thú cưng"
                                        value={formData.petInfo.breed}
                                        onChange={(e) => handlePetInfoChange('breed', e.target.value)}
                                        error={!!errors.petInfo?.breed}
                                        helperText={errors.petInfo?.breed}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Star sx={{ color: COLORS.INFO[600] }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.INFO[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.INFO[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.INFO[300], 0.2)}`
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9rem',
                                                padding: '14px 18px',
                                                fontWeight: 'bold',
                                                '&::placeholder': {
                                                    color: COLORS.INFO[500],
                                                    opacity: 0.8,
                                                    fontWeight: 'bold'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Hàng 2: Cân nặng */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập cân nặng (kg)"
                                        type="number"
                                        value={formData.petInfo.weight}
                                        onChange={(e) => handlePetInfoChange('weight', e.target.value)}
                                        error={!!errors.petInfo?.weight}
                                        helperText={errors.petInfo?.weight}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Cake sx={{ color: COLORS.INFO[600] }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Typography sx={{ color: COLORS.INFO[500], fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        kg
                                                    </Typography>
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.INFO[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.INFO[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.INFO[300], 0.2)}`
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9rem',
                                                padding: '14px 18px',
                                                fontWeight: 'bold',
                                                '&::placeholder': {
                                                    color: COLORS.INFO[500],
                                                    opacity: 0.8,
                                                    fontWeight: 'bold'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>

                {/* HÀNG 3: Thông tin liên hệ - Layout tối ưu */}
                <Box sx={{ mb: 4 }}>
                    <Card sx={{
                        borderRadius: 4,
                        border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.4)}`,
                        boxShadow: `0 6px 18px ${alpha(COLORS.SECONDARY[200], 0.12)}`,
                        background: `linear-gradient(135deg, 
                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.SECONDARY[50], 0.8)} 50%,
                            ${alpha(COLORS.INFO[50], 0.6)} 100%
                        )`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            width: 70,
                            height: 70,
                            background: `radial-gradient(circle, ${alpha(COLORS.SECONDARY[200], 0.15)} 0%, transparent 70%)`,
                            borderRadius: '50%'
                        }
                    }}>
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Avatar sx={{
                                    bgcolor: COLORS.SECONDARY[500],
                                    width: 34,
                                    height: 34,
                                    fontSize: '1rem'
                                }}>
                                    👤
                                </Avatar>
                                <Typography variant="h6" sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.SECONDARY[700],
                                    fontSize: '0.95rem',
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}>
                                    🐾 Thông tin liên hệ
                                </Typography>
                            </Box>

                            <Grid container spacing={2.5}>
                                {/* Hàng 1: Họ tên và Số điện thoại */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập tên của bạn"
                                        value={formData.customerInfo.name}
                                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                                        error={!!errors.customerInfo?.name}
                                        helperText={errors.customerInfo?.name}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ color: COLORS.SECONDARY[600] }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.SECONDARY[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.SECONDARY[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9rem',
                                                padding: '14px 18px',
                                                fontWeight: 'bold',
                                                '&::placeholder': {
                                                    color: COLORS.SECONDARY[500],
                                                    opacity: 0.8,
                                                    fontWeight: 'bold'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập số điện thoại của bạn"
                                        value={formData.customerInfo.phone}
                                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                                        error={!!errors.customerInfo?.phone}
                                        helperText={errors.customerInfo?.phone}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone sx={{ color: COLORS.SECONDARY[600] }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.SECONDARY[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.SECONDARY[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9rem',
                                                padding: '14px 18px',
                                                fontWeight: 'bold',
                                                '&::placeholder': {
                                                    color: COLORS.SECONDARY[500],
                                                    opacity: 0.8,
                                                    fontWeight: 'bold'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Hàng 2: Email */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Nhập email của bạn"
                                        type="email"
                                        value={formData.customerInfo.email}
                                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                                        error={!!errors.customerInfo?.email}
                                        helperText={errors.customerInfo?.email}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ color: COLORS.SECONDARY[600] }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                                minHeight: '52px',
                                                border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.3)}`,
                                                '&:hover': {
                                                    borderColor: COLORS.SECONDARY[400],
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                },
                                                '&.Mui-focused': {
                                                    borderColor: COLORS.SECONDARY[500],
                                                    boxShadow: `0 0 0 3px ${alpha(COLORS.SECONDARY[300], 0.2)}`
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '0.9rem',
                                                padding: '14px 18px',
                                                fontWeight: 'bold',
                                                '&::placeholder': {
                                                    color: COLORS.SECONDARY[500],
                                                    opacity: 0.8,
                                                    fontWeight: 'bold'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>

                {/* HÀNG 4: Tóm tắt đặt lịch - Thiết kế dễ thương */}
                <Box sx={{ mb: 3 }}>
                    <Card sx={{
                        borderRadius: 4,
                        border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.4)}`,
                        boxShadow: `0 8px 20px ${alpha(COLORS.SUCCESS[200], 0.15)}`,
                        background: `linear-gradient(135deg, 
                                ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.SUCCESS[50], 0.8)} 50%,
                            ${alpha(COLORS.WARNING[50], 0.6)} 100%
                        )`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -25,
                            left: -25,
                            width: 100,
                            height: 100,
                            background: `radial-gradient(circle, ${alpha(COLORS.SUCCESS[200], 0.15)} 0%, transparent 70%)`,
                            borderRadius: '50%'
                        }
                    }}>
                        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Avatar sx={{
                                    bgcolor: COLORS.SUCCESS[500],
                                    width: 42,
                                    height: 42,
                                    fontSize: '1.3rem'
                                }}>
                                    ✨
                                </Avatar>
                                <Typography variant="h6" sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.SUCCESS[700],
                                    fontSize: '1.2rem',
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}>
                                    🐾 Tóm tắt đặt lịch
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2.5 }}>
                                {/* Phần thông tin dịch vụ - bên trái */}
                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <Paper sx={{
                                            p: 1.5,
                                            borderRadius: 3,
                                            background: alpha(COLORS.SUCCESS[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.5)}`
                                        }}>
                                            <Typography variant="body2" sx={{
                                                color: COLORS.SUCCESS[600],
                                                mb: 0.5,
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}>
                                                🐾 Dịch vụ
                                            </Typography>
                                            <Typography variant="body1" sx={{
                                                fontWeight: 'bold',
                                                color: COLORS.SUCCESS[700],
                                                fontSize: '1rem'
                                            }}>
                                                {service.name}
                                            </Typography>
                                        </Paper>

                                        {formData.selectedDate && (
                                            <Paper sx={{
                                                p: 1.5,
                                                borderRadius: 3,
                                                background: alpha(COLORS.INFO[50], 0.6),
                                                border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.INFO[600],
                                                    mb: 0.5,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    📅 Ngày
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.INFO[700],
                                                    fontSize: '1rem'
                                                }}>
                                                    {new Date(formData.selectedDate).toLocaleDateString('vi-VN')}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {formData.selectedTime && (
                                            <Paper sx={{
                                                p: 1.5,
                                                borderRadius: 3,
                                                background: alpha(COLORS.WARNING[50], 0.6),
                                                border: `1px solid ${alpha(COLORS.WARNING[200], 0.5)}`
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.WARNING[600],
                                                    mb: 0.5,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    ⏰ Giờ
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.WARNING[700],
                                                    fontSize: '1rem'
                                                }}>
                                                    {formData.selectedTime} - {formData.selectedDate &&
                                                        calculateEndTime(formData.selectedDate, formData.selectedTime, service.duration)}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {formData.petId && (
                                            <Paper sx={{
                                                p: 1.5,
                                                borderRadius: 3,
                                                background: alpha(COLORS.SECONDARY[50], 0.6),
                                                border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.5)}`
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.SECONDARY[600],
                                                    mb: 0.5,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    🐕 Thú cưng
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.SECONDARY[700],
                                                    fontSize: '1rem'
                                                }}>
                                                    {pets.find(pet => pet.id === formData.petId)?.name}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {(formData.petInfo.species || formData.petInfo.breed || formData.petInfo.weight) && (
                                            <Paper sx={{
                                                p: 1.5,
                                                borderRadius: 3,
                                                background: alpha(COLORS.INFO[50], 0.6),
                                                border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.INFO[600],
                                                    mb: 0.5,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    🐾 Thông tin chi tiết
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {formData.petInfo.species && (
                                                        <Typography variant="body2" sx={{
                                                            fontWeight: 'bold',
                                                            color: COLORS.INFO[700],
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            • Loài: {(() => {
                                                                const speciesMap = {
                                                                    'dog': 'Chó',
                                                                    'cat': 'Mèo',
                                                                    'bird': 'Chim',
                                                                    'rabbit': 'Thỏ',
                                                                    'hamster': 'Hamster',
                                                                    'other': 'Khác'
                                                                };
                                                                return speciesMap[formData.petInfo.species] || formData.petInfo.species;
                                                            })()}
                                                        </Typography>
                                                    )}
                                                    {formData.petInfo.breed && (
                                                        <Typography variant="body2" sx={{
                                                            fontWeight: 'bold',
                                                            color: COLORS.INFO[700],
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            • Giống: {formData.petInfo.breed}
                                                        </Typography>
                                                    )}
                                                    {formData.petInfo.weight && (
                                                        <Typography variant="body2" sx={{
                                                            fontWeight: 'bold',
                                                            color: COLORS.INFO[700],
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            • Cân nặng: {formData.petInfo.weight}kg
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Paper>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Phần tổng tiền và nút - bên phải */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    minWidth: '260px'
                                }}>
                                    <Paper sx={{
                                        p: 2.5,
                                        borderRadius: 4,
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.ERROR[50], 0.8)} 0%, 
                                            ${alpha(COLORS.WARNING[50], 0.6)} 100%
                                        )`,
                                        border: `2px solid ${alpha(COLORS.ERROR[300], 0.5)}`,
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            width: 35,
                                            height: 35,
                                            background: `radial-gradient(circle, ${alpha(COLORS.ERROR[200], 0.25)} 0%, transparent 70%)`,
                                            borderRadius: '50%'
                                        }
                                    }}>
                                        <Typography variant="body2" sx={{
                                            color: COLORS.ERROR[600],
                                            mb: 0.5,
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem'
                                        }}>
                                            💰 Tổng tiền
                                        </Typography>
                                        <Typography variant="h4" sx={{
                                            color: COLORS.ERROR[700],
                                            fontWeight: 'bold',
                                            fontFamily: '"Comic Sans MS", cursive',
                                            position: 'relative',
                                            zIndex: 1,
                                            fontSize: '1.8rem'
                                        }}>
                                            {(() => {
                                                // Kiểm tra xem đã nhập đầy đủ thông tin chưa
                                                const hasRequiredInfo = formData.selectedDate &&
                                                    formData.selectedTime &&
                                                    formData.petInfo.species &&
                                                    formData.petInfo.breed &&
                                                    formData.petInfo.weight;

                                                if (!hasRequiredInfo) {
                                                    return formatPrice(0);
                                                }

                                                // Nếu có đầy đủ thông tin, tính giá dựa trên slot hoặc giá mặc định
                                                const slotPrice = availableSlots.find(slot => slot.time === formData.selectedTime)?.price;
                                                return formatPrice(slotPrice || service.price);
                                            })()}
                                        </Typography>
                                    </Paper>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleSubmit}
                                        disabled={!formData.selectedDate || !formData.selectedTime || !formData.petInfo.species || !formData.petInfo.breed || !formData.petInfo.weight}
                                        sx={{
                                            py: 2,
                                            px: 4,
                                            borderRadius: 4,
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            fontSize: '1.1rem',
                                            minHeight: '56px',
                                            background: `linear-gradient(135deg, 
                                                    ${COLORS.SUCCESS[500]} 0%, 
                                                    ${COLORS.SUCCESS[600]} 50%,
                                                    ${COLORS.WARNING[500]} 100%
                                                )`,
                                            border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.5)}`,
                                            boxShadow: `0 6px 20px ${alpha(COLORS.SUCCESS[300], 0.25)}`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, 
                                                        ${COLORS.SUCCESS[600]} 0%, 
                                                        ${COLORS.SUCCESS[700]} 50%,
                                                        ${COLORS.WARNING[600]} 100%
                                                    )`,
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 10px 28px ${alpha(COLORS.SUCCESS[400], 0.35)}`
                                            },
                                            '&:disabled': {
                                                background: alpha(COLORS.GRAY[300], 0.5),
                                                color: COLORS.GRAY[500],
                                                border: `2px solid ${alpha(COLORS.GRAY[300], 0.3)}`
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        🎉 Tiếp tục thanh toán
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Fade>
    );
};

export default BookingForm;