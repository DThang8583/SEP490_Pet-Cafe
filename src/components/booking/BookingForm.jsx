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
import CalendarGrid from './CalendarGrid';

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
        // Chỉ load pets nếu service yêu cầu thú cưng
        if (service.petRequired !== false) {
            loadPets();
        }
    }, [service.petRequired]);

    const loadPets = async () => {
        if (service.petRequired === false) return;

        setLoadingPets(true);
        try {
            const response = await petApi.getMyPets();
            setPets(response.data || []);
        } catch (error) {
            console.warn('Không thể tải danh sách thú cưng:', error.message);
            // Nếu không có quyền truy cập, vẫn cho phép người dùng nhập thông tin thủ công
            // Điều này không ảnh hưởng đến quá trình đặt lịch
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Function to check if all required fields are filled
    const isFormComplete = () => {
        return formData.selectedDate &&
            formData.selectedTime &&
            formData.petInfo.species &&
            formData.petInfo.breed?.trim() &&
            formData.petInfo.weight?.trim() &&
            formData.customerInfo.name.trim() &&
            formData.customerInfo.phone.trim() &&
            formData.customerInfo.email.trim();
    };

    // Handle slot selection from calendar
    const handleSlotSelect = (date, time) => {
        setFormData(prev => ({
            ...prev,
            selectedDate: date,
            selectedTime: time
        }));
    };

    // Function to calculate form completion percentage
    const getFormCompletionPercentage = () => {
        const requiredFields = [
            formData.selectedDate,
            formData.selectedTime,
            formData.petInfo.species,
            formData.petInfo.breed?.trim(),
            formData.petInfo.weight?.trim(),
            formData.customerInfo.name.trim(),
            formData.customerInfo.phone.trim(),
            formData.customerInfo.email.trim()
        ];

        const filledFields = requiredFields.filter(field => field).length;
        return Math.round((filledFields / requiredFields.length) * 100);
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
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 2, sm: 3, md: 4 },
                minHeight: '80vh',
                background: `linear-gradient(135deg, 
                    ${alpha(COLORS.SECONDARY[50], 0.3)} 0%, 
                    ${alpha(COLORS.PRIMARY[50], 0.4)} 25%,
                    ${alpha(COLORS.INFO[50], 0.3)} 50%,
                    ${alpha(COLORS.SUCCESS[50], 0.2)} 75%,
                    ${alpha(COLORS.WARNING[50], 0.3)} 100%
                )`,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at 20% 80%, ${alpha(COLORS.INFO[100], 0.1)} 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, ${alpha(COLORS.SUCCESS[100], 0.1)} 0%, transparent 50%),
                                radial-gradient(circle at 40% 40%, ${alpha(COLORS.WARNING[100], 0.1)} 0%, transparent 50%)`,
                    pointerEvents: 'none'
                }
            }}>
                {/* Header */}
                <Card sx={{
                    mb: { xs: 3, sm: 4, md: 4 },
                    borderRadius: 6,
                    background: `linear-gradient(145deg, 
                        ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                        ${alpha(COLORS.SECONDARY[50], 0.95)} 50%,
                        ${alpha(COLORS.INFO[50], 0.9)} 100%
                    )`,
                    border: `1px solid ${alpha(COLORS.INFO[200], 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(COLORS.INFO[200], 0.15)}, 
                               0 2px 8px ${alpha(COLORS.INFO[100], 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, 
                            ${COLORS.INFO[400]} 0%, 
                            ${COLORS.SUCCESS[400]} 50%, 
                            ${COLORS.WARNING[400]} 100%
                        )`
                    },
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${alpha(COLORS.INFO[200], 0.2)}, 
                                   0 4px 12px ${alpha(COLORS.INFO[100], 0.15)}`
                    }
                }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Button
                                startIcon={<ArrowBack />}
                                onClick={onBack}
                                sx={{
                                    color: COLORS.INFO[600],
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: 3,
                                    px: 2,
                                    py: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: alpha(COLORS.INFO[100], 0.8),
                                        color: COLORS.INFO[700],
                                        transform: 'translateX(-2px)'
                                    }
                                }}
                            >
                                Quay lại
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h4" sx={{
                                fontWeight: 700,
                                color: COLORS.INFO[700],
                                fontFamily: '"Inter", "Roboto", sans-serif',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2
                            }}>
                                Đặt lịch: {service.name}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{
                            color: COLORS.TEXT.SECONDARY,
                            mt: 1.5,
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            opacity: 0.8
                        }}>
                            {service.description}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Calendar Grid */}
                <Box sx={{
                    mb: { xs: 4, sm: 5, md: 5 },
                    width: '100%'
                }}>
                    <CalendarGrid
                        formData={formData}
                        onSlotSelect={handleSlotSelect}
                        availableSlots={availableSlots}
                    />
                </Box>

                {/* Thông tin thú cưng */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 5 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        background: `linear-gradient(145deg, 
                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.INFO[50], 0.95)} 50%,
                            ${alpha(COLORS.SUCCESS[50], 0.9)} 100%
                        )`,
                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(COLORS.INFO[200], 0.15)}, 
                                   0 2px 8px ${alpha(COLORS.INFO[100], 0.1)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, 
                                ${COLORS.INFO[400]} 0%, 
                                ${COLORS.SUCCESS[400]} 100%
                            )`
                        },
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 40px ${alpha(COLORS.INFO[200], 0.2)}, 
                                       0 4px 12px ${alpha(COLORS.INFO[100], 0.15)}`
                        }
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.INFO[700],
                                mb: 3,
                                fontSize: '1.1rem',
                                letterSpacing: '-0.01em'
                            }}>
                                🐾 Thông tin thú cưng
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3, md: 3 } }}>
                                {/* Loài thú cưng */}
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
                                            borderRadius: 4,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.95),
                                            minHeight: '56px',
                                            border: `1px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: COLORS.INFO[400],
                                                boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.15)}`,
                                                backgroundColor: alpha(COLORS.INFO[50], 0.1)
                                            },
                                            '&.Mui-focused': {
                                                borderColor: COLORS.INFO[500],
                                                boxShadow: `0 0 0 3px ${alpha(COLORS.INFO[300], 0.2)}`,
                                                backgroundColor: alpha(COLORS.INFO[50], 0.05)
                                            },
                                            '& .MuiSelect-select': {
                                                fontSize: '0.95rem',
                                                padding: '16px 20px',
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                color: COLORS.TEXT.PRIMARY
                                            }
                                        }}
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
                                    </Select>
                                    {errors.petInfo?.species && (
                                        <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5 }}>
                                            {errors.petInfo.species}
                                        </Typography>
                                    )}
                                </FormControl>

                                {/* Giống thú cưng */}
                                <TextField
                                    fullWidth
                                    placeholder="Nhập giống thú cưng"
                                    value={formData.petInfo.breed}
                                    onChange={(e) => handlePetInfoChange('breed', e.target.value)}
                                    error={!!errors.petInfo?.breed}
                                    helperText={errors.petInfo?.breed}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 4,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.95),
                                            minHeight: '56px',
                                            border: `1px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: COLORS.INFO[400],
                                                boxShadow: `0 4px 12px ${alpha(COLORS.INFO[300], 0.15)}`,
                                                backgroundColor: alpha(COLORS.INFO[50], 0.1)
                                            },
                                            '&.Mui-focused': {
                                                borderColor: COLORS.INFO[500],
                                                boxShadow: `0 0 0 3px ${alpha(COLORS.INFO[300], 0.2)}`,
                                                backgroundColor: alpha(COLORS.INFO[50], 0.05)
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            fontSize: '0.95rem',
                                            padding: '16px 20px',
                                            fontWeight: 500,
                                            color: COLORS.TEXT.PRIMARY,
                                            '&::placeholder': {
                                                color: COLORS.INFO[500],
                                                opacity: 0.7,
                                                fontWeight: 400
                                            }
                                        }
                                    }}
                                />

                                {/* Cân nặng */}
                                <TextField
                                    fullWidth
                                    placeholder="Nhập cân nặng (kg)"
                                    type="number"
                                    value={formData.petInfo.weight}
                                    onChange={(e) => handlePetInfoChange('weight', e.target.value)}
                                    error={!!errors.petInfo?.weight}
                                    helperText={errors.petInfo?.weight}
                                    InputProps={{
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
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Thông tin liên hệ */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 5 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        background: `linear-gradient(145deg, 
                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.SECONDARY[50], 0.95)} 50%,
                            ${alpha(COLORS.INFO[50], 0.9)} 100%
                        )`,
                        border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(COLORS.SECONDARY[200], 0.15)}, 
                                   0 2px 8px ${alpha(COLORS.SECONDARY[100], 0.1)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, 
                                ${COLORS.SECONDARY[400]} 0%, 
                                ${COLORS.INFO[400]} 100%
                            )`
                        },
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 40px ${alpha(COLORS.SECONDARY[200], 0.2)}, 
                                       0 4px 12px ${alpha(COLORS.SECONDARY[100], 0.15)}`
                        }
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.SECONDARY[700],
                                mb: 3,
                                fontSize: '1.1rem',
                                letterSpacing: '-0.01em'
                            }}>
                                👤 Thông tin liên hệ
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3, md: 3 } }}>
                                {/* Họ tên */}
                                <TextField
                                    fullWidth
                                    placeholder="Nhập tên của bạn"
                                    value={formData.customerInfo.name}
                                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                                    error={!!errors.customerInfo?.name}
                                    helperText={errors.customerInfo?.name}
                                    InputProps={{}}
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

                                {/* Số điện thoại */}
                                <TextField
                                    fullWidth
                                    placeholder="Nhập số điện thoại của bạn"
                                    value={formData.customerInfo.phone}
                                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                                    error={!!errors.customerInfo?.phone}
                                    helperText={errors.customerInfo?.phone}
                                    InputProps={{}}
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

                                {/* Email */}
                                <TextField
                                    fullWidth
                                    placeholder="Nhập email của bạn"
                                    type="email"
                                    value={formData.customerInfo.email}
                                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                                    error={!!errors.customerInfo?.email}
                                    helperText={errors.customerInfo?.email}
                                    InputProps={{}}
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
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Tóm tắt đặt lịch */}
                <Box sx={{
                    mb: { xs: 3, sm: 4, md: 4 }
                }}>
                    <Card sx={{
                        borderRadius: 6,
                        background: `linear-gradient(145deg, 
                            ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, 
                            ${alpha(COLORS.SUCCESS[50], 0.95)} 50%,
                            ${alpha(COLORS.WARNING[50], 0.9)} 100%
                        )`,
                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                        boxShadow: `0 4px 20px ${alpha(COLORS.SUCCESS[200], 0.15)}, 
                                   0 2px 8px ${alpha(COLORS.SUCCESS[100], 0.1)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, 
                                ${COLORS.SUCCESS[400]} 0%, 
                                ${COLORS.WARNING[400]} 50%,
                                ${COLORS.INFO[400]} 100%
                            )`
                        },
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 32px ${alpha(COLORS.SUCCESS[200], 0.2)}, 
                                       0 4px 12px ${alpha(COLORS.SUCCESS[100], 0.15)}`
                        }
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.SUCCESS[700],
                                mb: 3,
                                fontSize: '1.1rem',
                                letterSpacing: '-0.01em'
                            }}>
                                📋 Tóm tắt đặt lịch
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', lg: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'stretch', lg: 'flex-start' },
                                gap: { xs: 3, lg: 4 }
                            }}>
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
                                                    Ngày
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
                                                    Giờ
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
                                    </Stack>
                                </Box>

                                {/* Phần tổng tiền và nút - bên phải */}
                                <Box sx={{
                                    minWidth: { xs: '100%', lg: '280px' }
                                }}>
                                    <Stack spacing={2}>
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: `linear-gradient(135deg, 
                                                ${alpha(COLORS.SUCCESS[100], 0.8)} 0%, 
                                                ${alpha(COLORS.SUCCESS[200], 0.6)} 100%
                                            )`,
                                            border: `1px solid ${alpha(COLORS.SUCCESS[300], 0.7)}`,
                                            boxShadow: `0 2px 8px ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="body2" sx={{
                                                color: COLORS.SUCCESS[600],
                                                fontWeight: 600,
                                                mb: 1,
                                                fontSize: '0.9rem'
                                            }}>
                                                💰 TỔNG TIỀN
                                            </Typography>
                                            <Typography variant="h5" sx={{
                                                color: COLORS.SUCCESS[700],
                                                fontWeight: 700,
                                                textShadow: `0 1px 2px ${alpha(COLORS.SUCCESS[200], 0.3)}`
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
                                            disabled={!isFormComplete()}
                                            sx={{
                                                py: 2.5,
                                                px: 5,
                                                borderRadius: 6,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                fontSize: '1rem',
                                                minHeight: 60,
                                                width: '100%',
                                                background: `linear-gradient(135deg, 
                                                    ${COLORS.SUCCESS[500]} 0%, 
                                                    ${COLORS.SUCCESS[600]} 50%,
                                                    ${COLORS.WARNING[500]} 100%
                                                )`,
                                                border: `1px solid ${alpha(COLORS.SUCCESS[400], 0.3)}`,
                                                boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[300], 0.3)}, 
                                                           0 2px 4px ${alpha(COLORS.SUCCESS[200], 0.2)}`,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, 
                                                            ${COLORS.SUCCESS[600]} 0%, 
                                                            ${COLORS.SUCCESS[700]} 50%,
                                                            ${COLORS.WARNING[600]} 100%
                                                        )`,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 6px 16px ${alpha(COLORS.SUCCESS[400], 0.4)}, 
                                                               0 3px 8px ${alpha(COLORS.SUCCESS[300], 0.3)}`
                                                },
                                                '&:disabled': {
                                                    background: `linear-gradient(135deg, 
                                                        ${alpha(COLORS.GRAY[300], 0.6)} 0%, 
                                                        ${alpha(COLORS.GRAY[400], 0.5)} 100%
                                                    )`,
                                                    color: COLORS.GRAY[500],
                                                    border: `1px solid ${alpha(COLORS.GRAY[300], 0.3)}`,
                                                    boxShadow: `0 1px 2px ${alpha(COLORS.GRAY[200], 0.2)}`,
                                                    transform: 'none',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.7
                                                },
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            {isFormComplete() ? '💳 Thanh toán' : '⏳ Điền đầy đủ thông tin'}
                                        </Button>
                                    </Stack>
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