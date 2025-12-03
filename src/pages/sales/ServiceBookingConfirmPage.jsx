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
    Receipt
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const ServiceBookingConfirmPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const res = await fetch('https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/orders', {
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
                            order_date: order.order_date || order.created_at,
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

                // Console.log kết quả sau khi filter và map
                console.log('[ServiceBookingConfirm] Service orders count:', serviceOrders.length);
                console.log('[ServiceBookingConfirm] All service orders:', serviceOrders);
                console.log('[ServiceBookingConfirm] Service orders details:', serviceOrders.map(o => ({
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

                setOrders(serviceOrders);
            } catch (err) {
                console.error('[ServiceBookingConfirm] Fetch error:', err);
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
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
                            {orders.map((orderData, orderIndex) => (
                                <Card key={orderData.id || orderIndex} sx={{
                                    borderRadius: 3,
                                    boxShadow: 6,
                                    border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                    backgroundColor: COLORS.BACKGROUND.PAPER
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

                                        {/* Customer Information - Compact */}
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Person sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                                        {orderData.customerInfo?.full_name || 'Không có'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Phone sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {orderData.customerInfo?.phone || 'Không có'}
                                                    </Typography>
                                                </Box>
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

