import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Link, Divider, IconButton, InputAdornment, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Visibility, VisibilityOff, Google, Pets, Coffee } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { authApi } from '../../api/authApi';

const RegisterPage = () => {
    const navigate = useNavigate();

    // State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Event handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (!formData.fullName.trim()) {
                setError('Vui lòng nhập họ và tên!');
                return;
            }

            if (!authApi.validateEmail(formData.email)) {
                setError('Định dạng email không hợp lệ');
                return;
            }

            const passwordValidation = authApi.validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                setError(passwordValidation.errors[0]);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp!');
                return;
            }

            setIsLoading(true);

            const response = await authApi.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || ''
            });

            if (response.success) {
                console.log('Registration successful:', response.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    // Styles
    const inputStyles = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            fontSize: { xs: '0.9rem', md: '1rem' },
            background: `linear-gradient(135deg, 
                ${COLORS.COMMON.WHITE} 0%, 
                ${alpha(COLORS.SECONDARY[50], 0.2)} 100%
            )`,
            '& input': {
                py: { xs: 1.2, md: 1.5 }
            },
            '&:hover fieldset': {
                borderColor: COLORS.SECONDARY[400],
                borderWidth: 2,
                boxShadow: `0 0 0 2px ${alpha(COLORS.SECONDARY[200], 0.2)}`
            },
            '&.Mui-focused fieldset': {
                borderColor: COLORS.ERROR[400],
                borderWidth: 2,
                boxShadow: `0 0 0 3px ${alpha(COLORS.ERROR[200], 0.3)}`
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <Loading
                fullScreen={true}
                variant="dots"
                size="large"
                message="Đang tạo tài khoản Pet Cafe..."
            />
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                background: `
                    radial-gradient(circle at 25% 25%, ${alpha(COLORS.SECONDARY[200], 0.6)} 0%, transparent 60%),
                    radial-gradient(circle at 75% 75%, ${alpha(COLORS.WARNING[200], 0.5)} 0%, transparent 60%),
                    radial-gradient(circle at 50% 10%, ${alpha(COLORS.ERROR[100], 0.4)} 0%, transparent 50%),
                    linear-gradient(135deg, 
                        ${COLORS.SECONDARY[50]} 0%, 
                        ${alpha(COLORS.WARNING[50], 0.9)} 25%,
                        ${alpha(COLORS.ERROR[50], 0.8)} 50%,
                        ${alpha(COLORS.SECONDARY[100], 0.6)} 100%
                    )
                `,
                position: 'relative',
            }}
        >
            {/* Static decorative elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '15%',
                    left: '8%',
                    zIndex: 1,
                    opacity: 0.6,
                    display: { xs: 'none', lg: 'block' }
                }}
            >
                <Coffee sx={{ fontSize: { lg: 40, xl: 50 }, color: alpha(COLORS.SECONDARY[400], 0.7) }} />
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    zIndex: 1,
                    fontSize: { lg: 35, xl: 40 },
                    opacity: 0.5,
                    display: { xs: 'none', lg: 'block' }
                }}
            >
                🐾
            </Box>

            {/* Left Panel - Brand Section */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: `
                        radial-gradient(circle at 30% 20%, ${alpha(COLORS.ERROR[400], 0.9)} 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, ${alpha(COLORS.SECONDARY[400], 0.8)} 0%, transparent 50%),
                        linear-gradient(135deg, 
                            ${COLORS.ERROR[500]} 0%, 
                            ${COLORS.ERROR[600]} 25%,
                            ${COLORS.SECONDARY[500]} 75%,
                            ${COLORS.SECONDARY[600]} 100%
                        )
                    `,
                    color: COLORS.COMMON.WHITE,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Static decorative circles */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        right: '15%',
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, 
                            ${alpha(COLORS.SECONDARY[300], 0.3)} 0%, 
                            ${alpha(COLORS.WARNING[200], 0.2)} 100%
                        )`,
                        boxShadow: `0 4px 16px ${alpha(COLORS.SECONDARY[300], 0.1)}`
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '25%',
                        left: '10%',
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, 
                            ${alpha(COLORS.ERROR[200], 0.25)} 0%, 
                            ${alpha(COLORS.SECONDARY[200], 0.2)} 100%
                        )`,
                        boxShadow: `0 3px 12px ${alpha(COLORS.ERROR[200], 0.1)}`
                    }}
                />

                <Box sx={{ textAlign: 'center', zIndex: 2, px: { md: 4, lg: 6 } }}>
                    <Pets sx={{ fontSize: { md: 60, lg: 80, xl: 100 }, mb: { md: 2, lg: 3 }, opacity: 0.9 }} />
                    <Typography
                        variant="h2"
                        fontWeight="bold"
                        sx={{
                            mb: { md: 1.5, lg: 2 },
                            fontSize: { md: '2.5rem', lg: '3rem', xl: '3.5rem' }
                        }}
                    >
                        Pet Cafe
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            opacity: 0.9,
                            mb: { md: 3, lg: 4 },
                            lineHeight: 1.4,
                            fontSize: { md: '1.3rem', lg: '1.5rem', xl: '1.7rem' },
                            px: { md: 2, lg: 0 }
                        }}
                    >
                        Tham gia cộng đồng yêu thương động vật cùng chúng tôi
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 6 }}>
                        <Box sx={{
                            width: 80,
                            height: 6,
                            background: `linear-gradient(90deg, ${COLORS.SECONDARY[200]} 0%, ${COLORS.WARNING[300]} 100%)`,
                            borderRadius: 3,
                            boxShadow: `0 2px 8px ${alpha(COLORS.SECONDARY[200], 0.3)}`
                        }} />
                        <Box sx={{
                            width: 40,
                            height: 6,
                            background: `linear-gradient(90deg, ${COLORS.ERROR[200]} 0%, ${COLORS.SECONDARY[300]} 100%)`,
                            borderRadius: 3,
                            boxShadow: `0 2px 8px ${alpha(COLORS.ERROR[200], 0.3)}`
                        }} />
                        <Box sx={{
                            width: 20,
                            height: 6,
                            background: `linear-gradient(90deg, ${COLORS.INFO[200]} 0%, ${COLORS.PRIMARY[300]} 100%)`,
                            borderRadius: 3,
                            boxShadow: `0 2px 8px ${alpha(COLORS.INFO[200], 0.3)}`
                        }} />
                    </Box>
                </Box>
            </Box>

            {/* Right Panel - Register Form */}
            <Box
                sx={{
                    flex: { xs: 1, md: 0.6 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `
                        linear-gradient(135deg, 
                            ${COLORS.COMMON.WHITE} 0%, 
                            ${alpha(COLORS.SECONDARY[50], 0.3)} 100%
                        )
                    `,
                    position: 'relative',
                    zIndex: 2
                }}
            >
                <Container
                    maxWidth="lg"
                    sx={{
                        py: { xs: 3, md: 5 },
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        px: { xs: 2, sm: 3, md: 4 }
                    }}
                >
                    <Box sx={{
                        maxWidth: { xs: '100%', sm: 450, md: 520 },
                        mx: 'auto',
                        width: '100%'
                    }}>
                        {/* Header Section */}
                        <Box sx={{ mb: { xs: 2.5, md: 3.5 }, textAlign: 'center' }}>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{
                                    mb: { xs: 0.5, md: 1 },
                                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Đăng ký
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: alpha(COLORS.TEXT.SECONDARY, 0.8),
                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                    fontWeight: 400,
                                    px: { xs: 2, md: 0 }
                                }}
                            >
                                Tạo tài khoản để trải nghiệm Pet Cafe
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Social Register Section */}
                        <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Google />}
                                sx={{
                                    py: { xs: 1.8, md: 2 },
                                    px: { xs: 3, md: 4 },
                                    borderRadius: 3,
                                    borderColor: '#db4437',
                                    color: '#db4437',
                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                    fontWeight: 500,
                                    textTransform: 'none',
                                    background: `linear-gradient(135deg, 
                                    ${alpha('#db4437', 0.05)} 0%, 
                                    ${alpha(COLORS.SECONDARY[100], 0.3)} 100%
                                )`,
                                    '&:hover': {
                                        borderColor: '#db4437',
                                        background: `linear-gradient(135deg, 
                                            ${alpha('#db4437', 0.05)} 0%, 
                                            ${alpha(COLORS.SECONDARY[100], 0.3)} 100%
                                        )`,
                                        boxShadow: `0 4px 12px ${alpha('#db4437', 0.2)}`,
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Đăng ký với Google
                            </Button>
                        </Box>

                        <Divider sx={{ my: { xs: 2, md: 2.5 }, borderColor: alpha(COLORS.SECONDARY[200], 0.6) }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    px: { xs: 1.5, md: 2 },
                                    py: 0.5,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, 
                                        ${alpha(COLORS.SECONDARY[100], 0.3)} 0%, 
                                        ${alpha(COLORS.WARNING[100], 0.2)} 100%
                                    )`,
                                    color: COLORS.TEXT.SECONDARY,
                                    fontWeight: 500,
                                    fontSize: { xs: '0.8rem', md: '0.9rem' }
                                }}
                            >
                                ☕ Hoặc
                            </Typography>
                        </Divider>

                        {/* Register Form */}
                        <Box component="form" onSubmit={handleSubmit}>
                            {/* Full Name Field */}
                            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mb: { xs: 0.8, md: 1 },
                                        color: COLORS.TEXT.PRIMARY,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '0.9rem', md: '0.95rem' }
                                    }}
                                >
                                    👤 Họ và tên
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên của bạn"
                                    variant="outlined"
                                    required
                                    sx={inputStyles}
                                />
                            </Box>

                            {/* Email Field */}
                            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mb: { xs: 0.8, md: 1 },
                                        color: COLORS.TEXT.PRIMARY,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '0.9rem', md: '0.95rem' }
                                    }}
                                >
                                    📧 Email
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Nhập địa chỉ email của bạn"
                                    variant="outlined"
                                    required
                                    sx={inputStyles}
                                />
                            </Box>

                            {/* Password Field */}
                            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mb: { xs: 0.8, md: 1 },
                                        color: COLORS.TEXT.PRIMARY,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '0.9rem', md: '0.95rem' }
                                    }}
                                >
                                    🔐 Mật khẩu
                                </Typography>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                    variant="outlined"
                                    required
                                    sx={inputStyles}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: alpha(COLORS.TEXT.SECONDARY, 0.7) }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Box>

                            {/* Confirm Password Field */}
                            <Box sx={{ mb: { xs: 3, md: 4 } }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mb: { xs: 0.8, md: 1 },
                                        color: COLORS.TEXT.PRIMARY,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '0.9rem', md: '0.95rem' }
                                    }}
                                >
                                    🔒 Xác nhận mật khẩu
                                </Typography>
                                <TextField
                                    fullWidth
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Nhập lại mật khẩu"
                                    variant="outlined"
                                    required
                                    sx={inputStyles}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                    sx={{ color: alpha(COLORS.TEXT.SECONDARY, 0.7) }}
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                sx={{
                                    py: { xs: 2.5, md: 3 },
                                    mb: { xs: 3, md: 4 },
                                    mt: { xs: 1, md: 2 },
                                    borderRadius: 2,
                                    background: `
                                        radial-gradient(circle at 30% 30%, ${COLORS.ERROR[400]} 0%, transparent 70%),
                                        linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[500]} 100%)
                                                `,
                                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    boxShadow: `
                                        0 6px 20px ${alpha(COLORS.ERROR[400], 0.3)},
                                        0 3px 8px ${alpha(COLORS.SECONDARY[400], 0.2)},
                                        inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.2)}
                                    `,
                                    '&:hover': {
                                        background: `
                                            radial-gradient(circle at 30% 30%, ${COLORS.ERROR[500]} 0%, transparent 70%),
                                            linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.SECONDARY[600]} 100%)
                                        `,
                                        transform: 'translateY(-1px)',
                                        boxShadow: `
                                            0 8px 25px ${alpha(COLORS.ERROR[400], 0.4)},
                                            0 4px 12px ${alpha(COLORS.SECONDARY[400], 0.3)},
                                            inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.3)}
                                        `
                                    },
                                    '&:disabled': {
                                        background: `linear-gradient(135deg, ${COLORS.GRAY[300]} 0%, ${COLORS.GRAY[400]} 100%)`,
                                        transform: 'none'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                            </Button>

                            {/* Footer */}
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: alpha(COLORS.TEXT.SECONDARY, 0.8),
                                        fontSize: { xs: '0.9rem', md: '1rem' },
                                        lineHeight: 1.6,
                                        px: { xs: 1, md: 0 }
                                    }}
                                >
                                    Đã có tài khoản?{' '}
                                    <Link
                                        onClick={handleLoginRedirect}
                                        sx={{
                                            color: COLORS.ERROR[500],
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            background: `linear-gradient(135deg, 
                                                ${alpha(COLORS.ERROR[100], 0.2)} 0%, 
                                                ${alpha(COLORS.SECONDARY[100], 0.1)} 100%
                                            )`,
                                            px: { xs: 1.2, md: 1.5 },
                                            py: 0.3,
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: { xs: 'inline-block', sm: 'inline' },
                                            mt: { xs: 0.5, sm: 0 },
                                            '&:hover': {
                                                textDecoration: 'underline',
                                                background: `linear-gradient(135deg, 
                                                    ${alpha(COLORS.ERROR[200], 0.3)} 0%, 
                                                    ${alpha(COLORS.SECONDARY[200], 0.2)} 100%
                                                )`,
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        Đăng nhập ngay! 🚀
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default RegisterPage;
