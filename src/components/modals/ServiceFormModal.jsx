import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, InputAdornment, Typography, Paper, Divider, IconButton, Stack, alpha, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Image as ImageIcon, Close, LocalOffer } from '@mui/icons-material';
import { formatPrice } from '../../utils/formatPrice';
import { COLORS } from '../../constants/colors';
import { uploadFile } from '../../api/fileApi';

const ServiceFormModal = ({ open, onClose, onSubmit, taskData, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        task_id: '',
        name: '',
        description: '',
        duration_minutes: 0,
        base_price: 0,
        image_url: '',
        thumbnails: [],
        is_active: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Reset form function - defined before useEffect to avoid initialization error
    const resetForm = useCallback(() => {
        setFormData({
            task_id: '',
            name: '',
            description: '',
            duration_minutes: 0,
            base_price: 0,
            image_url: '',
            thumbnails: [],
            is_active: false
        });
        setImagePreviews([]);
        setErrors({});
    }, []);

    // Initialize form data when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                // Edit mode: load existing service data
                setFormData({
                    task_id: initialData.task_id || '',
                    name: initialData.name || '',
                    description: initialData.description || '',
                    duration_minutes: initialData.duration_minutes || 0,
                    base_price: initialData.base_price || 0,
                    image_url: initialData.image_url || '',
                    thumbnails: initialData.thumbnails || [],
                    is_active: initialData.is_active !== undefined ? initialData.is_active : false
                });
                // Set image previews from existing data
                const previews = [];
                if (initialData.image_url) previews.push(initialData.image_url);
                if (initialData.thumbnails) previews.push(...initialData.thumbnails);
                setImagePreviews(previews);
            } else if (mode === 'create' && taskData) {
                // Create mode: auto-fill from task
                setFormData({
                    task_id: taskData.id,
                    name: taskData.title || taskData.name || '',
                    description: taskData.description || '',
                    duration_minutes: taskData.estimated_hours ? taskData.estimated_hours * 60 : 0,
                    base_price: 0,
                    image_url: '',
                    thumbnails: [],
                    is_active: false
                });
                setImagePreviews([]);
            } else {
                resetForm();
            }
            setErrors({});
        }
    }, [open, mode, taskData, initialData, resetForm]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field using functional update
        setErrors(prev => {
            if (prev[field]) {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            }
            return prev;
        });
    }, []);

    // Handle multiple images upload
    const handleImagesUpload = useCallback(async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Limit to 5 images total
        setImagePreviews(prev => {
            if (prev.length + files.length > 5) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    images: 'Chỉ được tải tối đa 5 ảnh'
                }));
                event.target.value = '';
                return prev;
            }
            return prev;
        });

        const validFiles = [];
        for (const file of files) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({
                    ...prev,
                    images: 'Vui lòng chọn file hình ảnh'
                }));
                event.target.value = '';
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    images: 'Kích thước file không được vượt quá 5MB'
                }));
                event.target.value = '';
                return;
            }

            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // Clear previous errors
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.images;
            return newErrors;
        });

        // Set uploading state
        setUploadingImages(true);

        try {
            // Upload all files to server
            const uploadPromises = validFiles.map(file => uploadFile(file));
            const uploadedUrls = await Promise.all(uploadPromises);

            // Update previews and form data using functional updates
            setImagePreviews(prev => {
                const newPreviews = [...prev, ...uploadedUrls];

                // Update formData: first image is main, rest are thumbnails
                setFormData(formDataPrev => ({
                    ...formDataPrev,
                    image_url: newPreviews[0] || '',
                    thumbnails: newPreviews.slice(1)
                }));

                return newPreviews;
            });
        } catch (error) {
            console.error('Error uploading images:', error);
            setErrors(prev => ({
                ...prev,
                images: error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
            }));
        } finally {
            setUploadingImages(false);
            event.target.value = '';
        }
    }, []);

    // Handle remove single image
    const handleRemoveImage = useCallback((index) => {
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);

            // Update formData: first image is main, rest are thumbnails
            setFormData(formDataPrev => ({
                ...formDataPrev,
                image_url: newPreviews[0] || '',
                thumbnails: newPreviews.slice(1)
            }));

            return newPreviews;
        });

        // Clear error if any
        setErrors(prev => {
            if (prev.images) {
                const newErrors = { ...prev };
                delete newErrors.images;
                return newErrors;
            }
            return prev;
        });
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.task_id) {
            newErrors.task_id = 'Task ID là bắt buộc';
        }

        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'Tên dịch vụ là bắt buộc';
        }

        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Mô tả dịch vụ là bắt buộc';
        }

        if (!formData.duration_minutes || formData.duration_minutes <= 0) {
            newErrors.duration_minutes = 'Thời gian phải lớn hơn 0';
        }

        if (formData.base_price === undefined || formData.base_price === null || formData.base_price <= 0) {
            newErrors.base_price = 'Giá dịch vụ là bắt buộc và phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare submit data according to API PUT /api/services/{id}
            const submitData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                duration_minutes: parseInt(formData.duration_minutes) || 0,
                base_price: parseFloat(formData.base_price) || 0,
                image_url: formData.image_url && formData.image_url.trim() ? formData.image_url.trim() : '',
                thumbnails: formData.thumbnails && Array.isArray(formData.thumbnails) && formData.thumbnails.length > 0
                    ? formData.thumbnails.filter(url => url && url.trim()).map(url => url.trim())
                    : [],
                task_id: formData.task_id,
                is_active: Boolean(formData.is_active)
            };

            await onSubmit(submitData);
            resetForm();
            onClose();
        } catch (error) {
            setErrors({
                submit: error.message || 'Có lỗi xảy ra'
            });
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, onSubmit, resetForm, onClose]);

    const handleClose = useCallback(() => {
        if (loading) return;
        resetForm();
        onClose();
    }, [loading, resetForm, onClose]);

    // Memoize computed values for performance
    const durationHours = useMemo(() => {
        if (formData.duration_minutes <= 0) return null;
        return {
            hours: Math.floor(formData.duration_minutes / 60),
            minutes: formData.duration_minutes % 60
        };
    }, [formData.duration_minutes]);

    const formattedPrice = useMemo(() => {
        return formData.base_price > 0 ? formatPrice(formData.base_price) : null;
    }, [formData.base_price]);

    const thumbnailCount = useMemo(() => {
        return Math.max(0, imagePreviews.length - 1);
    }, [imagePreviews.length]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`
                }
            }}
        >
            <Box
                sx={{
                    bgcolor: mode === 'edit' ? COLORS.INFO[50] : COLORS.SUCCESS[50],
                    borderBottom: `3px solid ${mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500]}`
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    color: mode === 'edit' ? COLORS.INFO[800] : COLORS.SUCCESS[800],
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {mode === 'edit' ? <LocalOffer /> : <ImageIcon />}
                        <Typography variant="h6" component="span">
                            {mode === 'edit' ? '✏️ Chỉnh sửa Dịch vụ' : '➕ Tạo Dịch vụ từ Nhiệm vụ'}
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={handleClose}
                        disabled={loading}
                        sx={{
                            color: mode === 'edit' ? COLORS.INFO[800] : COLORS.SUCCESS[800],
                            '&:hover': {
                                bgcolor: alpha(mode === 'edit' ? COLORS.INFO[100] : COLORS.SUCCESS[100], 0.5)
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Task Info (for create mode) */}
                {mode === 'create' && taskData && (
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            bgcolor: alpha(COLORS.INFO[50], 0.3),
                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: COLORS.INFO[700] }}>
                            📋 Thông tin nhiệm vụ:
                        </Typography>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {taskData.title || taskData.name}
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                            {taskData.work_type && (
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    🏷️ {taskData.work_type.name}
                                </Typography>
                            )}
                            {taskData.estimated_hours > 0 && (
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    ⏱️ {taskData.estimated_hours} giờ
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                )}

                <Stack spacing={3} sx={{ mt: 0 }}>
                    {/* Multiple Images Upload */}
                    <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom sx={{ mb: 1.5 }}>
                            Hình ảnh dịch vụ <Typography component="span" variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>(Tùy chọn - Tối đa 5 ảnh)</Typography>
                        </Typography>

                        {/* Upload Button */}
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={uploadingImages ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            disabled={loading || uploadingImages || imagePreviews.length >= 5}
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                        >
                            {uploadingImages ? 'Đang tải lên...' : (imagePreviews.length > 0 ? 'Thêm ảnh' : 'Tải ảnh lên')}
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleImagesUpload}
                                disabled={uploadingImages}
                            />
                        </Button>

                        {/* Image Previews Grid */}
                        {imagePreviews.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                {/* Main Image Section */}
                                {imagePreviews.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                            📸 Ảnh chính (image_url)
                                        </Typography>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: 2,
                                            maxWidth: '300px'
                                        }}>
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    paddingTop: '100%',
                                                    borderRadius: 1,
                                                    overflow: 'hidden',
                                                    border: '2px solid',
                                                    borderColor: 'primary.main',
                                                    boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY[200], 0.3)}`
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        bgcolor: 'primary.main',
                                                        color: 'white',
                                                        px: 1,
                                                        py: 0.5,
                                                        fontSize: '0.625rem',
                                                        fontWeight: 600,
                                                        zIndex: 1,
                                                        width: '100%',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    ẢNH CHÍNH
                                                </Box>
                                                <Box
                                                    component="img"
                                                    src={imagePreviews[0]}
                                                    alt="Main image"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveImage(0)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                        color: 'white',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0, 0, 0, 0.8)'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}

                                {/* Thumbnails Section */}
                                {imagePreviews.length > 1 && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                            🖼️ Ảnh phụ - Thumbnails ({imagePreviews.length - 1} ảnh)
                                        </Typography>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                            gap: 2
                                        }}>
                                            {imagePreviews.slice(1).map((preview, index) => (
                                                <Box
                                                    key={index + 1}
                                                    sx={{
                                                        position: 'relative',
                                                        paddingTop: '100%',
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            bgcolor: alpha(COLORS.SECONDARY[500], 0.8),
                                                            color: 'white',
                                                            px: 0.5,
                                                            py: 0.25,
                                                            fontSize: '0.5rem',
                                                            fontWeight: 600,
                                                            zIndex: 1,
                                                            width: '100%',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        THUMBNAIL {index + 1}
                                                    </Box>
                                                    <Box
                                                        component="img"
                                                        src={preview}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveImage(index + 1)}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0, 0, 0, 0.8)'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {errors.images && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: COLORS.ERROR[600], fontWeight: 500 }}>
                                {errors.images}
                            </Typography>
                        )}
                        {!errors.images && imagePreviews.length === 0 && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: COLORS.TEXT.SECONDARY }}>
                                📌 <strong>Hướng dẫn:</strong> Ảnh đầu tiên sẽ là <strong>ảnh chính (image_url)</strong>, các ảnh sau sẽ là <strong>ảnh phụ (thumbnails)</strong>
                            </Typography>
                        )}
                        {!errors.images && imagePreviews.length > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: COLORS.SUCCESS[700], fontWeight: 500 }}>
                                ✅ Đã tải {imagePreviews.length} ảnh: 1 ảnh chính + {thumbnailCount} thumbnails
                            </Typography>
                        )}
                    </Box>

                    {/* Name */}
                    <TextField
                        fullWidth
                        required
                        label="Tên dịch vụ *"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={loading}
                        error={!!errors.name}
                        helperText={errors.name || (mode === 'edit' ? 'Có thể chỉnh sửa tên dịch vụ' : 'Nhập tên dịch vụ')}
                        placeholder="Ví dụ: Combo Trải Nghiệm Thú Cưng"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Description */}
                    <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Mô tả chi tiết *"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        disabled={loading}
                        error={!!errors.description}
                        helperText={errors.description || (mode === 'edit' ? 'Có thể chỉnh sửa mô tả dịch vụ' : 'Nhập mô tả chi tiết về dịch vụ')}
                        placeholder="Mô tả chi tiết về dịch vụ..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Duration Minutes */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Thời gian thực hiện *"
                        value={formData.duration_minutes || ''}
                        onChange={(e) => handleChange('duration_minutes', e.target.value === '' ? '' : parseInt(e.target.value))}
                        disabled={loading}
                        error={!!errors.duration_minutes}
                        helperText={errors.duration_minutes || 'Thời gian thực hiện dịch vụ (phút)'}
                        placeholder="Nhập thời gian (phút)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                            inputProps: { min: 1, step: 5 }
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Duration Preview */}
                    {durationHours && (
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(COLORS.INFO[50], 0.3),
                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                ⏱️ Thời gian: <strong>{formData.duration_minutes} phút</strong>
                                {formData.duration_minutes >= 60 && (
                                    <span> ({durationHours.hours}h {durationHours.minutes}m)</span>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* Base Price */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Giá dịch vụ *"
                        value={formData.base_price || ''}
                        onChange={(e) => handleChange('base_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        disabled={loading}
                        error={!!errors.base_price}
                        helperText={errors.base_price || 'Giá dịch vụ cho khách hàng (VNĐ)'}
                        placeholder="Nhập giá (VNĐ)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                            inputProps: { min: 0, step: 1000 }
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Price Preview */}
                    {formattedPrice && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.SUCCESS[50], 0.3),
                                border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                            }}
                        >
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 0.5, fontWeight: 600 }}>
                                💰 Giá dịch vụ
                            </Typography>
                            <Typography variant="h5" fontWeight={700} sx={{ color: COLORS.SUCCESS[700] }}>
                                {formattedPrice}
                            </Typography>
                        </Box>
                    )}

                    {/* Trạng thái dịch vụ - Chỉ hiển thị khi edit */}
                    {mode === 'edit' && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(formData.is_active ? COLORS.SUCCESS[50] : COLORS.WARNING[50], 0.3),
                                border: `1px solid ${alpha(formData.is_active ? COLORS.SUCCESS[200] : COLORS.WARNING[200], 0.3)}`
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active === true}
                                        onChange={(e) => handleChange('is_active', e.target.checked)}
                                        color="success"
                                        sx={{ mr: 1 }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body1" fontWeight={600} sx={{ color: formData.is_active ? COLORS.SUCCESS[700] : COLORS.WARNING[700] }}>
                                            {formData.is_active ? '✅ Dịch vụ đang Hoạt động' : '⛔ Dịch vụ Không hoạt động'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mt: 0.5 }}>
                                            {formData.is_active
                                                ? 'Dịch vụ có sẵn cho khách hàng đặt lịch'
                                                : 'Dịch vụ không hiển thị cho khách hàng'}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    )}

                    {/* Status Info */}
                    <Alert
                        severity={mode === 'create' ? 'info' : formData.is_active ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        <Typography variant="body2">
                            💡 <strong>Lưu ý:</strong>
                            <br />
                            {mode === 'create' ? (
                                <>
                                    • Dịch vụ sẽ được tạo với trạng thái <strong>Không hoạt động</strong> mặc định
                                    <br />
                                    • Bạn có thể kích hoạt dịch vụ sau khi tạo xong
                                </>
                            ) : formData.is_active ? (
                                <>
                                    • Dịch vụ <strong>đang Hoạt động</strong> và sẵn sàng phục vụ khách hàng
                                    <br />
                                    • Khách hàng có thể xem và đặt lịch dịch vụ này
                                </>
                            ) : (
                                <>
                                    • Dịch vụ <strong>Không hoạt động</strong> - không hiển thị cho khách hàng
                                    <br />
                                    • Bật công tắc bên trên để kích hoạt dịch vụ
                                </>
                            )}
                        </Typography>
                    </Alert>
                </Stack>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                pt: 2,
                pb: 2,
                gap: 1.5
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{
                        minWidth: 100,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: alpha(COLORS.BORDER.DEFAULT, 0.5)
                    }}
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    color={mode === 'edit' ? 'info' : 'success'}
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: `0 4px 12px ${alpha(mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500], 0.3)}`,
                        '&:hover': {
                            boxShadow: `0 6px 16px ${alpha(mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500], 0.4)}`
                        }
                    }}
                >
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập Nhật' : 'Tạo Dịch vụ')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceFormModal;
