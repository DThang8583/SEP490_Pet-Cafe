import React, { useState } from 'react';
import {
    Card, CardContent, CardMedia, Typography, Button, Chip, Box,
    Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, alpha, Zoom, Divider
} from '@mui/material';
import {
    Schedule, LocationOn, Star, Favorite, FavoriteBorder,
    Info, AccessTime, AttachMoney, Pets, LocalHospital,
    School, Spa, Loyalty, CalendarToday, People, Note
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

                    {/* Category Badge */}
                    <Chip
                        icon={getCategoryIcon(service.category)}
                        label={service.petRequired === false ? 'Dịch vụ của cửa hàng' : 'Chăm sóc pet'}
                        sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            backgroundColor: service.petRequired === false ?
                                alpha(COLORS.WARNING[500], 0.9) :
                                alpha(COLORS.INFO[500], 0.9),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                                color: 'white'
                            }
                        }}
                    />

                    {/* Removed Service Type Badge */}

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
                        {/* Show time info for cafe services (specific date/time) */}
                        {service.petRequired === false && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime sx={{ fontSize: 16, color: categoryColor[500] }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Thời gian: <strong>
                                        {service.serviceStartDate ?
                                            `${service.serviceStartDate.split('-').reverse().join('/')} - ${service.serviceEndDate.split('-').reverse().join('/')}, ${Math.floor((service.serviceStartTime || 8 * 60) / 60).toString().padStart(2, '0')}:${((service.serviceStartTime || 8 * 60) % 60).toString().padStart(2, '0')}-${Math.floor((service.serviceEndTime || 20 * 60) / 60).toString().padStart(2, '0')}:${((service.serviceEndTime || 20 * 60) % 60).toString().padStart(2, '0')}`
                                            : '15/01/2024 - 20/01/2024, 8:00-20:00'
                                        }
                                    </strong>
                                </Typography>
                            </Box>
                        )}

                        {/* Show time info for pet care services (daily hours) */}
                        {service.petRequired === true && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime sx={{ fontSize: 16, color: categoryColor[500] }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Giờ hoạt động: <strong>8:00 - 20:00 (Hàng ngày)</strong>
                                </Typography>
                            </Box>
                        )}

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
                        borderRadius: 4,
                        background: `linear-gradient(135deg, 
                            ${COLORS.BACKGROUND.DEFAULT} 0%, 
                            ${alpha(categoryColor[50], 0.8)} 100%
                        )`
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, 
                        ${categoryColor[500]} 0%, 
                        ${categoryColor[600]} 100%
                    )`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    {service.petRequired === false ? <Spa sx={{ fontSize: 24 }} /> : getCategoryIcon(service.category)}
                    {service.name}
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        {/* Service Image */}
                        <Box
                            component="img"
                            src={service.image_url || (service.thumbnails && service.thumbnails[0]) || `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop`}
                            alt={service.name}
                            sx={{
                                width: '100%',
                                height: 250,
                                objectFit: 'cover',
                                borderRadius: 3
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

                        {/* Description */}
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {service.description}
                        </Typography>

                        {/* Service Type Info */}
                        <Box sx={{
                            p: 3,
                            backgroundColor: service.petRequired === false ?
                                alpha(COLORS.WARNING[100], 0.3) :
                                alpha(COLORS.INFO[100], 0.3),
                            borderRadius: 3,
                            border: `2px solid ${service.petRequired === false ?
                                alpha(COLORS.WARNING[300], 0.5) :
                                alpha(COLORS.INFO[300], 0.5)}`,
                            mb: 3
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                {service.petRequired === false ? (
                                    <Spa sx={{
                                        fontSize: 24,
                                        color: COLORS.WARNING[500]
                                    }} />
                                ) : (
                                    <Pets sx={{
                                        fontSize: 24,
                                        color: COLORS.INFO[500]
                                    }} />
                                )}
                                <Typography variant="h6" sx={{
                                    color: service.petRequired === false ? COLORS.WARNING[700] : COLORS.INFO[700],
                                    fontWeight: 'bold'
                                }}>
                                    {service.petRequired === false ? '🐾 Dịch vụ của cửa hàng' : '🐕 Chăm sóc pet'}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                {service.petRequired === false ?
                                    'Sử dụng pet của cafe - Không cần mang theo pet của bạn' :
                                    'Cần mang theo pet của bạn để thực hiện dịch vụ'
                                }
                            </Typography>
                        </Box>

                        {/* Service Basic Info */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                            p: 3,
                            backgroundColor: alpha(categoryColor[100], 0.3),
                            borderRadius: 3
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color={categoryColor[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                    Giá cơ bản
                                </Typography>
                                <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                    {formatPrice(service.base_price || service.price || 0)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color={categoryColor[700]} fontWeight="bold" sx={{ mb: 1 }}>
                                    Thời lượng
                                </Typography>
                                <Typography variant="body1">
                                    {formatDuration(service.duration_minutes || 0)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Available Slots */}
                        {service.slots && service.slots.length > 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: categoryColor[700], fontWeight: 'bold' }}>
                                    Lịch trình có sẵn
                                </Typography>
                                <Stack spacing={2}>
                                    {service.slots
                                        .filter(slot => slot && !slot.is_deleted)
                                        .map((slot, index) => {
                                            const slotPrice = slot.price !== null && slot.price !== undefined ? slot.price : (service.base_price || 0);
                                            const isAvailable = slot.service_status === 'AVAILABLE';
                                            
                                            return (
                                                <Box
                                                    key={slot.id || index}
                                                    sx={{
                                                        p: 2.5,
                                                        borderRadius: 2,
                                                        border: `2px solid ${isAvailable ? alpha(categoryColor[300], 0.5) : alpha(COLORS.GRAY[300], 0.3)}`,
                                                        backgroundColor: isAvailable ? alpha(categoryColor[50], 0.5) : alpha(COLORS.GRAY[50], 0.3),
                                                        opacity: isAvailable ? 1 : 0.6
                                                    }}
                                                >
                                                    <Stack spacing={1.5}>
                                                        {/* Status Badge */}
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Chip
                                                                label={isAvailable ? 'Có sẵn' : 'Không khả dụng'}
                                                                size="small"
                                                                color={isAvailable ? 'success' : 'default'}
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                            {slotPrice > 0 && (
                                                                <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 'bold' }}>
                                                                    {formatPrice(slotPrice)}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {/* Day of Week */}
                                                        {slot.day_of_week && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarToday sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                                <Typography variant="body1" fontWeight={600}>
                                                                    {WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                                </Typography>
                                                                {slot.is_recurring && (
                                                                    <Chip label="Lặp lại" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* Specific Date */}
                                                        {slot.specific_date && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarToday sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                                <Typography variant="body1">
                                                                    Ngày: {new Date(slot.specific_date).toLocaleDateString('vi-VN')}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {/* Time Range */}
                                                        {slot.start_time && slot.end_time && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AccessTime sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                                <Typography variant="body1">
                                                                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {/* Max Capacity */}
                                                        {slot.max_capacity !== null && slot.max_capacity !== undefined && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <People sx={{ fontSize: 18, color: categoryColor[500] }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Sức chứa tối đa: <strong>{slot.max_capacity}</strong> {service.petRequired ? 'thú cưng' : 'người'}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {/* Pet Group Info */}
                                                        {slot.pet_group && (
                                                            <Box sx={{
                                                                p: 1.5,
                                                                borderRadius: 1,
                                                                backgroundColor: alpha(categoryColor[100], 0.3),
                                                                border: `1px solid ${alpha(categoryColor[200], 0.3)}`
                                                            }}>
                                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                                                    Nhóm thú cưng: {slot.pet_group.name}
                                                                </Typography>
                                                                {slot.pet_group.description && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {slot.pet_group.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* Special Notes */}
                                                        {slot.special_notes && (
                                                            <Box sx={{
                                                                p: 1.5,
                                                                borderRadius: 1,
                                                                backgroundColor: alpha(COLORS.WARNING[50], 0.5),
                                                                border: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                                                    <Note sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.25 }} />
                                                                    <Box>
                                                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: COLORS.WARNING[700] }}>
                                                                            Ghi chú đặc biệt:
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {slot.special_notes}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                </Stack>
                            </Box>
                        )}

                        {/* Task Information */}
                        {service.task && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: categoryColor[700], fontWeight: 'bold' }}>
                                    Thông tin nhiệm vụ
                                </Typography>
                                <Box sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    backgroundColor: alpha(categoryColor[50], 0.5),
                                    border: `1px solid ${alpha(categoryColor[200], 0.3)}`
                                }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                        {service.task.title}
                                    </Typography>
                                    {service.task.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {service.task.description}
                                        </Typography>
                                    )}
                                    {service.task.estimated_hours && (
                                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ fontSize: 16, color: categoryColor[500] }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Thời gian ước tính: <strong>{service.task.estimated_hours} giờ</strong>
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Features/Benefits */}
                        {service.features && service.features.length > 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: categoryColor[700] }}>
                                    Dịch vụ bao gồm:
                                </Typography>
                                <Stack spacing={1}>
                                    {service.features.map((feature, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    backgroundColor: categoryColor[500]
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 2 }}>
                    <Button
                        onClick={() => setShowDetails(false)}
                        sx={{
                            color: COLORS.GRAY[600],
                            '&:hover': {
                                backgroundColor: alpha(COLORS.GRAY[100], 0.8)
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
                            '&:hover': {
                                background: service.petRequired === false ?
                                    `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[700]} 100%)` :
                                    `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[700]} 100%)`
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
