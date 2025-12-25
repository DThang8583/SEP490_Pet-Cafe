import React, { useState, useEffect, Suspense } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, CardMedia,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Alert, alpha, Fade, Zoom, Grow,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    Paper, TextField
} from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
    Pets, Schedule, Payment, CheckCircle, Star,
    AccessTime, LocationOn, Person, Phone, Email, School, LocalHospital, CalendarToday,
    Store, Business, Restaurant, LocalCafe, Spa, LocalActivity, Loyalty, People, Note,
    Search, Clear
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { authApi, customerApi } from '../../api/authApi';
import serviceApi from '../../api/serviceApi';
import { bookingApi } from '../../api/bookingApi';
import { notificationApi } from '../../api/notificationApi';
import feedbackApi from '../../api/feedbackApi';
import AlertModal from '../../components/modals/AlertModal';

// Utility function
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};
import Loading from '../../components/loading/Loading';
import ServiceCard from '../../components/booking/ServiceCard';
import BookingForm from '../../components/booking/BookingForm';
import BookingDateModal from '../../components/modals/BookingDateModal';
import PaymentModal from '../../components/booking/PaymentModal';
import BookingConfirmation from '../../components/booking/BookingConfirmation';
import FeedbackModal from '../../components/booking/FeedbackModal';
import BookingHistory from '../../components/booking/BookingHistory';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">
                        Có lỗi xảy ra khi tải trang
                    </Typography>
                    <Button onClick={() => window.location.reload()}>
                        Tải lại trang
                    </Button>
                </Box>
            );
        }
        return this.props.children;
    }
}

const BookingPage = () => {
    // State management
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [bookingData, setBookingData] = useState({});
    const [showPayment, setShowPayment] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [completedBooking, setCompletedBooking] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyMode, setHistoryMode] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });
    const [currentUser, setCurrentUser] = useState(null);
    const [showDateSelection, setShowDateSelection] = useState(false);
    const [serviceForDateSelection, setServiceForDateSelection] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [filterStartTime, setFilterStartTime] = useState('');
    const [filterEndTime, setFilterEndTime] = useState('');
    const [availableTimeRanges, setAvailableTimeRanges] = useState([]);
    const [allTimeRanges, setAllTimeRanges] = useState([]);

    const steps = ['Chọn dịch vụ', 'Điền thông tin', 'Thanh toán', 'Xác nhận'];

    // Reusable style for search buttons to keep UI consistent
    const searchButtonSx = {
        px: 3.5,
        py: 1.1,
        minHeight: 44,
        borderRadius: 2,
        color: 'white',
        backgroundImage: `linear-gradient(90deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[600]} 50%, ${COLORS.SECONDARY[500]} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'filterBtnShift 4s ease-in-out infinite',
        boxShadow: `0 10px 30px ${alpha(COLORS.PRIMARY[500], 0.18)}`,
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 14px 36px ${alpha(COLORS.PRIMARY[500], 0.22)}`
        },
        '& .MuiButton-startIcon': { mr: 1.2 },
        '@keyframes filterBtnShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
        }
    };
    // Load data on component mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async (overrideStartTime = null, overrideEndTime = null) => {
        try {
            setLoading(true);

            // Check authentication
            console.log('Checking authentication...');
            const user = authApi.getCurrentUser();
            console.log('Current user:', user);

            if (user) {
                setCurrentUser(user);
                console.log('User authenticated successfully:', user.name);
            } else {
                console.log('No user found, showing services in view-only mode');
            }

            // Get current user after potential auto-login  
            const currentUserCheck = authApi.getCurrentUser();
            if (currentUserCheck?.role !== 'customer') {
                console.log('User is not customer, showing services in view-only mode');
                // Don't return, still show services but disable booking functionality
            } else {
                console.log('User role check passed:', currentUserCheck.name);
            }

            // Load available services from API (include optional time filters)
            console.log('Loading services...');
            const token = localStorage.getItem('authToken');
            let url = 'https://petcafes.azurewebsites.net/api/services';
            const params = new URLSearchParams();
            const startToUse = overrideStartTime ?? filterStartTime;
            const endToUse = overrideEndTime ?? filterEndTime;
            if (startToUse) params.append('start_time', `${startToUse}:00`);
            if (endToUse) params.append('end_time', `${endToUse}:00`);
            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            console.log('Services API response:', json);

            // Extract services from response.data and filter active, non-deleted services
            const rawServices = Array.isArray(json?.data)
                ? json.data.filter(service => service?.is_active && !service?.is_deleted)
                : [];

            // Map API data to component format
            const apiServices = rawServices.map(service => {
                // Determine petRequired based on slots
                // If service has slots with pet_group_id or pet_id, it's a pet care service (petRequired = true)
                // If all slots have pet_group_id and pet_id as null, it's a cafe service (petRequired = false)
                const hasPetSlots = service.slots && service.slots.length > 0
                    ? service.slots.some(slot => slot?.pet_group_id || slot?.pet_id)
                    : false;
                const petRequired = hasPetSlots;

                // Use base_price from API, or get from slots if available
                const price = service.base_price || 0;

                return {
                    ...service,
                    id: service.id,
                    name: service.name,
                    description: service.description,
                    price: price,
                    base_price: service.base_price,
                    duration_minutes: service.duration_minutes,
                    image_url: service.image_url,
                    thumbnails: service.thumbnails || [],
                    petRequired: petRequired,
                    slots: service.slots || [],
                    task: service.task,
                    task_id: service.task_id,
                    order_details: service.order_details || [],
                    bookings: service.bookings || [],
                    feedbacks: service.feedbacks || [],
                    created_at: service.created_at,
                    updated_at: service.updated_at
                };
            });

            console.log('Mapped services:', apiServices);
            setServices(apiServices);
            // If a service was preselected (from Pets page), set it as selected and open the form
            try {
                const pre = localStorage.getItem('preselectService');
                if (pre) {
                    const parsed = JSON.parse(pre);
                    if (parsed?.serviceId) {
                        const svc = apiServices.find(s => s.id === parsed.serviceId);
                        if (svc) {
                            setSelectedService(svc);
                            setBookingData(prev => ({ ...prev, service: svc }));
                            setCurrentStep(1);
                        }
                    }
                    localStorage.removeItem('preselectService');
                }
                // Also support preselectBooking which includes slotId and date
                const preBooking = localStorage.getItem('preselectBooking');
                if (preBooking) {
                    const parsedB = JSON.parse(preBooking);
                    if (parsedB?.serviceId) {
                        const svcB = apiServices.find(s => s.id === parsedB.serviceId);
                        if (svcB) {
                            setSelectedService(svcB);
                            setBookingData(prev => ({
                                ...prev,
                                service: svcB,
                                slotId: parsedB.slotId || prev.slotId,
                                slot: svcB.slots?.find(sl => sl.id === parsedB.slotId) || prev.slot,
                                date: parsedB.date || prev.date,
                                selectedDate: parsedB.date || prev.selectedDate
                            }));
                            setCurrentStep(1);
                        }
                    }
                    localStorage.removeItem('preselectBooking');
                }
            } catch (e) {
                console.warn('Error applying preselectService', e);
            }

            // Extract unique available time ranges from slots for quick filter selection
            try {
                const timeMap = new Map();
                apiServices.forEach(svc => {
                    (svc.slots || []).forEach(slot => {
                        if (slot && !slot.is_deleted && slot.service_status === 'AVAILABLE') {
                            const key = `${slot.start_time}-${slot.end_time}`;
                            if (!timeMap.has(key)) {
                                timeMap.set(key, { start: slot.start_time, end: slot.end_time });
                            }
                        }
                    });
                });
                const ranges = Array.from(timeMap.values());
                setAvailableTimeRanges(ranges);
                // Merge ranges into the full set so filter buttons remain visible even when API returns filtered results
                try {
                    const merged = new Map();
                    (allTimeRanges || []).forEach(r => {
                        const k = `${r.start}-${r.end}`;
                        merged.set(k, r);
                    });
                    ranges.forEach(r => {
                        const k = `${r.start}-${r.end}`;
                        if (!merged.has(k)) merged.set(k, r);
                    });
                    setAllTimeRanges(Array.from(merged.values()));
                } catch (e) {
                    setAllTimeRanges(ranges);
                }
            } catch (e) {
                console.warn('Error extracting available time ranges', e);
                setAvailableTimeRanges([]);
            }

            setLoading(false);
        } catch (err) {
            console.error('LoadInitialData error:', err);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: err.message || 'Có lỗi xảy ra khi tải dữ liệu',
                type: 'error'
            });
            setLoading(false);
        }
    };


    // Helper function to check if cafe service is available based on slots
    const isCafeServiceAvailable = (service) => {
        if (service.petRequired === false) {
            // Check if service has available slots
            if (!service.slots || service.slots.length === 0) {
                return false;
            }

            // Check if any slot is available (service_status === 'AVAILABLE')
            const hasAvailableSlots = service.slots.some(slot =>
                slot?.service_status === 'AVAILABLE' && !slot?.is_deleted
            );

            return hasAvailableSlots;
        }
        return true;
    };

    // Sort services: available cafe services first, then pet care services
    const sortedServices = (services || []).sort((a, b) => {
        if (!a || !b) return 0;

        // Check if services are available (consistent with filtering logic)
        let aAvailable = false;
        if (a.petRequired === true) {
            aAvailable = a.slots && a.slots.length > 0;
        } else {
            aAvailable = true; // Services without pet groups are always considered available
        }

        let bAvailable = false;
        if (b.petRequired === true) {
            bAvailable = b.slots && b.slots.length > 0;
        } else {
            bAvailable = true; // Services without pet groups are always considered available
        }

        // Only sort available services
        if (!aAvailable && bAvailable) return 1;
        if (aAvailable && !bAvailable) return -1;

        // Among available services, prioritize pet care services
        if (aAvailable && bAvailable) {
            if (a.petRequired === true && b.petRequired === false) return -1;
            if (a.petRequired === false && b.petRequired === true) return 1;
        }

        return 0;
    });

    // Filter out unavailable services before creating rows
    const availableServices = sortedServices.filter(service => {
        if (service.petRequired === true) {
            // Pet care services: show if they have slots
            return service.slots && service.slots.length > 0;
        }
        // Services without pet groups: always show (they might not have slots yet)
        return true;
    });

    // Chia services thành các nhóm 3 để hiển thị cố định 3 card/hàng
    const servicesPerRow = 3;
    const serviceRows = [];
    try {
        for (let i = 0; i < availableServices.length; i += servicesPerRow) {
            const rowServices = availableServices.slice(i, i + servicesPerRow);
            // Chỉ thêm empty slots nếu không phải hàng cuối cùng
            const isLastRow = i + servicesPerRow >= availableServices.length;
            if (!isLastRow) {
                // Đảm bảo mỗi hàng (trừ hàng cuối) luôn có đúng 3 cards
                while (rowServices.length < servicesPerRow) {
                    rowServices.push(null); // Thêm empty slot
                }
            }
            serviceRows.push(rowServices);
        }
    } catch (error) {
        console.error('Error creating service rows:', error);
    }


    // Handle service selection - show date selection popup
    const handleServiceSelect = (service) => {
        try {
            if (!service) {
                console.error('Service is null or undefined');
                return;
            }
            setServiceForDateSelection(service);
            setShowDateSelection(true);
        } catch (error) {
            console.error('Error selecting service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi chọn dịch vụ',
                type: 'error'
            });
        }
    };

    // Handle date selection confirmation
    const handleDateConfirm = (slot, date) => {
        if (!date || !slot) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng chọn ngày và khung giờ',
                type: 'error'
            });
            return;
        }
        setSelectedDate(date);
        setSelectedSlot(slot);
        setSelectedService(serviceForDateSelection);
        setBookingData({
            ...bookingData,
            service: serviceForDateSelection,
            selectedDate: date,
            slotId: slot.id,
            slot: slot,
            date: date,
            time: slot.start_time,
            pet_group_id: slot.pet_group_id || null,
            pet_group: slot.pet_group || null
        });
        setShowDateSelection(false);
        setServiceForDateSelection(null);
        setCurrentStep(1);
    };

    // Handle booking form submission
    const handleBookingSubmit = (formData) => {
        setBookingData({ ...bookingData, ...formData });
        setCurrentStep(2);
        setShowPayment(true);
    };

    // Handle payment completion
    const handlePaymentComplete = async (paymentData) => {
        try {
            setShowPayment(false);

            // Build bookingDateTime depending on cafe vs pet service
            const svc = bookingData.service;
            const isCafe = svc?.petRequired === false;
            let bookingDateTime = bookingData.bookingDateTime;
            if (!bookingDateTime) {
                if (isCafe) {
                    // For cafe services, get start_time from selected slot
                    const selectedSlot = svc?.slots?.find(slot => slot.id === bookingData.slotId);
                    const sessionStart = selectedSlot?.start_time || bookingData.sessionId?.split('-').pop() || '09:00';
                    bookingDateTime = `${bookingData.date}T${sessionStart}`;
                } else if (bookingData.date && bookingData.time) {
                    bookingDateTime = `${bookingData.date}T${bookingData.time}:00`;
                } else if (bookingData.date && bookingData.slotId) {
                    // Get time from selected slot
                    const selectedSlot = svc?.slots?.find(slot => slot.id === bookingData.slotId);
                    const slotStart = selectedSlot?.start_time || '09:00';
                    bookingDateTime = `${bookingData.date}T${slotStart}`;
                }
            }

            // Ensure pet object for pet-care services (fallback from petInfo)
            let petForBooking = bookingData.pet;
            if (!isCafe) {
                if (!petForBooking && bookingData.petInfo) {
                    petForBooking = {
                        id: bookingData.petInfo?.id || `temp-pet-${Date.now()}`,
                        name: bookingData.petInfo?.name || bookingData.petInfo?.breed || '',
                        species: bookingData.petInfo?.species,
                        breed: bookingData.petInfo?.breed,
                        weight: bookingData.petInfo?.weight
                    };
                }
            }

            const completeBookingData = {
                ...bookingData,
                ...paymentData,
                bookingDateTime,
                pet: petForBooking,
                pet_group_id: bookingData.pet_group_id || null,
                pet_group: bookingData.pet_group || null,
                customerId: currentUser.id,
                status: 'pending',
                paymentMethod: paymentData.paymentMethod,
                paymentStatus: paymentData.status === 'completed' ? 'paid' : (paymentData.status || 'pending'),
                createdAt: new Date().toISOString()
            };

            // Create booking
            const response = await bookingApi.createBooking(completeBookingData);

            if (response.success) {
                setCompletedBooking(response.data);
                setCurrentStep(3);
                setShowConfirmation(true);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
                    type: 'success'
                });
            }
        } catch (err) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: err.message || 'Có lỗi xảy ra khi xử lý thanh toán',
                type: 'error'
            });
        }
    };

    // Handle feedback submission
    const handleFeedbackSubmit = async (feedbackData) => {
        try {
            await feedbackApi.submitFeedback({
                ...feedbackData,
                bookingId: completedBooking?.id,
                type: 'service_feedback'
            });
            setShowFeedback(false);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Cảm ơn bạn đã gửi phản hồi!',
                type: 'success'
            });
        } catch (err) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: err.message || 'Có lỗi xảy ra khi gửi phản hồi',
                type: 'error'
            });
        }
    };

    // Reset booking process
    const resetBooking = () => {
        setSelectedService(null);
        setBookingData({});
        setCurrentStep(0);
        setCompletedBooking(null);
        setShowConfirmation(false);
    };

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                variant="cafe"
                size="large"
                message="Đang tải dịch vụ Pet Cafe..."
            />
        );
    }

    return (
        <ErrorBoundary>
            <Box sx={{
                minHeight: '100vh',
                width: '100%',
                backgroundColor: COLORS.BACKGROUND.DEFAULT,
                position: 'relative',
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1, sm: 2, md: 3 }
            }}>
                {/* Floating decorative elements - Removed to make background clearer */}

                <Box sx={{
                    py: historyMode ? 0.5 : 1,
                    px: historyMode ? 0 : 0,
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 'none',
                    minHeight: '100vh'
                }}>
                    {/* Header */}
                    {!historyMode && (
                        <Fade in timeout={800}>
                            <Box sx={{ textAlign: 'center', mb: 1 }}>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        fontWeight: 'bold',
                                        background: `linear-gradient(90deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[600]} 40%, ${COLORS.PRIMARY[400]} 80%)`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 0.5,
                                        fontFamily: '"Comic Sans MS", cursive',
                                        fontSize: { xs: '1.5rem', md: '1.9rem' },
                                        textAlign: 'center',
                                        letterSpacing: '-0.02em',
                                        textShadow: `0 6px 18px ${alpha(COLORS.SECONDARY[400], 0.12)}`,
                                        position: 'relative',
                                        // shimmer animation
                                        backgroundSize: '200% 100%',
                                        animation: 'headerShimmer 6s linear infinite'
                                    }}
                                >
                                    <Box component="span" sx={{ display: 'inline-block', mr: 1 }}>
                                        🐾
                                    </Box>
                                    Đặt dịch vụ Pet Cafe
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: COLORS.TEXT.SECONDARY,
                                        maxWidth: '600px',
                                        mx: 'auto',
                                        mb: 4
                                    }}
                                >
                                    Chọn dịch vụ chăm sóc tốt nhất cho thú cưng của bạn
                                </Typography>

                                {/* Progress Stepper */}
                                <Box sx={{
                                    maxWidth: 600,
                                    mx: 'auto',
                                    mb: 4,
                                    p: 3,
                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                    borderRadius: 4,
                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                    boxShadow: `0 10px 40px ${alpha(COLORS.ERROR[200], 0.22)}`,
                                    position: 'relative',
                                    overflow: 'visible',
                                    // shimmer around stepper
                                    '&:after': {
                                        content: "''",
                                        position: 'absolute',
                                        inset: -6,
                                        borderRadius: 8,
                                        background: `linear-gradient(90deg, ${alpha(COLORS.ERROR[100],0.4)}, ${alpha(COLORS.PRIMARY[100],0.2)}, ${alpha(COLORS.SECONDARY[100],0.3)})`,
                                        filter: 'blur(12px)',
                                        zIndex: 0,
                                        opacity: 0.9
                                    }
                                }}>
                                    <Stepper activeStep={currentStep} alternativeLabel>
                                        {steps.map((label, index) => (
                                            <Step key={label}>
                                                <StepLabel
                                                    sx={{
                                                        '& .MuiStepLabel-label': {
                                                            color: index <= currentStep ? COLORS.ERROR[600] : COLORS.TEXT.SECONDARY,
                                                            fontWeight: index <= currentStep ? 'bold' : 'normal'
                                                        },
                                                        '& .MuiStepIcon-root': {
                                                            color: index <= currentStep ? COLORS.ERROR[500] : COLORS.GRAY[300]
                                                        }
                                                    }}
                                                >
                                                    {label}
                                                </StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                </Box>
                            </Box>
                        </Fade>
                    )}

                    {/* keyframes for header shimmer */}
                    <style>{`
                        @keyframes headerShimmer {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                    `}</style>

                    {/* Step 0: Service Selection */}
                    {currentStep === 0 && (
                        <Fade in={true} timeout={1000} unmountOnExit={false}>
                            <Box>
                                {/* History Button */}
                                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowHistory(true)}
                                        sx={{
                                            borderColor: COLORS.PRIMARY[400],
                                            color: COLORS.PRIMARY[600],
                                            '&:hover': {
                                                borderColor: COLORS.PRIMARY[500],
                                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.8)
                                            }
                                        }}
                                    >
                                        Xem lịch sử đặt lịch
                                    </Button>
                                </Box>

                                {/* Time filters */}
                                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                    {/* Time range quick pick buttons (replace selects) */}
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', maxWidth: 520 }}>
                                        {allTimeRanges && allTimeRanges.length > 0 ? allTimeRanges.map((r) => {
                                            const start = r.start?.slice(0,5) || '';
                                            const end = r.end?.slice(0,5) || '';
                                            const label = `${start} - ${end}`;
                                            const isActive = filterStartTime === start && filterEndTime === end;
                                            return (
                                                <Button
                                                    key={`${r.start}-${r.end}`}
                                                    onClick={() => {
                                                        setFilterStartTime(start);
                                                        setFilterEndTime(end);
                                                        // reload services with the selected time filter (pass overrides to avoid stale state)
                                                        loadInitialData(start, end);
                                                    }}
                                                    sx={{
                                                        minWidth: 110,
                                                        px: 2,
                                                        py: 0.6,
                                                        borderRadius: 6,
                                                        fontWeight: 700,
                                                        color: isActive ? '#fff' : COLORS.TEXT.PRIMARY,
                                                        background: isActive ? `linear-gradient(135deg, ${COLORS.PRIMARY[600]} 0%, ${COLORS.PRIMARY[500]} 100%)` : alpha(COLORS.PRIMARY[50], 0.9),
                                                        boxShadow: isActive ? `0 12px 30px ${alpha(COLORS.PRIMARY[500], 0.24)}` : `0 6px 18px ${alpha(COLORS.GRAY[900], 0.03)}`,
                                                        border: isActive ? 'none' : `1px solid ${alpha(COLORS.GRAY[300], 0.4)}`,
                                                        '&:hover': {
                                                            transform: 'translateY(-3px)',
                                                            boxShadow: `0 14px 36px ${alpha(COLORS.PRIMARY[500], 0.18)}`
                                                        }
                                                    }}
                                                >
                                                    {label}
                                                </Button>
                                            );
                                        }) : (
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>Không có khung giờ</Typography>
                                        )}
                                        {/* Clear filters button */}
                                        <Button
                                            onClick={() => {
                                                setFilterStartTime('');
                                                setFilterEndTime('');
                                                // call with empty overrides so API is not sent time params
                                                loadInitialData('', '');
                                            }}
                                            startIcon={<Clear />}
                                            sx={{
                                                ml: 1,
                                                borderRadius: 6,
                                                minWidth: 96,
                                                color: COLORS.PRIMARY[600],
                                                border: `1px solid ${alpha(COLORS.PRIMARY[300], 0.6)}`,
                                                background: 'transparent',
                                                '&:hover': {
                                                    backgroundColor: alpha(COLORS.PRIMARY[50], 0.9)
                                                }
                                            }}
                                        >
                                            Xóa
                                        </Button>
                                    </Box>
                                    {/* Search and clear buttons removed as requested */}
                                </Box>
                                {/* Removed quick chips area */}

                                {/* Services Grid - Fixed 3 cards per row with equal height */}
                                {serviceRows && serviceRows.length > 0 && serviceRows.map((rowServices, rowIndex) => (
                                    <Box key={rowIndex} sx={{ mb: 3 }}>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                                            gap: 3,
                                            '& > *': {
                                                minHeight: '500px' // Fixed height for all cards
                                            }
                                        }}>
                                            {rowServices && rowServices.map((service, cardIndex) => {
                                                // Bỏ qua empty slots (null) khi render
                                                if (!service) return null;

                                                return (
                                                    <Box key={service.id}>
                                                        <Grow
                                                            in={true}
                                                            timeout={800 + (rowIndex * 3 + cardIndex) * 100}
                                                            style={{ transformOrigin: '0 0 0' }}
                                                        >
                                                            <Box>
                                                                <ServiceCard
                                                                    service={service}
                                                                    onSelect={() => handleServiceSelect(service)}
                                                                    onCardClick={() => handleServiceSelect(service)}
                                                                />
                                                            </Box>
                                                        </Grow>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                ))}

                                {loading ? (
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Loading
                                            message="Đang tải danh sách dịch vụ..."
                                            size="large"
                                            variant="cafe"
                                        />
                                    </Box>
                                ) : availableServices.length === 0 ? (
                                    <Grow in={true} timeout={600}>
                                        <Card sx={{
                                            height: 400,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.GRAY[100], 0.8)} 0%, 
                                            ${alpha(COLORS.GRAY[50], 0.6)} 100%
                                        )`,
                                            border: `2px dashed ${alpha(COLORS.GRAY[300], 0.5)}`,
                                            borderRadius: 4
                                        }}>
                                            <CardContent sx={{ textAlign: 'center' }}>
                                                <Pets sx={{ fontSize: 64, color: COLORS.GRAY[400], mb: 2 }} />
                                                <Typography variant="h5" sx={{ color: COLORS.GRAY[600], mb: 1 }}>
                                                    Không có dịch vụ nào
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    Hiện tại chưa có dịch vụ nào khả dụng
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grow>
                                ) : null}
                            </Box>
                        </Fade>
                    )}

                    {/* Step 1: Booking Form */}
                    {currentStep === 1 && selectedService && (
                        <Suspense fallback={<Loading message="Đang tải form..." />}>
                            <Box sx={{ mt: 4 }}>
                                <BookingForm
                                    service={selectedService}
                                    bookingData={bookingData}
                                    onSubmit={handleBookingSubmit}
                                    onBack={() => setCurrentStep(0)}
                                />
                            </Box>
                        </Suspense>
                    )}

                    {/* Step 3: Confirmation Fallback Page (in case modal is closed) */}
                    {currentStep === 3 && !historyMode && completedBooking && (
                        <Fade in={true} timeout={600} unmountOnExit={false}>
                            <Box sx={{ maxWidth: 960, mx: 'auto', mt: 2 }}>
                                <Card sx={{
                                    borderRadius: 4,
                                    border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`,
                                    background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)} 0%, ${alpha(COLORS.SUCCESS[50], 0.8)} 100%)`
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                                            <CheckCircle sx={{ fontSize: 40, color: COLORS.SUCCESS[500], mb: 1 }} />
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.SUCCESS[700] }}>
                                                Đặt lịch thành công!
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Chúng tôi đã nhận được yêu cầu và sẽ liên hệ xác nhận trong thời gian sớm nhất.
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={8}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">Dịch vụ</Typography>
                                                    <Typography variant="subtitle1" fontWeight="bold">{completedBooking?.service?.name}</Typography>
                                                </Box>
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">Thời gian</Typography>
                                                    <Typography variant="subtitle2" fontWeight="bold">{new Date(completedBooking?.bookingDateTime).toLocaleString('vi-VN')}</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: alpha(COLORS.ERROR[50], 0.6), border: `1px solid ${alpha(COLORS.ERROR[200], 0.6)}` }}>
                                                    <Typography variant="body2" color="text.secondary">Tổng cộng</Typography>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.ERROR[700] }}>
                                                        {formatPrice(completedBooking?.finalPrice || completedBooking?.service?.base_price || completedBooking?.service?.price || 0)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                        Trạng thái thanh toán: {completedBooking?.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                            <Button variant="outlined" onClick={resetBooking}>
                                                Quay về trang đặt dịch vụ
                                            </Button>
                                            <Button variant="outlined" onClick={() => setShowConfirmation(true)}>
                                                Xem chi tiết
                                            </Button>
                                            <Button variant="contained" onClick={resetBooking}>
                                                Đặt lịch mới
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Fade>
                    )}

                    {currentStep === 3 && historyMode && (
                        <Fade in={true} timeout={400} unmountOnExit={false}>
                            <Box sx={{ maxWidth: 1600, mx: 'auto', mt: 1 }}>
                                <Card sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`,
                                    background: COLORS.BACKGROUND.DEFAULT,
                                    boxShadow: `0 6px 18px ${alpha(COLORS.INFO[300], 0.25)}`
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: COLORS.INFO[700] }}>
                                            Lịch sử đặt lịch
                                        </Typography>
                                        {loadingHistory ? (
                                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                                <Loading message="Đang tải lịch sử..." />
                                            </Box>
                                        ) : (
                                            <TableContainer>
                                                <Table size="small" stickyHeader>
                                                    <TableHead sx={{ '& th': { backgroundColor: alpha(COLORS.INFO[50], 0.8) } }}>
                                                        <TableRow>
                                                            <TableCell>Dịch vụ</TableCell>
                                                            <TableCell>Thời gian</TableCell>
                                                            <TableCell>Trạng thái dịch vụ</TableCell>
                                                            <TableCell>Trạng thái thanh toán</TableCell>
                                                            <TableCell align="right">Hành động</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {history.map((bk) => (
                                                            <TableRow key={bk.id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: alpha(COLORS.GRAY[50], 0.6) } }}>
                                                                <TableCell sx={{ fontWeight: 600 }}>{bk.service?.name || (services?.find((s) => s.id === bk.serviceId)?.name) || '—'}</TableCell>
                                                                <TableCell>{new Date(bk.bookingDateTime).toLocaleString('vi-VN')}</TableCell>
                                                                <TableCell>
                                                                    {(() => {
                                                                        const status = (bk.status || bk.booking_status || 'PENDING').toUpperCase();
                                                                        const statusMap = {
                                                                            'PENDING': { label: 'Đang chờ', color: 'warning' },
                                                                            'CONFIRMED': { label: 'Đã xác nhận', color: 'info' },
                                                                            'IN_PROGRESS': { label: 'Đang thực hiện', color: 'primary' },
                                                                            'COMPLETED': { label: 'Đã hoàn thành', color: 'success' },
                                                                            'CANCELLED': { label: 'Đã hủy', color: 'default' }
                                                                        };
                                                                        const statusInfo = statusMap[status] || { label: 'Không xác định', color: 'default' };
                                                                        return <Chip size="small" label={statusInfo.label} color={statusInfo.color} />;
                                                                    })()}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip size="small" label={bk.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} color={bk.paymentStatus === 'paid' ? 'success' : 'warning'} />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Button size="small" variant="outlined" onClick={() => { setCompletedBooking(bk); setShowConfirmation(true); }}>
                                                                        Xem chi tiết
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {history.length === 0 && !loadingHistory && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                                    <Box sx={{ textAlign: 'center' }}>
                                                                        <Schedule sx={{ fontSize: 48, color: COLORS.GRAY[400], mb: 2 }} />
                                                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                                                            Chưa có lịch đặt nào
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Bạn chưa có lịch đặt dịch vụ nào. Hãy đặt lịch để bắt đầu!
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                                            <Button variant="outlined" onClick={() => { setHistoryMode(false); resetBooking(); }}>
                                                Quay về trang đặt dịch vụ
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Fade>
                    )}

                    {/* Payment Modal */}
                    <Suspense fallback={<div>Loading...</div>}>
                        <PaymentModal
                            open={showPayment}
                            onClose={() => setShowPayment(false)}
                            bookingData={bookingData}
                            onPaymentComplete={handlePaymentComplete}
                            onBackToForm={() => { setShowPayment(false); resetBooking(); }}
                        />
                    </Suspense>

                    {/* Booking Confirmation Modal */}
                    <Suspense fallback={<div>Loading...</div>}>
                        <BookingConfirmation
                            open={showConfirmation}
                            onClose={() => setShowConfirmation(false)}
                            booking={completedBooking}
                            onNewBooking={resetBooking}
                            onFeedback={() => setShowFeedback(true)}
                            onBackToPage={() => { setShowConfirmation(false); resetBooking(); }}
                        />
                    </Suspense>


                    {/* Feedback Modal */}
                    <Suspense fallback={<div>Loading...</div>}>
                        <FeedbackModal
                            open={showFeedback}
                            onClose={() => setShowFeedback(false)}
                            booking={completedBooking}
                            onSubmit={handleFeedbackSubmit}
                        />
                    </Suspense>

                    {/* Date Selection Modal */}
                    <BookingDateModal
                        open={showDateSelection}
                        onClose={() => {
                            setShowDateSelection(false);
                            setServiceForDateSelection(null);
                            setSelectedDate('');
                            setSelectedSlot(null);
                        }}
                        service={serviceForDateSelection}
                        onConfirm={handleDateConfirm}
                    />

                    {/* Booking History Modal */}
                    <BookingHistory
                        open={showHistory}
                        onClose={() => setShowHistory(false)}
                    />
                </Box>

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alert.open}
                    onClose={() => setAlert({ ...alert, open: false })}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                />
            </Box>
        </ErrorBoundary>
    );
};

export default BookingPage;
