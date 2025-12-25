import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Divider,
    Chip,
    CircularProgress,
    Button,
    Grid,
    Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { COLORS } from "../../constants/colors";
import { formatPrice } from "../../utils/formatPrice";
import { ArrowBack, ReceiptLong, CalendarToday, AccessTime, LocationOn, Pets, TaskAlt, PendingActions, CreditCard, Paid, QrCode2 } from "@mui/icons-material";

const formatVnd = (v) => (Number(v || 0)).toLocaleString("vi-VN") + " VNĐ";
const formatPaymentMethod = (m) => {
    if (!m) return "--";
    if (m === "AT_COUNTER" || m === "CASH") return "Tiền mặt";
    if (m === "ONLINE") return "Chuyển khoản/QR";
    return m;
};

const ServiceBookingDetailPage = () => {
    const { orderId } = useParams(); // GUID của order
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("authToken");

                // 1) Order detail
                const orderResp = await fetch(`https://petcafes.azurewebsites.net/api/orders/${orderId}`, {
                    headers: {
                        Accept: "application/json",
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                });
                if (!orderResp.ok) throw new Error("Không thể tải đơn dịch vụ");
                const orderJson = await orderResp.json();
                setOrder(orderJson);

                // 2) Transactions - tìm theo order_code (order_number)
                const orderCode = Number(orderJson?.order_number || orderJson?.order_code);
                if (orderCode) {
                    const transResp = await fetch(`https://petcafes.azurewebsites.net/api/transactions`, {
                        headers: {
                            Accept: "application/json",
                            Authorization: token ? `Bearer ${token}` : "",
                        },
                    });
                    if (transResp.ok) {
                        const transJson = await transResp.json();
                        const list = Array.isArray(transJson?.data) ? transJson.data : [];
                        const found = list.find((t) => Number(t.order_code) === orderCode);
                        setInvoice(found || null);
                    }
                }
            } catch (e) {
                setError(e.message || "Lỗi tải chi tiết");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [orderId]);

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress color="error" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (!order) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography>Không tìm thấy đơn hàng.</Typography>
            </Box>
        );
    }

    const services = order?.service_order?.order_details || [];
    const payInfo = order?.payment_info || {};
    const orderCode = order?.order_number || order?.order_code;
    const paymentStatus = (order?.payment_status || order?.status || "").toUpperCase();
    const paymentChip = paymentStatus === "PAID"
        ? { label: "Đã thanh toán", color: "success", icon: <TaskAlt fontSize="small" /> }
        : paymentStatus === "PENDING"
            ? { label: "Chờ thanh toán", color: "warning", icon: <PendingActions fontSize="small" /> }
            : { label: paymentStatus || "Không rõ", color: "default", icon: <PendingActions fontSize="small" /> };

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
            <Container maxWidth="lg">
                <Paper
                    sx={{
                        borderRadius: 3,
                        p: { xs: 2.5, md: 3 },
                        boxShadow: 8,
                        background: `linear-gradient(135deg, ${alpha(COLORS.COMMON.WHITE, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.6)})`,
                        border: `1px solid ${alpha(COLORS.ERROR[100], 0.7)}`,
                    }}
                >
                    <Grid container spacing={3}>
                        {/* Cột trái: Tổng quan + dịch vụ */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={2.5}>
                                <Paper
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)}, ${alpha(COLORS.SECONDARY[50], 0.4)})`,
                                        border: `1px solid ${alpha(COLORS.ERROR[100], 0.7)}`,
                                    }}
                                >
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start" justifyContent="space-between">
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: COLORS.ERROR[500], width: 42, height: 42 }}>
                                                <ReceiptLong sx={{ color: "white" }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                                    Order #{orderCode || "--"}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    Khách hàng: {order.full_name || "--"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            icon={paymentChip.icon}
                                            label={paymentChip.label}
                                            color={paymentChip.color}
                                            sx={{ fontWeight: 700, minWidth: 150 }}
                                        />
                                    </Stack>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>SĐT</Typography>
                                            <Typography fontWeight={700}>{order.phone || "--"}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>Phương thức</Typography>
                                            <Typography fontWeight={700}>{formatPaymentMethod(order.payment_method)}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>Địa chỉ</Typography>
                                            <Typography fontWeight={700}>{order.address || "--"}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CalendarToday sx={{ color: COLORS.ERROR[500], fontSize: 20 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                            Dịch vụ đã đặt
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                        {services.length === 0 && (
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Không có dịch vụ.
                                            </Typography>
                                        )}
                                        {services.map((d, idx) => (
                                            <Paper
                                                key={idx}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    background: alpha(COLORS.ERROR[50], 0.45),
                                                    border: `1px solid ${alpha(COLORS.ERROR[100], 0.8)}`,
                                                    boxShadow: 2,
                                                }}
                                            >
                                                <Stack spacing={0.75}>
                                                    <Typography sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY }}>
                                                        {d.service?.name || d.service_name || `Dịch vụ ${idx + 1}`}
                                                    </Typography>
                                                    {d.unit_price && (
                                                        <Typography sx={{ fontWeight: 700, color: COLORS.ERROR[600] }}>
                                                            Giá: {formatVnd(d.unit_price)}
                                                        </Typography>
                                                    )}
                                                    {d.booking_date && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <CalendarToday sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                            <Typography variant="body2">
                                                                {new Date(d.booking_date).toLocaleString("vi-VN")}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {d.slot && d.slot.start_time && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <AccessTime sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                            <Typography variant="body2">
                                                                {d.slot.start_time?.substring(0, 5)} - {d.slot.end_time?.substring(0, 5)}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {d.slot?.area && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <LocationOn sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                            <Typography variant="body2">
                                                                {d.slot.area.name} {d.slot.area.location ? `(${d.slot.area.location})` : ""}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {d.slot?.pet_group && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Pets sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                            <Typography variant="body2">Nhóm thú cưng: {d.slot.pet_group.name}</Typography>
                                                        </Stack>
                                                    )}
                                                    {d.notes && (
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            Ghi chú: {d.notes}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Cột phải: Tổng tiền + hóa đơn + payment info */}
                        <Grid item xs={12} md={5}>
                            <Stack spacing={2.5}>
                                <Paper
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        boxShadow: 4,
                                        background: `linear-gradient(160deg, ${alpha(COLORS.ERROR[50], 0.9)}, ${alpha(COLORS.SECONDARY[50], 0.7)})`,
                                        border: `1px solid ${alpha(COLORS.ERROR[100], 0.8)}`,
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CreditCard sx={{ color: COLORS.ERROR[600] }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                            Thanh toán
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Stack spacing={1}>
                                        <Typography>Tổng: <b>{formatVnd(order.total_amount)}</b></Typography>
                                        <Typography>Giảm giá: <b>{formatVnd(order.discount_amount)}</b></Typography>
                                        <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.ERROR[700] }}>
                                            Thành tiền: {formatVnd(order.final_amount)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Phương thức: {formatPaymentMethod(order.payment_method)}
                                        </Typography>
                                    </Stack>
                                </Paper>

                                <Paper
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        boxShadow: 4,
                                        background: alpha(COLORS.SUCCESS?.[50] || "#E8F5E9", 0.8),
                                        border: `1px solid ${alpha(COLORS.SUCCESS?.[100] || "#C8E6C9", 0.8)}`,
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Paid sx={{ color: COLORS.ERROR[600] }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                            Hóa đơn
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ my: 1.2 }} />
                                    {invoice ? (
                                        <Stack spacing={0.6}>
                                            <Chip
                                                label={`Code: ${invoice.order_code} • ${invoice.desc || invoice.code || ""}`}
                                                color="success"
                                                size="small"
                                                sx={{ fontWeight: 700, alignSelf: "flex-start" }}
                                            />
                                            <Typography>Mã tham chiếu: {invoice.reference || "--"}</Typography>
                                            <Typography>Mô tả: {invoice.description || "--"}</Typography>
                                            <Typography>Số tiền: {formatVnd(invoice.amount)}</Typography>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Chưa tìm thấy hóa đơn cho đơn này.
                                        </Typography>
                                    )}
                                </Paper>

                                {payInfo && (payInfo.checkout_url || payInfo.qr_code) && (
                                    <Paper
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2.5,
                                            boxShadow: 3,
                                            background: alpha(COLORS.INFO?.[50] || "#E3F2FD", 0.9),
                                            border: `1px solid ${alpha(COLORS.INFO?.[100] || "#BBDEFB", 0.8)}`,
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <QrCode2 sx={{ color: COLORS.ERROR[600] }} />
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                                Payment Info
                                            </Typography>
                                        </Stack>
                                        <Divider sx={{ my: 1.2 }} />
                                        {payInfo.checkout_url && (
                                            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                                Link thanh toán: {payInfo.checkout_url}
                                            </Typography>
                                        )}
                                        {payInfo.qr_code && (
                                            <Typography variant="body2" sx={{ wordBreak: "break-all", mt: 0.5 }}>
                                                QR: {payInfo.qr_code}
                                            </Typography>
                                        )}
                                    </Paper>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default ServiceBookingDetailPage;
