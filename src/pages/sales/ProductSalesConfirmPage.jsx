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
    ArrowBack,
    ShoppingCart,
    Receipt,
    Payment,
    Fastfood,
    FilterList,
    Search,
    CalendarToday
} from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const ProductSalesConfirmPage = () => {
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
                params.append('limit', '99'); // Always use limit 99
                
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
                
                console.log('[ProductSalesConfirm] Fetching orders from:', url);
                
                // Gọi API
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
                console.log('[ProductSalesConfirm] ===== API Response from https://petcafes.azurewebsites.net/api/orders =====');
                console.log('[ProductSalesConfirm] Full API Response:', json);
                console.log('[ProductSalesConfirm] Response JSON stringified:', JSON.stringify(json, null, 2));
                console.log('[ProductSalesConfirm] Total orders from API:', json?.data?.length || 0);
                console.log('[ProductSalesConfirm] All orders data:', json?.data);
                console.log('[ProductSalesConfirm] Pagination:', json?.pagination);
                console.log('[ProductSalesConfirm] ===== End API Response =====');

                if (!json?.data || !Array.isArray(json.data)) {
                    console.warn('[ProductSalesConfirm] No data in response');
                    setOrders([]);
                    return;
                }

                // Filter chỉ lấy các orders có product_order (đơn hàng sản phẩm)
                const productOrders = json.data.filter(order => 
                    order.product_order !== null && 
                    order.product_order !== undefined
                );

                console.log('[ProductSalesConfirm] Total orders from API:', json.data.length);
                console.log('[ProductSalesConfirm] Product orders count:', productOrders.length);

                // Map chỉ các đơn hàng sản phẩm
                const allOrders = productOrders.map(order => {
                    const productOrder = order.product_order;
                    
                    // Xử lý products từ product_order.order_details
                    const products = [];
                    if (productOrder?.order_details && Array.isArray(productOrder.order_details)) {
                        productOrder.order_details.forEach((detail) => {
                            products.push({
                                product_name: detail.product?.name || 'Sản phẩm',
                                price: detail.unit_price || detail.product?.price || 0,
                                quantity: detail.quantity || 1,
                                subtotal: detail.total_price || (detail.unit_price || 0) * (detail.quantity || 1),
                                notes: detail.notes || '',
                                image: detail.product?.image_url || detail.product?.thumbnails?.[0] || null,
                                description: detail.product?.description || '',
                                is_for_feeding: detail.is_for_feeding || false
                            });
                        });
                    }

                    // Map payment method
                    let paymentMethod = order.payment_method || 'AT_COUNTER';
                    if (paymentMethod === 'CASH') {
                        paymentMethod = 'AT_COUNTER';
                    }

                    // Xác định order_date ưu tiên từ product_order
                    const orderDate = productOrder?.order_date || 
                                     productOrder?.created_at || 
                                     order.order_date || 
                                     order.created_at;

                    // Xác định status ưu tiên từ product_order
                    const orderStatus = productOrder?.status || order.status || 'PENDING';

                    // Lấy tất cả thông tin từ API
                    return {
                        // Thông tin cơ bản
                        id: order.id,
                        order_number: order.order_number,
                        customer_id: order.customer_id,
                        employee_id: order.employee_id,
                        full_name: order.full_name || '',
                        address: order.address || '',
                        phone: order.phone || '',
                        
                        // Thông tin tài chính
                        total_amount: productOrder?.total_amount || order.total_amount || 0,
                        discount_amount: productOrder?.discount_amount || order.discount_amount || 0,
                        final_amount: productOrder?.final_amount || order.final_amount || 0,
                        total: productOrder?.final_amount || order.final_amount || 0,
                        
                        // Thông tin thanh toán
                        payment_method: paymentMethod,
                        payment_status: order.payment_status || 'PENDING',
                        payment_data_json: order.payment_data_json,
                        payment_info: order.payment_info,
                        
                        // Thông tin trạng thái
                        status: orderStatus,
                        type: order.type || 'CUSTOMER',
                        
                        // Thông tin ngày tháng
                        order_date: orderDate,
                        created_at: productOrder?.created_at || order.created_at,
                        updated_at: productOrder?.updated_at || order.updated_at,
                        
                        // Thông tin liên quan
                        employee: order.employee,
                        customer: order.customer,
                        notes: productOrder?.notes || order.notes || '',
                        
                        // Thông tin product_order
                        product_order: productOrder,
                        product_order_id: productOrder?.id,
                        product_order_status: productOrder?.status,
                        products: products,
                        is_product_order: true,
                        
                        // Thông tin khác
                        transactions: order.transactions || [],
                        is_deleted: order.is_deleted || false
                    };
                });

                // Console.log kết quả đã map
                console.log('[ProductSalesConfirm] Mapped product orders count:', allOrders.length);
                console.log('[ProductSalesConfirm] All mapped product orders:', allOrders);
                console.log('[ProductSalesConfirm] Product orders details:', allOrders.map(o => ({
                    id: o.id,
                    order_number: o.order_number,
                    full_name: o.full_name,
                    status: o.status,
                    payment_status: o.payment_status,
                    payment_method: o.payment_method,
                    total: o.total,
                    final_amount: o.final_amount,
                    is_product_order: o.is_product_order,
                    products_count: o.products?.length || 0
                })));

                // Sắp xếp theo order_date (mới nhất lên đầu)
                const sortedOrders = allOrders.sort((a, b) => {
                    const dateA = new Date(a.order_date || a.created_at || 0);
                    const dateB = new Date(b.order_date || b.created_at || 0);
                    return dateB - dateA; // Mới nhất lên đầu
                });

                setOrders(sortedOrders);
            } catch (err) {
                console.error('[ProductSalesConfirm] Fetch error:', err);
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
                        Đơn hàng #{orderData.order_number || orderData.id}
                    </Typography>
                    {orderData.full_name && (
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 0.5 }}>
                            👤 {orderData.full_name}
                        </Typography>
                    )}
                    {orderData.phone && (
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                            📞 {orderData.phone}
                        </Typography>
                    )}
                    {orderData.address && (
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                            📍 {orderData.address}
                        </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mt: 0.5 }}>
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
                    {orderData.is_product_order && (
                        <Chip label="Sản phẩm" size="small" color="error" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                    )}
                </Stack>
            </Box>

            {/* Products List */}
            {orderData.products && orderData.products.length > 0 && (
                <Box sx={{ mb: 2.5, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 700,
                        color: COLORS.ERROR[600],
                        mb: 1.5,
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                    }}>
                        Sản phẩm đã bán
                    </Typography>
                    <Stack spacing={1.5}>
                        {orderData.products.map((product, index) => (
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
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{
                                                fontWeight: 800,
                                                color: COLORS.TEXT.PRIMARY,
                                                mb: 0.5
                                            }}>
                                                {product.product_name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Số lượng: {product.quantity} × {formatPrice(product.price)} = {formatPrice(product.subtotal)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" sx={{
                                            color: COLORS.ERROR[600],
                                            fontWeight: 800,
                                            ml: 2
                                        }}>
                                            {formatPrice(product.subtotal)}
                                        </Typography>
                                    </Box>
                                    
                                    {product.notes && (
                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mt: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem', fontStyle: 'italic' }}>
                                                💬 {product.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Notes */}
            {orderData.notes && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                        📝 Ghi chú: {orderData.notes}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

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
                            <Fastfood sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                    Tổng số đồ ăn đã bán
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                    Danh sách đơn hàng sản phẩm
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
                            borderRadius: 4,
                            boxShadow: 6,
                            border: `1px solid ${COLORS.BORDER.LIGHT}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER,
                            textAlign: 'center',
                            py: 6
                        }}>
                            <CardContent>
                                <Fastfood sx={{ fontSize: 64, color: COLORS.ERROR[300], mb: 2, opacity: 0.6 }} />
                                <Typography variant="h6" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                    Chưa có đơn hàng sản phẩm nào
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => navigate('/sales/sales')}
                                    sx={{ borderRadius: 3, fontWeight: 600, px: 3 }}
                                >
                                    Quay lại bán hàng
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
                                                borderRadius: 4,
                                                boxShadow: 6,
                                                border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                backgroundColor: COLORS.BACKGROUND.PAPER,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                transition: 'transform 120ms ease, box-shadow 120ms ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: 10
                                                }
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
                                                borderRadius: 4,
                                                boxShadow: 6,
                                                border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                backgroundColor: COLORS.BACKGROUND.PAPER,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                transition: 'transform 120ms ease, box-shadow 120ms ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: 10
                                                }
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
                                                    borderRadius: 4,
                                                    boxShadow: 6,
                                                    border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                                    backgroundColor: COLORS.BACKGROUND.PAPER,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    overflow: 'hidden',
                                                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: 10
                                                    }
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
                                    onClick={() => navigate('/sales/sales')}
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
                                    onClick={() => navigate('/sales/sales')}
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
                                    Bán thêm sản phẩm
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Container>
            </Box>
        </Fade>
    );
};

export default ProductSalesConfirmPage;


