import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Grid, Card, CardContent, TextField, Button, Stack,
    Divider, Chip, Alert, CircularProgress, FormControl,
    FormLabel, RadioGroup, FormControlLabel, Radio, InputAdornment,
    alpha, Fade, Zoom, Paper
} from '@mui/material';
import {
    Payment, CreditCard, AccountBalance, Smartphone,
    Security, CheckCircle, Close, AttachMoney,
    Schedule, Person, Pets, LocationOn
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const PaymentModal = ({ open, onClose, bookingData, onPaymentComplete }) => {
    // Debug booking data
    console.log('PaymentModal - bookingData:', bookingData);

    // State management
    const [paymentMethod, setPaymentMethod] = useState('qr_transfer');
    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
        bankAccount: '',
        phoneNumber: ''
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1); // 1: Payment Info, 2: Processing, 3: Success

    // Payment methods
    const paymentMethods = [
        {
            id: 'qr_transfer',
            name: 'Chuyển khoản thông qua QR code',
            icon: <AccountBalance />,
            description: 'Quét mã QR để chuyển khoản',
            fee: 0
        },
        {
            id: 'counter_payment',
            name: 'Thanh toán trực tiếp tại quầy',
            icon: <Payment />,
            description: 'Thanh toán khi đến quầy',
            fee: 0
        }
    ];

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setStep(1);
            setProcessing(false);
            setErrors({});
            setPaymentData({
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                cardName: '',
                bankAccount: '',
                phoneNumber: ''
            });
        }
    }, [open]);

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Format card number
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    // Format expiry date
    const formatExpiryDate = (value) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    // Handle payment data change
    const handlePaymentDataChange = (field, value) => {
        let formattedValue = value;

        if (field === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (field === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
        } else if (field === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
        }

        setPaymentData(prev => ({
            ...prev,
            [field]: formattedValue
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate payment form
    const validatePaymentForm = () => {
        const newErrors = {};

        if (paymentMethod === 'credit_card') {
            if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
                newErrors.cardNumber = 'Số thẻ không hợp lệ';
            }
            if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
                newErrors.expiryDate = 'Ngày hết hạn không hợp lệ (MM/YY)';
            }
            if (!paymentData.cvv || paymentData.cvv.length < 3) {
                newErrors.cvv = 'CVV không hợp lệ';
            }
            if (!paymentData.cardName.trim()) {
                newErrors.cardName = 'Vui lòng nhập tên chủ thẻ';
            }
        } else if (paymentMethod === 'bank_transfer') {
            if (!paymentData.bankAccount.trim()) {
                newErrors.bankAccount = 'Vui lòng nhập số tài khoản';
            }
        } else if (paymentMethod === 'e_wallet') {
            if (!paymentData.phoneNumber || !/^[0-9]{10,11}$/.test(paymentData.phoneNumber.replace(/\s/g, ''))) {
                newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Process payment
    const processPayment = async () => {
        if (!validatePaymentForm()) {
            return;
        }

        setProcessing(true);
        setStep(2);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate payment success (90% success rate)
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                setStep(3);

                // Prepare payment result
                const paymentResult = {
                    paymentId: `PAY_${Date.now()}`,
                    paymentMethod,
                    amount: bookingData.service?.price || 0,
                    status: 'completed',
                    transactionDate: new Date().toISOString(),
                    paymentData: {
                        ...paymentData,
                        // Mask sensitive data
                        cardNumber: paymentMethod === 'credit_card' ?
                            '**** **** **** ' + paymentData.cardNumber.slice(-4) : undefined
                    }
                };

                setTimeout(() => {
                    onPaymentComplete(paymentResult);
                }, 2000);
            } else {
                throw new Error('Thanh toán thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            setErrors({ payment: error.message });
            setStep(1);
        } finally {
            setProcessing(false);
        }
    };

    // Render payment form based on method
    const renderPaymentForm = () => {
        switch (paymentMethod) {

            case 'qr_transfer':
                return (
                    <Stack spacing={3}>
                        <Alert severity="info">
                            Chuyển khoản thông qua QR code của Pet Cafe
                        </Alert>

                        <Box sx={{
                            p: 3,
                            backgroundColor: alpha(COLORS.INFO[100], 0.3),
                            borderRadius: 3,
                            border: `1px solid ${alpha(COLORS.INFO[300], 0.5)}`,
                            textAlign: 'center'
                        }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                                Quét mã QR để thanh toán
                            </Typography>
                            <Box sx={{
                                width: 200,
                                height: 200,
                                backgroundColor: COLORS.GRAY[100],
                                border: `2px dashed ${COLORS.GRAY[300]}`,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                            }}>
                                <Typography variant="body2" color="text.secondary">
                                    QR Code sẽ hiển thị ở đây
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản
                            </Typography>
                        </Box>

                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha(COLORS.SUCCESS[100], 0.3),
                            borderRadius: 3,
                            border: `1px solid ${alpha(COLORS.SUCCESS[300], 0.5)}`
                        }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Thông tin chuyển khoản:
                            </Typography>
                            <Typography variant="body2">
                                <strong>Ngân hàng:</strong> Vietcombank<br />
                                <strong>Số tài khoản:</strong> 1234567890<br />
                                <strong>Chủ tài khoản:</strong> Pet Cafe Co., Ltd<br />
                                <strong>Nội dung:</strong> BOOKING_{bookingData.service?.id}
                            </Typography>
                        </Box>
                    </Stack>
                );

            case 'counter_payment':
                return (
                    <Stack spacing={3}>
                        <Alert severity="success">
                            Thanh toán trực tiếp tại quầy khi đến Pet Cafe
                        </Alert>

                        <Box sx={{
                            p: 3,
                            backgroundColor: alpha(COLORS.SUCCESS[100], 0.3),
                            borderRadius: 3,
                            border: `1px solid ${alpha(COLORS.SUCCESS[300], 0.5)}`,
                            textAlign: 'center'
                        }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                                Hướng dẫn thanh toán
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                1. Đến Pet Cafe theo đúng giờ đã đặt<br />
                                2. Thanh toán trực tiếp tại quầy<br />
                                3. Nhận hóa đơn và bắt đầu dịch vụ
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                💡 Lưu ý: Vui lòng mang theo thông tin đặt lịch để xác nhận
                            </Typography>
                        </Box>

                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha(COLORS.INFO[100], 0.3),
                            borderRadius: 3,
                            border: `1px solid ${alpha(COLORS.INFO[300], 0.5)}`
                        }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Thông tin liên hệ:
                            </Typography>
                            <Typography variant="body2">
                                <strong>Địa chỉ:</strong> 123 Đường Pet Cafe, Quận 1, TP.HCM<br />
                                <strong>Điện thoại:</strong> 0901 234 567<br />
                                <strong>Giờ mở cửa:</strong> 8:00 - 20:00 (Hàng ngày)
                            </Typography>
                        </Box>
                    </Stack>
                );

            default:
                return null;
        }
    };

    if (!bookingData) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    background: `linear-gradient(135deg, 
                        ${COLORS.BACKGROUND.DEFAULT} 0%, 
                        ${alpha(COLORS.SECONDARY[50], 0.8)} 100%
                    )`
                }
            }}
        >
            <DialogTitle sx={{
                background: `linear-gradient(135deg, 
                    ${COLORS.ERROR[500]} 0%, 
                    ${COLORS.SECONDARY[500]} 100%
                )`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Payment />
                    <Typography variant="h6" fontWeight="bold">
                        Thanh toán dịch vụ
                    </Typography>
                </Box>
                <Button
                    onClick={onClose}
                    sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                >
                    <Close />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {step === 1 && (
                    <Fade in timeout={500}>
                        <Box sx={{ p: 4 }}>
                            <Grid container spacing={4}>
                                {/* Left Column - Booking Summary */}
                                <Grid item xs={12} md={5}>
                                    <Card sx={{
                                        background: `linear-gradient(135deg, 
                                            ${alpha(COLORS.WARNING[50], 0.8)} 0%, 
                                            ${alpha(COLORS.SECONDARY[50], 0.6)} 100%
                                        )`,
                                        border: `2px solid ${alpha(COLORS.WARNING[200], 0.3)}`
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: COLORS.WARNING[700] }}>
                                                Chi tiết đặt lịch
                                            </Typography>

                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Dịch vụ
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {bookingData.service?.name}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Thời gian
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {bookingData.date && bookingData.time ?
                                                            `${new Date(bookingData.date).toLocaleDateString('vi-VN')} - ${bookingData.time}` :
                                                            'Chưa chọn thời gian'
                                                        }
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Thú cưng
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {bookingData.petInfo ?
                                                            `${bookingData.petInfo.species} - ${bookingData.petInfo.breed} (${bookingData.petInfo.weight}kg)` :
                                                            'Chưa có thông tin thú cưng'
                                                        }
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Khách hàng
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {bookingData.customerInfo?.name}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {bookingData.customerInfo?.phone}
                                                    </Typography>
                                                </Box>

                                                <Divider />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Tổng tiền:
                                                    </Typography>
                                                    <Typography variant="h5" sx={{
                                                        color: COLORS.ERROR[600],
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {formatPrice(bookingData.service?.price || 0)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Right Column - Payment Form */}
                                <Grid item xs={12} md={7}>
                                    <Stack spacing={4}>
                                        {/* Payment Method Selection */}
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: COLORS.ERROR[600] }}>
                                                Chọn phương thức thanh toán
                                            </Typography>

                                            <FormControl component="fieldset" fullWidth>
                                                <RadioGroup
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                >
                                                    <Stack spacing={2}>
                                                        {paymentMethods.map((method) => (
                                                            <Card key={method.id} sx={{
                                                                border: paymentMethod === method.id ?
                                                                    `2px solid ${COLORS.ERROR[500]}` :
                                                                    `2px solid ${alpha(COLORS.GRAY[300], 0.5)}`,
                                                                backgroundColor: paymentMethod === method.id ?
                                                                    alpha(COLORS.ERROR[100], 0.2) : 'transparent',
                                                                cursor: 'pointer'
                                                            }}>
                                                                <CardContent sx={{ p: 2 }}>
                                                                    <FormControlLabel
                                                                        value={method.id}
                                                                        control={<Radio />}
                                                                        label={
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                                                <Box sx={{ color: COLORS.ERROR[500] }}>
                                                                                    {method.icon}
                                                                                </Box>
                                                                                <Box sx={{ flex: 1 }}>
                                                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                                                        {method.name}
                                                                                    </Typography>
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        {method.description}
                                                                                    </Typography>
                                                                                </Box>
                                                                                {method.fee > 0 && (
                                                                                    <Chip
                                                                                        label={`+${formatPrice(method.fee)}`}
                                                                                        size="small"
                                                                                        color="warning"
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        }
                                                                        sx={{ margin: 0, width: '100%' }}
                                                                    />
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </Stack>
                                                </RadioGroup>
                                            </FormControl>
                                        </Box>

                                        {/* Payment Form */}
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: COLORS.ERROR[600] }}>
                                                Thông tin thanh toán
                                            </Typography>

                                            {renderPaymentForm()}
                                        </Box>

                                        {/* Security Notice */}
                                        <Alert severity="info" icon={<Security />}>
                                            Thông tin thanh toán của bạn được bảo mật bằng mã hóa SSL 256-bit
                                        </Alert>

                                        {errors.payment && (
                                            <Alert severity="error">
                                                {errors.payment}
                                            </Alert>
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                )}

                {step === 2 && (
                    <Zoom in timeout={500}>
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                            <CircularProgress size={80} sx={{ color: COLORS.ERROR[500], mb: 3 }} />
                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                                Đang xử lý thanh toán...
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Vui lòng không đóng cửa sổ này
                            </Typography>
                        </Box>
                    </Zoom>
                )}

                {step === 3 && (
                    <Zoom in timeout={500}>
                        <Box sx={{ p: 3 }}>
                            {/* Bill Header */}
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <CheckCircle sx={{ fontSize: 60, color: COLORS.SUCCESS[500], mb: 2 }} />
                                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: COLORS.SUCCESS[600] }}>
                                    🎉 Thanh toán thành công!
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Hóa đơn thanh toán dịch vụ Pet Cafe
                                </Typography>
                            </Box>

                            {/* Bill Content */}
                            <Paper sx={{
                                p: 3,
                                border: `2px solid ${COLORS.SUCCESS[300]}`,
                                borderRadius: 2,
                                backgroundColor: alpha(COLORS.SUCCESS[50], 0.3)
                            }}>
                                {/* Bill Header */}
                                <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: `1px solid ${COLORS.GRAY[300]}` }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.PRIMARY[700] }}>
                                        🐾 PET CAFE 🐾
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        123 Đường Pet Cafe, Quận 1, TP.HCM
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ĐT: 0901 234 567 | Email: info@petcafe.com
                                    </Typography>
                                </Box>

                                {/* Booking Details */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: COLORS.PRIMARY[700] }}>
                                        📋 Thông tin đặt lịch
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Dịch vụ:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {bookingData.service?.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Thời gian:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {bookingData.date && bookingData.time ?
                                                `${new Date(bookingData.date).toLocaleDateString('vi-VN')} - ${bookingData.time}` :
                                                'Chưa chọn thời gian'
                                            }
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Thú cưng:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {bookingData.petInfo ?
                                                `${bookingData.petInfo.species} - ${bookingData.petInfo.breed} (${bookingData.petInfo.weight}kg)` :
                                                'Chưa có thông tin'
                                            }
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Khách hàng:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {bookingData.customerInfo?.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">SĐT:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {bookingData.customerInfo?.phone}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Payment Details */}
                                <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(COLORS.INFO[100], 0.5), borderRadius: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: COLORS.INFO[700] }}>
                                        💳 Thông tin thanh toán
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Phương thức:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {paymentMethod === 'qr_transfer' ? 'Chuyển khoản QR Code' : 'Thanh toán tại quầy'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Trạng thái:</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.SUCCESS[600] }}>
                                            ✅ Đã thanh toán
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Thời gian thanh toán:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {new Date().toLocaleString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Mã giao dịch:</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                            TXN_{Date.now().toString().slice(-8)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Total Amount */}
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.3),
                                    borderRadius: 1,
                                    border: `2px solid ${COLORS.ERROR[300]}`
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: COLORS.ERROR[700] }}>
                                            Tổng tiền:
                                        </Typography>
                                        <Typography variant="h5" fontWeight="bold" sx={{ color: COLORS.ERROR[700] }}>
                                            {formatPrice(bookingData.service?.price || 0)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Counter Payment Notice */}
                                {paymentMethod === 'counter_payment' && (
                                    <Box sx={{
                                        mt: 2,
                                        p: 2,
                                        backgroundColor: alpha(COLORS.WARNING[100], 0.5),
                                        borderRadius: 1,
                                        border: `2px solid ${COLORS.WARNING[400]}`,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: COLORS.WARNING[700] }}>
                                            ⚠️ THANH TOÁN TẠI QUẦY
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.WARNING[600], mt: 0.5 }}>
                                            Vui lòng thanh toán khi đến Pet Cafe theo đúng giờ đã đặt
                                        </Typography>
                                    </Box>
                                )}

                                {/* Footer */}
                                <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: `1px solid ${COLORS.GRAY[300]}` }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Cảm ơn bạn đã sử dụng dịch vụ Pet Cafe! 🐾
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Hóa đơn này có giá trị xác nhận thanh toán
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Zoom>
                )}
            </DialogContent>

            {step === 1 && (
                <DialogActions sx={{ p: 3, gap: 2 }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: COLORS.GRAY[600],
                            '&:hover': {
                                backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={processPayment}
                        disabled={processing}
                        sx={{
                            px: 4,
                            py: 1.5,
                            background: `linear-gradient(135deg, 
                                ${COLORS.ERROR[500]} 0%, 
                                ${COLORS.ERROR[600]} 100%
                            )`,
                            '&:hover': {
                                background: `linear-gradient(135deg, 
                                    ${COLORS.ERROR[600]} 0%, 
                                    ${COLORS.ERROR[700]} 100%
                                )`
                            }
                        }}
                    >
                        Thanh toán {formatPrice(bookingData.service?.price || 0)}
                    </Button>
                </DialogActions>
            )}

            {step === 3 && (
                <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => window.print()}
                        startIcon={<Payment />}
                        sx={{
                            borderColor: COLORS.PRIMARY[500],
                            color: COLORS.PRIMARY[600],
                            '&:hover': {
                                borderColor: COLORS.PRIMARY[600],
                                backgroundColor: alpha(COLORS.PRIMARY[100], 0.3)
                            }
                        }}
                    >
                        🖨️ In hóa đơn
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{
                            px: 4,
                            py: 1.5,
                            background: `linear-gradient(135deg, 
                                ${COLORS.SUCCESS[500]} 0%, 
                                ${COLORS.SUCCESS[600]} 100%
                            )`,
                            '&:hover': {
                                background: `linear-gradient(135deg, 
                                    ${COLORS.SUCCESS[600]} 0%, 
                                    ${COLORS.SUCCESS[700]} 100%
                                )`
                            }
                        }}
                    >
                        ✅ Hoàn thành
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default PaymentModal;
