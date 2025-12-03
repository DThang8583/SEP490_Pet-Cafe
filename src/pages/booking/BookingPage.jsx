import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  alpha,
  Fade,
  Zoom,
  Grow,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
} from '@mui/material';
import {
  Pets,
  Schedule,
  Payment,
  CheckCircle,
  Star,
  AccessTime,
  LocationOn,
  Person,
  Phone,
  Email,
  School,
  LocalHospital,
  CalendarToday,
  Store,
  Business,
  Restaurant,
  LocalCafe,
  Spa,
  LocalActivity,
  Loyalty,
  People,
  Note,
} from '@mui/icons-material';

import { COLORS } from '../../constants/colors';
import { authApi } from '../../api/authApi';
import serviceApi from '../../api/serviceApi';
import { bookingApi } from '../../api/bookingApi';
import { notificationApi } from '../../api/notificationApi';
import { feedbackApi } from '../../api/feedbackApi';

import AlertModal from '../../components/modals/AlertModal';
import Loading from '../../components/loading/Loading';
import ServiceCard from '../../components/booking/ServiceCard';
import BookingForm from '../../components/booking/BookingForm';
import BookingDateModal from '../../components/modals/BookingDateModal';
import PaymentModal from '../../components/booking/PaymentModal';
import BookingConfirmation from '../../components/booking/BookingConfirmation';
import FeedbackModal from '../../components/booking/FeedbackModal';

// Utility
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Có lỗi xảy ra khi tải trang
          </Typography>
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const BookingPage = () => {
  // ==================== STATE ====================
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

  const steps = ['Chọn dịch vụ', 'Điền thông tin', 'Thanh toán', 'Xác nhận'];

  // ==================== EFFECT ====================
  useEffect(() => {
    loadInitialData();
  }, []);

  // ==================== LOAD DATA ====================
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Kiểm tra user hiện tại
      const user = authApi.getCurrentUser();
      if (user) setCurrentUser(user);

      // Lấy token
      const token = localStorage.getItem('authToken');

      // Gọi API lấy services
      const response = await fetch(
        'https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/services',
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }), // ĐÃ SỬA LỖI Ở ĐÂY
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      const rawServices = Array.isArray(json?.data)
        ? json.data.filter((s) => s?.is_active && !s?.is_deleted)
        : [];

      const mappedServices = rawServices.map((service) => {
        const hasPetSlots =
          service.slots && service.slots.some((slot) => slot?.pet_group_id || slot?.pet_id);
        const petRequired = !!hasPetSlots;

        return {
          ...service,
          petRequired,
          price: service.base_price || 0,
        };
      });

      setServices(mappedServices);
    } catch (err) {
      console.error('loadInitialData error:', err);
      setAlert({
        open: true,
        title: 'Lỗi',
        message: err.message || 'Không thể tải danh sách dịch vụ',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const isCafeServiceAvailable = (service) => {
    if (service.petRequired) return true;
    return service.slots?.some((slot) => slot?.service_status === 'AVAILABLE' && !slot?.is_deleted);
  };

  // Sắp xếp: dịch vụ có sẵn lên trên, ưu tiên dịch vụ cần thú cưng
  const sortedServices = [...services].sort((a, b) => {
    const aAvail = a.petRequired || isCafeServiceAvailable(a);
    const bAvail = b.petRequired || isCafeServiceAvailable(b);

    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    if (a.petRequired && !b.petRequired) return -1;
    if (!a.petRequired && b.petRequired) return 1;
    return 0;
  });

  const availableServices = sortedServices.filter(
    (s) => s.petRequired || isCafeServiceAvailable(s)
  );

  // Chia thành các hàng 3 card
  const servicesPerRow = 3;
  const serviceRows = [];
  for (let i = 0; i < availableServices.length; i += servicesPerRow) {
    const row = availableServices.slice(i, i + servicesPerRow);
    // Đảm bảo luôn đủ 3 phần tử (trừ hàng cuối)
    while (row.length < servicesPerRow && i + servicesPerRow < availableServices.length) {
      row.push(null);
    }
    serviceRows.push(row);
  }

  // ==================== HANDLERS ====================
  const handleServiceSelect = (service) => {
    setServiceForDateSelection(service);
    setShowDateSelection(true);
  };

  const handleDateConfirm = (slot, date) => {
    if (!date || !slot) {
      setAlert({ open: true, title: 'Lỗi', message: 'Vui lòng chọn ngày và khung giờ', type: 'error' });
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
      slot,
      date,
      time: slot.start_time,
      pet_group_id: slot.pet_group_id || null,
      pet_group: slot.pet_group || null,
    });

    setShowDateSelection(false);
    setServiceForDateSelection(null);
    setCurrentStep(1);
  };

  const handleBookingSubmit = (formData) => {
    setBookingData({ ...bookingData, ...formData });
    setCurrentStep(2);
    setShowPayment(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      setShowPayment(false);

      const svc = bookingData.service;
      const isCafe = !svc?.petRequired;

      // Xây dựng bookingDateTime
      let bookingDateTime = `${bookingData.date}T${bookingData.time || '09:00'}:00`;
      if (isCafe && bookingData.slot?.start_time) {
        bookingDateTime = `${bookingData.date}T${bookingData.slot.start_time}`;
      }

      const finalBookingData = {
        ...bookingData,
        ...paymentData,
        bookingDateTime,
        customerId: currentUser?.id,
        status: 'pending',
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.status === 'completed' ? 'paid' : 'pending',
        createdAt: new Date().toISOString(),
      };

      const res = await bookingApi.createBooking(finalBookingData);
      if (res.success) {
        setCompletedBooking(res.data);
        setCurrentStep(3);
        setShowConfirmation(true);
        setAlert({
          open: true,
          title: 'Thành công',
          message: 'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ sớm nhất.',
          type: 'success',
        });
      }
    } catch (err) {
      setAlert({
        open: true,
        title: 'Lỗi thanh toán',
        message: err.message || 'Thanh toán thất bại',
        type: 'error',
      });
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await feedbackApi.submitFeedback({
        ...feedbackData,
        bookingId: completedBooking?.id,
        type: 'service_feedback',
      });
      setShowFeedback(false);
      setAlert({ open: true, title: 'Thành công', message: 'Cảm ơn phản hồi của bạn!', type: 'success' });
    } catch (err) {
      setAlert({ open: true, title: 'Lỗi', message: 'Gửi phản hồi thất bại', type: 'error' });
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingData({});
    setCurrentStep(0);
    setCompletedBooking(null);
    setShowConfirmation(false);
    setShowFeedback(false);
  };

  // ==================== RENDER ====================
  if (loading) {
    return <Loading fullScreen variant="cafe" size="large" message="Đang tải dịch vụ Pet Cafe..." />;
  }

  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>

          {/* Header + Stepper */}
          {!historyMode && (
            <Fade in timeout={800}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 'bold',
                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: '"Comic Sans MS", cursive',
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  Đặt dịch vụ Pet Cafe
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                  Chọn dịch vụ chăm sóc tốt nhất cho thú cưng của bạn
                </Typography>

                <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, backgroundColor: 'background.paper', borderRadius: 4, boxShadow: 3 }}>
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {steps.map((label, idx) => (
                      <Step key={label}>
                        <StepLabel
                          sx={{
                            '& .MuiStepLabel-label': {
                              color: idx <= currentStep ? COLORS.ERROR[600] : 'text.secondary',
                              fontWeight: idx <= currentStep ? 'bold' : 'normal',
                            },
                            '& .MuiStepIcon-root': {
                              color: idx <= currentStep ? COLORS.ERROR[500] : 'grey.300',
                            },
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

          {/* Bước 0: Chọn dịch vụ */}
          {currentStep === 0 && !historyMode && (
            <Fade in timeout={1000}>
              <Box>
                <Box sx={{ mb: 4, textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      setHistoryMode(true);
                      setCurrentStep(3);
                      setLoadingHistory(true);
                      try {
                        const res = await bookingApi.getMyBookings();
                        if (res.success) setHistory(res.data || []);
                      } catch {
                        setHistory([]);
                      } finally {
                        setLoadingHistory(false);
                      }
                    }}
                  >
                    Xem lịch sử đặt lịch
                  </Button>
                </Box>

                {/* Grid 3 cột cố định */}
                {serviceRows.map((row, rowIdx) => (
                  <Box key={rowIdx} sx={{ mb: 4 }}>
                    <Grid container spacing={3}>
                      {row.map((service, idx) =>
                        service ? (
                          <Grid item xs={12} sm={6} md={4} key={service.id}>
                            <Grow in timeout={800 + (rowIdx * 3 + idx) * 150}>
                              <div>
                                <ServiceCard
                                  service={service}
                                  onSelect={() => handleServiceSelect(service)}
                                  onCardClick={() => handleServiceSelect(service)}
                                />
                              </div>
                            </Grow>
                          </Grid>
                        ) : (
                          <Grid item xs={12} sm={6} md={4} key={`empty-${idx}`} />
                        )
                      )}
                    </Grid>
                  </Box>
                ))}

                {availableServices.length === 0 && (
                  <Card sx={{ p: 6, textAlign: 'center' }}>
                    <Pets sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary">
                      Hiện tại chưa có dịch vụ nào khả dụng
                    </Typography>
                  </Card>
                )}
              </Box>
            </Fade>
          )}

          {/* Bước 1: Form */}
          {currentStep === 1 && selectedService && (
            <Suspense fallback={<Loading message="Đang tải form..." />}>
              <BookingForm
                service={selectedService}
                bookingData={bookingData}
                onSubmit={handleBookingSubmit}
                onBack={() => setCurrentStep(0)}
              />
            </Suspense>
          )}

          {/* Bước 3: Xác nhận (fallback khi modal đóng) */}
          {currentStep === 3 && !historyMode && completedBooking && (
            <Box sx={{ maxWidth: 960, mx: 'auto', mt: 4 }}>
              {/* Nội dung xác nhận – bạn có thể để BookingConfirmation modal xử lý chính */}
            </Box>
          )}

          {/* Lịch sử đặt lịch */}
          {historyMode && (
            <Fade in timeout={400}>
              <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                      Lịch sử đặt lịch
                    </Typography>

                    {loadingHistory ? (
                      <Loading message="Đang tải lịch sử..." />
                    ) : (
                      <TableContainer component={Paper} elevation={2}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha(COLORS.INFO[50], 0.8) }}>
                              <TableCell>Dịch vụ</TableCell>
                              <TableCell>Thời gian</TableCell>
                              <TableCell>Trạng thái dịch vụ</TableCell>
                              <TableCell>Thanh toán</TableCell>
                              <TableCell align="right">Hành động</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {history.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center">
                                  Chưa có lịch đặt nào
                                </TableCell>
                              </TableRow>
                            ) : (
                              history.map((bk) => (
                                <TableRow key={bk.id} hover>
                                  <TableCell>{bk.service?.name || '—'}</TableCell>
                                  <TableCell>{new Date(bk.bookingDateTime).toLocaleString('vi-VN')}</TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={
                                        bk.status === 'completed'
                                          ? 'Hoàn thành'
                                          : bk.status === 'confirmed'
                                          ? 'Đã xác nhận'
                                          : bk.status === 'cancelled'
                                          ? 'Đã hủy'
                                          : 'Chờ xác nhận'
                                      }
                                      color={
                                        bk.status === 'completed'
                                          ? 'success'
                                          : bk.status === 'confirmed'
                                          ? 'info'
                                          : bk.status === 'cancelled'
                                          ? 'default'
                                          : 'warning'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={bk.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                      color={bk.paymentStatus === 'paid' ? 'success' : 'warning'}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        setCompletedBooking(bk);
                                        setShowConfirmation(true);
                                      }}
                                    >
                                      Xem chi tiết
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setHistoryMode(false);
                          resetBooking();
                        }}
                      >
                        Quay về đặt dịch vụ
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}
        </Container>

        {/* Các Modal */}
        <Suspense fallback={null}>
          <PaymentModal
            open={showPayment}
            onClose={() => setShowPayment(false)}
            bookingData={bookingData}
            onPaymentComplete={handlePaymentComplete}
            onBackToForm={() => {
              setShowPayment(false);
              setCurrentStep(1);
            }}
          />

          <BookingConfirmation
            open={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            booking={completedBooking}
            onNewBooking={resetBooking}
            onFeedback={() => setShowFeedback(true)}
            onBackToPage={() => {
              setShowConfirmation(false);
              resetBooking();
            }}
          />

          <FeedbackModal
            open={showFeedback}
            onClose={() => setShowFeedback(false)}
            booking={completedBooking}
            onSubmit={handleFeedbackSubmit}
          />

          <BookingDateModal
            open={showDateSelection}
            onClose={() => {
              setShowDateSelection(false);
              setServiceForDateSelection(null);
            }}
            service={serviceForDateSelection}
            onConfirm={handleDateConfirm}
          />
        </Suspense>

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
