import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardHeader, Avatar, Chip, Stack, Button, LinearProgress, IconButton, useTheme, alpha, Fade, Slide, Grow } from '@mui/material';
import { Dashboard as DashboardIcon, Pets, People, Assignment, Build, Inventory, TrendingUp, TrendingDown, AttachMoney, Schedule, Notifications, Refresh, MoreVert, Star, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const DashboardPage = () => {
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Mock data for dashboard
    const stats = [
        {
            title: 'Tổng doanh thu',
            value: '12,450,000đ',
            change: '+15.3%',
            trend: 'up',
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: COLORS.SUCCESS[500]
        },
        {
            title: 'Khách hàng hôm nay',
            value: '45',
            change: '+8.2%',
            trend: 'up',
            icon: <People sx={{ fontSize: 40 }} />,
            color: COLORS.PRIMARY[500]
        },
        {
            title: 'Thú cưng đang phục vụ',
            value: '23',
            change: '-2.1%',
            trend: 'down',
            icon: <Pets sx={{ fontSize: 40 }} />,
            color: COLORS.WARNING[500]
        },
        {
            title: 'Đánh giá trung bình',
            value: '4.8',
            change: '+0.3',
            trend: 'up',
            icon: <Star sx={{ fontSize: 40 }} />,
            color: COLORS.ERROR[500]
        }
    ];

    const recentActivities = [
        {
            id: 1,
            type: 'booking',
            message: 'Khách hàng Nguyễn Văn A đặt lịch cho chó Golden Retriever',
            time: '5 phút trước',
            status: 'success',
            icon: <CheckCircle sx={{ color: COLORS.SUCCESS[500] }} />
        },
        {
            id: 2,
            type: 'payment',
            message: 'Thanh toán thành công cho đơn hàng #12345',
            time: '12 phút trước',
            status: 'success',
            icon: <CheckCircle sx={{ color: COLORS.SUCCESS[500] }} />
        },
        {
            id: 3,
            type: 'warning',
            message: 'Kho đồ ăn cho mèo sắp hết, cần nhập thêm',
            time: '1 giờ trước',
            status: 'warning',
            icon: <Warning sx={{ color: COLORS.WARNING[500] }} />
        },
        {
            id: 4,
            type: 'error',
            message: 'Lỗi hệ thống thanh toán, cần kiểm tra',
            time: '2 giờ trước',
            status: 'error',
            icon: <ErrorIcon sx={{ color: COLORS.ERROR[500] }} />
        }
    ];

    const quickActions = [
        {
            title: 'Quản lý thú cưng',
            description: 'Xem và quản lý thông tin thú cưng',
            icon: <Pets sx={{ fontSize: 30 }} />,
            color: COLORS.PRIMARY[500],
            path: '/manager/pets'
        },
        {
            title: 'Quản lý nhân viên',
            description: 'Xem và quản lý thông tin nhân viên',
            icon: <People sx={{ fontSize: 30 }} />,
            color: COLORS.SECONDARY[500],
            path: '/manager/staff'
        },
        {
            title: 'Quản lý dịch vụ',
            description: 'Cấu hình các dịch vụ của cafe',
            icon: <Build sx={{ fontSize: 30 }} />,
            color: COLORS.WARNING[500],
            path: '/manager/services'
        },
        {
            title: 'Quản lý kho',
            description: 'Theo dõi tồn kho và nhập hàng',
            icon: <Inventory sx={{ fontSize: 30 }} />,
            color: COLORS.INFO[500],
            path: '/manager/products'
        }
    ];

    const getTrendIcon = (trend) => {
        return trend === 'up' ?
            <TrendingUp sx={{ color: COLORS.SUCCESS[500] }} /> :
            <TrendingDown sx={{ color: COLORS.ERROR[500] }} />;
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.NEUTRAL, 0.8)} 0%, ${alpha(COLORS.PRIMARY[50], 0.6)} 100%)`,
            py: 4
        }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Slide direction="down" in={isVisible} timeout={800}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{
                                    bgcolor: COLORS.ERROR[500],
                                    mr: 2,
                                    width: 50,
                                    height: 50
                                }}>
                                    <DashboardIcon sx={{ fontSize: 30 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" sx={{
                                        fontWeight: 'bold',
                                        color: COLORS.ERROR[500],
                                        fontFamily: '"Comic Sans MS", cursive'
                                    }}>
                                        Dashboard Manager
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Tổng quan hoạt động Pet Cafe
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Refresh />}
                                    sx={{
                                        borderColor: COLORS.ERROR[300],
                                        color: COLORS.ERROR[500],
                                        '&:hover': {
                                            borderColor: COLORS.ERROR[500],
                                            backgroundColor: alpha(COLORS.ERROR[50], 0.8)
                                        }
                                    }}
                                >
                                    Làm mới
                                </Button>
                                <IconButton sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    <MoreVert />
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                </Slide>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Grow in timeout={1000 + index * 200}>
                                <Card sx={{
                                    height: '100%',
                                    borderRadius: 4,
                                    background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                    backdropFilter: 'blur(20px)',
                                    border: `2px solid ${alpha(stat.color, 0.2)}`,
                                    boxShadow: `0 15px 35px ${alpha(stat.color, 0.15)}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: `0 20px 45px ${alpha(stat.color, 0.25)}`,
                                        border: `2px solid ${alpha(stat.color, 0.4)}`
                                    }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar sx={{
                                                bgcolor: alpha(stat.color, 0.1),
                                                color: stat.color,
                                                width: 60,
                                                height: 60
                                            }}>
                                                {stat.icon}
                                            </Avatar>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {getTrendIcon(stat.trend)}
                                                <Typography variant="body2" sx={{
                                                    color: stat.trend === 'up' ? COLORS.SUCCESS[500] : COLORS.ERROR[500],
                                                    fontWeight: 'bold'
                                                }}>
                                                    {stat.change}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="h4" sx={{
                                            fontWeight: 'bold',
                                            color: COLORS.TEXT.PRIMARY,
                                            mb: 1
                                        }}>
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: COLORS.TEXT.SECONDARY,
                                            fontSize: '0.9rem'
                                        }}>
                                            {stat.title}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grow>
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={3}>
                    {/* Recent Activities */}
                    <Grid item xs={12} md={8}>
                        <Fade in timeout={1200}>
                            <Card sx={{
                                height: '100%',
                                borderRadius: 4,
                                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                backdropFilter: 'blur(20px)',
                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                boxShadow: `0 15px 35px ${alpha(COLORS.ERROR[200], 0.15)}`
                            }}>
                                <CardHeader
                                    title={
                                        <Typography variant="h6" sx={{
                                            fontWeight: 'bold',
                                            color: COLORS.ERROR[500],
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <Notifications sx={{ fontSize: 24 }} />
                                            Hoạt động gần đây
                                        </Typography>
                                    }
                                    action={
                                        <Button size="small" sx={{ color: COLORS.ERROR[500] }}>
                                            Xem tất cả
                                        </Button>
                                    }
                                />
                                <CardContent sx={{ pt: 0 }}>
                                    <Stack spacing={2}>
                                        {recentActivities.map((activity, index) => (
                                            <Box key={activity.id} sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5),
                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.5)}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.8),
                                                    transform: 'translateX(5px)'
                                                }
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {activity.icon}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{
                                                            color: COLORS.TEXT.PRIMARY,
                                                            mb: 0.5
                                                        }}>
                                                            {activity.message}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{
                                                            color: COLORS.TEXT.SECONDARY
                                                        }}>
                                                            {activity.time}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>

                    {/* Quick Actions */}
                    <Grid item xs={12} md={4}>
                        <Fade in timeout={1400}>
                            <Card sx={{
                                height: '100%',
                                borderRadius: 4,
                                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                backdropFilter: 'blur(20px)',
                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                boxShadow: `0 15px 35px ${alpha(COLORS.ERROR[200], 0.15)}`
                            }}>
                                <CardHeader
                                    title={
                                        <Typography variant="h6" sx={{
                                            fontWeight: 'bold',
                                            color: COLORS.ERROR[500],
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <Assignment sx={{ fontSize: 24 }} />
                                            Thao tác nhanh
                                        </Typography>
                                    }
                                />
                                <CardContent sx={{ pt: 0 }}>
                                    <Stack spacing={2}>
                                        {quickActions.map((action, index) => (
                                            <Button
                                                key={index}
                                                variant="outlined"
                                                fullWidth
                                                startIcon={
                                                    <Avatar sx={{
                                                        bgcolor: alpha(action.color, 0.1),
                                                        color: action.color,
                                                        width: 35,
                                                        height: 35
                                                    }}>
                                                        {action.icon}
                                                    </Avatar>
                                                }
                                                sx={{
                                                    p: 2,
                                                    justifyContent: 'flex-start',
                                                    textAlign: 'left',
                                                    borderColor: alpha(action.color, 0.3),
                                                    color: COLORS.TEXT.PRIMARY,
                                                    '&:hover': {
                                                        borderColor: action.color,
                                                        backgroundColor: alpha(action.color, 0.05),
                                                        transform: 'translateY(-2px)'
                                                    },
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{
                                                        fontWeight: 'bold',
                                                        mb: 0.5
                                                    }}>
                                                        {action.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{
                                                        color: COLORS.TEXT.SECONDARY,
                                                        display: 'block'
                                                    }}>
                                                        {action.description}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default DashboardPage;


