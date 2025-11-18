import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, TextField, Button, Stack, Badge, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Divider } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowBack, Close, CheckCircle } from '@mui/icons-material';

const ServiceSalesPage = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [slotModalOpen, setSlotModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                // Official services API
                const resp = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/services');
                if (!resp.ok) {
                    const errorText = await resp.text();
                    console.error('[ServiceSalesPage] Lỗi khi tải dịch vụ:', {
                        status: resp.status,
                        statusText: resp.statusText,
                        response: errorText
                    });
                    throw new Error(`Lỗi ${resp.status}: Không thể tải dịch vụ`);
                }
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setServices(list);
            } catch (e) {
                console.error('[ServiceSalesPage] Lỗi không thể thanh toán/tải dịch vụ:', e);
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

    const notifyCartChanged = (next) => {
        try { localStorage.setItem('sales_cart', JSON.stringify(next)); } catch {}
        try { window.dispatchEvent(new Event('cartUpdated')); } catch {}
    };

    const handleCardClick = (svc) => {
        const slots = Array.isArray(svc.slots) ? svc.slots : [];
        if (slots.length === 0) {
            alert('Dịch vụ này chưa có slot nào');
            return;
        }
        setSelectedService(svc);
        setSelectedSlotId(null);
        setSlotModalOpen(true);
    };

    const handleAddToCart = () => {
        if (!selectedService || !selectedSlotId) {
            console.warn('[ServiceSalesPage] Không thể thêm vào giỏ: Chưa chọn slot');
            alert('Vui lòng chọn slot');
            return;
        }

        const quantity = 1;
        const selectedSlot = selectedService.slots.find(s => s.id === selectedSlotId);
        
        if (!selectedSlot) {
            console.error('[ServiceSalesPage] Lỗi: Slot không hợp lệ', { selectedSlotId, serviceId: selectedService.id });
            alert('Slot không hợp lệ');
            return;
        }

        // Use slot price if available, otherwise use service base_price
        const price = selectedSlot.price > 0 ? selectedSlot.price : (selectedService.base_price || 0);
        
        const item = { 
            id: `svc-${selectedSlotId}`, 
            name: selectedService.name, 
            price: price, 
            quantity,
            slot_id: selectedSlotId,
            service_id: selectedService.id
        };
        
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
            setSlotModalOpen(false);
            setSelectedService(null);
            setSelectedSlotId(null);
        } catch (e) {
            console.error('[ServiceSalesPage] Lỗi khi thêm vào giỏ hàng:', e);
            try {
                notifyCartChanged([item]);
                setSlotModalOpen(false);
                setSelectedService(null);
                setSelectedSlotId(null);
            } catch (err) {
                console.error('[ServiceSalesPage] Lỗi nghiêm trọng khi xử lý giỏ hàng:', err);
            }
        }
    };

    const getDayOfWeekLabel = (day) => {
        const days = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        };
        return days[day] || day;
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
                            <Card 
                                sx={{
                                    borderRadius: 4,
                                    height: '100%',
                                    overflow: 'hidden',
                                    boxShadow: 6,
                                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 10, cursor: 'pointer' },
                                    display: 'flex', flexDirection: 'column'
                                }}
                                onClick={() => handleCardClick(s)}
                            >
                                {s.image_url && (
                                    <Box component="img" src={s.image_url} alt={s.name} sx={{ width: '100%', height: 180, objectFit: 'cover', flexShrink: 0 }} />
                                )}
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 48 }}>{s.name}</Typography>
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                                        {s.description || 'Dịch vụ tại Pet Cafe'}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 1 }}>{(s.base_price || 0).toLocaleString('vi-VN')} ₫</Typography>
                                    <Box sx={{ flexGrow: 1 }} />
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Container>

            {/* Slot Selection Modal */}
            <Dialog 
                open={slotModalOpen} 
                onClose={() => {
                    setSlotModalOpen(false);
                    setSelectedService(null);
                    setSelectedSlotId(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: 6
                    }
                }}
            >
                <DialogTitle sx={{ bgcolor: COLORS.ERROR[600], color: 'white', py: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Chọn slot - {selectedService?.name}
                        </Typography>
                        <IconButton 
                            onClick={() => {
                                setSlotModalOpen(false);
                                setSelectedService(null);
                                setSelectedSlotId(null);
                            }}
                            sx={{ color: 'white' }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedService && (
                        <Stack spacing={2}>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 2 }}>
                                {selectedService.description || 'Dịch vụ tại Pet Cafe'}
                            </Typography>
                            <Divider />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Chọn slot khả dụng:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto' }}>
                                {Array.isArray(selectedService.slots) && selectedService.slots.length > 0 ? (
                                    selectedService.slots.map((slot) => {
                                        const isAvailable = slot.service_status === 'AVAILABLE';
                                        const isSelected = selectedSlotId === slot.id;
                                        const slotPrice = slot.price > 0 ? slot.price : (selectedService.base_price || 0);
                                        
                                        return (
                                            <Card
                                                key={slot.id}
                                                onClick={() => isAvailable && setSelectedSlotId(slot.id)}
                                                sx={{
                                                    p: 2,
                                                    border: `2px solid ${isSelected ? COLORS.ERROR[600] : COLORS.BORDER.LIGHT}`,
                                                    borderRadius: 2,
                                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                    opacity: isAvailable ? 1 : 0.6,
                                                    bgcolor: isSelected ? COLORS.ERROR[50] : 'transparent',
                                                    transition: 'all 0.2s',
                                                    '&:hover': isAvailable ? {
                                                        borderColor: COLORS.ERROR[600],
                                                        bgcolor: COLORS.ERROR[50]
                                                    } : {}
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                {getDayOfWeekLabel(slot.day_of_week)}
                                                            </Typography>
                                                            {isAvailable ? (
                                                                <Chip label="Khả dụng" color="success" size="small" />
                                                            ) : (
                                                                <Chip label="Không khả dụng" color="default" size="small" />
                                                            )}
                                                        </Stack>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 0.5 }}>
                                                            Thời gian: {slot.start_time} - {slot.end_time}
                                                        </Typography>
                                                        {slot.special_notes && (
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                                {slot.special_notes}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                                                            {slotPrice.toLocaleString('vi-VN')} ₫
                                                        </Typography>
                                                        {isSelected && (
                                                            <CheckCircle sx={{ color: COLORS.ERROR[600], mt: 0.5 }} />
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 3 }}>
                                        Không có slot nào cho dịch vụ này
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => {
                            setSlotModalOpen(false);
                            setSelectedService(null);
                            setSelectedSlotId(null);
                        }}
                        color="inherit"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleAddToCart}
                        disabled={!selectedSlotId}
                        startIcon={<ShoppingCart />}
                    >
                        Thêm vào giỏ
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ServiceSalesPage;



