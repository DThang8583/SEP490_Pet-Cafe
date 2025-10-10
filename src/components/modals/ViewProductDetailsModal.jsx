/**
 * ViewProductDetailsModal.jsx
 * 
 * Modal for viewing product details including recipe and material status
 * Shows which materials are in stock/out of stock
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box,
    Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, alpha, Divider, Avatar
} from '@mui/material';
import {
    Close, Restaurant, CheckCircle, Warning, Error as ErrorIcon, LocalCafe, Pets, Info, Block
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';
import inventoryApi from '../../api/inventoryApi';

const ViewProductDetailsModal = ({ open, onClose, product }) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load inventory to check material status
    useEffect(() => {
        const loadInventory = async () => {
            if (open && product) {
                setLoading(true);
                try {
                    const response = await inventoryApi.getAllItems();
                    setInventory(response.data || []);
                } catch (error) {
                    console.error('Error loading inventory:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadInventory();
    }, [open, product]);

    if (!product) return null;

    const getCategoryLabel = (category) => {
        const labels = {
            drink_customer: 'Đồ uống (Khách hàng)',
            food_customer: 'Đồ ăn (Khách hàng)',
            food_pet: 'Đồ ăn (Pet)'
        };
        return labels[category] || category;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            drink_customer: <LocalCafe />,
            food_customer: <Restaurant />,
            food_pet: <Pets />
        };
        return icons[category] || <Restaurant />;
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            available: {
                icon: <CheckCircle fontSize="small" />,
                label: 'Có sẵn',
                color: 'success'
            },
            out_of_stock: {
                icon: <ErrorIcon fontSize="small" />,
                label: 'Hết nguyên liệu',
                color: 'error'
            },
            low_stock: {
                icon: <Warning fontSize="small" />,
                label: 'Sắp hết nguyên liệu',
                color: 'warning'
            },
            disabled: {
                icon: <Block fontSize="small" />,
                label: 'Tạm ngừng bán',
                color: 'default'
            }
        };

        const config = statusConfig[status] || statusConfig.out_of_stock;

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                size="small"
                color={config.color}
                sx={{ fontWeight: 700 }}
            />
        );
    };

    const getMaterialStatus = (materialId, requiredQuantity) => {
        const material = inventory.find(m => m.id === materialId);

        if (!material) {
            return {
                status: 'not_found',
                label: 'Không tìm thấy',
                color: 'error',
                icon: <ErrorIcon fontSize="small" />,
                available: 0,
                isEnough: false
            };
        }

        const isEnough = material.quantity >= requiredQuantity;

        if (material.status === 'out_of_stock' || !isEnough) {
            return {
                status: 'out_of_stock',
                label: 'Hết hàng',
                color: 'error',
                icon: <ErrorIcon fontSize="small" />,
                available: material.quantity,
                isEnough: false
            };
        }

        if (material.status === 'low_stock') {
            return {
                status: 'low_stock',
                label: 'Sắp hết',
                color: 'warning',
                icon: <Warning fontSize="small" />,
                available: material.quantity,
                isEnough: true
            };
        }

        return {
            status: 'in_stock',
            label: 'Còn hàng',
            color: 'success',
            icon: <CheckCircle fontSize="small" />,
            available: material.quantity,
            isEnough: true
        };
    };

    const getMaterialUnit = (materialId) => {
        const material = inventory.find(m => m.id === materialId);
        return material?.unit || '';
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
                    bgcolor: COLORS.INFO[500],
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Info sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Chi tiết sản phẩm
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Thông tin chi tiết và công thức chế biến
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
                    {/* Product Info */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: 'divider',
                            background: alpha(COLORS.INFO[50], 0.3)
                        }}
                    >
                        <Stack direction="row" spacing={3}>
                            {/* Product Image */}
                            <Avatar
                                src={product.image}
                                alt={product.name}
                                variant="rounded"
                                sx={{
                                    width: 120,
                                    height: 120,
                                    boxShadow: 3
                                }}
                            />

                            {/* Product Details */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                    {product.name}
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                    <Chip
                                        icon={getCategoryIcon(product.category)}
                                        label={getCategoryLabel(product.category)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    {getStatusChip(product.status)}
                                </Stack>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {product.description || 'Không có mô tả'}
                                </Typography>

                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                        border: '2px solid',
                                        borderColor: COLORS.SUCCESS[300],
                                        display: 'inline-block'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Giá bán
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                        {formatPrice(product.price)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>

                    <Divider />

                    {/* Recipe Section */}
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Công thức chế biến
                            </Typography>
                            <Chip
                                label={`${product.recipe?.length || 0} nguyên liệu`}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 700 }}
                            />
                        </Stack>

                        {product.recipe && product.recipe.length > 0 ? (
                            <TableContainer
                                component={Paper}
                                sx={{
                                    borderRadius: 2,
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    boxShadow: 2
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(COLORS.INFO[500], 0.1) }}>
                                            <TableCell sx={{ fontWeight: 800 }}>Nguyên liệu</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Hiện có</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="center">Trạng thái</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Đang tải thông tin nguyên liệu...
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            product.recipe.map((ingredient, index) => {
                                                const materialStatus = getMaterialStatus(
                                                    ingredient.materialId,
                                                    ingredient.quantity
                                                );
                                                const unit = getMaterialUnit(ingredient.materialId);

                                                return (
                                                    <TableRow
                                                        key={index}
                                                        hover
                                                        sx={{
                                                            bgcolor: !materialStatus.isEnough
                                                                ? alpha(COLORS.ERROR[500], 0.05)
                                                                : 'transparent'
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {ingredient.materialName || 'Unknown'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={`${materialStatus.available} ${unit}`}
                                                                size="small"
                                                                color={materialStatus.isEnough ? 'success' : 'error'}
                                                                variant={materialStatus.isEnough ? 'outlined' : 'filled'}
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                icon={materialStatus.icon}
                                                                label={materialStatus.label}
                                                                size="small"
                                                                color={materialStatus.color}
                                                                sx={{ fontWeight: 600 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Paper
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2
                                }}
                            >
                                <Warning sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Chưa có công thức chế biến
                                </Typography>
                            </Paper>
                        )}
                    </Box>

                    {/* Summary Alert */}
                    {product.status === 'unavailable' && (
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.ERROR[500], 0.1),
                                border: '2px solid',
                                borderColor: COLORS.ERROR[300]
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <ErrorIcon sx={{ color: COLORS.ERROR[600], fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[700] }}>
                                        Sản phẩm không thể làm được
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Một hoặc nhiều nguyên liệu đã hết. Vui lòng nhập thêm hàng để có thể làm sản phẩm này.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {product.status === 'available' && (
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                border: '2px solid',
                                borderColor: COLORS.SUCCESS[300]
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CheckCircle sx={{ color: COLORS.SUCCESS[600], fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                        Sản phẩm có sẵn
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tất cả nguyên liệu đều có đủ. Sản phẩm sẵn sàng để chế biến và bán.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.INFO[500], 0.02) }}>
                <Button onClick={onClose} variant="contained" color="info">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewProductDetailsModal;

