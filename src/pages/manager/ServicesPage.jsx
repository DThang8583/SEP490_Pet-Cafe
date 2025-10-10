import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Alert, Chip, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, alpha, Grid, Toolbar } from '@mui/material';
import { Add, Edit, Delete, MiscellaneousServices, Search, Spa, FitnessCenter, Home, LocalCafe } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import serviceApi, { SERVICE_TYPES } from '../../api/serviceApi';

// Mapping service types to Vietnamese labels
const SERVICE_TYPE_LABELS = {
    'Training': 'Huấn luyện',
    'Spa': 'Spa',
    'Grooming': 'Tắm & Grooming',
    'Entertainment': 'Giải trí',
    'Consultation': 'Tư vấn',
    'Photography': 'Chụp ảnh',
    'Daycare': 'Giữ thú cưng',
    'Cafe_Service': 'Dịch vụ Cafe'
};

const ServicesPage = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deleteServiceId, setDeleteServiceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Filter states
    const [searchDate, setSearchDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        durationMinutes: '',
        basePrice: '',
        serviceType: '',
        requiresArea: false,
        image: '',
        thumbnails: ''
    });

    // Load services from API
    useEffect(() => {
        const loadServices = async () => {
            try {
                setLoading(true);
                const response = await serviceApi.getAllServices();
                if (response.success) {
                    setServices(response.data);
                }
            } catch (error) {
                console.error('Error loading services:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể tải danh sách dịch vụ',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };
        loadServices();
    }, []);

    // Filtered services
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const serviceType = service.serviceType || service.service_type || service.category || '';
            const servicePrice = service.basePrice || service.base_price || service.price || 0;
            const serviceDuration = service.durationMinutes || service.duration_minutes || service.duration || 0;

            // Search query filter
            const matchSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                serviceType.toLowerCase().includes(searchQuery.toLowerCase());

            // Service type filter
            const matchServiceType = selectedServiceTypes.length === 0 ||
                selectedServiceTypes.some(type => serviceType.toLowerCase().includes(type.toLowerCase()));

            // Price filter
            const matchMinPrice = !minPrice || servicePrice >= parseInt(minPrice);
            const matchMaxPrice = !maxPrice || servicePrice <= parseInt(maxPrice);

            // Time filter (duration in minutes)
            const matchStartTime = !startTime || serviceDuration >= parseInt(startTime);
            const matchEndTime = !endTime || serviceDuration <= parseInt(endTime);

            return matchSearch && matchServiceType && matchMinPrice && matchMaxPrice && matchStartTime && matchEndTime;
        });
    }, [services, searchQuery, selectedServiceTypes, minPrice, maxPrice, startTime, endTime]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const currentPageServices = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredServices.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filteredServices]);

    // Statistics
    const stats = useMemo(() => {
        const total = services.length;
        return { total };
    }, [services]);

    const handleOpenDialog = (service = null) => {
        if (service) {
            setEditingService(service);
            // Support both backend and frontend field names
            const durationMinutes = service.durationMinutes || service.duration_minutes || service.duration || '';
            const basePrice = service.basePrice || service.base_price || service.price || '';
            const serviceType = service.serviceType || service.service_type || service.category || '';
            const requiresArea = service.requiresArea !== undefined ? service.requiresArea :
                (service.requires_area !== undefined ? service.requires_area : false);
            const imageUrl = service.image || service.image_url || '';

            setFormData({
                name: service.name,
                description: service.description,
                durationMinutes: durationMinutes,
                basePrice: basePrice,
                serviceType: serviceType,
                requiresArea: requiresArea,
                image: imageUrl,
                thumbnails: service.thumbnails ? service.thumbnails.join(', ') : ''
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                durationMinutes: '',
                basePrice: '',
                serviceType: '',
                requiresArea: false,
                image: '',
                thumbnails: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingService(null);
    };

    const handleSaveService = async () => {
        if (!formData.name || !formData.description || !formData.durationMinutes ||
            !formData.basePrice || !formData.serviceType) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
                type: 'error'
            });
            return;
        }

        const thumbnailsArray = formData.thumbnails
            ? formData.thumbnails.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        try {
            if (editingService) {
                // Update existing service
                const updatedData = {
                    name: formData.name,
                    description: formData.description,
                    // Support both naming conventions
                    duration: parseInt(formData.durationMinutes),
                    duration_minutes: parseInt(formData.durationMinutes),
                    price: parseInt(formData.basePrice),
                    base_price: parseInt(formData.basePrice),
                    category: formData.serviceType,
                    service_type: formData.serviceType,
                    requires_area: Boolean(formData.requiresArea),
                    image: formData.image,
                    image_url: formData.image,
                    thumbnails: thumbnailsArray
                };

                const response = await serviceApi.updateService(editingService.id, updatedData);

                if (response.success) {
                    // Update local state
                    setServices(prev => prev.map(service =>
                        service.id === editingService.id ? response.data : service
                    ));
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Cập nhật dịch vụ thành công!',
                        type: 'success'
                    });
                }
            } else {
                // Create new service
                const newServiceData = {
                    name: formData.name,
                    description: formData.description,
                    // Support both naming conventions
                    duration: parseInt(formData.durationMinutes),
                    duration_minutes: parseInt(formData.durationMinutes),
                    price: parseInt(formData.basePrice),
                    base_price: parseInt(formData.basePrice),
                    category: formData.serviceType,
                    service_type: formData.serviceType,
                    requires_area: Boolean(formData.requiresArea),
                    image: formData.image || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
                    image_url: formData.image || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
                    thumbnails: thumbnailsArray
                };

                const response = await serviceApi.createService(newServiceData);

                if (response.success) {
                    // Add to local state
                    setServices(prev => [...prev, response.data]);
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Thêm dịch vụ mới thành công!',
                        type: 'success'
                    });
                }
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu dịch vụ',
                type: 'error'
            });
        }
    };

    const handleDeleteService = (serviceId) => {
        setDeleteServiceId(serviceId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await serviceApi.deleteService(deleteServiceId);

            if (response.success) {
                // Remove from local state
                setServices(prev => prev.filter(service => service.id !== deleteServiceId));
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa dịch vụ thành công!',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa dịch vụ',
                type: 'error'
            });
        } finally {
            setOpenDeleteDialog(false);
            setDeleteServiceId(null);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };


    if (loading) {
        return <Loading message="Đang tải danh sách dịch vụ..." fullScreen />;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: COLORS.BACKGROUND.NEUTRAL,
            width: '100%'
        }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <MiscellaneousServices sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                        Quản lý Dịch vụ
                    </Typography>
                </Stack>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Tổng dịch vụ */}
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.9)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.ERROR[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                    border: `2px solid ${COLORS.ERROR[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.ERROR[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Tổng dịch vụ
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.ERROR[700], fontWeight: 900, lineHeight: 1 }}>
                                        {stats.total}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.ERROR[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MiscellaneousServices sx={{ fontSize: 32, color: COLORS.ERROR[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Toolbar */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
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
                        Thêm dịch vụ
                    </Button>
                </Stack>

                {/* Search & Filters */}
                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 220 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <InputLabel>Loại dịch vụ</InputLabel>
                        <Select
                            multiple
                            label="Loại dịch vụ"
                            value={selectedServiceTypes}
                            onChange={(e) => setSelectedServiceTypes(e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={SERVICE_TYPE_LABELS[value] || value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {SERVICE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {SERVICE_TYPE_LABELS[type] || type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label="Ngày"
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: { xs: '100%', sm: 160 } }}
                    />
                    <TextField
                        size="small"
                        label="Thời lượng min (phút)"
                        type="number"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        sx={{ minWidth: { xs: '48%', sm: 140 } }}
                    />
                    <TextField
                        size="small"
                        label="Thời lượng max (phút)"
                        type="number"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        sx={{ minWidth: { xs: '48%', sm: 140 } }}
                    />
                    <TextField
                        size="small"
                        label="Giá min (VND)"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        sx={{ minWidth: { xs: '48%', sm: 130 } }}
                    />
                    <TextField
                        size="small"
                        label="Giá max (VND)"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        sx={{ minWidth: { xs: '48%', sm: 130 } }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    {(selectedServiceTypes.length > 0 || minPrice || maxPrice || startTime || endTime || searchDate || searchQuery) && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setSearchQuery('');
                                setSearchDate('');
                                setStartTime('');
                                setEndTime('');
                                setSelectedServiceTypes([]);
                                setMinPrice('');
                                setMaxPrice('');
                            }}
                            sx={{
                                borderColor: COLORS.ERROR[300],
                                color: COLORS.ERROR[600],
                                '&:hover': {
                                    borderColor: COLORS.ERROR[400],
                                    background: alpha(COLORS.ERROR[50], 0.5)
                                }
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
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
                                <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Tên dịch vụ</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>Thời lượng</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Giá</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageServices.map((service) => (
                                <TableRow key={service.id} hover>
                                    <TableCell>
                                        <Box
                                            component="img"
                                            src={service.image}
                                            alt={service.name}
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
                                        {service.name}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 300 }}>
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
                                            {service.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={SERVICE_TYPE_LABELS[service.serviceType || service.service_type || service.category] || service.serviceType || service.service_type || service.category || 'N/A'}
                                            sx={{
                                                background: alpha(COLORS.INFO[100], 0.7),
                                                color: COLORS.INFO[800],
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {service.durationMinutes || service.duration_minutes || service.duration || '—'} phút
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                        {formatPrice(service.basePrice || service.base_price || service.price || 0)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(service)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteService(service.id)}
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
                {filteredServices.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={filteredServices.length}
                    />
                )}

                {/* Empty State */}
                {filteredServices.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <MiscellaneousServices sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                            Không tìm thấy dịch vụ nào
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thử thay đổi tìm kiếm hoặc thêm dịch vụ mới
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <Box sx={{ px: 3, pt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                        {editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
                    </Typography>
                </Box>
                <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên dịch vụ"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Huấn luyện cơ bản"
                        />
                        <TextField
                            label="Mô tả"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả chi tiết về dịch vụ..."
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Thời lượng (phút)"
                                fullWidth
                                type="number"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                placeholder="60"
                            />
                            <TextField
                                label="Giá cơ bản (VNĐ)"
                                fullWidth
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                placeholder="300000"
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Loại dịch vụ</InputLabel>
                                <Select
                                    value={formData.serviceType}
                                    label="Loại dịch vụ"
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                >
                                    {SERVICE_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>{SERVICE_TYPE_LABELS[type] || type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Yêu cầu khu vực</InputLabel>
                                <Select
                                    value={formData.requiresArea}
                                    label="Yêu cầu khu vực"
                                    onChange={(e) => setFormData({ ...formData, requiresArea: e.target.value })}
                                >
                                    <MenuItem value={true}>Có</MenuItem>
                                    <MenuItem value={false}>Không</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                        <TextField
                            label="URL Ảnh"
                            fullWidth
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                        />
                    </Stack>
                </Box>
                <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleCloseDialog} variant="outlined" sx={{
                        borderColor: COLORS.ERROR[300],
                        color: COLORS.ERROR[600],
                        '&:hover': {
                            borderColor: COLORS.ERROR[400],
                            background: alpha(COLORS.ERROR[50], 0.5)
                        }
                    }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveService}
                        sx={{
                            backgroundColor: COLORS.ERROR[500],
                            '&:hover': { backgroundColor: COLORS.ERROR[600] }
                        }}
                    >
                        {editingService ? 'Cập nhật' : 'Thêm'}
                    </Button>
                </Box>
            </Dialog>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa dịch vụ này không?"
            />

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default ServicesPage;


