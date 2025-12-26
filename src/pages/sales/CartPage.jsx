import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Stack, IconButton, Divider, Button, Chip, TextField, alpha, InputAdornment } from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, ArrowBack, Person, Phone, Home } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { salesApi, authApi } from '../../api/authApi';

const CartPage = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bank_transfer'
    const [customerInfo, setCustomerInfo] = useState({
        full_name: '',
        phone: '',
        address: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem('sales_cart');
            setItems(saved ? JSON.parse(saved) : []);
        } catch {
            setItems([]);
        }
        const onCartUpdated = () => {
            try {
                const latest = localStorage.getItem('sales_cart');
                setItems(latest ? JSON.parse(latest) : []);
            } catch { }
        };
        window.addEventListener('cartUpdated', onCartUpdated);
        setInitialized(true);
        return () => window.removeEventListener('cartUpdated', onCartUpdated);
    }, []);

    useEffect(() => {
        if (!initialized) return; // avoid clearing storage on first mount
        try {
            localStorage.setItem('sales_cart', JSON.stringify(items));
        } catch { }
    }, [items, initialized]);

    const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

    // Check if cart has service items
    const hasServiceItems = useMemo(() => {
        return items.some(i => String(i.id).startsWith('svc-'));
    }, [items]);

    const increaseQty = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    const decreaseQty = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const clearCart = () => {
        setItems([]);
        setCustomerInfo({ full_name: '', phone: '', address: '', notes: '' });
        setErrors({});
    };

    const validateCustomerInfo = () => {
        if (!hasServiceItems) return true; // No validation needed if no services

        const newErrors = {};
        if (!customerInfo.full_name || !customerInfo.full_name.trim()) {
            newErrors.full_name = 'Vui lòng nhập họ tên';
        }
        if (!customerInfo.phone || !customerInfo.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkout = async () => {
        if (!items.length) {
            alert('Giỏ hàng trống');
            return;
        }

        // Validate customer info if cart has services
        if (hasServiceItems && !validateCustomerInfo()) {
            alert('Vui lòng điền đầy đủ thông tin khách hàng (Họ tên và Số điện thoại)');
            return;
        }

        try {
            const role = authApi.getUserRole();
            if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');

            // Build payload per official API
            const productItems = items
                .filter(i => !String(i.id).startsWith('svc-'))
                .map(i => ({ product_id: i.id, quantity: i.quantity, notes: '' }));

            // Calculate booking_date based on slot's day_of_week, start_time, and end_time
            const getBookingDateForSlot = async (slotId) => {
                try {
                    const token = localStorage.getItem('authToken');
                    const resp = await fetch(`https://petcafes.azurewebsites.net/api/slots/${slotId}`, {
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : '',
                            'Accept': 'application/json'
                        }
                    });
                    if (resp.ok) {
                        const json = await resp.json();
                        const slot = json?.data || json;
                        const dayOfWeek = slot?.day_of_week;
                        const startTime = slot?.start_time; // Format: "HH:mm:ss" or "HH:mm"

                        if (dayOfWeek) {
                            // Map day_of_week to JavaScript day number
                            const dayMap = {
                                'MONDAY': 1,
                                'TUESDAY': 2,
                                'WEDNESDAY': 3,
                                'THURSDAY': 4,
                                'FRIDAY': 5,
                                'SATURDAY': 6,
                                'SUNDAY': 0
                            };

                            const targetDay = dayMap[dayOfWeek];
                            if (targetDay !== undefined) {
                                // Calculate the nearest target day
                                const today = new Date();
                                const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                                let daysUntilTarget = (targetDay - currentDay + 7) % 7;
                                if (daysUntilTarget === 0) daysUntilTarget = 7; // If today is the target day, get next week

                                const targetDate = new Date(today);
                                targetDate.setDate(today.getDate() + daysUntilTarget);

                                // Parse start_time
                                let hours = 0, minutes = 0, seconds = 0;
                                if (startTime) {
                                    const timeParts = startTime.split(':');
                                    hours = parseInt(timeParts[0]) || 0;
                                    minutes = parseInt(timeParts[1]) || 0;
                                    seconds = parseInt(timeParts[2]) || 0;
                                }

                                // Get date components (using local date, not UTC)
                                const year = targetDate.getFullYear();
                                const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                                const day = String(targetDate.getDate()).padStart(2, '0');
                                const hh = String(hours).padStart(2, '0');
                                const mm = String(minutes).padStart(2, '0');
                                const ss = String(seconds).padStart(2, '0');

                                // Format: YYYY-MM-DDTHH:mm:ss.000Z (keep time as-is, treat as UTC)
                                return `${year}-${month}-${day}T${hh}:${mm}:${ss}.000Z`;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[Cart] Could not fetch slot info:', e);
                }

                // Default: 21/11
                const bookingDateObj = new Date();
                bookingDateObj.setMonth(10); // November (0-indexed, so 10 = November)
                bookingDateObj.setDate(21);
                bookingDateObj.setHours(0, 0, 0, 0);
                return bookingDateObj.toISOString();
            };

            // Process service items with their booking dates
            const serviceItemsPromises = items
                .filter(i => String(i.id).startsWith('svc-'))
                .map(async (i) => {
                    const slotId = i.slot_id || String(i.id).replace(/^svc-([^-]+).*/, '$1');

                    // Nếu đã có booking_date trong cart item, sử dụng nó
                    // Format: YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss.000Z
                    let bookingDate;
                    if (i.booking_date) {
                        // booking_date từ cart là "YYYY-MM-DD", cần thêm time
                        // Lấy start_time từ slot để tạo datetime đầy đủ
                        try {
                            const token = localStorage.getItem('authToken');
                            const resp = await fetch(`https://petcafes.azurewebsites.net/api/slots/${slotId}`, {
                                headers: {
                                    'Authorization': token ? `Bearer ${token}` : '',
                                    'Accept': 'application/json'
                                }
                            });
                            if (resp.ok) {
                                const json = await resp.json();
                                const slot = json?.data || json;
                                const startTime = slot?.start_time || '00:00:00';

                                // Parse start_time
                                const timeParts = startTime.split(':');
                                const hours = parseInt(timeParts[0]) || 0;
                                const minutes = parseInt(timeParts[1]) || 0;
                                const seconds = parseInt(timeParts[2]) || 0;

                                // Combine date and time
                                const [year, month, day] = i.booking_date.split('-');
                                bookingDate = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.000Z`;
                            } else {
                                // Fallback: use date with default time
                                bookingDate = `${i.booking_date}T00:00:00.000Z`;
                            }
                        } catch (e) {
                            console.warn('[Cart] Could not fetch slot for booking_date:', e);
                            // Fallback: use date with default time
                            bookingDate = `${i.booking_date}T00:00:00.000Z`;
                        }
                    } else {
                        // Fallback to old logic if booking_date not found
                        bookingDate = await getBookingDateForSlot(slotId);
                    }

                    return {
                        slot_id: slotId,
                        notes: '',
                        booking_date: bookingDate
                    };
                });

            const serviceItems = await Promise.all(serviceItemsPromises);

            // Map payment method: cash -> AT_COUNTER, bank_transfer -> ONLINE
            const paymentMethodMap = {
                'cash': 'AT_COUNTER',
                'bank_transfer': 'ONLINE'
            };
            const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'AT_COUNTER';

            // Build payload - customer info is required when there are services
            const payload = {
                // Customer information - required for service orders
                full_name: hasServiceItems ? customerInfo.full_name.trim() : '',
                address: hasServiceItems ? customerInfo.address.trim() : '',
                phone: hasServiceItems ? customerInfo.phone.trim() : '',
                notes: hasServiceItems ? customerInfo.notes.trim() : '',
                payment_method: mappedPaymentMethod,
                // Products and services
                ...(productItems.length ? { products: productItems } : {}),
                ...(serviceItems.length ? { services: serviceItems } : {})
            };

            // Log payload to verify customer info is included
            console.log('[Cart][checkout] Customer info:', {
                full_name: payload.full_name,
                phone: payload.phone,
                address: payload.address,
                notes: payload.notes
            });

            const token = localStorage.getItem('authToken');
            console.log('[Cart][checkout] items:', items);
            console.log('[Cart][checkout] paymentMethod:', paymentMethod);
            console.log('[Cart][checkout] payload:', payload);
            console.log('[Cart][checkout] hasToken:', !!token);
            const resp = await fetch('https://petcafes.azurewebsites.net/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });
            const rawText = await resp.text();
            console.log('[Cart][checkout] response.status:', resp.status);
            console.log('[Cart][checkout] response.body:', rawText);
            const jsonData = (() => { try { return JSON.parse(rawText); } catch { return null; } })();
            if (!resp.ok) {
                const msg = jsonData?.message || 'Không thể tạo đơn hàng';
                throw new Error(msg);
            }
            const data = jsonData;
            const root = (data && data.data) ? data.data : data;
            const orderId = root?.product_order?.order_id || root?.id || (productItems[0]?.product_id || serviceItems[0]?.slot_id || '');
            const productOrderId = root?.product_order?.id || '';
            const localTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

            const search = new URLSearchParams({
                invoiceId: productOrderId || root?.service_order?.id || '',
                productOrderId: productOrderId || '',
                total: String(root?.final_amount || localTotal || 0),
                method: paymentMethod,
                orderId
            }).toString();

            setItems([]);
            navigate(`/sales/checkout?${search}`);
        } catch (e) {
            console.error('[Cart][checkout] error:', e);
            alert(e.message || 'Lỗi tạo đơn hàng');
        }
    };

    return (
        <Box sx={{ py: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
            <Container maxWidth="md">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} color="error" variant="text">Quay lại</Button>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.ERROR[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Xác nhận đơn hàng</Typography>
                    </Stack>
                    <Chip color="error" label={`${items.length} mặt hàng`} />
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}`, backgroundColor: COLORS.BACKGROUND.PAPER }}>
                    <CardContent>
                        {items.length === 0 ? (
                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 }}>Chưa có sản phẩm nào trong giỏ hàng.</Typography>
                        ) : (
                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {items.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 500, fontSize: '1rem', lineHeight: 1.5 }}>{item.name}</Typography>
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.9375rem', lineHeight: 1.5 }}>{item.price.toLocaleString('vi-VN')} VNĐ</Typography>
                                        </Box>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <IconButton size="small" onClick={() => decreaseQty(item.id)}><Remove /></IconButton>
                                            <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                                            <IconButton size="small" onClick={() => increaseQty(item.id)}><Add /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => removeItem(item.id)}><Delete /></IconButton>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        <Divider sx={{ mb: 2 }} />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: '1.125rem', lineHeight: 1.5 }}>Tổng cộng</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: COLORS.ERROR[600], letterSpacing: '-0.01em' }}>{total.toLocaleString('vi-VN')} VNĐ</Typography>
                        </Stack>

                        {/* Customer Information Form - Only show if cart has services */}
                        {hasServiceItems && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: COLORS.ERROR[600], fontSize: '1rem' }}>
                                    Thông tin khách hàng *
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="Họ tên"
                                        placeholder="Nhập họ tên khách hàng"
                                        value={customerInfo.full_name}
                                        onChange={(e) => {
                                            setCustomerInfo(prev => ({ ...prev, full_name: e.target.value }));
                                            if (errors.full_name) {
                                                setErrors(prev => ({ ...prev, full_name: '' }));
                                            }
                                        }}
                                        error={!!errors.full_name}
                                        helperText={errors.full_name}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Số điện thoại"
                                        placeholder="Nhập số điện thoại"
                                        value={customerInfo.phone}
                                        onChange={(e) => {
                                            setCustomerInfo(prev => ({ ...prev, phone: e.target.value }));
                                            if (errors.phone) {
                                                setErrors(prev => ({ ...prev, phone: '' }));
                                            }
                                        }}
                                        error={!!errors.phone}
                                        helperText={errors.phone}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ"
                                        placeholder="Nhập địa chỉ (tùy chọn)"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Home sx={{ color: COLORS.TEXT.SECONDARY }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Ghi chú"
                                        placeholder="Ghi chú thêm (tùy chọn)"
                                        value={customerInfo.notes}
                                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                                        multiline
                                        rows={2}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9)
                                            }
                                        }}
                                    />
                                </Stack>
                            </Box>
                        )}

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button
                                variant="outlined"
                                color={paymentMethod === 'cash' ? 'success' : 'error'}
                                onClick={() => setPaymentMethod(prev => prev === 'cash' ? 'bank_transfer' : 'cash')}
                            >
                                {paymentMethod === 'cash' ? 'Phương thức: Tiền mặt' : 'Phương thức: Chuyển khoản QR'}
                            </Button>
                            <Button variant="outlined" color="error" onClick={clearCart}>Xóa giỏ hàng</Button>
                            <Button variant="contained" color="error" startIcon={<ShoppingCart />} disabled={!items.length} onClick={checkout}>Thanh toán</Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default CartPage;