import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Stack, Dialog, TextField, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, alpha, Toolbar, Grid, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, LocationOn, Home, MeetingRoom, Groups, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { getAllAreas, createArea, updateArea, deleteArea } from '../../api/areasApi';

const AreasPage = () => {
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [deleteAreaId, setDeleteAreaId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuArea, setMenuArea] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        image: '',
        description: '',
        location: '',
        capacity: ''
    });

    // Load areas from API
    useEffect(() => {
        const loadAreas = async () => {
            setLoading(true);
            try {
                const data = await getAllAreas();
                setAreas(data);
            } catch (error) {
                console.error('Error loading areas:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: 'Lỗi tải dữ liệu khu vực!',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };
        loadAreas();
    }, []);

    // Filtered areas - chỉ search
    const filteredAreas = useMemo(() => {
        return areas.filter(area => {
            const matchSearch = area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                area.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                area.location.toLowerCase().includes(searchQuery.toLowerCase());
            return matchSearch;
        });
    }, [areas, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredAreas.length / itemsPerPage);
    const currentPageAreas = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredAreas.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filteredAreas]);

    // Statistics
    const stats = useMemo(() => {
        const total = areas.length;
        const totalCapacity = areas.reduce((sum, a) => sum + a.capacity, 0);
        const averageCapacity = total > 0 ? Math.round(totalCapacity / total) : 0;

        // Categorize by capacity size
        const small = areas.filter(a => a.capacity <= 10).length;
        const medium = areas.filter(a => a.capacity > 10 && a.capacity <= 20).length;
        const large = areas.filter(a => a.capacity > 20).length;

        return { total, totalCapacity, averageCapacity, small, medium, large };
    }, [areas]);

    const handleOpenDialog = (area = null) => {
        if (area) {
            setEditingArea(area);
            setFormData({
                name: area.name,
                image: area.image || '',
                description: area.description,
                location: area.location || '',
                capacity: area.capacity
            });
        } else {
            setEditingArea(null);
            setFormData({
                name: '',
                image: '',
                description: '',
                location: '',
                capacity: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingArea(null);
    };

    const handleSaveArea = async () => {
        if (!formData.name || !formData.capacity || !formData.description || !formData.location) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền đầy đủ 5 thông tin: Tên, Hình ảnh, Mô tả, Vị trí, Sức chứa!',
                type: 'error'
            });
            return;
        }

        try {
            const areaData = {
                name: formData.name,
                image: formData.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
                description: formData.description,
                location: formData.location,
                capacity: parseInt(formData.capacity)
            };

            if (editingArea) {
                // Update
                const updatedArea = await updateArea(editingArea.id, areaData);
                setAreas(prev => prev.map(area =>
                    area.id === editingArea.id ? updatedArea : area
                ));
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật khu vực thành công!',
                    type: 'success'
                });
            } else {
                // Add new
                const newArea = await createArea(areaData);
                setAreas(prev => [...prev, newArea]);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Thêm khu vực mới thành công!',
                    type: 'success'
                });
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving area:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Lỗi khi lưu khu vực!',
                type: 'error'
            });
        }
    };

    const handleDeleteArea = (areaId) => {
        setDeleteAreaId(areaId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteArea(deleteAreaId);
            setAreas(prev => prev.filter(area => area.id !== deleteAreaId));
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa khu vực thành công!',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting area:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Lỗi khi xóa khu vực!',
                type: 'error'
            });
        } finally {
            setOpenDeleteDialog(false);
            setDeleteAreaId(null);
        }
    };

    // Show loading state
    if (loading) {
        return <Loading message="Đang tải thông tin khu vực..." fullScreen />;
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
                    Quản lý Khu vực
                </Typography>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={6}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng khu vực
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {stats.total}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={6}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng sức chứa
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.totalCapacity}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Search and Actions Toolbar */}
                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, mô tả, vị trí..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 280 } }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            backgroundColor: COLORS.ERROR[500],
                            '&:hover': { backgroundColor: COLORS.ERROR[600] }
                        }}
                    >
                        Thêm khu vực
                    </Button>
                </Toolbar>

                {/* Table View - Style giống StaffPage */}
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
                                <TableCell sx={{
                                    fontWeight: 800,
                                    display: { xs: 'table-cell', sm: 'table-cell' }
                                }}>
                                    Ảnh
                                </TableCell>
                                <TableCell sx={{
                                    fontWeight: 800
                                }}>
                                    Tên khu vực
                                </TableCell>
                                <TableCell sx={{
                                    fontWeight: 800,
                                    display: { xs: 'none', md: 'table-cell' }
                                }}>
                                    Mô tả
                                </TableCell>
                                <TableCell sx={{
                                    fontWeight: 800,
                                    display: { xs: 'none', sm: 'table-cell' }
                                }}>
                                    Vị trí
                                </TableCell>
                                <TableCell sx={{
                                    fontWeight: 800
                                }}>
                                    Sức chứa
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 800
                                    }}
                                >
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageAreas.map((area) => (
                                <TableRow key={area.id} hover>
                                    <TableCell>
                                        <Box
                                            component="img"
                                            src={area.image}
                                            alt={area.name}
                                            sx={{
                                                width: { xs: 50, sm: 60 },
                                                height: { xs: 40, sm: 45 },
                                                objectFit: 'cover',
                                                borderRadius: 1,
                                                border: `1px solid ${COLORS.BORDER.LIGHT}`
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {area.name}
                                    </TableCell>
                                    <TableCell sx={{
                                        display: { xs: 'none', md: 'table-cell' },
                                        maxWidth: 300
                                    }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {area.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {area.location}
                                    </TableCell>
                                    <TableCell>
                                        {area.capacity}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setMenuAnchor(e.currentTarget);
                                                setMenuArea(area);
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {filteredAreas.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={filteredAreas.length}
                    />
                )}

                {/* Empty State */}
                {filteredAreas.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <LocationOn sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                            Không tìm thấy khu vực nào
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thử thay đổi tìm kiếm hoặc thêm khu vực mới
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Add/Edit Dialog - Style giống StaffPage */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <Box sx={{ px: 3, pt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                        {editingArea ? 'Sửa khu vực' : 'Thêm khu vực'}
                    </Typography>
                </Box>
                <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên khu vực"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Khu vực chính - Tầng 1"
                        />
                        <TextField
                            label="Hình ảnh (URL)"
                            fullWidth
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://images.unsplash.com/photo-..."
                        />
                        {formData.image && (
                            <Box
                                component="img"
                                src={formData.image}
                                alt="Preview"
                                sx={{
                                    width: '100%',
                                    height: 150,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: `1px solid ${COLORS.BORDER.LIGHT}`
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <TextField
                            label="Mô tả"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả chi tiết về không gian..."
                        />
                        <TextField
                            label="Vị trí"
                            fullWidth
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="VD: Tầng 1, Phía trước quán"
                        />
                        <TextField
                            label="Sức chứa"
                            fullWidth
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            placeholder="30"
                        />
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCloseDialog}>Hủy</Button>
                    <Button variant="contained" onClick={handleSaveArea}>
                        Lưu
                    </Button>
                </Stack>
            </Dialog>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Xóa khu vực"
                message="Bạn có chắc chắn muốn xóa khu vực này? Hành động này không thể hoàn tác."
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

            {/* Area Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuArea(null);
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
                        if (menuArea) {
                            handleOpenDialog(menuArea);
                        }
                        setMenuAnchor(null);
                        setMenuArea(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuArea) {
                            handleDeleteArea(menuArea.id);
                        }
                        setMenuAnchor(null);
                        setMenuArea(null);
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

export default AreasPage;


