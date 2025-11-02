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
            const res = await salesApi.createOrder({ items, paymentMethod: 'bank_transfer', paid: true });
            const invoice = res?.data?.invoice;
            const search = new URLSearchParams({ invoiceId: invoice?.id || '', total: String(invoice?.total || 0), method: 'bank_transfer' }).toString();
            // Clear cart then go to QR page
            setItems([]);
            navigate(`/sales/checkout?${search}`);
        } catch (e) {
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


