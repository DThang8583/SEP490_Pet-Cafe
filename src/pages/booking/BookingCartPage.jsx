import React, { useEffect, useMemo, useState } from 'react';
import { 
    Box, Typography, Card, CardContent, Stack, IconButton, 
    Divider, Button, Chip, alpha, Paper, Fade
} from '@mui/material';
import { Delete, ShoppingCart, ArrowBack, CalendarToday, AccessTime, Pets, Person, Phone, Note, LocationOn } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

const BookingCartPage = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bank_transfer'
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('booking_cart');
            setItems(saved ? JSON.parse(saved) : []);
        } catch {
            setItems([]);
        }
        const onCartUpdated = () => {
            try {
                const latest = localStorage.getItem('booking_cart');
                setItems(latest ? JSON.parse(latest) : []);
            } catch {}
        };
        window.addEventListener('bookingCartUpdated', onCartUpdated);
        setInitialized(true);
        return () => window.removeEventListener('bookingCartUpdated', onCartUpdated);
    }, []);

    useEffect(() => {
        if (!initialized) return;
        try {
            localStorage.setItem('booking_cart', JSON.stringify(items));
        } catch {}
    }, [items, initialized]);

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const price = item.slot?.price || item.price || item.service?.base_price || 0;
            return sum + price;
        }, 0);
    }, [items]);

    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

    // Delete cart from API
    const deleteCartFromAPI = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('[BookingCart] No auth token, skipping API delete');
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/carts', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const rawText = await response.text();
            console.log('[BookingCart][deleteCart] response.status:', response.status);
            console.log('[BookingCart][deleteCart] response.body:', rawText);

            let jsonData = null;
            try {
                jsonData = JSON.parse(rawText);
            } catch {
                // Response might not be JSON
            }

            if (response.ok) {
                // Check if success is true in response
                if (jsonData && jsonData.success === true) {
                    return { success: true, message: 'Đã xóa giỏ hàng thành công' };
                } else {
                    // API returned 200 but success: false (might be empty cart)
                    return { success: true, message: 'Giỏ hàng đã được xóa' };
                }
            } else {
                const errorMsg = jsonData?.message || jsonData?.error || 'Không thể xóa giỏ hàng';
                return { success: false, message: errorMsg };
            }
        } catch (error) {
            console.error('[BookingCart][deleteCart] error:', error);
            return { success: false, message: error.message || 'Lỗi khi xóa giỏ hàng' };
        }
    };

    const clearCart = async () => {
        if (items.length === 0) {
            return;
        }

        // Confirm before deleting
        if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
            return;
        }

        setIsDeleting(true);
        try {
            // Call API to delete cart
            const result = await deleteCartFromAPI();
            
            if (result.success) {
                // Clear local cart
                setItems([]);
                localStorage.removeItem('booking_cart');
                window.dispatchEvent(new Event('bookingCartUpdated'));
                alert('Đã xóa giỏ hàng thành công');
            } else {
                // Even if API fails, still clear local cart (fallback)
                console.warn('[BookingCart] API delete failed, clearing local cart anyway:', result.message);
                setItems([]);
                localStorage.removeItem('booking_cart');
                window.dispatchEvent(new Event('bookingCartUpdated'));
                alert('Đã xóa giỏ hàng (có thể chưa đồng bộ với server)');
            }
        } catch (error) {
            console.error('[BookingCart][clearCart] error:', error);
            // Fallback: clear local cart even if API fails
            setItems([]);
            localStorage.removeItem('booking_cart');
            window.dispatchEvent(new Event('bookingCartUpdated'));
            alert('Đã xóa giỏ hàng (có thể chưa đồng bộ với server)');
        } finally {
            setIsDeleting(false);
        }
    };

    // Get customer info from first item (all items should have same customer info)
    const customerInfo = useMemo(() => {
        if (items.length > 0 && items[0].customerInfo) {
            return items[0].customerInfo;
        }
        return {
            full_name: '',
            address: '',
            phone: '',
            notes: ''
        };
    }, [items]);

    const checkout = async () => {
        if (!items.length) {
            alert('Giỏ hàng trống');
            return;
        }

        // Validate required fields from cart items
        if (!customerInfo.full_name || !customerInfo.full_name.trim()) {
            alert('Vui lòng điền thông tin liên hệ ở form đặt dịch vụ');
            return;
        }
        if (!customerInfo.phone || !customerInfo.phone.trim()) {
            alert('Vui lòng điền thông tin liên hệ ở form đặt dịch vụ');
            return;
        }

        try {
            // Build services array from cart items
            const services = items.map(item => {
                // Get booking_date from item (should be stored when adding to cart)
                let bookingDate = item.booking_date || item.selectedDate;
                
                // If booking_date is just a date string (YYYY-MM-DD), convert to ISO format
                if (bookingDate && !bookingDate.includes('T')) {
                    // If we have slot with start_time, combine date and time
                    if (item.slot?.start_time) {
                        const time = item.slot.start_time.substring(0, 5); // Get HH:mm
                        // Format as ISO string with milliseconds: YYYY-MM-DDTHH:mm:ss.sssZ
                        bookingDate = `${bookingDate}T${time}:00.000Z`;
                    } else {
                        bookingDate = `${bookingDate}T00:00:00.000Z`;
                    }
                }

                // If no booking_date, try to get from slot
                if (!bookingDate && item.slot) {
                    if (item.slot.specific_date) {
                        const date = new Date(item.slot.specific_date);
                        const time = item.slot.start_time || '00:00:00';
                        const dateStr = date.toISOString().split('T')[0];
                        // Ensure time format includes milliseconds
                        const timeParts = time.split(':');
                        const formattedTime = timeParts.length === 3 
                            ? time 
                            : `${time}:00`;
                        bookingDate = `${dateStr}T${formattedTime}.000Z`;
                    } else if (item.slot.day_of_week) {
                        // Calculate next occurrence of day_of_week
                        const dayMap = {
                            'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
                            'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 0
                        };
                        const targetDay = dayMap[item.slot.day_of_week];
                        if (targetDay !== undefined) {
                            const today = new Date();
                            const currentDay = today.getDay();
                            let daysUntilTarget = (targetDay - currentDay + 7) % 7;
                            if (daysUntilTarget === 0) daysUntilTarget = 7;
                            
                            const targetDate = new Date(today);
                            targetDate.setDate(today.getDate() + daysUntilTarget);
                            
                            const time = item.slot.start_time || '00:00:00';
                            const dateStr = targetDate.toISOString().split('T')[0];
                            const timeParts = time.split(':');
                            const formattedTime = timeParts.length === 3 
                                ? time 
                                : `${time}:00`;
                            bookingDate = `${dateStr}T${formattedTime}.000Z`;
                        }
                    }
                }

                // Fallback to current date + 1 day if still no date
                if (!bookingDate) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    bookingDate = tomorrow.toISOString();
                }

                // Ensure booking_date is in correct ISO format with milliseconds
                if (bookingDate && !bookingDate.endsWith('Z') && !bookingDate.includes('+')) {
                    // If not already ISO format, convert it
                    try {
                        const dateObj = new Date(bookingDate);
                        bookingDate = dateObj.toISOString();
                    } catch (e) {
                        console.warn('Error converting booking_date to ISO:', e);
                    }
                }

                return {
                    slot_id: item.slot_id || item.slot?.id || item.id,
                    notes: (item.notes || customerInfo.notes || '').trim() || '',
                    booking_date: bookingDate
                };
            });

            // Map payment method
            const paymentMethodMap = {
                'cash': 'AT_COUNTER',
                'bank_transfer': 'ONLINE'
            };
            const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'AT_COUNTER';

            const payload = {
                full_name: customerInfo.full_name.trim(),
                address: (customerInfo.address || '').trim(),
                phone: customerInfo.phone.trim(),
                notes: (customerInfo.notes || '').trim(),
                services: services,
                payment_method: mappedPaymentMethod || 'AT_COUNTER'
            };

            const token = localStorage.getItem('authToken');
            console.log('[BookingCart][checkout] payload:', payload);

            const resp = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            const rawText = await resp.text();
            console.log('[BookingCart][checkout] response.status:', resp.status);
            console.log('[BookingCart][checkout] response.body:', rawText);

            const jsonData = (() => {
                try {
                    return JSON.parse(rawText);
                } catch {
                    return null;
                }
            })();

            if (!resp.ok) {
                const msg = jsonData?.message || jsonData?.error || 'Không thể tạo đơn hàng';
                throw new Error(msg);
            }

            // Parse response data
            const orderData = jsonData?.data || jsonData;
            const orderId = orderData?.id || '';
            const serviceOrderId = orderData?.service_order?.id || '';
            const orderNumber = orderData?.order_number || '';
            
            // Prepare order data for confirmation
            const confirmationData = {
                id: orderId,
                order_number: orderNumber,
                service_order_id: serviceOrderId,
                services: items.map(item => ({
                    service_name: item.service?.name || item.name,
                    booking_date: item.booking_date || item.selectedDate,
                    notes: item.notes || customerInfo.notes || '',
                    price: item.slot?.price || item.price || item.service?.base_price || 0,
                    slot: item.slot
                })),
                customerInfo: {
                    full_name: customerInfo.full_name,
                    address: customerInfo.address || '',
                    phone: customerInfo.phone,
                    notes: customerInfo.notes || ''
                },
                payment_method: mappedPaymentMethod,
                payment_status: orderData?.payment_status || 'PENDING',
                status: orderData?.status || 'PENDING',
                total: orderData?.final_amount || orderData?.total_amount || total,
                ...orderData
            };

            // Save order data to localStorage for confirmation page
            localStorage.setItem('last_booking_order', JSON.stringify(confirmationData));

            // Success - clear cart and navigate
            setItems([]);
            localStorage.removeItem('booking_cart');
            window.dispatchEvent(new Event('bookingCartUpdated'));
            
            // Show success message and navigate
            alert('Đặt dịch vụ thành công!');
            navigate('/booking');
        } catch (e) {
            console.error('[BookingCart][checkout] error:', e);
            alert(e.message || 'Lỗi tạo đơn hàng');
        }
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
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                    startIcon={<ArrowBack />}
                                    onClick={() => {
                                        navigate(-1);
                                    }}
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
                                <Typography variant="h4" sx={{
                                    fontWeight: 700,
                                    color: COLORS.INFO[700]
                                }}>
                                    Giỏ hàng dịch vụ
                                </Typography>
                            </Box>
                            <Chip 
                                label={`${items.length} dịch vụ`}
                                sx={{
                                    backgroundColor: alpha(COLORS.INFO[500], 0.9),
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Services List */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 5 } }}>
                    <Card sx={{
                        borderRadius: 6,
                        backgroundColor: COLORS.BACKGROUND.DEFAULT,
                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(COLORS.INFO[200], 0.15)}`
                    }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: COLORS.INFO[700],
                                mb: 3
                            }}>
                                🛒 Danh sách dịch vụ
                            </Typography>

                            {items.length === 0 ? (
                                <Paper sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    borderRadius: 3,
                                    background: alpha(COLORS.INFO[50], 0.5),
                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                }}>
                                    <ShoppingCart sx={{ fontSize: 48, color: COLORS.INFO[400], mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                                        Chưa có dịch vụ nào trong giỏ hàng
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Hãy thêm dịch vụ từ trang đặt lịch
                                    </Typography>
                                </Paper>
                            ) : (
                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {items.map((item, index) => {
                                        const service = item.service || item;
                                        const slot = item.slot;
                                        const price = slot?.price || item.price || service?.base_price || 0;
                                        const bookingDate = item.booking_date || item.selectedDate;

                                        return (
                                            <Paper
                                                key={item.id || index}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 3,
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `2px solid ${alpha(COLORS.INFO[200], 0.5)}`,
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.INFO[200], 0.2)}`,
                                                    position: 'relative',
                                                    '&:hover': {
                                                        boxShadow: `0 6px 16px ${alpha(COLORS.INFO[300], 0.3)}`
                                                    }
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="h6" sx={{ 
                                                            fontWeight: 700, 
                                                            mb: 1.5, 
                                                            color: COLORS.INFO[700]
                                                        }}>
                                                            {service?.name || item.name}
                                                        </Typography>
                                                        
                                                        <Stack spacing={1}>
                                                            {bookingDate && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <CalendarToday sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                        {(() => {
                                                                            const dateStr = bookingDate;
                                                                            if (!dateStr) return '';
                                                                            if (dateStr.includes('T')) {
                                                                                const date = new Date(dateStr);
                                                                                return date.toLocaleDateString('vi-VN', {
                                                                                    weekday: 'long',
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric'
                                                                                });
                                                                            } else {
                                                                                const [year, month, day] = dateStr.split('-').map(Number);
                                                                                const date = new Date(year, month - 1, day);
                                                                                return date.toLocaleDateString('vi-VN', {
                                                                                    weekday: 'long',
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric'
                                                                                });
                                                                            }
                                                                        })()}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {slot?.start_time && slot?.end_time && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <AccessTime sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {slot?.pet_group && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Pets sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        Nhóm: {slot.pet_group.name}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            <Box sx={{ mt: 1.5 }}>
                                                                <Typography variant="h6" sx={{ 
                                                                    color: COLORS.ERROR[600], 
                                                                    fontWeight: 700 
                                                                }}>
                                                                    {formatPrice(price)}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeItem(item.id)}
                                                        sx={{
                                                            color: COLORS.ERROR[600],
                                                            '&:hover': {
                                                                backgroundColor: alpha(COLORS.ERROR[100], 0.8)
                                                            }
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}

                            {items.length > 0 && (
                                <Paper sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                    border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.7)}`
                                }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                            Tổng cộng
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                            {formatPrice(total)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Customer Information Display */}
                {items.length > 0 && (
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
                                    📞 Thông tin khách hàng
                                </Typography>
                                <Stack spacing={2}>
                                    {customerInfo.full_name && (
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: alpha(COLORS.INFO[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Person sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                                    Họ tên
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.INFO[700] }}>
                                                {customerInfo.full_name}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {customerInfo.phone && (
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: alpha(COLORS.INFO[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Phone sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                                    Số điện thoại
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.INFO[700] }}>
                                                {customerInfo.phone}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {customerInfo.address && (
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: alpha(COLORS.INFO[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <LocationOn sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                                    Địa chỉ
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" color="text.secondary">
                                                {customerInfo.address}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {customerInfo.notes && (
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: alpha(COLORS.INFO[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.INFO[200], 0.5)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Note sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                                    Ghi chú
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" color="text.secondary">
                                                {customerInfo.notes}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {(!customerInfo.full_name || !customerInfo.phone) && (
                                        <Paper sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: alpha(COLORS.ERROR[50], 0.6),
                                            border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}`
                                        }}>
                                            <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                                                ⚠️ Vui lòng điền thông tin liên hệ ở form đặt dịch vụ
                                            </Typography>
                                        </Paper>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Payment and Actions */}
                {items.length > 0 && (
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
                                    💳 Thanh toán
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                                    <Button
                                        variant="outlined"
                                        onClick={() => setPaymentMethod(prev => prev === 'cash' ? 'bank_transfer' : 'cash')}
                                        sx={{
                                            flex: 1,
                                            py: 2,
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderColor: paymentMethod === 'cash' ? COLORS.SUCCESS[500] : COLORS.INFO[500],
                                            color: paymentMethod === 'cash' ? COLORS.SUCCESS[700] : COLORS.INFO[700],
                                            '&:hover': {
                                                borderColor: paymentMethod === 'cash' ? COLORS.SUCCESS[600] : COLORS.INFO[600],
                                                backgroundColor: paymentMethod === 'cash' ? alpha(COLORS.SUCCESS[50], 0.8) : alpha(COLORS.INFO[50], 0.8)
                                            }
                                        }}
                                    >
                                        {paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={clearCart}
                                        disabled={isDeleting || items.length === 0}
                                        sx={{
                                            flex: 1,
                                            py: 2,
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderColor: COLORS.ERROR[500],
                                            color: COLORS.ERROR[700],
                                            '&:hover': {
                                                borderColor: COLORS.ERROR[600],
                                                backgroundColor: alpha(COLORS.ERROR[50], 0.8)
                                            },
                                            '&:disabled': {
                                                borderColor: alpha(COLORS.GRAY[300], 0.6),
                                                color: COLORS.GRAY[500]
                                            }
                                        }}
                                    >
                                        {isDeleting ? '⏳ Đang xóa...' : '🗑️ Xóa giỏ hàng'}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<ShoppingCart />}
                                        onClick={checkout}
                                        disabled={!customerInfo.full_name.trim() || !customerInfo.phone.trim()}
                                        sx={{
                                            flex: 1,
                                            py: 2.5,
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            minHeight: 60,
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
                                        Đặt dịch vụ
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>
        </Fade>
    );
};

export default BookingCartPage;

