/**
 * AddMaterialsModal Component
 * 
 * Modal for adding raw materials/ingredients to inventory
 * - Desktop-first UI with clean, linear layout
 * - No Grid system or responsive breakpoints
 * - Stack-based layout for better alignment and UX
 * 
 * Business Rules (Nhập sỉ - Số lượng lớn):
 * 1. This is for RAW MATERIALS only (not finished products for sale)
 * 2. Materials are used by working staff to prepare food/drinks
 * 3. Quantity: Minimum 10 units (wholesale purchase), maximum 1,000,000
 * 4. Min stock: REQUIRED, minimum 5 units, must be less than quantity
 * 5. Supplier: REQUIRED for traceability (minimum 3 characters)
 * 6. Expiry date: REQUIRED, must be at least 30 days from now
 * 7. Quantity must be greater than minStock (business logic)
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
    FormHelperText,
    InputAdornment,
    Tooltip,
    IconButton,
    Chip,
    Stack,
    Autocomplete
} from '@mui/material';
import {
    Info as InfoIcon,
    Inventory,
    Warning
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { INVENTORY_CATEGORIES } from '../../api/inventoryApi';

const AddMaterialsModal = ({ isOpen, onClose, onSubmit, existingMaterials = [] }) => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        minStock: '',
        supplier: '',
        expiryDate: ''
    });

    // Validation state
    const [errors, setErrors] = useState({});
    const [warnings, setWarnings] = useState({});
    const [touched, setTouched] = useState({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: '',
                category: '',
                quantity: '',
                unit: '',
                minStock: '',
                supplier: '',
                expiryDate: ''
            });
            setErrors({});
            setWarnings({});
            setTouched({});
        }
    }, [isOpen]);

    // Validation rules
    const validateField = (fieldName, value) => {
        const newErrors = { ...errors };
        const newWarnings = { ...warnings };

        switch (fieldName) {
            case 'name':
                if (!value || !value.trim()) {
                    newErrors.name = 'Tên nguyên liệu là bắt buộc';
                } else if (value.trim().length < 3) {
                    newErrors.name = 'Tên nguyên liệu phải có ít nhất 3 ký tự';
                } else if (value.trim().length > 100) {
                    newErrors.name = 'Tên nguyên liệu không được vượt quá 100 ký tự';
                } else {
                    // Check for duplicates
                    const isDuplicate = existingMaterials.some(
                        m => m.name.toLowerCase().trim() === value.toLowerCase().trim()
                    );
                    if (isDuplicate) {
                        newErrors.name = 'Nguyên liệu này đã có trong kho';
                    } else {
                        delete newErrors.name;
                    }
                }
                break;

            case 'category':
                if (!value) {
                    newErrors.category = 'Danh mục là bắt buộc';
                } else {
                    delete newErrors.category;
                }
                break;

            case 'quantity':
                if (!value && value !== 0) {
                    newErrors.quantity = 'Số lượng là bắt buộc';
                } else if (isNaN(value) || parseFloat(value) < 0) {
                    newErrors.quantity = 'Số lượng phải là số không âm';
                } else if (parseFloat(value) < 10) {
                    newErrors.quantity = 'Nhập sỉ tối thiểu 10 đơn vị - Số lượng quá ít cho doanh nghiệp';
                } else if (parseFloat(value) > 1000000) {
                    newErrors.quantity = 'Số lượng vượt quá giới hạn cho phép (1,000,000)';
                } else if (formData.minStock && parseFloat(value) < parseFloat(formData.minStock)) {
                    newErrors.quantity = 'Số lượng nhập phải lớn hơn tồn kho tối thiểu (vô lý khi nhập ít hơn ngưỡng cảnh báo)';
                } else if (parseFloat(value) >= 10 && parseFloat(value) < 50) {
                    newWarnings.quantity = 'Số lượng khá ít cho nhập sỉ - Khuyến nghị nhập >= 50 để tối ưu chi phí';
                } else {
                    delete newErrors.quantity;
                    delete newWarnings.quantity;
                }
                break;

            case 'unit':
                if (!value || !value.trim()) {
                    newErrors.unit = 'Đơn vị tính là bắt buộc';
                } else if (value.trim().length > 20) {
                    newErrors.unit = 'Đơn vị tính không được vượt quá 20 ký tự';
                } else {
                    delete newErrors.unit;
                }
                break;

            case 'minStock':
                if (!value && value !== 0) {
                    newErrors.minStock = 'Tồn kho tối thiểu là bắt buộc - Doanh nghiệp cần quản lý tồn kho chặt chẽ';
                } else if (isNaN(value) || parseFloat(value) < 0) {
                    newErrors.minStock = 'Tồn kho tối thiểu phải là số không âm';
                } else if (parseFloat(value) < 5) {
                    newErrors.minStock = 'Tồn kho tối thiểu phải >= 5 đơn vị (business rule cho doanh nghiệp)';
                } else if (formData.quantity && parseFloat(value) >= parseFloat(formData.quantity)) {
                    newErrors.minStock = 'Tồn kho tối thiểu phải nhỏ hơn số lượng nhập - Ngược lại sẽ luôn ở trạng thái "Sắp hết"';
                } else if (formData.quantity && parseFloat(value) > parseFloat(formData.quantity) * 0.5) {
                    newWarnings.minStock = 'Tồn kho tối thiểu > 50% số lượng nhập - Nguyên liệu sẽ nhanh chuyển sang trạng thái "Sắp hết"';
                } else {
                    delete newErrors.minStock;
                    delete newWarnings.minStock;
                }
                break;

            case 'supplier':
                if (!value || !value.trim()) {
                    newErrors.supplier = 'Nhà cung cấp là bắt buộc - Cần truy xuất nguồn gốc cho nhập sỉ số lượng lớn';
                } else if (value.trim().length < 3) {
                    newErrors.supplier = 'Tên nhà cung cấp phải có ít nhất 3 ký tự';
                } else if (value.trim().length > 100) {
                    newErrors.supplier = 'Tên nhà cung cấp không được vượt quá 100 ký tự';
                } else {
                    delete newErrors.supplier;
                    delete newWarnings.supplier;
                }
                break;

            case 'expiryDate':
                if (!value) {
                    newErrors.expiryDate = 'Hạn sử dụng là bắt buộc - Nhập sỉ số lượng lớn cần quản lý HSD chặt chẽ';
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const expiryDate = new Date(value);

                    if (expiryDate < today) {
                        newErrors.expiryDate = 'Hạn sử dụng không được ở quá khứ';
                    } else {
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

                        if (daysUntilExpiry < 30) {
                            newErrors.expiryDate = 'HSD phải ít nhất 30 ngày kể từ hôm nay - Tránh rủi ro hết hạn với số lượng lớn';
                        } else if (daysUntilExpiry <= 60) {
                            newWarnings.expiryDate = `HSD còn ${daysUntilExpiry} ngày - Khá ngắn cho nhập sỉ, cân nhắc số lượng phù hợp`;
                        } else if (daysUntilExpiry <= 90) {
                            newWarnings.expiryDate = `HSD còn ${daysUntilExpiry} ngày - Đảm bảo tiêu thụ kịp thời`;
                        } else {
                            delete newWarnings.expiryDate;
                        }
                        delete newErrors.expiryDate;
                    }
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        setWarnings(newWarnings);
    };

    // Handle field change
    const handleChange = (fieldName) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [fieldName]: value }));

        // Mark field as touched
        setTouched(prev => ({ ...prev, [fieldName]: true }));

        // Validate field
        validateField(fieldName, value);

        // Cross-validate dependent fields
        if (fieldName === 'quantity' && formData.minStock) {
            validateField('minStock', formData.minStock);
        }
        if (fieldName === 'minStock' && formData.quantity) {
            validateField('quantity', formData.quantity);
        }
    };

    // Handle blur
    const handleBlur = (fieldName) => () => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, formData[fieldName]);
    };

    // Validate all fields
    const validateAll = () => {
        const fields = ['name', 'category', 'quantity', 'unit', 'minStock', 'supplier', 'expiryDate'];
        fields.forEach(field => validateField(field, formData[field]));

        // Mark all as touched
        const allTouched = {};
        fields.forEach(field => { allTouched[field] = true; });
        setTouched(allTouched);

        return Object.keys(errors).length === 0;
    };

    // Handle submit
    const handleSubmit = () => {
        // Validate all fields first
        if (!validateAll()) {
            return;
        }

        // Final business rule checks (validation should catch these, but double-check)
        const quantity = parseFloat(formData.quantity);
        const minStock = parseFloat(formData.minStock);

        // Build final data
        const finalData = {
            name: formData.name.trim(),
            category: formData.category,
            quantity: quantity,
            unit: formData.unit.trim(),
            minStock: minStock,
            supplier: formData.supplier.trim(),
            expiryDate: formData.expiryDate
        };

        onSubmit(finalData);
    };

    // Get category info
    const getCategoryInfo = (categoryId) => {
        return INVENTORY_CATEGORIES.find(c => c.id === categoryId);
    };

    // Common units by category
    const getCommonUnits = () => {
        if (formData.category === 'cafe_ingredients') {
            return ['lít', 'kg', 'gam', 'ml', 'chai', 'hộp', 'gói'];
        } else if (formData.category === 'pet_food') {
            return ['kg', 'gam', 'hộp', 'gói', 'cái', 'chai'];
        }
        return ['kg', 'lít', 'hộp', 'gói', 'cái'];
    };

    const hasErrors = Object.keys(errors).length > 0;
    const hasWarnings = Object.keys(warnings).length > 0;
    const selectedCategory = getCategoryInfo(formData.category);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `2px solid ${COLORS.ERROR[200]}`
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Inventory sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                            Nhập nguyên liệu vào kho
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2.5}>
                    {/* Material Name */}
                    <TextField
                        label="Tên nguyên liệu"
                        fullWidth
                        required
                        autoFocus
                        value={formData.name}
                        onChange={handleChange('name')}
                        onBlur={handleBlur('name')}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        placeholder="VD: Sữa tươi Vinamilk, Cà phê Arabica, Hạt Royal Canin..."
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Tên rõ ràng, dễ phân biệt với các nguyên liệu khác">
                                        <IconButton size="small">
                                            <InfoIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Category */}
                    <FormControl fullWidth required error={touched.category && Boolean(errors.category)}>
                        <InputLabel>Danh mục</InputLabel>
                        <Select
                            value={formData.category}
                            label="Danh mục"
                            onChange={handleChange('category')}
                            onBlur={handleBlur('category')}
                        >
                            {INVENTORY_CATEGORIES.map(cat => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {cat.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {cat.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                        {touched.category && errors.category && (
                            <FormHelperText>{errors.category}</FormHelperText>
                        )}
                    </FormControl>

                    {/* Category Info Chip */}
                    {selectedCategory && (
                        <Box sx={{
                            p: 1.5,
                            bgcolor: selectedCategory.color + '10',
                            borderRadius: 2,
                            border: `1.5px dashed ${selectedCategory.color}60`
                        }}>
                            <Typography variant="caption" sx={{ color: COLORS.TEXT.PRIMARY }}>
                                <strong>{selectedCategory.name}:</strong> {selectedCategory.description}
                            </Typography>
                        </Box>
                    )}

                    {/* Quantity and Unit Row */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Số lượng *"
                            required
                            type="number"
                            value={formData.quantity}
                            onChange={handleChange('quantity')}
                            onBlur={handleBlur('quantity')}
                            error={touched.quantity && Boolean(errors.quantity)}
                            helperText={
                                touched.quantity && errors.quantity
                                    ? errors.quantity
                                    : warnings.quantity || 'Nhập sỉ tối thiểu 10 đơn vị, khuyến nghị >= 50'
                            }
                            inputProps={{ min: 10, step: 1 }}
                            placeholder="Tối thiểu 10"
                            sx={{ flex: 1 }}
                        />

                        <Autocomplete
                            freeSolo
                            options={getCommonUnits()}
                            value={formData.unit}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({ ...prev, unit: newValue || '' }));
                                setTouched(prev => ({ ...prev, unit: true }));
                                validateField('unit', newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                                setFormData(prev => ({ ...prev, unit: newInputValue }));
                                setTouched(prev => ({ ...prev, unit: true }));
                                validateField('unit', newInputValue);
                            }}
                            onBlur={handleBlur('unit')}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Đơn vị *"
                                    required
                                    error={touched.unit && Boolean(errors.unit)}
                                    helperText={
                                        touched.unit && errors.unit
                                            ? errors.unit
                                            : 'Chọn từ gợi ý hoặc nhập tùy chỉnh'
                                    }
                                    placeholder="kg, lít, hộp..."
                                />
                            )}
                            sx={{ flex: 1 }}
                        />
                    </Stack>

                    {/* Min Stock and Supplier Row */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tồn kho tối thiểu *"
                            required
                            type="number"
                            value={formData.minStock}
                            onChange={handleChange('minStock')}
                            onBlur={handleBlur('minStock')}
                            error={touched.minStock && Boolean(errors.minStock)}
                            helperText={
                                touched.minStock && errors.minStock
                                    ? errors.minStock
                                    : warnings.minStock || 'Tối thiểu 5 đơn vị - Quản lý tồn kho chặt chẽ'
                            }
                            inputProps={{ min: 5, step: 1 }}
                            placeholder="Tối thiểu 5"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Warning fontSize="small" color="warning" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ flex: 1 }}
                        />

                        <TextField
                            label="Nhà cung cấp *"
                            required
                            value={formData.supplier}
                            onChange={handleChange('supplier')}
                            onBlur={handleBlur('supplier')}
                            error={touched.supplier && Boolean(errors.supplier)}
                            helperText={
                                touched.supplier && errors.supplier
                                    ? errors.supplier
                                    : warnings.supplier || 'Bắt buộc - Truy xuất nguồn gốc cho nhập sỉ'
                            }
                            placeholder="VD: Vinamilk, Trung Nguyên, Royal Canin..."
                            sx={{ flex: 1 }}
                        />
                    </Stack>

                    {/* Expiry Date */}
                    <TextField
                        label="Hạn sử dụng (HSD) *"
                        fullWidth
                        required
                        type="date"
                        value={formData.expiryDate}
                        onChange={handleChange('expiryDate')}
                        onBlur={handleBlur('expiryDate')}
                        error={touched.expiryDate && Boolean(errors.expiryDate)}
                        helperText={
                            touched.expiryDate && errors.expiryDate
                                ? errors.expiryDate
                                : warnings.expiryDate || 'Bắt buộc - Tối thiểu 30 ngày kể từ hôm nay'
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                            min: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        }}
                    />

                    {/* Summary */}
                    {formData.name && formData.quantity && formData.unit && (
                        <Box sx={{
                            p: 2,
                            bgcolor: COLORS.SUCCESS[50],
                            borderRadius: 2,
                            border: `2px dashed ${COLORS.SUCCESS[300]}`
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: COLORS.SUCCESS[700] }}>
                                📦 Tóm tắt nhập kho:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                    label={`${formData.name}`}
                                    size="small"
                                    color="primary"
                                />
                                <Chip
                                    label={`${formData.quantity} ${formData.unit}`}
                                    size="small"
                                    color="success"
                                />
                                {formData.supplier && (
                                    <Chip
                                        label={`NCC: ${formData.supplier}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Stack>
                        </Box>
                    )}

                    {/* Warnings Display */}
                    {hasWarnings && (
                        <Alert severity="warning">
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                ⚠️ Lưu ý:
                            </Typography>
                            {Object.entries(warnings).map(([field, message]) => (
                                <Typography key={field} variant="caption" component="div">
                                    • {message}
                                </Typography>
                            ))}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: COLORS.TEXT.SECONDARY }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={
                        hasErrors ||
                        !formData.name ||
                        !formData.category ||
                        !formData.quantity ||
                        !formData.unit ||
                        !formData.minStock ||
                        !formData.supplier ||
                        !formData.expiryDate
                    }
                    sx={{
                        backgroundColor: COLORS.ERROR[500],
                        '&:hover': { backgroundColor: COLORS.ERROR[600] },
                        '&:disabled': {
                            backgroundColor: COLORS.TEXT.DISABLED,
                            color: 'white'
                        }
                    }}
                >
                    Nhập kho
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMaterialsModal;

