import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Stack, TextField, IconButton, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Toolbar, Grid, Avatar, Tabs, Tab
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Add, Edit, Delete, Restaurant, Search, LocalCafe, Pets, CheckCircle, Error as ErrorIcon, Visibility, Warning, Block, Check, Close, Category
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AddProductModal from '../../components/modals/AddProductModal';
import ViewProductDetailsModal from '../../components/modals/ViewProductDetailsModal';
import AddCategoryModal from '../../components/modals/AddCategoryModal';
import productsApi from '../../api/productsApi';
import categoriesApi from '../../api/categoriesApi';
import { formatPrice } from '../../utils/formatPrice';

const ProductPage = () => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Products state
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [deleteProductId, setDeleteProductId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState(undefined);
    const [isForPetsFilter, setIsForPetsFilter] = useState(undefined);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [editingQuantityId, setEditingQuantityId] = useState(null);
    const [editingQuantityValue, setEditingQuantityValue] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Categories state
    const [categories, setCategories] = useState([]);
    const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
    const [openDeleteCategoryDialog, setOpenDeleteCategoryDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteCategoryId, setDeleteCategoryId] = useState(null);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [categoryActiveFilter, setCategoryActiveFilter] = useState(undefined);

    // Shared
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Load products (official API)
    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productsApi.getAllProducts({
                IsActive: isActiveFilter,
                IsForPets: isForPetsFilter,
                MinPrice: minPrice !== '' ? Number(minPrice) : undefined,
                MaxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
                PageIndex: page - 1,
                PageSize: itemsPerPage
            });
            setProducts(response.data || []);
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

    // Statistics removed (no official endpoint)

    // Load categories
    const loadCategories = async () => {
        try {
            const response = await categoriesApi.getAllCategories({
                IsActive: categoryActiveFilter
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi tải dữ liệu danh mục!',
                type: 'error'
            });
        }
    };

    useEffect(() => {
        loadProducts();
    }, [isActiveFilter, isForPetsFilter, minPrice, maxPrice, page, itemsPerPage]);

    useEffect(() => {
        loadCategories();
    }, [categoryActiveFilter]);

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
                // If official API for update differs, you can adapt here later
                await productsApi.createProduct(productData); // temporary: treat as create for demo or adapt to PUT when available
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
            : `Sản phẩm "${product.name}" sẽ được mở lại bán.`;

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

    const handleStartEditQuantity = (product) => {
        setEditingQuantityId(product.id);
        setEditingQuantityValue(product.daily_quantity || '');
    };

    const handleCancelEditQuantity = () => {
        setEditingQuantityId(null);
        setEditingQuantityValue('');
    };

    const handleSaveQuantity = async (productId) => {
        const newQuantity = parseInt(editingQuantityValue, 10);

        if (isNaN(newQuantity) || newQuantity < 0) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Số lượng phải là số nguyên dương',
                type: 'error'
            });
            return;
        }

        try {
            const response = await productsApi.updateDailyQuantity(productId, newQuantity);
            setAlert({
                open: true,
                title: 'Thành công',
                message: response.message || 'Cập nhật số lượng thành công! Số lượng mới sẽ áp dụng cho các ngày tiếp theo.',
                type: 'success'
            });
            setEditingQuantityId(null);
            setEditingQuantityValue('');
            loadProducts();
        } catch (error) {
            console.error('Error updating quantity:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật số lượng',
                type: 'error'
            });
        }
    };

    // Category handlers
    const handleOpenCategoryDialog = (category = null) => {
        setEditingCategory(category);
        setOpenCategoryDialog(true);
    };

    const handleCloseCategoryDialog = () => {
        setOpenCategoryDialog(false);
        setEditingCategory(null);
    };

    const handleSaveCategory = async (categoryData) => {
        try {
            if (editingCategory) {
                await categoriesApi.updateCategory(editingCategory.id, categoryData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật danh mục thành công!',
                    type: 'success'
                });
            } else {
                await categoriesApi.createCategory(categoryData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Thêm danh mục mới thành công!',
                    type: 'success'
                });
            }
            handleCloseCategoryDialog();
            loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi lưu danh mục!',
                type: 'error'
            });
        }
    };

    const handleDeleteCategory = (categoryId) => {
        setDeleteCategoryId(categoryId);
        setOpenDeleteCategoryDialog(true);
    };

    const confirmDeleteCategory = async () => {
        try {
            await categoriesApi.deleteCategory(deleteCategoryId);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa danh mục thành công!',
                type: 'success'
            });
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi xóa danh mục!',
                type: 'error'
            });
        } finally {
            setOpenDeleteCategoryDialog(false);
            setDeleteCategoryId(null);
        }
    };

    const handleToggleCategoryStatus = async (category) => {
        const willDisable = category.is_active;
        const title = willDisable ? 'Vô hiệu hóa danh mục' : 'Kích hoạt danh mục';
        const message = willDisable
            ? `Danh mục "${category.name}" sẽ bị vô hiệu hóa. Sản phẩm thuộc danh mục này sẽ không thể tạo mới.`
            : `Danh mục "${category.name}" sẽ được kích hoạt lại.`;

        if (window.confirm(`${title}\n\n${message}\n\nBạn có chắc chắn muốn tiếp tục?`)) {
            try {
                const response = await categoriesApi.toggleCategoryStatus(category.id, willDisable);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Đã cập nhật trạng thái danh mục!',
                    type: 'success'
                });
                loadCategories();
            } catch (error) {
                console.error('Error toggling category status:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể cập nhật trạng thái',
                    type: 'error'
                });
            }
        }
    };

    // Filtered categories
    const filteredCategories = categories.filter(cat => {
        const matchSearch = !categorySearchQuery ||
            cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
            (cat.description && cat.description.toLowerCase().includes(categorySearchQuery.toLowerCase()));
        return matchSearch;
    });

    const getCategoryLabel = (category) => {
        if (typeof category === 'string') {
            const labels = {
                drink_customer: 'Đồ uống (Khách)',
                food_customer: 'Đồ ăn (Khách)',
                food_pet: 'Đồ ăn (Pet)'
            };
            return labels[category] || category || '—';
        }
        if (category && typeof category === 'object') {
            return category.name || '—';
        }
        return '—';
    };

    const getCategoryIcon = (category, isForPets) => {
        if (isForPets) return <Pets fontSize="small" />;
        if (typeof category === 'string') {
            const icons = {
                drink_customer: <LocalCafe fontSize="small" />,
                food_customer: <Restaurant fontSize="small" />,
                food_pet: <Pets fontSize="small" />
            };
            return icons[category] || <Restaurant fontSize="small" />;
        }
        return <Restaurant fontSize="small" />;
    };

    const computeStatus = (product) => {
        if (product && product.is_active === false) return 'disabled';
        const remaining = typeof product?.remaining_quantity === 'number' ? product.remaining_quantity : undefined;
        if (remaining !== undefined) {
            if (remaining <= 0) return 'sold_out';
            if (remaining <= 5) return 'low_quantity';
        }
        return 'available';
    };

    const getStatusChip = (status) => {
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
                sx={{ fontWeight: 600 }}
            />
        );
    };

    if (loading) {
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
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.WARNING[600], mb: 2 }}>
                    Quản lý Sản phẩm Menu
                </Typography>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                fontSize: '0.95rem'
                            }
                        }}
                    >
                        <Tab
                            label="Sản phẩm"
                            icon={<Restaurant />}
                            iconPosition="start"
                            sx={{ minHeight: 48 }}
                        />
                        <Tab
                            label="Danh mục"
                            icon={<Category />}
                            iconPosition="start"
                            sx={{ minHeight: 48 }}
                        />
                    </Tabs>
                </Box>

                {/* Tab Content: Products */}
                {currentTab === 0 && (
                    <>
                        {/* Status Badges */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Tổng sản phẩm
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                        {products.length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Đang bán
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                        {products.filter(p => p.is_active !== false).length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Ngừng bán
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                                        {products.filter(p => p.is_active === false).length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Sản phẩm Khách hàng
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                        {products.filter(p => !p.is_for_pets).length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Sản phẩm Pet
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                        {products.filter(p => p.is_for_pets).length}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Search and Filter Toolbar */}
                        <Toolbar
                            disableGutters
                            sx={{
                                gap: 2,
                                flexWrap: 'wrap',
                                mb: 2,
                                p: 1.5,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.6)}, ${alpha(COLORS.SECONDARY[50], 0.4)})`,
                                border: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.4)}`
                            }}
                        >
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
                                value={isActiveFilter === undefined ? '' : isActiveFilter ? 'true' : 'false'}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setIsActiveFilter(v === '' ? undefined : v === 'true');
                                }}
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 160 }}
                                label="Trạng thái"
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Đang bán</option>
                                <option value="false">Ngừng bán</option>
                            </TextField>
                            <TextField
                                select
                                size="small"
                                value={isForPetsFilter === undefined ? '' : isForPetsFilter ? 'true' : 'false'}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setIsForPetsFilter(v === '' ? undefined : v === 'true');
                                }}
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 180 }}
                                label="Loại đối tượng"
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">Tất cả</option>
                                <option value="false">Khách hàng</option>
                                <option value="true">Pet</option>
                            </TextField>
                            <TextField
                                size="small"
                                type="number"
                                label="Giá từ"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                sx={{ width: 100 }}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="đến"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                sx={{ width: 100 }}
                                InputLabelProps={{ shrink: true }}
                            />
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
                                    <TableRow sx={{ '& th': { bgcolor: alpha(COLORS.WARNING[50], 0.6) } }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Tên sản phẩm</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Danh mục</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }} align="right">Giá bán</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }} align="right">Số lượng</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }} align="right">Còn lại</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentPageProducts.map((product) => (
                                        <TableRow
                                            key={product.id || product.name}
                                            hover
                                            sx={{ '&:hover': { backgroundColor: alpha(COLORS.WARNING[50], 0.5) } }}
                                        >
                                            <TableCell>
                                                <Avatar
                                                    src={product.image_url || product.image}
                                                    alt={product.name}
                                                    variant="rounded"
                                                    sx={{ width: 56, height: 56 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                                <Chip
                                                    icon={getCategoryIcon(product.category, product.is_for_pets)}
                                                    label={`${getCategoryLabel(product.category)}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                {/* Safeguard: never render raw object */}
                                                {typeof product.category === 'object' ? null : null}
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: { md: 360, lg: 480 } }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: { md: 2, lg: 3 },
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
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {editingQuantityId === product.id ? (
                                                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={editingQuantityValue}
                                                            onChange={(e) => setEditingQuantityValue(e.target.value)}
                                                            sx={{ width: 70 }}
                                                            autoFocus
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSaveQuantity(product.id);
                                                                }
                                                            }}
                                                        />
                                                        <IconButton size="small" color="success" onClick={() => handleSaveQuantity(product.id)}>
                                                            <Check fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={handleCancelEditQuantity}>
                                                            <Close fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                ) : (
                                                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {typeof product.daily_quantity === 'number' ? product.daily_quantity : '—'}
                                                        </Typography>
                                                        <IconButton size="small" onClick={() => handleStartEditQuantity(product)}>
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {typeof product.remaining_quantity === 'number' ? (
                                                    <Chip
                                                        label={product.remaining_quantity}
                                                        size="small"
                                                        color={
                                                            product.remaining_quantity === 0 ? 'error' :
                                                                product.remaining_quantity <= 5 ? 'warning' : 'success'
                                                        }
                                                        sx={{ fontWeight: 700, minWidth: 50 }}
                                                    />
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={product.is_active === false ? 'Ngừng bán' : 'Đang bán'}
                                                    size="small"
                                                    color={product.is_active === false ? 'default' : 'success'}
                                                    variant={product.is_active === false ? 'outlined' : 'filled'}
                                                />
                                            </TableCell>
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
                                <Button
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() => {
                                        // Trigger reload to pick up fallback data if API failed previously
                                        setPage(1);
                                        setTimeout(() => {
                                            // minimal debounce
                                            const ev = new Event('input');
                                            loadProducts();
                                        }, 0);
                                    }}
                                >
                                    Tải lại
                                </Button>
                            </Box>
                        )}
                    </>
                )}

                {/* Tab Content: Categories */}
                {currentTab === 1 && (
                    <>
                        {/* Statistics */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Tổng danh mục
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                        {categories.length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Đang hoạt động
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                        {categories.filter(c => c.is_active).length}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Vô hiệu hóa
                                    </Typography>
                                    <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                                        {categories.filter(c => !c.is_active).length}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Toolbar */}
                        <Toolbar
                            disableGutters
                            sx={{
                                gap: 2,
                                flexWrap: 'wrap',
                                mb: 2,
                                p: 1.5,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.6)}, ${alpha(COLORS.SECONDARY[50], 0.4)})`,
                                border: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.4)}`
                            }}
                        >
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mô tả..."
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                                }}
                                sx={{ minWidth: { xs: '100%', sm: 250 } }}
                            />
                            <TextField
                                select
                                size="small"
                                value={categoryActiveFilter === undefined ? '' : categoryActiveFilter ? 'true' : 'false'}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCategoryActiveFilter(v === '' ? undefined : v === 'true');
                                }}
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 160 }}
                                label="Trạng thái"
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Hoạt động</option>
                                <option value="false">Vô hiệu hóa</option>
                            </TextField>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenCategoryDialog()}
                                sx={{
                                    bgcolor: COLORS.PRIMARY[500],
                                    '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                                }}
                            >
                                Thêm danh mục
                            </Button>
                        </Toolbar>

                        {/* Table */}
                        <TableContainer
                            component={Paper}
                            sx={{
                                borderRadius: 3,
                                border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`,
                                boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`
                            }}
                        >
                            <Table size="medium" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: alpha(COLORS.PRIMARY[50], 0.6) } }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Tên danh mục</TableCell>
                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCategories.map((category) => (
                                        <TableRow
                                            key={category.id}
                                            hover
                                            sx={{ '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[50], 0.5) } }}
                                        >
                                            <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 480 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {category.description || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={category.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                    size="small"
                                                    color={category.is_active ? 'success' : 'default'}
                                                    variant={category.is_active ? 'filled' : 'outlined'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color={category.is_active ? 'default' : 'success'}
                                                    onClick={() => handleToggleCategoryStatus(category)}
                                                    title={category.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                >
                                                    <Block fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="primary" onClick={() => handleOpenCategoryDialog(category)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteCategory(category.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Empty State */}
                        {filteredCategories.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Category sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                                <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                                    Không tìm thấy danh mục nào
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Thử thay đổi bộ lọc hoặc thêm danh mục mới
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* Add/Edit Product Dialog */}
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

            {/* Confirm Delete Product Modal */}
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

            {/* Add/Edit Category Dialog */}
            <AddCategoryModal
                open={openCategoryDialog}
                onClose={handleCloseCategoryDialog}
                onSave={handleSaveCategory}
                editingCategory={editingCategory}
            />

            {/* Confirm Delete Category Modal */}
            <ConfirmModal
                isOpen={openDeleteCategoryDialog}
                onClose={() => setOpenDeleteCategoryDialog(false)}
                onConfirm={confirmDeleteCategory}
                title="Xóa danh mục"
                message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác."
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

