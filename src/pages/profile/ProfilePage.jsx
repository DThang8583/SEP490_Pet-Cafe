import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Avatar, TextField, Button, IconButton, Chip, Paper, Fade, Alert, keyframes } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Edit, PhotoCamera, Save, Cancel, Star } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import { authApi } from '../../api/authApi';

// Animations
const gentleGlow = keyframes`
    0%, 100% { box-shadow: 0 0 20px ${alpha('#ffa726', 0.3)}; }
    50% { box-shadow: 0 0 30px ${alpha('#ffa726', 0.5)}; }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const ProfilePage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Field container styling
    const getFieldContainerStyle = (getRoleColor) => ({
        p: { xs: 2.5, md: 3.5 },
        background: `linear-gradient(135deg, 
            ${alpha(COLORS.COMMON.WHITE, 0.98)} 0%, 
            ${alpha(getRoleColor()[50], 0.9)} 50%,
            ${alpha(COLORS.WARNING[50], 0.7)} 100%
        )`,
        borderRadius: { xs: 4, md: 5 },
        border: `2px solid ${alpha(getRoleColor()[200], 0.4)}`,
        boxShadow: `
            0 12px 30px ${alpha(getRoleColor()[300], 0.15)},
            0 6px 15px ${alpha(COLORS.SECONDARY[300], 0.1)},
            inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.9)}
        `,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
            transform: 'translateY(-3px) scale(1.01)',
            boxShadow: `
                0 18px 40px ${alpha(getRoleColor()[300], 0.2)},
                0 8px 20px ${alpha(COLORS.SECONDARY[300], 0.15)},
                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 1)}
            `
        },
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, 
                transparent 0%, 
                ${alpha(COLORS.COMMON.WHITE, 0.4)} 50%, 
                transparent 100%
            )`,
            transition: 'left 0.6s ease',
            pointerEvents: 'none'
        },
        '&:hover::before': {
            left: '100%'
        }
    });

    // TextField styling
    const getTextFieldStyle = (getRoleColor, editMode) => ({
        position: 'relative',
        zIndex: 1,
        '& .MuiOutlinedInput-root': {
            borderRadius: { xs: 3, md: 4 },
            fontSize: { xs: '1rem', md: '1.1rem' },
            backgroundColor: editMode
                ? alpha(COLORS.COMMON.WHITE, 0.98)
                : alpha(COLORS.GRAY[50], 0.9),
            border: editMode
                ? `2px solid ${alpha(getRoleColor()[400], 0.7)}`
                : `2px solid ${alpha(COLORS.GRAY[300], 0.5)}`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: 56, // Cùng height cho tất cả fields
            boxShadow: `
                0 4px 15px ${alpha(COLORS.SECONDARY[300], 0.08)},
                inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.8)}
            `,
            '& input': {
                py: { xs: 2, md: 2.2 },
                px: { xs: 2, md: 2.5 },
                fontWeight: editMode ? 500 : 600,
                fontSize: { xs: '1rem', md: '1.05rem' },
                color: getRoleColor()[800]
            },
            '&:hover': editMode ? {
                borderColor: getRoleColor()[500],
                boxShadow: `
                    0 0 0 3px ${alpha(getRoleColor()[200], 0.25)},
                    0 8px 25px ${alpha(COLORS.SECONDARY[300], 0.12)}
                `,
                transform: 'translateY(-1px)'
            } : {},
            '&.Mui-focused': {
                borderColor: getRoleColor()[600],
                boxShadow: `
                    0 0 0 4px ${alpha(getRoleColor()[200], 0.35)},
                    0 12px 30px ${alpha(COLORS.SECONDARY[300], 0.15)}
                `,
                transform: 'translateY(-2px)'
            }
        }
    });

    // Label styling
    const getLabelStyle = (getRoleColor) => ({
        color: getRoleColor()[700],
        fontWeight: 800,
        mb: { xs: 2, md: 2.5 },
        fontSize: { xs: '1.1rem', md: '1.2rem' },
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        textShadow: `1px 1px 3px ${alpha(COLORS.COMMON.WHITE, 0.9)}`,
        position: 'relative',
        zIndex: 1,
        letterSpacing: '0.5px'
    });

    // State
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [user, setUser] = useState({});

    // Load profile data
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true);

                const currentUser = authApi.getCurrentUser();
                if (!currentUser) {
                    setAlert({
                        open: true,
                        title: 'Lỗi',
                        message: 'Vui lòng đăng nhập để xem hồ sơ',
                        type: 'error'
                    });
                    setIsLoading(false);
                    return;
                }

                setCurrentUser(currentUser);
                setUserRole(currentUser.role);

                const userData = {
                    name: currentUser.fullName || currentUser.name || 'Người dùng',
                    email: currentUser.email || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || '',
                    birthDate: currentUser.birthDate || '',
                    avatar: currentUser.avatar || '',
                    createdAt: currentUser.createdAt || new Date().toISOString()
                };
                setUser(userData);

                setIsLoading(false);
            } catch (err) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: err.message || 'Có lỗi xảy ra khi tải dữ liệu',
                    type: 'error'
                });
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    // Event handlers
    const handleUserChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setUser(prev => ({ ...prev, avatar: url }));
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);

            const updatedUser = { ...currentUser, ...user };
            setUser(user);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Cập nhật hồ sơ thành công!',
                type: 'success'
            });
            setEditMode(false);
        } catch (err) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: err.message || 'Có lỗi xảy ra khi cập nhật hồ sơ',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Utility functions
    const getRoleDisplayName = () => {
        switch (userRole) {
            case 'manager': return 'Quản lý';
            case 'sales_staff': return 'Nhân viên bán hàng';
            case 'working_staff': return 'Nhân viên chăm sóc';
            case 'customer': return user.customerProfile?.membershipLevel || 'Khách hàng';
            default: return 'Người dùng';
        }
    };

    const getRoleColor = () => {
        switch (userRole) {
            case 'manager': return COLORS.ERROR;
            case 'sales_staff': return COLORS.WARNING;
            case 'working_staff': return COLORS.INFO;
            case 'customer': return COLORS.SECONDARY;
            default: return COLORS.GRAY;
        }
    };

    // Loading states
    if (isLoading) {
        return (
            <Loading
                fullScreen={true}
                variant="dots"
                size="large"
                message="Đang tải hồ sơ của bạn..."
            />
        );
    }

    if (isSaving) {
        return (
            <Loading
                fullScreen={true}
                message="Đang lưu thông tin..."
            />
        );
    }

    return (
        <Box sx={{
            backgroundColor: COLORS.BACKGROUND.NEUTRAL,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* Main Content - Personal Information */}
            <Box sx={{
                background: `
                    radial-gradient(circle at 15% 25%, ${alpha(COLORS.SECONDARY[200], 0.3)} 0%, transparent 60%),
                    radial-gradient(circle at 85% 75%, ${alpha(COLORS.ERROR[200], 0.2)} 0%, transparent 50%),
                    linear-gradient(135deg, 
                        ${COLORS.BACKGROUND.NEUTRAL} 0%, 
                        ${alpha(COLORS.SECONDARY[50], 0.7)} 100%
                    )
                `,
                flex: 1,
                p: { xs: 1, sm: 2 },
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }}>

                <Container maxWidth="xl" sx={{ width: '100%', height: '100%', display: 'flex' }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: { xs: 3, md: 4 },
                            overflow: 'hidden',
                            background: `
                                linear-gradient(135deg, 
                                    ${alpha(COLORS.COMMON.WHITE, 0.98)} 0%, 
                                    ${alpha(COLORS.SECONDARY[50], 0.9)} 30%,
                                    ${alpha(COLORS.ERROR[50], 0.8)} 70%,
                                    ${alpha(COLORS.WARNING[50], 0.7)} 100%
                                ),
                                radial-gradient(circle at 20% 80%, ${alpha(COLORS.SECONDARY[100], 0.5)} 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, ${alpha(COLORS.ERROR[100], 0.4)} 0%, transparent 50%)
                            `,
                            backdropFilter: 'blur(30px)',
                            border: `2px solid ${alpha(COLORS.COMMON.WHITE, 0.6)}`,
                            boxShadow: `
                                0 25px 50px ${alpha(COLORS.SECONDARY[400], 0.1)},
                                0 15px 30px ${alpha(COLORS.ERROR[400], 0.05)},
                                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.8)}
                            `,
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Enhanced gradient overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: { xs: 4, md: 6 },
                                background: `linear-gradient(90deg, 
                                    ${getRoleColor()[400]} 0%, 
                                    ${COLORS.ERROR[400]} 25%,
                                    ${COLORS.SECONDARY[400]} 50%,
                                    ${COLORS.WARNING[400]} 75%,
                                    ${getRoleColor()[500]} 100%
                                )`,
                                opacity: 0.8
                            }}
                        />

                        {/* Floating decorative elements */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '15%',
                                right: '8%',
                                opacity: 0.15,
                                fontSize: { xs: 40, md: 50, lg: 60 },
                                animation: 'float 8s ease-in-out infinite',
                                display: { xs: 'none', md: 'block' },
                                '@keyframes float': {
                                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                                    '50%': { transform: 'translateY(-20px) rotate(10deg)' }
                                }
                            }}
                        >
                            🐾
                        </Box>
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '20%',
                                left: '5%',
                                opacity: 0.1,
                                fontSize: { md: 35, lg: 45 },
                                animation: 'float 12s ease-in-out infinite 4s',
                                display: { xs: 'none', lg: 'block' },
                                '@keyframes float': {
                                    '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                                    '50%': { transform: 'translateY(-15px) scale(1.1)' }
                                }
                            }}
                        >
                            ☕
                        </Box>

                        <Box sx={{
                            p: {
                                xs: 1.5,
                                sm: 2,
                                md: 2.5
                            },
                            position: 'relative',
                            zIndex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            {/* Header - Title and Edit Button */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: { xs: 2, sm: 2.5, md: 3 },
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2, sm: 3 },
                                pb: { xs: 2, md: 2.5 },
                                borderBottom: `3px solid ${alpha(getRoleColor()[300], 0.25)}`,
                                flexShrink: 0,
                                background: `linear-gradient(135deg, 
                                    ${alpha(COLORS.COMMON.WHITE, 0.9)} 0%, 
                                    ${alpha(getRoleColor()[50], 0.7)} 100%
                                )`,
                                borderRadius: { xs: 3, md: 4 },
                                px: { xs: 2, md: 3 },
                                py: { xs: 2, md: 2.5 },
                                boxShadow: `
                                    0 8px 25px ${alpha(getRoleColor()[300], 0.15)},
                                    inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.8)}
                                `
                            }}>
                                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontWeight: 900,
                                            background: `linear-gradient(135deg, 
                                                ${COLORS.ERROR[600]} 0%, 
                                                ${getRoleColor()[600]} 30%,
                                                ${COLORS.SECONDARY[600]} 60%,
                                                ${COLORS.WARNING[600]} 100%
                                            )`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontSize: {
                                                xs: '1.5rem',
                                                sm: '1.8rem',
                                                md: '2.2rem',
                                                lg: '2.5rem'
                                            },
                                            lineHeight: 1.2,
                                            textShadow: `2px 2px 4px ${alpha(COLORS.COMMON.BLACK, 0.1)}`,
                                            mb: 0.5
                                        }}
                                    >
                                        Thông tin cá nhân
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: alpha(COLORS.TEXT.SECONDARY, 0.8),
                                            fontSize: { xs: '0.9rem', md: '1rem' },
                                            fontWeight: 500,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        Quản lý và cập nhật thông tin của bạn
                                    </Typography>
                                </Box>

                                <Button
                                    variant={editMode ? "outlined" : "contained"}
                                    startIcon={editMode ? <Cancel /> : <Edit />}
                                    onClick={() => setEditMode(!editMode)}
                                    sx={{
                                        borderRadius: { xs: 2, md: 3 },
                                        textTransform: 'none',
                                        px: { xs: 3, md: 4 },
                                        py: { xs: 1, md: 1.5 },
                                        fontWeight: 700,
                                        fontSize: { xs: '0.9rem', md: '1rem' },
                                        minWidth: { xs: 140, md: 160 },
                                        boxShadow: editMode ? 'none' : `
                                            0 8px 25px ${alpha(getRoleColor()[400], 0.3)},
                                            0 4px 12px ${alpha(COLORS.SECONDARY[400], 0.2)}
                                        `,
                                        ...(editMode ? {
                                            borderColor: COLORS.GRAY[400],
                                            color: COLORS.GRAY[700],
                                            borderWidth: 3,
                                            background: alpha(COLORS.GRAY[50], 0.8),
                                            '&:hover': {
                                                borderColor: COLORS.GRAY[500],
                                                backgroundColor: alpha(COLORS.GRAY[100], 0.9),
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 8px 25px ${alpha(COLORS.GRAY[400], 0.2)}`
                                            }
                                        } : {
                                            background: `linear-gradient(135deg, 
                                                ${getRoleColor()[500]} 0%, 
                                                ${getRoleColor()[600]} 50%, 
                                                ${getRoleColor()[700]} 100%
                                            )`,
                                            color: COLORS.COMMON.WHITE,
                                            border: `2px solid ${alpha(COLORS.COMMON.WHITE, 0.3)}`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, 
                                                    ${getRoleColor()[600]} 0%, 
                                                    ${getRoleColor()[700]} 50%, 
                                                    ${getRoleColor()[800]} 100%
                                                )`,
                                                transform: 'translateY(-3px)',
                                                boxShadow: `
                                                    0 12px 35px ${alpha(getRoleColor()[400], 0.4)},
                                                    0 6px 16px ${alpha(COLORS.SECONDARY[400], 0.25)}
                                                `
                                            }
                                        }),
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {editMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
                                </Button>
                            </Box>

                            {/* Content Layout: Left (Avatar + Name + Role) | Right (Form Fields) */}
                            <Box sx={{
                                flex: 1,
                                display: 'flex',
                                minHeight: 0,
                                overflow: 'hidden',
                                mt: { xs: 1, md: 2 }
                            }}>
                                <Fade in timeout={800}>
                                    <Grid
                                        container
                                        spacing={{ xs: 2, sm: 3, md: 4 }}
                                        sx={{
                                            height: '100%',
                                            overflow: 'hidden',
                                            alignItems: 'stretch',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {/* Left Side - Avatar, Name, Role */}
                                        <Grid item xs={12} md={5} lg={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                py: { xs: 3, sm: 4, md: 5 },
                                                px: { xs: 3, md: 4 },
                                                background: `
                                                linear-gradient(135deg, 
                                                    ${alpha(COLORS.COMMON.WHITE, 0.95)} 0%, 
                                                    ${alpha(getRoleColor()[50], 0.8)} 50%,
                                                    ${alpha(COLORS.WARNING[50], 0.6)} 100%
                                                )
                                            `,
                                                borderRadius: { xs: 4, md: 5 },
                                                backdropFilter: 'blur(20px)',
                                                border: `2px solid ${alpha(getRoleColor()[200], 0.4)}`,
                                                boxShadow: `
                                                0 20px 45px ${alpha(getRoleColor()[300], 0.2)},
                                                0 10px 25px ${alpha(COLORS.WARNING[300], 0.1)},
                                                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.8)}
                                            `,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: -2,
                                                    left: -2,
                                                    right: -2,
                                                    bottom: -2,
                                                    background: `linear-gradient(45deg, 
                                                    ${getRoleColor()[200]} 0%, 
                                                    ${COLORS.WARNING[200]} 50%, 
                                                    ${COLORS.SECONDARY[200]} 100%
                                                )`,
                                                    borderRadius: { xs: 4, md: 5 },
                                                    zIndex: -1,
                                                    opacity: 0.6
                                                }
                                            }}>
                                                {/* Avatar with pet cafe decorations */}
                                                <Box sx={{
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    mb: { xs: 3, md: 4 },
                                                    mx: 'auto'
                                                }}>
                                                    <Avatar
                                                        src={user.avatar}
                                                        sx={{
                                                            width: {
                                                                xs: 120,
                                                                sm: 140,
                                                                md: 160,
                                                                lg: 180
                                                            },
                                                            height: {
                                                                xs: 120,
                                                                sm: 140,
                                                                md: 160,
                                                                lg: 180
                                                            },
                                                            border: `5px solid ${alpha(COLORS.COMMON.WHITE, 0.9)}`,
                                                            boxShadow: `
                                                                0 20px 40px ${alpha(getRoleColor()[400], 0.25)},
                                                                0 10px 25px ${alpha(COLORS.WARNING[400], 0.15)},
                                                                0 5px 15px ${alpha(COLORS.SECONDARY[400], 0.1)},
                                                                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.6)},
                                                                0 0 0 10px ${alpha(getRoleColor()[100], 0.2)}
                                                            `,
                                                            fontSize: {
                                                                xs: '2.5rem',
                                                                sm: '3rem',
                                                                md: '3.5rem',
                                                                lg: '4rem'
                                                            },
                                                            background: `linear-gradient(135deg, 
                                                            ${getRoleColor()[500]} 0%, 
                                                            ${getRoleColor()[600]} 50%, 
                                                            ${getRoleColor()[700]} 100%
                                                        )`,
                                                            fontWeight: 800,
                                                            mx: 'auto',
                                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            position: 'relative',
                                                            color: getRoleColor()[100],
                                                            '&:hover': {
                                                                transform: 'scale(1.08) translateY(-4px)',
                                                                boxShadow: `
                                                                    0 30px 60px ${alpha(getRoleColor()[400], 0.35)},
                                                                    0 15px 35px ${alpha(COLORS.WARNING[400], 0.2)},
                                                                    0 8px 20px ${alpha(COLORS.SECONDARY[400], 0.15)},
                                                                    inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.8)},
                                                                    0 0 0 15px ${alpha(getRoleColor()[100], 0.3)}
                                                                `,
                                                                animation: `${gentleGlow} 2s ease-in-out infinite`
                                                            },
                                                            '&::before': {
                                                                content: '""',
                                                                position: 'absolute',
                                                                top: -5,
                                                                left: -5,
                                                                right: -5,
                                                                bottom: -5,
                                                                background: `conic-gradient(from 45deg, 
                                                                    ${alpha(getRoleColor()[200], 0.6)} 0deg, 
                                                                    ${alpha(COLORS.WARNING[200], 0.6)} 120deg, 
                                                                    ${alpha(COLORS.SECONDARY[200], 0.6)} 240deg, 
                                                                    ${alpha(getRoleColor()[200], 0.6)} 360deg
                                                                )`,
                                                                borderRadius: '50%',
                                                                zIndex: -1,
                                                                opacity: 0.5,
                                                                animation: `${rotate} 12s linear infinite`
                                                            }
                                                        }}
                                                    >
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </Avatar>

                                                    {/* Upload button */}
                                                    <IconButton
                                                        component="label"
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: { xs: 10, md: 15 },
                                                            right: { xs: 10, md: 15 },
                                                            width: { xs: 35, md: 40, lg: 45 },
                                                            height: { xs: 35, md: 40, lg: 45 },
                                                            bgcolor: getRoleColor()[600],
                                                            color: 'white',
                                                            border: `3px solid ${COLORS.COMMON.WHITE}`,
                                                            boxShadow: `
                                                            0 8px 20px ${alpha(getRoleColor()[500], 0.5)},
                                                            0 4px 12px ${alpha(COLORS.COMMON.BLACK, 0.15)}
                                                        `,
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '&:hover': {
                                                                bgcolor: getRoleColor()[700],
                                                                transform: 'scale(1.15) rotate(10deg)',
                                                                boxShadow: `
                                                                0 12px 30px ${alpha(getRoleColor()[500], 0.6)},
                                                                0 6px 18px ${alpha(COLORS.COMMON.BLACK, 0.2)}
                                                            `
                                                            }
                                                        }}
                                                    >
                                                        <PhotoCamera sx={{ fontSize: { xs: 16, md: 18, lg: 20 } }} />
                                                        <input hidden type="file" accept="image/*" onChange={handleAvatarChange} />
                                                    </IconButton>
                                                </Box>

                                                {/* Full Name */}
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 800,
                                                        background: `linear-gradient(135deg, 
                                                        ${getRoleColor()[700]} 0%, 
                                                        ${getRoleColor()[600]} 50%,
                                                        ${COLORS.ERROR[600]} 100%
                                                    )`,
                                                        backgroundClip: 'text',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        mb: { xs: 2, md: 3 },
                                                        textAlign: 'center',
                                                        fontSize: {
                                                            xs: '1.2rem',
                                                            sm: '1.4rem',
                                                            md: '1.6rem',
                                                            lg: '1.8rem'
                                                        },
                                                        textShadow: `2px 2px 4px ${alpha(COLORS.COMMON.BLACK, 0.1)}`
                                                    }}
                                                >
                                                    {user.name || 'Người dùng'}
                                                </Typography>

                                                {/* Role */}
                                                <Chip
                                                    icon={<Star sx={{ fontSize: { xs: 14, md: 16, lg: 18 } }} />}
                                                    label={getRoleDisplayName()}
                                                    sx={{
                                                        px: { xs: 1.5, md: 2 },
                                                        py: { xs: 0.5, md: 0.8 },
                                                        fontSize: { xs: '0.85rem', md: '0.9rem', lg: '1rem' },
                                                        fontWeight: 700,
                                                        background: `linear-gradient(135deg, 
                                                        ${getRoleColor()[500]} 0%, 
                                                        ${getRoleColor()[600]} 50%,
                                                        ${getRoleColor()[700]} 100%
                                                    )`,
                                                        color: COLORS.COMMON.WHITE,
                                                        border: `2px solid ${alpha(COLORS.COMMON.WHITE, 0.3)}`,
                                                        boxShadow: `
                                                        0 8px 20px ${alpha(getRoleColor()[400], 0.4)},
                                                        inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.3)}
                                                    `,
                                                        '& .MuiChip-icon': {
                                                            color: COLORS.COMMON.WHITE
                                                        },
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `
                                                            0 12px 30px ${alpha(getRoleColor()[400], 0.5)},
                                                            inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.4)}
                                                        `
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Grid>

                                        {/* Right Side - Form Fields in 2x2 layout */}
                                        <Grid item xs={12} md={7} lg={8}>
                                            <Box sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-evenly',
                                                alignItems: 'stretch',
                                                py: { xs: 3, sm: 4, md: 5 },
                                                px: { xs: 3, sm: 4, md: 5 },
                                                background: `
                                                linear-gradient(135deg, 
                                                    ${alpha(COLORS.COMMON.WHITE, 0.95)} 0%, 
                                                    ${alpha(COLORS.SECONDARY[50], 0.8)} 30%,
                                                    ${alpha(getRoleColor()[50], 0.7)} 70%,
                                                    ${alpha(COLORS.WARNING[50], 0.6)} 100%
                                                )
                                            `,
                                                borderRadius: { xs: 4, md: 5 },
                                                backdropFilter: 'blur(25px)',
                                                border: `2px solid ${alpha(getRoleColor()[200], 0.3)}`,
                                                boxShadow: `
                                                0 25px 50px ${alpha(COLORS.SECONDARY[300], 0.15)},
                                                0 15px 30px ${alpha(getRoleColor()[300], 0.1)},
                                                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.8)},
                                                0 0 0 8px ${alpha(getRoleColor()[100], 0.2)}
                                            `,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: `
                                                        radial-gradient(circle at 20% 20%, ${alpha(getRoleColor()[100], 0.3)} 0%, transparent 50%),
                                                        radial-gradient(circle at 80% 80%, ${alpha(COLORS.WARNING[100], 0.2)} 0%, transparent 50%)
                                                    `,
                                                    pointerEvents: 'none',
                                                    zIndex: 0
                                                }
                                            }}>
                                                {/* Row 1: Email + Phone + Birth Date */}
                                                <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} sx={{ mb: { xs: 4, sm: 5, md: 6 }, position: 'relative', zIndex: 1 }}>
                                                    {/* Email Field */}
                                                    <Grid item xs={12} sm={4}>
                                                        <Box sx={getFieldContainerStyle(getRoleColor)}>
                                                            <Typography
                                                                variant="body1"
                                                                sx={getLabelStyle(getRoleColor)}
                                                            >
                                                                <span style={{ fontSize: '1.3em', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}>📧</span>
                                                                Email
                                                            </Typography>
                                                            <TextField
                                                                fullWidth
                                                                name="email"
                                                                type="email"
                                                                value={user.email || ''}
                                                                onChange={handleUserChange}
                                                                disabled={!editMode}
                                                                placeholder="Nhập địa chỉ email của bạn"
                                                                sx={getTextFieldStyle(getRoleColor, editMode)}
                                                            />
                                                        </Box>
                                                    </Grid>

                                                    {/* Phone Field */}
                                                    <Grid item xs={12} sm={4}>
                                                        <Box sx={getFieldContainerStyle(getRoleColor)}>
                                                            <Typography
                                                                variant="body1"
                                                                sx={getLabelStyle(getRoleColor)}
                                                            >
                                                                <span style={{ fontSize: '1.3em', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}>📱</span>
                                                                Số điện thoại
                                                            </Typography>
                                                            <TextField
                                                                fullWidth
                                                                name="phone"
                                                                value={user.phone || ''}
                                                                onChange={handleUserChange}
                                                                disabled={!editMode}
                                                                placeholder="Nhập số điện thoại của bạn"
                                                                sx={getTextFieldStyle(getRoleColor, editMode)}
                                                            />
                                                        </Box>
                                                    </Grid>

                                                    {/* Birth Date Field */}
                                                    <Grid item xs={12} sm={4}>
                                                        <Box sx={getFieldContainerStyle(getRoleColor)}>
                                                            <Typography
                                                                variant="body1"
                                                                sx={getLabelStyle(getRoleColor)}
                                                            >
                                                                <span style={{ fontSize: '1.3em', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}>🎂</span>
                                                                Ngày sinh
                                                            </Typography>
                                                            <TextField
                                                                fullWidth
                                                                name="birthDate"
                                                                type="date"
                                                                value={user.birthDate || ''}
                                                                onChange={handleUserChange}
                                                                disabled={!editMode}
                                                                InputLabelProps={{ shrink: true }}
                                                                sx={getTextFieldStyle(getRoleColor, editMode)}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                {/* Row 2: Address (Exact width matching 3 fields above) */}
                                                <Box sx={{
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    width: '100%',
                                                    display: 'flex',
                                                    mt: { xs: 1, md: 2 }
                                                }}>
                                                    <Box sx={{
                                                        ...getFieldContainerStyle(getRoleColor),
                                                        width: '100%'
                                                    }}>
                                                        <Typography
                                                            variant="body1"
                                                            sx={getLabelStyle(getRoleColor)}
                                                        >
                                                            <span style={{ fontSize: '1.3em', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}>📍</span>
                                                            Địa chỉ
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            name="address"
                                                            value={user.address || ''}
                                                            onChange={handleUserChange}
                                                            disabled={!editMode}
                                                            placeholder="Nhập địa chỉ đầy đủ của bạn"
                                                            sx={getTextFieldStyle(getRoleColor, editMode)}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Fade>
                            </Box>

                            {/* Save/Cancel buttons */}
                            {editMode && (
                                <Box sx={{
                                    display: 'flex',
                                    gap: { xs: 2, sm: 3 },
                                    mt: { xs: 2, sm: 3 },
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    pt: { xs: 3, md: 4 },
                                    borderTop: `3px solid ${alpha(getRoleColor()[300], 0.3)}`,
                                    flexShrink: 0,
                                    background: `linear-gradient(135deg, 
                                        ${alpha(COLORS.COMMON.WHITE, 0.8)} 0%, 
                                        ${alpha(getRoleColor()[50], 0.5)} 100%
                                    )`,
                                    borderRadius: { xs: 3, md: 4 },
                                    mx: -2,
                                    px: 2
                                }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Cancel />}
                                        onClick={() => setEditMode(false)}
                                        size="large"
                                        sx={{
                                            borderRadius: { xs: 2, md: 3 },
                                            textTransform: 'none',
                                            px: { xs: 3, md: 4 },
                                            py: { xs: 1, md: 1.5 },
                                            fontWeight: 700,
                                            fontSize: { xs: '0.9rem', md: '1rem' },
                                            borderWidth: 2,
                                            borderColor: COLORS.GRAY[400],
                                            color: COLORS.GRAY[700],
                                            minWidth: { xs: '100%', sm: 130, md: 150 },
                                            background: alpha(COLORS.GRAY[100], 0.8),
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: `
                                                0 8px 25px ${alpha(COLORS.GRAY[400], 0.15)},
                                                inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.6)}
                                            `,
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                borderColor: COLORS.GRAY[500],
                                                backgroundColor: alpha(COLORS.GRAY[200], 0.9),
                                                transform: 'translateY(-3px)',
                                                boxShadow: `
                                                    0 12px 35px ${alpha(COLORS.GRAY[400], 0.25)},
                                                    inset 0 1px 0 ${alpha(COLORS.COMMON.WHITE, 0.7)}
                                                `
                                            }
                                        }}
                                    >
                                        Hủy chỉnh sửa
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Save />}
                                        onClick={handleSaveProfile}
                                        size="large"
                                        sx={{
                                            borderRadius: { xs: 2, md: 3 },
                                            textTransform: 'none',
                                            px: { xs: 3, md: 4 },
                                            py: { xs: 1, md: 1.5 },
                                            fontWeight: 800,
                                            fontSize: { xs: '0.9rem', md: '1rem' },
                                            minWidth: { xs: '100%', sm: 130, md: 150 },
                                            background: `linear-gradient(135deg, 
                                                ${getRoleColor()[500]} 0%, 
                                                ${getRoleColor()[600]} 30%,
                                                ${getRoleColor()[700]} 70%,
                                                ${getRoleColor()[600]} 100%
                                            )`,
                                            border: `2px solid ${alpha(COLORS.COMMON.WHITE, 0.3)}`,
                                            boxShadow: `
                                                0 12px 35px ${alpha(getRoleColor()[400], 0.4)},
                                                0 6px 20px ${alpha(COLORS.SECONDARY[400], 0.2)},
                                                inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.3)}
                                            `,
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                background: `linear-gradient(135deg, 
                                                    ${getRoleColor()[600]} 0%, 
                                                    ${getRoleColor()[700]} 30%,
                                                    ${getRoleColor()[800]} 70%,
                                                    ${getRoleColor()[700]} 100%
                                                )`,
                                                transform: 'translateY(-4px)',
                                                boxShadow: `
                                                    0 16px 45px ${alpha(getRoleColor()[400], 0.5)},
                                                    0 8px 25px ${alpha(COLORS.SECONDARY[400], 0.3)},
                                                    inset 0 2px 4px ${alpha(COLORS.COMMON.WHITE, 0.4)}
                                                `
                                            }
                                        }}
                                    >
                                        Lưu thông tin
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>


            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default ProfilePage;