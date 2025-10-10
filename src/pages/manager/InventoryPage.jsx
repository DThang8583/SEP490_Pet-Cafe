import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Button, Stack, Dialog, TextField, IconButton, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    alpha, Toolbar, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Add, Edit, Delete, Inventory, LocalCafe, Pets, Warning, CheckCircle, Error as ErrorIcon, History
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AddMaterialsModal from '../../components/modals/AddMaterialsModal';
import RestockMaterialsModal from '../../components/modals/RestockMaterialsModal';
import RestockHistoryModal from '../../components/modals/RestockHistoryModal';
import UsageHistoryModal from '../../components/modals/UsageHistoryModal';
import inventoryApi, { INVENTORY_CATEGORIES, INVENTORY_STATUS } from '../../api/inventoryApi';

const InventoryPage = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openRestockModal, setOpenRestockModal] = useState(false);
    const [openHistoryModal, setOpenHistoryModal] = useState(false);
    const [openUsageHistoryModal, setOpenUsageHistoryModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        minStock: '',
        supplier: '',
        expiryDate: ''
    });

    // Load inventory items
    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.getAllItems();
            setItems(response.data);
        } catch (error) {
            console.error('Error loading inventory:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi tải dữ liệu kho hàng!',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchCategory = filterCategory === 'all' || item.category === filterCategory;
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchStatus && matchSearch;
        });
    }, [items, searchQuery, filterCategory, filterStatus]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentPageItems = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filteredItems]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: items.length,
            cafeIngredients: items.filter(i => i.category === 'cafe_ingredients').length,
            petFood: items.filter(i => i.category === 'pet_food').length,
            inStock: items.filter(i => i.status === 'in_stock').length,
            lowStock: items.filter(i => i.status === 'low_stock').length,
            outOfStock: items.filter(i => i.status === 'out_of_stock').length
        };
    }, [items]);

    const handleOpenAddModal = () => {
        setOpenAddModal(true);
    };

    const handleCloseAddModal = () => {
        setOpenAddModal(false);
    };

    const handleOpenRestockModal = () => {
        setOpenRestockModal(true);
    };

    const handleCloseRestockModal = () => {
        setOpenRestockModal(false);
    };

    const handleOpenEditDialog = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minStock: item.minStock,
            supplier: item.supplier || '',
            expiryDate: item.expiryDate || ''
        });
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditingItem(null);
        setFormData({
            name: '',
            category: '',
            quantity: '',
            unit: '',
            minStock: '',
            supplier: '',
            expiryDate: ''
        });
    };

    // Handle add new material from AddMaterialsModal
    const handleAddMaterial = async (materialData) => {
        try {
            const response = await inventoryApi.createItem(materialData);
            setItems(prev => [...prev, response.data]);
            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã nhập "${materialData.name}" vào kho thành công!`,
                type: 'success'
            });
            handleCloseAddModal();
        } catch (error) {
            console.error('Error adding material:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi nhập nguyên liệu vào kho!',
                type: 'error'
            });
        }
    };

    // Handle update existing material from Edit Dialog
    const handleUpdateMaterial = async () => {
        if (!formData.name || !formData.category || formData.quantity === '' || !formData.unit) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
                type: 'error'
            });
            return;
        }

        try {
            const response = await inventoryApi.updateItem(editingItem.id, formData);
            setItems(prev => prev.map(item =>
                item.id === editingItem.id ? response.data : item
            ));
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Cập nhật nguyên liệu thành công!',
                type: 'success'
            });
            handleCloseEditDialog();
        } catch (error) {
            console.error('Error updating material:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi cập nhật nguyên liệu!',
                type: 'error'
            });
        }
    };

    // Handle bulk restock (multiple materials at once)
    const handleBulkRestock = async (bulkData) => {
        try {
            // Update all materials in parallel
            const updatePromises = bulkData.map(data => {
                const updateData = {
                    quantity: data.newTotal,
                    expiryDate: data.expiryDate,
                    supplier: data.supplier
                };
                return inventoryApi.updateItem(data.materialId, updateData);
            });

            const responses = await Promise.all(updatePromises);

            // Log restock history for each item (use updated data from responses)
            const historyPromises = bulkData.map((data, index) => {
                const updatedMaterial = responses[index]?.data;
                if (!updatedMaterial) return null;

                // Get quantity before from items state
                const materialBefore = items.find(item => item.id === data.materialId);

                return inventoryApi.addRestockHistory({
                    materialId: data.materialId,
                    materialName: updatedMaterial.name,
                    quantityAdded: data.restockQuantity,
                    quantityBefore: materialBefore?.quantity || 0,
                    quantityAfter: data.newTotal,
                    unit: updatedMaterial.unit,
                    supplier: data.supplier,
                    expiryDate: data.expiryDate
                });
            }).filter(Boolean);

            await Promise.all(historyPromises);

            // Update items state with all new data
            setItems(prev => {
                const updatedItems = [...prev];
                responses.forEach(response => {
                    const index = updatedItems.findIndex(item => item.id === response.data.id);
                    if (index !== -1) {
                        updatedItems[index] = response.data;
                    }
                });
                return updatedItems;
            });

            const totalQuantity = bulkData.reduce((sum, data) => sum + data.restockQuantity, 0);

            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã nhập thêm ${bulkData.length} nguyên liệu (tổng ${totalQuantity} đơn vị) thành công!`,
                type: 'success'
            });

            handleCloseRestockModal();
        } catch (error) {
            console.error('Error bulk restocking:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi nhập thêm hàng loạt!',
                type: 'error'
            });
        }
    };

    const handleDeleteItem = (itemId) => {
        setDeleteItemId(itemId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            await inventoryApi.deleteItem(deleteItemId);
            setItems(prev => prev.filter(item => item.id !== deleteItemId));
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa vật phẩm thành công!',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting item:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi xóa vật phẩm!',
                type: 'error'
            });
        } finally {
            setOpenDeleteDialog(false);
            setDeleteItemId(null);
        }
    };

    const getStatusChip = (status) => {
        const statusInfo = INVENTORY_STATUS[status];
        return (
            <Chip
                label={statusInfo.label}
                size="small"
                color={statusInfo.color}
                sx={{ fontWeight: 600 }}
            />
        );
    };

    const getCategoryName = (categoryId) => {
        const category = INVENTORY_CATEGORIES.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Show loading state
    if (loading) {
        return <Loading message="Đang tải dữ liệu kho hàng..." fullScreen />;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: COLORS.BACKGROUND.NEUTRAL,
            width: '100%'
        }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600], mb: 3 }}>
                    Quản lý Kho hàng
                </Typography>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Inventory sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                    {stats.total}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600 }}>
                                    Tổng vật phẩm
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.8)} 0%, ${alpha(COLORS.SUCCESS[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.SUCCESS[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.SUCCESS[400]} 0%, ${COLORS.SUCCESS[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                    {stats.inStock}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600 }}>
                                    Còn hàng
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.8)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.WARNING[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.WARNING[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.WARNING[400]} 0%, ${COLORS.WARNING[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Warning sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                    {stats.lowStock}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.WARNING[600], fontWeight: 600 }}>
                                    Sắp hết
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.ERROR[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ErrorIcon sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                    {stats.outOfStock}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], fontWeight: 600 }}>
                                    Hết hàng
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.8)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.INFO[500], 0.2)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <LocalCafe sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                    {stats.cafeIngredients}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.INFO[600], fontWeight: 600 }}>
                                    NL Cafe
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2}>
                        <Paper
                            sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)} 0%, ${alpha(COLORS.SECONDARY[100], 0.6)} 100%)`,
                                border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.3)}`,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(COLORS.SECONDARY[500], 0.2)}`
                                }
                            }}
                        >
        <Box
            sx={{
                                    background: `linear-gradient(135deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                                    borderRadius: 2,
                                    p: 1,
                display: 'flex',
                alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Pets sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SECONDARY[700] }}>
                                    {stats.petFood}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.SECONDARY[600], fontWeight: 600 }}>
                                    Đồ ăn Pet
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Search and Filters */}
                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, nhà cung cấp..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 280 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Danh mục</InputLabel>
                        <Select label="Danh mục" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            {INVENTORY_CATEGORIES.map(cat => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="in_stock">Còn hàng</MenuItem>
                            <MenuItem value="low_stock">Sắp hết</MenuItem>
                            <MenuItem value="out_of_stock">Hết hàng</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="outlined"
                        startIcon={<Inventory />}
                        onClick={handleOpenRestockModal}
                        sx={{
                            borderColor: COLORS.WARNING[500],
                            color: COLORS.WARNING[700],
                            fontWeight: 700,
                            '&:hover': {
                                borderColor: COLORS.WARNING[600],
                                bgcolor: alpha(COLORS.WARNING[500], 0.1)
                            }
                        }}
                    >
                        Nhập thêm
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<History />}
                        onClick={() => setOpenHistoryModal(true)}
                        sx={{
                            borderColor: COLORS.INFO[500],
                            color: COLORS.INFO[700],
                            fontWeight: 700,
                            '&:hover': {
                                borderColor: COLORS.INFO[600],
                                bgcolor: alpha(COLORS.INFO[500], 0.1)
                            }
                        }}
                    >
                        Lịch sử nhập hàng
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<History />}
                        onClick={() => setOpenUsageHistoryModal(true)}
                        sx={{
                            borderColor: COLORS.ERROR[500],
                            color: COLORS.ERROR[700],
                            fontWeight: 700,
                            '&:hover': {
                                borderColor: COLORS.ERROR[600],
                                bgcolor: alpha(COLORS.ERROR[500], 0.1)
                            }
                        }}
                    >
                        Lịch sử lấy nguyên liệu
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenAddModal}
                        sx={{
                            backgroundColor: COLORS.ERROR[500],
                            '&:hover': { backgroundColor: COLORS.ERROR[600] }
                        }}
                    >
                        Thêm nguyên liệu
                    </Button>
                </Toolbar>

                {/* Table View */}
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                        boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Tên vật phẩm</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Danh mục</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Số lượng</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Nhà cung cấp</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>HSD</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageItems.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {getCategoryName(item.category)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.quantity} {item.unit}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Min: {item.minStock} {item.unit}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                        {item.supplier || '—'}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {formatDate(item.expiryDate)}
                                    </TableCell>
                                    <TableCell>{getStatusChip(item.status)}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEditDialog(item)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteItem(item.id)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {filteredItems.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={filteredItems.length}
                    />
                )}

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Inventory sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                            Không tìm thấy vật phẩm nào
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thử thay đổi bộ lọc hoặc thêm vật phẩm mới
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Edit Dialog (Simple version for quick edits) */}
            <Dialog
                open={openEditDialog}
                onClose={handleCloseEditDialog}
                maxWidth="sm"
                fullWidth
            >
                <Box sx={{ px: 3, pt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                        Cập nhật nguyên liệu
            </Typography>
                </Box>
                <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên vật phẩm *"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Sữa tươi Vinamilk"
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Danh mục</InputLabel>
                            <Select
                                value={formData.category}
                                label="Danh mục"
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {INVENTORY_CATEGORIES.map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Số lượng *"
                                    fullWidth
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="50"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Đơn vị *"
                                    fullWidth
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="lít, kg, hộp..."
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Tồn kho tối thiểu"
                            fullWidth
                            type="number"
                            value={formData.minStock}
                            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                            placeholder="10"
                        />
                        <TextField
                            label="Nhà cung cấp"
                            fullWidth
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="VD: Vinamilk"
                        />
                        <TextField
                            label="Hạn sử dụng"
                            fullWidth
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCloseEditDialog}>Hủy</Button>
                    <Button variant="contained" onClick={handleUpdateMaterial}>
                        Cập nhật
                    </Button>
                </Stack>
            </Dialog>

            {/* Add Materials Modal (Business-validated) */}
            <AddMaterialsModal
                isOpen={openAddModal}
                onClose={handleCloseAddModal}
                onSubmit={handleAddMaterial}
                existingMaterials={items}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Xóa vật phẩm"
                message="Bạn có chắc chắn muốn xóa vật phẩm này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Restock Materials Modal (Bulk Mode) */}
            <RestockMaterialsModal
                open={openRestockModal}
                onClose={handleCloseRestockModal}
                materials={items}
                onBulkRestock={handleBulkRestock}
            />

            {/* Restock History Modal */}
            <RestockHistoryModal
                open={openHistoryModal}
                onClose={() => setOpenHistoryModal(false)}
                materials={items}
            />

            {/* Usage History Modal (Staff usage tracking) */}
            <UsageHistoryModal
                open={openUsageHistoryModal}
                onClose={() => setOpenUsageHistoryModal(false)}
                materials={items}
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

export default InventoryPage;


