import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    alpha,
    Fade
} from '@mui/material';
import {
    ErrorOutline,
    Home,
    ShoppingCart
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const BookingPaymentFailedPage = () => {
    const navigate = useNavigate();

    return (
        <Fade in timeout={800}>
            <Box
                sx={{
                    py: { xs: 3, md: 4 },
                    minHeight: '100vh',
                    background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.7)}, transparent 60%),
                                 radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.4)}, transparent 60%),
                                 ${COLORS.BACKGROUND.NEUTRAL}`
                }}
            >
                <Box
                    sx={{
                        maxWidth: 720,
                        mx: 'auto',
                        px: { xs: 2, sm: 3 },
                    }}
                >
                    <Card
                        sx={{
                            borderRadius: 4,
                            boxShadow: 8,
                            border: `1px solid ${alpha(COLORS.ERROR[300], 0.8)}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER,
                            overflow: 'hidden'
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Stack spacing={3} alignItems="center" textAlign="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                    <ErrorOutline sx={{ fontSize: 64, color: COLORS.ERROR[500] }} />
                                </Box>

                                <Box>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 900,
                                            color: COLORS.ERROR[700],
                                            mb: 1
                                        }}
                                    >
                                        Thanh toán thất bại
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Giao dịch không thành công hoặc đã bị hủy. Vui lòng thử lại thanh toán
                                        hoặc liên hệ nhân viên để được hỗ trợ.
                                    </Typography>
                                </Box>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    sx={{ pt: 1, alignSelf: 'stretch' }}
                                >
                                    <Button
                                        variant="outlined"
                                        startIcon={<Home />}
                                        fullWidth
                                        onClick={() => navigate('/home')}
                                        sx={{
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Về trang chủ
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<ShoppingCart />}
                                        fullWidth
                                        onClick={() => navigate('/booking')}
                                        sx={{
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Đặt lại dịch vụ
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Fade>
    );
};

export default BookingPaymentFailedPage;

