import React from 'react';
import {
    Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia, 
    Avatar, Chip, Stack, useTheme, alpha, Fade, Zoom, IconButton, Divider
} from '@mui/material';
import {
    LocalCafe, Pets, Cake, Coffee, Restaurant, ConfirmationNumber, LocationOn, 
    Star, Favorite, ArrowForward, PlayArrow, Facebook, Instagram, Twitter,
    EmojiFoodBeverage, Cookie, Fastfood, WineBar, HotTub
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();


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
        },
        {
            floor: "Tầng 3",
            name: "Khu vực chung",
            icon: <HotTub sx={{ fontSize: 40 }} />,
            description: "Không gian dành cho cả chó và mèo với sự giám sát chặt chẽ",
            features: [
                "Không gian mở thoáng đãng",
                "Khu vực riêng biệt cho từng loại",
                "Sân thượng với view đẹp",
                "Dịch vụ spa cho thú cưng",
                "Bác sĩ thú y có mặt 24/7"
            ],
            capacity: "Tối đa 25 thú cưng",
            price: "60,000đ/thú cưng/giờ"
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
                    minHeight: '80vh',
                    background: `
                        radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.4)} 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${alpha(COLORS.WARNING[100], 0.4)} 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, ${alpha(COLORS.PRIMARY[100], 0.3)} 0%, transparent 50%),
                        linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[50], 0.9)} 50%, ${alpha(COLORS.WARNING[50], 0.7)} 100%)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'visible',
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
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha(COLORS.ERROR[200], 0.3)}, transparent)`,
                            animation: 'float 6s ease-in-out infinite'
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '15%',
                            right: '12%',
                            width: '50px',
                            height: '50px',
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

                {/* Floating Icons */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        right: '15%',
                        animation: 'bounce 4s ease-in-out infinite',
                        '@keyframes bounce': {
                            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                            '50%': { transform: 'translateY(-15px) scale(1.1)' }
                        }
                    }}
                >
                    <LocalCafe sx={{ fontSize: 50, color: alpha(COLORS.SECONDARY[500], 0.7) }} />
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '10%',
                        animation: 'bounce 5s ease-in-out infinite 1s',
                        '@keyframes bounce': {
                            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                            '50%': { transform: 'translateY(-12px) scale(1.1)' }
                        }
                    }}
                >
                    <Pets sx={{ fontSize: 45, color: alpha(COLORS.ERROR[400], 0.7) }} />
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '40%',
                        left: '8%',
                        animation: 'bounce 6s ease-in-out infinite 2s',
                        '@keyframes bounce': {
                            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                            '50%': { transform: 'translateY(-10px) scale(1.1)' }
                        }
                    }}
                >
                    <Cake sx={{ fontSize: 40, color: alpha(COLORS.ERROR[300], 0.7) }} />
                </Box>

                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Fade in timeout={1000}>
                                <Box>
                                    <Typography
                                        variant="h1"
                                        component="h1"
                                        sx={{
                                            fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
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
                                        variant="h4"
                                        sx={{
                                            color: COLORS.SECONDARY[600],
                                            mb: 3,
                                            fontWeight: 500,
                                            textShadow: `1px 1px 2px ${alpha(COLORS.SECONDARY[50], 0.8)}`
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
                                            maxWidth: '500px'
                                        }}
                                    >
                                        Khám phá không gian tuyệt vời nơi bạn và thú cưng có thể thư giãn, 
                                        thưởng thức đồ uống ngon và tạo nên những kỷ niệm đáng nhớ.
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Pets />}
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
                                            Khám phá ngay
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            startIcon={<PlayArrow />}
                                            sx={{
                                                py: 2,
                                                px: 4,
                                                borderRadius: 6,
                                                borderColor: COLORS.ERROR[300],
                                                color: COLORS.ERROR[500],
                                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    borderColor: COLORS.ERROR[500],
                                                    backgroundColor: alpha(COLORS.ERROR[50], 0.8),
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: `0 10px 30px ${alpha(COLORS.ERROR[200], 0.3)}`
                                                },
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            Xem video
                                        </Button>
                                    </Stack>
                                </Box>
                            </Fade>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Zoom in timeout={1200}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: { xs: 300, md: 400 },
                                            height: { xs: 300, md: 400 },
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: `
                                                0 30px 60px ${alpha(COLORS.ERROR[300], 0.4)},
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
                                                top: -15,
                                                right: -15,
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: COLORS.ERROR[500],
                                                animation: 'pulse 2s infinite',
                                                boxShadow: `0 0 20px ${alpha(COLORS.ERROR[500], 0.6)}`
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -12,
                                                left: -12,
                                                width: 35,
                                                height: 35,
                                                borderRadius: '50%',
                                                background: COLORS.INFO[400],
                                                animation: 'pulse 2.5s infinite 0.5s',
                                                boxShadow: `0 0 15px ${alpha(COLORS.INFO[400], 0.6)}`
                                            }
                                        }}
                                    >
                                        <LocalCafe sx={{ fontSize: { xs: 80, md: 120 }, color: 'white' }} />
                                    </Box>
                                </Box>
                            </Zoom>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: 8, backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
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
                                🎯 Dịch vụ của chúng tôi
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: COLORS.TEXT.SECONDARY,
                                    maxWidth: '600px',
                                    mx: 'auto'
                                }}
                            >
                                Pet Cafe mang đến trải nghiệm tuyệt vời với đầy đủ dịch vụ 
                                dành cho bạn và thú cưng
                            </Typography>
                        </Box>
                    </Fade>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Zoom in timeout={1000 + index * 200}>
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
                                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
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
                                                    mb: 3,
                                                    color: 'white'
                                                }}
                                            >
                                                {feature.icon}
                                            </Box>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: COLORS.ERROR[500],
                                                    mb: 2
                                                }}
                                            >
                                                {feature.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: COLORS.TEXT.SECONDARY,
                                                    lineHeight: 1.6
                                                }}
                                            >
                                                {feature.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Zoom>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Menu Section */}
            <Box sx={{ py: 8, backgroundColor: COLORS.BACKGROUND.DEFAULT, minHeight: '80vh' }}>
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
                                🍽️ Thực đơn đa dạng
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
                                Khám phá các món ăn và thức uống thơm ngon tại Pet Cafe
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Restaurant />}
                                onClick={() => navigate('/menu')}
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
                                Xem toàn bộ menu
                            </Button>
                        </Box>
                    </Fade>

                    <Grid container spacing={4}>
                        {menuItems.map((category, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Zoom in timeout={1000 + index * 200}>
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <Box
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                        color: 'white'
                                                    }}
                                                >
                                                    {category.icon}
                                                </Box>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: COLORS.ERROR[500]
                                                    }}
                                                >
                                                    {category.category}
                                                </Typography>
                                            </Box>
                                            <Stack spacing={2}>
                                                {category.items.slice(0, 3).map((item, itemIndex) => (
                                                    <Box key={itemIndex} sx={{ 
                                                        p: 2, 
                                                        borderRadius: 2, 
                                                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.5),
                                                        border: `1px solid ${alpha(COLORS.ERROR[100], 0.3)}`
                                                    }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500] }}>
                                                                {item.name}
                                                            </Typography>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: COLORS.SECONDARY[600] }}>
                                                                {item.price}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                {category.items.length > 3 && (
                                                    <Typography variant="body2" sx={{ 
                                                        color: COLORS.ERROR[500], 
                                                        textAlign: 'center', 
                                                        fontStyle: 'italic',
                                                        mt: 1
                                                    }}>
                                                        +{category.items.length - 3} món khác...
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Zoom>
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
                                <Zoom in timeout={1000 + index * 200}>
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
                                </Zoom>
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
                                <Zoom in timeout={1000 + index * 200}>
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
                                </Zoom>
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
