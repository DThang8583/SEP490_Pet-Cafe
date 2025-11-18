import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Stack, IconButton, alpha, Avatar, Paper, Alert } from '@mui/material';
import { Close, Category, CloudUpload, Delete } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AddCategoryModal = ({ open, onClose, onSave, editingCategory = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image_url: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name || '',
                description: editingCategory.description || '',
                image_url: editingCategory.image_url || ''
            });
            setImagePreview(editingCategory.image_url || null);
        } else {
            setFormData({
                name: '',
                description: '',
                image_url: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setErrors({});
        setTouched({});
        setImageError('');
    }, [editingCategory, open]);

    // Validation
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || !value.trim()) return 'Tên danh mục là bắt buộc';
                if (value.trim().length < 3) return 'Tên phải có ít nhất 3 ký tự';
                break;
            default:
                break;
        }
        return '';
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImageError('');

        if (!file.type.startsWith('image/')) {
            setImageError('Vui lòng chọn file hình ảnh');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setImageError('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.onerror = () => {
            setImageError('Không thể đọc file ảnh');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageError('');
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleSubmit = () => {
        // Validate essential fields
        const newErrors = {
            name: validateField('name', formData.name)
        };

        setErrors(newErrors);
        setTouched({
            name: true
        });

        // Check if there are any errors
        const hasError = Object.values(newErrors).some(error => error !== '' && error !== undefined);

        if (!hasError) {
            const submitData = {
                name: formData.name.trim(),
                description: formData.description.trim()
            };

            if (imageFile) {
                submitData.image_file = imageFile;
            } else if (editingCategory && formData.image_url) {
                submitData.image_url = formData.image_url;
            }

            onSave(submitData);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
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
                    <Category />
                    {editingCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        size="medium"
                        label="Tên danh mục *"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        placeholder="VD: Đồ uống (Khách)"
                    />

                    <TextField
                        fullWidth
                        size="medium"
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        multiline
                        rows={3}
                        placeholder="Mô tả chi tiết về danh mục..."
                    />

                    {/* Image Upload */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                            Hình ảnh danh mục (Tùy chọn)
                        </Typography>
                        {imageError && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                {imageError}
                            </Alert>
                        )}
                        {imagePreview ? (
                            <Paper
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    border: `2px solid ${COLORS.PRIMARY[200]}`,
                                    borderRadius: 2
                                }}
                            >
                                <Avatar
                                    src={imagePreview}
                                    variant="rounded"
                                    sx={{ width: 100, height: 100 }}
                                >
                                    <Category sx={{ fontSize: 40 }} />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {imageFile ? imageFile.name : 'Hình ảnh hiện tại'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {imageFile ? `${(imageFile.size / 1024).toFixed(2)} KB` : 'Đã tải lên'}
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={handleRemoveImage}
                                    color="error"
                                    size="small"
                                >
                                    <Delete />
                                </IconButton>
                            </Paper>
                        ) : (
                            <Button
                                component="label"
                                variant="outlined"
                                fullWidth
                                startIcon={<CloudUpload />}
                                sx={{
                                    height: 120,
                                    borderStyle: 'dashed',
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                        bgcolor: COLORS.PRIMARY[50]
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageChange}
                                />
                                <Stack alignItems="center" spacing={0.5}>
                                    <Typography variant="body2" fontWeight={500}>
                                        Click để tải ảnh lên
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        PNG, JPG, WEBP (Max 5MB)
                                    </Typography>
                                </Stack>
                            </Button>
                        )}
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        color: 'white',
                        fontWeight: 700,
                        '&:hover': {
                            bgcolor: COLORS.PRIMARY[600]
                        }
                    }}
                >
                    {editingCategory ? 'Cập nhật' : 'Thêm danh mục'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCategoryModal;