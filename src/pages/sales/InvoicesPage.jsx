import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider, Stack } from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { salesApi, authApi } from '../../api/authApi';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const role = authApi.getUserRole();
                if (role !== 'sales_staff' && role !== 'manager') throw new Error('Không có quyền');
                const res = await salesApi.getInvoices();
                setInvoices(res?.data || []);
            } catch (e) {
                setError(e.message || 'Không thể tải hóa đơn');
            }
        };
        load();
    }, []);

    return (
        <Box sx={{
            p: 3,
            minHeight: '100vh',
            background: `radial-gradient(900px 260px at -10% -10%, ${COLORS.ERROR[50]}, transparent 60%),
                         radial-gradient(900px 260px at 110% 0%, ${COLORS.INFO[50]}, transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Hóa đơn</Typography>
                <Chip color="error" label="Invoices" sx={{ fontWeight: 700 }} />
            </Box>

            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            <Grid container spacing={2}>
                {invoices.map((inv) => (
                    <Grid key={inv.id} item xs={12} md={6} lg={4}>
                        <Card sx={{ borderRadius: 3, border: `2px solid ${COLORS.ERROR[100]}` }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        <ReceiptLong sx={{ verticalAlign: 'middle', mr: 1 }} /> {inv.id}
                                    </Typography>
                                    <Chip size="small" label={inv.status === 'paid' ? 'Đã thanh toán' : inv.status} color="success" />
                                </Box>
                                <Typography>Khách hàng: {inv.customerId}</Typography>
                                <Typography>Tổng tiền: {inv.total?.toLocaleString('vi-VN')} ₫</Typography>
                                <Typography>Ngày tạo: {inv.createdAt}</Typography>
                                {Array.isArray(inv.items) && inv.items.length > 0 && (
                                    <>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Sản phẩm/Dịch vụ</Typography>
                                        <Stack spacing={0.5}>
                                            {inv.items.map((it, idx) => (
                                                <Typography key={idx} sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {(it.name || it.productName || it.title || 'Mặt hàng')} × {it.quantity} — {(it.price || 0).toLocaleString('vi-VN')} ₫
                                                </Typography>
                                            ))}
                                        </Stack>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default InvoicesPage;


