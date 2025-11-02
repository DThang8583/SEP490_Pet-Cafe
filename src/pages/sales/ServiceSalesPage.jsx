import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, TextField, Button, Stack, InputAdornment, Badge } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowBack } from '@mui/icons-material';

const ServiceSalesPage = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState('');
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                // Official services API
                const resp = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/services');
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setServices(list);
            } catch (e) {
                setError(e.message || 'Không thể tải dịch vụ');
            }
        };
        load();
    }, []);

    useEffect(() => {
        const refreshCount = () => {
            try {
                const saved = localStorage.getItem('sales_cart');
                const arr = saved ? JSON.parse(saved) : [];
                setCartCount(Array.isArray(arr) ? arr.length : 0);
            } catch {
                setCartCount(0);
            }
        };
        refreshCount();
        window.addEventListener('cartUpdated', refreshCount);
        return () => window.removeEventListener('cartUpdated', refreshCount);
    }, []);

    const filtered = useMemo(() => services.filter(s => (s.name || '').toLowerCase().includes(keyword.toLowerCase())), [services, keyword]);

    const setQty = (id, val) => {
        const n = Math.max(1, parseInt(val || '1', 10));
        setQuantities(prev => ({ ...prev, [id]: n }));
    };

    const notifyCartChanged = (next) => {
        try { localStorage.setItem('sales_cart', JSON.stringify(next)); } catch {}
        try { window.dispatchEvent(new Event('cartUpdated')); } catch {}
    };

    const addServiceToCart = (svc) => {
        const quantity = Math.max(1, quantities[svc.id] || 1);
        const item = { id: `svc-${svc.id}`, name: svc.name, price: svc.base_price || 0, quantity };
        try {
            const saved = localStorage.getItem('sales_cart');
            const current = saved ? JSON.parse(saved) : [];
            const idx = current.findIndex(i => i.id === item.id);
            let next;
            if (idx >= 0) {
                next = [...current];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            } else {
                next = [...current, item];
            }
            notifyCartChanged(next);
            navigate('/sales/cart');
        } catch {
            notifyCartChanged([item]);
            navigate('/sales/cart');
        }
    };

    return (
        <Box sx={{ py: 3, backgroundColor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh' }}>
            <Container maxWidth="xl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} color="error" variant="text">Quay lại</Button>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Bán dịch vụ</Typography>
                    </Stack>
                    <Badge color="error" badgeContent={cartCount} showZero>
                        <Button startIcon={<ShoppingCart />} variant="contained" color="error" onClick={() => navigate('/sales/cart')}>
                            Giỏ hàng
                        </Button>
                    </Badge>
                </Stack>

                <TextField fullWidth placeholder="Tìm dịch vụ..." value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ mb: 2 }} />

                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

                <Grid container spacing={2}>
                    {filtered.map(s => (
                        <Grid item xs={12} md={6} lg={4} key={s.id}>
                            <Card sx={{ borderRadius: 3, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {s.image_url && (
                                    <Box component="img" src={s.image_url} alt={s.name} sx={{ width: '100%', height: 160, objectFit: 'cover' }} />
                                )}
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{s.name}</Typography>
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1.5 }}>
                                        {s.description || 'Dịch vụ tại Pet Cafe'}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 1 }}>{(s.base_price || 0).toLocaleString('vi-VN')} ₫</Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                        <TextField
                                            type="number"
                                            label="Số lượng"
                                            value={quantities[s.id] || 1}
                                            onChange={(e) => setQty(s.id, e.target.value)}
                                            InputProps={{ inputProps: { min: 0 }, endAdornment: <InputAdornment position="end">lần</InputAdornment> }}
                                            sx={{ width: { xs: '100%', sm: 160 } }}
                                        />
                                        <Button variant="contained" color="error" onClick={() => addServiceToCart(s)}>
                                            Thêm vào giỏ
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default ServiceSalesPage;



