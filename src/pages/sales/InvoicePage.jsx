import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    TextField,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Grid,
    Link,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/loading/Loading";
import { ArrowBack, ContentCopy, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../constants/colors";
import { getTransactions } from "../../api/transactionsApi";

const formatVnd = (val) => {
    const n = Number(val || 0);
    return n.toLocaleString("vi-VN") + " VNĐ";
};

// Helper functions for Vietnamese localization
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

const mapPaymentInfoStatus = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'PENDING':
            return 'Đang chờ';
        case 'PAID':
            return 'Đã thanh toán';
        case 'EXPIRED':
            return 'Hết hạn';
        case 'CANCELLED':
            return 'Đã hủy';
        default:
            return status || 'Không xác định';
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

const InvoicePage = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [copiedText, setCopiedText] = useState(null);

    // Filter states
    const [orderCode, setOrderCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadTransactions = async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                page,
                limit,
            };

            if (orderCode.trim()) {
                params.OrderCode = orderCode.trim();
            }
            if (paymentMethod) {
                params.PaymentMethod = paymentMethod;
            }
            // Gửi Status lên API (nếu backend có hỗ trợ)
            if (status) {
                params.Status = status;
            }
            if (startDate) {
                params.StartDate = startDate;
            }
            if (endDate) {
                params.EndDate = endDate;
            }

            console.log('[InvoicePage] Request params:', params);
            const response = await getTransactions(params);
            console.log('[InvoicePage] Response data:', response);

            // Handle different response structures
            let data = [];
            let totalCount = 0;
            let totalPagesCount = 0;

            if (Array.isArray(response?.data)) {
                // Official structure: { data: [...], pagination: { total_items_count, total_pages_count, ... } }
                data = response.data;
                const pagination = response.pagination || {};
                totalCount =
                    pagination.total_items_count ??
                    response.total ??
                    response.totalCount ??
                    data.length;
                const pagesFromBackend =
                    pagination.total_pages_count ??
                    response.totalPages ??
                    response.total_pages;
                totalPagesCount =
                    typeof pagesFromBackend === 'number' && pagesFromBackend > 0
                        ? pagesFromBackend
                        : Math.ceil(totalCount / limit) || 1;
            } else if (Array.isArray(response)) {
                // Fallback: API trả về thẳng một mảng
                data = response;
                totalCount = data.length;
                totalPagesCount = Math.ceil(totalCount / limit) || 1;
            }

            // Backend hiện tại chưa filter đúng theo Status và PaymentMethod,
            // nên filter lại phía FE dựa trên order.status / order.payment_status / order.payment_method.
            let finalData = data;

            // Filter theo Status
            if (status) {
                const statusUpper = status.toUpperCase();
                finalData = finalData.filter((tx) => {
                    const orderStatus = (tx.order?.status || tx.order_status || '').toUpperCase();
                    const paymentStatus = (tx.order?.payment_status || tx.order_payment_status || '').toUpperCase();
                    const transactionStatus = (tx.desc || '').toUpperCase(); // success / failed / pending

                    // Ưu tiên order/payment status; fallback sang transaction desc nếu cần
                    if (orderStatus || paymentStatus) {
                        return orderStatus === statusUpper || paymentStatus === statusUpper;
                    }

                    // Map đơn giản giữa desc và Status nếu backend dùng desc cho trạng thái
                    if (statusUpper === 'PENDING') {
                        return transactionStatus === 'PENDING';
                    }
                    if (statusUpper === 'PAID' || statusUpper === 'SUCCESS') {
                        return transactionStatus === 'SUCCESS';
                    }
                    return false;
                });
            }

            // Filter theo PaymentMethod
            if (paymentMethod) {
                const methodUpper = paymentMethod.toUpperCase();
                finalData = finalData.filter((tx) => {
                    const orderPaymentMethod = (tx.order?.payment_method || tx.payment_method || '').toUpperCase();

                    // Map các giá trị có thể có
                    if (methodUpper === 'ONLINE' || methodUpper === 'QR') {
                        return orderPaymentMethod === 'ONLINE' || orderPaymentMethod === 'QR' || orderPaymentMethod === 'ONLINE_PAYMENT';
                    }
                    if (methodUpper === 'AT_COUNTER' || methodUpper === 'COUNTER') {
                        return orderPaymentMethod === 'AT_COUNTER' || orderPaymentMethod === 'COUNTER' || orderPaymentMethod === 'CASH';
                    }
                    if (methodUpper === 'CASH') {
                        return orderPaymentMethod === 'CASH' || orderPaymentMethod === 'AT_COUNTER';
                    }
                    if (methodUpper === 'CARD') {
                        return orderPaymentMethod === 'CARD' || orderPaymentMethod === 'CREDIT_CARD' || orderPaymentMethod === 'DEBIT_CARD';
                    }

                    return orderPaymentMethod === methodUpper;
                });
            }

            // Nếu có filter Status hoặc PaymentMethod, cập nhật total và totalPages
            // Và áp dụng client-side pagination cho filtered data
            if (status || paymentMethod) {
                totalCount = finalData.length;
                // Tính lại totalPages dựa trên số items sau khi filter và limit
                totalPagesCount = Math.ceil(totalCount / limit) || 1;

                // Áp dụng pagination cho filtered data
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                finalData = finalData.slice(startIndex, endIndex);
            } // Nếu không có filter, dữ liệu đã được paginate từ API dựa trên pagination của backend

            console.log('[InvoicePage] Pagination values:', {
                totalCount,
                totalPagesCount,
                limit,
                page,
                dataLength: finalData.length,
                shouldShowPagination: totalCount > limit || totalPagesCount > 1
            });

            setTransactions(finalData);
            setTotal(totalCount);
            setTotalPages(totalPagesCount);
        } catch (e) {
            setError(e.message || "Lỗi tải hóa đơn");
            setTransactions([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const prevFiltersRef = useRef({ orderCode, paymentMethod, status, startDate, endDate });

    useEffect(() => {
        // Check if filters changed (excluding page and limit)
        const filtersChanged =
            prevFiltersRef.current.orderCode !== orderCode ||
            prevFiltersRef.current.paymentMethod !== paymentMethod ||
            prevFiltersRef.current.status !== status ||
            prevFiltersRef.current.startDate !== startDate ||
            prevFiltersRef.current.endDate !== endDate;

        if (filtersChanged && page !== 1) {
            setPage(1);
            prevFiltersRef.current = { orderCode, paymentMethod, status, startDate, endDate };
            return; // Don't load yet, let the page change trigger the load
        }

        prevFiltersRef.current = { orderCode, paymentMethod, status, startDate, endDate };
        loadTransactions();
    }, [page, limit, orderCode, paymentMethod, status, startDate, endDate]);

    const renderStatus = (t) => {
        const status = t?.order?.status || t?.desc || t?.code;
        const color = (status || "").toUpperCase() === "PAID" ? "success" : "warning";
        const label = (status || "").toUpperCase() === "PAID"
            ? "Đã thanh toán"
            : (status || "").toUpperCase() === "PENDING"
                ? "Đang chờ"
                : status || "--";
        return <Chip size="small" color={color} label={label} sx={{ fontWeight: 700 }} />;
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

    const formatDate = (dateString) => {
        if (!dateString || dateString === '0001-01-01T00:00:00') return '—';
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

    return (
        <Box
            sx={{
                py: { xs: 2, md: 3 },
                minHeight: "100vh",
                background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                             radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                             radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`,
            }}
        >
            <Container maxWidth="xl">
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                        <IconButton
                            onClick={() => navigate("/sales/dashboard")}
                            sx={{
                                color: COLORS.ERROR[600],
                                backgroundColor: COLORS.ERROR[50],
                                "&:hover": {
                                    backgroundColor: COLORS.ERROR[100],
                                },
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600], letterSpacing: "-0.03em" }}>
                                Hóa đơn thanh toán
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                Xem và tra cứu các giao dịch đã thanh toán.
                            </Typography>
                        </Box>
                    </Box>
                </Stack>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {/* Filters Section */}
                <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 6, mb: 3 }}>
                    <Box sx={{ px: 3, py: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                            Bộ lọc
                        </Typography>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            sx={{
                                '& > *': {
                                    flex: 1,
                                    minWidth: 0
                                }
                            }}
                        >
                            <TextField
                                size="small"
                                label="Mã đơn hàng"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                placeholder="Nhập mã đơn hàng"
                            />
                            <FormControl size="small" sx={{ minWidth: 0, flex: '1 1 calc(20% + 2px)' }}>
                                <InputLabel>Phương thức thanh toán</InputLabel>
                                <Select
                                    value={paymentMethod}
                                    label="Phương thức thanh toán"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="ONLINE">Thanh toán online</MenuItem>
                                    <MenuItem value="AT_COUNTER">Tại quầy</MenuItem>
                                    <MenuItem value="CASH">Tiền mặt</MenuItem>
                                    <MenuItem value="CARD">Thẻ</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small">
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={status}
                                    label="Trạng thái"
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="PAID">Đã thanh toán</MenuItem>
                                    <MenuItem value="PENDING">Đang chờ</MenuItem>
                                    <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                                    <MenuItem value="REFUNDED">Đã hoàn tiền</MenuItem>
                                    <MenuItem value="EXPIRED">Hết hạn</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                size="small"
                                label="Từ ngày"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                size="small"
                                label="Đến ngày"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Stack>
                    </Box>
                </Paper>

                <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
                        <Typography sx={{ fontWeight: 700 }}>Danh sách hóa đơn</Typography>
                        <Chip label={`${total} hóa đơn`} color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Divider />
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                            <Loading message="Đang tải danh sách hóa đơn..." size="medium" />
                        </Box>
                    ) : (
                        <Box>
                            {transactions.length === 0 && (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography fontWeight={700}>Không có hóa đơn</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Vui lòng thử lại hoặc thay đổi bộ lọc.
                                    </Typography>
                                </Box>
                            )}

                            {transactions.map((t, idx) => {
                                const order = t.order || {};
                                const payInfo = order.payment_info || {};
                                const orderCode = t.order_code || payInfo.order_code || order.order_number || "--";
                                return (
                                    <React.Fragment key={t.id || idx}>
                                        <Box
                                            sx={{
                                                px: 3,
                                                py: 2,
                                                cursor: "pointer",
                                                '&:hover': { backgroundColor: "rgba(244,67,54,0.04)" },
                                            }}
                                            onClick={() => setSelected({ ...t, order })}
                                        >
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                                        Mã đơn hàng: {orderCode}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {t.description || order?.full_name || ""}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5, display: 'block' }}>
                                                        Ngày tạo: {formatDate(t.created_at || order?.order_date)}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Typography sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                                                        {formatVnd(t.amount || order?.final_amount || 0)}
                                                    </Typography>
                                                    {renderStatus(t)}
                                                </Stack>
                                            </Stack>
                                        </Box>
                                        {idx !== transactions.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            })}

                            {/* Pagination */}
                            {totalPages > 0 && total > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        itemsPerPage={limit}
                                        onItemsPerPageChange={(newLimit) => {
                                            setLimit(newLimit);
                                            setPage(1);
                                        }}
                                        totalItems={total}
                                        showItemsPerPage={true}
                                        itemsPerPageOptions={[10, 20, 50, 100]}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </Paper>
            </Container>

            <Dialog
                open={!!selected}
                onClose={() => setSelected(null)}
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
                        Chi tiết hóa đơn
                    </Typography>
                    <IconButton
                        onClick={() => setSelected(null)}
                        size="small"
                    >
                        <ArrowBack />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 2 }}>
                    {selected && (
                        <Stack spacing={2.5}>
                            {/* Tóm tắt hóa đơn */}
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
                                            {selected.order_code ||
                                                selected?.order?.payment_info?.order_code ||
                                                selected?.order?.order_number ||
                                                '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                            Ngày tạo
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate(selected.created_at)}
                                        </Typography>
                                    </Box>
                                    <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Số tiền giao dịch
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[600] }}>
                                            {formatVnd(selected.amount)}
                                        </Typography>
                                        {selected?.order && (
                                            <Chip
                                                label={selected.order.payment_status
                                                    ? mapPaymentStatus(selected.order.payment_status)
                                                    : mapOrderStatus(selected.order.status)}
                                                color={(selected.order.payment_status || selected.order.status) === 'PAID' ? 'success' : 'default'}
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
                                                    {selected.id || '—'}
                                                </Typography>
                                                {selected.id && (
                                                    <Tooltip title={copiedText === 'transaction_id' ? 'Đã sao chép!' : 'Sao chép'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(selected.id, 'transaction_id')}
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
                                                    {selected.reference || '—'}
                                                </Typography>
                                                {selected.reference && (
                                                    <Tooltip title={copiedText === 'reference' ? 'Đã sao chép!' : 'Sao chép'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(selected.reference, 'reference')}
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
                                                {selected.description || '—'}
                                            </Typography>
                                        </DetailItem>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItem label="Trạng thái giao dịch">
                                            <Chip
                                                label={mapTransactionStatus(selected.desc)}
                                                color={selected.desc === 'success' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </DetailItem>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Thông tin đơn hàng */}
                            {selected?.order && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.TEXT.PRIMARY }}>
                                        Thông tin đơn hàng
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Khách hàng / Người thanh toán">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selected.order.full_name || '—'}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Số điện thoại">
                                                <Typography variant="body2">
                                                    {selected.order.phone || '—'}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <DetailItem label="Địa chỉ">
                                                <Typography variant="body2">
                                                    {selected.order.address || '—'}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Trạng thái đơn hàng">
                                                <Chip
                                                    label={mapOrderStatus(selected.order.status)}
                                                    color={selected.order.status === 'PAID' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Phương thức thanh toán">
                                                <Typography variant="body2">
                                                    {mapPaymentMethod(selected.order.payment_method)}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Trạng thái thanh toán">
                                                <Chip
                                                    label={mapPaymentStatus(selected.order.payment_status)}
                                                    color={selected.order.payment_status === 'PAID' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Loại đơn hàng">
                                                <Typography variant="body2">
                                                    {selected.order.type === 'CUSTOMER'
                                                        ? 'Khách hàng'
                                                        : selected.order.type === 'EMPLOYEE'
                                                            ? 'Nhân viên'
                                                            : selected.order.type || '—'}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Tổng tiền">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {formatVnd(selected.order.total_amount)}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItem label="Thành tiền">
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.SUCCESS[600] }}>
                                                    {formatVnd(selected.order.final_amount)}
                                                </Typography>
                                            </DetailItem>
                                        </Grid>
                                        {selected.order.order_date && selected.order.order_date !== '0001-01-01T00:00:00' && (
                                            <Grid item xs={12} sm={6}>
                                                <DetailItem label="Ngày đơn hàng">
                                                    <Typography variant="body2">
                                                        {formatDate(selected.order.order_date)}
                                                    </Typography>
                                                </DetailItem>
                                            </Grid>
                                        )}
                                        {selected.order.notes && (
                                            <Grid item xs={12}>
                                                <DetailItem label="Ghi chú">
                                                    <Typography variant="body2">
                                                        {selected.order.notes}
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
                        onClick={() => setSelected(null)}
                        variant="contained"
                        sx={{ fontWeight: 500 }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoicePage;
