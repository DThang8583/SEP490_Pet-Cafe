import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Alert, Chip, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, alpha, Grid, Toolbar, Divider, Tooltip, Accordion, AccordionSummary, AccordionDetails, Collapse } from '@mui/material';
import { Add, Edit, Delete, MiscellaneousServices, Search, Spa, FitnessCenter, Home, LocalCafe, Schedule, Close, EventAvailable, AccessTime, AttachMoney, ExpandMore, People, Pets, LocationOn, Group } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import serviceApi, { SERVICE_TYPES } from '../../api/serviceApi';
import slotApi from '../../api/slotApi';
import { getAllTasks } from '../../api/tasksApi';
import { AREAS_DATA } from '../../api/areasApi';

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

    // Slot management states
    const [openSlotDialog, setOpenSlotDialog] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [openSlotFormDialog, setOpenSlotFormDialog] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [slotFormData, setSlotFormData] = useState({
        area_id: '',
        team_id: '',
        pet_group_id: '',
        applicable_days: ['', ''],
        start_time: '',
        end_time: '',
        max_capacity: '',
        price: '',
        special_notes: ''
    });

    // Task assignment states
    const [slotTasks, setSlotTasks] = useState({});
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [expandedSlots, setExpandedSlots] = useState({});

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
        thumbnails: '',
        startDate: '',
        endDate: ''
    });

    // Load services from API and their slots
    useEffect(() => {
        const loadServicesWithSlots = async () => {
            try {
                setLoading(true);
                const response = await serviceApi.getAllServices();
                if (response.success) {
                    // Load slots for each service to get time range and capacity
                    const servicesWithSlotInfo = await Promise.all(
                        response.data.map(async (service) => {
                            try {
                                const slotsResponse = await slotApi.getSlotsByService(service.id);
                                if (slotsResponse.success && slotsResponse.data.length > 0) {
                                    const slots = slotsResponse.data;

                                    // Calculate date range from all slots' applicable_days
                                    const allDates = slots.flatMap(slot => slot.applicable_days);
                                    const startDate = allDates.reduce((min, date) => date < min ? date : min, allDates[0]);
                                    const endDate = allDates.reduce((max, date) => date > max ? date : max, allDates[0]);

                                    return {
                                        ...service,
                                        start_date: startDate,
                                        end_date: endDate,
                                        totalSlots: slots.length
                                    };
                                }
                                return service;
                            } catch (error) {
                                console.error(`Error loading slots for service ${service.id}:`, error);
                                return service;
                            }
                        })
                    );
                    setServices(servicesWithSlotInfo);
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
        loadServicesWithSlots();
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
            const startDate = service.startDate || service.start_date || '';
            const endDate = service.endDate || service.end_date || '';

            setFormData({
                name: service.name,
                description: service.description,
                durationMinutes: durationMinutes,
                basePrice: basePrice,
                serviceType: serviceType,
                requiresArea: requiresArea,
                image: imageUrl,
                thumbnails: service.thumbnails ? service.thumbnails.join(', ') : '',
                startDate: startDate,
                endDate: endDate
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
                thumbnails: '',
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

    const handleSaveService = async () => {
        if (!formData.name || !formData.description || !formData.durationMinutes ||
            !formData.basePrice || !formData.serviceType || !formData.startDate ||
            !formData.endDate) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
                type: 'error'
            });
            return;
        }

        // Validate start date < end date
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc!',
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
                    thumbnails: thumbnailsArray,
                    start_date: formData.startDate,
                    startDate: formData.startDate,
                    end_date: formData.endDate,
                    endDate: formData.endDate
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
                    thumbnails: thumbnailsArray,
                    start_date: formData.startDate,
                    startDate: formData.startDate,
                    end_date: formData.endDate,
                    endDate: formData.endDate
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

    // ============ SLOT MANAGEMENT FUNCTIONS ============

    const handleOpenSlotDialog = async (service) => {
        setSelectedService(service);
        setOpenSlotDialog(true);
        await loadSlots(service.id);
    };

    const handleCloseSlotDialog = () => {
        setOpenSlotDialog(false);
        setSelectedService(null);
        setSlots([]);
    };

    const loadSlots = async (serviceId) => {
        try {
            setLoadingSlots(true);
            const response = await slotApi.getSlotsByService(serviceId);
            if (response.success) {
                setSlots(response.data);
                // Load task assignments for each slot
                await loadTasksForSlots(response.data);
            }
        } catch (error) {
            console.error('Error loading slots:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách slots',
                type: 'error'
            });
        } finally {
            setLoadingSlots(false);
        }
    };

    const loadTasksForSlots = async (slotsData) => {
        try {
            setLoadingTasks(true);
            const tasksResponse = await getAllTasks();

            if (tasksResponse.success) {
                const tasksBySlot = {};

                slotsData.forEach(slot => {
                    // Find tasks that are assigned to this slot
                    const slotTasks = tasksResponse.data.filter(task =>
                        task.type === 'service' &&
                        task.shifts &&
                        task.shifts.includes(slot.id)
                    );

                    tasksBySlot[slot.id] = slotTasks;
                });

                setSlotTasks(tasksBySlot);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const toggleSlotExpanded = (slotId) => {
        setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
    };

    const handleOpenSlotForm = (slot = null) => {
        if (slot) {
            setEditingSlot(slot);
            setSlotFormData({
                area_id: slot.area_id,
                team_id: slot.team_id,
                pet_group_id: slot.pet_group_id,
                applicable_days: slot.applicable_days,
                start_time: slot.start_time,
                end_time: slot.end_time,
                max_capacity: slot.max_capacity,
                price: slot.price,
                special_notes: slot.special_notes || ''
            });
        } else {
            setEditingSlot(null);
            setSlotFormData({
                area_id: '',
                team_id: '',
                pet_group_id: '',
                applicable_days: ['', ''],
                start_time: '',
                end_time: '',
                max_capacity: '',
                price: '',
                special_notes: ''
            });
        }
        setOpenSlotFormDialog(true);
    };

    const handleCloseSlotForm = () => {
        setOpenSlotFormDialog(false);
        setEditingSlot(null);
    };

    const handleSaveSlot = async () => {
        try {
            // Validate area_id first
            const selectedArea = AREAS_DATA.find(a => a.id === slotFormData.area_id);
            if (!selectedArea) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: 'Vui lòng chọn khu vực',
                    type: 'error'
                });
                return;
            }

            // Validate max_capacity against area capacity
            const maxCapacity = parseInt(slotFormData.max_capacity);
            if (maxCapacity > selectedArea.capacity) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: `Sức chứa slot (${maxCapacity}) vượt quá sức chứa khu vực "${selectedArea.name}" (${selectedArea.capacity})`,
                    type: 'error'
                });
                return;
            }

            const slotData = {
                service_id: selectedService.id,
                area_id: slotFormData.area_id,
                team_id: slotFormData.team_id,
                pet_group_id: slotFormData.pet_group_id,
                applicable_days: slotFormData.applicable_days,
                start_time: slotFormData.start_time,
                end_time: slotFormData.end_time,
                max_capacity: maxCapacity,
                price: parseInt(slotFormData.price),
                special_notes: slotFormData.special_notes
            };

            let response;
            if (editingSlot) {
                response = await slotApi.updateSlot(editingSlot.id, slotData);
            } else {
                response = await slotApi.createSlot(slotData);
            }

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editingSlot ? 'Cập nhật slot thành công!' : 'Tạo slot thành công!',
                    type: 'success'
                });
                await loadSlots(selectedService.id);
                handleCloseSlotForm();
            }
        } catch (error) {
            console.error('Error saving slot:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu slot',
                type: 'error'
            });
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (window.confirm('Bạn có chắc muốn xóa slot này?')) {
            try {
                const response = await slotApi.deleteSlot(slotId);
                if (response.success) {
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Xóa slot thành công!',
                        type: 'success'
                    });
                    await loadSlots(selectedService.id);
                }
            } catch (error) {
                console.error('Error deleting slot:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể xóa slot',
                    type: 'error'
                });
            }
        }
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
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Thời gian diễn ra</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Slots</TableCell>
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
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {(service.startDate || service.start_date) && (service.endDate || service.end_date) ? (
                                            <Chip
                                                size="small"
                                                label={`${new Date(service.startDate || service.start_date).toLocaleDateString('vi-VN')} - ${new Date(service.endDate || service.end_date).toLocaleDateString('vi-VN')}`}
                                                sx={{
                                                    background: alpha(COLORS.PRIMARY[100], 0.7),
                                                    color: COLORS.PRIMARY[800],
                                                    fontWeight: 600
                                                }}
                                            />
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        {service.totalSlots ? (
                                            <Chip
                                                size="small"
                                                icon={<Schedule fontSize="small" />}
                                                label={`${service.totalSlots} slots`}
                                                sx={{
                                                    background: alpha(COLORS.SUCCESS[100], 0.7),
                                                    color: COLORS.SUCCESS[800],
                                                    fontWeight: 600
                                                }}
                                            />
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                        {formatPrice(service.basePrice || service.base_price || service.price || 0)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Quản lý slots">
                                            <IconButton
                                                size="small"
                                                sx={{ color: COLORS.WARNING[600] }}
                                                onClick={() => handleOpenSlotDialog(service)}
                                            >
                                                <Schedule fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
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
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Huấn luyện cơ bản"
                        />
                        <TextField
                            label="Mô tả"
                            fullWidth
                            required
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
                                required
                                type="number"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                placeholder="60"
                                inputProps={{ min: 1 }}
                            />
                            <TextField
                                label="Giá cơ bản (VNĐ)"
                                fullWidth
                                required
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                placeholder="300000"
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required>
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
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Ngày bắt đầu"
                                fullWidth
                                required
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                helperText="Ngày dịch vụ bắt đầu diễn ra (bắt buộc)"
                            />
                            <TextField
                                label="Ngày kết thúc"
                                fullWidth
                                required
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                helperText="Ngày dịch vụ kết thúc diễn ra (bắt buộc)"
                            />
                        </Stack>
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

            {/* Slot Management Dialog */}
            <Dialog open={openSlotDialog} onClose={handleCloseSlotDialog} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ bgcolor: COLORS.WARNING[500], color: 'white', pb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Schedule sx={{ fontSize: 32 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Quản lý Slots - {selectedService?.name}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Tạo và quản lý các ca dịch vụ (slots) cho dịch vụ này
                            </Typography>
                        </Box>
                        <IconButton onClick={handleCloseSlotDialog} sx={{ color: 'white' }}>
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {loadingSlots ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography>Đang tải slots...</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Danh sách Slots ({slots.length})
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => handleOpenSlotForm()}
                                    sx={{
                                        bgcolor: COLORS.WARNING[500],
                                        '&:hover': { bgcolor: COLORS.WARNING[600] }
                                    }}
                                >
                                    Thêm Slot
                                </Button>
                            </Box>

                            {slots.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <EventAvailable sx={{ fontSize: 60, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Chưa có slot nào cho dịch vụ này
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 1 }}>
                                        Nhấn "Thêm Slot" để tạo ca dịch vụ mới
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${alpha(COLORS.PRIMARY[500], 0.1)}` }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(COLORS.WARNING[500], 0.1) }}>
                                                <TableCell sx={{ fontWeight: 800 }}>Thời gian áp dụng</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Các ca dịch vụ</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Giá slot</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Ghi chú</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {slots.map((slot) => {
                                                const tasks = slotTasks[slot.id] || [];
                                                const isExpanded = expandedSlots[slot.id];

                                                return (
                                                    <React.Fragment key={slot.id}>
                                                        <TableRow hover sx={{ bgcolor: isExpanded ? alpha(COLORS.WARNING[50], 0.3) : 'transparent' }}>
                                                            <TableCell>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <EventAvailable fontSize="small" sx={{ color: COLORS.INFO[500] }} />
                                                                    <Typography variant="body2">
                                                                        {slot.applicable_days[0]} → {slot.applicable_days[1]}
                                                                    </Typography>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <AccessTime fontSize="small" sx={{ color: COLORS.WARNING[500] }} />
                                                                    <Typography variant="body2">
                                                                        {slot.start_time} - {slot.end_time}
                                                                    </Typography>
                                                                    {tasks.length > 0 && (
                                                                        <Chip
                                                                            size="small"
                                                                            label={`${tasks.length} task`}
                                                                            sx={{
                                                                                bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                                color: COLORS.PRIMARY[700],
                                                                                fontWeight: 600,
                                                                                ml: 1,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            onClick={() => toggleSlotExpanded(slot.id)}
                                                                            icon={<ExpandMore sx={{
                                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                                transition: 'transform 0.3s'
                                                                            }} />}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                                                {formatPrice(slot.price)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {slot.special_notes || '—'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleOpenSlotForm(slot)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>

                                                        {/* Task Details Row */}
                                                        {tasks.length > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                                                                    <Collapse in={isExpanded} timeout="auto">
                                                                        <Box sx={{ p: 3, bgcolor: alpha(COLORS.WARNING[50], 0.2) }}>
                                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.WARNING[800] }}>
                                                                                📋 Phân công nhiệm vụ ({tasks.length})
                                                                            </Typography>

                                                                            <Stack spacing={2}>
                                                                                {tasks.map((task) => (
                                                                                    <Paper key={task.id} sx={{ p: 2, border: `1px solid ${alpha(COLORS.PRIMARY[200], 0.5)}` }}>
                                                                                        <Stack spacing={2}>
                                                                                            {/* Task Header */}
                                                                                            <Stack direction="row" spacing={2} alignItems="center">
                                                                                                <Schedule sx={{ color: COLORS.PRIMARY[500] }} />
                                                                                                <Box sx={{ flex: 1 }}>
                                                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                                                                                        {task.name}
                                                                                                    </Typography>
                                                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                                                        {task.description}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                                <Chip
                                                                                                    size="small"
                                                                                                    label={task.status}
                                                                                                    sx={{
                                                                                                        bgcolor: task.status === 'completed' ? COLORS.SUCCESS[100] : COLORS.WARNING[100],
                                                                                                        color: task.status === 'completed' ? COLORS.SUCCESS[700] : COLORS.WARNING[700]
                                                                                                    }}
                                                                                                />
                                                                                            </Stack>

                                                                                            {/* Task Assignments */}
                                                                                            {task.shiftAssignments && task.shiftAssignments[slot.id] && (
                                                                                                <Grid container spacing={2}>
                                                                                                    {/* Areas */}
                                                                                                    <Grid item xs={12} md={4}>
                                                                                                        <Box sx={{ p: 1.5, bgcolor: alpha(COLORS.INFO[50], 0.5), borderRadius: 1 }}>
                                                                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                                                                <LocationOn fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                                                                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.INFO[700] }}>
                                                                                                                    Khu vực
                                                                                                                </Typography>
                                                                                                            </Stack>
                                                                                                            {task.shiftAssignments[slot.id].areaIds?.map(areaId => {
                                                                                                                const area = AREAS_DATA.find(a => a.id === areaId);
                                                                                                                return area ? (
                                                                                                                    <Chip
                                                                                                                        key={areaId}
                                                                                                                        size="small"
                                                                                                                        label={`${area.name} (${area.capacity})`}
                                                                                                                        sx={{ m: 0.5, bgcolor: 'white' }}
                                                                                                                    />
                                                                                                                ) : null;
                                                                                                            })}
                                                                                                        </Box>
                                                                                                    </Grid>

                                                                                                    {/* Pet Groups */}
                                                                                                    <Grid item xs={12} md={4}>
                                                                                                        <Box sx={{ p: 1.5, bgcolor: alpha(COLORS.WARNING[50], 0.5), borderRadius: 1 }}>
                                                                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                                                                <Pets fontSize="small" sx={{ color: COLORS.WARNING[600] }} />
                                                                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                                                                                                    Nhóm Pet
                                                                                                                </Typography>
                                                                                                            </Stack>
                                                                                                            {task.shiftAssignments[slot.id].petGroups?.map((pg, idx) => (
                                                                                                                <Chip
                                                                                                                    key={idx}
                                                                                                                    size="small"
                                                                                                                    label={`${pg.groupName} (${pg.count})`}
                                                                                                                    sx={{ m: 0.5, bgcolor: 'white' }}
                                                                                                                />
                                                                                                            ))}
                                                                                                        </Box>
                                                                                                    </Grid>

                                                                                                    {/* Staff Groups */}
                                                                                                    <Grid item xs={12} md={4}>
                                                                                                        <Box sx={{ p: 1.5, bgcolor: alpha(COLORS.SUCCESS[50], 0.5), borderRadius: 1 }}>
                                                                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                                                                <People fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                                                                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                                                                                                    Nhóm nhân viên
                                                                                                                </Typography>
                                                                                                            </Stack>
                                                                                                            {task.shiftAssignments[slot.id].staffGroups?.map((sg, idx) => (
                                                                                                                <Chip
                                                                                                                    key={idx}
                                                                                                                    size="small"
                                                                                                                    label={`${sg.name} (${sg.staffIds?.length || 0})`}
                                                                                                                    sx={{ m: 0.5, bgcolor: 'white' }}
                                                                                                                />
                                                                                                            ))}
                                                                                                        </Box>
                                                                                                    </Grid>
                                                                                                </Grid>
                                                                                            )}
                                                                                        </Stack>
                                                                                    </Paper>
                                                                                ))}
                                                                            </Stack>
                                                                        </Box>
                                                                    </Collapse>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.WARNING[500], 0.02) }}>
                    <Button onClick={handleCloseSlotDialog} variant="outlined">Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Slot Form Dialog */}
            <Dialog open={openSlotFormDialog} onClose={handleCloseSlotForm} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: COLORS.WARNING[500], color: 'white' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Schedule />
                        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                            {editingSlot ? 'Sửa Slot' : 'Thêm Slot Mới'}
                        </Typography>
                        <IconButton onClick={handleCloseSlotForm} sx={{ color: 'white' }}>
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Lưu ý:</strong> Giá slot là giá THỰC TẾ khách hàng phải trả (có thể khác với base_price của service)
                            </Typography>
                            <Typography variant="body2">
                                <strong>⚠️ Quan trọng:</strong> Sức chứa của slot phải ≤ sức chứa của khu vực đã chọn
                            </Typography>
                        </Alert>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required>
                                <InputLabel>Khu vực</InputLabel>
                                <Select
                                    value={slotFormData.area_id}
                                    onChange={(e) => setSlotFormData({ ...slotFormData, area_id: e.target.value })}
                                    label="Khu vực"
                                >
                                    {AREAS_DATA.map((area) => (
                                        <MenuItem key={area.id} value={area.id}>
                                            {area.name} (Sức chứa: {area.capacity})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Team ID"
                                fullWidth
                                required
                                value={slotFormData.team_id}
                                onChange={(e) => setSlotFormData({ ...slotFormData, team_id: e.target.value })}
                                placeholder="team-001"
                            />
                            <TextField
                                label="Pet Group ID"
                                fullWidth
                                required
                                value={slotFormData.pet_group_id}
                                onChange={(e) => setSlotFormData({ ...slotFormData, pet_group_id: e.target.value })}
                                placeholder="group-001"
                            />
                        </Stack>

                        <Divider>
                            <Chip label="Thời gian áp dụng" size="small" />
                        </Divider>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Ngày bắt đầu"
                                fullWidth
                                required
                                type="date"
                                value={slotFormData.applicable_days[0]}
                                onChange={(e) => setSlotFormData({
                                    ...slotFormData,
                                    applicable_days: [e.target.value, slotFormData.applicable_days[1]]
                                })}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Ngày kết thúc"
                                fullWidth
                                required
                                type="date"
                                value={slotFormData.applicable_days[1]}
                                onChange={(e) => setSlotFormData({
                                    ...slotFormData,
                                    applicable_days: [slotFormData.applicable_days[0], e.target.value]
                                })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Stack>

                        <Divider>
                            <Chip label="Ca làm việc" size="small" />
                        </Divider>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Giờ bắt đầu"
                                fullWidth
                                required
                                type="time"
                                value={slotFormData.start_time}
                                onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                helperText="Giờ bắt đầu ca dịch vụ"
                            />
                            <TextField
                                label="Giờ kết thúc"
                                fullWidth
                                required
                                type="time"
                                value={slotFormData.end_time}
                                onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                helperText="Giờ kết thúc ca dịch vụ"
                            />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Sức chứa tối đa"
                                fullWidth
                                required
                                type="number"
                                value={slotFormData.max_capacity}
                                onChange={(e) => setSlotFormData({ ...slotFormData, max_capacity: e.target.value })}
                                placeholder="10"
                                inputProps={{
                                    min: 1,
                                    max: slotFormData.area_id
                                        ? AREAS_DATA.find(a => a.id === slotFormData.area_id)?.capacity || 999
                                        : 999
                                }}
                                error={
                                    slotFormData.area_id &&
                                    slotFormData.max_capacity &&
                                    parseInt(slotFormData.max_capacity) > (AREAS_DATA.find(a => a.id === slotFormData.area_id)?.capacity || 999)
                                }
                                helperText={
                                    slotFormData.area_id
                                        ? `Tối đa: ${AREAS_DATA.find(a => a.id === slotFormData.area_id)?.capacity || '?'} người (theo khu vực)`
                                        : 'Chọn khu vực trước'
                                }
                            />
                            <TextField
                                label="Giá slot (VNĐ)"
                                fullWidth
                                required
                                type="number"
                                value={slotFormData.price}
                                onChange={(e) => setSlotFormData({ ...slotFormData, price: e.target.value })}
                                placeholder="200000"
                                inputProps={{ min: 0 }}
                                helperText="Giá thực tế khách phải trả"
                            />
                        </Stack>

                        <TextField
                            label="Ghi chú đặc biệt"
                            fullWidth
                            multiline
                            rows={2}
                            value={slotFormData.special_notes}
                            onChange={(e) => setSlotFormData({ ...slotFormData, special_notes: e.target.value })}
                            placeholder="VD: Giờ cao điểm, Cần đặt trước..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.WARNING[500], 0.02) }}>
                    <Button onClick={handleCloseSlotForm} variant="outlined">Hủy</Button>
                    <Button
                        onClick={handleSaveSlot}
                        variant="contained"
                        disabled={
                            !slotFormData.area_id ||
                            !slotFormData.max_capacity ||
                            (slotFormData.area_id && slotFormData.max_capacity &&
                                parseInt(slotFormData.max_capacity) > (AREAS_DATA.find(a => a.id === slotFormData.area_id)?.capacity || 999))
                        }
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            '&:hover': { bgcolor: COLORS.WARNING[600] }
                        }}
                    >
                        {editingSlot ? 'Cập nhật' : 'Tạo Slot'}
                    </Button>
                </DialogActions>
            </Dialog>

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


