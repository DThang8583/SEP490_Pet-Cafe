import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Stack, TextField, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Toolbar, Grid, Avatar, alpha, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Restaurant, Search, LocalCafe, Pets, Visibility, Block, Check, Close, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import AlertModal from '../../../components/modals/AlertModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AddProductModal from '../../../components/modals/AddProductModal';
import ViewProductDetailsModal from '../../../components/modals/ViewProductDetailsModal';
import productsApi, { updateProduct, updateStockQuantity } from '../../../api/productsApi';
import { formatPrice } from '../../../utils/formatPrice';
import { API_BASE_URL } from '../../../config/config';

const ProductsTab = () => {
    // Products state
    const [products, setProducts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [deleteProductId, setDeleteProductId] = useState(null);
    const [toggleStatusProduct, setToggleStatusProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState(undefined);
    const [isForPetsFilter, setIsForPetsFilter] = useState(undefined);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minCost, setMinCost] = useState('');
    const [maxCost, setMaxCost] = useState('');
    const [minStockQuantity, setMinStockQuantity] = useState('');
    const [maxStockQuantity, setMaxStockQuantity] = useState('');
    const [editingQuantityId, setEditingQuantityId] = useState(null);
    const [editingQuantityValue, setEditingQuantityValue] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Menu state
    const [productMenuAnchor, setProductMenuAnchor] = useState(null);
    const [menuProduct, setMenuProduct] = useState(null);

    // Alert state
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Pagination state from API
    const [pagination, setPagination] = useState({
        total_items_count: 0,
        page_size: 10,
        total_pages_count: 0,
        page_index: 0,
        has_next: false,
        has_previous: false
    });

    // Helper function to get image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        // If already a full URL (starts with http:// or https://), return as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        // If relative path, prepend base URL
        const baseUrl = API_BASE_URL.replace('/api', '');
        return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
    };

    // Load products
    const loadProducts = async () => {
        try {
            const response = await productsApi.getAllProducts({
                IsActive: isActiveFilter,
                IsForPets: isForPetsFilter,
                MinPrice: minPrice !== '' ? Number(minPrice) : undefined,
                MaxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
                MinCost: minCost !== '' ? Number(minCost) : undefined,
                MaxCost: maxCost !== '' ? Number(maxCost) : undefined,
                MinStockQuantity: minStockQuantity !== '' ? Number(minStockQuantity) : undefined,
                MaxStockQuantity: maxStockQuantity !== '' ? Number(maxStockQuantity) : undefined,
                PageIndex: page - 1,
                PageSize: itemsPerPage
            });
            setProducts(response.data || []);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            const errorMessage = error.message || 'Lỗi tải dữ liệu sản phẩm!';
            setAlert({
                open: true,
                title: 'Lỗi',
                message: errorMessage,
                type: 'error'
            });
        }
    };

    useEffect(() => {
        loadProducts();
    }, [isActiveFilter, isForPetsFilter, minPrice, maxPrice, minCost, maxCost, minStockQuantity, maxStockQuantity, page, itemsPerPage]);

    // Statistics
    const stats = useMemo(() => ({
        total: products.length,
        active: products.filter(p => p.is_active !== false).length,
        inactive: products.filter(p => p.is_active === false).length,
        forCustomers: products.filter(p => !p.is_for_pets).length,
        forPets: products.filter(p => p.is_for_pets).length
    }), [products]);

    // Filtered products (client-side search only, pagination is server-side)
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    // Use API pagination
    const totalPages = pagination.total_pages_count || 1;
    const currentPageProducts = filteredProducts;

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
                await updateProduct(editingProduct.id, {
                    ...productData,
                    is_active: editingProduct.is_active !== undefined ? editingProduct.is_active : true
                });
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

    const handleToggleProductStatus = (product) => {
        setToggleStatusProduct(product);
        setOpenToggleStatusDialog(true);
    };

    const confirmToggleStatus = async () => {
        if (!toggleStatusProduct) return;

        const willDisable = toggleStatusProduct.is_active === true;
        try {
            const response = await productsApi.toggleProductStatus(toggleStatusProduct.id, willDisable);
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
        } finally {
            setOpenToggleStatusDialog(false);
            setToggleStatusProduct(null);
        }
    };

    const handleStartEditQuantity = (product) => {
        setEditingQuantityId(product.id);
        setEditingQuantityValue(product.stock_quantity || '');
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
            const response = await updateStockQuantity(productId, newQuantity);
            setAlert({
                open: true,
                title: 'Thành công',
                message: response.message || 'Cập nhật số lượng tồn kho thành công!',
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

    return (
        <Box>
            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng sản phẩm
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                            {stats.total}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Đang bán
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.active}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ngừng bán
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                            {stats.inactive}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sản phẩm Khách hàng
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                            {stats.forCustomers}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sản phẩm Pet
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.forPets}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Search and Filter Toolbar */}
            <Paper
                sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.6)}, ${alpha(COLORS.SECONDARY[50], 0.4)})`,
                    border: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.4)}`,
                    mb: 2
                }}
            >
                {/* Row 1: Search, Status, Object Type, Add Button */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        alignItems: 'flex-start'
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
                        sx={{ flexGrow: 1, minWidth: 0 }}
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
                        label="Trạng thái"
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '160px', flexShrink: 0 }}
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
                        label="Loại đối tượng"
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '180px', flexShrink: 0 }}
                    >
                        <option value="">Tất cả</option>
                        <option value="false">Khách hàng</option>
                        <option value="true">Pet</option>
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            '&:hover': { bgcolor: COLORS.WARNING[600] },
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        Thêm sản phẩm
                    </Button>
                </Box>

                {/* Row 2: Price, Cost, Stock Quantity filters - aligned with filters above */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start'
                    }}
                >
                    {/* Giá từ/đến - aligned with Search (left edge) */}
                    <Stack direction="row" spacing={1} sx={{ width: '485px', flexShrink: 0 }}>
                        <TextField
                            size="small"
                            type="number"
                            label="Giá từ"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="number"
                            label="Giá đến"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                    {/* Giá vốn từ/đến - aligned with Trạng thái column */}
                    <Stack direction="row" spacing={1} sx={{ width: '485px', flexShrink: 0 }}>
                        <TextField
                            size="small"
                            type="number"
                            label="Giá vốn từ"
                            value={minCost}
                            onChange={(e) => setMinCost(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="number"
                            label="Giá vốn đến"
                            value={maxCost}
                            onChange={(e) => setMaxCost(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                    {/* Tồn kho từ/đến - right edge of "Tồn kho đến" aligned with right edge of "Loại đối tượng" */}
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            width: '485px',
                            flexShrink: 0
                        }}
                    >
                        <TextField
                            size="small"
                            type="number"
                            label="Tồn kho từ"
                            value={minStockQuantity}
                            onChange={(e) => setMinStockQuantity(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            type="number"
                            label="Tồn kho đến"
                            value={maxStockQuantity}
                            onChange={(e) => setMaxStockQuantity(e.target.value)}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Box>
            </Paper>

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
                            <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }} align="right">Giá vốn</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Tồn kho</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Mức tối thiểu</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Thao tác</TableCell>
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
                                        src={getImageUrl(product.image_url || product.image)}
                                        alt={product.name}
                                        variant="rounded"
                                        sx={{ width: 56, height: 56 }}
                                    >
                                        <Restaurant />
                                    </Avatar>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                    <Chip
                                        icon={getCategoryIcon(product.category, product.is_for_pets)}
                                        label={`${getCategoryLabel(product.category)}`}
                                        size="small"
                                        variant="outlined"
                                    />
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
                                <TableCell align="right" sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>
                                    {typeof product.cost === 'number' ? formatPrice(product.cost) : '—'}
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
                                                {typeof product.stock_quantity === 'number' ? product.stock_quantity : '—'}
                                            </Typography>
                                            <IconButton size="small" onClick={() => handleStartEditQuantity(product)}>
                                                <Edit sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    {typeof product.min_stock_level === 'number' ? (
                                        <Chip
                                            label={product.min_stock_level}
                                            size="small"
                                            color={
                                                product.stock_quantity <= product.min_stock_level ? 'error' :
                                                    product.stock_quantity <= product.min_stock_level * 1.5 ? 'warning' : 'success'
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
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            color={product.is_active === false ? 'success' : 'default'}
                                            onClick={() => handleToggleProductStatus(product)}
                                            title={product.is_active === false ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                        >
                                            <Block fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setProductMenuAnchor(e.currentTarget);
                                                setMenuProduct(product);
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.total_items_count > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        setItemsPerPage(newValue);
                        setPage(1);
                    }}
                    totalItems={pagination.total_items_count}
                />
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && (
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
                            setPage(1);
                            setTimeout(() => {
                                loadProducts();
                            }, 0);
                        }}
                    >
                        Tải lại
                    </Button>
                </Box>
            )}

            {/* Modals */}
            <AddProductModal
                open={openDialog}
                onClose={handleCloseDialog}
                onSave={handleSaveProduct}
                editingProduct={editingProduct}
            />

            <ViewProductDetailsModal
                open={openViewDialog}
                onClose={handleCloseViewDialog}
                product={viewingProduct}
            />

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

            <ConfirmModal
                isOpen={openToggleStatusDialog}
                onClose={() => {
                    setOpenToggleStatusDialog(false);
                    setToggleStatusProduct(null);
                }}
                onConfirm={confirmToggleStatus}
                title={toggleStatusProduct?.is_active === true ? 'Tạm ngừng bán sản phẩm' : 'Mở lại bán sản phẩm'}
                message={
                    toggleStatusProduct?.is_active === true
                        ? `Sản phẩm "${toggleStatusProduct?.name}" sẽ được đánh dấu là "Tạm ngừng bán". Khách hàng sẽ không thể đặt sản phẩm này.\n\nBạn có chắc chắn muốn tiếp tục?`
                        : `Sản phẩm "${toggleStatusProduct?.name}" sẽ được mở lại bán.\n\nBạn có chắc chắn muốn tiếp tục?`
                }
                confirmText={toggleStatusProduct?.is_active === true ? 'Tạm ngừng' : 'Mở lại'}
                cancelText="Hủy"
                type={toggleStatusProduct?.is_active === true ? 'warning' : 'info'}
            />

            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Product Actions Menu */}
            <Menu
                anchorEl={productMenuAnchor}
                open={Boolean(productMenuAnchor)}
                onClose={() => {
                    setProductMenuAnchor(null);
                    setMenuProduct(null);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (menuProduct) {
                            handleViewProduct(menuProduct);
                        }
                        setProductMenuAnchor(null);
                        setMenuProduct(null);
                    }}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuProduct) {
                            handleOpenDialog(menuProduct);
                        }
                        setProductMenuAnchor(null);
                        setMenuProduct(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuProduct) {
                            handleDeleteProduct(menuProduct.id);
                        }
                        setProductMenuAnchor(null);
                        setMenuProduct(null);
                    }}
                >
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ProductsTab;

