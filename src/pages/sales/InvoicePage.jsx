import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    TextField,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { COLORS } from "../../constants/colors";

const formatVnd = (val) => {
    const n = Number(val || 0);
    return n.toLocaleString("vi-VN") + " ₫";
};

const InvoicePage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [searchCode, setSearchCode] = useState("");

    const loadTransactions = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("authToken");
            const resp = await fetch("https://petcafes.azurewebsites.net/api/transactions", {
                headers: {
                    Accept: "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
            if (!resp.ok) {
                throw new Error("Không thể tải danh sách hóa đơn");
            }
            const json = await resp.json();
            const data = Array.isArray(json?.data) ? json.data : [];
            setTransactions(data);
        } catch (e) {
            setError(e.message || "Lỗi tải hóa đơn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const filtered = useMemo(() => {
        if (!searchCode.trim()) return transactions;
        const code = searchCode.trim().toLowerCase();
        return transactions.filter((t) => {
            const oc = String(t.order_code || t?.order?.order_number || "").toLowerCase();
            const desc = String(t.description || "").toLowerCase();
            return oc.includes(code) || desc.includes(code);
        });
    }, [transactions, searchCode]);

    const renderStatus = (t) => {
        const status = t?.order?.status || t?.desc || t?.code;
        const color = (status || "").toUpperCase() === "PAID" ? "success" : "warning";
        return <Chip size="small" color={color} label={status || "--"} sx={{ fontWeight: 700 }} />;
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
            <Container maxWidth="lg">
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600], letterSpacing: "-0.03em" }}>
                            Hóa đơn thanh toán
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                            Xem và tra cứu các giao dịch đã thanh toán.
                        </Typography>
                    </Box>
                    <TextField
                        size="small"
                        label="Tìm theo OrderCode / mô tả"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        sx={{ minWidth: { xs: "100%", sm: 280 } }}
                    />
                </Stack>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
                        <Typography sx={{ fontWeight: 700 }}>Danh sách hóa đơn</Typography>
                        <Chip label={`${filtered.length} hóa đơn`} color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Divider />
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                            <CircularProgress color="error" />
                        </Box>
                    ) : (
                        <Box>
                            {filtered.length === 0 && (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography fontWeight={700}>Không có hóa đơn</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Vui lòng thử lại hoặc thay đổi từ khóa tìm kiếm.
                                    </Typography>
                                </Box>
                            )}

                            {filtered.map((t, idx) => {
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
                                                        OrderCode: {orderCode}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {t.description || order?.full_name || ""}
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
                                        {idx !== filtered.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            </Container>

            <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết hóa đơn</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography fontWeight={700}>OrderCode</Typography>
                                <Typography>{selected.order_code || selected?.order?.payment_info?.order_code || selected?.order?.order_number || "--"}</Typography>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography fontWeight={700}>Thông tin giao dịch</Typography>
                                <Typography>Mã tham chiếu: {selected.reference || "--"}</Typography>
                                <Typography>Mô tả: {selected.description || "--"}</Typography>
                                <Typography>Số tiền: {formatVnd(selected.amount)}</Typography>
                                <Typography>Mã phản hồi: {selected.code || "--"} ({selected.desc || ""})</Typography>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography fontWeight={700}>Thông tin đơn hàng</Typography>
                                <Typography>Khách/Người thanh toán: {selected?.order?.full_name || "--"}</Typography>
                                <Typography>SĐT: {selected?.order?.phone || "--"}</Typography>
                                <Typography>Địa chỉ: {selected?.order?.address || "--"}</Typography>
                                <Typography>Trạng thái đơn: {selected?.order?.status || "--"}</Typography>
                                <Typography>Phương thức: {selected?.order?.payment_method || "--"}</Typography>
                                <Typography>Tổng: {formatVnd(selected?.order?.total_amount)}</Typography>
                                <Typography>Giảm giá: {formatVnd(selected?.order?.discount_amount)}</Typography>
                                <Typography>Thành tiền: {formatVnd(selected?.order?.final_amount)}</Typography>
                            </Box>
                            {selected?.order?.payment_info && (
                                <>
                                    <Divider />
                                    <Box>
                                        <Typography fontWeight={700}>Payment Info</Typography>
                                        <Typography>CheckoutUrl: {selected.order.payment_info.checkout_url || "--"}</Typography>
                                        <Typography>QR: {selected.order.payment_info.qr_code || "--"}</Typography>
                                        <Typography>Trạng thái: {selected.order.payment_info.status || "--"}</Typography>
                                    </Box>
                                </>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelected(null)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoicePage;
