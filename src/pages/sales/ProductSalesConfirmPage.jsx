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
    Container
} from '@mui/material';
import {
    ArrowBack,
    ShoppingCart,
    Receipt,
    Payment,
    Fastfood
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const ProductSalesConfirmPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                
                // Bước 1: Lấy danh sách orders
                const res = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/orders?limit=99', {
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
                console.log('[ProductSalesConfirm] Full API Response:', json);
                console.log('[ProductSalesConfirm] Total orders from API:', json?.data?.length || 0);
                console.log('[ProductSalesConfirm] All orders data:', json?.data);

                if (!json?.data || !Array.isArray(json.data)) {
                    console.warn('[ProductSalesConfirm] No data in response');
                    setOrders([]);
                    return;
                }

                // Lọc chỉ lấy product orders và loại bỏ những đơn chờ thanh toán (PENDING)
                const productOrderIds = json.data
                    .filter(order => 
                        order.product_order !== null && 
                        order.product_order !== undefined &&
                        order.status !== 'PENDING' &&
                        order.payment_status !== 'PENDING'
                    )
                    .map(order => order.id);

                console.log('[ProductSalesConfirm] Product order IDs:', productOrderIds);

                // Bước 2: Gọi API chi tiết cho từng order để lấy thông tin đầy đủ
                const productOrdersPromises = productOrderIds.map(async (orderId) => {
                    try {
                        const detailRes = await fetch(`https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/orders/${orderId}`, {
                            headers: {
                                'Authorization': token ? `Bearer ${token}` : '',
                                'Accept': 'application/json'
                            }
                        });

                        if (!detailRes.ok) {
                            console.warn(`[ProductSalesConfirm] Failed to fetch order ${orderId}`);
                            return null;
                        }

                        const orderDetail = await detailRes.json();
                        console.log(`[ProductSalesConfirm] Order ${orderId} detail:`, orderDetail);

                        // Map products từ product_order.order_details
                        const products = [];
                        if (orderDetail?.product_order?.order_details && Array.isArray(orderDetail.product_order.order_details)) {
                            orderDetail.product_order.order_details.forEach((detail) => {
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
                        let paymentMethod = orderDetail.payment_method || 'AT_COUNTER';
                        if (paymentMethod === 'CASH') {
                            paymentMethod = 'AT_COUNTER';
                        }

                        return {
                            id: orderDetail.order_number || orderDetail.id,
                            total: orderDetail.final_amount || 0,
                            payment_method: paymentMethod,
                            payment_status: orderDetail.payment_status || orderDetail.status || 'PENDING',
                            status: orderDetail.status || 'PENDING',
                            type: orderDetail.type || 'EMPLOYEE',
                            order_date: orderDetail.order_date || orderDetail.created_at,
                            created_at: orderDetail.created_at,
                            employee: orderDetail.employee,
                            products: products
                        };
                    } catch (err) {
                        console.error(`[ProductSalesConfirm] Error fetching order ${orderId}:`, err);
                        return null;
                    }
                });

                // Chờ tất cả các promise hoàn thành
                const productOrders = (await Promise.all(productOrdersPromises)).filter(order => order !== null);

                // Console.log kết quả sau khi fetch chi tiết
                console.log('[ProductSalesConfirm] Product orders count:', productOrders.length);
                console.log('[ProductSalesConfirm] All product orders:', productOrders);
                console.log('[ProductSalesConfirm] Product orders details:', productOrders.map(o => ({
                    id: o.id,
                    order_number: o.id,
                    status: o.status,
                    payment_status: o.payment_status,
                    total: o.total,
                    products_count: o.products?.length || 0
                })));

                setOrders(productOrders);
            } catch (err) {
                console.error('[ProductSalesConfirm] Fetch error:', err);
                alert('Không thể tải danh sách đơn hàng: ' + (err.message || 'Lỗi không xác định'));
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

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
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                            {orders.map((orderData, orderIndex) => (
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
                                                    {orderData.created_at && new Date(orderData.created_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={orderData.status === 'PAID' ? 'Đã thanh toán' : orderData.status === 'PENDING' ? 'Chờ thanh toán' : orderData.status === 'EXPIRED' ? 'Hết hạn' : orderData.status}
                                                color={orderData.status === 'PAID' ? 'success' : orderData.status === 'PENDING' ? 'warning' : orderData.status === 'EXPIRED' ? 'default' : 'default'}
                                                sx={{ fontWeight: 700, fontSize: '0.85rem' }}
                                            />
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
                                </Card>
                            ))}
                        </Box>
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


