/**
 * RestockMaterialsModal.jsx
 * 
 * Modal for Manager to restock materials (bulk mode only)
 * 
 * Business Rules:
 * 1. Manager can restock ANY materials (not just low_stock/out_of_stock)
 * 2. Select one or multiple materials to restock
 * 3. All validations follow wholesale business rules (min 10 units, HSD >= 30 days)
 * 4. Auto-fill supplier with current value to save time
 * 5. Auto-recalculate status after restock
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Stack,
    Chip,
    InputAdornment,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Autocomplete,
    IconButton,
    Tooltip,
    alpha
} from '@mui/material';
import {
    Inventory,
    Warning,
    Error as ErrorIcon,
    Info as InfoIcon,
    LocalShipping,
    CalendarMonth,
    CheckCircle,
    SelectAll,
    Close,
    ShoppingCart
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const RestockMaterialsModal = ({
    open,
    onClose,
    materials,     // All materials
    onBulkRestock  // Bulk restock callback
}) => {
    const [selectedMaterials, setSelectedMaterials] = useState({});
    const [restockData, setRestockData] = useState({});
    const [errors, setErrors] = useState({});
    const [warnings, setWarnings] = useState({});

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setSelectedMaterials({});
            setRestockData({});
            setErrors({});
            setWarnings({});
        }
    }, [open]);

    // Toggle material selection
    const handleToggleMaterial = (materialId) => {
        const isCurrentlySelected = selectedMaterials[materialId];

        if (isCurrentlySelected) {
            // Deselect: remove from both states
            setSelectedMaterials(prev => {
                const newSelected = { ...prev };
                delete newSelected[materialId];
                return newSelected;
            });
            setRestockData(prev => {
                const newData = { ...prev };
                delete newData[materialId];
                return newData;
            });
        } else {
            // Select: add to selectedMaterials and auto-fill supplier
            const material = materials.find(m => m.id === materialId);

            setSelectedMaterials(prev => ({
                ...prev,
                [materialId]: true
            }));

            if (material) {
                setRestockData(prev => ({
                    ...prev,
                    [materialId]: {
                        quantity: '',
                        supplier: material.supplier || '',
                        expiryDate: ''
                    }
                }));
            }
        }
    };

    // Select/Deselect all
    const handleSelectAll = () => {
        if (Object.keys(selectedMaterials).length === materials.length) {
            setSelectedMaterials({});
            setRestockData({});
        } else {
            const allSelected = {};
            const allRestockData = {};
            materials.forEach(m => {
                allSelected[m.id] = true;
                // Auto-fill supplier with current value
                allRestockData[m.id] = {
                    quantity: '',
                    supplier: m.supplier || '',
                    expiryDate: ''
                };
            });
            setSelectedMaterials(allSelected);
            setRestockData(allRestockData);
        }
    };

    // Handle quantity change
    const handleQuantityChange = (materialId, value) => {
        setRestockData(prev => ({
            ...prev,
            [materialId]: { ...prev[materialId], quantity: value }
        }));
        validateField(materialId, 'quantity', value);
    };

    // Handle supplier change
    const handleSupplierChange = (materialId, value) => {
        setRestockData(prev => ({
            ...prev,
            [materialId]: { ...prev[materialId], supplier: value }
        }));
        validateField(materialId, 'supplier', value);
    };

    // Handle expiry date change
    const handleExpiryDateChange = (materialId, value) => {
        setRestockData(prev => ({
            ...prev,
            [materialId]: { ...prev[materialId], expiryDate: value }
        }));
        validateField(materialId, 'expiryDate', value);
    };

    // Validate field
    const validateField = (materialId, fieldName, value) => {
        const mat = materials.find(m => m.id === materialId);
        if (!mat) return;

        const newErrors = { ...errors };
        const newWarnings = { ...warnings };
        const errorKey = `${materialId}_${fieldName}`;

        switch (fieldName) {
            case 'quantity':
                if (!value || value === '') {
                    newErrors[errorKey] = 'Bắt buộc';
                } else if (isNaN(value) || parseFloat(value) <= 0) {
                    newErrors[errorKey] = 'Phải > 0';
                } else if (parseFloat(value) < 10) {
                    newErrors[errorKey] = 'Min 10';
                } else if (parseFloat(value) > 1000000) {
                    newErrors[errorKey] = 'Max 1M';
                } else {
                    const newTotal = parseFloat(mat.quantity) + parseFloat(value);
                    if (newTotal > 10000) {
                        newWarnings[errorKey] = 'Tổng > 10K';
                    } else if (parseFloat(value) < 50) {
                        newWarnings[errorKey] = 'Nên >= 50';
                    } else {
                        delete newWarnings[errorKey];
                    }
                    delete newErrors[errorKey];
                }
                break;

            case 'expiryDate':
                if (!value) {
                    newErrors[errorKey] = 'Bắt buộc';
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const expiryDate = new Date(value);
                    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

                    if (expiryDate < today) {
                        newErrors[errorKey] = 'Quá khứ';
                    } else if (daysUntilExpiry < 30) {
                        newErrors[errorKey] = 'Min 30 ngày';
                    } else if (daysUntilExpiry <= 60) {
                        newWarnings[errorKey] = `${daysUntilExpiry}d`;
                    } else {
                        delete newWarnings[errorKey];
                    }
                    delete newErrors[errorKey];
                }
                break;

            case 'supplier':
                if (value && value.trim().length > 0 && value.trim().length < 3) {
                    newErrors[errorKey] = 'Min 3 ký tự';
                } else {
                    delete newErrors[errorKey];
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        setWarnings(newWarnings);
    };

    // Calculate new total
    const calculateNewTotal = (materialId) => {
        const mat = materials.find(m => m.id === materialId);
        if (!mat) return 0;
        const restockQty = parseFloat(restockData[materialId]?.quantity || 0);
        return mat.quantity + restockQty;
    };

    // Check if can submit
    const canSubmit = useMemo(() => {
        const selectedIds = Object.keys(selectedMaterials);
        if (selectedIds.length === 0) return false;

        for (const materialId of selectedIds) {
            const data = restockData[materialId];
            if (!data?.quantity || !data?.expiryDate) return false;
        }

        const hasErrors = Object.keys(errors).some(key => errors[key]);
        return !hasErrors;
    }, [selectedMaterials, restockData, errors]);

    // Calculate summary
    const summary = useMemo(() => {
        const selectedIds = Object.keys(selectedMaterials);
        let totalQuantity = 0;
        selectedIds.forEach(materialId => {
            const qty = parseFloat(restockData[materialId]?.quantity || 0);
            totalQuantity += qty;
        });
        return { totalItems: selectedIds.length, totalQuantity };
    }, [selectedMaterials, restockData]);

    // Handle submit
    const handleSubmit = () => {
        const selectedIds = Object.keys(selectedMaterials);
        const bulkData = selectedIds.map(materialId => {
            const mat = materials.find(m => m.id === materialId);
            const data = restockData[materialId];
            return {
                materialId,
                restockQuantity: parseFloat(data.quantity),
                newTotal: calculateNewTotal(materialId),
                expiryDate: data.expiryDate,
                supplier: data.supplier || mat.supplier,
                restockedAt: new Date().toISOString()
            };
        });

        onBulkRestock(bulkData);
        onClose();
    };

    // Helper functions
    const getCommonSuppliers = () => [
        'Vinamilk', 'TH True Milk', 'Dutch Lady', 'Nestlé',
        'Trung Nguyên', 'Highlands Coffee', 'Phúc Long',
        'Pedigree', 'Royal Canin', 'Me-O', 'Whiskas', 'SmartHeart'
    ];

    const getMinExpiryDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    };

    const getStatusDisplay = (status) => {
        const statusMap = {
            out_of_stock: { label: 'Hết', color: 'error', icon: <ErrorIcon fontSize="small" /> },
            low_stock: { label: 'Sắp hết', color: 'warning', icon: <Warning fontSize="small" /> },
            in_stock: { label: 'Còn hàng', color: 'success', icon: <CheckCircle fontSize="small" /> }
        };
        return statusMap[status] || statusMap.in_stock;
    };

    if (!open || !materials || materials.length === 0) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    maxHeight: '90vh'
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
                    <ShoppingCart sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Nhập thêm hàng loạt
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Chọn và nhập thêm nhiều nguyên liệu cùng lúc
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
                    <Alert severity="info" icon={<InfoIcon />}>
                        <Typography variant="body2">
                            <strong>{materials.length} nguyên liệu</strong> có sẵn.
                            Chọn 1 hoặc nhiều nguyên liệu để nhập thêm.
                        </Typography>
                    </Alert>

                    {/* Materials Table */}
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Danh sách nguyên liệu
                            </Typography>
                            <Button size="small" startIcon={<SelectAll />} onClick={handleSelectAll}>
                                {Object.keys(selectedMaterials).length === materials.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </Button>
                        </Stack>

                        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" sx={{ fontWeight: 800 }}>Chọn</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Nguyên liệu</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Hiện tại</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>SL nhập *</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Tổng mới</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>NCC</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>HSD *</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {materials.map((mat) => {
                                        const isSelected = Boolean(selectedMaterials[mat.id]);
                                        const statusDisplay = getStatusDisplay(mat.status);
                                        const newTotal = calculateNewTotal(mat.id);
                                        const hasQuantityError = errors[`${mat.id}_quantity`];
                                        const hasQuantityWarning = warnings[`${mat.id}_quantity`];
                                        const hasExpiryError = errors[`${mat.id}_expiryDate`];
                                        const hasExpiryWarning = warnings[`${mat.id}_expiryDate`];

                                        return (
                                            <TableRow key={mat.id} hover sx={{ bgcolor: isSelected ? alpha('#667eea', 0.05) : 'transparent' }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={isSelected} onChange={() => handleToggleMaterial(mat.id)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{mat.name}</Typography>
                                                    <Chip label={statusDisplay.label} color={statusDisplay.color} size="small" icon={statusDisplay.icon} sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: mat.status === 'out_of_stock' ? 'error.main' : mat.status === 'low_stock' ? 'warning.main' : 'success.main' }}>
                                                        {mat.quantity} {mat.unit}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={hasQuantityError || hasQuantityWarning || ''} placement="top">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={!isSelected}
                                                            value={restockData[mat.id]?.quantity || ''}
                                                            onChange={(e) => handleQuantityChange(mat.id, e.target.value)}
                                                            error={Boolean(hasQuantityError)}
                                                            placeholder="10+"
                                                            inputProps={{ min: 10, step: 1 }}
                                                            sx={{ width: 100 }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: newTotal > 10000 ? 'warning.main' : 'success.main' }}>
                                                        {newTotal} {mat.unit}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        disabled={!isSelected}
                                                        value={restockData[mat.id]?.supplier || ''}
                                                        onChange={(e) => handleSupplierChange(mat.id, e.target.value)}
                                                        placeholder={mat.supplier || 'Nhập...'}
                                                        sx={{ width: 140 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={hasExpiryError || hasExpiryWarning || ''} placement="top">
                                                        <TextField
                                                            size="small"
                                                            type="date"
                                                            disabled={!isSelected}
                                                            value={restockData[mat.id]?.expiryDate || ''}
                                                            onChange={(e) => handleExpiryDateChange(mat.id, e.target.value)}
                                                            error={Boolean(hasExpiryError)}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: getMinExpiryDate() }}
                                                            sx={{ width: 160 }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Summary */}
                    {summary.totalItems > 0 && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                border: '2px solid',
                                borderColor: 'success.main'
                            }}
                        >
                            <Stack direction="row" spacing={3} alignItems="center">
                                <Inventory sx={{ fontSize: 32, color: 'success.main' }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TÓM TẮT</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.dark' }}>
                                        {summary.totalItems} nguyên liệu · Tổng {summary.totalQuantity} đơn vị
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
                <Button onClick={onClose} variant="outlined" size="large">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="large"
                    disabled={!canSubmit}
                    startIcon={<ShoppingCart />}
                    sx={{
                        bgcolor: COLORS.WARNING[500],
                        color: 'white',
                        fontWeight: 700,
                        px: 3,
                        '&:hover': {
                            bgcolor: COLORS.WARNING[600]
                        }
                    }}
                >
                    Nhập {summary.totalItems} nguyên liệu
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RestockMaterialsModal;
