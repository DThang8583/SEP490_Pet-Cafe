import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Alert, Chip, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, alpha } from '@mui/material';
import { Add, Edit, Delete, MiscellaneousServices, Search } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { AREAS_DATA } from '../../api/areasApi';
import serviceApi, { SERVICE_TYPES } from '../../api/serviceApi';

const ServicesPage = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deleteServiceId, setDeleteServiceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        durationMinutes: '',
        basePrice: '',
        serviceType: '',
        requiresAreaId: '',
        image: '',
        thumbnails: '',
        timeSlots: '',
        startDate: '',
        endDate: ''
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
            const matchSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
            return matchSearch;
        });
    }, [services, searchQuery]);

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
            setFormData({
                name: service.name,
                description: service.description,
                durationMinutes: service.durationMinutes,
                basePrice: service.basePrice,
                serviceType: service.serviceType,
                requiresAreaId: service.requiresAreaId,
                image: service.image || '',
                thumbnails: service.thumbnails ? service.thumbnails.join(', ') : '',
                timeSlots: service.timeSlots ? service.timeSlots.join(', ') : '',
                startDate: service.startDate || '',
                endDate: service.endDate || ''
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                durationMinutes: '',
                basePrice: '',
                serviceType: '',
                requiresAreaId: '',
                image: '',
                thumbnails: '',
                timeSlots: '',
                startDate: '',
                endDate: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingService(null);
    };

    const handleSaveService = () => {
        if (!formData.name || !formData.description || !formData.durationMinutes ||
            !formData.basePrice || !formData.serviceType || !formData.requiresAreaId) {
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

        const timeSlotsArray = formData.timeSlots
            ? formData.timeSlots.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        if (editingService) {
            setServices(prev => prev.map(service =>
                service.id === editingService.id
                    ? {
                        ...service,
                        name: formData.name,
                        description: formData.description,
                        durationMinutes: parseInt(formData.durationMinutes),
                        basePrice: parseInt(formData.basePrice),
                        serviceType: formData.serviceType,
                        requiresAreaId: formData.requiresAreaId,
                        image: formData.image,
                        thumbnails: thumbnailsArray,
                        timeSlots: timeSlotsArray,
                        startDate: formData.startDate,
                        endDate: formData.endDate
                    }
                    : service
            ));
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Cập nhật dịch vụ thành công!',
                type: 'success'
            });
        } else {
            const newService = {
                id: `service-${Date.now()}`,
                name: formData.name,
                description: formData.description,
                durationMinutes: parseInt(formData.durationMinutes),
                basePrice: parseInt(formData.basePrice),
                serviceType: formData.serviceType,
                requiresAreaId: formData.requiresAreaId,
                image: formData.image || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
                thumbnails: thumbnailsArray,
                timeSlots: timeSlotsArray,
                startDate: formData.startDate,
                endDate: formData.endDate
            };
            setServices(prev => [...prev, newService]);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Thêm dịch vụ mới thành công!',
                type: 'success'
            });
        }
        handleCloseDialog();
    };

    const handleDeleteService = (serviceId) => {
        setDeleteServiceId(serviceId);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = () => {
        setServices(prev => prev.filter(service => service.id !== deleteServiceId));
        setAlert({
            open: true,
            title: 'Thành công',
            message: 'Xóa dịch vụ thành công!',
            type: 'success'
        });
        setOpenDeleteDialog(false);
        setDeleteServiceId(null);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getAreaName = (areaId) => {
        const area = AREAS_DATA.find(a => a.id === areaId);
        return area ? area.name : '—';
    };

    const formatDateRange = (startDate, endDate) => {
        if (!startDate || !endDate) return '—';
        return `${startDate} đến ${endDate}`;
    };

    // Generate time slots based on service duration
    const generateTimeSlots = (durationMinutes) => {
        if (!durationMinutes || durationMinutes <= 0) return [];

        const slots = [];
        const startHour = 7; // Quán mở cửa từ 7:00
        const endHour = 20; // Đến 20:00

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += durationMinutes) {
                const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Calculate end time
                const totalMinutes = hour * 60 + minute + durationMinutes;
                const endHourCalc = Math.floor(totalMinutes / 60);
                const endMinuteCalc = totalMinutes % 60;

                // Stop if end time exceeds closing hour
                if (endHourCalc >= endHour) break;

                const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;
                slots.push(`${startTime} - ${endTime}`);
            }
        }

        return slots;
    };

    const availableTimeSlots = useMemo(() => {
        return generateTimeSlots(parseInt(formData.durationMinutes) || 0);
    }, [formData.durationMinutes]);

    const handleTimeSlotToggle = (slot) => {
        const currentSlots = formData.timeSlots ? formData.timeSlots.split(', ') : [];
        const index = currentSlots.indexOf(slot);

        let newSlots;
        if (index > -1) {
            newSlots = currentSlots.filter((_, i) => i !== index);
        } else {
            newSlots = [...currentSlots, slot];
        }

        setFormData({ ...formData, timeSlots: newSlots.join(', ') });
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
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                        Quản lý Dịch vụ
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
                </Stack>

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

                {/* Search Bar */}
                <TextField
                    placeholder="Tìm kiếm theo tên, mô tả, loại dịch vụ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                    }}
                />

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
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Khung giờ</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Thời gian diễn ra</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Giá</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', xl: 'table-cell' } }}>Khu vực</TableCell>
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
                                            label={service.serviceType}
                                            sx={{
                                                background: alpha(COLORS.INFO[100], 0.7),
                                                color: COLORS.INFO[800],
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {service.durationMinutes} phút
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                        {service.timeSlots && service.timeSlots.length > 0 ? (
                                            <Stack spacing={0.5}>
                                                {service.timeSlots.map((slot, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        size="small"
                                                        label={slot}
                                                        sx={{
                                                            background: alpha(COLORS.INFO[100], 0.7),
                                                            color: COLORS.INFO[800],
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.DISABLED }}>
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {service.startDate && service.endDate ? (
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY }}>
                                                {formatDateRange(service.startDate, service.endDate)}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.DISABLED }}>
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                        {formatPrice(service.basePrice)}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                                        {getAreaName(service.requiresAreaId)}
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
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Khu vực yêu cầu</InputLabel>
                                <Select
                                    value={formData.requiresAreaId}
                                    label="Khu vực yêu cầu"
                                    onChange={(e) => setFormData({ ...formData, requiresAreaId: e.target.value })}
                                >
                                    {AREAS_DATA.map(area => (
                                        <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
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
                            label="Thumbnails (URLs phân cách bởi dấu phẩy)"
                            fullWidth
                            value={formData.thumbnails}
                            onChange={(e) => setFormData({ ...formData, thumbnails: e.target.value })}
                            placeholder="https://url1.jpg, https://url2.jpg"
                            helperText="Nhập nhiều URL hình ảnh, phân cách bởi dấu phẩy"
                        />

                        {/* Khung giờ và thời gian */}
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            background: alpha(COLORS.INFO[50], 0.5),
                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.INFO[700] }}>
                                Khung giờ và thời gian diễn ra
                            </Typography>
                            <Stack spacing={2}>
                                {/* Hiển thị các khung giờ có thể chọn dựa trên thời lượng */}
                                {formData.durationMinutes && parseInt(formData.durationMinutes) > 0 ? (
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1, color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Chọn các khung giờ diễn ra (dựa trên thời lượng {formData.durationMinutes} phút):
                                        </Typography>
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                            p: 1,
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                            borderRadius: 1,
                                            bgcolor: COLORS.BACKGROUND.DEFAULT
                                        }}>
                                            {availableTimeSlots.map((slot) => {
                                                const isSelected = formData.timeSlots.split(', ').includes(slot);
                                                return (
                                                    <Chip
                                                        key={slot}
                                                        label={slot}
                                                        onClick={() => handleTimeSlotToggle(slot)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            background: isSelected
                                                                ? alpha(COLORS.INFO[500], 0.9)
                                                                : alpha(COLORS.GRAY[200], 0.5),
                                                            color: isSelected ? COLORS.COMMON.WHITE : COLORS.TEXT.SECONDARY,
                                                            fontWeight: isSelected ? 700 : 500,
                                                            border: isSelected
                                                                ? `2px solid ${COLORS.INFO[600]}`
                                                                : `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                                            '&:hover': {
                                                                background: isSelected
                                                                    ? alpha(COLORS.INFO[600], 0.9)
                                                                    : alpha(COLORS.INFO[100], 0.7),
                                                                transform: 'scale(1.05)'
                                                            },
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: COLORS.TEXT.SECONDARY }}>
                                            Đã chọn: {formData.timeSlots ? formData.timeSlots.split(', ').filter(Boolean).length : 0} khung giờ
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                                        Vui lòng nhập <strong>Thời lượng (phút)</strong> trước để xem các khung giờ có thể chọn
                                    </Alert>
                                )}

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Ngày bắt đầu (không bắt buộc)"
                                        type="date"
                                        fullWidth
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Bỏ trống nếu dịch vụ luôn có"
                                    />
                                    <TextField
                                        label="Ngày kết thúc (không bắt buộc)"
                                        type="date"
                                        fullWidth
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Bỏ trống nếu dịch vụ luôn có"
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCloseDialog}>Hủy</Button>
                    <Button variant="contained" onClick={handleSaveService}>
                        Lưu
                    </Button>
                </Stack>
            </Dialog>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Xóa dịch vụ"
                message="Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác."
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

export default ServicesPage;


