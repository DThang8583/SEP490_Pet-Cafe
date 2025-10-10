/**
 * TakeMaterialsModal.jsx
 * 
 * Modal for working staff to take materials from warehouse
 * Records who takes what, when, and how much
 * Automatically deducts quantity from inventory
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    Stack,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    alpha
} from '@mui/material';
import {
    Close,
    LocalShipping,
    TrendingDown,
    CheckCircle,
    Warning,
    Error as ErrorIcon
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const TakeMaterialsModal = ({ open, onClose, materials, onTake }) => {
    const [formData, setFormData] = useState({
        materialId: '',
        quantityTaken: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setFormData({ materialId: '', quantityTaken: '' });
            setErrors({});
            setTouched({});
        }
    }, [open]);

    // Get selected material
    const selectedMaterial = materials.find(m => m.id === formData.materialId);

    // Validate field
    const validateField = (fieldName, value) => {
        const newErrors = { ...errors };

        switch (fieldName) {
            case 'materialId':
                if (!value) {
                    newErrors.materialId = 'Vui lòng chọn nguyên liệu';
                } else {
                    delete newErrors.materialId;
                }
                break;

            case 'quantityTaken':
                if (!value || value <= 0) {
                    newErrors.quantityTaken = 'Số lượng phải lớn hơn 0';
                } else if (selectedMaterial && value > selectedMaterial.quantity) {
                    newErrors.quantityTaken = `Không đủ số lượng. Chỉ còn ${selectedMaterial.quantity} ${selectedMaterial.unit}`;
                } else {
                    delete newErrors.quantityTaken;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle material change
    const handleMaterialChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, materialId: value, quantityTaken: '' }));
        setTouched(prev => ({ ...prev, materialId: true }));
        validateField('materialId', value);
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const value = parseFloat(e.target.value);
        setFormData(prev => ({ ...prev, quantityTaken: value }));
        setTouched(prev => ({ ...prev, quantityTaken: true }));
        validateField('quantityTaken', value);
    };

    // Handle blur
    const handleBlur = (fieldName) => () => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, formData[fieldName]);
    };

    // Handle submit
    const handleSubmit = () => {
        // Touch all fields
        setTouched({ materialId: true, quantityTaken: true });

        // Validate all fields
        const isMaterialValid = validateField('materialId', formData.materialId);
        const isQuantityValid = validateField('quantityTaken', formData.quantityTaken);

        if (isMaterialValid && isQuantityValid) {
            onTake({
                materialId: formData.materialId,
                quantityTaken: formData.quantityTaken
            });
        }
    };

    // Get status display
    const getStatusDisplay = (status) => {
        const statusMap = {
            out_of_stock: { label: 'Hết', color: 'error', icon: <ErrorIcon fontSize="small" /> },
            low_stock: { label: 'Sắp hết', color: 'warning', icon: <Warning fontSize="small" /> },
            in_stock: { label: 'Còn hàng', color: 'success', icon: <CheckCircle fontSize="small" /> }
        };
        return statusMap[status] || statusMap.in_stock;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
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
                    background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <LocalShipping sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Lấy nguyên liệu từ kho
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Chọn nguyên liệu và nhập số lượng cần lấy
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stack spacing={3}>
                    {/* Info Alert */}
                    <Alert severity="info">
                        <Typography variant="body2">
                            Chọn nguyên liệu cần lấy và nhập số lượng. Hệ thống sẽ tự động trừ số lượng trong kho.
                        </Typography>
                    </Alert>

                    {/* Material Select */}
                    <FormControl fullWidth required error={touched.materialId && Boolean(errors.materialId)}>
                        <InputLabel>Nguyên liệu</InputLabel>
                        <Select
                            value={formData.materialId}
                            onChange={handleMaterialChange}
                            onBlur={handleBlur('materialId')}
                            label="Nguyên liệu"
                        >
                            <MenuItem value="">Chọn nguyên liệu</MenuItem>
                            {materials.map(mat => {
                                const statusDisplay = getStatusDisplay(mat.status);
                                return (
                                    <MenuItem
                                        key={mat.id}
                                        value={mat.id}
                                        disabled={mat.quantity === 0}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                            <Typography sx={{ flex: 1 }}>{mat.name}</Typography>
                                            <Chip
                                                label={`${mat.quantity} ${mat.unit}`}
                                                size="small"
                                                color={statusDisplay.color}
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        </Stack>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                        {touched.materialId && errors.materialId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.materialId}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Selected Material Info */}
                    {selectedMaterial && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.ERROR[500], 0.05),
                                border: '1px dashed',
                                borderColor: COLORS.ERROR[500]
                            }}
                        >
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">
                                        Tên nguyên liệu:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {selectedMaterial.name}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">
                                        Tồn kho hiện tại:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                        {selectedMaterial.quantity} {selectedMaterial.unit}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">
                                        Trạng thái:
                                    </Typography>
                                    <Chip
                                        label={getStatusDisplay(selectedMaterial.status).label}
                                        color={getStatusDisplay(selectedMaterial.status).color}
                                        icon={getStatusDisplay(selectedMaterial.status).icon}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    )}

                    {/* Quantity Input */}
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Số lượng lấy ra"
                        value={formData.quantityTaken}
                        onChange={handleQuantityChange}
                        onBlur={handleBlur('quantityTaken')}
                        error={touched.quantityTaken && Boolean(errors.quantityTaken)}
                        helperText={
                            touched.quantityTaken && errors.quantityTaken
                                ? errors.quantityTaken
                                : selectedMaterial
                                    ? `Tối đa: ${selectedMaterial.quantity} ${selectedMaterial.unit}`
                                    : 'Nhập số lượng cần lấy'
                        }
                        disabled={!selectedMaterial}
                        inputProps={{
                            min: 0,
                            max: selectedMaterial?.quantity || 0,
                            step: 0.1
                        }}
                    />

                    {/* Preview */}
                    {selectedMaterial && formData.quantityTaken > 0 && !errors.quantityTaken && (
                        <Alert severity="warning" icon={<TrendingDown />}>
                            <Typography variant="body2">
                                Sau khi lấy, tồn kho còn lại:{' '}
                                <strong>
                                    {selectedMaterial.quantity - formData.quantityTaken} {selectedMaterial.unit}
                                </strong>
                            </Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.ERROR[500], 0.02) }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="error"
                    disabled={Object.keys(errors).length > 0 || !formData.materialId || !formData.quantityTaken}
                    sx={{ fontWeight: 700 }}
                >
                    Xác nhận lấy
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TakeMaterialsModal;

