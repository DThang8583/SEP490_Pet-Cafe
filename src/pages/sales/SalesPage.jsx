import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, TextField, Button, Stack, Chip, FormControlLabel, Checkbox, MenuItem, Select, InputLabel, FormControl, IconButton, Divider, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Container, InputAdornment } from '@mui/material';
import { ShoppingCart, Add, Remove, Delete, Pets, LocalCafe, Fastfood, ShoppingBag } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';

const SalesPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [cartInitialized, setCartInitialized] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [dineIn, setDineIn] = useState(false);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [qrOpen, setQrOpen] = useState(false);
    const [qrData, setQrData] = useState({ url: '', invoiceId: '', total: 0 });
    const [quantities, setQuantities] = useState({});
    const [addOpen, setAddOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState(1);
    const [addNote, setAddNote] = useState('');

    useEffect(() => {
        // Load cart from localStorage
        try {
            const saved = localStorage.getItem('sales_cart');
            if (saved) setCart(JSON.parse(saved));
            setCartInitialized(true);
        } catch {}

        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                // Fetch official products from backend API with auth token
                const token = localStorage.getItem('authToken');
                const prodResp = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/products?order_by=%7B%22order_column%22%3A%22string%22%2C%22order_dir%22%3A%22string%22%7D', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });
                if (!prodResp.ok) throw new Error('Không thể tải danh sách sản phẩm');
                const prodJson = await prodResp.json();
                const apiProducts = Array.isArray(prodJson?.data)
                    ? prodJson.data.filter(p => p?.is_active && !p?.is_deleted)
                    : [];
                setProducts(apiProducts);
                // Load official product categories for filtering UI
                try {
                    const token2 = localStorage.getItem('authToken');
                    const resp = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/product-categories', {
                        headers: {
                            'Authorization': token2 ? `Bearer ${token2}` : '',
                            'Accept': 'application/json'
                        }
                    });
                    const json = await resp.json();
                    const apiCats = Array.isArray(json?.data) ? json.data.filter(c => c?.is_active && !c?.is_deleted) : [];
                    setCategories(apiCats);
                } catch (err) {
                    // Non-blocking: keep categories empty if API fails
                    console.warn('[SalesPage] Cannot load categories from official API:', err?.message || err);
                }
            } catch (e) {
                setError(e.message || 'Không thể tải sản phẩm');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Persist cart after initial load, avoid wiping existing cart
    useEffect(() => {
        if (!cartInitialized) return;
        try { localStorage.setItem('sales_cart', JSON.stringify(cart)); } catch {}
    }, [cart, cartInitialized]);

    const filtered = useMemo(() => {
        const byText = products.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
        if (category === 'all') return byText;
        // If category is one of static types ('food' | 'drink')
        if (category === 'food' || category === 'drink') {
            return byText.filter(p => {
                const catStr = typeof p.category === 'string'
                    ? (p.category || '').toLowerCase()
                    : (p.category?.name || '').toLowerCase();
                return catStr === category;
            });
        }
        // Otherwise, category is an official category id: match by id or fallback by name heuristic
        const selected = categories.find(c => c.id === category);
        if (!selected) return byText;
        const catName = (selected.name || '').toLowerCase();
        const fallbackType = catName.includes('uống') ? 'drink' : (catName.includes('ăn') ? 'food' : null);
        return byText.filter(p => {
            const pid = p.category_id || p.category?.id;
            if (pid && pid === selected.id) return true;
            if (fallbackType) {
                const catStr = typeof p.category === 'string'
                    ? (p.category || '').toLowerCase()
                    : (p.category?.name || '').toLowerCase();
                return catStr === fallbackType;
            }
            return false;
        });
    }, [products, keyword, category]);
    const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

    const getProductImage = (p) => {
        if (p?.image_url) return p.image_url;
        if (p?.image) return p.image;
        const name = (p?.name || '').toLowerCase();
        const cat = typeof p?.category === 'string'
            ? (p?.category || '').toLowerCase()
            : (p?.category?.name || '').toLowerCase();
        // Drinks
        if (name.includes('latte')) return 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop';
        if (name.includes('americano')) return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop';
        if (name.includes('cappuccino')) return 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop';
        if (name.includes('trà sữa') || name.includes('milk tea')) return 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop';
        if (name.includes('trà đào') || name.includes('trà') && name.includes('đào')) return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop';
        if (name.includes('nước cam') || name.includes('cam')) return 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop';
        if (name.includes('coca') || name.includes('cola') || name.includes('soda')) return 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop';
        // Food (human)
        if (name.includes('bánh mì')) return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop';
        if (name.includes('croissant')) return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop';
        if (name.includes('sữa chua')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop';
        // Pet food
        if (name.includes('pate') || name.includes('snack')) return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop';
        if (cat === 'drink') return 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop';
        if (cat === 'food') return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop';
        // Fallback paw image
        return 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&auto=format&fit=crop';
    };

    const notifyCartChanged = (next) => {
        try {
            localStorage.setItem('sales_cart', JSON.stringify(next));
        } catch {}
        try {
            window.dispatchEvent(new Event('cartUpdated'));
        } catch {}
    };

    const setQty = (id, val) => {
        const n = Math.max(1, parseInt(val || '1', 10));
        setQuantities(prev => ({ ...prev, [id]: n }));
    };

    const addToCart = (p) => {
        setSelectedProduct(p);
        setAddQty(1);
        setAddNote('');
        setAddOpen(true);
    };

    const confirmAddToCart = async () => {
        if (!selectedProduct) return;
        const qty = Math.max(1, parseInt(addQty || 1, 10));
        setCart((prev) => {
            const idx = prev.findIndex(i => i.id === selectedProduct.id);
            let next;
            if (idx >= 0) {
                next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
            } else {
                next = [...prev, { id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: qty }];
            }
            notifyCartChanged(next);
            return next;
        });
        setAddOpen(false);
        setSelectedProduct(null);
    };

    const increaseQty = (id) => {
        setCart((prev) => {
            const next = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
            notifyCartChanged(next);
            return next;
        });
    };

    const decreaseQty = (id) => {
        setCart((prev) => {
            const next = prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i);
            notifyCartChanged(next);
            return next;
        });
    };

    const removeItem = (id) => {
        setCart((prev) => {
            const next = prev.filter(i => i.id !== id);
            notifyCartChanged(next);
            return next;
        });
    };

    const checkout = async () => {
        if (!cart.length) return;
        const hasOnlyDrinks = cart.every(i => {
            const prod = products.find(p => p.id === i.id);
            if (!prod) return false;
            const type = typeof prod.category === 'string'
                ? (prod.category || '').toLowerCase()
                : (prod.category?.name || '').toLowerCase();
            if (type) return type === 'drink';
            const pid = prod.category_id || prod.category?.id;
            if (!pid) return false;
            const cat = categories.find(c => c.id === pid);
            const cname = (cat?.name || '').toLowerCase();
            return cname.includes('uống');
        });
        if (!hasOnlyDrinks) {
            alert('Nhân viên sales chỉ xác nhận đồ uống. Vui lòng chỉ chọn đồ uống.');
            return;
        }
        try {
            const res = await salesApi.createOrder({ items: cart, paymentMethod, paid: true, dineIn });
            // Navigate to checkout page with invoice info
            const invoice = res?.data?.invoice;
            const order = res?.data?.order;
            const firstProductId = (cart && cart.length > 0) ? cart[0].id : '';
            const search = new URLSearchParams({
                invoiceId: invoice?.id || '',
                total: String(invoice?.total || 0),
                method: paymentMethod,
                // Per requirement: send product id as id for confirm
                orderId: firstProductId || order?.id || ''
            }).toString();
            window.location.href = `/sales/checkout?${search}`;
        } catch (e) {
            alert(e.message || 'Lỗi tạo đơn hàng');
        }
    };

    return (
        <Box sx={{
            py: { xs: 2, md: 3 },
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
            background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                         radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                         radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            {/* Decorative pet-friendly emojis */}
            <Box aria-hidden sx={{ position: 'absolute', right: 12, top: 8, fontSize: 28, opacity: 0.25 }}>🐾</Box>
            <Box aria-hidden sx={{ position: 'absolute', left: 10, bottom: 12, fontSize: 28, opacity: 0.2 }}>🐶</Box>
            <Box aria-hidden sx={{ position: 'absolute', right: 24, bottom: 18, fontSize: 26, opacity: 0.2 }}>🐱</Box>
            <Container maxWidth="xl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Pets sx={{ color: COLORS.ERROR[500] }} />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Bán hàng thân thiện</Typography>
                    </Stack>
                    <Chip color="error" label="Sản phẩm hôm nay" sx={{ fontWeight: 700, borderRadius: 2 }} />
                </Stack>

            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                        <TextField fullWidth placeholder="Tìm đồ uống, đồ ăn..." value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: 'rgba(255,255,255,0.9)'
                            }
                        }} />
                        <Badge color="error" badgeContent={cart.length} showZero>
                            <Button startIcon={<ShoppingCart />} variant="contained" color="error" sx={{ height: 56, borderRadius: 3, boxShadow: 3 }} onClick={() => navigate('/sales/cart')}>
                                Giỏ hàng
                            </Button>
                        </Badge>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                        <Chip label="Tất cả" icon={<Pets />} variant={category === 'all' ? 'filled' : 'outlined'} color={category === 'all' ? 'error' : 'default'} onClick={() => setCategory('all')} clickable sx={{ borderRadius: 2 }} />
                        {/* Static fallbacks for mock products */}
                        <Chip label="Đồ ăn" icon={<Fastfood />} variant={category === 'food' ? 'filled' : 'outlined'} color={category === 'food' ? 'error' : 'default'} onClick={() => setCategory('food')} clickable sx={{ borderRadius: 2 }} />
                        <Chip label="Đồ uống" icon={<LocalCafe />} variant={category === 'drink' ? 'filled' : 'outlined'} color={category === 'drink' ? 'error' : 'default'} onClick={() => setCategory('drink')} clickable sx={{ borderRadius: 2 }} />
                        {/* Dynamic categories from official API */}
                        {categories.map(c => {
                            const name = (c.name || '').toLowerCase();
                            const isDrink = name.includes('uống') || name.includes('giải khát');
                            const isFood = name.includes('ăn');
                            const icon = isDrink ? <LocalCafe /> : (isFood ? <Fastfood /> : <Pets />);
                            return (
                                <Chip key={c.id} label={c.name} icon={icon} variant={category === c.id ? 'filled' : 'outlined'} color={category === c.id ? 'error' : 'default'} onClick={() => setCategory(c.id)} clickable sx={{ borderRadius: 2 }} />
                            );
                        })}
                    </Stack>

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
                        {filtered.map((p) => (
                            <Box key={p.id} sx={{ height: '100%' }}>
                                <Card sx={{ borderRadius: 4, height: '100%', overflow: 'hidden', boxShadow: 6, transition: 'transform 120ms ease, box-shadow 120ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 }, display: 'flex', flexDirection: 'column' }}>
                                    <Box component="img" src={getProductImage(p)} alt={p.name} sx={{ width: '100%', height: 180, objectFit: 'cover', flexShrink: 0 }} />
                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48 }}>{p.name}</Typography>
                                        <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>{p.description}</Typography>
                                        <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 1 }}>{p.price.toLocaleString('vi-VN')} ₫</Typography>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
                                            <Button variant="contained" color="error" onClick={() => addToCart(p)} size="small" startIcon={<ShoppingBag />} sx={{ borderRadius: 2, alignSelf: 'flex-start' }}>
                                                Thêm vào giỏ
                                            </Button>
                                        </Stack>
                                        <Box sx={{ flexGrow: 1 }} />
                                        <Button variant="outlined" color="error" onClick={() => addToCart(p)} size="small" sx={{ display: 'none' }}>
                                            Thêm vào giỏ
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Grid>
                {/* Cart sidebar removed; use dedicated CartPage */}
            </Grid>

            </Container>

            <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800 }}>Quét mã QR để thanh toán</DialogTitle>
                <DialogContent>
                    <Stack alignItems="center" spacing={2} sx={{ mt: 1 }}>
                        {qrData.url && (
                            <Box component="img" src={qrData.url} alt="QR" sx={{ width: 220, height: 220, borderRadius: 2, border: `2px solid ${COLORS.ERROR[100]}` }} />
                        )}
                        <Typography>Mã hóa đơn: <b>{qrData.invoiceId}</b></Typography>
                        <Typography>Tổng tiền: <b style={{ color: COLORS.ERROR[600] }}>{qrData.total.toLocaleString('vi-VN')} ₫</b></Typography>
                        <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 14 }}>Sau khi khách thanh toán, vui lòng xác nhận trên hệ thống.</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800 }}>Thêm vào giỏ</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>{selectedProduct?.name || ''}</Typography>
                        <TextField
                            type="number"
                            label="Số lượng"
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            InputProps={{ inputProps: { min: 1 }, endAdornment: <InputAdornment position="end">x</InputAdornment> }}
                            size="small"
                        />
                        <TextField
                            label="Ghi chú (tùy chọn)"
                            value={addNote}
                            onChange={(e) => setAddNote(e.target.value)}
                            size="small"
                            multiline
                            minRows={2}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={confirmAddToCart}>Thêm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalesPage;


