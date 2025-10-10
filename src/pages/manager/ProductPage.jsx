import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Stack, TextField, IconButton, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, alpha, Toolbar, Grid, Avatar
} from '@mui/material';
import {
    Add, Edit, Delete, Restaurant, Search, LocalCafe, Pets, CheckCircle, Error as ErrorIcon, Visibility, Warning, Block
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AddProductModal from '../../components/modals/AddProductModal';
import ViewProductDetailsModal from '../../components/modals/ViewProductDetailsModal';
import productsApi from '../../api/productsApi';
import { formatPrice } from '../../utils/formatPrice';

const ProductPage = () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [deleteProductId, setDeleteProductId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load products
    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productsApi.getAllProducts({
                search: searchQuery,
                category: categoryFilter,
                status: statusFilter
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Error loading products:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi tải dữ liệu sản phẩm!',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Load statistics
    const loadStatistics = async () => {
        try {
            const response = await productsApi.getStatistics();
            setStatistics(response.data);
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    useEffect(() => {
        loadProducts();
        loadStatistics();
    }, [searchQuery, categoryFilter, statusFilter]);

    // Filtered and paginated products
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const currentPageProducts = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return products.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, products]);

    const handleOpenDialog = (product = null) => {
        setEditingProduct(product);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProduct(null);
    };

    const handleViewProduct = (product) => {
        setViewingProduct(product);
        setOpenViewDialog(true);
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setViewingProduct(null);
    };

    const handleSaveProduct = async (productData) => {
        try {
            if (editingProduct) {
                await productsApi.updateProduct(editingProduct.id, productData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật sản phẩm thành công!',
                    type: 'success'
                });
            } else {
                await productsApi.createProduct(productData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Thêm sản phẩm mới thành công!',
                    type: 'success'
                });
            }
            handleCloseDialog();
            loadProducts();
            loadStatistics();
        } catch (error) {
            console.error('Error saving product:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi lưu sản phẩm!',
                type: 'error'
            });
        }
    };

    const handleDeleteProduct = (productId) => {
        setDeleteProductId(productId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            await productsApi.deleteProduct(deleteProductId);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa sản phẩm thành công!',
                type: 'success'
            });
            loadProducts();
            loadStatistics();
        } catch (error) {
            console.error('Error deleting product:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi xóa sản phẩm!',
                type: 'error'
            });
        } finally {
            setOpenDeleteDialog(false);
            setDeleteProductId(null);
        }
    };

    const handleToggleProductStatus = async (product) => {
        const willDisable = !product.manuallyDisabled;
        const title = willDisable ? 'Tạm ngừng bán sản phẩm' : 'Mở lại bán sản phẩm';
        const message = willDisable
            ? `Sản phẩm "${product.name}" sẽ được đánh dấu là "Tạm ngừng bán". Khách hàng sẽ không thể đặt sản phẩm này.`
            : `Sản phẩm "${product.name}" sẽ được mở lại bán. Trạng thái sẽ phụ thuộc vào tình trạng nguyên liệu trong kho.`;

        if (window.confirm(`${title}\n\n${message}\n\nBạn có chắc chắn muốn tiếp tục?`)) {
            try {
                const response = await productsApi.toggleProductStatus(product.id, willDisable);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Đã cập nhật trạng thái sản phẩm!',
                    type: 'success'
                });
                loadProducts();
                loadStatistics();
            } catch (error) {
                console.error('Error toggling product status:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể cập nhật trạng thái',
                    type: 'error'
                });
            }
        }
    };

    const getCategoryLabel = (category) => {
        const labels = {
            drink_customer: 'Đồ uống (Khách)',
            food_customer: 'Đồ ăn (Khách)',
            food_pet: 'Đồ ăn (Pet)'
        };
        return labels[category] || category;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            drink_customer: <LocalCafe fontSize="small" />,
            food_customer: <Restaurant fontSize="small" />,
            food_pet: <Pets fontSize="small" />
        };
        return icons[category] || <Restaurant fontSize="small" />;
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
                sx={{ fontWeight: 600 }}
            />
        );
    };

    if (loading && !statistics) {
        return <Loading message="Đang tải thông tin sản phẩm..." fullScreen />;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: COLORS.BACKGROUND.NEUTRAL,
            width: '100%'
        }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.WARNING[600], mb: 3 }}>
                    Quản lý Sản phẩm Menu
                </Typography>

                {/* Status Badges */}
                {statistics && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.PRIMARY[500], 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Restaurant sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                            {statistics.total}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600 }}>
                                            Tổng sản phẩm
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.8)} 0%, ${alpha(COLORS.SUCCESS[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.SUCCESS[500], 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, ${COLORS.SUCCESS[400]} 0%, ${COLORS.SUCCESS[600]} 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                            {statistics.available}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600 }}>
                                            Có sẵn
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.ERROR[300], 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[500], 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <ErrorIcon sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                            {statistics.outOfStock}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.ERROR[600], fontWeight: 600 }}>
                                            Hết nguyên liệu
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.8)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.WARNING[300], 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.WARNING[500], 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, ${COLORS.WARNING[400]} 0%, ${COLORS.WARNING[600]} 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Warning sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                            {statistics.lowStock}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.WARNING[600], fontWeight: 600 }}>
                                            Sắp hết nguyên liệu
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.TEXT.DISABLED, 0.1)} 0%, ${alpha(COLORS.TEXT.SECONDARY, 0.1)} 100%)`,
                                border: `2px solid ${alpha(COLORS.TEXT.DISABLED, 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.TEXT.DISABLED, 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: alpha(COLORS.TEXT.SECONDARY, 0.6),
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Block sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY }}>
                                            {statistics.disabled}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Tạm ngừng
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.8)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(COLORS.INFO[500], 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <LocalCafe sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                            {statistics.customerDrink}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.INFO[600], fontWeight: 600 }}>
                                            Đồ uống (Khách)
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha('#FFF3E0', 0.8)} 0%, ${alpha('#FFE0B2', 0.6)} 100%)`,
                                border: `2px solid ${alpha('#FFB74D', 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha('#FF9800', 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, #FFB74D 0%, #F57C00 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Restaurant sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#E65100' }}>
                                            {statistics.customerFood}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600 }}>
                                            Đồ ăn (Khách)
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={4} md={3}>
                            <Paper sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha('#E8F5E9', 0.8)} 0%, ${alpha('#C8E6C9', 0.6)} 100%)`,
                                border: `2px solid ${alpha('#81C784', 0.3)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha('#66BB6A', 0.2)}` }
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{
                                        background: `linear-gradient(135deg, #81C784 0%, #388E3C 100%)`,
                                        borderRadius: 2, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Pets sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                                            {statistics.petFood}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#388E3C', fontWeight: 600 }}>
                                            Đồ ăn (Pet)
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                    </Grid>
                )}

                {/* Search and Filter Toolbar */}
                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                        }}
                        sx={{ minWidth: { xs: '100%', sm: 250 } }}
                    />
                    <TextField
                        select
                        size="small"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ minWidth: 150 }}
                    >
                        <option value="all">Tất cả danh mục</option>
                        <option value="drink_customer">Đồ uống (Khách)</option>
                        <option value="food_customer">Đồ ăn (Khách)</option>
                        <option value="food_pet">Đồ ăn (Pet)</option>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ minWidth: 180 }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="available">Có sẵn</option>
                        <option value="out_of_stock">Hết nguyên liệu</option>
                        <option value="low_stock">Sắp hết nguyên liệu</option>
                        <option value="disabled">Tạm ngừng bán</option>
                    </TextField>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            '&:hover': { bgcolor: COLORS.WARNING[600] }
                        }}
                    >
                        Thêm sản phẩm
                    </Button>
                </Toolbar>

                {/* Table */}
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`,
                        boxShadow: `0 10px 24px ${alpha(COLORS.WARNING[200], 0.15)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Tên sản phẩm</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Danh mục</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Giá bán</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageProducts.map((product) => (
                                <TableRow key={product.id} hover>
                                    <TableCell>
                                        <Avatar
                                            src={product.image}
                                            alt={product.name}
                                            variant="rounded"
                                            sx={{ width: 56, height: 56 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        <Chip
                                            icon={getCategoryIcon(product.category)}
                                            label={getCategoryLabel(product.category)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 300 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {product.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        {formatPrice(product.price)}
                                    </TableCell>
                                    <TableCell>{getStatusChip(product.status)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="info" onClick={() => handleViewProduct(product)}>
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color={product.manuallyDisabled ? 'success' : 'default'}
                                            onClick={() => handleToggleProductStatus(product)}
                                            title={product.manuallyDisabled ? 'Mở lại bán' : 'Tạm ngừng bán'}
                                        >
                                            <Block fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(product)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {products.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={products.length}
                    />
                )}

                {/* Empty State */}
                {products.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Restaurant sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                            Không tìm thấy sản phẩm nào
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thử thay đổi bộ lọc hoặc thêm sản phẩm mới
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Add/Edit Dialog */}
            <AddProductModal
                open={openDialog}
                onClose={handleCloseDialog}
                onSave={handleSaveProduct}
                editingProduct={editingProduct}
            />

            {/* View Details Dialog */}
            <ViewProductDetailsModal
                open={openViewDialog}
                onClose={handleCloseViewDialog}
                product={viewingProduct}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Xóa sản phẩm"
                message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi menu? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default ProductPage;

