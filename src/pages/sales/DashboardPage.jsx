import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Stack, Container, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton, Tooltip } from '@mui/material';
import { ShoppingCart, ReceiptLong, TrendingUp, DesignServices, CheckCircle, Payment, Close, Visibility, ArrowBack, ContentCopy } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import transactionsApi from '../../api/transactionsApi';
import Loading from '../../components/loading/Loading';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        products: 0,
        invoices: 0,
        totalServicesSold: 0,
        totalProductsSold: 0,
        revenueToday: 0,
        totalTransactions: 0,
        totalTransactionAmount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [copiedText, setCopiedText] = useState(null);

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

                const [invoicesRes, transactionsData] = await Promise.all([
                    salesApi.getInvoices(),
                    transactionsApi.getTransactions({ page: 1, limit: 10 })
                ]);
                const invoices = invoicesRes?.data || [];

                // Process transactions data
                const transactionsList = transactionsData?.data || [];
                const totalTransactions = transactionsData?.pagination?.total_items_count || 0;
                const totalTransactionAmount = transactionsList.reduce((sum, trans) => sum + (trans.amount || 0), 0);

                setTransactions(transactionsList);
                setStats({
                    products: totalProducts,
                    invoices: invoices.length,
                    totalServicesSold: totalServicesSold,
                    totalProductsSold: totalProductsSold,
                    revenueToday: revenueToday,
                    totalTransactions: totalTransactions,
                    totalTransactionAmount: totalTransactionAmount
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            return dateString;
        }
    };

    const mapPaymentMethod = (method) => {
        switch ((method || '').toUpperCase()) {
            case 'ONLINE':
            case 'QR':
                return 'Thanh toán online';
            case 'AT_COUNTER':
            case 'COUNTER':
                return 'Tại quầy';
            case 'CASH':
                return 'Tiền mặt';
            case 'CARD':
                return 'Thẻ';
            default:
                return method || 'Không xác định';
        }
    };

    const mapOrderStatus = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'PAID':
                return 'Hoàn thành';
            case 'PENDING':
                return 'Đang xử lý';
            case 'CANCELLED':
                return 'Đã hủy';
            case 'REFUNDED':
                return 'Đã hoàn tiền';
            case 'EXPIRED':
                return 'Hết hạn';
            default:
                return status || 'Không xác định';
        }
    };

    const mapPaymentStatus = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'PAID':
                return 'Đã thanh toán';
            case 'PENDING':
                return 'Chưa thanh toán';
            case 'CANCELLED':
                return 'Đã hủy';
            case 'REFUNDED':
                return 'Đã hoàn tiền';
            case 'EXPIRED':
                return 'Hết hạn';
            case 'FAILED':
                return 'Thất bại';
            default:
                return status || 'Không xác định';
        }
    };

    const mapTransactionStatus = (desc) => {
        switch ((desc || '').toLowerCase()) {
            case 'success':
                return 'Thành công';
            case 'failed':
                return 'Thất bại';
            case 'pending':
                return 'Đang xử lý';
            default:
                return desc || 'Không xác định';
        }
    };

    const formatVnd = (val) => {
        const n = Number(val || 0);
        return n.toLocaleString("vi-VN") + " ₫";
    };

    const mapOrderType = (type) => {
        switch ((type || '').toUpperCase()) {
            case 'CUSTOMER':
                return 'Khách hàng';
            case 'EMPLOYEE':
                return 'Nhân viên';
            default:
                return type || 'Không xác định';
        }
    };

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setDetailDialogOpen(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedTransaction(null);
    };

    const handleCopy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(label);
            setTimeout(() => setCopiedText(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Small helper for consistent detail rows in the modal
    const DetailItem = ({ label, children }) => (
        <Box sx={{ mb: 1 }}>
            <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
            >
                {label}
            </Typography>
            {children}
        </Box>
    );

    const cards = [
        { label: 'Sản phẩm', value: stats.products, icon: <ShoppingCart />, color: COLORS.INFO[500], path: '/sales/sales' },
        { label: 'Tổng số dịch vụ đã bán', value: stats.totalServicesSold, icon: <DesignServices />, color: COLORS.SECONDARY[600], path: '/sales/service-booking-confirm' },
        { label: 'Tổng số sản phẩm đã bán', value: stats.totalProductsSold, icon: <CheckCircle />, color: COLORS.WARNING[600], path: '/sales/product-sales-confirm' },
        { label: 'Doanh thu hôm nay', value: stats.revenueToday.toLocaleString('vi-VN') + ' ₫', icon: <TrendingUp />, color: COLORS.ERROR[600], path: '/sales/sales' },
        { label: 'Tổng giao dịch', value: stats.totalTransactions, icon: <Payment />, color: COLORS.PRIMARY[600], path: '/sales/invoice' },
        { label: 'Tổng số tiền giao dịch', value: formatCurrency(stats.totalTransactionAmount), icon: <ReceiptLong />, color: COLORS.SUCCESS[600], path: '/sales/invoice' }
    ];

    if (loading) {
        return (
            <Box sx={{
                py: 3,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                             radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                             radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Loading message="Đang tải dữ liệu dashboard..." size="large" fullScreen={false} />
                </Container>
            </Box>
        );
    }

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
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', color: COLORS.ERROR[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Tổng quan</Typography>
                    <Chip color="error" label="Sales" sx={{ fontWeight: 700 }} />
                </Stack>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
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

                {/* Bảng giao dịch gần đây */}
                <Card sx={{
                    mt: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: `1px solid ${COLORS.PRIMARY[200]}`,
                    boxShadow: `0 10px 28px ${COLORS.PRIMARY[100]}`,
                }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Giao dịch gần đây
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/sales/invoice')}
                            >
                                Xem tất cả
                            </Button>
                        </Stack>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <Loading message="Đang tải dữ liệu dashboard..." size="medium" />
                            </Box>
                        ) : transactions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Chưa có giao dịch nào
                            </Typography>
                        ) : (
                            <TableContainer component={Paper} sx={{ boxShadow: 'none', maxHeight: 600, overflow: 'auto' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: COLORS.PRIMARY[50] }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Mã đơn hàng</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Phương thức</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Ngày giao dịch</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow
                                                key={transaction.id}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: COLORS.PRIMARY[50]
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    {transaction.order?.order_number || transaction.order_code || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.order?.full_name || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.order?.phone || '—'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[600] }}>
                                                    {formatCurrency(transaction.amount || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    {mapPaymentMethod(transaction.order?.payment_method)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={transaction.desc === 'success' ? 'Thành công' : transaction.desc || '—'}
                                                        color={transaction.desc === 'success' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {transaction.description || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transaction.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewDetails(transaction)}
                                                        sx={{ color: COLORS.PRIMARY[600] }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog chi tiết giao dịch */}
                <Dialog
                    open={detailDialogOpen}
                    onClose={handleCloseDetailDialog}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            boxShadow: 3
                        }
                    }}
                >
                    <DialogTitle sx={{
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pb: 1
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Chi tiết giao dịch
                        </Typography>
                        <IconButton
                            onClick={handleCloseDetailDialog}
                            size="small"
                        >
                            <ArrowBack />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ py: 2 }}>
                        {selectedTransaction && (
                            <Stack spacing={2.5}>
                                {/* Tóm tắt giao dịch */}
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 1.5,
                                        bgcolor: COLORS.BACKGROUND.NEUTRAL,
                                        border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={2}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                                    >
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Mã đơn hàng
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {selectedTransaction.order_code ||
                                                    selectedTransaction?.order?.payment_info?.order_code ||
                                                    selectedTransaction?.order?.order_number ||
                                                    '—'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Ngày tạo
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatDate(selectedTransaction.created_at)}
                                            </Typography>
                                        </Box>
                                        <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Số tiền giao dịch
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[600] }}>
                                                {formatVnd(selectedTransaction.amount)}
                                            </Typography>
                                            {selectedTransaction?.order && (
                                                <Chip
                                                    label={selectedTransaction.order.payment_status
                                                        ? mapPaymentStatus(selectedTransaction.order.payment_status)
                                                        : mapOrderStatus(selectedTransaction.order.status)}
                                                    color={(selectedTransaction.order.payment_status || selectedTransaction.order.status) === 'PAID' ? 'success' : 'default'}
                                                    size="small"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>

                                {/* Thông tin giao dịch */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.TEXT.PRIMARY }}>
                                        Thông tin giao dịch
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Mã giao dịch">
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                        {selectedTransaction.id || '—'}
                                                    </Typography>
                                                    {selectedTransaction.id && (
                                                        <Tooltip title={copiedText === 'transaction_id' ? 'Đã sao chép!' : 'Sao chép'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCopy(selectedTransaction.id, 'transaction_id')}
                                                                sx={{ p: 0.5 }}
                                                            >
                                                                {copiedText === 'transaction_id' ? (
                                                                    <CheckCircle fontSize="small" />
                                                                ) : (
                                                                    <ContentCopy fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Mã tham chiếu">
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                        {selectedTransaction.reference || '—'}
                                                    </Typography>
                                                    {selectedTransaction.reference && (
                                                        <Tooltip title={copiedText === 'reference' ? 'Đã sao chép!' : 'Sao chép'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCopy(selectedTransaction.reference, 'reference')}
                                                                sx={{ p: 0.5 }}
                                                            >
                                                                {copiedText === 'reference' ? (
                                                                    <CheckCircle fontSize="small" />
                                                                ) : (
                                                                    <ContentCopy fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <DetailItem label="Mô tả">
                                                <Typography variant="body2">
                                                    {selectedTransaction.description || '—'}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Trạng thái giao dịch">
                                                <Chip
                                                    label={mapTransactionStatus(selectedTransaction.desc)}
                                                    color={selectedTransaction.desc === 'success' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </DetailItem>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Thông tin đơn hàng */}
                                {selectedTransaction?.order && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.TEXT.PRIMARY }}>
                                            Thông tin đơn hàng
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Khách hàng / Người thanh toán">
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {selectedTransaction.order.full_name || '—'}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Số điện thoại">
                                                    <Typography variant="body2">
                                                        {selectedTransaction.order.phone || '—'}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <DetailItem label="Địa chỉ">
                                                    <Typography variant="body2">
                                                        {selectedTransaction.order.address || '—'}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Trạng thái đơn hàng">
                                                    <Chip
                                                        label={mapOrderStatus(selectedTransaction.order.status)}
                                                        color={selectedTransaction.order.status === 'PAID' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Phương thức thanh toán">
                                                    <Typography variant="body2">
                                                        {mapPaymentMethod(selectedTransaction.order.payment_method)}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Trạng thái thanh toán">
                                                    <Chip
                                                        label={mapPaymentStatus(selectedTransaction.order.payment_status)}
                                                        color={selectedTransaction.order.payment_status === 'PAID' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Loại đơn hàng">
                                                    <Typography variant="body2">
                                                        {selectedTransaction.order.type === 'CUSTOMER'
                                                            ? 'Khách hàng'
                                                            : selectedTransaction.order.type === 'EMPLOYEE'
                                                                ? 'Nhân viên'
                                                                : selectedTransaction.order.type || '—'}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Tổng tiền">
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {formatVnd(selectedTransaction.order.total_amount)}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Thành tiền">
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.SUCCESS[600] }}>
                                                        {formatVnd(selectedTransaction.order.final_amount)}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                            {selectedTransaction.order.order_date && selectedTransaction.order.order_date !== '0001-01-01T00:00:00' && (
                                                <Grid item xs={12} sm={6}>
                                                    <DetailItem label="Ngày đơn hàng">
                                                        <Typography variant="body2">
                                                            {formatDate(selectedTransaction.order.order_date)}
                                                        </Typography>
                                                    </DetailItem>
                                                </Grid>
                                            )}
                                            {selectedTransaction.order.notes && (
                                                <Grid item xs={12}>
                                                    <DetailItem label="Ghi chú">
                                                        <Typography variant="body2">
                                                            {selectedTransaction.order.notes}
                                                        </Typography>
                                                    </DetailItem>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 2, py: 1.5 }}>
                        <Button
                            onClick={handleCloseDetailDialog}
                            variant="contained"
                            sx={{ fontWeight: 500 }}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default DashboardPage;


