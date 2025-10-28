import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, InputAdornment, Typography, Paper, Divider, FormHelperText, Avatar, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { TASK_TYPES } from '../../api/taskTemplateApi';
import { formatPrice } from '../../utils/formatPrice';

const ServiceFormModal = ({ open, onClose, onSubmit, taskData, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        task_id: '',
        task_type: '',
        images: [],
        name: '',
        description: '',
        estimate_duration: 30,
        price: 0
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
                    task_type: initialData.task_type || '',
                    images: initialData.images || [],
                    name: initialData.name || '',
                    description: initialData.description || '',
                    estimate_duration: initialData.estimate_duration || 30,
                    price: initialData.price || 0
                });
                setImagePreviews(initialData.images || []);
            } else if (mode === 'create' && taskData) {
                // Create mode: auto-fill from task
                setFormData({
                    task_id: taskData.id,
                    task_type: taskData.task_type,
                    images: [],
                    name: taskData.name || '',
                    description: taskData.description || '',
                    estimate_duration: taskData.estimate_duration || 30,
                    price: 0
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
            task_type: '',
            images: [],
            name: '',
            description: '',
            estimate_duration: 30,
            price: 0
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

        // Limit to 5 images
        if (imagePreviews.length + files.length > 5) {
            setErrors(prev => ({
                ...prev,
                images: 'Chỉ được tải tối đa 5 ảnh'
            }));
            event.target.value = ''; // Reset input
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
                event.target.value = ''; // Reset input
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    images: 'Kích thước file không được vượt quá 5MB'
                }));
                event.target.value = ''; // Reset input
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
            const newImages = [...formData.images, ...results];
            setImagePreviews(newPreviews);
            handleChange('images', newImages);

            // Clear error
            setErrors(prev => ({
                ...prev,
                images: ''
            }));

            event.target.value = ''; // Reset input after successful upload
        });
    };

    // Handle remove single image
    const handleRemoveImage = (index) => {
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        const newImages = formData.images.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
        handleChange('images', newImages);

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

        if (!formData.task_type) {
            newErrors.task_type = 'Task Type là bắt buộc';
        }

        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'Tên dịch vụ là bắt buộc';
        }

        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Mô tả dịch vụ là bắt buộc';
        }

        if (!formData.estimate_duration || formData.estimate_duration <= 0) {
            newErrors.estimate_duration = 'Thời gian ước tính phải lớn hơn 0';
        }

        if (formData.price === undefined || formData.price === null || formData.price < 0) {
            newErrors.price = 'Giá dịch vụ là bắt buộc và không được âm';
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
            await onSubmit(formData);
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

    const selectedTaskType = TASK_TYPES.find(t => t.key === formData.task_type || t.name === formData.task_type);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: 24
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid #e0e0e0',
                pb: 2,
                fontWeight: 600
            }}>
                {mode === 'edit' ? '✏️ Chỉnh sửa Service' : '✨ Tạo Service từ Task'}
            </DialogTitle>

            <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Task Info (for create mode) */}
                {mode === 'create' && taskData && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📋 Tạo từ Task
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {taskData.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            ⏱️ {taskData.estimate_duration} phút • {selectedTaskType?.name}
                        </Typography>
                    </Paper>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
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
                                Chọn nhiều ảnh từ thiết bị (mỗi ảnh tối đa 5MB, tổng tối đa 5 ảnh)
                            </Typography>
                        )}
                    </Box>

                    {/* Name (Editable) */}
                    <TextField
                        fullWidth
                        required
                        label="Tên dịch vụ"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={loading}
                        error={!!errors.name}
                        helperText={errors.name || 'Có thể chỉnh sửa tên dịch vụ'}
                        placeholder="Ví dụ: Tắm rửa thú cưng cơ bản"
                    />

                    {/* Description (Editable) */}
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

                    {/* Estimate Duration (Editable) */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Thời gian ước tính (phút)"
                        value={formData.estimate_duration || ''}
                        onChange={(e) => handleChange('estimate_duration', e.target.value === '' ? '' : parseInt(e.target.value))}
                        disabled={loading}
                        error={!!errors.estimate_duration}
                        helperText={errors.estimate_duration || 'Có thể chỉnh sửa thời gian ước tính'}
                        placeholder="Nhập thời gian (phút)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                            inputProps: { min: 1, step: 5 }
                        }}
                    />

                    {/* Duration Preview */}
                    {formData.estimate_duration > 0 && (
                        <Box sx={{
                            p: 1.5,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                ⏱️ Thời gian: <strong>{formData.estimate_duration} phút</strong>
                                {formData.estimate_duration >= 60 && (
                                    <span> ({Math.floor(formData.estimate_duration / 60)}h {formData.estimate_duration % 60}m)</span>
                                )}
                            </Typography>
                        </Box>
                    )}

                    <Divider />

                    {/* Price (Required - NEW FIELD) */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Giá dịch vụ"
                        value={formData.price || ''}
                        onChange={(e) => handleChange('price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        disabled={loading}
                        error={!!errors.price}
                        helperText={errors.price || 'Giá dịch vụ cho khách hàng'}
                        placeholder="Nhập giá (VNĐ)"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                            inputProps: { min: 0, step: 1000 }
                        }}
                    />

                    {/* Price Preview */}
                    {formData.price > 0 && (
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
                                {formatPrice(formData.price)}
                            </Typography>
                        </Paper>
                    )}

                    {/* Status Info */}
                    <Alert severity="warning" variant="outlined">
                        <Typography variant="body2">
                            ⚠️ <strong>Status mặc định: Disabled</strong>
                            <br />
                            Dịch vụ sẽ được tạo với trạng thái vô hiệu hóa. Bạn có thể kích hoạt sau khi tạo xong.
                        </Typography>
                    </Alert>

                    {/* 1:1 Relationship Info */}
                    {mode === 'create' && (
                        <Alert severity="info" variant="outlined">
                            <Typography variant="body2">
                                💡 <strong>Lưu ý:</strong> 1 Task chỉ có thể tạo 1 Service.
                                Sau khi tạo, bạn không thể thay đổi Task gốc.
                            </Typography>
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: '1px solid #e0e0e0',
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
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo Service')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceFormModal;

