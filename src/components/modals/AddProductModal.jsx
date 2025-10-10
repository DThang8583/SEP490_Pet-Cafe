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
import inventoryApi from '../../api/inventoryApi';

const CATEGORIES = [
    { value: 'drink_customer', label: 'Đồ uống (Khách)', icon: <LocalCafe /> },
    { value: 'food_customer', label: 'Đồ ăn (Khách)', icon: <Restaurant /> },
    { value: 'food_pet', label: 'Đồ ăn (Pet)', icon: <Pets /> }
];

const AddProductModal = ({ open, onClose, onSave, editingProduct = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        image: '',
        price: '',
        recipe: [] // [{ materialId, materialName, quantity, unit }]
    });

    const [inventory, setInventory] = useState([]);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Load inventory
    useEffect(() => {
        const loadInventory = async () => {
            try {
                const response = await inventoryApi.getAllItems();
                setInventory(response.data || []);
            } catch (error) {
                console.error('Error loading inventory:', error);
            }
        };
        if (open) {
            loadInventory();
        }
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name,
                category: editingProduct.category,
                description: editingProduct.description || '',
                image: editingProduct.image || '',
                price: editingProduct.price.toString(),
                recipe: editingProduct.recipe || []
            });
        } else {
            setFormData({
                name: '',
                category: '',
                description: '',
                image: '',
                price: '',
                recipe: []
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
            case 'category':
                if (!value) return 'Danh mục là bắt buộc';
                break;
            case 'price':
                if (!value) return 'Giá bán là bắt buộc';
                if (isNaN(value) || parseFloat(value) <= 0) return 'Giá bán phải lớn hơn 0';
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
        // Validate all fields
        const newErrors = {
            name: validateField('name', formData.name),
            category: validateField('category', formData.category),
            price: validateField('price', formData.price),
            recipe: validateField('recipe', formData.recipe)
        };

        // Validate each ingredient
        let hasIngredientError = false;
        formData.recipe.forEach((ingredient, index) => {
            if (!ingredient.materialId) {
                newErrors[`ingredient_${index}_material`] = 'Chọn nguyên liệu';
                hasIngredientError = true;
            }
            if (!ingredient.quantity || parseFloat(ingredient.quantity) <= 0) {
                newErrors[`ingredient_${index}_quantity`] = 'Số lượng phải > 0';
                hasIngredientError = true;
            }
        });

        setErrors(newErrors);
        setTouched({
            name: true,
            category: true,
            price: true,
            recipe: true
        });

        // Check if there are any errors
        const hasError = Object.values(newErrors).some(error => error !== '' && error !== undefined) || hasIngredientError;

        if (!hasError) {
            onSave({
                ...formData,
                price: parseFloat(formData.price),
                recipe: formData.recipe.map(ingredient => ({
                    materialId: ingredient.materialId,
                    materialName: ingredient.materialName,
                    quantity: parseFloat(ingredient.quantity)
                }))
            });
        }
    };

    const getCategoryIcon = (category) => {
        const cat = CATEGORIES.find(c => c.value === category);
        return cat?.icon || <Restaurant />;
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
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
                                error={touched.category && Boolean(errors.category)}
                            >
                                <InputLabel>Danh mục *</InputLabel>
                                <Select
                                    value={formData.category}
                                    label="Danh mục *"
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    onBlur={() => handleBlur('category')}
                                >
                                    {CATEGORIES.map(cat => (
                                        <MenuItem key={cat.value} value={cat.value}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {cat.icon}
                                                <Typography>{cat.label}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {touched.category && errors.category && (
                                    <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                                        {errors.category}
                                    </Typography>
                                )}
                            </FormControl>

                            {formData.category && (
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: alpha(COLORS.WARNING[500], 0.05),
                                        border: '1px dashed',
                                        borderColor: COLORS.WARNING[500]
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {getCategoryIcon(formData.category)}
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {CATEGORIES.find(c => c.value === formData.category)?.label}
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

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
                        </Stack>
                    </Box>

                    {/* Recipe */}
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Công thức chế biến *
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={handleAddIngredient}
                                variant="outlined"
                                sx={{ borderColor: COLORS.WARNING[500], color: COLORS.WARNING[700] }}
                            >
                                Thêm nguyên liệu
                            </Button>
                        </Stack>

                        {touched.recipe && errors.recipe && formData.recipe.length === 0 && (
                            <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                                {errors.recipe}
                            </Typography>
                        )}

                        {formData.recipe.length > 0 && (
                            <TableContainer
                                component={Paper}
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Nguyên liệu</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Số lượng</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Đơn vị</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.recipe.map((ingredient, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <FormControl
                                                        fullWidth
                                                        size="small"
                                                        error={Boolean(errors[`ingredient_${index}_material`])}
                                                    >
                                                        <Select
                                                            value={ingredient.materialId}
                                                            onChange={(e) => handleIngredientChange(index, 'materialId', e.target.value)}
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="">
                                                                <em>Chọn nguyên liệu</em>
                                                            </MenuItem>
                                                            {inventory.map(mat => (
                                                                <MenuItem key={mat.id} value={mat.id}>
                                                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                                                                        <Typography>{mat.name}</Typography>
                                                                        <Chip
                                                                            label={`${mat.quantity} ${mat.unit}`}
                                                                            size="small"
                                                                            color={mat.status === 'in_stock' ? 'success' : mat.status === 'low_stock' ? 'warning' : 'error'}
                                                                        />
                                                                    </Stack>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={ingredient.quantity}
                                                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                                        error={Boolean(errors[`ingredient_${index}_quantity`])}
                                                        sx={{ width: 100 }}
                                                        inputProps={{ min: 0, step: 0.01 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {ingredient.unit || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveIngredient(index)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {formData.recipe.length === 0 && (
                            <Box
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2
                                }}
                            >
                                <Warning sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Chưa có nguyên liệu nào trong công thức
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Nhấn "Thêm nguyên liệu" để bắt đầu
                                </Typography>
                            </Box>
                        )}
                    </Box>
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

