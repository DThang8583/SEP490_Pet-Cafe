import React, { useState } from 'react';
import {
    Box, Container, TextField, Button, Typography, Checkbox, FormControlLabel, Link, Divider, Stack, IconButton, InputAdornment, Fade, Zoom, useTheme, alpha, Card, CardContent
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Email, Lock, LocalCafe, Favorite, Star, Coffee, Pets, Cake } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const LoginPage = () => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            console.log('Login data:', formData);
            setIsLoading(false);
        }, 2000);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `
                    radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.4)} 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, ${alpha(COLORS.WARNING[100], 0.4)} 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, ${alpha(COLORS.PRIMARY[100], 0.3)} 0%, transparent 50%),
                    linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[50], 0.9)} 50%, ${alpha(COLORS.WARNING[50], 0.7)} 100%)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 15% 15%, ${alpha(COLORS.ERROR[100], 0.1)} 0%, transparent 20%),
                        radial-gradient(circle at 85% 85%, ${alpha(COLORS.SECONDARY[100], 0.1)} 0%, transparent 20%),
                        radial-gradient(circle at 50% 20%, ${alpha(COLORS.PRIMARY[100], 0.1)} 0%, transparent 25%),
                        radial-gradient(circle at 20% 80%, ${alpha(COLORS.WARNING[100], 0.1)} 0%, transparent 25%)
                    `,
                    pointerEvents: 'none'
                }
            }}
        >
            {/* Cute floating elements */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '8%',
                        left: '8%',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(COLORS.ERROR[200], 0.3)}, transparent)`,
                        animation: 'float 6s ease-in-out infinite'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '12%',
                        right: '10%',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(COLORS.SECONDARY[200], 0.3)}, transparent)`,
                        animation: 'float 7s ease-in-out infinite 1s'
                    },
                    '@keyframes float': {
                        '0%, 100%': {
                            transform: 'translateY(0px) rotate(0deg)',
                            opacity: 0.6
                        },
                        '50%': {
                            transform: 'translateY(-20px) rotate(10deg)',
                            opacity: 0.8
                        }
                    }
                }}
            />

            {/* Cute drink and pet icons */}
            {/* <Box
                sx={{
                    position: 'absolute',
                    top: '15%',
                    right: '12%',
                    animation: 'bounce 4s ease-in-out infinite',
                    '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                        '50%': { transform: 'translateY(-15px) scale(1.1)' }
                    }
                }}
            >
                <LocalCafe sx={{ fontSize: 45, color: alpha(COLORS.SECONDARY[500], 0.7) }} />
            </Box> */}
            {/* <Box
                sx={{
                    position: 'absolute',
                    bottom: '25%',
                    left: '8%',
                    animation: 'bounce 5s ease-in-out infinite 1s',
                    '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                        '50%': { transform: 'translateY(-12px) scale(1.1)' }
                    }
                }}
            >
                <Pets sx={{ fontSize: 40, color: alpha(COLORS.ERROR[400], 0.7) }} />
            </Box> */}
            {/* <Box
                sx={{
                    position: 'absolute',
                    top: '30%',
                    left: '5%',
                    animation: 'bounce 6s ease-in-out infinite 2s',
                    '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                        '50%': { transform: 'translateY(-10px) scale(1.1)' }
                    }
                }}
            >
                <Cake sx={{ fontSize: 35, color: alpha(COLORS.ERROR[300], 0.7) }} />
            </Box> */}
            {/* <Box
                sx={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '8%',
                    animation: 'bounce 4.5s ease-in-out infinite 0.5s',
                    '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                        '50%': { transform: 'translateY(-8px) scale(1.1)' }
                    }
                }}
            >
            </Box> */}

            <Container maxWidth="sm">
                <Zoom in timeout={800}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 8,
                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                            backdropFilter: 'blur(25px)',
                            border: `3px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `
                                0 30px 60px ${alpha(COLORS.ERROR[200], 0.2)},
                                inset 0 1px 0 ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)},
                                0 0 0 1px ${alpha(COLORS.ERROR[200], 0.1)}
                            `,
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                background: `linear-gradient(90deg, 
                                    ${COLORS.ERROR[300]} 0%, 
                                    ${COLORS.SECONDARY[300]} 25%, 
                                    ${COLORS.WARNING[300]} 50%, 
                                    ${COLORS.INFO[300]} 75%, 
                                    ${COLORS.ERROR[300]} 100%
                                )`
                            }
                        }}
                    >
                        <CardContent sx={{ p: 6 }}>
                            {/* Cute Header */}
                            <Fade in timeout={1000}>
                                <Box sx={{ textAlign: 'center', mb: 5 }}>
                                    {/* Cute Logo */}
                                    <Box
                                        sx={{
                                            width: 140,
                                            height: 140,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 3,
                                            boxShadow: `
                                                0 20px 40px ${alpha(COLORS.ERROR[300], 0.4)},
                                                inset 0 2px 4px ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)}
                                            `,
                                            position: 'relative',
                                            '&:hover': {
                                                transform: 'scale(1.05) rotate(5deg)',
                                                transition: 'all 0.4s ease'
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: -10,
                                                right: -10,
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                background: COLORS.ERROR[500],
                                                animation: 'pulse 2s infinite',
                                                boxShadow: `0 0 15px ${alpha(COLORS.ERROR[500], 0.6)}`
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -8,
                                                left: -8,
                                                width: 25,
                                                height: 25,
                                                borderRadius: '50%',
                                                background: COLORS.INFO[400],
                                                animation: 'pulse 2.5s infinite 0.5s',
                                                boxShadow: `0 0 12px ${alpha(COLORS.INFO[400], 0.6)}`
                                            }
                                        }}
                                    >
                                        <LocalCafe sx={{ fontSize: 70, color: 'white' }} />
                                    </Box>

                                    <Typography
                                        variant="h2"
                                        component="h1"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 'bold',
                                            color: COLORS.ERROR[500],
                                            textShadow: `2px 2px 4px ${alpha(COLORS.ERROR[300], 0.5)}`,
                                            mb: 2,
                                            fontFamily: '"Comic Sans MS", cursive'
                                        }}
                                    >
                                        Pet Cafe
                                    </Typography>

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: COLORS.SECONDARY[600],
                                            mb: 3,
                                            fontStyle: 'italic',
                                            fontWeight: 500,
                                            textShadow: `1px 1px 2px ${alpha(COLORS.SECONDARY[50], 0.8)}`
                                        }}
                                    >
                                        🐾 Nơi gặp gỡ ấm áp của những người yêu thú cưng ☕
                                    </Typography>

                                </Box>
                            </Fade>

                            {/* Cute Login Form */}
                            <Fade in timeout={1200}>
                                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                                    <Stack spacing={3}>
                                        {/* Email Field */}
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            variant="outlined"
                                            placeholder="Nhập email của bạn"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Email sx={{ color: COLORS.ERROR[500] }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 6,
                                                    backgroundColor: alpha(COLORS.SECONDARY[50], 0.8),
                                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                                                    '&:hover': {
                                                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.9),
                                                        borderColor: COLORS.ERROR[300],
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 8px 25px ${alpha(COLORS.ERROR[200], 0.2)}`
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: COLORS.SECONDARY[50],
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 8px 25px ${alpha(COLORS.ERROR[200], 0.3)}`,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: COLORS.ERROR[500],
                                                            borderWidth: 2,
                                                        },
                                                    },
                                                },
                                                '& .MuiInputLabel-root.Mui-focused': {
                                                    color: COLORS.ERROR[500],
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        />

                                        {/* Password Field */}
                                        <TextField
                                            fullWidth
                                            label="Mật khẩu"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            variant="outlined"
                                            placeholder="Nhập mật khẩu"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock sx={{ color: COLORS.INFO[500] }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            edge="end"
                                                            sx={{
                                                                color: COLORS.INFO[500],
                                                                '&:hover': {
                                                                    backgroundColor: alpha(COLORS.INFO[500], 0.1),
                                                                    transform: 'scale(1.1)'
                                                                }
                                                            }}
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 6,
                                                    backgroundColor: alpha(COLORS.SECONDARY[50], 0.8),
                                                    border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                                                    '&:hover': {
                                                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.9),
                                                        borderColor: COLORS.INFO[300],
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 8px 25px ${alpha(COLORS.INFO[200], 0.2)}`
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: COLORS.SECONDARY[50],
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 8px 25px ${alpha(COLORS.INFO[200], 0.3)}`,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: COLORS.INFO[500],
                                                            borderWidth: 2,
                                                        },
                                                    },
                                                },
                                                '& .MuiInputLabel-root.Mui-focused': {
                                                    color: COLORS.INFO[500],
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        />

                                        {/* Remember Me & Forgot Password */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        sx={{
                                                            color: COLORS.ERROR[500],
                                                            '&.Mui-checked': {
                                                                color: COLORS.ERROR[500],
                                                            },
                                                        }}
                                                    />
                                                }
                                                label="Ghi nhớ đăng nhập"
                                                sx={{
                                                    '& .MuiFormControlLabel-label': {
                                                        color: COLORS.SECONDARY[600],
                                                        fontWeight: 500
                                                    }
                                                }}
                                            />
                                            <Link
                                                href="#"
                                                sx={{
                                                    color: COLORS.ERROR[500],
                                                    textDecoration: 'none',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                        color: COLORS.ERROR[600]
                                                    },
                                                }}
                                            >
                                                Quên mật khẩu?
                                            </Link>
                                        </Box>

                                        {/* Cute Login Button */}
                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            disabled={isLoading}
                                            startIcon={<Pets />}
                                            sx={{
                                                py: 3,
                                                borderRadius: 6,
                                                background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                                                boxShadow: `
                                                    0 15px 35px ${alpha(COLORS.ERROR[300], 0.4)},
                                                    inset 0 1px 0 ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)}
                                                `,
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `
                                                        0 20px 45px ${alpha(COLORS.ERROR[300], 0.5)},
                                                        inset 0 1px 0 ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)}
                                                    `,
                                                },
                                                '&:disabled': {
                                                    background: alpha(COLORS.ERROR[300], 0.5),
                                                },
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            {isLoading ? 'Đang chuẩn bị...' : 'Đăng nhập'}
                                        </Button>
                                    </Stack>

                                    {/* Cute Divider */}
                                    <Box sx={{ my: 4 }}>
                                        <Divider sx={{ position: 'relative' }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    backgroundColor: COLORS.SECONDARY[50],
                                                    px: 3,
                                                    color: COLORS.ERROR[500],
                                                    fontWeight: 'bold',
                                                    borderRadius: 4,
                                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`
                                                }}
                                            >
                                                hoặc
                                            </Typography>
                                        </Divider>
                                    </Box>

                                    {/* Cute Social Login */}
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        startIcon={<Google />}
                                        sx={{
                                            py: 2.5,
                                            borderRadius: 6,
                                            borderColor: COLORS.ERROR[300],
                                            color: COLORS.ERROR[500],
                                            backgroundColor: alpha(COLORS.SECONDARY[50], 0.8),
                                            border: `2px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: COLORS.ERROR[500],
                                                backgroundColor: COLORS.SECONDARY[50],
                                                transform: 'translateY(-3px)',
                                                boxShadow: `0 10px 30px ${alpha(COLORS.ERROR[200], 0.3)}`
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        Đăng nhập với Google
                                    </Button>

                                    {/* Cute Sign Up Link */}
                                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                                        <Typography variant="body1" sx={{ color: COLORS.SECONDARY[600], fontWeight: 500 }}>
                                            Chưa có tài khoản?{' '}
                                            <Link
                                                href="#"
                                                sx={{
                                                    color: COLORS.ERROR[500],
                                                    textDecoration: 'none',
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                        color: COLORS.ERROR[600]
                                                    },
                                                }}
                                            >
                                                Đăng ký thành viên
                                            </Link>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Fade>
                        </CardContent>
                    </Card>
                </Zoom>
            </Container>
        </Box>
    );
};

export default LoginPage;