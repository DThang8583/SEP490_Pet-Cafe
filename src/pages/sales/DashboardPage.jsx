import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Stack, Container, Grid } from '@mui/material';
import { ShoppingCart, ReceiptLong, TrendingUp, DesignServices, CheckCircle } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        products: 0,
        invoices: 0,
        totalServicesSold: 0,
        totalProductsSold: 0,
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
                
                const token = localStorage.getItem('authToken');
                
                // Gọi API orders với limit=999 để lấy tất cả orders
                const ordersResponse = await fetch('https://petcafes.azurewebsites.net/api/orders?limit=999', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });
                
                let revenueToday = 0;
                let totalServicesSold = 0;
                let totalProductsSold = 0;
                
                if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json();
                    const orders = Array.isArray(ordersData?.data) ? ordersData.data : [];
                    
                    // Lọc các order có status PAID và tính tổng final_amount
                    const paidOrders = orders.filter(order => order.status === 'PAID');
                    revenueToday = paidOrders.reduce((sum, order) => sum + (order.final_amount || 0), 0);
                    
                    // Đếm số dịch vụ đã bán (order có service_order không null và status PAID - đã thanh toán)
                    totalServicesSold = orders.filter(order => 
                        order.service_order !== null && 
                        order.service_order !== undefined && 
                        order.status === 'PAID'
                    ).length;
                    
                    // Đếm số sản phẩm đã bán (order có product_order không null)
                    totalProductsSold = orders.filter(order => order.product_order !== null && order.product_order !== undefined).length;
                }
                
                // Gọi API products để lấy tổng số sản phẩm
                const productsResponse = await fetch('https://petcafes.azurewebsites.net/api/products', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });
                
                let totalProducts = 0;
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    // Lấy tổng số sản phẩm từ pagination hoặc đếm số phần tử trong data
                    totalProducts = productsData?.pagination?.total_items_count || 
                                   (Array.isArray(productsData?.data) ? productsData.data.length : 0);
                }
                
                const [invoicesRes] = await Promise.all([
                    salesApi.getInvoices()
                ]);
                const invoices = invoicesRes?.data || [];
                
                setStats({
                    products: totalProducts,
                    invoices: invoices.length,
                    totalServicesSold: totalServicesSold,
                    totalProductsSold: totalProductsSold,
                    revenueToday: revenueToday
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
        { label: 'Tổng số dịch vụ đã bán', value: stats.totalServicesSold, icon: <DesignServices />, color: COLORS.SECONDARY[600], path: '/sales/service-booking-confirm' },
        { label: 'Tổng số sản phẩm đã bán', value: stats.totalProductsSold, icon: <CheckCircle />, color: COLORS.WARNING[600], path: '/sales/product-sales-confirm' },
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
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

            {/* Biểu đồ */}
            <Grid container spacing={3}>
                {/* Biểu đồ tròn - So sánh Dịch vụ và Sản phẩm đã bán */}
                <Grid item xs={12} md={6}>
                    <Card sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${COLORS.SECONDARY[200]}`,
                        boxShadow: `0 10px 28px ${COLORS.SECONDARY[100]}`,
                    }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: COLORS.TEXT.PRIMARY }}>
                                So sánh Dịch vụ và Sản phẩm đã bán
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Dịch vụ đã bán', value: stats.totalServicesSold },
                                            { name: 'Sản phẩm đã bán', value: stats.totalProductsSold }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        <Cell fill={COLORS.SECONDARY[600]} />
                                        <Cell fill={COLORS.WARNING[600]} />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Biểu đồ cột - Chi tiết Dịch vụ và Sản phẩm đã bán */}
                <Grid item xs={12} md={6}>
                    <Card sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${COLORS.INFO[200]}`,
                        boxShadow: `0 10px 28px ${COLORS.INFO[100]}`,
                    }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: COLORS.TEXT.PRIMARY }}>
                                Chi tiết Dịch vụ và Sản phẩm đã bán
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={[
                                        { name: 'Dịch vụ đã bán', value: stats.totalServicesSold },
                                        { name: 'Sản phẩm đã bán', value: stats.totalProductsSold }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar 
                                        dataKey="value" 
                                        fill={COLORS.INFO[500]}
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            </Container>
        </Box>
    );
};

export default DashboardPage;


