import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Button, Stack, Container } from '@mui/material';
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
                    navigate('/');
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
    }, [navigate]);

    const cards = [
        { label: 'Sản phẩm', value: stats.products, icon: <ShoppingCart />, color: COLORS.INFO[500], path: '/sales/sales' },
        { label: 'Hóa đơn', value: stats.invoices, icon: <ReceiptLong />, color: COLORS.WARNING[600], path: '/sales/invoices' },
        { label: 'Khách hàng', value: stats.customers, icon: <People />, color: COLORS.SECONDARY[600], path: '/sales/sales' },
        { label: 'Doanh thu hôm nay', value: stats.revenueToday.toLocaleString('vi-VN') + ' ₫', icon: <TrendingUp />, color: COLORS.ERROR[600], path: '/sales/invoices' }
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Bảng điều khiển bán hàng</Typography>
                <Chip color="error" label="Sales" sx={{ fontWeight: 700 }} />
            </Stack>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            )}

            <Grid container spacing={2}>
                {cards.map((c) => (
                    <Grid item xs={12} sm={6} md={3} key={c.label}>
                        <Card sx={{
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
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>{c.label}</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{c.value}</Typography>
                                    </Box>
                                    <Box sx={{ color: c.color }}>{c.icon}</Box>
                                </Stack>
                                <Button onClick={() => navigate(c.path)} sx={{ mt: 2, borderRadius: 2 }} variant="contained" color="error">Xem chi tiết</Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            </Container>
        </Box>
    );
};

export default DashboardPage;


