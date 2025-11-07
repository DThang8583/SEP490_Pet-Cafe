import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Stack, IconButton, Divider, Button, Chip } from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, ArrowBack } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { salesApi, authApi } from '../../api/authApi';

const CartPage = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bank_transfer'

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
            } catch {}
        };
        window.addEventListener('cartUpdated', onCartUpdated);
        setInitialized(true);
        return () => window.removeEventListener('cartUpdated', onCartUpdated);
    }, []);

    useEffect(() => {
        if (!initialized) return; // avoid clearing storage on first mount
        try {
            localStorage.setItem('sales_cart', JSON.stringify(items));
        } catch {}
    }, [items, initialized]);

    const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

    const increaseQty = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    const decreaseQty = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const clearCart = () => setItems([]);

    const checkout = async () => {
        if (!items.length) return;
        try {
            const role = authApi.getUserRole();
            if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');

            // Build payload per official API
            const productItems = items
                .filter(i => !String(i.id).startsWith('svc-'))
                .map(i => ({ product_id: i.id, quantity: i.quantity, notes: '' }));

            const serviceItems = items
                .filter(i => String(i.id).startsWith('svc-'))
                .map(i => ({
                    slot_id: String(i.id).replace('svc-',''),
                    notes: '',
                    booking_date: new Date().toISOString()
                }));

            const payload = {
                full_name: '',
                address: '',
                phone: '',
                notes: '',
                payment_method: (paymentMethod || 'cash').toUpperCase(),
                ...(productItems.length ? { products: productItems } : {}),
                ...(serviceItems.length ? { services: serviceItems } : {})
            };

            const token = localStorage.getItem('authToken');
            console.log('[Cart][checkout] items:', items);
            console.log('[Cart][checkout] paymentMethod:', paymentMethod);
            console.log('[Cart][checkout] payload:', payload);
            console.log('[Cart][checkout] hasToken:', !!token);
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
                        <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Giỏ hàng</Typography>
                    </Stack>
                    <Chip color="error" label={`${items.length} mặt hàng`} />
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}`, backgroundColor: COLORS.BACKGROUND.PAPER }}>
                    <CardContent>
                        {items.length === 0 ? (
                            <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>Chưa có sản phẩm nào trong giỏ hàng.</Typography>
                        ) : (
                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {items.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>{item.price.toLocaleString('vi-VN')} ₫</Typography>
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
                            <Typography>Tổng cộng</Typography>
                            <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>{total.toLocaleString('vi-VN')} ₫</Typography>
                        </Stack>
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


