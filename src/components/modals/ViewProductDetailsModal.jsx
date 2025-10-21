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
// Inventory removed: modal now only shows product fields

const ViewProductDetailsModal = ({ open, onClose, product }) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && product) {
            setLoading(false);
        }
    }, [open, product]);

    if (!product) return null;

    const getCategoryLabel = (category) => {
        // Handle if category is an object
        if (typeof category === 'object' && category?.name) {
            return category.name;
        }
        const labels = {
            drink_customer: 'Đồ uống (Khách hàng)',
            food_customer: 'Đồ ăn (Khách hàng)',
            food_pet: 'Đồ ăn (Pet)'
        };
        return labels[category] || String(category || 'Chưa phân loại');
    };

    const getCategoryIcon = (category) => {
        const categoryValue = typeof category === 'object' ? category?.id : category;
        const icons = {
            drink_customer: <LocalCafe />,
            food_customer: <Restaurant />,
            food_pet: <Pets />
        };
        return icons[categoryValue] || <Restaurant />;
    };

    const computeStatus = () => {
        if (product && product.is_active === false) return 'disabled';
        const remaining = typeof product?.remaining_quantity === 'number' ? product.remaining_quantity : undefined;
        if (remaining !== undefined) {
            if (remaining <= 0) return 'sold_out';
            if (remaining <= 5) return 'low_quantity';
        }
        return 'available';
    };

    const getStatusChip = () => {
        const status = computeStatus();
        const statusConfig = {
            available: {
                icon: <CheckCircle fontSize="small" />,
                label: 'Còn hàng',
                color: 'success'
            },
            sold_out: {
                icon: <ErrorIcon fontSize="small" />,
                label: 'Hết hàng trong ngày',
                color: 'error'
            },
            low_quantity: {
                icon: <Warning fontSize="small" />,
                label: 'Sắp hết',
                color: 'warning'
            },
            disabled: {
                icon: <Block fontSize="small" />,
                label: 'Tạm ngừng bán',
                color: 'default'
            }
        };

        const config = statusConfig[status] || statusConfig.available;

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
                            Thông tin chi tiết sản phẩm và số lượng
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
                                src={product.image_url || product.image}
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
                                    <Chip
                                        label={product.is_for_pets ? 'Pet' : 'Khách hàng'}
                                        size="small"
                                        color={product.is_for_pets ? 'success' : 'primary'}
                                        variant="outlined"
                                    />
                                    {getStatusChip()}
                                </Stack>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {product.description || 'Không có mô tả'}
                                </Typography>

                                <Stack direction="row" spacing={2}>
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
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                            border: '2px solid',
                                            borderColor: COLORS.PRIMARY[300],
                                            display: 'inline-block'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            Số lượng
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                            {typeof product.daily_quantity === 'number' ? product.daily_quantity : '—'}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(
                                                product.remaining_quantity === 0 ? COLORS.ERROR[500] :
                                                    product.remaining_quantity <= 5 ? COLORS.WARNING[500] :
                                                        COLORS.INFO[500], 0.1
                                            ),
                                            border: '2px solid',
                                            borderColor:
                                                product.remaining_quantity === 0 ? COLORS.ERROR[300] :
                                                    product.remaining_quantity <= 5 ? COLORS.WARNING[300] :
                                                        COLORS.INFO[300],
                                            display: 'inline-block'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            Còn lại
                                        </Typography>
                                        <Typography variant="h4" sx={{
                                            fontWeight: 800,
                                            color:
                                                product.remaining_quantity === 0 ? COLORS.ERROR[700] :
                                                    product.remaining_quantity <= 5 ? COLORS.WARNING[700] :
                                                        COLORS.INFO[700]
                                        }}>
                                            {typeof product.remaining_quantity === 'number' ? product.remaining_quantity : '—'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>

                    <Divider />

                    {/* Summary Alert */}
                    {computeStatus() === 'sold_out' && (
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
                                        Sản phẩm đã hết trong ngày
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Số lượng sản phẩm quy định bán trong ngày đã hết. Hãy quay lại vào ngày mai hoặc liên hệ manager để cập nhật số lượng.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {computeStatus() === 'low_quantity' && (
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.WARNING[500], 0.1),
                                border: '2px solid',
                                borderColor: COLORS.WARNING[300]
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Warning sx={{ color: COLORS.WARNING[600], fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                        Sản phẩm sắp hết
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Chỉ còn {product.remaining_quantity} sản phẩm. Hãy đặt hàng sớm để không bỏ lỡ!
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {computeStatus() === 'available' && (
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
                                        Sản phẩm còn hàng
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Còn {product.remaining_quantity} sản phẩm trong ngày hôm nay. Sản phẩm sẵn sàng để bán.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {computeStatus() === 'disabled' && (
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.GRAY[500], 0.1),
                                border: '2px solid',
                                borderColor: COLORS.GRAY[300]
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Block sx={{ color: COLORS.GRAY[600], fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.GRAY[700] }}>
                                        Sản phẩm tạm ngừng bán
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sản phẩm này hiện đang tạm ngừng bán. Vui lòng chọn sản phẩm khác hoặc liên hệ nhân viên.
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

