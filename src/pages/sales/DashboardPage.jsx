import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Stack, Container } from '@mui/material';
import { ShoppingCart, ReceiptLong, People, TrendingUp } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        products: 0,
        invoices: 0,
        customers: 0,
        revenueToday: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') {
                    navigate('/', { replace: true });
                    return;
                }
                const [productsRes, invoicesRes, customersRes] = await Promise.all([
                    salesApi.getProducts(),
                    salesApi.getInvoices(),
                    salesApi.getCustomers()
                ]);
                const products = productsRes?.data || [];
                const invoices = invoicesRes?.data || [];
                const customers = customersRes?.data || [];
                const revenue = invoices.reduce((s, i) => s + (i.total || 0), 0);
                setStats({
                    products: products.length,
                    invoices: invoices.length,
                    customers: customers.length,
                    revenueToday: revenue
                });
            } catch (e) {
                setError(e.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cards = [
        { label: 'Sản phẩm', value: stats.products, icon: <ShoppingCart />, color: COLORS.INFO[500], path: '/sales/sales' },
        { label: 'Khách hàng', value: stats.customers, icon: <People />, color: COLORS.SECONDARY[600], path: '/sales/sales' },
        { label: 'Doanh thu hôm nay', value: stats.revenueToday.toLocaleString('vi-VN') + ' ₫', icon: <TrendingUp />, color: COLORS.ERROR[600], path: '/sales/sales' }
    ];

    return (
        <Box sx={{
            py: 3,
            minHeight: '100vh',
            background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                         radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                         radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', color: COLORS.ERROR[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Bảng điều khiển bán hàng</Typography>
                <Chip color="error" label="Sales" sx={{ fontWeight: 700 }} />
            </Stack>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {cards.map((c) => (
                    <Card key={c.label} sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${c.color}30`,
                        boxShadow: `0 10px 28px ${c.color}22`,
                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 16px 36px ${c.color}33` }
                    }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 }}>{c.label}</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.75rem', mt: 0.5, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{c.value}</Typography>
                                </Box>
                                <Box sx={{ color: c.color }}>{c.icon}</Box>
                            </Stack>
                            <Button onClick={() => navigate(c.path)} sx={{ mt: 2, borderRadius: 2 }} variant="contained" color="error">Xem chi tiết</Button>
                        </CardContent>
                    </Card>
                ))}
            </Box>
            </Container>
        </Box>
    );
};

export default DashboardPage;


