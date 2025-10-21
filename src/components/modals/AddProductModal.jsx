/**
 * AddProductModal.jsx
 * 
 * Modal for adding/editing cafe menu products
 * Includes recipe management (selecting materials from inventory)
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box,
    Stack, FormControl, InputLabel, Select, MenuItem, IconButton, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, alpha, Chip, InputAdornment
} from '@mui/material';
import {
    Close, Add, Delete, LocalCafe, Restaurant, Pets, Warning
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import categoriesApi from '../../api/categoriesApi';
// Inventory removed

const AddProductModal = ({ open, onClose, onSave, editingProduct = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        description: '',
        image: '',
        price: '',
        daily_quantity: '',
        is_for_pets: false,
        thumbnails: []
    });

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

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
                name: editingProduct.name,
                category_id: editingProduct.category_id || '',
                description: editingProduct.description || '',
                image: editingProduct.image_url || editingProduct.image || '',
                price: editingProduct.price.toString(),
                daily_quantity: editingProduct.daily_quantity?.toString() || '',
                is_for_pets: !!editingProduct.is_for_pets,
                thumbnails: editingProduct.thumbnails || []
            });
        } else {
            setFormData({
                name: '',
                category_id: '',
                description: '',
                image: '',
                price: '',
                daily_quantity: '',
                is_for_pets: false,
                thumbnails: []
            });
        }
        setErrors({});
        setTouched({});
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
            case 'daily_quantity':
                if (!value) return 'Số lượng là bắt buộc';
                if (isNaN(value) || parseInt(value) < 0) return 'Số lượng phải là số nguyên không âm';
                break;
            case 'recipe':
                if (!value || value.length === 0) return 'Công thức chế biến là bắt buộc';
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

    // Recipe management
    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            recipe: [
                ...prev.recipe,
                { materialId: '', materialName: '', quantity: '', unit: '' }
            ]
        }));
    };

    const handleRemoveIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            recipe: prev.recipe.filter((_, i) => i !== index)
        }));
    };

    const handleIngredientChange = (index, field, value) => {
        const newRecipe = [...formData.recipe];

        if (field === 'materialId') {
            const material = inventory.find(m => m.id === value);
            if (material) {
                newRecipe[index] = {
                    materialId: material.id,
                    materialName: material.name,
                    quantity: newRecipe[index].quantity || '',
                    unit: material.unit
                };
            }
        } else {
            newRecipe[index][field] = value;
        }

        setFormData(prev => ({ ...prev, recipe: newRecipe }));
    };

    const handleSubmit = () => {
        // Validate essential fields only (official schema)
        const newErrors = {
            name: validateField('name', formData.name),
            category_id: validateField('category_id', formData.category_id),
            price: validateField('price', formData.price),
            daily_quantity: validateField('daily_quantity', formData.daily_quantity)
        };

        setErrors(newErrors);
        setTouched({
            name: true,
            category_id: true,
            price: true,
            daily_quantity: true
        });

        // Check if there are any errors
        const hasError = Object.values(newErrors).some(error => error !== '' && error !== undefined);

        if (!hasError) {
            onSave({
                name: formData.name.trim(),
                category_id: formData.category_id,
                description: formData.description,
                price: parseFloat(formData.price),
                daily_quantity: parseInt(formData.daily_quantity),
                image_url: formData.image,
                is_for_pets: !!formData.is_for_pets,
                thumbnails: formData.thumbnails || []
            });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.WARNING[500],
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Restaurant sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            {editingProduct ? 'Cập nhật thông tin sản phẩm' : 'Thêm sản phẩm vào menu quán'}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 3, pb: 2 }}>
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
                                size="small"
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
                                size="small"
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
                                size="small"
                                label="Mô tả"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Mô tả chi tiết về sản phẩm..."
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Hình ảnh (URL)"
                                value={formData.image}
                                onChange={(e) => handleChange('image', e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Giá bán *"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                    onBlur={() => handleBlur('price')}
                                    error={touched.price && Boolean(errors.price)}
                                    helperText={touched.price && errors.price}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>
                                    }}
                                    placeholder="50000"
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Số lượng *"
                                    type="number"
                                    value={formData.daily_quantity}
                                    onChange={(e) => handleChange('daily_quantity', e.target.value)}
                                    onBlur={() => handleBlur('daily_quantity')}
                                    error={touched.daily_quantity && Boolean(errors.daily_quantity)}
                                    helperText={touched.daily_quantity && errors.daily_quantity || ''}
                                    placeholder="30"
                                />
                            </Stack>
                            <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
                                <InputLabel shrink>Đối tượng</InputLabel>
                                <Select
                                    native
                                    value={formData.is_for_pets ? 'true' : 'false'}
                                    onChange={(e) => handleChange('is_for_pets', e.target.value === 'true')}
                                >
                                    <option value="false">Khách hàng</option>
                                    <option value="true">Pet</option>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    {/* Recipe removed for official product schema */}
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.WARNING[500], 0.02) }}>
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

