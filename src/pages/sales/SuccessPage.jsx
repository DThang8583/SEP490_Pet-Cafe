import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Container } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ py: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
            <Container maxWidth="sm">
                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}` }}>
                    <CardContent>
                        <Stack alignItems="center" spacing={2}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 64 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Thanh toán thành công!</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <Button variant="contained" color="error" onClick={() => navigate('/sales/invoices')}>Xem hóa đơn</Button>
                                <Button variant="outlined" color="error" onClick={() => navigate('/sales/sales')}>Tiếp tục bán hàng</Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default SuccessPage;


