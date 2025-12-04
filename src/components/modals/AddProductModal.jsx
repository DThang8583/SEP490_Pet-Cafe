import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Stack, FormControl, InputLabel, Select, MenuItem, IconButton, alpha, InputAdornment, Paper, Avatar, Alert } from '@mui/material';
import { Close, Restaurant, CloudUpload, Delete } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import categoriesApi from '../../api/categoriesApi';

const AddProductModal = ({ open, onClose, onSave, editingProduct = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        description: '',
        price: '',
        cost: '',
        stock_quantity: '',
        min_stock_level: '',
        is_for_pets: false
    });

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState('');

    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await categoriesApi.getAllCategories({ IsActive: true });
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error loading categories:', error);
                setCategories([]);
            }
        };
        if (open) {
            loadCategories();
        }
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name || '',
                category_id: editingProduct.category_id || '',
                description: editingProduct.description || '',
                price: editingProduct.price?.toString() || '',
                cost: editingProduct.cost?.toString() || '',
                stock_quantity: editingProduct.stock_quantity?.toString() || '',
                min_stock_level: editingProduct.min_stock_level?.toString() || '',
                is_for_pets: !!editingProduct.is_for_pets
            });
            setImagePreview(editingProduct.image_url || null);
        } else {
            setFormData({
                name: '',
                category_id: '',
                description: '',
                price: '',
                cost: '',
                stock_quantity: '',
                min_stock_level: '',
                is_for_pets: false
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setErrors({});
        setTouched({});
        setImageError('');
    }, [editingProduct, open]);

    // Validation
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || !value.trim()) return 'Tên sản phẩm là bắt buộc';
                if (value.trim().length < 3) return 'Tên phải có ít nhất 3 ký tự';
                break;
            case 'category_id':
                if (!value) return 'Danh mục là bắt buộc';
                break;
            case 'price':
                if (!value) return 'Giá bán là bắt buộc';
                if (isNaN(value) || parseFloat(value) <= 0) return 'Giá bán phải lớn hơn 0';
                break;
            case 'cost':
                if (value && (isNaN(value) || parseFloat(value) < 0)) return 'Giá vốn phải là số không âm';
                break;
            case 'stock_quantity':
                if (!value) return 'Số lượng bán trong ngày là bắt buộc';
                if (isNaN(value) || parseInt(value) < 0) return 'Số lượng bán trong ngày phải là số nguyên không âm';
                break;
            case 'min_stock_level':
                if (!value) return 'Mức tối thiểu là bắt buộc';
                if (isNaN(value) || parseInt(value) < 0) return 'Mức tối thiểu phải là số nguyên không âm';
                break;
            default:
                break;
        }
        return '';
    };

    const formatCurrency = (value) => {
        if (!value || value === '') return '';
        const numValue = value.toString().replace(/[^\d]/g, '');
        if (!numValue) return '';
        const num = parseInt(numValue, 10);
        if (isNaN(num) || num === 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleChange = (field, value) => {
        let processedValue = value;
        if (field === 'price' || field === 'cost') {
            processedValue = value.replace(/[^\d]/g, '');
        }
        setFormData(prev => ({ ...prev, [field]: processedValue }));
        if (touched[field]) {
            const error = validateField(field, processedValue);
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
    };

    const handleSubmit = () => {
        // Validate essential fields
        const newErrors = {
            name: validateField('name', formData.name),
            category_id: validateField('category_id', formData.category_id),
            price: validateField('price', formData.price),
            cost: validateField('cost', formData.cost),
            stock_quantity: validateField('stock_quantity', formData.stock_quantity),
            min_stock_level: validateField('min_stock_level', formData.min_stock_level)
        };

        setErrors(newErrors);
        setTouched({
            name: true,
            category_id: true,
            price: true,
            cost: true,
            stock_quantity: true,
            min_stock_level: true
        });

        // Check if there are any errors
        const hasError = Object.values(newErrors).some(error => error !== '' && error !== undefined);

        if (!hasError) {
            const submitData = {
                name: formData.name.trim(),
                category_id: formData.category_id,
                description: formData.description.trim() || '',
                price: parseFloat(formData.price) || 0,
                cost: formData.cost ? parseFloat(formData.cost) : 0,
                stock_quantity: parseInt(formData.stock_quantity) || 0,
                min_stock_level: parseInt(formData.min_stock_level) || 0,
                is_for_pets: !!formData.is_for_pets,
                thumbnails: []
            };

            if (imageFile) {
                submitData.image_file = imageFile;
            }

            // For edit, include is_active
            if (editingProduct) {
                submitData.is_active = editingProduct.is_active !== undefined ? editingProduct.is_active : true;
            }

            onSave(submitData);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.WARNING[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.WARNING[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Restaurant />
                    {editingProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Basic Info */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: COLORS.WARNING[700]
                            }}
                        >
                            Thông tin cơ bản
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                size="medium"
                                label="Tên sản phẩm *"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                                placeholder="VD: Cà phê Latte"
                            />

                            <FormControl
                                fullWidth
                                size="medium"
                                error={touched.category_id && Boolean(errors.category_id)}
                            >
                                <InputLabel>Danh mục *</InputLabel>
                                <Select
                                    value={formData.category_id}
                                    onChange={(e) => handleChange('category_id', e.target.value)}
                                    onBlur={() => handleBlur('category_id')}
                                    label="Danh mục *"
                                >
                                    <MenuItem value="">
                                        <em>Chọn danh mục</em>
                                    </MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {touched.category_id && errors.category_id && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                        {errors.category_id}
                                    </Typography>
                                )}
                            </FormControl>

                            <TextField
                                fullWidth
                                size="medium"
                                label="Mô tả"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Mô tả chi tiết về sản phẩm..."
                            />
                        </Stack>
                    </Box>

                    {/* Pricing & Stock */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: COLORS.WARNING[700]
                            }}
                        >
                            Giá cả & Số lượng bán
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="medium"
                                    label="Giá bán *"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                    onBlur={() => handleBlur('price')}
                                    error={touched.price && Boolean(errors.price)}
                                    helperText={
                                        touched.price && errors.price
                                            ? errors.price
                                            : formData.price
                                                ? `Giá: ${formatCurrency(formData.price)}₫`
                                                : ''
                                    }
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>
                                    }}
                                    placeholder="50000"
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="medium"
                                    label="Giá vốn"
                                    type="number"
                                    value={formData.cost}
                                    onChange={(e) => handleChange('cost', e.target.value)}
                                    onBlur={() => handleBlur('cost')}
                                    error={touched.cost && Boolean(errors.cost)}
                                    helperText={
                                        touched.cost && errors.cost
                                            ? errors.cost
                                            : formData.cost
                                                ? `Giá: ${formatCurrency(formData.cost)}₫`
                                                : ''
                                    }
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>
                                    }}
                                    placeholder="30000"
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="medium"
                                    label="Số lượng bán trong ngày *"
                                    type="number"
                                    value={formData.stock_quantity}
                                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                                    onBlur={() => handleBlur('stock_quantity')}
                                    error={touched.stock_quantity && Boolean(errors.stock_quantity)}
                                    helperText={touched.stock_quantity && errors.stock_quantity}
                                    placeholder="100"
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="medium"
                                    label="Mức tối thiểu *"
                                    type="number"
                                    value={formData.min_stock_level}
                                    onChange={(e) => handleChange('min_stock_level', e.target.value)}
                                    onBlur={() => handleBlur('min_stock_level')}
                                    error={touched.min_stock_level && Boolean(errors.min_stock_level)}
                                    helperText={touched.min_stock_level && errors.min_stock_level}
                                    placeholder="20"
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Image Upload */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: COLORS.WARNING[700]
                            }}
                        >
                            Hình ảnh sản phẩm
                        </Typography>
                        {imageError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {imageError}
                            </Alert>
                        )}
                        {imagePreview ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '2px dashed',
                                    borderColor: COLORS.PRIMARY[300],
                                    position: 'relative',
                                    display: 'inline-block'
                                }}
                            >
                                <Avatar
                                    src={imagePreview}
                                    variant="rounded"
                                    sx={{ width: 200, height: 200 }}
                                />
                                <IconButton
                                    onClick={handleRemoveImage}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        bgcolor: 'white',
                                        '&:hover': { bgcolor: COLORS.ERROR[50] }
                                    }}
                                >
                                    <Delete color="error" />
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
                                        bgcolor: COLORS.WARNING[50]
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

                    {/* Target Audience */}
                    <Box>
                        <FormControl fullWidth size="medium">
                            <InputLabel>Đối tượng</InputLabel>
                            <Select
                                value={formData.is_for_pets ? 'true' : 'false'}
                                onChange={(e) => handleChange('is_for_pets', e.target.value === 'true')}
                                label="Đối tượng"
                            >
                                <MenuItem value="false">Khách hàng</MenuItem>
                                <MenuItem value="true">Thú cưng</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: COLORS.WARNING[500],
                        color: 'white',
                        fontWeight: 700,
                        '&:hover': {
                            bgcolor: COLORS.WARNING[600]
                        }
                    }}
                >
                    {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddProductModal;
