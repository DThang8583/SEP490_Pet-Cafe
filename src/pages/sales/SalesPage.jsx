import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Chip, FormControlLabel, Checkbox, MenuItem, Select, InputLabel, FormControl, IconButton, Divider, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Container, InputAdornment } from '@mui/material';
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
    const [addQty, setAddQty] = useState('1'); // cho phép nhập rỗng tạm thời
    const [addNote, setAddNote] = useState('');

    useEffect(() => {
        // Load cart from localStorage
        try {
            const saved = localStorage.getItem('sales_cart');
            if (saved) setCart(JSON.parse(saved));
            setCartInitialized(true);
        } catch { }

        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                // Fetch official products from backend API with auth token
                const token = localStorage.getItem('authToken');
                const prodResp = await fetch('https://petcafes.azurewebsites.net/api/products?order_by=%7B%22order_column%22%3A%22string%22%2C%22order_dir%22%3A%22string%22%7D', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });
                if (!prodResp.ok) throw new Error('Không thể tải danh sách sản phẩm');
                const prodJson = await prodResp.json();
                // Chỉ filter is_deleted, không filter is_active để hiển thị tất cả sản phẩm (kể cả inactive)
                const apiProducts = Array.isArray(prodJson?.data)
                    ? prodJson.data.filter(p => !p?.is_deleted)
                    : [];
                setProducts(apiProducts);
                // Load official product categories for filtering UI
                try {
                    const token2 = localStorage.getItem('authToken');
                    const resp = await fetch('https://petcafes.azurewebsites.net/api/product-categories', {
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
        try { localStorage.setItem('sales_cart', JSON.stringify(cart)); } catch { }
    }, [cart, cartInitialized]);

    const filtered = useMemo(() => {
        const byText = products.filter(p => (p.name || '').toLowerCase().includes(keyword.toLowerCase()));
        if (category === 'all') return byText;

        // Filter by category ID from API
        const selected = categories.find(c => c.id === category);
        if (!selected) return byText;

        return byText.filter(p => {
            const pid = p.category_id || p.category?.id;
            return pid && pid === selected.id;
        });
    }, [products, keyword, category, categories]);
    const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

    // Helper: tính số lượng trong giỏ của 1 sản phẩm
    const getInCartQuantity = (productId) => {
        const item = cart.find((i) => i.id === productId);
        return item ? item.quantity : 0;
    };

    // Helper: lấy hạn mức bán trong ngày (Manager cấu hình) từ object sản phẩm
    const getDailyLimit = (p) => {
        // Ưu tiên các field có thể đến từ API, fallback về null nếu không có
        return (
            // Manager dùng stock_quantity làm \"Số lượng bán trong ngày\"
            (typeof p?.stock_quantity === 'number' ? p.stock_quantity : null) ??
            p?.daily_limit ??
            p?.dailyQuantity ??
            p?.daily_quantity ??
            p?.max_daily_quantity ??
            p?.limit_per_day ??
            null
        );
    };

    // Helper: đã bán trong ngày (nếu backend có cung cấp)
    const getSoldToday = (p) => {
        return (
            p?.sold_today ??
            p?.today_sold ??
            p?.soldQuantityToday ??
            0
        );
    };

    // Thông tin hạn mức cho sản phẩm đang mở dialog \"Thêm vào giỏ\"
    const selectedDailyLimit = selectedProduct ? getDailyLimit(selectedProduct) : null;
    const selectedSoldToday = selectedProduct ? getSoldToday(selectedProduct) : 0;
    const selectedInCart = selectedProduct ? getInCartQuantity(selectedProduct.id) : 0;
    const selectedRemainingBase =
        selectedDailyLimit != null
            ? Math.max(selectedDailyLimit - selectedSoldToday - selectedInCart, 0)
            : null;

    const getProductImage = (p) => {
        // Ưu tiên image_url từ API
        if (p?.image_url) return p.image_url;
        // Thứ hai: thumbnails từ API
        if (p?.thumbnails && Array.isArray(p.thumbnails) && p.thumbnails.length > 0) {
            return p.thumbnails[0];
        }
        // Thứ ba: image field (nếu có)
        if (p?.image) return p.image;
        // Không có hình ảnh - trả về null để hiển thị placeholder
        return null;
    };

    const notifyCartChanged = (next) => {
        try {
            localStorage.setItem('sales_cart', JSON.stringify(next));
        } catch { }
        try {
            window.dispatchEvent(new Event('cartUpdated'));
        } catch { }
    };

    const setQty = (id, val) => {
        const n = Math.max(1, parseInt(val || '1', 10));
        setQuantities(prev => ({ ...prev, [id]: n }));
    };

    const addToCart = (p) => {
        const dailyLimit = getDailyLimit(p);
        const soldToday = getSoldToday(p);
        const inCart = getInCartQuantity(p.id);

        if (dailyLimit != null) {
            const remaining = dailyLimit - soldToday - inCart;
            if (remaining <= 0) {
                alert('Bạn đã đạt tới số lượng bán trong ngày cho sản phẩm này. Không thể thêm thêm vào giỏ.');
                return;
            }
        }

        setSelectedProduct(p);
        setAddQty('1');
        setAddNote('');
        setAddOpen(true);
    };

    const confirmAddToCart = async () => {
        if (!selectedProduct) return;
        const qty = Math.max(1, parseInt(addQty || '1', 10));

        const dailyLimit = getDailyLimit(selectedProduct);
        const soldToday = getSoldToday(selectedProduct);
        const inCart = getInCartQuantity(selectedProduct.id);

        if (dailyLimit != null) {
            const remaining = dailyLimit - soldToday - inCart;
            if (remaining <= 0) {
                alert('Bạn đã đạt tới số lượng bán trong ngày cho sản phẩm này. Không thể thêm thêm vào giỏ.');
                return;
            }
            if (qty > remaining) {
                alert(`Số lượng tối đa có thể thêm cho sản phẩm này trong hôm nay là ${remaining}. Vui lòng giảm số lượng.`);
                return;
            }
        }

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
        const product = products.find((p) => p.id === id);
        if (product) {
            const dailyLimit = getDailyLimit(product);
            const soldToday = getSoldToday(product);
            const inCart = getInCartQuantity(id);
            if (dailyLimit != null) {
                const remaining = dailyLimit - soldToday - inCart;
                if (remaining <= 0) {
                    alert('Không thể tăng thêm số lượng. Đã đạt tới số lượng bán trong ngày cho sản phẩm này.');
                    return;
                }
            }
        }

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
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', color: COLORS.ERROR[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Bán hàng</Typography>
                    </Stack>
                    <Chip color="error" label="Sản phẩm hôm nay" sx={{ fontWeight: 700, borderRadius: 2 }} />
                </Stack>

                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

                <Box sx={{ width: '100%', maxWidth: '100%' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            placeholder="Tìm đồ uống, đồ ăn..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    backgroundColor: 'rgba(255,255,255,0.9)'
                                },
                                maxWidth: { xs: '100%', sm: '600px' }
                            }}
                        />
                        <Badge color="error" badgeContent={cart.length} showZero>
                            <Button
                                startIcon={<ShoppingCart />}
                                variant="contained"
                                color="error"
                                sx={{
                                    height: 56,
                                    borderRadius: 3,
                                    boxShadow: 3,
                                    minWidth: { xs: '100%', sm: '160px' }
                                }}
                                onClick={() => navigate('/sales/cart')}
                            >
                                GIỎ HÀNG
                            </Button>
                        </Badge>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            mb: 3,
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'flex-start', sm: 'center' },
                            gap: 1
                        }}
                    >
                        <Chip
                            label="Tất cả"
                            icon={<Pets />}
                            variant={category === 'all' ? 'filled' : 'outlined'}
                            color={category === 'all' ? 'error' : 'default'}
                            onClick={() => setCategory('all')}
                            clickable
                            sx={{ borderRadius: 2 }}
                        />
                        {categories.map(c => {
                            const name = (c.name || '').toLowerCase();
                            const isDrink = name.includes('uống') || name.includes('giải khát');
                            const isFood = name.includes('ăn');
                            const icon = isDrink ? <LocalCafe /> : (isFood ? <Fastfood /> : <Pets />);
                            return (
                                <Chip
                                    key={c.id}
                                    label={c.name}
                                    icon={icon}
                                    variant={category === c.id ? 'filled' : 'outlined'}
                                    color={category === c.id ? 'error' : 'default'}
                                    onClick={() => setCategory(c.id)}
                                    clickable
                                    sx={{ borderRadius: 2 }}
                                />
                            );
                        })}
                    </Stack>

                    <Box sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                            xl: 'repeat(5, 1fr)'
                        },
                        justifyContent: 'center',
                        width: '100%',
                        mx: 'auto'
                    }}>
                        {filtered.map((p) => {
                            const dailyLimit = getDailyLimit(p);
                            const soldToday = getSoldToday(p);
                            const inCart = getInCartQuantity(p.id);
                            const remaining = dailyLimit != null ? Math.max(dailyLimit - soldToday - inCart, 0) : null;

                            return (
                                <Box key={p.id} sx={{ height: '100%' }}>
                                    <Card sx={{ borderRadius: 4, height: '100%', overflow: 'hidden', boxShadow: 6, transition: 'transform 120ms ease, box-shadow 120ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 }, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ width: '100%', height: 180, position: 'relative', flexShrink: 0, backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
                                            {getProductImage(p) ? (
                                                <Box component="img" src={getProductImage(p)} alt={p.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Box sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: `linear-gradient(135deg, ${COLORS.ERROR[100]} 0%, ${COLORS.SECONDARY[100]} 100%)`
                                                }}>
                                                    <Pets sx={{ fontSize: 64, color: COLORS.ERROR[400], opacity: 0.6 }} />
                                                </Box>
                                            )}
                                        </Box>
                                        <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{p.name}</Typography>
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.9375rem', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40, lineHeight: 1.5, fontWeight: 400 }}>{p.description}</Typography>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: COLORS.ERROR[600], mb: 1, letterSpacing: '-0.01em' }}>{p.price.toLocaleString('vi-VN')} ₫</Typography>
                                            {dailyLimit != null && (
                                                <Typography sx={{ fontSize: '0.85rem', color: COLORS.TEXT.SECONDARY, mb: 0.5 }}>
                                                    Số lượng bán trong ngày: <strong>{dailyLimit}</strong>{soldToday ? ` • Đã bán: ${soldToday}` : ''}{inCart ? ` • Trong giỏ: ${inCart}` : ''}{remaining != null ? ` • Còn lại: ${remaining}` : ''}
                                                </Typography>
                                            )}
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => addToCart(p)}
                                                    size="small"
                                                    startIcon={<ShoppingBag />}
                                                    sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                                                    disabled={dailyLimit != null && remaining <= 0}
                                                >
                                                    {dailyLimit != null && remaining <= 0 ? 'Hết lượt trong ngày' : 'Thêm vào giỏ'}
                                                </Button>
                                            </Stack>
                                            <Box sx={{ flexGrow: 1 }} />
                                            <Button variant="outlined" color="error" onClick={() => addToCart(p)} size="small" sx={{ display: 'none' }}>
                                                Thêm vào giỏ
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

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
                            onChange={(e) => {
                                const raw = e.target.value;
                                // Cho phép xóa hết để nhập lại
                                if (raw === '') {
                                    setAddQty('');
                                    return;
                                }
                                let n = parseInt(raw, 10);
                                if (Number.isNaN(n) || n < 1) n = 1;
                                if (selectedRemainingBase != null && selectedRemainingBase > 0 && n > selectedRemainingBase) {
                                    n = selectedRemainingBase;
                                }
                                setAddQty(String(n));
                            }}
                            InputProps={{
                                inputProps: {
                                    min: 1,
                                    ...(selectedRemainingBase != null && selectedRemainingBase > 0
                                        ? { max: selectedRemainingBase }
                                        : {})
                                },
                                endAdornment: <InputAdornment position="end">x</InputAdornment>
                            }}
                            helperText={
                                selectedDailyLimit != null
                                    ? `Tối đa còn lại hôm nay: ${selectedRemainingBase ?? 0}`
                                    : ''
                            }
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


