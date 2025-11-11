import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, Grid, FormControl, InputLabel, Select, MenuItem, Switch, Tooltip, Tabs, Tab, Menu, ListItemIcon, ListItemText, Avatar, OutlinedInput } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Schedule as ScheduleIcon, Check as CheckIcon, Close as CloseIcon, MiscellaneousServices as ServicesIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AlertModal from '../../components/modals/AlertModal';
import ServiceFormModal from '../../components/modals/ServiceFormModal';
import SlotDetailsModal from '../../components/modals/SlotDetailsModal';
import SlotFormModal from '../../components/modals/SlotFormModal';
import taskTemplateApi from '../../api/taskTemplateApi';
import serviceApi from '../../api/serviceApi';
import slotApi from '../../api/slotApi';
import * as areasApi from '../../api/areasApi';
import petSpeciesApi from '../../api/petSpeciesApi';
import petBreedsApi from '../../api/petBreedsApi';
import petGroupsApi from '../../api/petGroupsApi';
// Team list now fetched from official API via teamApi.getTeams()
import { formatPrice } from '../../utils/formatPrice';

const ServicesPage = () => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Loading states
    const [loading, setLoading] = useState(true);

    // Data
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [services, setServices] = useState([]);
    const [slots, setSlots] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [petGroups, setPetGroups] = useState([]);
    const [petBreeds, setPetBreeds] = useState([]);
    const [petSpecies, setPetSpecies] = useState([]);
    const [teams, setTeams] = useState([]);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterServiceStatus, setFilterServiceStatus] = useState('all');
    const [filterTaskId, setFilterTaskId] = useState('all');
    const [filterStartTime, setFilterStartTime] = useState('');
    const [filterEndTime, setFilterEndTime] = useState('');
    const [filterSpeciesIds, setFilterSpeciesIds] = useState([]);
    const [filterBreedIds, setFilterBreedIds] = useState([]);
    const [filterAreaIds, setFilterAreaIds] = useState([]);
    const [filterMinPrice, setFilterMinPrice] = useState(''); // numeric value or ''
    const [filterMaxPrice, setFilterMaxPrice] = useState(''); // numeric value or ''
    const [filterMinPriceText, setFilterMinPriceText] = useState(''); // formatted display
    const [filterMaxPriceText, setFilterMaxPriceText] = useState(''); // formatted display

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [serviceFormOpen, setServiceFormOpen] = useState(false);
    const [slotDetailsOpen, setSlotDetailsOpen] = useState(false);
    const [slotFormOpen, setSlotFormOpen] = useState(false);
    const [slotFormMode, setSlotFormMode] = useState('create');
    const [editingSlot, setEditingSlot] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
    const [confirmEnableOpen, setConfirmEnableOpen] = useState(false);
    const [disableTarget, setDisableTarget] = useState(null);
    const [enableTarget, setEnableTarget] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Modal data
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    // Menu state
    const [serviceMenuAnchor, setServiceMenuAnchor] = useState(null);
    const [menuService, setMenuService] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const servicedTaskIds = services.map(s => s.task_id).filter(Boolean);
        const publicTasks = taskTemplates.filter(t => t.is_public === true);
        const availablePublicTasks = publicTasks.filter(t => !servicedTaskIds.includes(t.id));

        return {
            totalTasks: publicTasks.length,
            availableTasks: availablePublicTasks.length,
            totalServices: services.length,
            activeServices: services.filter(s => s.is_active === true).length,
            inactiveServices: services.filter(s => s.is_active === false).length
        };
    }, [taskTemplates, services]);

    // Calculate available tasks (tasks with is_public = true and no service yet)
    const availableTasks = useMemo(() => {
        const servicedTaskIds = services.map(s => s.task_id).filter(Boolean);
        return taskTemplates.filter(t => {
            // Check if task already has service
            if (servicedTaskIds.includes(t.id)) return false;

            // Check if task is public (Công khai)
            return t.is_public === true;
        });
    }, [taskTemplates, services]);

    // Filter available tasks
    const filteredAvailableTasks = useMemo(() => {
        return availableTasks.filter(task => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = (task.title || task.name).toLowerCase().includes(searchLower) ||
                    task.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            return true;
        });
    }, [availableTasks, searchQuery]);

    // Filter services
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchSearch = service.name.toLowerCase().includes(searchLower) ||
                    service.description.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }

            // Status filter
            if (filterServiceStatus === 'active') {
                return service.is_active === true;
            } else if (filterServiceStatus === 'inactive') {
                return service.is_active === false;
            }

            // Task filter (client-side safeguard)
            if (filterTaskId !== 'all' && service.task_id !== filterTaskId) {
                return false;
            }

            // Price range filter (client-side safeguard)
            if (filterMinPrice !== '' && Number(service.base_price) < filterMinPrice) {
                return false;
            }
            if (filterMaxPrice !== '' && Number(service.base_price) > filterMaxPrice) {
                return false;
            }

            // Slot-related client-side filters (time/species/breed/area)
            const needSlotFilters =
                (filterStartTime && filterStartTime.length > 0) ||
                (filterEndTime && filterEndTime.length > 0) ||
                (filterSpeciesIds && filterSpeciesIds.length > 0) ||
                (filterBreedIds && filterBreedIds.length > 0) ||
                (filterAreaIds && filterAreaIds.length > 0);

            if (needSlotFilters) {
                const norm = (t) => (t && t.length === 5 ? `${t}:00` : t);
                const startT = norm(filterStartTime);
                const endT = norm(filterEndTime);

                const slots = service.slots || [];
                if (slots.length === 0) return false;

                const slotOk = slots.some(slot => {
                    if (startT && slot.start_time < startT) return false;
                    if (endT && slot.end_time > endT) return false;
                    if (filterAreaIds && filterAreaIds.length && !filterAreaIds.includes(slot.area_id)) return false;
                    if (filterSpeciesIds && filterSpeciesIds.length) {
                        const speciesId = slot.pet_group?.pet_species_id || slot.pet_group?.pet_species?.id;
                        if (!speciesId || !filterSpeciesIds.includes(speciesId)) return false;
                    }
                    if (filterBreedIds && filterBreedIds.length) {
                        const breedId = slot.pet_group?.pet_breed_id || slot.pet_group?.pet_breed?.id;
                        if (!breedId || !filterBreedIds.includes(breedId)) return false;
                    }
                    return true;
                });

                if (!slotOk) return false;
            }

            return true;
        });
    }, [services, searchQuery, filterServiceStatus, filterTaskId, filterMinPrice, filterMaxPrice, filterStartTime, filterEndTime, filterSpeciesIds, filterBreedIds, filterAreaIds]);

    // Pagination
    const currentPageItems = useMemo(() => {
        const items = currentTab === 0 ? filteredServices : filteredAvailableTasks;
        const startIndex = (page - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [currentTab, filteredAvailableTasks, filteredServices, page, itemsPerPage]);

    const totalPages = useMemo(() => {
        const items = currentTab === 0 ? filteredServices : filteredAvailableTasks;
        return Math.ceil(items.length / itemsPerPage);
    }, [currentTab, filteredAvailableTasks, filteredServices, itemsPerPage]);

    // Load all data
    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadTaskTemplates(),
                loadServices(),
                loadSlots(),
                loadWorkTypes(),
                loadAreas(),
                loadPetSpeciesAndBreeds(),
                loadPetGroups(),
                loadTeams()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadTaskTemplates = async () => {
        try {
            const response = await taskTemplateApi.getAllTaskTemplates();
            setTaskTemplates(response.data || []);
        } catch (error) {
            console.error('Error loading task templates:', error);
            setTaskTemplates([]);
        }
    };

    const loadServices = async () => {
        try {
            const response = await serviceApi.getAllServices({
                search: searchQuery,
                is_active: filterServiceStatus === 'active' ? true : filterServiceStatus === 'inactive' ? false : null,
                task_id: filterTaskId !== 'all' ? filterTaskId : null,
                start_time: filterStartTime || null,
                end_time: filterEndTime || null,
                pet_species_ids: filterSpeciesIds,
                pet_breed_ids: filterBreedIds,
                area_ids: filterAreaIds,
                min_price: filterMinPrice === '' ? null : filterMinPrice,
                max_price: filterMaxPrice === '' ? null : filterMaxPrice
            });
            setServices(response.data || []);
        } catch (error) {
            console.error('Error loading services:', error);
            setServices([]);
        }
    };

    // Auto-refresh services when filters change (debounced)
    useEffect(() => {
        const id = setTimeout(() => {
            loadServices();
        }, 250);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchQuery,
        filterServiceStatus,
        filterTaskId,
        filterStartTime,
        filterEndTime,
        filterSpeciesIds,
        filterBreedIds,
        filterAreaIds,
        filterMinPrice,
        filterMaxPrice
    ]);

    // Format helpers for price inputs
    const formatNumberVi = (value) => new Intl.NumberFormat('vi-VN').format(value);

    // Min price handlers
    const handleMinPriceInputChange = (e) => {
        const raw = e.target.value || '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0) {
            setFilterMinPrice('');
            setFilterMinPriceText('');
        } else {
            const num = parseInt(digits, 10);
            setFilterMinPrice(num);
            setFilterMinPriceText(digits); // keep unformatted while typing
        }
        loadServices();
    };
    const handleMinPriceBlur = () => {
        if (filterMinPrice === '') {
            setFilterMinPriceText('');
        } else {
            setFilterMinPriceText(formatNumberVi(filterMinPrice));
        }
    };
    const handleMinPriceFocus = () => {
        if (filterMinPrice === '') {
            setFilterMinPriceText('');
        } else {
            setFilterMinPriceText(String(filterMinPrice));
        }
    };

    // Max price handlers
    const handleMaxPriceInputChange = (e) => {
        const raw = e.target.value || '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0) {
            setFilterMaxPrice('');
            setFilterMaxPriceText('');
        } else {
            const num = parseInt(digits, 10);
            setFilterMaxPrice(num);
            setFilterMaxPriceText(digits); // keep unformatted while typing
        }
        loadServices();
    };
    const handleMaxPriceBlur = () => {
        if (filterMaxPrice === '') {
            setFilterMaxPriceText('');
        } else {
            setFilterMaxPriceText(formatNumberVi(filterMaxPrice));
        }
    };
    const handleMaxPriceFocus = () => {
        if (filterMaxPrice === '') {
            setFilterMaxPriceText('');
        } else {
            setFilterMaxPriceText(String(filterMaxPrice));
        }
    };

    const loadSlots = async () => {
        try {
            const response = await slotApi.getAllSlots();
            setSlots(response.data || []);
        } catch (error) {
            console.warn('Slots not available (permission or data):', error?.message || error);
            setSlots([]);
        }
    };

    const loadWorkTypes = async () => {
        try {
            const response = await taskTemplateApi.getWorkTypes();
            setWorkTypes(response.data || []);
        } catch (error) {
            console.error('Error loading work types:', error);
            setWorkTypes([]);
        }
    };

    const loadAreas = async () => {
        try {
            const response = await areasApi.getAllAreas();
            setAreas(response.data || []);
        } catch (error) {
            console.error('Error loading areas:', error);
        }
    };

    const loadPetSpeciesAndBreeds = async () => {
        try {
            const [speciesRes, breedsRes] = await Promise.all([
                petSpeciesApi.getAllSpecies({ page_size: 1000 }),
                petBreedsApi.getAllBreeds({ page_size: 1000 })
            ]);
            setPetSpecies(speciesRes?.data || []);
            setPetBreeds(breedsRes?.data || []);
        } catch (error) {
            console.error('Error loading species/breeds:', error);
        }
    };

    const loadPetGroups = async () => {
        try {
            const response = await petGroupsApi.getAllGroups({ page_size: 1000 });
            setPetGroups(response?.data || []);
        } catch (error) {
            console.error('Error loading pet groups:', error);
        }
    };

    const loadTeams = async () => {
        try {
            // Replace mock fallback with empty list; loadTeams elsewhere should fetch real data
            setTeams([]);
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    };

    // Service handlers
    const handleCreateService = (task) => {
        setSelectedTask(task);
        setEditingService(null);
        setServiceFormOpen(true);
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setSelectedTask(null);
        setServiceFormOpen(true);
    };

    const handleServiceFormSubmit = async (formData) => {
        try {
            if (editingService) {
                await serviceApi.updateService(editingService.id, formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật service thành công!',
                    type: 'success'
                });
            } else {
                await serviceApi.createService(formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo service thành công!',
                    type: 'success'
                });
            }
            await loadServices();
            setServiceFormOpen(false);
        } catch (error) {
            throw error;
        }
    };

    const handleToggleStatus = async (service) => {
        // Nếu service đang active, hiển thị confirm modal trước khi inactive
        if (service.is_active) {
            setDisableTarget(service);
            setConfirmDisableOpen(true);
            return;
        }

        // Nếu service đang inactive, hiển thị confirm modal trước khi active
        setEnableTarget(service);
        setConfirmEnableOpen(true);
    };

    const confirmDisableService = async () => {
        if (!disableTarget) return;

        try {
            await serviceApi.toggleServiceStatus(disableTarget.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Service đã được vô hiệu hóa!',
                type: 'success'
            });
            await loadServices();
        } catch (error) {
            console.error('Error disabling service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể vô hiệu hóa service',
                type: 'error'
            });
        } finally {
            setConfirmDisableOpen(false);
            setDisableTarget(null);
        }
    };

    const confirmEnableService = async () => {
        if (!enableTarget) return;

        try {
            await serviceApi.toggleServiceStatus(enableTarget.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Service đã được kích hoạt!',
                type: 'success'
            });
            await loadServices();
        } catch (error) {
            console.error('Error enabling service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể kích hoạt service',
                type: 'error'
            });
        } finally {
            setConfirmEnableOpen(false);
            setEnableTarget(null);
        }
    };

    const handleDeleteService = (service) => {
        setDeleteTarget(service);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await serviceApi.deleteService(deleteTarget.id);
            await loadServices();
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa service thành công!',
                type: 'success'
            });
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting service:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Có lỗi xảy ra khi xóa',
                type: 'error'
            });
        }
    };

    // Slot handlers
    const handleViewSlots = (service) => {
        // Find task for this service
        const task = taskTemplates.find(t => t.id === service.task_id);
        if (!task) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không tìm thấy nhiệm vụ liên kết với dịch vụ này.',
                type: 'error'
            });
            return;
        }

        setSelectedTask(task);
        setSelectedService(service);
        setSlotDetailsOpen(true);
    };

    const handleCreateSlot = (task) => {
        setSelectedTask(task);
        setSlotFormMode('create');
        setEditingSlot(null);
        setSlotFormOpen(true);
    };

    const handleEditSlot = (slot) => {
        setSlotFormMode('edit');
        setEditingSlot(slot);
        setSlotFormOpen(true);
    };

    const handleSlotFormSubmit = async (formData) => {
        try {
            if (slotFormMode === 'edit' && editingSlot) {
                // Edit mode
                await slotApi.updateSlot(editingSlot.id, formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật ca thành công!',
                    type: 'success'
                });
            } else {
                // Create mode
                await slotApi.createSlot(formData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo ca thành công!',
                    type: 'success'
                });
            }

            await loadSlots();
            setSlotFormOpen(false);
            setEditingSlot(null);
            setSlotFormMode('create');
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            await slotApi.deleteSlot(slotId);
            await loadSlots();
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa slot thành công!',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting slot:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa slot',
                type: 'error'
            });
        }
    };

    // Get work type color
    const getWorkTypeColor = (workTypeName) => {
        if (!workTypeName) return COLORS.GRAY[500];

        const name = workTypeName.toLowerCase();
        if (name.includes('dog') || name.includes('chó')) return COLORS.INFO[600];
        if (name.includes('cat') || name.includes('mèo')) return COLORS.WARNING[600];
        return COLORS.PRIMARY[600];
    };

    // Get task for service
    const getTaskForService = (taskId) => {
        return taskTemplates.find(t => t.id === taskId);
    };

    // Get slots count for service (by task_id)
    const getSlotsCountForService = (taskId) => {
        const serviceSlots = slots.filter(s => s.task_id === taskId);
        return {
            total: serviceSlots.length,
            available: serviceSlots.filter(s => s.service_status === 'AVAILABLE').length,
            unavailable: serviceSlots.filter(s => s.service_status === 'UNAVAILABLE').length
        };
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <ServicesIcon sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                    <Typography variant="h4" fontWeight={600}>
                        Quản lý Dịch vụ
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Tạo Dịch vụ từ Nhiệm vụ (1 Nhiệm vụ = 1 Dịch vụ)
                </Typography>
            </Box>

            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng Nhiệm vụ Công khai
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                            {stats.totalTasks}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Chưa có Dịch vụ
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.availableTasks}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Dịch vụ Hoạt động
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.activeServices}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng Dịch vụ
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                            {stats.totalServices}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, v) => {
                        setCurrentTab(v);
                        setPage(1);
                        setSearchQuery('');
                    }}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.9375rem'
                        }
                    }}
                >
                    <Tab label={`Dịch vụ (${services.length})`} />
                    <Tab label={`Nhiệm vụ chưa có Dịch vụ (${availableTasks.length})`} />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {currentTab === 0 && (
                <>
                    {/* Toolbar */}
                    <Paper sx={{ mb: 2 }}>
                        <Toolbar sx={{ py: 2, flexDirection: 'column', gap: 1 }}>
                            {/* Row 1 - fixed layout (no responsive) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Box sx={{ flex: '0 0 1040px' }}>
                                    <TextField placeholder="Tìm dịch vụ..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} size="small" fullWidth />
                                </Box>
                                <Box sx={{ flex: '0 0 24px' }} />
                                <FormControl size="small" sx={{ width: 200 }}>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select value={filterServiceStatus} onChange={(e) => { setFilterServiceStatus(e.target.value); setPage(1); loadServices(); }} label="Trạng thái">
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        <MenuItem value="active">Hoạt động</MenuItem>
                                        <MenuItem value="inactive">Không hoạt động</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ width: 240, ml: 1 }}>
                                    <InputLabel>Nhiệm vụ</InputLabel>
                                    <Select value={filterTaskId} onChange={(e) => { setFilterTaskId(e.target.value); setPage(1); loadServices(); }} label="Nhiệm vụ">
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        {taskTemplates.map(t => (<MenuItem key={t.id} value={t.id}>{t.title || t.name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Row 2 - fixed layout (no responsive) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'nowrap' }}>
                                <TextField label="Giá từ" size="small" value={filterMinPriceText} onChange={handleMinPriceInputChange} onBlur={handleMinPriceBlur} onFocus={handleMinPriceFocus} inputMode="numeric" InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
                                <TextField label="đến" size="small" value={filterMaxPriceText} onChange={handleMaxPriceInputChange} onBlur={handleMaxPriceBlur} onFocus={handleMaxPriceFocus} inputMode="numeric" InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
                                <TextField label="Giờ bắt đầu" type="time" size="small" value={filterStartTime} onChange={(e) => { setFilterStartTime(e.target.value); loadServices(); }} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
                                <TextField label="Giờ kết thúc" type="time" size="small" value={filterEndTime} onChange={(e) => { setFilterEndTime(e.target.value); loadServices(); }} InputLabelProps={{ shrink: true }} sx={{ width: 200 }} />
                                <FormControl size="small" sx={{ width: 240 }}>
                                    <InputLabel shrink>Loài</InputLabel>
                                    <Select multiple displayEmpty value={filterSpeciesIds} onChange={(e) => { const val = (e.target.value || []).filter(v => v !== '__ALL__'); setFilterSpeciesIds(val); loadServices(); }} input={<OutlinedInput label="Loài" />} renderValue={(selected) => {
                                        const arr = Array.isArray(selected) ? selected : [];
                                        if (arr.length === 0) return 'Tất cả';
                                        return petSpecies.filter(sp => arr.includes(sp.id)).map(sp => sp.name).join(', ');
                                    }}>
                                        <MenuItem value="__ALL__">Tất cả</MenuItem>
                                        {petSpecies.map(sp => (<MenuItem key={sp.id} value={sp.id}>{sp.name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ width: 240 }}>
                                    <InputLabel shrink>Giống</InputLabel>
                                    <Select multiple displayEmpty value={filterBreedIds} onChange={(e) => { const val = (e.target.value || []).filter(v => v !== '__ALL__'); setFilterBreedIds(val); loadServices(); }} input={<OutlinedInput label="Giống" />} renderValue={(selected) => {
                                        const arr = Array.isArray(selected) ? selected : [];
                                        if (arr.length === 0) return 'Tất cả';
                                        return petBreeds.filter(br => arr.includes(br.id)).map(br => br.name).join(', ');
                                    }}>
                                        <MenuItem value="__ALL__">Tất cả</MenuItem>
                                        {petBreeds.map(br => (<MenuItem key={br.id} value={br.id}>{br.name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ width: 240 }}>
                                    <InputLabel shrink>Khu vực</InputLabel>
                                    <Select multiple displayEmpty value={filterAreaIds} onChange={(e) => { const val = (e.target.value || []).filter(v => v !== '__ALL__'); setFilterAreaIds(val); loadServices(); }} input={<OutlinedInput label="Khu vực" />} renderValue={(selected) => {
                                        const arr = Array.isArray(selected) ? selected : [];
                                        if (arr.length === 0) return 'Tất cả';
                                        return areas.filter(a => arr.includes(a.id)).map(a => a.name).join(', ');
                                    }}>
                                        <MenuItem value="__ALL__">Tất cả</MenuItem>
                                        {areas.map(a => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                                <Box sx={{ flex: 1 }} />
                                <Button variant="text" size="small" onClick={() => { setFilterTaskId('all'); setFilterStartTime(''); setFilterEndTime(''); setFilterSpeciesIds([]); setFilterBreedIds([]); setFilterAreaIds([]); setFilterMinPrice(''); setFilterMaxPrice(''); setFilterMinPriceText(''); setFilterMaxPriceText(''); setFilterServiceStatus('all'); setSearchQuery(''); setPage(1); loadServices(); }}>Xóa bộ lọc</Button>
                            </Box>
                        </Toolbar>
                    </Paper>

                    {/* Services Table */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                                <TableRow>
                                    <TableCell width="4%">STT</TableCell>
                                    <TableCell width="6%">Ảnh</TableCell>
                                    <TableCell width="9%">Loại</TableCell>
                                    <TableCell width="16%">Tên Dịch vụ</TableCell>
                                    <TableCell width="23%">Mô tả</TableCell>
                                    <TableCell width="8%" align="center">Thời gian</TableCell>
                                    <TableCell width="9%" align="right">Giá</TableCell>
                                    <TableCell width="8%" align="center">Ca</TableCell>
                                    <TableCell width="10%" align="center">Trạng thái</TableCell>
                                    <TableCell width="7%" align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPageItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                Không có dịch vụ nào
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentPageItems.map((service, index) => {
                                        const task = getTaskForService(service.task_id);
                                        const workType = task?.work_type;
                                        const workTypeColor = workType ? getWorkTypeColor(workType.name) : COLORS.GRAY[500];

                                        return (
                                            <TableRow key={service.id} hover>
                                                {/* STT */}
                                                <TableCell>
                                                    {(page - 1) * itemsPerPage + index + 1}
                                                </TableCell>

                                                {/* Ảnh */}
                                                <TableCell>
                                                    <Avatar
                                                        src={service.image_url}
                                                        variant="rounded"
                                                        sx={{ width: 50, height: 50 }}
                                                    >
                                                        {service.name?.charAt(0)}
                                                    </Avatar>
                                                </TableCell>

                                                {/* Loại */}
                                                <TableCell>
                                                    <Tooltip title={workType?.description || ''} arrow>
                                                        <Chip
                                                            label={workType?.name || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(workTypeColor, 0.15),
                                                                color: workTypeColor,
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>

                                                {/* Tên Service */}
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {service.name}
                                                    </Typography>
                                                    {task && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Nhiệm vụ: {task.title || task.name}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Mô tả */}
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {service.description.length > 80
                                                            ? `${service.description.substring(0, 80)}...`
                                                            : service.description
                                                        }
                                                    </Typography>
                                                </TableCell>

                                                {/* Thời gian */}
                                                <TableCell align="center">
                                                    {service.duration_minutes > 0 ? (
                                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                            <ScheduleIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {service.duration_minutes}p
                                                            </Typography>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Giá */}
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                                        {formatPrice(service.base_price)}
                                                    </Typography>
                                                </TableCell>

                                                {/* Slots */}
                                                <TableCell align="center">
                                                    {(() => {
                                                        const slotsCount = getSlotsCountForService(service.task_id);

                                                        return (
                                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                                <Tooltip title="Xem chi tiết ca">
                                                                    <Chip
                                                                        label={slotsCount.total}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => handleViewSlots(service)}
                                                                        sx={{
                                                                            cursor: 'pointer',
                                                                            '&:hover': {
                                                                                bgcolor: alpha(COLORS.PRIMARY[100], 0.5)
                                                                            }
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Ca có sẵn">
                                                                    <Chip
                                                                        label={`${slotsCount.available}A`}
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() => handleViewSlots(service)}
                                                                        sx={{
                                                                            cursor: 'pointer',
                                                                            '&:hover': {
                                                                                opacity: 0.8
                                                                            }
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </Stack>
                                                        );
                                                    })()}
                                                </TableCell>

                                                {/* Trạng thái */}
                                                <TableCell align="center">
                                                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                                        <Switch
                                                            checked={service.is_active === true}
                                                            onChange={() => handleToggleStatus(service)}
                                                            size="small"
                                                            color="success"
                                                        />
                                                        <Chip
                                                            label={service.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                            size="small"
                                                            icon={service.is_active ? <CheckIcon /> : <CloseIcon />}
                                                            sx={{
                                                                bgcolor: service.is_active
                                                                    ? alpha(COLORS.SUCCESS[100], 0.8)
                                                                    : alpha(COLORS.GRAY[200], 0.6),
                                                                color: service.is_active
                                                                    ? COLORS.SUCCESS[700]
                                                                    : COLORS.TEXT.SECONDARY
                                                            }}
                                                        />
                                                    </Stack>
                                                </TableCell>

                                                {/* Thao tác */}
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            setServiceMenuAnchor(e.currentTarget);
                                                            setMenuService(service);
                                                        }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <Box sx={{ mt: 2 }}>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setPage(1);
                            }}
                            totalItems={filteredServices.length}
                        />
                    </Box>
                </>
            )}

            {/* Available Tasks Tab */}
            {currentTab === 1 && (
                <>
                    {/* Toolbar */}
                    <Paper sx={{ mb: 2 }}>
                        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Tìm nhiệm vụ..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                size="small"
                                sx={{ minWidth: 250 }}
                            />

                            <Box sx={{ flexGrow: 1 }} />
                        </Toolbar>
                    </Paper>

                    {/* Available Tasks Table */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                                <TableRow>
                                    <TableCell width="5%">STT</TableCell>
                                    <TableCell width="12%">Loại công việc</TableCell>
                                    <TableCell width="25%">Tên Nhiệm vụ</TableCell>
                                    <TableCell width="38%">Mô tả</TableCell>
                                    <TableCell width="10%" align="center">Thời gian</TableCell>
                                    <TableCell width="10%" align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPageItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                {searchQuery
                                                    ? 'Không tìm thấy nhiệm vụ nào'
                                                    : '🎉 Tuyệt vời! Tất cả Nhiệm vụ Công khai đã có Dịch vụ.'
                                                }
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentPageItems.map((task, index) => {
                                        const workType = task.work_type;
                                        const workTypeColor = workType ? getWorkTypeColor(workType.name) : COLORS.GRAY[500];

                                        return (
                                            <TableRow key={task.id} hover>
                                                <TableCell>
                                                    {(page - 1) * itemsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    {workType ? (
                                                        <Tooltip title={workType.description || ''} arrow>
                                                            <Chip
                                                                label={workType.name}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(workTypeColor, 0.15),
                                                                    color: workTypeColor,
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {task.title || task.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {task.description.length > 100
                                                            ? `${task.description.substring(0, 100)}...`
                                                            : task.description
                                                        }
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {task.estimated_hours > 0 ? (
                                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                            <ScheduleIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {task.estimated_hours} giờ
                                                            </Typography>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleCreateService(task)}
                                                        sx={{
                                                            bgcolor: COLORS.SUCCESS[600],
                                                            '&:hover': {
                                                                bgcolor: COLORS.SUCCESS[700]
                                                            }
                                                        }}
                                                    >
                                                        Tạo Dịch vụ
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <Box sx={{ mt: 2 }}>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setPage(1);
                            }}
                            totalItems={filteredAvailableTasks.length}
                        />
                    </Box>
                </>
            )}

            {/* Modals */}
            <ServiceFormModal
                open={serviceFormOpen}
                onClose={() => setServiceFormOpen(false)}
                onSubmit={handleServiceFormSubmit}
                taskData={selectedTask}
                initialData={editingService}
                mode={editingService ? 'edit' : 'create'}
            />

            <SlotDetailsModal
                open={slotDetailsOpen}
                onClose={() => setSlotDetailsOpen(false)}
                taskData={selectedTask}
                slots={slots}
                onEditSlot={handleEditSlot}
                onDeleteSlot={handleDeleteSlot}
                onRefresh={loadData}
                showCreateAction={false}
            />

            <SlotFormModal
                open={slotFormOpen}
                onClose={() => {
                    setSlotFormOpen(false);
                    setEditingSlot(null);
                    setSlotFormMode('create');
                }}
                onSubmit={handleSlotFormSubmit}
                taskData={selectedTask}
                initialData={editingSlot}
                mode={slotFormMode}
                areas={areas}
                petGroups={petGroups}
                teams={teams}
            />

            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa Dịch vụ?"
                message={`Bạn có chắc chắn muốn xóa dịch vụ "${deleteTarget?.name}"?`}
                confirmText="Xóa"
                type="error"
            />

            <ConfirmModal
                isOpen={confirmDisableOpen}
                onClose={() => {
                    setConfirmDisableOpen(false);
                    setDisableTarget(null);
                }}
                onConfirm={confirmDisableService}
                title="Vô hiệu hóa Dịch vụ?"
                message={`Bạn có chắc chắn muốn vô hiệu hóa dịch vụ "${disableTarget?.name}"? Dịch vụ sẽ không còn khả dụng cho khách hàng đặt lịch.`}
                confirmText="Vô hiệu hóa"
                type="warning"
            />

            <ConfirmModal
                isOpen={confirmEnableOpen}
                onClose={() => {
                    setConfirmEnableOpen(false);
                    setEnableTarget(null);
                }}
                onConfirm={confirmEnableService}
                title="Kích hoạt Dịch vụ?"
                message={`Bạn có chắc chắn muốn kích hoạt dịch vụ "${enableTarget?.name}"? Dịch vụ sẽ có sẵn cho khách hàng đặt lịch.`}
                confirmText="Kích hoạt"
                type="success"
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Service Actions Menu */}
            <Menu
                anchorEl={serviceMenuAnchor}
                open={Boolean(serviceMenuAnchor)}
                onClose={() => {
                    setServiceMenuAnchor(null);
                    setMenuService(null);
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
                        if (menuService) {
                            handleEditService(menuService);
                        }
                        setServiceMenuAnchor(null);
                        setMenuService(null);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuService && !menuService.is_active) {
                            handleDeleteService(menuService);
                        }
                        setServiceMenuAnchor(null);
                        setMenuService(null);
                    }}
                    disabled={menuService?.is_active === true}
                >
                    <ListItemIcon>
                        <DeleteIcon
                            fontSize="small"
                            sx={{
                                color: menuService?.is_active
                                    ? COLORS.GRAY[400]
                                    : COLORS.ERROR[600]
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText>
                        {menuService?.is_active ? "Phải vô hiệu hóa trước khi xóa" : "Xóa"}
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ServicesPage;
