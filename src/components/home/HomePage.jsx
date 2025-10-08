import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia, Avatar, Chip, Stack, useTheme, alpha, Fade, Zoom, IconButton, Divider, Slide, Grow } from '@mui/material';
import { LocalCafe, Pets, Cake, Coffee, Restaurant, ConfirmationNumber, LocationOn, Star, Favorite, ArrowForward, Facebook, Instagram, Twitter, EmojiFoodBeverage, Cookie, Fastfood, WineBar, HotTub, AutoAwesome } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

const HomePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Check user role
        const checkUserRole = () => {
            try {
                const role = authApi.getUserRole();
                setUserRole(role);
                
                // Redirect non-customer users to appropriate dashboard
                if (role === 'manager' || role === 'sales_staff' || role === 'working_staff') {
                    navigate('/manager/dashboard', { replace: true });
                    return;
                }
            } catch (error) {
                console.error('Error checking user role:', error);
                setUserRole(null);
            }
        };

        checkUserRole();
        setIsVisible(true);
    }, [navigate]);


    const features = [
        {
            icon: <LocalCafe sx={{ fontSize: 40 }} />,
            title: "Đồ uống thơm ngon",
            description: "Cà phê, trà sữa và các loại đồ uống đặc biệt được pha chế tinh tế"
        },
        {
            icon: <Pets sx={{ fontSize: 40 }} />,
            title: "Khu vực thú cưng",
            description: "Không gian riêng biệt cho chó và mèo với đầy đủ tiện nghi"
        },
        {
            icon: <Cake sx={{ fontSize: 40 }} />,
            title: "Bánh ngọt tươi",
            description: "Các loại bánh ngọt, bánh kem được làm tươi hàng ngày"
        },
        {
            icon: <Restaurant sx={{ fontSize: 40 }} />,
            title: "Đồ ăn nhẹ",
            description: "Sandwich, salad và các món ăn nhẹ bổ dưỡng"
        }
    ];

    const menuItems = [
        {
            category: "Đồ uống",
            icon: <Coffee sx={{ fontSize: 30 }} />,
            items: [
                { name: "Cà phê đen", price: "25,000đ", description: "Cà phê đen truyền thống" },
                { name: "Cappuccino", price: "35,000đ", description: "Cà phê sữa Ý thơm ngon" },
                { name: "Latte", price: "40,000đ", description: "Cà phê sữa mềm mịn" },
                { name: "Trà sữa trân châu", price: "30,000đ", description: "Trà sữa với trân châu đen" },
                { name: "Sinh tố bơ", price: "45,000đ", description: "Sinh tố bơ tươi mát" }
            ]
        },
        {
            category: "Đồ ăn nhẹ",
            icon: <Fastfood sx={{ fontSize: 30 }} />,
            items: [
                { name: "Sandwich gà nướng", price: "55,000đ", description: "Sandwich với gà nướng tươi" },
                { name: "Salad rau củ", price: "40,000đ", description: "Salad tươi với nước sốt đặc biệt" },
                { name: "Bánh mì pate", price: "25,000đ", description: "Bánh mì pate truyền thống" },
                { name: "Pizza mini", price: "60,000đ", description: "Pizza nhỏ với nhiều topping" }
            ]
        },
        {
            category: "Bánh ngọt",
            icon: <Cake sx={{ fontSize: 30 }} />,
            items: [
                { name: "Bánh kem chocolate", price: "35,000đ", description: "Bánh kem chocolate đậm đà" },
                { name: "Tiramisu", price: "45,000đ", description: "Tiramisu Ý chính gốc" },
                { name: "Bánh cupcake", price: "20,000đ", description: "Cupcake với kem tươi" },
                { name: "Bánh tart trái cây", price: "50,000đ", description: "Tart với trái cây tươi" }
            ]
        }
    ];

    const petAreas = [
        {
            floor: "Tầng 1",
            name: "Khu vực chó",
            icon: <Pets sx={{ fontSize: 40 }} />,
            description: "Không gian rộng rãi dành cho các chú chó hoạt động và vui chơi",
            features: [
                "Sân chơi rộng 100m²",
                "Hồ bơi mini cho chó",
                "Khu vực nghỉ ngơi có mái che",
                "Dụng cụ vui chơi an toàn",
                "Nhân viên chăm sóc chuyên nghiệp"
            ],
            capacity: "Tối đa 20 chú chó",
            price: "50,000đ/chó/giờ"
        },
        {
            floor: "Tầng 2",
            name: "Khu vực mèo",
            icon: <Pets sx={{ fontSize: 40 }} />,
            description: "Không gian yên tĩnh và ấm cúng dành cho các chú mèo",
            features: [
                "Phòng kín với điều hòa",
                "Cây leo và kệ cao cho mèo",
                "Khu vực nghỉ ngơi riêng tư",
                "Đồ chơi tương tác",
                "Nhân viên hiểu biết về mèo"
            ],
            capacity: "Tối đa 15 chú mèo",
            price: "40,000đ/mèo/giờ"
        }
    ];

    const testimonials = [
        {
            name: "Nguyễn Thị Lan",
            avatar: "L",
            rating: 5,
            comment: "Pet Cafe là nơi tuyệt vời để thư giãn cùng thú cưng. Không gian rất đẹp và đồ uống ngon!"
        },
        {
            name: "Trần Văn Minh",
            avatar: "M",
            rating: 5,
            comment: "Con mèo của tôi rất thích khu vực dành riêng cho mèo. Nhân viên cũng rất thân thiện!"
        },
        {
            name: "Lê Thị Hoa",
            avatar: "H",
            rating: 5,
            comment: "Bánh ngọt ở đây rất ngon, đặc biệt là bánh kem. Sẽ quay lại nhiều lần nữa!"
        }
    ];

    return (
        <Box sx={{
            width: '100%',
            position: 'relative'
        }}>
            {/* Hero Section */}
            <Box
                sx={{
                    minHeight: '90vh',
                    background: `
                        radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.6)} 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${alpha(COLORS.WARNING[100], 0.6)} 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, ${alpha(COLORS.PRIMARY[100], 0.5)} 0%, transparent 50%),
                        linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.9)} 0%, ${alpha(COLORS.PRIMARY[50], 0.95)} 50%, ${alpha(COLORS.WARNING[50], 0.8)} 100%)
                    `,
                    display: 'flex',
                    alignItems: 'center',
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
                            radial-gradient(circle at 15% 15%, ${alpha(COLORS.ERROR[100], 0.2)} 0%, transparent 20%),
                            radial-gradient(circle at 85% 85%, ${alpha(COLORS.SECONDARY[100], 0.2)} 0%, transparent 20%),
                            radial-gradient(circle at 50% 20%, ${alpha(COLORS.PRIMARY[100], 0.2)} 0%, transparent 25%),
                            radial-gradient(circle at 20% 80%, ${alpha(COLORS.WARNING[100], 0.2)} 0%, transparent 25%)
                        `,
                        pointerEvents: 'none',
                        animation: 'backgroundShift 8s ease-in-out infinite'
                    },
                    '@keyframes backgroundShift': {
                        '0%, 100%': {
                            opacity: 1,
                            transform: 'scale(1)'
                        },
                        '50%': {
                            opacity: 0.8,
                            transform: 'scale(1.05)'
                        }
                    }
                }}
            >
                {/* Floating Elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '10%',
                            left: '10%',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha(COLORS.ERROR[200], 0.4)}, transparent)`,
                            animation: 'float 6s ease-in-out infinite',
                            boxShadow: `0 0 30px ${alpha(COLORS.ERROR[200], 0.3)}`
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '15%',
                            right: '12%',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha(COLORS.SECONDARY[200], 0.4)}, transparent)`,
                            animation: 'float 7s ease-in-out infinite 1s',
                            boxShadow: `0 0 25px ${alpha(COLORS.SECONDARY[200], 0.3)}`
                        },
                        '@keyframes float': {
                            '0%, 100%': {
                                transform: 'translateY(0px) rotate(0deg) scale(1)',
                                opacity: 0.6
                            },
                            '50%': {
                                transform: 'translateY(-25px) rotate(15deg) scale(1.1)',
                                opacity: 0.9
                            }
                        }
                    }}
                />

                {/* Additional Floating Elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '30%',
                        left: '5%',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(COLORS.WARNING[200], 0.4)}, transparent)`,
                        animation: 'float 8s ease-in-out infinite 2s',
                        boxShadow: `0 0 20px ${alpha(COLORS.WARNING[200], 0.3)}`
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '8%',
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(COLORS.INFO[200], 0.4)}, transparent)`,
                        animation: 'float 9s ease-in-out infinite 3s',
                        boxShadow: `0 0 18px ${alpha(COLORS.INFO[200], 0.3)}`
                    }}
                />

                {/* Floating Icons */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        right: '15%',
                        animation: 'bounce 4s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))',
                        '@keyframes bounce': {
                            '0%, 100%': { 
                                transform: 'translateY(0px) scale(1) rotate(0deg)',
                                opacity: 0.8
                            },
                            '50%': { 
                                transform: 'translateY(-20px) scale(1.15) rotate(5deg)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <LocalCafe sx={{ fontSize: 60, color: alpha(COLORS.SECONDARY[500], 0.8) }} />
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '10%',
                        animation: 'bounce 5s ease-in-out infinite 1s',
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))',
                        '@keyframes bounce': {
                            '0%, 100%': { 
                                transform: 'translateY(0px) scale(1) rotate(0deg)',
                                opacity: 0.8
                            },
                            '50%': { 
                                transform: 'translateY(-18px) scale(1.15) rotate(-5deg)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <Pets sx={{ fontSize: 55, color: alpha(COLORS.ERROR[400], 0.8) }} />
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '40%',
                        left: '8%',
                        animation: 'bounce 6s ease-in-out infinite 2s',
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))',
                        '@keyframes bounce': {
                            '0%, 100%': { 
                                transform: 'translateY(0px) scale(1) rotate(0deg)',
                                opacity: 0.8
                            },
                            '50%': { 
                                transform: 'translateY(-15px) scale(1.15) rotate(3deg)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <Cake sx={{ fontSize: 50, color: alpha(COLORS.ERROR[300], 0.8) }} />
                </Box>

                {/* Sparkle Effects */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '25%',
                        right: '25%',
                        animation: 'sparkle 3s ease-in-out infinite',
                        '@keyframes sparkle': {
                            '0%, 100%': { 
                                transform: 'scale(0.8) rotate(0deg)',
                                opacity: 0.3
                            },
                            '50%': { 
                                transform: 'scale(1.2) rotate(180deg)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <Star sx={{ fontSize: 30, color: alpha(COLORS.WARNING[400], 0.8) }} />
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '40%',
                        right: '20%',
                        animation: 'sparkle 4s ease-in-out infinite 1.5s',
                        '@keyframes sparkle': {
                            '0%, 100%': { 
                                transform: 'scale(0.8) rotate(0deg)',
                                opacity: 0.3
                            },
                            '50%': { 
                                transform: 'scale(1.2) rotate(180deg)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <AutoAwesome sx={{ fontSize: 25, color: alpha(COLORS.INFO[400], 0.8) }} />
                </Box>

                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Slide direction="right" in={isVisible} timeout={1200}>
                                <Box>
                                    <Typography
                                        variant="h1"
                                        component="h1"
                                        sx={{
                                            fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                                            fontWeight: 'bold',
                                            color: COLORS.ERROR[500],
                                            textShadow: `3px 3px 6px ${alpha(COLORS.ERROR[300], 0.6)}`,
                                            mb: 2,
                                            fontFamily: '"Comic Sans MS", cursive',
                                            animation: 'titleGlow 3s ease-in-out infinite',
                                            '@keyframes titleGlow': {
                                                '0%, 100%': {
                                                    textShadow: `3px 3px 6px ${alpha(COLORS.ERROR[300], 0.6)}`
                                                },
                                                '50%': {
                                                    textShadow: `3px 3px 12px ${alpha(COLORS.ERROR[300], 0.8)}, 0 0 20px ${alpha(COLORS.ERROR[200], 0.4)}`
                                                }
                                            }
                                        }}
                                    >
                                        Pet Cafe
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            color: COLORS.SECONDARY[600],
                                            mb: 3,
                                            fontWeight: 500,
                                            textShadow: `2px 2px 4px ${alpha(COLORS.SECONDARY[50], 0.8)}`,
                                            animation: 'subtitleFloat 4s ease-in-out infinite',
                                            '@keyframes subtitleFloat': {
                                                '0%, 100%': {
                                                    transform: 'translateY(0px)'
                                                },
                                                '50%': {
                                                    transform: 'translateY(-3px)'
                                                }
                                            }
                                        }}
                                    >
                                        🐾 Nơi gặp gỡ ấm áp của những người yêu thú cưng ☕
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: COLORS.TEXT.SECONDARY,
                                            mb: 4,
                                            lineHeight: 1.6,
                                            maxWidth: '500px',
                                            animation: 'fadeInUp 1.5s ease-out'
                                        }}
                                    >
                                        Khám phá không gian tuyệt vời nơi bạn và thú cưng có thể thư giãn,
                                        thưởng thức đồ uống ngon và tạo nên những kỷ niệm đáng nhớ.
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Pets />}
                                            sx={{
                                                py: 2.5,
                                                px: 5,
                                                borderRadius: 8,
                                                background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                                                boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.5)}`,
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                animation: 'buttonPulse 2s ease-in-out infinite',
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                                                    transform: 'translateY(-5px) scale(1.05)',
                                                    boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[300], 0.6)}`,
                                                },
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '@keyframes buttonPulse': {
                                                    '0%, 100%': {
                                                        boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.5)}`
                                                    },
                                                    '50%': {
                                                        boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.7)}, 0 0 30px ${alpha(COLORS.ERROR[200], 0.3)}`
                                                    }
                                                }
                                            }}
                                        >
                                            Khám phá ngay
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            startIcon={<Restaurant />}
                                            onClick={() => navigate('/menu')}
                                            sx={{
                                                py: 2.5,
                                                px: 5,
                                                borderRadius: 8,
                                                borderColor: COLORS.SECONDARY[300],
                                                color: COLORS.SECONDARY[600],
                                                border: `3px solid ${alpha(COLORS.SECONDARY[200], 0.6)}`,
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[100], 0.2)})`,
                                                '&:hover': {
                                                    borderColor: COLORS.SECONDARY[500],
                                                    backgroundColor: alpha(COLORS.SECONDARY[100], 0.8),
                                                    transform: 'translateY(-5px) scale(1.05)',
                                                    boxShadow: `0 15px 35px ${alpha(COLORS.SECONDARY[200], 0.4)}`
                                                },
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            Xem menu
                                        </Button>
                                    </Stack>
                                </Box>
                            </Slide>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Slide direction="left" in={isVisible} timeout={1500}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        animation: 'containerFloat 6s ease-in-out infinite'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: { xs: 320, md: 420 },
                                            height: { xs: 320, md: 420 },
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: `
                                                0 40px 80px ${alpha(COLORS.ERROR[300], 0.5)},
                                                inset 0 4px 8px ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)},
                                                0 0 0 1px ${alpha(COLORS.ERROR[200], 0.2)}
                                            `,
                                            position: 'relative',
                                            animation: 'mainCircle 8s ease-in-out infinite',
                                            '&:hover': {
                                                transform: 'scale(1.08) rotate(8deg)',
                                                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: `
                                                    0 50px 100px ${alpha(COLORS.ERROR[300], 0.6)},
                                                    inset 0 4px 8px ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)},
                                                    0 0 0 2px ${alpha(COLORS.ERROR[200], 0.3)}
                                                `
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: -20,
                                                right: -20,
                                                width: 50,
                                                height: 50,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]})`,
                                                animation: 'pulse 3s infinite',
                                                boxShadow: `0 0 30px ${alpha(COLORS.ERROR[500], 0.8)}`
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -15,
                                                left: -15,
                                                width: 45,
                                                height: 45,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${COLORS.INFO[400]}, ${COLORS.INFO[500]})`,
                                                animation: 'pulse 3.5s infinite 0.8s',
                                                boxShadow: `0 0 25px ${alpha(COLORS.INFO[400], 0.8)}`
                                            },
                                            '@keyframes mainCircle': {
                                                '0%, 100%': {
                                                    transform: 'rotate(0deg) scale(1)',
                                                    boxShadow: `
                                                        0 40px 80px ${alpha(COLORS.ERROR[300], 0.5)},
                                                        inset 0 4px 8px ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)}
                                                    `
                                                },
                                                '50%': {
                                                    transform: 'rotate(2deg) scale(1.02)',
                                                    boxShadow: `
                                                        0 45px 90px ${alpha(COLORS.ERROR[300], 0.6)},
                                                        inset 0 4px 8px ${alpha(COLORS.BACKGROUND.DEFAULT, 0.3)}
                                                    `
                                                }
                                            },
                                            '@keyframes containerFloat': {
                                                '0%, 100%': {
                                                    transform: 'translateY(0px)'
                                                },
                                                '50%': {
                                                    transform: 'translateY(-10px)'
                                                }
                                            }
                                        }}
                                    >
                                        <LocalCafe sx={{ 
                                            fontSize: { xs: 90, md: 130 }, 
                                            color: 'white',
                                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                                            animation: 'iconFloat 4s ease-in-out infinite'
                                        }} />
                                    </Box>

                                    {/* Additional decorative elements */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '10%',
                                            left: '5%',
                                            width: 30,
                                            height: 30,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${COLORS.WARNING[400]}, ${COLORS.WARNING[500]})`,
                                            animation: 'orbit 6s linear infinite',
                                            boxShadow: `0 0 15px ${alpha(COLORS.WARNING[400], 0.6)}`
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: '15%',
                                            right: '8%',
                                            width: 25,
                                            height: 25,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${COLORS.SECONDARY[400]}, ${COLORS.SECONDARY[500]})`,
                                            animation: 'orbit 8s linear infinite reverse',
                                            boxShadow: `0 0 12px ${alpha(COLORS.SECONDARY[400], 0.6)}`
                                        }}
                                    />
                                </Box>
                            </Slide>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ 
                py: 10, 
                background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.NEUTRAL, 0.8)} 0%, ${alpha(COLORS.SECONDARY[50], 0.6)} 100%)`,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                        radial-gradient(circle at 20% 20%, ${alpha(COLORS.ERROR[100], 0.1)} 0%, transparent 30%),
                        radial-gradient(circle at 80% 80%, ${alpha(COLORS.SECONDARY[100], 0.1)} 0%, transparent 30%)
                    `,
                    pointerEvents: 'none'
                }
            }}>
                <Container maxWidth="lg">
                    <Slide direction="up" in={isVisible} timeout={1000}>
                        <Box sx={{ textAlign: 'center', mb: 8 }}>
                            <Typography
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 3,
                                    fontFamily: '"Comic Sans MS", cursive',
                                    animation: 'titleSlide 1.5s ease-out',
                                    textShadow: `2px 2px 4px ${alpha(COLORS.ERROR[200], 0.3)}`
                                }}
                            >
                                🎯 Dịch vụ của chúng tôi
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '700px',
                                    mx: 'auto',
                                    lineHeight: 1.8,
                                    animation: 'fadeInUp 2s ease-out'
                                }}
                            >
                                Pet Cafe mang đến trải nghiệm tuyệt vời với đầy đủ dịch vụ
                                dành cho bạn và thú cưng. Khám phá những điều tuyệt vời đang chờ đón!
                            </Typography>
                        </Box>
                    </Slide>

                    <Grid container spacing={5}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Grow in timeout={1200 + index * 300}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 6,
                                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                                            backdropFilter: 'blur(30px)',
                                            border: `3px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                                            boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[200], 0.25)}`,
                                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[100], 0.1)}, ${alpha(COLORS.SECONDARY[100], 0.1)})`,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease'
                                            },
                                            '&:hover': {
                                                transform: 'translateY(-15px) scale(1.02)',
                                                boxShadow: `0 35px 70px ${alpha(COLORS.ERROR[200], 0.4)}`,
                                                border: `3px solid ${alpha(COLORS.ERROR[300], 0.6)}`,
                                                '&::before': {
                                                    opacity: 1
                                                }
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 5, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mx: 'auto',
                                                    mb: 4,
                                                    color: 'white',
                                                    boxShadow: `0 15px 30px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                                    transition: 'all 0.4s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.1) rotate(5deg)',
                                                        boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.6)}`
                                                    }
                                                }}
                                            >
                                                {feature.icon}
                                            </Box>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.ERROR[500],
                                                    mb: 3,
                                                    fontSize: '1.3rem',
                                                    textShadow: `1px 1px 2px ${alpha(COLORS.ERROR[200], 0.3)}`
                                                }}
                                            >
                                                {feature.title}
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: COLORS.TEXT.SECONDARY,
                                                    lineHeight: 1.7,
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                {feature.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Menu Section */}
            <Box sx={{ 
                py: 10, 
                background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.9)} 0%, ${alpha(COLORS.PRIMARY[50], 0.8)} 100%)`,
                minHeight: '90vh',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                        radial-gradient(circle at 30% 30%, ${alpha(COLORS.WARNING[100], 0.15)} 0%, transparent 40%),
                        radial-gradient(circle at 70% 70%, ${alpha(COLORS.ERROR[100], 0.15)} 0%, transparent 40%)
                    `,
                    pointerEvents: 'none'
                }
            }}>
                <Container maxWidth="lg">
                    <Slide direction="up" in={isVisible} timeout={1200}>
                        <Box sx={{ textAlign: 'center', mb: 8 }}>
                            <Typography
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 3,
                                    fontFamily: '"Comic Sans MS", cursive',
                                    animation: 'titleSlide 1.8s ease-out',
                                    textShadow: `2px 2px 4px ${alpha(COLORS.ERROR[200], 0.3)}`
                                }}
                            >
                                🍽️ Thực đơn đa dạng
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '700px',
                                    mx: 'auto',
                                    mb: 5,
                                    lineHeight: 1.8,
                                    animation: 'fadeInUp 2.2s ease-out'
                                }}
                            >
                                Khám phá các món ăn và thức uống thơm ngon tại Pet Cafe.
                                Từ cà phê thơm lừng đến bánh ngọt tươi ngon!
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Restaurant />}
                                onClick={() => navigate('/menu')}
                                sx={{
                                    py: 3,
                                    px: 6,
                                    borderRadius: 8,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                                    boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.5)}`,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    animation: 'buttonPulse 2.5s ease-in-out infinite',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                                        transform: 'translateY(-5px) scale(1.05)',
                                        boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[300], 0.6)}`,
                                    },
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                Xem toàn bộ menu
                            </Button>
                        </Box>
                    </Slide>

                    <Grid container spacing={5}>
                        {menuItems.map((category, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Grow in timeout={1400 + index * 400}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 6,
                                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                                            backdropFilter: 'blur(30px)',
                                            border: `3px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                                            boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[200], 0.25)}`,
                                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[100], 0.1)}, ${alpha(COLORS.ERROR[100], 0.1)})`,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease'
                                            },
                                            '&:hover': {
                                                transform: 'translateY(-15px) scale(1.02)',
                                                boxShadow: `0 35px 70px ${alpha(COLORS.ERROR[200], 0.4)}`,
                                                border: `3px solid ${alpha(COLORS.ERROR[300], 0.6)}`,
                                                '&::before': {
                                                    opacity: 1
                                                }
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 5, position: 'relative', zIndex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                                <Box
                                                    sx={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 3,
                                                        color: 'white',
                                                        boxShadow: `0 15px 30px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                                        transition: 'all 0.4s ease',
                                                        '&:hover': {
                                                            transform: 'scale(1.1) rotate(5deg)',
                                                            boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.6)}`
                                                        }
                                                    }}
                                                >
                                                    {category.icon}
                                                </Box>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: COLORS.ERROR[500],
                                                        fontSize: '1.5rem',
                                                        textShadow: `1px 1px 2px ${alpha(COLORS.ERROR[200], 0.3)}`
                                                    }}
                                                >
                                                    {category.category}
                                                </Typography>
                                            </Box>
                                            <Stack spacing={3}>
                                                {category.items.slice(0, 3).map((item, itemIndex) => (
                                                    <Box key={itemIndex} sx={{
                                                        p: 3,
                                                        borderRadius: 4,
                                                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.6),
                                                        border: `2px solid ${alpha(COLORS.ERROR[100], 0.4)}`,
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': {
                                                            backgroundColor: alpha(COLORS.SECONDARY[100], 0.8),
                                                            border: `2px solid ${alpha(COLORS.ERROR[200], 0.6)}`,
                                                            transform: 'translateX(5px)'
                                                        }
                                                    }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ 
                                                                fontWeight: 'bold', 
                                                                color: COLORS.ERROR[500],
                                                                fontSize: '1.1rem'
                                                            }}>
                                                                {item.name}
                                                            </Typography>
                                                            <Typography variant="subtitle2" sx={{ 
                                                                fontWeight: 'bold', 
                                                                color: COLORS.SECONDARY[600],
                                                                fontSize: '1rem'
                                                            }}>
                                                                {item.price}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ 
                                                            color: COLORS.TEXT.SECONDARY, 
                                                            fontSize: '0.9rem',
                                                            lineHeight: 1.5
                                                        }}>
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                {category.items.length > 3 && (
                                                    <Typography variant="body2" sx={{
                                                        color: COLORS.ERROR[500],
                                                        textAlign: 'center',
                                                        fontStyle: 'italic',
                                                        mt: 2,
                                                        fontWeight: 'bold',
                                                        fontSize: '1rem'
                                                    }}>
                                                        +{category.items.length - 3} món khác...
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Pet Areas Section */}
            <Box sx={{ py: 8, backgroundColor: COLORS.BACKGROUND.NEUTRAL, minHeight: '80vh' }}>
                <Container maxWidth="lg">
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 2,
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}
                            >
                                🐾 Khu vực dành cho thú cưng
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '600px',
                                    mx: 'auto',
                                    mb: 4
                                }}
                            >
                                Khám phá các tầng được thiết kế đặc biệt cho từng loại thú cưng
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<LocationOn />}
                                onClick={() => navigate('/areas')}
                                sx={{
                                    py: 2,
                                    px: 4,
                                    borderRadius: 6,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                                    boxShadow: `0 15px 35px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                                        transform: 'translateY(-3px)',
                                        boxShadow: `0 20px 45px ${alpha(COLORS.ERROR[300], 0.5)}`,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Xem chi tiết khu vực
                            </Button>
                        </Box>
                    </Fade>

                    <Grid container spacing={4}>
                        {petAreas.map((area, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Grow in timeout={1000 + index * 200}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 4,
                                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                            backdropFilter: 'blur(25px)',
                                            border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                            boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[200], 0.2)}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-10px)',
                                                boxShadow: `0 30px 60px ${alpha(COLORS.ERROR[200], 0.3)}`,
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 4 }}>
                                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                                <Chip
                                                    label={area.floor}
                                                    sx={{
                                                        backgroundColor: COLORS.ERROR[500],
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        mb: 2
                                                    }}
                                                />
                                                <Box
                                                    sx={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mx: 'auto',
                                                        mb: 2,
                                                        color: 'white'
                                                    }}
                                                >
                                                    {area.icon}
                                                </Box>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: COLORS.ERROR[500],
                                                        mb: 1
                                                    }}
                                                >
                                                    {area.name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: COLORS.TEXT.SECONDARY,
                                                        mb: 3
                                                    }}
                                                >
                                                    {area.description}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500], mb: 1 }}>
                                                    Tiện ích:
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {area.features.map((feature, featureIndex) => (
                                                        <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box
                                                                sx={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: COLORS.ERROR[500],
                                                                    mr: 2
                                                                }}
                                                            />
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                {feature}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>

                                            <Divider sx={{ my: 2 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {area.capacity}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500] }}>
                                                    {area.price}
                                                </Typography>
                                            </Box>

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<ConfirmationNumber />}
                                                onClick={() => navigate('/tickets')}
                                                sx={{
                                                    borderRadius: 3,
                                                    borderColor: COLORS.ERROR[300],
                                                    color: COLORS.ERROR[500],
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                        borderColor: COLORS.ERROR[500],
                                                        backgroundColor: alpha(COLORS.ERROR[50], 0.8),
                                                    },
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                Đặt vé ngay
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Box sx={{ py: 8, backgroundColor: COLORS.BACKGROUND.DEFAULT }}>
                <Container maxWidth="lg">
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 2,
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}
                            >
                                Khách hàng nói gì về chúng tôi
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '600px',
                                    mx: 'auto'
                                }}
                            >
                                Những phản hồi tích cực từ khách hàng yêu quý
                            </Typography>
                        </Box>
                    </Fade>

                    <Grid container spacing={4}>
                        {testimonials.map((testimonial, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Grow in timeout={1000 + index * 200}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 4,
                                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                            backdropFilter: 'blur(25px)',
                                            border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                            boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[200], 0.2)}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[200], 0.3)}`,
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 4 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: COLORS.ERROR[500],
                                                        width: 50,
                                                        height: 50,
                                                        mr: 2
                                                    }}
                                                >
                                                    {testimonial.avatar}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500] }}>
                                                        {testimonial.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {[...Array(testimonial.rating)].map((_, i) => (
                                                            <Star key={i} sx={{ color: COLORS.WARNING[500], fontSize: 20 }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: COLORS.TEXT.SECONDARY,
                                                    lineHeight: 1.6,
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                "{testimonial.comment}"
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Quick Navigation Section */}
            <Box sx={{ py: 6, backgroundColor: COLORS.BACKGROUND.DEFAULT }}>
                <Container maxWidth="lg">
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography
                                variant="h3"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 3,
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}
                            >
                                🚀 Điều hướng nhanh
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '600px',
                                    mx: 'auto',
                                    mb: 4
                                }}
                            >
                                Truy cập nhanh các dịch vụ chính của Pet Cafe
                            </Typography>
                        </Box>
                    </Fade>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<Restaurant />}
                                onClick={() => navigate('/menu')}
                                sx={{
                                    py: 3,
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]})`,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]})`,
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Đồ ăn & Đồ uống
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<ConfirmationNumber />}
                                onClick={() => navigate('/tickets')}
                                sx={{
                                    py: 3,
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${COLORS.SECONDARY[300]}, ${COLORS.SECONDARY[500]})`,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.SECONDARY[500]}, ${COLORS.SECONDARY[600]})`,
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Đặt vé
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<LocationOn />}
                                onClick={() => navigate('/areas')}
                                sx={{
                                    py: 3,
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${COLORS.INFO[300]}, ${COLORS.INFO[500]})`,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.INFO[500]}, ${COLORS.INFO[600]})`,
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Khu vực
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<Pets />}
                                onClick={() => navigate('/profile')}
                                sx={{
                                    py: 3,
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${COLORS.WARNING[300]}, ${COLORS.WARNING[500]})`,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.WARNING[500]}, ${COLORS.WARNING[600]})`,
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Hồ sơ
                            </Button>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: 8,
                    background: `
                        radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.4)} 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${alpha(COLORS.WARNING[100], 0.4)} 0%, transparent 50%),
                        linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[50], 0.9)} 100%)
                    `,
                    position: 'relative'
                }}
            >
                <Container maxWidth="md">
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: COLORS.ERROR[500],
                                    mb: 3,
                                    fontFamily: '"Comic Sans MS", cursive'
                                }}
                            >
                                Sẵn sàng trải nghiệm?
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    mb: 4,
                                    lineHeight: 1.6
                                }}
                            >
                                Hãy đến Pet Cafe ngay hôm nay và tạo nên những kỷ niệm đáng nhớ
                                cùng thú cưng của bạn!
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ArrowForward />}
                                sx={{
                                    py: 2,
                                    px: 6,
                                    borderRadius: 6,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                                    boxShadow: `0 15px 35px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                                        transform: 'translateY(-3px)',
                                        boxShadow: `0 20px 45px ${alpha(COLORS.ERROR[300], 0.5)}`,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Đặt chỗ ngay
                            </Button>
                        </Box>
                    </Fade>
                </Container>
            </Box>
        </Box>
    );
};

export default HomePage;
