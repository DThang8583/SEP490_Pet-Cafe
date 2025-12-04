import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack, Chip, Paper, IconButton, alpha, Divider, Avatar, Grid } from '@mui/material';
import { Close, Restaurant, CheckCircle, Warning, Error as ErrorIcon, LocalCafe, Pets, Info, Block, AttachMoney, Inventory, TrendingUp, CalendarToday, Update } from '@mui/icons-material';
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
            food_pet: 'Đồ ăn (Thú cưng)'
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

    const status = computeStatus();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`
                }
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    bgcolor: COLORS.INFO[500],
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    position: 'relative'
                }}
            >
                <DialogTitle 
                    sx={{ 
                        fontWeight: 800, 
                        color: 'white', 
                        pb: 1.5,
                        pt: 2.5,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        pr: 1
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Info sx={{ fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Chi tiết sản phẩm
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                bgcolor: alpha('#fff', 0.1)
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3, bgcolor: alpha(COLORS.GRAY[50], 0.3) }}>
                <Stack spacing={3}>
                    {/* Product Header Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                            bgcolor: 'white',
                            boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                            {/* Product Image */}
                            <Avatar
                                src={getImageUrl(product.image_url || product.image)}
                                alt={product.name}
                                variant="rounded"
                                sx={{
                                    width: { xs: '100%', sm: 160 },
                                    height: { xs: 200, sm: 160 },
                                    maxWidth: { xs: '100%', sm: 160 },
                                    boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.DARK, 0.15)}`,
                                    borderRadius: 2
                                }}
                            >
                                <Restaurant sx={{ fontSize: 60 }} />
                            </Avatar>

                            {/* Product Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 800, 
                                        mb: 1.5,
                                        color: COLORS.PRIMARY[900],
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {product.name}
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                                    <Chip
                                        icon={getCategoryIcon(product.category)}
                                        label={getCategoryLabel(product.category)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                            fontWeight: 600,
                                            borderWidth: 1.5
                                        }}
                                    />
                                    <Chip
                                        label={product.is_for_pets ? 'Thú cưng' : 'Khách hàng'}
                                        size="small"
                                        color={product.is_for_pets ? 'success' : 'primary'}
                                        variant="outlined"
                                        sx={{ borderWidth: 1.5 }}
                                    />
                                    {getStatusChip()}
                                </Stack>

                                <Typography 
                                    variant="body1" 
                                    color="text.secondary" 
                                    sx={{ 
                                        lineHeight: 1.7,
                                        color: COLORS.TEXT.SECONDARY
                                    }}
                                >
                                    {product.description || 'Không có mô tả'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Key Metrics Grid */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(COLORS.SUCCESS[500], 0.08),
                                    border: `2px solid ${alpha(COLORS.SUCCESS[500], 0.2)}`,
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[500], 0.2)}`
                                    }
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <AttachMoney sx={{ color: COLORS.SUCCESS[600], fontSize: 20 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Giá bán
                                    </Typography>
                                </Stack>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                    {formatPrice(product.price)}
                                </Typography>
                            </Paper>
                        </Grid>

                        {typeof product.cost === 'number' && (
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        bgcolor: alpha(COLORS.INFO[500], 0.08),
                                        border: `2px solid ${alpha(COLORS.INFO[500], 0.2)}`,
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        <TrendingUp sx={{ color: COLORS.INFO[600], fontSize: 20 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.INFO[700], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Giá vốn
                                        </Typography>
                                    </Stack>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                        {formatPrice(product.cost)}
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(COLORS.PRIMARY[500], 0.08),
                                    border: `2px solid ${alpha(COLORS.PRIMARY[500], 0.2)}`,
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                    }
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <Inventory sx={{ color: COLORS.PRIMARY[600], fontSize: 20 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Số lượng bán trong ngày
                                    </Typography>
                                </Stack>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                    {typeof product.stock_quantity === 'number' ? product.stock_quantity : '—'}
                                </Typography>
                            </Paper>
                        </Grid>

                        {typeof product.min_stock_level === 'number' && (() => {
                            const stock = product.stock_quantity ?? 0;
                            const minStock = product.min_stock_level;
                            const isLow = stock <= minStock;
                            const isWarning = stock <= minStock * 1.5;
                            const bgColor = isLow ? COLORS.ERROR[500] : isWarning ? COLORS.WARNING[500] : COLORS.SUCCESS[500];
                            const borderColor = isLow ? COLORS.ERROR[500] : isWarning ? COLORS.WARNING[500] : COLORS.SUCCESS[500];
                            const textColor = isLow ? COLORS.ERROR[700] : isWarning ? COLORS.WARNING[700] : COLORS.SUCCESS[700];

                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            bgcolor: alpha(bgColor, 0.08),
                                            border: `2px solid ${alpha(borderColor, 0.2)}`,
                                            height: '100%',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 4px 12px ${alpha(borderColor, 0.2)}`
                                            }
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                            <Warning sx={{ color: textColor, fontSize: 20 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: textColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Mức tối thiểu
                                            </Typography>
                                        </Stack>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: textColor }}>
                                            {minStock}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            );
                        })()}
                    </Grid>

                    {/* Status Alert */}
                    {status === 'sold_out' && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.ERROR[500], 0.1),
                                border: `2px solid ${COLORS.ERROR[300]}`,
                                boxShadow: `0 2px 8px ${alpha(COLORS.ERROR[500], 0.1)}`
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <ErrorIcon sx={{ color: COLORS.ERROR[600], fontSize: 28, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.ERROR[700], mb: 0.5 }}>
                                        Sản phẩm đã hết số lượng bán trong ngày
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Số lượng bán trong ngày đã hết. Hãy nhập hàng để tiếp tục bán sản phẩm này.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {status === 'low_quantity' && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.WARNING[500], 0.1),
                                border: `2px solid ${COLORS.WARNING[300]}`,
                                boxShadow: `0 2px 8px ${alpha(COLORS.WARNING[500], 0.1)}`
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Warning sx={{ color: COLORS.WARNING[600], fontSize: 28, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.WARNING[700], mb: 0.5 }}>
                                        Sản phẩm sắp hết số lượng bán trong ngày
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Số lượng bán trong ngày ({product.stock_quantity}) đang ở mức thấp (mức tối thiểu: {product.min_stock_level}). Hãy nhập hàng sớm!
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {status === 'available' && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                border: `2px solid ${COLORS.SUCCESS[300]}`,
                                boxShadow: `0 2px 8px ${alpha(COLORS.SUCCESS[500], 0.1)}`
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <CheckCircle sx={{ color: COLORS.SUCCESS[600], fontSize: 28, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700], mb: 0.5 }}>
                                        Sản phẩm còn hàng
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Số lượng bán trong ngày: {product.stock_quantity} sản phẩm. Sản phẩm sẵn sàng để bán.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {status === 'disabled' && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.GRAY[500], 0.1),
                                border: `2px solid ${COLORS.GRAY[300]}`,
                                boxShadow: `0 2px 8px ${alpha(COLORS.GRAY[500], 0.1)}`
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Block sx={{ color: COLORS.GRAY[600], fontSize: 28, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.GRAY[700], mb: 0.5 }}>
                                        Sản phẩm tạm ngừng bán
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Sản phẩm này hiện đang tạm ngừng bán. Vui lòng chọn sản phẩm khác hoặc liên hệ nhân viên.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {/* Additional Info */}
                    {(product.thumbnails?.length > 0 || product.created_at || product.updated_at) && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                bgcolor: 'white',
                                boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                            }}
                        >
                            <Typography 
                                variant="subtitle1" 
                                fontWeight={700} 
                                color={COLORS.PRIMARY[700]} 
                                gutterBottom
                                sx={{ mb: 2 }}
                            >
                                Thông tin bổ sung
                            </Typography>
                            <Stack spacing={2.5}>
                                {product.thumbnails?.length > 0 && (
                                    <Box>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                fontWeight: 700, 
                                                color: COLORS.TEXT.SECONDARY,
                                                display: 'block', 
                                                mb: 1.5,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5
                                            }}
                                        >
                                            Ảnh phụ ({product.thumbnails.length})
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                            {product.thumbnails.map((thumb, idx) => (
                                                <Avatar
                                                    key={idx}
                                                    src={getImageUrl(thumb)}
                                                    variant="rounded"
                                                    sx={{ 
                                                        width: 70, 
                                                        height: 70,
                                                        boxShadow: `0 2px 6px ${alpha(COLORS.SHADOW.LIGHT, 0.2)}`,
                                                        border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                                                    }}
                                                >
                                                    <Restaurant />
                                                </Avatar>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
                                    {product.created_at && (
                                        <Box sx={{ flex: 1, minWidth: 150 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                                <CalendarToday sx={{ fontSize: 18, color: COLORS.INFO[600] }} />
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        color: COLORS.TEXT.SECONDARY,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5
                                                    }}
                                                >
                                                    Ngày tạo
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {new Date(product.created_at).toLocaleString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    )}
                                    {product.updated_at && (
                                        <Box sx={{ flex: 1, minWidth: 150 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                                <Update sx={{ fontSize: 18, color: COLORS.SUCCESS[600] }} />
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        color: COLORS.TEXT.SECONDARY,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5
                                                    }}
                                                >
                                                    Cập nhật lần cuối
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {new Date(product.updated_at).toLocaleString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, bgcolor: 'white' }}>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    sx={{
                        bgcolor: COLORS.INFO[500],
                        color: 'white',
                        fontWeight: 700,
                        px: 4,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: `0 2px 8px ${alpha(COLORS.INFO[500], 0.3)}`,
                        '&:hover': {
                            bgcolor: COLORS.INFO[600],
                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.4)}`
                        }
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewProductDetailsModal;
