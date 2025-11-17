import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack, Chip, Paper, IconButton, alpha, Divider, Avatar } from '@mui/material';
import { Close, Restaurant, CheckCircle, Warning, Error as ErrorIcon, LocalCafe, Pets, Info, Block } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { formatPrice } from '../../utils/formatPrice';
import { API_BASE_URL } from '../../config/config';

const ViewProductDetailsModal = ({ open, onClose, product }) => {
    if (!product) return null;

    // Helper function to get image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        const baseUrl = API_BASE_URL.replace('/api', '');
        return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
    };

    const getCategoryLabel = (category) => {
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
        if (product?.is_active === false) return 'disabled';
        const stock = typeof product?.stock_quantity === 'number' ? product.stock_quantity : undefined;
        const minStock = typeof product?.min_stock_level === 'number' ? product.min_stock_level : 0;
        if (stock !== undefined) {
            if (stock <= 0) return 'sold_out';
            if (stock <= minStock) return 'low_quantity';
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
                    <Info />
                    📦 Chi tiết sản phẩm: {product.name}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
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
                                src={getImageUrl(product.image_url || product.image)}
                                alt={product.name}
                                variant="rounded"
                                sx={{
                                    width: 120,
                                    height: 120,
                                    boxShadow: 3
                                }}
                            >
                                <Restaurant />
                            </Avatar>

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

                                <Stack direction="row" spacing={2} flexWrap="wrap">
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
                                    {typeof product.cost === 'number' && (
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: alpha(COLORS.INFO[500], 0.1),
                                                border: '2px solid',
                                                borderColor: COLORS.INFO[300],
                                                display: 'inline-block'
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                Giá vốn
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                                {formatPrice(product.cost)}
                                            </Typography>
                                        </Box>
                                    )}
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
                                            Tồn kho
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                            {typeof product.stock_quantity === 'number' ? product.stock_quantity : '—'}
                                        </Typography>
                                    </Box>
                                    {typeof product.min_stock_level === 'number' && (() => {
                                        const stock = product.stock_quantity ?? 0;
                                        const minStock = product.min_stock_level;
                                        const isLow = stock <= minStock;
                                        const isWarning = stock <= minStock * 1.5;
                                        const bgColor = isLow ? COLORS.ERROR[500] : isWarning ? COLORS.WARNING[500] : COLORS.SUCCESS[500];
                                        const borderColor = isLow ? COLORS.ERROR[300] : isWarning ? COLORS.WARNING[300] : COLORS.SUCCESS[300];
                                        const textColor = isLow ? COLORS.ERROR[700] : isWarning ? COLORS.WARNING[700] : COLORS.SUCCESS[700];

                                        return (
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(bgColor, 0.1),
                                                    border: '2px solid',
                                                    borderColor,
                                                    display: 'inline-block'
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                    Mức tối thiểu
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: textColor }}>
                                                    {minStock}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}
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
                                        Sản phẩm đã hết tồn kho
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Số lượng tồn kho đã hết. Hãy nhập hàng để tiếp tục bán sản phẩm này.
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
                                        Sản phẩm sắp hết tồn kho
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tồn kho ({product.stock_quantity}) đang ở mức thấp (mức tối thiểu: {product.min_stock_level}). Hãy nhập hàng sớm!
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
                                        Tồn kho: {product.stock_quantity} sản phẩm. Sản phẩm sẵn sàng để bán.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {/* Additional Info */}
                    {(product.thumbnails?.length > 0 || product.created_at || product.updated_at) && (
                        <>
                            <Divider />
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: alpha(COLORS.GRAY[50], 0.5)
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    📸 Thông tin bổ sung
                                </Typography>
                                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                    {product.thumbnails?.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                                Ảnh phụ ({product.thumbnails.length})
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {product.thumbnails.map((thumb, idx) => (
                                                    <Avatar
                                                        key={idx}
                                                        src={getImageUrl(thumb)}
                                                        variant="rounded"
                                                        sx={{ width: 60, height: 60 }}
                                                    >
                                                        <Restaurant />
                                                    </Avatar>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    <Stack direction="row" spacing={3} flexWrap="wrap">
                                        {product.created_at && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                                    Ngày tạo
                                                </Typography>
                                                <Typography variant="body2">
                                                    {new Date(product.created_at).toLocaleString('vi-VN')}
                                                </Typography>
                                            </Box>
                                        )}
                                        {product.updated_at && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                                    Cập nhật lần cuối
                                                </Typography>
                                                <Typography variant="body2">
                                                    {new Date(product.updated_at).toLocaleString('vi-VN')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                        </>
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

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={onClose} variant="contained" color="info">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewProductDetailsModal;

