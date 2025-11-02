import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Stack, Divider, Button, Chip } from '@mui/material';
import { ShoppingCartCheckout } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const ProductConfirmPage = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('sales_cart');
            setItems(saved ? JSON.parse(saved) : []);
        } catch {
            setItems([]);
        }
    }, []);

    const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

    return (
        <Box sx={{ py: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
            <Container maxWidth="md">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Xác nhận sản phẩm</Typography>
                    <Chip color="error" label={`${items.length} mặt hàng`} />
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}`, backgroundColor: COLORS.BACKGROUND.PAPER }}>
                    <CardContent>
                        {items.length === 0 ? (
                            <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>Chưa có sản phẩm nào. Vui lòng quay lại trang bán hàng để thêm sản phẩm.</Typography>
                        ) : (
                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {items.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontWeight: 600 }}>{item.name} × {item.quantity}</Typography>
                                        <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</Typography>
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
                            <Button variant="outlined" color="error" onClick={() => navigate('/sales/sales')}>Quay lại chỉnh sửa</Button>
                            <Button variant="contained" color="error" startIcon={<ShoppingCartCheckout />} disabled={!items.length} onClick={() => navigate('/sales/cart')}>Xác nhận & sang giỏ hàng</Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default ProductConfirmPage;


