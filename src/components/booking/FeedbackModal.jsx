import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Grid, TextField, Button, Stack, Rating, FormControl,
    FormLabel, RadioGroup, FormControlLabel, Radio, Chip,
    Alert, CircularProgress, alpha, Fade, Avatar
} from '@mui/material';
import {
    Feedback, Close, Star, Send, ThumbUp, ThumbDown,
    Pets, Schedule, AttachMoney, Recommend, PhotoCamera
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const FeedbackModal = ({ open, onClose, booking, onSubmit }) => {
    // State management
    const [feedbackData, setFeedbackData] = useState({
        overallRating: 0,
        serviceQuality: 0,
        staffFriendliness: 0,
        cleanliness: 0,
        valueForMoney: 0,
        comment: '',
        recommend: '',
        improvements: '',
        photos: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    // Feedback categories
    const ratingCategories = [
        {
            key: 'serviceQuality',
            label: 'Chất lượng dịch vụ',
            icon: <Pets />,
            description: 'Đánh giá về chất lượng dịch vụ chăm sóc thú cưng'
        },
        {
            key: 'staffFriendliness',
            label: 'Thái độ nhân viên',
            icon: <ThumbUp />,
            description: 'Sự thân thiện và chuyên nghiệp của nhân viên'
        },
        {
            key: 'cleanliness',
            label: 'Vệ sinh sạch sẽ',
            icon: <Star />,
            description: 'Độ sạch sẽ của không gian và dụng cụ'
        },
        {
            key: 'valueForMoney',
            label: 'Giá trị đồng tiền',
            icon: <AttachMoney />,
            description: 'Mức độ xứng đáng giữa giá cả và chất lượng'
        }
    ];

    // Reset form when modal opens
    React.useEffect(() => {
        if (open) {
            setFeedbackData({
                overallRating: 0,
                serviceQuality: 0,
                staffFriendliness: 0,
                cleanliness: 0,
                valueForMoney: 0,
                comment: '',
                recommend: '',
                improvements: '',
                photos: []
            });
            setErrors({});
            setSubmitting(false);
            setSuccessMessage('');
        }
    }, [open]);

    // Handle rating change
    const handleRatingChange = (category, value) => {
        setFeedbackData(prev => ({
            ...prev,
            [category]: value
        }));

        // Clear error for this field
        if (errors[category]) {
            setErrors(prev => ({
                ...prev,
                [category]: ''
            }));
        }
    };

    // Handle text field change
    const handleFieldChange = (field, value) => {
        setFeedbackData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle photo upload
    const handlePhotoUpload = (event) => {
        const files = Array.from(event.target.files);
        const newPhotos = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name
        }));

        setFeedbackData(prev => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos].slice(0, 5) // Max 5 photos
        }));
    };

    // Remove photo
    const removePhoto = (index) => {
        setFeedbackData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (feedbackData.overallRating === 0) {
            newErrors.overallRating = 'Vui lòng đánh giá tổng thể';
        }

        if (!feedbackData.comment.trim()) {
            newErrors.comment = 'Vui lòng chia sẻ nhận xét của bạn';
        } else if (feedbackData.comment.trim().length < 10) {
            newErrors.comment = 'Nhận xét quá ngắn (tối thiểu 10 ký tự)';
        }

        // Không bắt buộc recommend nữa vì API không yêu cầu
        // if (!feedbackData.recommend) {
        //     newErrors.recommend = 'Vui lòng cho biết bạn có giới thiệu không';
        // }

        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        console.log('[FeedbackModal] Validation result:', isValid, newErrors);
        return isValid;
    };

    // Submit feedback
    const handleSubmit = async () => {
        console.log('[FeedbackModal] handleSubmit called');
        
        if (!validateForm()) {
            console.log('[FeedbackModal] Validation failed:', errors);
            return;
        }

        setSubmitting(true);
        setErrors({});
        setSuccessMessage('');

        try {
            // Calculate average rating
            const ratings = [
                feedbackData.serviceQuality,
                feedbackData.staffFriendliness,
                feedbackData.cleanliness,
                feedbackData.valueForMoney
            ].filter(rating => rating > 0);

            const averageRating = ratings.length > 0 ?
                ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length :
                feedbackData.overallRating;

            const submissionData = {
                ...feedbackData,
                averageRating,
                bookingId: booking?.id,
                serviceId: booking?.service?.id,
                submittedAt: new Date().toISOString()
            };

            console.log('[FeedbackModal] Calling onSubmit with data:', submissionData);
            console.log('[FeedbackModal] Booking data:', booking);

            await onSubmit(submissionData);
            
            console.log('[FeedbackModal] onSubmit completed successfully');
            
            // Hiển thị thông báo thành công
            setSuccessMessage('Cảm ơn bạn đã đánh giá dịch vụ!');
            setSubmitting(false);
            
            // Đóng modal sau 1.5 giây để người dùng thấy thông báo
            setTimeout(() => {
                onClose();
                setSuccessMessage('');
            }, 1500);
        } catch (error) {
            console.error('[FeedbackModal] Error in handleSubmit:', error);
            setErrors({ submit: error.message || 'Có lỗi xảy ra khi gửi phản hồi' });
            setSubmitting(false);
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (!booking) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    background: `linear-gradient(135deg, 
                        ${COLORS.BACKGROUND.DEFAULT} 0%, 
                        ${alpha(COLORS.WARNING[50], 0.8)} 100%
                    )`
                }
            }}
        >
            <DialogTitle sx={{
                background: `linear-gradient(135deg, 
                    ${COLORS.WARNING[500]} 0%, 
                    ${COLORS.WARNING[600]} 100%
                )`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Feedback />
                    <Typography variant="h6" fontWeight="bold">
                        Đánh giá dịch vụ
                    </Typography>
                </Box>
                <Button
                    onClick={onClose}
                    sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                >
                    <Close />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
                <Fade in timeout={500}>
                    <Stack spacing={4}>
                        {/* Service Summary */}
                        <Box sx={{
                            p: 3,
                            background: `linear-gradient(135deg, 
                                ${alpha(COLORS.INFO[100], 0.8)} 0%, 
                                ${alpha(COLORS.INFO[50], 0.6)} 100%
                            )`,
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.INFO[200], 0.3)}`
                        }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: COLORS.INFO[700] }}>
                                        {booking.service?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Dịch vụ cho {booking.pet?.name} • {formatPrice(booking.finalPrice)}
                                    </Typography>
                                    <Chip
                                        icon={<Schedule />}
                                        label={new Date(booking.bookingDateTime).toLocaleDateString('vi-VN')}
                                        size="small"
                                        sx={{ backgroundColor: alpha(COLORS.INFO[200], 0.8) }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Avatar sx={{
                                        width: 60,
                                        height: 60,
                                        backgroundColor: COLORS.SECONDARY[500],
                                        fontSize: '1.5rem',
                                        mx: 'auto'
                                    }}>
                                        {booking.pet?.name?.charAt(0)}
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Overall Rating */}
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: COLORS.WARNING[700] }}>
                                Đánh giá tổng thể *
                            </Typography>
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Rating
                                    value={feedbackData.overallRating}
                                    onChange={(_, value) => handleRatingChange('overallRating', value)}
                                    size="large"
                                    sx={{
                                        fontSize: '3rem',
                                        '& .MuiRating-iconFilled': {
                                            color: COLORS.WARNING[500]
                                        }
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {feedbackData.overallRating === 0 && 'Chưa đánh giá'}
                                    {feedbackData.overallRating === 1 && 'Rất không hài lòng'}
                                    {feedbackData.overallRating === 2 && 'Không hài lòng'}
                                    {feedbackData.overallRating === 3 && 'Bình thường'}
                                    {feedbackData.overallRating === 4 && 'Hài lòng'}
                                    {feedbackData.overallRating === 5 && 'Rất hài lòng'}
                                </Typography>
                            </Box>
                            {errors.overallRating && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                    {errors.overallRating}
                                </Alert>
                            )}
                        </Box>

                        {/* Written Feedback */}
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: COLORS.WARNING[700] }}>
                                Nhận xét chi tiết *
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ, nhân viên, không gian..."
                                value={feedbackData.comment}
                                onChange={(e) => handleFieldChange('comment', e.target.value)}
                                error={!!errors.comment}
                                helperText={errors.comment || `${feedbackData.comment.length}/500 ký tự`}
                                inputProps={{ maxLength: 500 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3
                                    }
                                }}
                            />
                        </Box>

                        {/* Success Message */}
                        {successMessage && (
                            <Alert 
                                severity="success" 
                                sx={{ 
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                        fontSize: '1.5rem'
                                    }
                                }}
                            >
                                <Typography variant="body1" fontWeight="bold">
                                    {successMessage}
                                </Typography>
                            </Alert>
                        )}

                        {/* Submit Error */}
                        {errors.submit && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {errors.submit}
                            </Alert>
                        )}
                    </Stack>
                </Fade>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                    onClick={onClose}
                    disabled={submitting}
                    sx={{
                        color: COLORS.GRAY[600],
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                        }
                    }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    startIcon={submitting ? null : <Send />}
                    sx={{
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(135deg, 
                            ${COLORS.WARNING[500]} 0%, 
                            ${COLORS.WARNING[600]} 100%
                        )`,
                        '&:hover': {
                            background: `linear-gradient(135deg, 
                                ${COLORS.WARNING[600]} 0%, 
                                ${COLORS.WARNING[700]} 100%
                            )`
                        },
                        '&:disabled': {
                            background: COLORS.GRAY[300]
                        },
                        position: 'relative'
                    }}
                >
                    {submitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                            Đang gửi...
                        </Box>
                    ) : (
                        'Gửi đánh giá'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FeedbackModal;
