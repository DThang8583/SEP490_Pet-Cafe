import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    alpha,
    Fade,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import { Search, TrendingUp, Star, Schedule, Pets, AttachMoney } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';

const PopularServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadServices = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('authToken');
                
                const response = await fetch('https://petcafes.azurewebsites.net/api/services?page=0&limit=999', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();
                const allServices = Array.isArray(json?.data) ? json.data : [];
                
                // Filter only active services
                const activeServices = allServices.filter(service => service?.is_active && !service?.is_deleted);
                
                setServices(activeServices);
            } catch (e) {
                console.error('[PopularServicesPage] Error loading services:', e);
                setError(e.message || 'Không thể tải danh sách dịch vụ');
            } finally {
                setLoading(false);
            }
        };

        loadServices();
    }, []);

    // Sort services by popularity (you can adjust this logic based on your API data)
    // For now, we'll sort by price (lower price = more popular) or by name
    const sortedServices = useMemo(() => {
        return [...services].sort((a, b) => {
            // Sort by price (ascending) - cheaper services are more popular
            const priceA = a.price || a.base_price || 0;
            const priceB = b.price || b.base_price || 0;
            return priceA - priceB;
        });
    }, [services]);

    const filteredServices = sortedServices.filter(service => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            service.name?.toLowerCase().includes(query) ||
            service.description?.toLowerCase().includes(query) ||
            service.task?.name?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <CircularProgress size={60} sx={{ color: COLORS.ERROR[500] }} />
            </Box>
        );
    }

    return (
        <Fade in timeout={800}>
            <Box sx={{
                py: { xs: 2, md: 4 },
                minHeight: '100vh',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="lg">
                    {/* Header */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 4 }} spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <TrendingUp sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                    Dịch vụ bán chạy
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                    Những dịch vụ được yêu thích nhất tại Pet Cafe
                                </Typography>
                            </Box>
                        </Stack>
                        {filteredServices.length > 0 && (
                            <Chip
                                color="error"
                                icon={<TrendingUp />}
                                label={`${filteredServices.length} dịch vụ`}
                                sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.95rem', py: 1.5, px: 2 }}
                            />
                        )}
                    </Stack>

                    {/* Search Bar */}
                    <Box sx={{ mb: 4 }}>
                        <TextField
                            fullWidth
                            placeholder="Tìm kiếm dịch vụ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: COLORS.ERROR[500] }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    backgroundColor: COLORS.BACKGROUND.PAPER,
                                    '&:hover fieldset': {
                                        borderColor: COLORS.ERROR[300],
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: COLORS.ERROR[500],
                                    },
                                },
                            }}
                        />
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Services Grid */}
                    {filteredServices.length === 0 ? (
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: 6,
                            border: `1px solid ${COLORS.BORDER.LIGHT}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER,
                            textAlign: 'center',
                            py: 6
                        }}>
                            <CardContent>
                                <TrendingUp sx={{ fontSize: 64, color: COLORS.ERROR[300], mb: 2, opacity: 0.6 }} />
                                <Typography variant="h6" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                    {searchQuery ? 'Không tìm thấy dịch vụ nào' : 'Chưa có dịch vụ nào'}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                            {filteredServices.map((service, index) => (
                                <Grid key={service.id} sx={{ 
                                    width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Card sx={{
                                        borderRadius: 4,
                                        boxShadow: 6,
                                        border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                        backgroundColor: COLORS.BACKGROUND.PAPER,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 10
                                        }
                                    }}>
                                        {/* Popular Badge */}
                                        {index < 3 && (
                                            <Chip
                                                icon={<Star />}
                                                label={`Top ${index + 1}`}
                                                color="error"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    zIndex: 1,
                                                    fontWeight: 700,
                                                    boxShadow: 2
                                                }}
                                            />
                                        )}

                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={service.image_url || service.thumbnail_url || 'https://via.placeholder.com/400x200?text=Service'}
                                            alt={service.name}
                                            sx={{
                                                objectFit: 'cover',
                                                backgroundColor: alpha(COLORS.ERROR[100], 0.3)
                                            }}
                                        />
                                        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                            <Typography variant="h6" sx={{
                                                fontWeight: 800,
                                                color: COLORS.ERROR[600],
                                                mb: 1,
                                                fontSize: '1.1rem',
                                                pr: index < 3 ? 6 : 0
                                            }}>
                                                {service.name || 'Dịch vụ'}
                                            </Typography>
                                            
                                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                                                {service.task && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Schedule sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            <strong>Loại:</strong> {service.task.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {(service.price || service.base_price) && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AttachMoney sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            <strong>Giá:</strong> {formatPrice(service.price || service.base_price || 0)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {service.duration && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Schedule sx={{ fontSize: 18, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            <strong>Thời gian:</strong> {service.duration} phút
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            {service.description && (
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.TEXT.SECONDARY,
                                                    fontSize: '0.875rem',
                                                    mb: 2,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {service.description}
                                                </Typography>
                                            )}

                                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                                {service.is_active && (
                                                    <Chip
                                                        label="Đang hoạt động"
                                                        color="success"
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                )}
                                                {index < 5 && (
                                                    <Chip
                                                        icon={<TrendingUp />}
                                                        label="Bán chạy"
                                                        color="error"
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                )}
                                            </Stack>

                                            <Button
                                                variant="contained"
                                                color="error"
                                                fullWidth
                                                onClick={() => window.location.href = '/booking'}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    py: 1.2
                                                }}
                                            >
                                                Đặt lịch ngay
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>
        </Fade>
    );
};

export default PopularServicesPage;
