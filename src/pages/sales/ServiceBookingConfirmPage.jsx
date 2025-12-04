import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Paper,
    Fade,
    Chip,
    Divider,
    alpha,
    Container,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField
} from '@mui/material';
import {
    CheckCircle,
    ArrowBack,
    CalendarToday,
    AccessTime,
    Pets,
    Person,
    Phone,
    Note,
    LocationOn,
    ShoppingCart,
    Payment,
    Receipt,
    FilterList,
    Search
} from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const ServiceBookingConfirmPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState(''); // '' = all, 'AT_COUNTER', 'ONLINE'
    const [minPrice, setMinPrice] = useState(''); // Minimum price (input value)
    const [maxPrice, setMaxPrice] = useState(''); // Maximum price (input value)
    const [appliedMinPrice, setAppliedMinPrice] = useState(''); // Applied filter value
    const [appliedMaxPrice, setAppliedMaxPrice] = useState(''); // Applied filter value
    const [pageSize, setPageSize] = useState(99);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                
                // Build query parameters - Lấy toàn bộ orders (không filter theo type)
                const params = new URLSearchParams();
                params.append('limit', pageSize.toString());
                
                if (paymentMethod) {
                    params.append('PaymentMethod', paymentMethod);
                }
                
                // Filter theo giá
                if (appliedMinPrice && !isNaN(parseFloat(appliedMinPrice))) {
                    params.append('MinPrice', parseFloat(appliedMinPrice).toString());
                }
                
                if (appliedMaxPrice && !isNaN(parseFloat(appliedMaxPrice))) {
                    params.append('MaxPrice', parseFloat(appliedMaxPrice).toString());
                }
                
                const queryString = params.toString();
                const url = `https://petcafes.azurewebsites.net/api/orders${queryString ? `?${queryString}` : ''}`;
                
                console.log('[ServiceBookingConfirm] Fetching orders with params:', queryString);
                
                const res = await fetch(url, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json = await res.json();

                // Console.log toàn bộ dữ liệu từ API
                console.log('[ServiceBookingConfirm] Full API Response:', json);
                console.log('[ServiceBookingConfirm] Total orders from API:', json?.data?.length || 0);
                console.log('[ServiceBookingConfirm] All orders data:', json?.data);

                if (!json?.data || !Array.isArray(json.data)) {
                    console.warn('[ServiceBookingConfirm] No data in response');
                    setOrders([]);
                    return;
                }

                // Lấy TẤT CẢ service orders từ API, bất kể có thông tin hay không
                // Không filter theo status, không filter theo name, address, phone, v.v.
                // Lấy tất cả orders có service_order (không null)
                const serviceOrders = json.data
                    .filter(order => order.service_order !== null && order.service_order !== undefined)
                    // Lấy tất cả, không filter gì thêm
                    .map(order => {
                        // Map services từ service_order.order_details nếu có
                        const services = [];
                        if (order.service_order && order.service_order.order_details && Array.isArray(order.service_order.order_details)) {
                            order.service_order.order_details.forEach((detail) => {
                                services.push({
                                    service_name: detail.service?.name || detail.service_name || 'Dịch vụ thú cưng',
                                    price: detail.price || detail.final_amount || 0,
                                    booking_date: detail.booking_date || order.service_order.order_date || order.created_at,
                                    notes: detail.notes || order.notes || '',
                                    slot_id: detail.slot_id,
                                    slot: detail.slot,
                                    image: detail.service?.image_url || detail.service?.thumbnails?.[0] || 'https://i.ibb.co/4fL7q4f/pet-service.jpg'
                                });
                            });
                        }

                        // Nếu không có order_details, tạo một service từ service_order
                        if (services.length === 0 && order.service_order) {
                            services.push({
                                service_name: 'Dịch vụ thú cưng',
                                price: order.service_order.final_amount || order.final_amount || 0,
                                booking_date: order.service_order.order_date || order.created_at,
                                notes: order.notes || '',
                                image: 'https://i.ibb.co/4fL7q4f/pet-service.jpg'
                            });
                        }

                        // Map payment method
                        let paymentMethod = order.payment_method || 'AT_COUNTER';
                        if (paymentMethod === 'CASH') {
                            paymentMethod = 'AT_COUNTER';
                        }

                        return {
                            id: order.order_number || order.id,
                            total: order.final_amount || 0,
                            payment_method: paymentMethod,
                            payment_status: order.payment_status || order.status || 'PENDING',
                            status: order.status || 'PENDING',
                            type: order.type || 'EMPLOYEE',
                            order_date: order.service_order?.order_date || order.order_date || order.created_at,
                            created_at: order.created_at,
                            employee: order.employee,
                            services: services.length > 0 ? services : [
                                {
                                    service_name: 'Dịch vụ thú cưng',
                                    price: order.final_amount || 0,
                                    booking_date: order.created_at,
                                    notes: order.notes || '',
                                    image: 'https://i.ibb.co/4fL7q4f/pet-service.jpg'
                                }
                            ],
                            customerInfo: {
                                full_name: order.full_name || '',
                                phone: order.phone || '',
                                address: order.address || '',
                                notes: order.notes || ''
                            }
                        };
                    });

                // Filter ẩn các hóa đơn "Chờ thanh toán" (PENDING)
                const filteredOrders = serviceOrders.filter(order => 
                    order.payment_status !== 'PENDING'
                );

                // Console.log kết quả sau khi filter và map
                console.log('[ServiceBookingConfirm] Service orders count (before filter):', serviceOrders.length);
                console.log('[ServiceBookingConfirm] Service orders count (after filter PENDING):', filteredOrders.length);
                console.log('[ServiceBookingConfirm] All service orders:', filteredOrders);
                console.log('[ServiceBookingConfirm] Service orders details:', filteredOrders.map(o => ({
                    id: o.id,
                    order_number: o.id,
                    status: o.status,
                    payment_status: o.payment_status,
                    total: o.total,
                    full_name: o.customerInfo?.full_name,
                    phone: o.customerInfo?.phone,
                    address: o.customerInfo?.address,
                    services_count: o.services?.length || 0
                })));

                // Sắp xếp theo order_date (mới nhất lên đầu)
                const sortedOrders = filteredOrders.sort((a, b) => {
                    const dateA = new Date(a.order_date || a.created_at || 0);
                    const dateB = new Date(b.order_date || b.created_at || 0);
                    return dateB - dateA; // Mới nhất lên đầu
                });

                setOrders(sortedOrders);
            } catch (err) {
                console.error('[ServiceBookingConfirm] Fetch error:', err);
                alert('Không thể tải danh sách đơn hàng: ' + (err.message || 'Lỗi không xác định'));
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [paymentMethod, appliedMinPrice, appliedMaxPrice, pageSize]);
    
    // Hàm để áp dụng bộ lọc (chỉ search khi click nút)
    const handleApplyFilters = () => {
        setAppliedMinPrice(minPrice);
        setAppliedMaxPrice(maxPrice);
    };

    // Hàm để nhóm orders theo ngày
    const groupOrdersByDate = (orders) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const groups = {
            today: [],
            yesterday: [],
            other: []
        };

        orders.forEach(order => {
            const orderDate = new Date(order.order_date || order.created_at);
            const orderDateOnly = new Date(orderDate);
            orderDateOnly.setHours(0, 0, 0, 0);
            
            if (orderDateOnly.getTime() === today.getTime()) {
                groups.today.push(order);
            } else if (orderDateOnly.getTime() === yesterday.getTime()) {
                groups.yesterday.push(order);
            } else {
                groups.other.push(order);
            }
        });

        return groups;
    };

    // Hàm render order card
    const renderOrderCard = (orderData) => (
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Order Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, pb: 2, borderBottom: `2px solid ${alpha(COLORS.ERROR[100], 0.5)}` }}>
                <Box>
                    <Typography variant="h6" sx={{
                        fontWeight: 900,
                        color: COLORS.ERROR[600],
                        mb: 0.5
                    }}>
                        Đơn hàng #{orderData.id}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        {orderData.order_date && new Date(orderData.order_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Typography>
                </Box>
                <Stack direction="column" spacing={0.5} alignItems="flex-end">
                    <Chip
                        label={orderData.payment_status === 'PAID' ? 'Đã thanh toán' : orderData.payment_status === 'PENDING' ? 'Chờ thanh toán' : orderData.payment_status === 'EXPIRED' ? 'Hết hạn' : orderData.payment_status || '—'}
                        color={orderData.payment_status === 'PAID' ? 'success' : orderData.payment_status === 'PENDING' ? 'warning' : orderData.payment_status === 'EXPIRED' ? 'default' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                </Stack>
            </Box>

            {/* Services List */}
            {orderData.services && orderData.services.length > 0 && (
                <Box sx={{ mb: 2.5, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 700,
                        color: COLORS.ERROR[600],
                        mb: 1.5,
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                    }}>
                        Dịch vụ đã đặt
                    </Typography>
                    <Stack spacing={1.5}>
                        {orderData.services.map((service, index) => (
                            <Paper
                                key={index}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    backgroundColor: alpha(COLORS.ERROR[50], 0.4),
                                    border: `1px solid ${alpha(COLORS.ERROR[200], 0.6)}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: alpha(COLORS.ERROR[50], 0.6),
                                        borderColor: COLORS.ERROR[300]
                                    }
                                }}
                            >
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="subtitle1" sx={{
                                            fontWeight: 800,
                                            color: COLORS.TEXT.PRIMARY,
                                            flex: 1
                                        }}>
                                            {service.service_name || service.name || `Dịch vụ ${index + 1}`}
                                        </Typography>
                                        {service.price && (
                                            <Typography variant="h6" sx={{
                                                color: COLORS.ERROR[600],
                                                fontWeight: 800,
                                                ml: 2
                                            }}>
                                                {formatPrice(service.price)}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {service.booking_date && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarToday sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.TEXT.SECONDARY }}>
                                                {(() => {
                                                    const dateStr = service.booking_date;
                                                    if (!dateStr) return '';
                                                    if (dateStr.includes('T')) {
                                                        const date = new Date(dateStr);
                                                        return date.toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        });
                                                    } else {
                                                        const [year, month, day] = dateStr.split('-').map(Number);
                                                        const date = new Date(year, month - 1, day);
                                                        return date.toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        });
                                                    }
                                                })()}
                                            </Typography>
                                        </Box>
                                    )}

                                    {service.notes && (
                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mt: 0.5 }}>
                                            <Note sx={{ fontSize: 16, color: COLORS.ERROR[500], mt: 0.25 }} />
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem' }}>
                                                {service.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Customer Information - Compact - Chỉ hiển thị nếu có thông tin */}
            {(orderData.customerInfo?.full_name || 
              orderData.customerInfo?.phone || 
              orderData.customerInfo?.address) && (
                <>
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{
                            fontWeight: 700,
                            color: COLORS.ERROR[600],
                            mb: 1.5,
                            fontSize: '0.95rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            Thông tin khách hàng
                        </Typography>
                        <Stack spacing={1}>
                            {orderData.customerInfo?.full_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Person sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                        {orderData.customerInfo.full_name}
                                    </Typography>
                                </Box>
                            )}
                            {orderData.customerInfo?.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Phone sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {orderData.customerInfo.phone}
                                    </Typography>
                                </Box>
                            )}
                            {orderData.customerInfo?.address && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    <LocationOn sx={{ fontSize: 18, color: COLORS.ERROR[500], mt: 0.25 }} />
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, flex: 1 }}>
                                        {orderData.customerInfo.address}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                    <Divider sx={{ my: 2.5 }} />
                </>
            )}

            {/* Payment & Total - Bottom Section */}
            <Box sx={{ mt: 'auto', pt: 2 }}>
                {orderData.payment_method && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Payment sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                            {orderData.payment_method === 'AT_COUNTER' ? '💵 Thanh toán tại quầy' : '🏦 Chuyển khoản'}
                        </Typography>
                    </Box>
                )}
                
                {orderData.total && (
                    <Paper sx={{
                        p: 2,
                        borderRadius: 2.5,
                        backgroundColor: alpha(COLORS.ERROR[50], 0.6),
                        border: `2px solid ${COLORS.ERROR[300]}`
                    }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                                Tổng cộng
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                {formatPrice(orderData.total)}
                            </Typography>
                        </Stack>
                    </Paper>
                )}
            </Box>
        </CardContent>
    );

    const groupedOrders = groupOrdersByDate(orders);

    if (loading) {
        return (
            <Box sx={{
                py: { xs: 2, md: 3 },
                minHeight: '100vh',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="xl">
                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>Đang tải danh sách đơn hàng...</Typography>
                </Container>
            </Box>
        );
    }

    return (
        <Fade in timeout={800}>
            <Box sx={{
                py: { xs: 2, md: 3 },
                minHeight: '100vh',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="xl">
                    {/* Header */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Receipt sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                    Xác nhận dịch vụ đã bán
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                    Danh sách đơn hàng dịch vụ
                                </Typography>
                            </Box>
                        </Stack>
                        {orders.length > 0 && (
                            <Chip
                                color="error"
                                label={`Tổng: ${orders.length} đơn hàng`}
                                sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.95rem', py: 1.5, px: 2 }}
                            />
                        )}
                    </Stack>

                    {/* Filters */}
                    <Card sx={{
                        mb: 3,
                        borderRadius: 3,
                        boxShadow: 4,
                        border: `1px solid ${COLORS.BORDER.LIGHT}`,
                        backgroundColor: COLORS.BACKGROUND.PAPER
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                                <FilterList sx={{ fontSize: 20, color: COLORS.ERROR[500] }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[600] }}>
                                    Bộ lọc
                                </Typography>
                            </Stack>
                            <Box
                                component="form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    return false;
                                }}
                                noValidate
                            >
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <FormControl fullWidth sx={{ minWidth: 200 }}>
                                        <InputLabel>Phương thức thanh toán</InputLabel>
                                        <Select
                                            value={paymentMethod}
                                            label="Phương thức thanh toán"
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <MenuItem value="">Tất cả</MenuItem>
                                            <MenuItem value="AT_COUNTER">💵 Tiền mặt</MenuItem>
                                            <MenuItem value="ONLINE">🏦 Mã QR (Online)</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="Giá tối thiểu (VNĐ)"
                                        type="number"
                                        value={minPrice}
                                        onChange={(e) => {
                                            setMinPrice(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ color: COLORS.ERROR[500], fontWeight: 600 }}>₫</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="Nhập giá tối thiểu"
                                        sx={{ minWidth: 200 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Giá tối đa (VNĐ)"
                                        type="number"
                                        value={maxPrice}
                                        onChange={(e) => {
                                            setMaxPrice(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleApplyFilters();
                                            }
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ color: COLORS.ERROR[500], fontWeight: 600 }}>₫</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="Nhập giá tối đa"
                                        sx={{ minWidth: 200 }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<Search />}
                                        onClick={handleApplyFilters}
                                        sx={{
                                            minWidth: { xs: '100%', sm: 150 },
                                            py: 1.5,
                                            borderRadius: 3,
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            boxShadow: 4,
                                            '&:hover': {
                                                boxShadow: 6
                                            }
                                        }}
                                    >
                                        Tìm kiếm
                                    </Button>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Orders List */}
                    {orders.length === 0 ? (
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: 6,
                            border: `1px solid ${COLORS.BORDER.LIGHT}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER
                        }}>
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                                    Chưa có đơn hàng dịch vụ nào
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => navigate('/sales/services')}
                                >
                                    Quay lại bán dịch vụ
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Stack spacing={4}>
                            {/* Hôm nay */}
                            {groupedOrders.today.length > 0 && (
                                <Box>
                                    <Typography variant="h5" sx={{ 
                                        fontWeight: 800, 
                                        color: COLORS.ERROR[600], 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <CalendarToday sx={{ fontSize: 28 }} />
                                        Hôm nay ({groupedOrders.today.length} đơn)
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                                        {groupedOrders.today.map((orderData, orderIndex) => (
                                            <Card key={orderData.id || orderIndex} sx={{
                                                borderRadius: 3,
                                                boxShadow: 6,
                                                border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                backgroundColor: COLORS.BACKGROUND.PAPER
                                            }}>
                                                {renderOrderCard(orderData)}
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Hôm qua */}
                            {groupedOrders.yesterday.length > 0 && (
                                <Box>
                                    <Typography variant="h5" sx={{ 
                                        fontWeight: 800, 
                                        color: COLORS.ERROR[600], 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <CalendarToday sx={{ fontSize: 28 }} />
                                        Hôm qua ({groupedOrders.yesterday.length} đơn)
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                                        {groupedOrders.yesterday.map((orderData, orderIndex) => (
                                            <Card key={orderData.id || orderIndex} sx={{
                                                borderRadius: 3,
                                                boxShadow: 6,
                                                border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                backgroundColor: COLORS.BACKGROUND.PAPER
                                            }}>
                                                {renderOrderCard(orderData)}
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Các ngày khác - nhóm theo ngày */}
                            {groupedOrders.other.length > 0 && (() => {
                                // Nhóm các đơn khác theo ngày
                                const otherByDate = {};
                                groupedOrders.other.forEach(order => {
                                    const orderDate = new Date(order.order_date || order.created_at);
                                    const dateKey = orderDate.toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                    if (!otherByDate[dateKey]) {
                                        otherByDate[dateKey] = [];
                                    }
                                    otherByDate[dateKey].push(order);
                                });

                                return Object.keys(otherByDate).map(dateKey => (
                                    <Box key={dateKey}>
                                        <Typography variant="h5" sx={{ 
                                            fontWeight: 800, 
                                            color: COLORS.ERROR[600], 
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <CalendarToday sx={{ fontSize: 28 }} />
                                            {dateKey} ({otherByDate[dateKey].length} đơn)
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                                            {otherByDate[dateKey].map((orderData, orderIndex) => (
                                                <Card key={orderData.id || orderIndex} sx={{
                                                    borderRadius: 3,
                                                    boxShadow: 6,
                                                    border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                    backgroundColor: COLORS.BACKGROUND.PAPER
                                                }}>
                                                    {renderOrderCard(orderData)}
                                                </Card>
                                            ))}
                                        </Box>
                                    </Box>
                                ));
                            })()}
                        </Stack>
                    )}

                    {/* Actions */}
                    {orders.length > 0 && (
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<ArrowBack />}
                                    onClick={() => navigate('/sales/services')}
                                    sx={{
                                        minWidth: { xs: '100%', sm: 200 },
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderWidth: 2,
                                        '&:hover': {
                                            borderWidth: 2
                                        }
                                    }}
                                >
                                    Quay lại
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<ShoppingCart />}
                                    onClick={() => navigate('/sales/services')}
                                    sx={{
                                        minWidth: { xs: '100%', sm: 200 },
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        boxShadow: 4,
                                        '&:hover': {
                                            boxShadow: 6
                                        }
                                    }}
                                >
                                    Đặt thêm dịch vụ
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Container>
            </Box>
        </Fade>
    );
};

export default ServiceBookingConfirmPage;


