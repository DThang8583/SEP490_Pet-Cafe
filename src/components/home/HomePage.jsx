import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia, Avatar, Chip, Stack, useTheme, alpha, Fade, Zoom, IconButton, Divider, Slide, Grow } from '@mui/material';
import { LocalCafe, Pets, Cake, Coffee, Restaurant, ConfirmationNumber, LocationOn, Star, Favorite, ArrowForward, Facebook, Instagram, Twitter, EmojiFoodBeverage, Cookie, Fastfood, WineBar, HotTub, AutoAwesome, ChevronLeft, ChevronRight, Schedule, TrendingUp } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
// Data now provided dynamically or via API; remove static import
import { hero, servicesSection, menuSection, petAreasSection, testimonialsSection, quickNav, siteName } from '../../data/homeConfig';

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
                if (role === 'manager') {
                    navigate('/manager/dashboard', { replace: true });
                    return;
                }
                if (role === 'sales_staff') {
                    navigate('/sales/dashboard', { replace: true });
                    return;
                }
                if (role === 'working_staff') {
                    navigate('/staff/dashboard', { replace: true });
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


    // Data arrays (empty — can be populated from API)
    const [features, setFeatures] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [apiError, setApiError] = useState('');
    const [loadingHome, setLoadingHome] = useState(false);
    const menuScrollRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    
    const formatPrice = (v) => {
        if (v === null || v === undefined || v === '') return '';
        const num = Number(v);
        if (Number.isNaN(num)) return String(v);
        return num.toLocaleString('vi-VN') + ' VNĐ';
    };

    useEffect(() => {
        const loadHomeData = async () => {
            setLoadingHome(true);
            setApiError('');
            try {
                const token = localStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' };

                const svcUrl = 'https://petcafes.azurewebsites.net/api/services?page=0&limit=6';
                const petUrl = 'https://petcafes.azurewebsites.net/api/pets?page=0&limit=6';

                const [svcResp, petResp] = await Promise.all([fetch(svcUrl, { headers }), fetch(petUrl, { headers })]);

                if (svcResp.ok) {
                    const svcJson = await svcResp.json();
                    console.debug('[HomePage] services response:', svcJson);
                    const svcList = Array.isArray(svcJson?.data) ? svcJson.data : [];
                    setFeatures(svcList.slice(0, 4).map(s => ({
                        imageUrl: s.image_url || null,
                        icon: <LocalCafe sx={{ fontSize: 40 }} />,
                        title: s.name || 'Dịch vụ',
                        description: s.description || ''
                    })));
                } else {
                    console.warn('[HomePage] services fetch failed', svcResp.status);
                }

                if (petResp.ok) {
                    const petJson = await petResp.json();
                    console.debug('[HomePage] pets (for testimonials) response:', petJson);
                    const petList = Array.isArray(petJson?.data) ? petJson.data : [];
                    // pick up to 3 pets to show as "testimonials"
                    setTestimonials(petList.slice(0, 3).map(p => ({
                        name: p.name || 'Bạn bốn chân',
                        avatarUrl: p.image_url || p.avatar_url || null,
                        avatarLetter: (p.name || 'P')[0] || 'P',
                        rating: 5,
                        comment: p.special_notes || `${p.name || 'Bạn ấy'} rất thích Pet Cafe!`
                    })));
                } else {
                    console.warn('[HomePage] pets fetch failed', petResp.status);
                }
                
                // Fetch product categories for menu section (use same API as MenuPage)
                try {
                    const catUrl = 'https://petcafes.azurewebsites.net/api/product-categories';
                    const catResp = await fetch(catUrl, { headers });
                    if (catResp.ok) {
                        const catJson = await catResp.json();
                        console.debug('[HomePage] product-categories response:', catJson);
                        const catList = Array.isArray(catJson?.data) ? catJson.data : [];
                        setMenuItems(catList.slice(0, 6).map(cat => ({
                            category: cat.name || 'Danh mục',
                            imageUrl: cat.image_url || null,
                            icon: cat.image_url ? <Box component="img" src={cat.image_url} alt={cat.name} sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : <Cookie sx={{ fontSize: 40 }} />,
                            items: Array.isArray(cat.products) ? cat.products.slice(0, 4).map(p => ({
                                name: p.name || 'Món',
                                price: p.price || '',
                                description: p.description || '',
                                imageUrl: p.image_url || (p.thumbnails && p.thumbnails[0]) || null
                            })) : []
                        })));
                    } else {
                        console.warn('[HomePage] product-categories fetch failed', catResp.status);
                    }
                } catch (catErr) {
                    console.error('[HomePage] product-categories error', catErr);
                }
            } catch (err) {
                console.error('[HomePage] loadHomeData error', err);
                setApiError(err.message || 'Không thể tải dữ liệu trang chủ');
            } finally {
                setLoadingHome(false);
            }
        };

        loadHomeData();
    }, []);

    // update scroll state when menuItems change or on resize
    useEffect(() => {
        const el = menuScrollRef.current;
        const update = () => {
            if (!el) return;
            const max = Math.max(el.scrollWidth - el.clientWidth, 0);
            setCanScrollLeft(el.scrollLeft > 5);
            setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
            const prog = max > 0 ? Math.round((el.scrollLeft / max) * 100) : 0;
            setScrollProgress(prog);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [menuItems]);

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
                                        {siteName}
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
                                        🐾 {hero.subtitleLine1} ☕
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
                                        {hero.subtitleLine2}
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                            <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Pets />}
                                            onClick={() => navigate('/booking')}
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
                                            {hero.primaryCta.label}
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
                                            {hero.secondaryCta.label}
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
                                {servicesSection.title}
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
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mx: 'auto',
                                                    mb: 4,
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* outer orange ring / gradient */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`,
                                                    filter: 'blur(6px)',
                                                    opacity: 0.85,
                                                    zIndex: 0
                                                }} />

                                                {/* inner image or icon */}
                                                {feature.imageUrl ? (
                                                    <Box component="img"
                                                        src={feature.imageUrl}
                                                        alt={feature.title}
                                                        sx={{
                                                            width: 80,
                                                            height: 80,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            zIndex: 1,
                                                            boxShadow: `0 6px 18px ${alpha(COLORS.SHADOW?.DARK || '#000', 0.12)}`,
                                                            border: `4px solid ${alpha(COLORS.ERROR[100], 0.35)}`
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{ zIndex: 1 }}>
                                                        {feature.icon}
                                                    </Box>
                                                )}
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
                                {menuSection.subtitle}
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
                                {menuSection.buttonLabel}
                            </Button>
                        </Box>
                    </Slide>

                    {/* Custom horizontal slider with arrows + progress */}
                    <Box sx={{ position: 'relative', mt: 2 }}>
                        <IconButton
                            onClick={() => {
                                const el = menuScrollRef.current;
                                if (!el) return;
                                el.scrollBy({ left: -Math.round(el.clientWidth * 0.75), behavior: 'smooth' });
                            }}
                            disabled={!menuItems.length}
                            sx={{
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                boxShadow: `0 6px 18px ${alpha(COLORS.ERROR[200], 0.15)}`,
                                '&:hover': { bgcolor: alpha(COLORS.BACKGROUND.DEFAULT, 1) }
                            }}
                        >
                            <ChevronLeft />
                        </IconButton>

                        <Box
                            ref={menuScrollRef}
                            onScroll={() => {
                                const el = menuScrollRef.current;
                                if (!el) return;
                                const max = Math.max(el.scrollWidth - el.clientWidth, 1);
                                const prog = Math.round((el.scrollLeft / max) * 100);
                                setScrollProgress(prog);
                                setCanScrollLeft(el.scrollLeft > 5);
                                setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
                            }}
                            sx={{
                                display: 'flex',
                                gap: 3,
                                overflowX: 'auto',
                                scrollBehavior: 'smooth',
                                py: 1,
                                pb: 2,
                                px: { xs: 1, sm: 0 },
                                '&::-webkit-scrollbar': { height: 8 },
                                '&::-webkit-scrollbar-track': { background: 'transparent' },
                                '&::-webkit-scrollbar-thumb': { background: alpha(COLORS.ERROR[300], 0.6), borderRadius: 4 },
                                '&': { scrollSnapType: 'x mandatory' }
                            }}
                        >
                            {menuItems.map((category, index) => (
                                <Box key={index} sx={{ minWidth: 300, flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                    <Grow in timeout={1400 + index * 200}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                borderRadius: 4,
                                                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                                                backdropFilter: 'blur(18px)',
                                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.35)}`,
                                                boxShadow: `0 18px 36px ${alpha(COLORS.ERROR[200], 0.18)}`,
                                                transition: 'all 0.36s ease',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Box sx={{
                                                        width: 64,
                                                        height: 64,
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        mr: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: `linear-gradient(135deg, ${COLORS.ERROR[200]}, ${COLORS.SECONDARY[200]})`
                                                    }}>
                                                        {category.imageUrl ? (
                                                            <Box component="img" src={category.imageUrl} alt={category.category} sx={{ width: 64, height: 64, objectFit: 'cover' }} />
                                                        ) : (
                                                            category.icon
                                                        )}
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500] }}>
                                                        {category.category}
                                                    </Typography>
                                                </Box>
                                                <Stack spacing={2}>
                                                    {category.items.slice(0, 4).map((item, itemIndex) => (
                                                        <Box key={itemIndex} sx={{
                                                            p: 2,
                                                            borderRadius: 2,
                                                            backgroundColor: alpha(COLORS.SECONDARY[50], 0.6),
                                                            border: `1px solid ${alpha(COLORS.ERROR[100], 0.3)}`,
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <Box sx={{ pr: 2, flex: 1 }}>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                                                    {item.name}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                                    {item.description}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], ml: 2 }}>
                                                                {formatPrice(item.price)}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grow>
                                </Box>
                            ))}
                        </Box>

                        <IconButton
                            onClick={() => {
                                const el = menuScrollRef.current;
                                if (!el) return;
                                el.scrollBy({ left: Math.round(el.clientWidth * 0.75), behavior: 'smooth' });
                            }}
                            disabled={!menuItems.length}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: alpha(COLORS.BACKGROUND.DEFAULT, 0.9),
                                boxShadow: `0 6px 18px ${alpha(COLORS.ERROR[200], 0.15)}`,
                                '&:hover': { bgcolor: alpha(COLORS.BACKGROUND.DEFAULT, 1) }
                            }}
                        >
                            <ChevronRight />
                        </IconButton>

                        {/* progress indicator */}
                        <Box sx={{ mt: 2, px: { xs: 1, sm: 0 } }}>
                            <Box sx={{ height: 6, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3), borderRadius: 6, overflow: 'hidden' }}>
                                <Box sx={{ width: `${scrollProgress}%`, height: '100%', background: COLORS.ERROR[500], transition: 'width 220ms linear' }} />
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Pet Areas removed */}

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
                                Một số người bạn 4 chân của chúng tôi
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
                                                    src={testimonial.avatarUrl || undefined}
                                                    sx={{
                                                        bgcolor: COLORS.ERROR[500],
                                                        width: 50,
                                                        height: 50,
                                                        mr: 2
                                                    }}
                                                >
                                                    {!testimonial.avatarUrl ? testimonial.avatarLetter : null}
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
                                {quickNav.title}
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
                                {quickNav.subtitle}
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
                                startIcon={<Schedule />}
                                onClick={() => navigate('/booking')}
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
                                Đặt lịch dịch vụ
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<Pets />}
                                onClick={() => navigate('/pets')}
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
                                Danh sách chó mèo
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<TrendingUp />}
                                onClick={() => navigate('/popular-services')}
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
                                Dịch vụ bán chạy
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
            </Box>
        </Box>
    );
};

export default HomePage;
