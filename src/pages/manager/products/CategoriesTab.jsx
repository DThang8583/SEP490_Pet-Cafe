import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, TextField, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Toolbar, Avatar, alpha, Menu, MenuItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import { Add, Edit, Delete, Search, Category, Block, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import AlertModal from '../../../components/modals/AlertModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AddCategoryModal from '../../../components/modals/AddCategoryModal';
import categoriesApi from '../../../api/categoriesApi';

const CategoriesTab = () => {
    // Categories state
    const [categories, setCategories] = useState([]);
    const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
    const [openDeleteCategoryDialog, setOpenDeleteCategoryDialog] = useState(false);
    const [openToggleCategoryDialog, setOpenToggleCategoryDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteCategoryId, setDeleteCategoryId] = useState(null);
    const [toggleCategory, setToggleCategory] = useState(null);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [categoryActiveFilter, setCategoryActiveFilter] = useState(undefined);

    // Menu state
    const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
    const [menuCategory, setMenuCategory] = useState(null);

    // Alert state
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Load categories
    const loadCategories = async () => {
        try {
            // If filter is "all" (undefined), fetch both active and inactive categories separately
            // because API might default to active only when IsActive parameter is not provided
            if (categoryActiveFilter === undefined) {
                const [activeResponse, inactiveResponse] = await Promise.all([
                    categoriesApi.getAllCategories({ IsActive: true }),
                    categoriesApi.getAllCategories({ IsActive: false })
                ]);

                // Merge active and inactive categories
                const activeCategories = activeResponse?.data || [];
                const inactiveCategories = inactiveResponse?.data || [];
                const allCategories = [...activeCategories, ...inactiveCategories];

                setCategories(allCategories);
            } else {
                // For "active" or "inactive" filter, use single request
                const response = await categoriesApi.getAllCategories({
                    IsActive: categoryActiveFilter
                });
                setCategories(response.data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const errorMessage = error.message || 'Lỗi tải dữ liệu danh mục!';
            setAlert({
                open: true,
                title: 'Lỗi',
                message: errorMessage,
                type: 'error'
            });
        }
    };

    useEffect(() => {
        loadCategories();
    }, [categoryActiveFilter]);

    // Statistics
    const stats = useMemo(() => ({
        total: categories.length,
        active: categories.filter(c => c.is_active).length,
        inactive: categories.filter(c => !c.is_active).length
    }), [categories]);

    // Filtered categories
    const filteredCategories = useMemo(() => {
        if (!categorySearchQuery) return categories;
        const query = categorySearchQuery.toLowerCase();
        return categories.filter(cat =>
            cat.name?.toLowerCase().includes(query) ||
            (cat.description && cat.description.toLowerCase().includes(query))
        );
    }, [categories, categorySearchQuery]);

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

    const handleToggleCategoryStatus = (category) => {
        setToggleCategory(category);
        setOpenToggleCategoryDialog(true);
    };

    const confirmToggleCategoryStatus = async () => {
        if (!toggleCategory) return;

        const willDisable = toggleCategory.is_active;
        try {
            const response = await categoriesApi.toggleCategoryStatus(toggleCategory.id, willDisable);
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
        } finally {
            setOpenToggleCategoryDialog(false);
            setToggleCategory(null);
        }
    };

    return (
        <Box>
            {/* Statistics */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: 2,
                    mb: 4,
                    width: '100%',
                    overflow: 'visible'
                }}
            >
                {[
                    { label: 'Tổng danh mục', value: stats.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Đang hoạt động', value: stats.active, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Vô hiệu hóa', value: stats.inactive, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${2 * 16}px) / 3)`;
                    return (
                        <Box
                            key={index}
                            sx={{
                                flex: `0 0 ${cardWidth}`,
                                width: cardWidth,
                                maxWidth: cardWidth,
                                minWidth: 0
                            }}
                        >
                            <Paper sx={{
                                p: 2.5,
                                borderTop: `4px solid ${stat.color}`,
                                borderRadius: 2,
                                height: '100%',
                                boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                            }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {stat.label}
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color={stat.valueColor}>
                                    {stat.value}
                                </Typography>
                            </Paper>
                        </Box>
                    );
                })}
            </Box>

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
                    sx={{ width: '1250px', flexShrink: 0 }}
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
                    boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`,
                    overflowX: 'auto'
                }}
            >
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: alpha(COLORS.PRIMARY[50], 0.6) } }}>
                            <TableCell sx={{ fontWeight: 800, width: '5%' }}>Ảnh</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Tên danh mục</TableCell>
                            <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategories.map((category) => (
                            <TableRow
                                key={category.id}
                                hover
                                sx={{ '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[50], 0.5) } }}
                            >
                                <TableCell>
                                    <Avatar
                                        src={category.image_url || ''}
                                        variant="rounded"
                                        sx={{ width: 56, height: 56 }}
                                    >
                                        <Category />
                                    </Avatar>
                                </TableCell>
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
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            color={category.is_active ? 'default' : 'success'}
                                            onClick={() => handleToggleCategoryStatus(category)}
                                            title={category.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                        >
                                            <Block fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setCategoryMenuAnchor(e.currentTarget);
                                                setMenuCategory(category);
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

            {/* Modals */}
            <AddCategoryModal
                open={openCategoryDialog}
                onClose={handleCloseCategoryDialog}
                onSave={handleSaveCategory}
                editingCategory={editingCategory}
            />

            <ConfirmModal
                isOpen={openDeleteCategoryDialog}
                onClose={() => {
                    setOpenDeleteCategoryDialog(false);
                    setDeleteCategoryId(null);
                }}
                onConfirm={confirmDeleteCategory}
                title="Xóa danh mục"
                message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            <ConfirmModal
                isOpen={openToggleCategoryDialog}
                onClose={() => {
                    setOpenToggleCategoryDialog(false);
                    setToggleCategory(null);
                }}
                onConfirm={confirmToggleCategoryStatus}
                title={toggleCategory?.is_active ? 'Vô hiệu hóa danh mục' : 'Kích hoạt danh mục'}
                message={
                    toggleCategory?.is_active
                        ? `Danh mục "${toggleCategory?.name}" sẽ bị vô hiệu hóa. Sản phẩm thuộc danh mục này sẽ không thể tạo mới. Bạn có chắc chắn muốn tiếp tục?`
                        : `Danh mục "${toggleCategory?.name}" sẽ được kích hoạt lại. Bạn có chắc chắn muốn tiếp tục?`
                }
                confirmText={toggleCategory?.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                cancelText="Hủy"
                type={toggleCategory?.is_active ? 'warning' : 'success'}
            />

            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Category Actions Menu */}
            <Menu
                anchorEl={categoryMenuAnchor}
                open={Boolean(categoryMenuAnchor)}
                onClose={() => {
                    setCategoryMenuAnchor(null);
                    setMenuCategory(null);
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
                        if (menuCategory) {
                            handleOpenCategoryDialog(menuCategory);
                        }
                        setCategoryMenuAnchor(null);
                        setMenuCategory(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuCategory) {
                            handleDeleteCategory(menuCategory.id);
                        }
                        setCategoryMenuAnchor(null);
                        setMenuCategory(null);
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

export default CategoriesTab;

