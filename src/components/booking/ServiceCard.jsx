import React, { useState } from 'react';
import {
    Card, CardContent, CardMedia, Typography, Button, Chip, Box,
    Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, alpha, Zoom, Divider, Grid, Paper
} from '@mui/material';
import {
    Schedule, LocationOn, Star, Favorite, FavoriteBorder,
    Info, AccessTime, AttachMoney, Pets, LocalHospital,
    School, Spa, Loyalty, CalendarToday, People, Note, Close
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const ServiceCard = ({ service, onSelect, onCardClick, showFavorite = true }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Check if cafe service is still available based on date and time
    const isServiceAvailable = () => {
        if (service.petRequired === false) {
            // Cafe service - check if service hasn't ended yet
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

            // Use service's actual time data if available, otherwise use default
            const serviceStartDate = service.serviceStartDate || '2024-01-15';
            const serviceEndDate = service.serviceEndDate || '2024-01-20';

            // For demo purposes, show cafe services if they haven't ended yet
            // In production, you might want to check registration period instead
            const isNotEnded = currentDate <= serviceEndDate;

            return isNotEnded;
        }
        return true; // Pet care services are always available
    };

    // Don't render if cafe service is not available
    if (service.petRequired === false && !isServiceAvailable()) {
        return null;
    }

    // Service category icons
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'grooming':
                return <Loyalty sx={{ fontSize: 20 }} />;
            case 'training':
                return <Loyalty sx={{ fontSize: 20 }} />;
            case 'healthcare':
                return <Loyalty sx={{ fontSize: 20 }} />;
            case 'daycare':
                return <Loyalty sx={{ fontSize: 20 }} />;
            case 'cafe_service':
                return <Spa sx={{ fontSize: 20 }} />;
            default:
                return <Loyalty sx={{ fontSize: 20 }} />;
        }
    };

    // Category colors
    const getCategoryColor = (category) => {
        switch (category) {
            case 'grooming':
                return COLORS.INFO;
            case 'training':
                return COLORS.WARNING;
            case 'healthcare':
                return COLORS.ERROR;
            case 'daycare':
                return COLORS.SECONDARY;
            case 'cafe_service':
                return COLORS.WARNING;
            default:
                return COLORS.PRIMARY;
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Format duration
    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} phút`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}p` : `${hours} giờ`;
    };

    // Handle favorite toggle
    const handleFavoriteToggle = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        // TODO: Call API to update favorite status
    };

    const categoryColor = getCategoryColor(service.category);

    return (
        <>
            <Card
                sx={{
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: { xs: 3, md: 4 },
                    overflow: 'hidden',
                    background: `linear-gradient(145deg, 
                        ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)} 0%, 
                        ${alpha(categoryColor[50], 0.9)} 100%
                    )`,
                    border: `2px solid ${alpha(categoryColor[200], 0.3)}`,
                    boxShadow: `
                        0 8px 32px ${alpha(categoryColor[300], 0.15)},
                        0 4px 16px ${alpha(COLORS.SECONDARY[300], 0.1)}
                    `,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                        transform: { xs: 'translateY(-4px) scale(1.01)', md: 'translateY(-8px) scale(1.02)' },
                        boxShadow: `
                            0 16px 48px ${alpha(categoryColor[300], 0.25)},
                            0 8px 24px ${alpha(COLORS.SECONDARY[300], 0.15)}
                        `,
                        '& .service-image': {
                            transform: 'scale(1.1)'
                        }
                    }
                }}
                onClick={() => {
                    if (onCardClick) {
                        onCardClick(service);
                    } else {
                        onSelect(service);
                    }
                }}
            >
                {/* Service Image */}
                <Box sx={{ position: 'relative', overflow: 'hidden', height: 250 }}>
                    <CardMedia
                        component="img"
                        height="250"
                        image={service.image_url || (service.thumbnails && service.thumbnails[0]) || `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`}
                        alt={service.name}
                        className="service-image"
                        sx={{
                            transition: 'transform 0.3s ease',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            // Fallback to thumbnail or placeholder if image_url fails
                            if (service.image_url && service.thumbnails && service.thumbnails[0]) {
                                e.target.src = service.thumbnails[0];
                            } else {
                                e.target.src = `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`;
                            }
                        }}
                    />

                    {/* Removed Favorite Button */}

                    {/* Removed Price Badge */}
                </Box>

                <CardContent sx={{ p: 6, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Service Name */}
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 'bold',
                            color: categoryColor[700],
                            mb: 2,
                            fontSize: '1.3rem',
                            lineHeight: 1.3
                        }}
                    >
                        {service.name}
                    </Typography>

                    {/* Service Description */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            mb: 2,
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {service.description}
                    </Typography>

                    {/* Service Details */}
                    <Stack spacing={1} sx={{ mb: 3 }}>

                        {service.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ fontSize: 16, color: categoryColor[500] }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Địa điểm: <strong>{service.location}</strong>
                                </Typography>
                            </Box>
                        )}

                        {service.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ fontSize: 16, color: COLORS.WARNING[500] }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Đánh giá: <strong>{service.rating}/5</strong> ({service.reviewCount || 0} đánh giá)
                                </Typography>
                            </Box>
                        )}
                    </Stack>

                    {/* Action Buttons */}
                    <Box sx={{ mt: 'auto' }}>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(service);
                                }}
                                sx={{
                                    borderRadius: 4,
                                    py: 1.8,
                                    px: 3,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    minHeight: '48px',
                                    background: service.petRequired === false ?
                                        `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[600]} 100%)` :
                                        `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[600]} 100%)`,
                                    boxShadow: service.petRequired === false ?
                                        `0 4px 16px ${alpha(COLORS.WARNING[500], 0.3)}` :
                                        `0 4px 16px ${alpha(COLORS.INFO[500], 0.3)}`,
                                    '&:hover': {
                                        background: service.petRequired === false ?
                                            `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[700]} 100%)` :
                                            `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[700]} 100%)`,
                                        transform: 'translateY(-2px)',
                                        boxShadow: service.petRequired === false ?
                                            `0 6px 20px ${alpha(COLORS.WARNING[500], 0.4)}` :
                                            `0 6px 20px ${alpha(COLORS.INFO[500], 0.4)}`
                                    }
                                }}
                            >
                                Đặt dịch vụ
                            </Button>

                            <Tooltip title="Xem chi tiết">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDetails(true);
                                    }}
                                    sx={{
                                        border: service.petRequired === false ?
                                            `2px solid ${alpha(COLORS.WARNING[300], 0.5)}` :
                                            `2px solid ${alpha(COLORS.INFO[300], 0.5)}`,
                                        color: service.petRequired === false ?
                                            COLORS.WARNING[600] :
                                            COLORS.INFO[600],
                                        '&:hover': {
                                            backgroundColor: service.petRequired === false ?
                                                alpha(COLORS.WARNING[100], 0.8) :
                                                alpha(COLORS.INFO[100], 0.8),
                                            borderColor: service.petRequired === false ?
                                                COLORS.WARNING[400] :
                                                COLORS.INFO[400]
                                        }
                                    }}
                                >
                                    <Info />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* Service Details Modal */}
            <Dialog
                open={showDetails}
                onClose={() => setShowDetails(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: `0 8px 32px ${alpha(COLORS.GRAY[900], 0.12)}`,
                        overflow: 'hidden',
                        maxHeight: '90vh'
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    background: `linear-gradient(135deg, ${categoryColor[500]} 0%, ${categoryColor[600]} 100%)`,
                    color: 'white',
                    p: 3,
                    position: 'relative'
                }}>
                    <IconButton
                        onClick={() => setShowDetails(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            '&:hover': {
                                bgcolor: alpha('#fff', 0.15)
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700, pr: 5 }}>
                    {service.name}
                    </Typography>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                        {/* Service Image */}
                        <Box
                            component="img"
                            src={service.image_url || (service.thumbnails && service.thumbnails[0]) || `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`}
                            alt={service.name}
                            sx={{
                                width: '100%',
                            height: 280,
                                objectFit: 'cover',
                            display: 'block'
                            }}
                            onError={(e) => {
                                if (service.image_url && service.thumbnails && service.thumbnails[0]) {
                                    e.target.src = service.thumbnails[0];
                                } else {
                                    e.target.src = `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`;
                                }
                            }}
                        />

                    {/* Content */}
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            {/* Price and Duration - Highlight Cards */}
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(COLORS.ERROR[50], 0.6),
                                            border: `1.5px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
                                            <AttachMoney sx={{ fontSize: 18, color: COLORS.ERROR[600] }} />
                                            <Typography variant="caption" sx={{
                                                color: COLORS.ERROR[700],
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5
                                            }}>
                                    Giá cơ bản
                                </Typography>
                                        </Stack>
                                        <Typography variant="h6" sx={{
                                            color: COLORS.ERROR[700],
                                            fontWeight: 700,
                                            fontSize: '1.25rem'
                                        }}>
                                    {formatPrice(service.base_price || service.price || 0)}
                                </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(categoryColor[50], 0.6),
                                            border: `1.5px solid ${alpha(categoryColor[200], 0.5)}`,
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 18, color: categoryColor[600] }} />
                                            <Typography variant="caption" sx={{
                                                color: categoryColor[700],
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5
                                            }}>
                                    Thời lượng
                                </Typography>
                                        </Stack>
                                        <Typography variant="h6" sx={{
                                            color: categoryColor[700],
                                            fontWeight: 700,
                                            fontSize: '1.25rem'
                                        }}>
                                    {formatDuration(service.duration_minutes || 0)}
                                </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Description */}
                            <Box>
                                <Typography variant="subtitle2" sx={{
                                    fontWeight: 700,
                                    color: COLORS.TEXT.PRIMARY,
                                    mb: 1.5,
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1
                                }}>
                                    Mô tả dịch vụ
                                </Typography>
                                <Typography variant="body1" sx={{
                                    lineHeight: 1.8,
                                    color: COLORS.TEXT.SECONDARY,
                                    fontSize: '0.9375rem'
                                }}>
                                    {service.description || 'Chưa có mô tả cho dịch vụ này.'}
                                                                </Typography>
                                                        </Box>

                            {/* Additional Info */}
                            <Stack spacing={1.5}>
                                {service.location && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <LocationOn sx={{ fontSize: 20, color: categoryColor[600], flexShrink: 0 }} />
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            <strong style={{ color: COLORS.TEXT.PRIMARY }}>Địa điểm:</strong> {service.location}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                {service.rating && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Star sx={{ fontSize: 20, color: COLORS.WARNING[500], flexShrink: 0 }} />
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            <strong style={{ color: COLORS.TEXT.PRIMARY }}>Đánh giá:</strong> {service.rating}/5
                                            {service.reviewCount && ` (${service.reviewCount} đánh giá)`}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                {(service.petRequired === false && service.serviceStartDate) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <CalendarToday sx={{ fontSize: 20, color: categoryColor[600], flexShrink: 0 }} />
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            <strong style={{ color: COLORS.TEXT.PRIMARY }}>Thời gian:</strong> {
                                                `${service.serviceStartDate.split('-').reverse().join('/')} - ${service.serviceEndDate.split('-').reverse().join('/')}, ${Math.floor((service.serviceStartTime || 8 * 60) / 60).toString().padStart(2, '0')}:${((service.serviceStartTime || 8 * 60) % 60).toString().padStart(2, '0')}-${Math.floor((service.serviceEndTime || 20 * 60) / 60).toString().padStart(2, '0')}:${((service.serviceEndTime || 20 * 60) % 60).toString().padStart(2, '0')}`
                                            }
                                                                </Typography>
                                                            </Box>
                                                        )}
                                </Stack>

                        {/* Task Information */}
                        {service.task && (
                            <Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" sx={{
                                        fontWeight: 700,
                                        color: COLORS.TEXT.PRIMARY,
                                        mb: 1.5,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1
                                    }}>
                                    Thông tin nhiệm vụ
                                </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                            bgcolor: alpha(categoryColor[50], 0.4),
                                            border: `1px solid ${alpha(categoryColor[200], 0.4)}`
                                        }}
                                    >
                                        <Stack spacing={1.5}>
                                            <Typography variant="subtitle1" fontWeight={700} sx={{
                                                color: COLORS.TEXT.PRIMARY,
                                                fontSize: '1rem'
                                            }}>
                                        {service.task.title}
                                    </Typography>
                                    {service.task.description && (
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.TEXT.SECONDARY,
                                                    lineHeight: 1.7,
                                                    fontSize: '0.875rem'
                                                }}>
                                            {service.task.description}
                                        </Typography>
                                    )}
                                    {service.task.estimated_hours && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    pt: 1.5,
                                                    borderTop: `1px solid ${alpha(categoryColor[200], 0.3)}`
                                                }}>
                                                    <AccessTime sx={{ fontSize: 16, color: categoryColor[600] }} />
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem' }}>
                                                        Thời gian ước tính: <strong style={{ color: COLORS.TEXT.PRIMARY }}>{service.task.estimated_hours} giờ</strong>
                                            </Typography>
                                        </Box>
                                    )}
                                        </Stack>
                                    </Paper>
                            </Box>
                        )}

                        {/* Features/Benefits */}
                        {service.features && service.features.length > 0 && (
                            <Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" sx={{
                                        fontWeight: 700,
                                        color: COLORS.TEXT.PRIMARY,
                                        mb: 1.5,
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1
                                    }}>
                                        Dịch vụ bao gồm
                                </Typography>
                                <Stack spacing={1}>
                                    {service.features.map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                                p: 1.5,
                                                borderRadius: 1.5,
                                                bgcolor: alpha(categoryColor[50], 0.3),
                                                border: `1px solid ${alpha(categoryColor[200], 0.2)}`
                                            }}>
                                            <Box
                                                sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                        bgcolor: categoryColor[500],
                                                        flexShrink: 0,
                                                        mt: 1
                                                }}
                                            />
                                                <Typography variant="body2" sx={{
                                                    color: COLORS.TEXT.PRIMARY,
                                                    lineHeight: 1.6,
                                                    fontSize: '0.875rem'
                                                }}>
                                                {feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                    </Box>
                </DialogContent>

                <DialogActions sx={{
                    p: 2.5,
                    gap: 2,
                    borderTop: `1px solid ${alpha(COLORS.GRAY[200], 0.3)}`,
                    bgcolor: alpha(COLORS.GRAY[50], 0.5)
                }}>
                    <Button
                        onClick={() => setShowDetails(false)}
                        variant="outlined"
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            borderColor: COLORS.GRAY[300],
                            px: 3,
                            py: 1,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            minWidth: 100,
                            '&:hover': {
                                bgcolor: COLORS.GRAY[100],
                                borderColor: COLORS.GRAY[400]
                            }
                        }}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowDetails(false);
                            onSelect(service);
                        }}
                        sx={{
                            background: service.petRequired === false ?
                                `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[600]} 100%)` :
                                `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[600]} 100%)`,
                            px: 4,
                            py: 1,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            minWidth: 160,
                            boxShadow: service.petRequired === false ?
                                `0 2px 8px ${alpha(COLORS.WARNING[500], 0.3)}` :
                                `0 2px 8px ${alpha(COLORS.INFO[500], 0.3)}`,
                            '&:hover': {
                                background: service.petRequired === false ?
                                    `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[700]} 100%)` :
                                    `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[700]} 100%)`,
                                boxShadow: service.petRequired === false ?
                                    `0 4px 12px ${alpha(COLORS.WARNING[500], 0.4)}` :
                                    `0 4px 12px ${alpha(COLORS.INFO[500], 0.4)}`
                            }
                        }}
                    >
                        Đặt dịch vụ ngay
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ServiceCard;
