import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Link, Divider, IconButton, InputAdornment, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Visibility, VisibilityOff, Pets, Coffee } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { authApi } from '../../api/authApi';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const LoginPage = () => {
    const navigate = useNavigate();

    // State
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
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
        setIsLoading(true);
        setError('');

        try {
            if (!authApi.validateEmail(formData.email)) {
                setError('Định dạng email không hợp lệ');
                setIsLoading(false);
                return;
            }

            const response = await authApi.login({
                email: formData.email,
                password: formData.password
            });

            if (response.success) {
                console.log('Login successful:', response.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterRedirect = () => {
        navigate('/register');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            console.log('Google credentialResponse:', credentialResponse);
            if (!credentialResponse?.credential) {
                setError('Không nhận được thông tin từ Google');
                return;
            }

            // Decode ID token để xem thông tin user Google (log phục vụ debug)
            try {
                const token = credentialResponse.credential;
                const payload = token.split('.')[1];
                const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
                const decoded = JSON.parse(atob(padded));
                console.log('Google ID token payload (user info):', decoded);
            } catch (e) {
                console.warn('Không decode được ID token:', e);
            }

            setIsLoading(true);
            const res = await authApi.loginWithGoogle(credentialResponse.credential);
            console.log('Backend loginWithGoogle response:', res);
            if (res?.success) {
                console.log('Google login successful:', res.user);
                navigate('/');
            }
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Đăng nhập Google thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Có lỗi xảy ra khi đăng nhập bằng Google.');
    };

    // Styles
    const inputStyles = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            fontSize: { xs: '1rem', md: '1.2rem' },
            background: `linear-gradient(135deg, 
                ${COLORS.COMMON.WHITE} 0%, 
                ${alpha(COLORS.SECONDARY[50], 0.2)} 100%
            )`,
            '& input': {
                py: { xs: 1.5, md: 2 }
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
                variant="cafe"
                size="large"
                message="Đang đăng nhập vào Pet Cafe..."
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
                        Không gian ấm cúng cho bạn và những người bạn bốn chân
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

            {/* Right Panel - Login Form */}
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
                        <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center' }}>
                            <Typography
                                variant="h3"
                                fontWeight="bold"
                                sx={{
                                    mb: { xs: 1, md: 1.5 },
                                    fontSize: { xs: '2rem', sm: '2.5rem', md: '2.8rem' },
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Đăng nhập
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: alpha(COLORS.TEXT.SECONDARY, 0.8),
                                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                    fontWeight: 400,
                                    px: { xs: 2, md: 0 }
                                }}
                            >
                                Chào mừng bạn quay trở lại Pet Cafe
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Social Login Section */}
                        <Box sx={{ mb: { xs: 3, md: 4 } }}>
                            <GoogleOAuthProvider clientId="829602505083-adjjt91m6u0onmff18put1uad5u9qk9j.apps.googleusercontent.com">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                    />
                                </Box>
                            </GoogleOAuthProvider>
                        </Box>

                        <Divider sx={{ my: { xs: 2.5, md: 3.5 }, borderColor: alpha(COLORS.SECONDARY[200], 0.6) }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    px: { xs: 2, md: 3 },
                                    py: 1,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, 
                                        ${alpha(COLORS.SECONDARY[100], 0.3)} 0%, 
                                        ${alpha(COLORS.WARNING[100], 0.2)} 100%
                                    )`,
                                    color: COLORS.TEXT.SECONDARY,
                                    fontWeight: 500,
                                    fontSize: { xs: '0.9rem', md: '1rem' }
                                }}
                            >
                                ☕ Hoặc đăng nhập với email
                            </Typography>
                        </Divider>

                        {/* Login Form */}
                        <Box component="form" onSubmit={handleSubmit}>
                            <Box sx={{ mb: { xs: 3, md: 3.5 } }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: { xs: 1.5, md: 2 },
                                        color: COLORS.TEXT.PRIMARY,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: '1rem', md: '1.05rem' }
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

                            <Box sx={{ mb: { xs: 4, md: 4.5 } }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 1, sm: 0 },
                                    mb: { xs: 1.5, md: 2 }
                                }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: COLORS.TEXT.PRIMARY,
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            fontSize: { xs: '1rem', md: '1.05rem' }
                                        }}
                                    >
                                        🔐 Mật khẩu
                                    </Typography>
                                    <Link
                                        href="#"
                                        sx={{
                                            color: COLORS.ERROR[500],
                                            textDecoration: 'none',
                                            fontSize: { xs: '0.9rem', md: '1rem' },
                                            fontWeight: 500,
                                            background: `linear-gradient(135deg, 
                                                ${alpha(COLORS.ERROR[100], 0.4)} 0%, 
                                                ${alpha(COLORS.SECONDARY[100], 0.2)} 100%
                                            )`,
                                            px: { xs: 1.5, md: 2 },
                                            py: 0.5,
                                            borderRadius: 2,
                                            alignSelf: { xs: 'flex-start', sm: 'auto' },
                                            '&:hover': {
                                                textDecoration: 'underline',
                                                background: `linear-gradient(135deg, 
                                                    ${alpha(COLORS.ERROR[200], 0.5)} 0%, 
                                                    ${alpha(COLORS.SECONDARY[200], 0.3)} 100%
                                                )`,
                                                transform: 'translateY(-1px)'
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </Box>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mật khẩu"
                                    variant="outlined"
                                    required
                                    sx={inputStyles}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: COLORS.TEXT?.SECONDARY || '#6b7280' }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
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
                                    mt: { xs: 0.5, md: 1 },
                                    borderRadius: 3,
                                    background: `
                                        radial-gradient(circle at 30% 30%, ${COLORS.ERROR[400]} 0%, transparent 70%),
                                        linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.SECONDARY[500]} 100%)
                                                `,
                                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' },
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    boxShadow: `
                                        0 8px 25px ${alpha(COLORS.ERROR[400], 0.4)},
                                        0 4px 12px ${alpha(COLORS.SECONDARY[400], 0.3)},
                                        inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.2)}
                                    `,
                                    '&:hover': {
                                        background: `
                                            radial-gradient(circle at 30% 30%, ${COLORS.ERROR[500]} 0%, transparent 70%),
                                            linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.SECONDARY[600]} 100%)
                                        `,
                                        transform: 'translateY(-2px)',
                                        boxShadow: `
                                            0 12px 35px ${alpha(COLORS.ERROR[400], 0.5)},
                                            0 6px 16px ${alpha(COLORS.SECONDARY[400], 0.4)},
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
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Button>

                            {/* Footer */}
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: alpha(COLORS.TEXT.SECONDARY, 0.8),
                                        fontSize: { xs: '1rem', md: '1.05rem' },
                                        lineHeight: 1.6,
                                        px: { xs: 1, md: 0 }
                                    }}
                                >
                                    Chưa có tài khoản? 🐾{' '}
                                    <Link
                                        onClick={handleRegisterRedirect}
                                        sx={{
                                            color: COLORS.ERROR[500],
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            background: `linear-gradient(135deg, 
                                                ${alpha(COLORS.ERROR[100], 0.3)} 0%, 
                                                ${alpha(COLORS.SECONDARY[100], 0.2)} 100%
                                            )`,
                                            px: { xs: 1.5, md: 2 },
                                            py: 0.5,
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: { xs: 'inline-block', sm: 'inline' },
                                            mt: { xs: 1, sm: 0 },
                                            '&:hover': {
                                                textDecoration: 'underline',
                                                background: `linear-gradient(135deg, 
                                                    ${alpha(COLORS.ERROR[200], 0.4)} 0%, 
                                                    ${alpha(COLORS.SECONDARY[200], 0.3)} 100%
                                                )`,
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        Đăng ký ngay! 🎉
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

export default LoginPage;