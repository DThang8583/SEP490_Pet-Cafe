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
        } catch {
            notifyCartChanged([item]);
        }
        // Theo yêu cầu: không tự chuyển sang trang giỏ hàng
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

                <Box sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                        xs: 'repeat(1, 1fr)',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(4, 1fr)'
                    }
                }}>
                    {filtered.map(s => (
                        <Box key={s.id} sx={{ height: '100%' }}>
                            <Card sx={{
                                borderRadius: 4,
                                height: '100%',
                                overflow: 'hidden',
                                boxShadow: 6,
                                transition: 'transform 120ms ease, box-shadow 120ms ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 },
                                display: 'flex', flexDirection: 'column'
                            }}>
                                {s.image_url && (
                                    <Box component="img" src={s.image_url} alt={s.name} sx={{ width: '100%', height: 180, objectFit: 'cover', flexShrink: 0 }} />
                                )}
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48 }}>{s.name}</Typography>
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                                        {s.description || 'Dịch vụ tại Pet Cafe'}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 1 }}>{(s.base_price || 0).toLocaleString('vi-VN')} ₫</Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
                                        <TextField
                                            type="number"
                                            label="Số lượng"
                                            value={quantities[s.id] || 1}
                                            onChange={(e) => setQty(s.id, e.target.value)}
                                            InputProps={{ inputProps: { min: 1 }, endAdornment: <InputAdornment position="end">lần</InputAdornment> }}
                                            size="small"
                                            sx={{ width: { xs: '100%', sm: 140 } }}
                                        />
                                        <Button variant="contained" color="error" size="small" onClick={() => addServiceToCart(s)} sx={{ borderRadius: 2, alignSelf: 'flex-start' }}>
                                            Thêm vào giỏ
                                        </Button>
                                    </Stack>
                                    <Box sx={{ flexGrow: 1 }} />
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
};

export default ServiceSalesPage;



