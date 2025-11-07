import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('invoiceId') || '';
    const total = Number(params.get('total') || 0);
    const method = params.get('method') || 'cash';
    const orderId = params.get('orderId') || '';
    const productOrderId = params.get('productOrderId') || '';
    const qrUrl = useMemo(() => {
        const payload = encodeURIComponent(JSON.stringify({ invoiceId, amount: total, method }));
        return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${payload}`;
    }, [invoiceId, total, method]);

    return (
        <Box sx={{ py: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
            <Container maxWidth="sm">
            <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}` }}>
                <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 2 }}>Thanh toán</Typography>
                    {method === 'cash' ? (
                        <Stack alignItems="center" spacing={2}>
                            <Typography>Mã hóa đơn: <b>{invoiceId}</b></Typography>
                            <Typography>Hình thức: <b>Tiền mặt</b></Typography>
                            <Typography>Tổng tiền: <b style={{ color: COLORS.ERROR[600] }}>{total.toLocaleString('vi-VN')} ₫</b></Typography>
                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center' }}>
                                Thu tiền mặt từ khách và xác nhận hoàn tất để ghi nhận thanh toán.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <Button variant="outlined" color="error" onClick={() => window.history.back()}>Quay lại</Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('authToken');
                                            const effectiveOrderId = orderId;
                                            if (!effectiveOrderId) throw new Error('Không xác định được orderId');
                                            const resolvedProductOrderId = productOrderId || invoiceId || '';
                                            console.log('[Checkout][confirm] product_order_id:', resolvedProductOrderId);
                                            const confirmBody = { product_order_id: resolvedProductOrderId };
                                            console.log('[Checkout][confirm] orderId:', effectiveOrderId);
                                            console.log('[Checkout][confirm] method: PUT');
                                            console.log('[Checkout][confirm] body:', confirmBody);
                                            console.log('[Checkout][confirm] hasToken:', !!token);
                                            const resp = await fetch(`https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/orders/${effectiveOrderId}/confirm`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Authorization': token ? `Bearer ${token}` : '',
                                                    'Accept': 'application/json',
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(confirmBody)
                                            });
                                            const raw = await resp.text();
                                            console.log('[Checkout][confirm] status:', resp.status);
                                            console.log('[Checkout][confirm] response:', raw);
                                            const parsed = (() => { try { return JSON.parse(raw); } catch { return null; } })();
                                            if (!resp.ok) {
                                                const msg = parsed?.message || 'Xác nhận tiền mặt thất bại';
                                                throw new Error(msg);
                                            }
                                            navigate('/sales/paid-success');
                                        } catch (e) {
                                            alert(e.message || 'Lỗi xác nhận thanh toán');
                                        }
                                    }}
                                >
                                    Đã nhận tiền mặt
                                </Button>
                            </Stack>
                        </Stack>
                    ) : (
                        <Stack alignItems="center" spacing={2}>
                            <Box component="img" src={qrUrl} alt="QR" sx={{ width: 260, height: 260, borderRadius: 2, border: `2px solid ${COLORS.ERROR[100]}` }} />
                            <Typography>Mã hóa đơn: <b>{invoiceId}</b></Typography>
                            <Typography>Hình thức: <b>{method}</b></Typography>
                            <Typography>Tổng tiền: <b style={{ color: COLORS.ERROR[600] }}>{total.toLocaleString('vi-VN')} ₫</b></Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <Button variant="outlined" color="error" onClick={() => window.history.back()}>Quay lại</Button>
                                <Button variant="contained" color="error" onClick={() => navigate('/sales/paid-success')}>Đã quét và thanh toán</Button>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
            </Card>
            </Container>
        </Box>
    );
};

export default CheckoutPage;


