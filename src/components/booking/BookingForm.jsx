import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Paper,
    Fade,
    Chip,
    CardMedia,
    Divider
} from '@mui/material';
import {
    CalendarToday,
    Schedule,
    Person,
    Phone,
    ArrowBack,
    AccessTime,
    People,
    Note,
    Pets,
    Spa,
    ShoppingCart
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const BookingForm = ({ service, bookingData: initialBookingData, onBack, onSubmit }) => {
    const [formData, setFormData] = useState({
        selectedDate: '',
        customerInfo: {
            name: '',
            phone: ''
        }
    });

    const [errors, setErrors] = useState({});
    const [bookingPetGroupDetails, setBookingPetGroupDetails] = useState(null);

    // Initialize selectedDate and other data from bookingData if available
    React.useEffect(() => {
        if (service && initialBookingData) {
            setFormData(prev => ({
                ...prev,
                selectedDate: initialBookingData.selectedDate || initialBookingData.date || ''
            }));
        }
    }, [service, initialBookingData]);

    // Fetch pet-group details for initial booking (to show pet names)
    useEffect(() => {
        const loadPetGroup = async () => {
            try {
                const pgId = initialBookingData?.pet_group?.id;
                if (!pgId) {
                    setBookingPetGroupDetails(null);
                    return;
                }
                const token = localStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' };
                const resp = await fetch(`https://petcafes.azurewebsites.net/api/pet-groups/${pgId}`, { headers });
                if (!resp.ok) {
                    console.warn('[BookingForm] pet-group fetch failed', resp.status);
                    setBookingPetGroupDetails(null);
                    return;
                }
                const json = await resp.json();
                const group = json?.data || json || null;
                setBookingPetGroupDetails(group);
            } catch (e) {
                console.error('[BookingForm] error loading pet-group', e);
                setBookingPetGroupDetails(null);
            }
        };

        loadPetGroup();
    }, [initialBookingData?.pet_group?.id]);

    const handleCustomerInfoChange = (field, value) => {
        // sanitize phone input: keep digits only and limit to 10
        let newValue = value;
        if (field === 'phone') {
            newValue = String(value).replace(/\D/g, '').slice(0, 10);
        }

        setFormData(prev => ({
            ...prev,
            customerInfo: {
                ...prev.customerInfo,
                [field]: newValue
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

        // Check if date is selected (from formData or bookingData)
        const selectedDate = formData.selectedDate || initialBookingData?.selectedDate || initialBookingData?.date;
        if (!selectedDate) {
            newErrors.selectedDate = 'Vui lòng chọn ngày đặt lịch';
        } else {
            // Validate date is not in the past
            // Parse date string as local date to avoid timezone issues
            const [year, month, day] = selectedDate.split('-').map(Number);
            const dateToValidate = new Date(year, month - 1, day);
            dateToValidate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateToValidate < today) {
                newErrors.selectedDate = 'Không thể chọn ngày trong quá khứ';
            }
        }

        if (!formData.customerInfo.name.trim()) {
            newErrors.customerInfo = { ...newErrors.customerInfo, name: 'Vui lòng nhập họ tên' };
        }

        if (!formData.customerInfo.phone.trim()) {
            newErrors.customerInfo = { ...newErrors.customerInfo, phone: 'Vui lòng nhập số điện thoại' };
        }

        // Ensure phone is exactly 10 digits
        const phoneVal = (formData.customerInfo.phone || '').replace(/\D/g, '');
        if (phoneVal.length !== 10) {
            newErrors.customerInfo = { ...newErrors.customerInfo, phone: 'Số điện thoại phải có đúng 10 chữ số' };
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormComplete = () => {
        const selectedDate = formData.selectedDate || initialBookingData?.selectedDate || initialBookingData?.date;
        return !!(
            selectedDate &&
            formData.customerInfo.name.trim() &&
            formData.customerInfo.phone.trim()
        );
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            selectedDate: date
        }));
        // Clear date error
        setErrors(prev => ({
            ...prev,
            selectedDate: null
        }));
    };

    // Format duration
    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} phút`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}p` : `${hours} giờ`;
    };

    // Get category color
    const getCategoryColor = () => {
        return service.petRequired === false ? COLORS.WARNING : COLORS.INFO;
    };

    const categoryColor = getCategoryColor();

    const handleAddToCart = () => {
        if (!validateForm()) return;

        // Use selectedDate from bookingData if available, otherwise use formData
        const finalSelectedDate = initialBookingData?.selectedDate || initialBookingData?.date || formData.selectedDate;

        const cartItem = {
            id: `booking-${service.id}-${Date.now()}`,
            service: service,
            service_id: service.id,
            slot: initialBookingData?.slot,
            slot_id: initialBookingData?.slotId || initialBookingData?.slot?.id,
            booking_date: finalSelectedDate,
            selectedDate: finalSelectedDate,
            price: initialBookingData?.slot?.price || service.base_price || service.price || 0,
            customerInfo: {
                full_name: formData.customerInfo.name,
                address: formData.customerInfo.address || '',
                phone: formData.customerInfo.phone,
                notes: formData.customerInfo.notes || ''
            },
            pet_group_id: initialBookingData?.pet_group_id,
            pet_group: initialBookingData?.pet_group
        };

        try {
            const saved = localStorage.getItem('booking_cart');
            const current = saved ? JSON.parse(saved) : [];
            const next = [...current, cartItem];
            localStorage.setItem('booking_cart', JSON.stringify(next));
            window.dispatchEvent(new Event('bookingCartUpdated'));

            // Navigate to cart
            window.location.href = '/booking/cart';
        } catch (e) {
            console.error('[BookingForm] Error adding to cart:', e);
            alert('Lỗi khi thêm vào giỏ hàng');
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        // Use selectedDate from bookingData if available, otherwise use formData
        const finalSelectedDate = initialBookingData?.selectedDate || initialBookingData?.date || formData.selectedDate;

        const bookingData = {
            serviceId: service.id,
            selectedDate: finalSelectedDate,
            date: finalSelectedDate,
            customerInfo: formData.customerInfo,
            // Preserve slot and pet_group info from initialBookingData
            slotId: initialBookingData?.slotId,
            slot: initialBookingData?.slot,
            pet_group_id: initialBookingData?.pet_group_id,
            pet_group: initialBookingData?.pet_group,
            time: initialBookingData?.time || initialBookingData?.slot?.start_time
        };

        onSubmit(bookingData);
    };

    return (
        <Fade in timeout={800}>
            <Box sx={{
                width: '100%',
                maxWidth: '100%',
                mx: 0,
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 2, sm: 3, md: 4 },
                minHeight: '80vh',
                backgroundColor: COLORS.BACKGROUND.DEFAULT,
                position: 'relative'
            }}>
                {/* Header */}
                <Card sx={{
                    mb: { xs: 3, sm: 4, md: 4 },
                    borderRadius: 6,
                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                    border: `1px solid ${alpha(COLORS.INFO[200], 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(COLORS.INFO[200], 0.15)}`,
                    overflow: 'hidden'
                }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                        {/* Service Image */}
                        {service.image_url && (
                            <Box sx={{ width: { xs: '100%', md: '300px' }, height: { xs: '200px', md: 'auto' }, flexShrink: 0 }}>
                                <CardMedia
                                    component="img"
                                    image={service.image_url || (service.thumbnails && service.thumbnails[0])}
                                    alt={service.name}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        if (service.image_url && service.thumbnails && service.thumbnails[0]) {
                                            e.target.src = service.thumbnails[0];
                                        } else {
                                            e.target.src = `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`;
                                        }
                                    }}
                                />
                            </Box>
                        )}
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
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
                                        '&:hover': {
                                            backgroundColor: alpha(COLORS.INFO[100], 0.8)
                                        }
                                    }}
                                >
                                    Quay lại
                                </Button>
                            </Box>
                            <Typography variant="h4" sx={{
                                fontWeight: 700,
                                color: COLORS.INFO[700],
                                mb: 1
                            }}>
                                {service.name}
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: COLORS.TEXT.SECONDARY,
                                lineHeight: 1.6
                            }}>
                                {service.description}
                            </Typography>
                        </CardContent>
                    </Box>
                </Card>

                {/* Service Details */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 5 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT,
                        border: `1px solid ${alpha(categoryColor[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(categoryColor[200], 0.15)}`
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: categoryColor[700],
                                mb: 3
                            }}>
                                📋 Thông tin chi tiết dịch vụ
                            </Typography>

                            {/* Service Basic Info */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                                p: 3,
                                backgroundColor: alpha(categoryColor[100], 0.3),
                                borderRadius: 3,
                                mb: 3
                            }}>
                                <Box>
                                    <Typography variant="subtitle2" color={categoryColor[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                        Giá cơ bản
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                        {formatPrice(service.base_price || service.price || 0)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" color={categoryColor[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                        Thời lượng
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDuration(service.duration_minutes || 0)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Available Slots */}
                            {service.slots && service.slots.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, color: categoryColor[700], fontWeight: 'bold' }}>
                                        Lịch trình có sẵn
                                    </Typography>

                                    {/* Ngày đã chọn (if already selected from modal) */}
                                    {(initialBookingData?.selectedDate || initialBookingData?.date) && (
                                        <Paper sx={{
                                            p: 2.5,
                                            mb: 3,
                                            borderRadius: 3,
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.5)}`,
                                            boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[200], 0.2)}`
                                        }}>
                                            <Typography variant="subtitle1" sx={{
                                                color: COLORS.SUCCESS[700],
                                                fontWeight: 'bold',
                                                mb: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <CalendarToday sx={{ fontSize: 20 }} />
                                                Ngày đã chọn
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: COLORS.SUCCESS[800], fontWeight: 'bold', mb: 1.5 }}>
                                                {(() => {
                                                    const dateStr = initialBookingData.selectedDate || initialBookingData.date;
                                                    // Parse date string as local date to avoid timezone issues
                                                    const [year, month, day] = dateStr.split('-').map(Number);
                                                    const date = new Date(year, month - 1, day);
                                                    return date.toLocaleDateString('vi-VN', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    });
                                                })()}
                                            </Typography>
                                            {initialBookingData?.slot && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    {initialBookingData.slot.start_time && initialBookingData.slot.end_time && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <AccessTime sx={{ fontSize: 18, color: COLORS.SUCCESS[600] }} />
                                                            <Typography variant="body1" fontWeight={600}>
                                                                {initialBookingData.slot.start_time.substring(0, 5)} - {initialBookingData.slot.end_time.substring(0, 5)}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {initialBookingData?.pet_group && (
                                                        <Box sx={{
                                                            mt: 1.5,
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            backgroundColor: alpha(COLORS.INFO[50], 0.5),
                                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                                <Pets sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.25 }} />
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.INFO[700] }}>
                                                                        Nhóm thú cưng: {initialBookingData.pet_group.name}
                                                                    </Typography>
                                                                    {initialBookingData.pet_group.description && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {initialBookingData.pet_group.description}
                                                                        </Typography>
                                                                    )}
                                                                    {bookingPetGroupDetails?.pets && bookingPetGroupDetails.pets.length > 0 && (
                                                                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                            {bookingPetGroupDetails.pets.slice(0, 6).map(pet => (
                                                                                <Chip key={pet.id || pet.name} label={pet.name || 'Thú cưng'} size="small" sx={{ background: alpha(COLORS.SECONDARY[50], 0.7) }} />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Paper>
                                    )}

                                    {/* Thông tin liên hệ người dùng */}
                                    {(formData.customerInfo.name || formData.customerInfo.phone || formData.customerInfo.email) && (
                                        <Paper sx={{
                                            p: 2,
                                            mb: 3,
                                            borderRadius: 2,
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `2px solid ${alpha(COLORS.INFO[200], 0.5)}`,
                                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[200], 0.2)}`
                                        }}>
                                            <Typography variant="subtitle1" sx={{
                                                mb: 1.5,
                                                color: COLORS.INFO[700],
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <Person sx={{ fontSize: 20 }} />
                                                Thông tin liên hệ của bạn
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                {formData.customerInfo.name && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Person sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            <strong>Họ tên:</strong> {formData.customerInfo.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {formData.customerInfo.phone && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Phone sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            <strong>Số điện thoại:</strong> {formData.customerInfo.phone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Box>
                            )}


                        </CardContent>
                    </Card>
                </Box>

                {/* Thông tin liên hệ */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 5 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT,
                        border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(COLORS.SECONDARY[200], 0.15)}`
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.SECONDARY[700],
                                mb: 3
                            }}>
                                📞 Thông tin liên hệ
                            </Typography>

                            <Stack spacing={3}>
                                {/* Họ tên */}
                                <TextField
                                    fullWidth
                                    label="Họ tên"
                                    placeholder="Nhập tên của bạn"
                                    value={formData.customerInfo.name}
                                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                                    error={!!errors.customerInfo?.name}
                                    helperText={errors.customerInfo?.name}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                        }
                                    }}
                                />

                                {/* Số điện thoại */}
                                <TextField
                                    fullWidth
                                    label="Số điện thoại"
                                    placeholder="Nhập số điện thoại của bạn"
                                    value={formData.customerInfo.phone}
                                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                                    inputProps={{ maxLength: 10 }}
                                    error={!!errors.customerInfo?.phone}
                                    helperText={errors.customerInfo?.phone}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                        }
                                    }}
                                />

                                {/* Địa chỉ */}
                                <TextField
                                    fullWidth
                                    label="Địa chỉ"
                                    placeholder="Nhập địa chỉ (tùy chọn)"
                                    value={formData.customerInfo.address || ''}
                                    onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                        }
                                    }}
                                />

                                {/* Ghi chú */}
                                <TextField
                                    fullWidth
                                    label="Ghi chú"
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    value={formData.customerInfo.notes || ''}
                                    onChange={(e) => handleCustomerInfoChange('notes', e.target.value)}
                                    multiline
                                    rows={3}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                        }
                                    }}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>

                {/* Tóm tắt đặt lịch */}
                <Box sx={{ mb: { xs: 3, sm: 4, md: 4 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT,
                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                        boxShadow: `0 4px 20px ${alpha(COLORS.SUCCESS[200], 0.15)}`
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.SUCCESS[700],
                                mb: 3
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
                                {/* Phần thông tin dịch vụ */}
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
                                                fontWeight: 'bold'
                                            }}>
                                                🐾 Dịch vụ
                                            </Typography>
                                            <Typography variant="body1" sx={{
                                                fontWeight: 'bold',
                                                color: COLORS.SUCCESS[700]
                                            }}>
                                                {service.name}
                                            </Typography>
                                        </Paper>

                                        {(formData.selectedDate || initialBookingData?.selectedDate || initialBookingData?.date) && (
                                            <Paper sx={{
                                                p: 1.5,
                                                borderRadius: 3,
                                                background: alpha(COLORS.INFO[50], 0.6),
                                                border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.INFO[700],
                                                    mb: 0.5,
                                                    fontWeight: 'bold'
                                                }}>
                                                    📅 Ngày đã chọn
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.INFO[700]
                                                }}>
                                                    {(() => {
                                                        const dateStr = formData.selectedDate || initialBookingData?.selectedDate || initialBookingData?.date;
                                                        // Parse date string as local date to avoid timezone issues
                                                        const [year, month, day] = dateStr.split('-').map(Number);
                                                        const date = new Date(year, month - 1, day);
                                                        return date.toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        });
                                                    })()}
                                                </Typography>
                                                {initialBookingData?.slot?.start_time && initialBookingData?.slot?.end_time && (
                                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AccessTime sx={{ fontSize: 16, color: COLORS.INFO[600] }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {initialBookingData.slot.start_time.substring(0, 5)} - {initialBookingData.slot.end_time.substring(0, 5)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {initialBookingData?.pet_group && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Nhóm: {initialBookingData.pet_group.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Paper>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Phần tổng tiền và nút */}
                                <Box sx={{ minWidth: { xs: '100%', lg: '280px' } }}>
                                    <Stack spacing={2}>
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${alpha(COLORS.SUCCESS[300], 0.7)}`,
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="body2" sx={{
                                                color: COLORS.SUCCESS[600],
                                                fontWeight: 600,
                                                mb: 1
                                            }}>
                                                💰 TỔNG TIỀN
                                            </Typography>
                                            <Typography variant="h5" sx={{
                                                color: COLORS.SUCCESS[700],
                                                fontWeight: 700
                                            }}>
                                                {formatPrice(service.base_price || service.price || 0)}
                                            </Typography>
                                        </Paper>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={handleAddToCart}
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
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, 
                                                        ${COLORS.SUCCESS[600]} 0%, 
                                                        ${COLORS.SUCCESS[700]} 50%,
                                                        ${COLORS.WARNING[600]} 100%
                                                    )`
                                                },
                                                '&:disabled': {
                                                    background: alpha(COLORS.GRAY[300], 0.6),
                                                    color: COLORS.GRAY[500]
                                                }
                                            }}
                                        >
                                            {isFormComplete() ? '🛒 Thêm vào giỏ hàng' : '⏳ Điền đầy đủ thông tin'}
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

