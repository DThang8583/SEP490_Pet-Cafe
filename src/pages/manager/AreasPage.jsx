import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton, Alert, Snackbar, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, alpha
} from '@mui/material';
import {
    Add, Edit, Delete, LocationOn, Search
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';

// Mock data - chỉ 5 thông tin chính
const INITIAL_AREAS = [
    {
        id: 'area-1',
        name: 'Khu vực chính - Tầng 1',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
        description: 'Không gian rộng rãi và ấm cúng với thiết kế hiện đại, phù hợp cho khách ngồi uống nước và tương tác với thú cưng. Khu vực được trang bị đầy đủ tiện nghi với ghế ngồi thoải mái và không gian chơi cho pets.',
        location: 'Tầng 1, Phía trước quán, Gần cửa chính',
        capacity: 30
    },
    {
        id: 'area-2',
        name: 'Khu VIP - Tầng 2',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
        description: 'Khu vực cao cấp với không gian riêng tư và view đẹp, dành cho khách hàng muốn có trải nghiệm đặc biệt. Được phục vụ riêng với menu đặc biệt và không gian yên tĩnh.',
        location: 'Tầng 2, Phía góc view đẹp, Khu vực biệt lập',
        capacity: 15
    },
    {
        id: 'area-3',
        name: 'Phòng Grooming',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
        description: 'Phòng chuyên dụng cho việc tắm rửa, cắt tỉa lông và chăm sóc vệ sinh cho thú cưng. Được trang bị đầy đủ thiết bị grooming chuyên nghiệp và khu vực sấy khô an toàn.',
        location: 'Tầng 1, Khu vực phía sau, Gần kho đồ dùng',
        capacity: 2
    },
    {
        id: 'area-4',
        name: 'Phòng Thú Y',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop',
        description: 'Phòng khám sức khỏe và chăm sóc y tế cho thú cưng với trang thiết bị y tế cơ bản. Có bác sĩ thú y thường trực để kiểm tra sức khỏe định kỳ và xử lý các trường hợp khẩn cấp.',
        location: 'Tầng 1, Khu vực riêng biệt, Gần lối thoát hiểm',
        capacity: 1
    },
    {
        id: 'area-5',
        name: 'Phòng Spa Pet',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop',
        description: 'Phòng spa cao cấp với dịch vụ massage và chăm sóc thư giãn cho thú cưng. Không gian được thiết kế để tạo cảm giác thư thái với ánh sáng dịu nhẹ và âm nhạc êm ái.',
        location: 'Tầng 2, Khu vực yên tĩnh, Gần khu nghỉ dưỡng',
        capacity: 4
    },
    {
        id: 'area-6',
        name: 'Phòng Training',
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop',
        description: 'Phòng huấn luyện rộng rãi với đầy đủ dụng cụ để dạy kỹ năng và hành vi cho thú cưng. Có gương lớn để quan sát và không gian thoáng đãng cho các hoạt động vận động.',
        location: 'Tầng 2, Phía cuối hành lang, Khu vực rộng',
        capacity: 6
    },
    {
        id: 'area-7',
        name: 'Khu Outdoor Garden',
        image: 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=800&auto=format&fit=crop',
        description: 'Khu vườn ngoài trời xanh mát với sân cỏ tự nhiên và cây xanh. Là nơi lý tưởng cho thú cưng vui chơi và khách hàng thư giãn trong không khí trong lành.',
        location: 'Tầng 1, Sân ngoài trời, Khu vực có mái che',
        capacity: 20
    }
];

const AreasPage = () => {
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [deleteAreaId, setDeleteAreaId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

    // Simulate loading initial data
    useEffect(() => {
        const loadAreas = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            setAreas(INITIAL_AREAS);
            setLoading(false);
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

    // Statistics - chỉ tổng số và tổng sức chứa
    const stats = useMemo(() => {
        const total = areas.length;
        const totalCapacity = areas.reduce((sum, a) => sum + a.capacity, 0);
        return { total, totalCapacity };
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

    const handleSaveArea = () => {
        if (!formData.name || !formData.capacity || !formData.description || !formData.location) {
            setSnackbar({
                open: true,
                message: 'Vui lòng điền đầy đủ 5 thông tin: Tên, Hình ảnh, Mô tả, Vị trí, Sức chứa!',
                severity: 'error'
            });
            return;
        }

        if (editingArea) {
            // Update
            setAreas(prev => prev.map(area =>
                area.id === editingArea.id
                    ? {
                        ...area,
                        name: formData.name,
                        image: formData.image,
                        description: formData.description,
                        location: formData.location,
                        capacity: parseInt(formData.capacity)
                    }
                    : area
            ));
            setSnackbar({
                open: true,
                message: 'Cập nhật khu vực thành công!',
                severity: 'success'
            });
        } else {
            // Add new
            const newArea = {
                id: `area-${Date.now()}`,
                name: formData.name,
                image: formData.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
                description: formData.description,
                location: formData.location,
                capacity: parseInt(formData.capacity)
            };
            setAreas(prev => [...prev, newArea]);
            setSnackbar({
                open: true,
                message: 'Thêm khu vực mới thành công!',
                severity: 'success'
            });
        }
        handleCloseDialog();
    };

    const handleDeleteArea = (areaId) => {
        setDeleteAreaId(areaId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = () => {
        setAreas(prev => prev.filter(area => area.id !== deleteAreaId));
        setSnackbar({
            open: true,
            message: 'Xóa khu vực thành công!',
            severity: 'success'
        });
        setOpenDeleteDialog(false);
        setDeleteAreaId(null);
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
                {/* Header - Style giống StaffPage */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 900,
                            color: COLORS.ERROR[600]
                        }}
                    >
                        Quản lý Khu vực
                    </Typography>
                    <Chip
                        label={`Tổng: ${stats.total}`}
                        size="small"
                        sx={{
                            background: alpha(COLORS.SECONDARY[100], 0.7),
                            color: COLORS.SECONDARY[800],
                            fontWeight: 700
                        }}
                    />
                    <Chip
                        label={`Sức chứa: ${stats.totalCapacity}`}
                        size="small"
                        sx={{
                            background: alpha(COLORS.INFO[100], 0.7),
                            color: COLORS.INFO[800],
                            fontWeight: 700
                        }}
                    />
                </Stack>

                {/* Toolbar - giống StaffPage */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2, flexWrap: 'wrap' }}
                >
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
                </Stack>

                {/* Search Bar */}
                <TextField
                    placeholder="Tìm kiếm theo tên, mô tả, vị trí..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                    }}
                />

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
                                    Hành động
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
                                            color="primary"
                                            onClick={() => handleOpenDialog(area)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteArea(area.id)}
                                        >
                                            <Delete fontSize="small" />
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

            {/* Delete Confirmation Dialog - Style giống StaffPage */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Xóa khu vực</DialogTitle>
                <DialogContent>Bạn có chắc muốn xóa khu vực này?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AreasPage;


