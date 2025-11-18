import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, InputAdornment, Typography, Paper, Divider, IconButton, Stack, alpha } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';
import { formatPrice } from '../../utils/formatPrice';
import { COLORS } from '../../constants/colors';

const ServiceFormModal = ({ open, onClose, onSubmit, taskData, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        task_id: '',
        name: '',
        description: '',
        duration_minutes: 0,
        base_price: 0,
        image_url: '',
        thumbnails: []
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);

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
                    thumbnails: initialData.thumbnails || []
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
                    thumbnails: []
                });
                setImagePreviews([]);
            } else {
                resetForm();
            }
            setErrors({});
        }
    }, [open, mode, taskData, initialData]);

    const resetForm = () => {
        setFormData({
            task_id: '',
            name: '',
            description: '',
            duration_minutes: 0,
            base_price: 0,
            image_url: '',
            thumbnails: []
        });
        setImagePreviews([]);
        setErrors({});
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
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

    // Handle multiple images upload
    const handleImagesUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Limit to 5 images total
        if (imagePreviews.length + files.length > 5) {
            setErrors(prev => ({
                ...prev,
                images: 'Chỉ được tải tối đa 5 ảnh'
            }));
            event.target.value = '';
            return;
        }

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

        // Read all files
        const readPromises = validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readPromises).then(results => {
            const newPreviews = [...imagePreviews, ...results];
            setImagePreviews(newPreviews);

            // Set first image as main image_url, rest as thumbnails
            if (newPreviews.length > 0) {
                handleChange('image_url', newPreviews[0]);
                handleChange('thumbnails', newPreviews.slice(1));
            }

            // Clear error
            setErrors(prev => ({
                ...prev,
                images: ''
            }));

            event.target.value = '';
        });
    };

    // Handle remove single image
    const handleRemoveImage = (index) => {
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);

        // Update formData: first image is main, rest are thumbnails
        if (newPreviews.length > 0) {
            handleChange('image_url', newPreviews[0]);
            handleChange('thumbnails', newPreviews.slice(1));
        } else {
            handleChange('image_url', '');
            handleChange('thumbnails', []);
        }

        // Clear error if any
        if (errors.images) {
            setErrors(prev => ({
                ...prev,
                images: ''
            }));
        }
    };

    const validateForm = () => {
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

        if (formData.base_price === undefined || formData.base_price === null || formData.base_price < 0) {
            newErrors.base_price = 'Giá dịch vụ là bắt buộc và không được âm';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare submit data according to API
            const submitData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                duration_minutes: parseInt(formData.duration_minutes),
                base_price: parseFloat(formData.base_price),
                task_id: formData.task_id
            };

            // Only include image fields if they have values
            if (formData.image_url) {
                submitData.image_url = formData.image_url;
            }
            if (formData.thumbnails && formData.thumbnails.length > 0) {
                submitData.thumbnails = formData.thumbnails;
            }

            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            setErrors({
                submit: error.message || 'Có lỗi xảy ra'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

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
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon />
                    {mode === 'edit' ? '✏️ Chỉnh sửa Dịch vụ' : '➕ Tạo Dịch vụ từ Nhiệm vụ'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3, maxHeight: '70vh', overflowY: 'auto' }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Task Info (for create mode) */}
                {mode === 'create' && taskData && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📋 Tạo từ Nhiệm vụ
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {taskData.title || taskData.name}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            {taskData.work_type && (
                                <Typography variant="body2" color="text.secondary">
                                    🏷️ {taskData.work_type.name}
                                </Typography>
                            )}
                            {taskData.estimated_hours > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    ⏱️ {taskData.estimated_hours} giờ
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                )}

                <Stack spacing={2.5}>
                    {/* Multiple Images Upload */}
                    <Box>
                        <Typography variant="body2" fontWeight={500} gutterBottom>
                            Hình ảnh dịch vụ (Tùy chọn - Tối đa 5 ảnh)
                        </Typography>

                        {/* Upload Button */}
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            disabled={loading || imagePreviews.length >= 5}
                            sx={{ mb: 2 }}
                        >
                            {imagePreviews.length > 0 ? 'Thêm ảnh' : 'Tải ảnh lên'}
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleImagesUpload}
                            />
                        </Button>

                        {/* Image Previews Grid */}
                        {imagePreviews.length > 0 && (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: 2,
                                mb: 1
                            }}>
                                {imagePreviews.map((preview, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            paddingTop: '100%',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            border: index === 0 ? '2px solid' : '1px solid',
                                            borderColor: index === 0 ? 'primary.main' : 'divider'
                                        }}
                                    >
                                        {index === 0 && (
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
                                                    zIndex: 1
                                                }}
                                            >
                                                ẢNH CHÍNH
                                            </Box>
                                        )}
                                        <Box
                                            component="img"
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
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
                                            onClick={() => handleRemoveImage(index)}
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
                        )}

                        {errors.images && (
                            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                {errors.images}
                            </Typography>
                        )}
                        {!errors.images && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                📌 Ảnh đầu tiên sẽ là ảnh chính, các ảnh sau là ảnh phụ (thumbnails)
                            </Typography>
                        )}
                    </Box>

                    {/* Name */}
                    <TextField
                        fullWidth
                        required
                        label="Tên dịch vụ"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={loading}
                        error={!!errors.name}
                        helperText={errors.name || 'Có thể chỉnh sửa tên dịch vụ'}
                        placeholder="Ví dụ: Combo Trải Nghiệm Thú Cưng"
                    />

                    {/* Description */}
                    <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Mô tả chi tiết"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        disabled={loading}
                        error={!!errors.description}
                        helperText={errors.description || 'Có thể chỉnh sửa mô tả dịch vụ'}
                        placeholder="Mô tả chi tiết về dịch vụ..."
                    />

                    {/* Duration Minutes */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Thời gian thực hiện"
                        value={formData.duration_minutes || ''}
                        onChange={(e) => handleChange('duration_minutes', e.target.value === '' ? '' : parseInt(e.target.value))}
                        disabled={loading}
                        error={!!errors.duration_minutes}
                        helperText={errors.duration_minutes || 'Thời gian thực hiện dịch vụ'}
                        placeholder="Nhập thời gian (phút)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                            inputProps: { min: 1, step: 5 }
                        }}
                    />

                    {/* Duration Preview */}
                    {formData.duration_minutes > 0 && (
                        <Box sx={{
                            p: 1.5,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                ⏱️ Thời gian: <strong>{formData.duration_minutes} phút</strong>
                                {formData.duration_minutes >= 60 && (
                                    <span> ({Math.floor(formData.duration_minutes / 60)}h {formData.duration_minutes % 60}m)</span>
                                )}
                            </Typography>
                        </Box>
                    )}

                    <Divider />

                    {/* Base Price */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Giá dịch vụ"
                        value={formData.base_price || ''}
                        onChange={(e) => handleChange('base_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        disabled={loading}
                        error={!!errors.base_price}
                        helperText={errors.base_price || 'Giá dịch vụ cho khách hàng'}
                        placeholder="Nhập giá (VNĐ)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                            inputProps: { min: 0, step: 1000 }
                        }}
                    />

                    {/* Price Preview */}
                    {formData.base_price > 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: '#e8f5e9',
                                borderRadius: 1,
                                border: '1px solid #4caf5040'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                💰 Giá dịch vụ
                            </Typography>
                            <Typography variant="h5" fontWeight={600} color="success.main">
                                {formatPrice(formData.base_price)}
                            </Typography>
                        </Paper>
                    )}

                    {/* Status Info */}
                    <Alert severity="info" variant="outlined">
                        <Typography variant="body2">
                            💡 <strong>Lưu ý:</strong>
                            <br />
                            • Dịch vụ sẽ được tạo với trạng thái <strong>Không hoạt động</strong> mặc định
                            <br />
                            • Bạn có thể kích hoạt dịch vụ sau khi tạo xong
                            <br />
                            {mode === 'create' && '• 1 Nhiệm vụ chỉ có thể tạo 1 Dịch vụ (quan hệ 1-1)'}
                        </Typography>
                    </Alert>
                </Stack>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                py: 2,
                gap: 1
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{ minWidth: 100 }}
                >
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo Dịch vụ')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceFormModal;
