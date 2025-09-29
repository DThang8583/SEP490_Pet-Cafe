import React, { useState, useEffect, Suspense, useRef } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, CardMedia,
    Button, Chip, Stack, TextField, InputAdornment, ToggleButton,
    ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Alert, Snackbar, alpha, Fade, Zoom
} from '@mui/material';
import {
    Search, Pets, Schedule, Payment, CheckCircle, Star,
    AccessTime, LocationOn, Person, Phone, Email, School, LocalHospital, CalendarToday,
    Store, Business, Restaurant, LocalCafe, Spa, LocalActivity, Loyalty
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { authApi, customerApi } from '../../api/authApi';
import { serviceApi } from '../../api/serviceApi';
import { bookingApi } from '../../api/bookingApi';
import { notificationApi } from '../../api/notificationApi';
import { feedbackApi } from '../../api/feedbackApi';

// Custom Icon Components to force re-render
const SpaIcon = () => <Spa />;
const LoyaltyIcon = () => <Loyalty />;
const ActivityIcon = () => <LocalActivity />;

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
import PaymentModal from '../../components/booking/PaymentModal';
import BookingConfirmation from '../../components/booking/BookingConfirmation';
import FeedbackModal from '../../components/booking/FeedbackModal';

// Safe Transition Component
const SafeZoom = ({ children, in: inProp, timeout, ...props }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (inProp) {
            setShouldRender(true);
        } else {
            timeoutRef.current = setTimeout(() => {
                setShouldRender(false);
            }, timeout || 300);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [inProp, timeout]);

    if (!shouldRender) return null;

    return (
        <Zoom in={inProp} timeout={timeout} {...props}>
            {children}
        </Zoom>
    );
};

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
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentStep, setCurrentStep] = useState(0);
    const [bookingData, setBookingData] = useState({});
    const [showPayment, setShowPayment] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [completedBooking, setCompletedBooking] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const steps = ['Chọn dịch vụ', 'Thông tin booking', 'Thanh toán', 'Xác nhận'];

    // Load data on component mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            // Check authentication
            console.log('Checking authentication...');
            const user = authApi.getCurrentUser();
            console.log('Current user:', user);

            if (!user) {
                // Auto-login with test customer account for development
                console.log('No user found, attempting auto-login...');
                try {
                    const loginResponse = await authApi.login({
                        email: 'eva@gmail.com',
                        password: 'customer123'
                    });

                    if (loginResponse.success) {
                        console.log('Auto-login successful:', loginResponse.user);
                        setCurrentUser(loginResponse.user);
                    } else {
                        console.log('Auto-login failed, showing services anyway...');
                        // Still show services for browsing, but disable booking
                    }
                } catch (loginErr) {
                    console.error('Auto-login failed:', loginErr);
                    console.log('Continuing without authentication...');
                    // Still show services for browsing
                }
            } else {
                setCurrentUser(user);
                console.log('User authenticated successfully:', user.name);
            }

            // Get current user after potential auto-login  
            const currentUserCheck = authApi.getCurrentUser();
            if (currentUserCheck?.role !== 'customer') {
                console.log('User is not customer, showing services in view-only mode');
                // Don't return, still show services but disable booking functionality
            } else {
                console.log('User role check passed:', currentUserCheck.name);
            }

            // Load available services
            console.log('Loading services...');
            const servicesResponse = await serviceApi.getAvailableServices();
            console.log('Services response:', servicesResponse);
            if (servicesResponse.success) {
                setServices(servicesResponse.data);
                console.log('Services loaded:', servicesResponse.data);
            } else {
                console.error('Failed to load services:', servicesResponse);
                // Fallback: Load services directly from serviceApi if needed
                setError('Không thể tải danh sách dịch vụ');
            }

            setLoading(false);
        } catch (err) {
            console.error('LoadInitialData error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            setLoading(false);
        }
    };

    // Filter services based on search and category
    const filteredServices = services?.filter(service => {
        if (!service) return false;
        const matchesSearch = service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesCategory = false;
        if (categoryFilter === 'all') {
            matchesCategory = true;
        } else if (categoryFilter === 'pet_care') {
            // Chăm sóc pet: grooming, healthcare, daycare (cần mang pet)
            matchesCategory = service.petRequired === true;
        } else if (categoryFilter === 'cafe_service') {
            // Dịch vụ của cửa hàng: training với pet của cafe, các dịch vụ khác
            matchesCategory = service.petRequired === false;
        }

        return matchesSearch && matchesCategory;
    }) || [];

    // Helper function to check if cafe service is available
    const isCafeServiceAvailable = (service) => {
        if (service.petRequired === false) {
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];

            // Use service's actual time data if available, otherwise use default
            const serviceStartDate = service.serviceStartDate || '2024-01-15';
            const serviceEndDate = service.serviceEndDate || '2024-01-20';

            // For demo purposes, show cafe services if they haven't ended yet
            // In production, you might want to check registration period instead
            const isNotEnded = currentDate <= serviceEndDate;

            return isNotEnded;
        }
        return true;
    };

    // Sort services: available cafe services first, then pet care services
    const sortedServices = filteredServices.sort((a, b) => {
        if (!a || !b) return 0;

        // Check if services are available
        const aAvailable = a.petRequired === true || (a.petRequired === false && isCafeServiceAvailable(a));
        const bAvailable = b.petRequired === true || (b.petRequired === false && isCafeServiceAvailable(b));

        // Only sort available services
        if (!aAvailable && bAvailable) return 1;
        if (aAvailable && !bAvailable) return -1;

        // Among available services, prioritize cafe services
        if (aAvailable && bAvailable) {
            if (a.petRequired === false && b.petRequired === true) return -1;
            if (a.petRequired === true && b.petRequired === false) return 1;
        }

        return 0;
    });

    // Filter out unavailable services before creating rows
    const availableServices = sortedServices.filter(service => {
        if (service.petRequired === true) return true; // Pet care services are always available
        if (service.petRequired === false) return isCafeServiceAvailable(service); // Check cafe services
        return true;
    });

    // Chia services thành các nhóm 3 để hiển thị cố định 3 card/hàng
    const servicesPerRow = 3;
    const serviceRows = [];
    try {
        for (let i = 0; i < availableServices.length; i += servicesPerRow) {
            const rowServices = availableServices.slice(i, i + servicesPerRow);
            // Đảm bảo mỗi hàng luôn có đúng 3 cards
            while (rowServices.length < servicesPerRow) {
                rowServices.push(null); // Thêm empty slot
            }
            serviceRows.push(rowServices);
        }
    } catch (error) {
        console.error('Error creating service rows:', error);
    }

    // Debug: Check services count
    console.log('Total services:', services.length);
    console.log('Filtered services:', filteredServices.length);
    console.log('Available services:', availableServices.length);
    console.log('Service rows:', serviceRows.length);
    console.log('First row services:', serviceRows[0]?.length);

    // Debug: Check cafe services specifically
    const cafeServices = services?.filter(s => s?.petRequired === false) || [];
    console.log('Cafe services found:', cafeServices.length);
    cafeServices.forEach(service => {
        console.log(`Cafe service: ${service.name}, Available: ${isCafeServiceAvailable(service)}`);
    });

    // Service categories
    const categories = [
        { value: 'all', label: 'Tất cả', icon: <Pets key="all-pets" /> },
        { value: 'pet_care', label: 'Chăm sóc thú cưng', icon: <LoyaltyIcon key="pet-loyalty" /> },
        { value: 'cafe_service', label: 'Dịch vụ của cửa hàng', icon: <Spa key="cafe-spa" /> }
    ];

    // Debug: Check if Loyalty icon is imported correctly
    console.log('Loyalty icon component:', Loyalty);
    console.log('Categories array:', categories);
    console.log('Pet Care category icon:', categories.find(cat => cat.value === 'pet_care')?.icon);

    // Handle service selection
    const handleServiceSelect = (service) => {
        try {
            if (!service) {
                console.error('Service is null or undefined');
                return;
            }
            setSelectedService(service);
            setBookingData({ ...bookingData, service });
            setCurrentStep(1);
        } catch (error) {
            console.error('Error selecting service:', error);
            setError('Có lỗi xảy ra khi chọn dịch vụ');
        }
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

            const completeBookingData = {
                ...bookingData,
                ...paymentData,
                customerId: currentUser.id,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            // Create booking
            const response = await bookingApi.createBooking(completeBookingData);

            if (response.success) {
                setCompletedBooking(response.data);
                setCurrentStep(3);
                setShowConfirmation(true);
                setSuccess('Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.');
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
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
            setSuccess('Cảm ơn bạn đã gửi phản hồi!');
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi gửi phản hồi');
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
                background: `
                radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.4)} 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${alpha(COLORS.WARNING[100], 0.4)} 0%, transparent 50%),
                linear-gradient(135deg, 
                    ${COLORS.SECONDARY[50]} 0%, 
                    ${alpha(COLORS.WARNING[50], 0.9)} 50%,
                    ${alpha(COLORS.ERROR[50], 0.8)} 100%
                )
            `,
                position: 'relative',
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1, sm: 2, md: 3 }
            }}>
                {/* Floating decorative elements */}
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage: `
                    radial-gradient(circle at 15% 20%, ${alpha(COLORS.ERROR[100], 0.2)} 0 8px, transparent 9px),
                    radial-gradient(circle at 80% 70%, ${alpha(COLORS.INFO[100], 0.15)} 0 6px, transparent 7px)
                `,
                    backgroundSize: '300px 300px'
                }} />

                <Box sx={{
                    py: 1,
                    px: 0,
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 'none',
                    minHeight: '100vh'
                }}>
                    {/* Header */}
                    <Fade in timeout={800}>
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5,
                                    fontFamily: '"Comic Sans MS", cursive',
                                    fontSize: '1.8rem',
                                    textAlign: 'center',
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                🐾 Đặt dịch vụ Pet Cafe
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
                                background: `linear-gradient(135deg, 
                                ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                ${alpha(COLORS.SECONDARY[50], 0.9)} 100%
                            )`,
                                borderRadius: 4,
                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                boxShadow: `0 8px 32px ${alpha(COLORS.ERROR[200], 0.2)}`
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

                    {/* Step 0: Service Selection */}
                    {currentStep === 0 && (
                        <Fade in={true} timeout={1000} unmountOnExit={false}>
                            <Box>
                                {/* Search and Filter Controls */}
                                <Box sx={{
                                    mb: 6,
                                    p: 4,
                                    background: `linear-gradient(135deg, 
                                    ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                                    ${alpha(COLORS.SECONDARY[50], 0.9)} 100%
                                )`,
                                    borderRadius: 6,
                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                    boxShadow: `0 12px 48px ${alpha(COLORS.ERROR[200], 0.15)}`,
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Grid container spacing={6} alignItems="center">
                                        <Grid item xs={12} md={8}>
                                            <TextField
                                                fullWidth
                                                placeholder="Tìm kiếm dịch vụ chăm sóc thú cưng..."
                                                size="large"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Search sx={{ color: COLORS.ERROR[500] }} />
                                                        </InputAdornment>
                                                    )
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.8),
                                                        '&:hover': {
                                                            backgroundColor: alpha(COLORS.SECONDARY[50], 0.9)
                                                        },
                                                        '&.Mui-focused': {
                                                            backgroundColor: COLORS.SECONDARY[50]
                                                        }
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <ToggleButtonGroup
                                                value={categoryFilter}
                                                exclusive
                                                onChange={(_, value) => value && setCategoryFilter(value)}
                                                size="large"
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiToggleButton-root': {
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        border: `1px solid ${alpha(COLORS.ERROR[300], 0.5)}`,
                                                        color: COLORS.TEXT.SECONDARY,
                                                        '&.Mui-selected': {
                                                            backgroundColor: alpha(COLORS.ERROR[100], 0.8),
                                                            color: COLORS.ERROR[700],
                                                            fontWeight: 'bold'
                                                        }
                                                    }
                                                }}
                                            >
                                                {categories.map((category) => (
                                                    <ToggleButton key={category.value} value={category.value}>
                                                        {category.icon}
                                                        <Box sx={{ ml: 1 }}>{category.label}</Box>
                                                    </ToggleButton>
                                                ))}
                                            </ToggleButtonGroup>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Services Grid - Fixed 3 cards per row with equal height */}
                                {serviceRows && serviceRows.length > 0 && serviceRows.map((rowServices, rowIndex) => (
                                    <Box key={rowIndex} sx={{ mb: 4 }}>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                                            gap: 3,
                                            '& > *': {
                                                minHeight: '500px' // Fixed height for all cards
                                            }
                                        }}>
                                            {rowServices && rowServices.map((service, cardIndex) => (
                                                <Box key={service ? service.id : `empty-${rowIndex}-${cardIndex}`}>
                                                    {service ? (
                                                        <SafeZoom
                                                            in={true}
                                                            timeout={800 + (rowIndex * 3 + cardIndex) * 100}
                                                        >
                                                            <Box>
                                                                <ServiceCard
                                                                    service={service}
                                                                    onSelect={() => handleServiceSelect(service)}
                                                                />
                                                            </Box>
                                                        </SafeZoom>
                                                    ) : (
                                                        <Box sx={{ height: '500px' }} />
                                                    )}
                                                </Box>
                                            ))}
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
                                    <SafeZoom in={true} timeout={600}>
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
                                                <Search sx={{ fontSize: 64, color: COLORS.GRAY[400], mb: 2 }} />
                                                <Typography variant="h5" sx={{ color: COLORS.GRAY[600], mb: 1 }}>
                                                    Không tìm thấy dịch vụ
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    Thử thay đổi từ khóa tìm kiếm hoặc danh mục
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </SafeZoom>
                                ) : null}
                            </Box>
                        </Fade>
                    )}

                    {/* Step 1: Booking Form */}
                    {currentStep === 1 && selectedService && (
                        <Suspense fallback={<Loading message="Đang tải form..." />}>
                            <BookingForm
                                service={selectedService}
                                onSubmit={handleBookingSubmit}
                                onBack={() => setCurrentStep(0)}
                            />
                        </Suspense>
                    )}

                    {/* Payment Modal */}
                    <Suspense fallback={<div>Loading...</div>}>
                        <PaymentModal
                            open={showPayment}
                            onClose={() => setShowPayment(false)}
                            bookingData={bookingData}
                            onPaymentComplete={handlePaymentComplete}
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
                </Box>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert onClose={() => setError('')} severity="error">
                        {error}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={!!success}
                    autoHideDuration={4000}
                    onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSuccess('')} severity="success">
                        {success}
                    </Alert>
                </Snackbar>
            </Box>
        </ErrorBoundary>
    );
};

export default BookingPage;
