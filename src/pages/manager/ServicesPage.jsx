import { useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Stack, Toolbar, FormControl, InputLabel, Select, MenuItem, Switch, Tooltip, Tabs, Tab, Menu, ListItemIcon, ListItemText, Avatar, OutlinedInput } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Schedule as ScheduleIcon, Check as CheckIcon, Close as CloseIcon, MiscellaneousServices as ServicesIcon, MoreVert as MoreVertIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AlertModal from '../../components/modals/AlertModal';
import ServiceFormModal from '../../components/modals/ServiceFormModal';
import ServiceDetailModal from '../../components/modals/ServiceDetailModal';
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
    const [isPending, startTransition] = useTransition();
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    // Data
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [services, setServices] = useState([]);
    const [allServices, setAllServices] = useState([]); // State mới: lưu TẤT CẢ services để tính availableTasks
    const [slots, setSlots] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [petGroups, setPetGroups] = useState([]);
    const [petBreeds, setPetBreeds] = useState([]);
    const [petSpecies, setPetSpecies] = useState([]);
    const [teams, setTeams] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [filterServiceStatus, setFilterServiceStatus] = useState('active'); // Mặc định là Hoạt động
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
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modals
    const [serviceFormOpen, setServiceFormOpen] = useState(false);
    const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
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

    const stats = useMemo(() => {
        if (!taskTemplates.length && !allServices.length) {
            return {
                totalTasks: 0,
                availableTasks: 0,
                totalServices: 0,
                activeServices: 0,
                inactiveServices: 0
            };
        }

        const servicedTaskIdsSet = new Set(allServices.map(s => s.task_id).filter(Boolean));
        const publicTasks = taskTemplates.filter(t => t.is_public === true);
        const availablePublicTasks = publicTasks.filter(t => !servicedTaskIdsSet.has(t.id));

        let activeCount = 0;
        let inactiveCount = 0;
        for (const service of allServices) {
            if (service.is_active === true) {
                activeCount++;
            } else {
                inactiveCount++;
            }
        }

        return {
            totalTasks: publicTasks.length,
            availableTasks: availablePublicTasks.length,
            totalServices: allServices.length,
            activeServices: activeCount,
            inactiveServices: inactiveCount
        };
    }, [taskTemplates, allServices]);

    const availableTasks = useMemo(() => {
        if (!taskTemplates.length || !allServices.length) {
            return taskTemplates.filter(t => t.is_public === true);
        }

        const servicedTaskIdsSet = new Set(allServices.map(s => s.task_id).filter(Boolean));
        const publicTasks = taskTemplates.filter(t => t.is_public === true);

        return publicTasks.filter(t => !servicedTaskIdsSet.has(t.id));
    }, [taskTemplates, allServices]);

    const filteredAvailableTasks = useMemo(() => {
        if (!deferredSearchQuery || deferredSearchQuery.trim().length === 0) {
            return availableTasks;
        }

        const searchLower = deferredSearchQuery.toLowerCase();
        return availableTasks.filter(task => {
            const title = (task.title || task.name || '').toLowerCase();
            const description = (task.description || '').toLowerCase();
            return title.includes(searchLower) || description.includes(searchLower);
        });
    }, [availableTasks, deferredSearchQuery]);

    const filteredServices = useMemo(() => {
        if (!deferredSearchQuery || deferredSearchQuery.trim().length === 0) {
            return services;
        }

        const searchLower = deferredSearchQuery.toLowerCase();
        return services.filter(service => {
            const name = (service.name || '').toLowerCase();
            const description = (service.description || '').toLowerCase();
            return name.includes(searchLower) || description.includes(searchLower);
        });
    }, [services, deferredSearchQuery]);

    // Pagination - for Services tab, use filteredServices with client-side pagination for search; for Available Tasks tab, use client-side pagination
    const currentPageItems = useMemo(() => {
        if (currentTab === 0) {
            // Services tab: use filteredServices and apply client-side pagination
            // Note: API filters are applied in loadServices, but search query needs client-side filtering
            const items = filteredServices;
            const startIndex = (page - 1) * itemsPerPage;
            return items.slice(startIndex, startIndex + itemsPerPage);
        } else {
            // Available Tasks tab: use client-side pagination
            const items = filteredAvailableTasks;
            const startIndex = (page - 1) * itemsPerPage;
            return items.slice(startIndex, startIndex + itemsPerPage);
        }
    }, [currentTab, filteredAvailableTasks, filteredServices, page, itemsPerPage]);

    const totalPagesForDisplay = useMemo(() => {
        if (currentTab === 0) {
            // Services tab: calculate from filteredServices
            return Math.ceil(filteredServices.length / itemsPerPage);
        } else {
            // Available Tasks tab: use client-side pagination
            return Math.ceil(filteredAvailableTasks.length / itemsPerPage);
        }
    }, [currentTab, filteredAvailableTasks, filteredServices, itemsPerPage]);

    const loadTaskTemplates = useCallback(async () => {
        try {
            const response = await taskTemplateApi.getAllTaskTemplates();
            setTaskTemplates(response.data || []);
        } catch (error) {
            setTaskTemplates([]);
        }
    }, []);

    const loadAllServices = useCallback(async () => {
        try {
            const [activeResponse, inactiveResponse] = await Promise.all([
                serviceApi.getAllServices({ is_active: true, page: 0, limit: 9999 }),
                serviceApi.getAllServices({ is_active: false, page: 0, limit: 9999 })
            ]);

            const allServicesData = [
                ...(activeResponse.data || []),
                ...(inactiveResponse.data || [])
            ];

            setAllServices(allServicesData);
        } catch (error) {
            setAllServices([]);
        }
    }, []);

    const loadServices = useCallback(async () => {
        try {
            const shouldLoadAll = searchQuery && searchQuery.trim().length > 0;

            const response = await serviceApi.getAllServices({
                task_id: filterTaskId !== 'all' ? filterTaskId : undefined,
                start_time: filterStartTime || undefined,
                end_time: filterEndTime || undefined,
                pet_species_ids: filterSpeciesIds.length > 0 ? filterSpeciesIds : undefined,
                pet_breed_ids: filterBreedIds.length > 0 ? filterBreedIds : undefined,
                area_ids: filterAreaIds.length > 0 ? filterAreaIds : undefined,
                min_price: filterMinPrice === '' ? undefined : Number(filterMinPrice),
                max_price: filterMaxPrice === '' ? undefined : Number(filterMaxPrice),
                is_active: filterServiceStatus === 'active' ? true : false,
                page: shouldLoadAll ? 0 : page - 1,
                limit: shouldLoadAll ? 9999 : itemsPerPage
            });

            startTransition(() => {
                setServices(response.data || []);
            });

            if (response.pagination && !shouldLoadAll) {
                setTotalPages(response.pagination.total_pages_count || 1);
                setTotalItems(response.pagination.total_items_count || 0);
            } else {
                setTotalPages(1);
                setTotalItems(response.data?.length || 0);
            }
        } catch (error) {
            setServices([]);
            setTotalPages(1);
            setTotalItems(0);
        }
    }, [searchQuery, filterTaskId, filterStartTime, filterEndTime, filterSpeciesIds, filterBreedIds, filterAreaIds, filterMinPrice, filterMaxPrice, filterServiceStatus, page, itemsPerPage, startTransition]);

    useEffect(() => {
        if (currentTab === 0) {
            const id = setTimeout(() => {
                loadServices();
            }, 250);
            return () => clearTimeout(id);
        }
    }, [
        currentTab,
        page,
        itemsPerPage,
        searchQuery,
        filterServiceStatus,
        filterTaskId,
        filterStartTime,
        filterEndTime,
        filterSpeciesIds,
        filterBreedIds,
        filterAreaIds,
        filterMinPrice,
        filterMaxPrice,
        loadServices
    ]);

    useEffect(() => {
        if (currentTab === 1) {
            loadAllServices();
        }
    }, [currentTab, loadAllServices]);

    const formatNumberVi = useCallback((value) => new Intl.NumberFormat('vi-VN').format(value), []);

    const handleMinPriceInputChange = useCallback((e) => {
        const raw = e.target.value || '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0) {
            setFilterMinPrice('');
            setFilterMinPriceText('');
        } else {
            const num = parseInt(digits, 10);
            setFilterMinPrice(num);
            setFilterMinPriceText(digits);
        }
        loadServices();
    }, [loadServices]);

    const handleMinPriceBlur = useCallback(() => {
        if (filterMinPrice === '') {
            setFilterMinPriceText('');
        } else {
            setFilterMinPriceText(formatNumberVi(filterMinPrice));
        }
    }, [filterMinPrice, formatNumberVi]);

    const handleMinPriceFocus = useCallback(() => {
        if (filterMinPrice === '') {
            setFilterMinPriceText('');
        } else {
            setFilterMinPriceText(String(filterMinPrice));
        }
    }, [filterMinPrice]);

    const handleMaxPriceInputChange = useCallback((e) => {
        const raw = e.target.value || '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0) {
            setFilterMaxPrice('');
            setFilterMaxPriceText('');
        } else {
            const num = parseInt(digits, 10);
            setFilterMaxPrice(num);
            setFilterMaxPriceText(digits);
        }
        loadServices();
    }, [loadServices]);

    const handleMaxPriceBlur = useCallback(() => {
        if (filterMaxPrice === '') {
            setFilterMaxPriceText('');
        } else {
            setFilterMaxPriceText(formatNumberVi(filterMaxPrice));
        }
    }, [filterMaxPrice, formatNumberVi]);

    const handleMaxPriceFocus = useCallback(() => {
        if (filterMaxPrice === '') {
            setFilterMaxPriceText('');
        } else {
            setFilterMaxPriceText(String(filterMaxPrice));
        }
    }, [filterMaxPrice]);

    const loadSlots = useCallback(async () => {
        try {
            const response = await slotApi.getAllSlots();
            setSlots(response.data || []);
        } catch (error) {
            setSlots([]);
        }
    }, []);

    const loadWorkTypes = useCallback(async () => {
        try {
            const response = await taskTemplateApi.getWorkTypes();
            setWorkTypes(response.data || []);
        } catch (error) {
            setWorkTypes([]);
        }
    }, []);

    const loadAreas = useCallback(async () => {
        try {
            const response = await areasApi.getAllAreas();
            setAreas(response.data || []);
        } catch (error) {
            // Silent fail
        }
    }, []);

    const loadPetSpeciesAndBreeds = useCallback(async () => {
        try {
            const [speciesRes, breedsRes] = await Promise.all([
                petSpeciesApi.getAllSpecies({ page_size: 1000 }),
                petBreedsApi.getAllBreeds({ page_size: 1000 })
            ]);
            setPetSpecies(speciesRes?.data || []);
            setPetBreeds(breedsRes?.data || []);
        } catch (error) {
            // Silent fail
        }
    }, []);

    const loadPetGroups = useCallback(async () => {
        try {
            const response = await petGroupsApi.getAllGroups({ page_size: 1000 });
            setPetGroups(response?.data || []);
        } catch (error) {
            // Silent fail
        }
    }, []);

    const loadTeams = useCallback(async () => {
        try {
            setTeams([]);
        } catch (error) {
            // Silent fail
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadTaskTemplates(),
                loadAllServices(),
                loadServices(),
                loadSlots(),
                loadWorkTypes(),
                loadAreas(),
                loadPetSpeciesAndBreeds(),
                loadPetGroups(),
                loadTeams()
            ]);
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [loadTaskTemplates, loadAllServices, loadServices, loadSlots, loadWorkTypes, loadAreas, loadPetSpeciesAndBreeds, loadPetGroups, loadTeams]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateService = useCallback((task) => {
        setSelectedTask(task);
        setEditingService(null);
        setServiceFormOpen(true);
    }, []);

    const handleEditService = useCallback((service) => {
        setEditingService(service);
        setSelectedTask(null);
        setServiceFormOpen(true);
    }, []);

    const handleServiceFormSubmit = useCallback(async (formData) => {
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
            await Promise.all([loadAllServices(), loadServices()]);
            setServiceFormOpen(false);
            setEditingService(null); // Clear editing service after submit
        } catch (error) {
            throw error;
        }
    }, [editingService, loadAllServices, loadServices]);

    const handleToggleStatus = useCallback(async (service) => {
        // Nếu service đang active, hiển thị confirm modal trước khi inactive
        if (service.is_active) {
            setDisableTarget(service);
            setConfirmDisableOpen(true);
            return;
        }

        setEnableTarget(service);
        setConfirmEnableOpen(true);
    }, []);

    const confirmDisableService = useCallback(async () => {
        if (!disableTarget) return;

        try {
            await serviceApi.toggleServiceStatus(disableTarget.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Service đã được vô hiệu hóa!',
                type: 'success'
            });
            await Promise.all([loadAllServices(), loadServices()]);
        } catch (error) {
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
    }, [loadAllServices, loadServices]);

    const confirmEnableService = useCallback(async () => {
        if (!enableTarget) return;

        try {
            await serviceApi.toggleServiceStatus(enableTarget.id);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Service đã được kích hoạt!',
                type: 'success'
            });
            await Promise.all([loadAllServices(), loadServices()]);
        } catch (error) {
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
    }, [loadAllServices, loadServices]);

    const handleDeleteService = useCallback((service) => {
        setDeleteTarget(service);
        setConfirmDeleteOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        try {
            await serviceApi.deleteService(deleteTarget.id);
            await Promise.all([loadAllServices(), loadServices()]);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa service thành công!',
                type: 'success'
            });
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Có lỗi xảy ra khi xóa',
                type: 'error'
            });
        }
    }, [loadAllServices, loadServices]);

    const handleViewSlots = useCallback((service) => {
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
    }, [taskTemplates]);

    const handleCreateSlot = useCallback((task) => {
        setSelectedTask(task);
        setSlotFormMode('create');
        setEditingSlot(null);
        setSlotFormOpen(true);
    }, []);

    const handleEditSlot = useCallback((slot) => {
        setSlotFormMode('edit');
        setEditingSlot(slot);
        setSlotFormOpen(true);
    }, []);

    const handleSlotFormSubmit = useCallback(async (formData) => {
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
    }, [slotFormMode, editingSlot, loadSlots]);

    const handleDeleteSlot = useCallback(async (slotId) => {
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
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa slot',
                type: 'error'
            });
        }
    }, [loadSlots]);

    const getWorkTypeColor = useCallback((workTypeName) => {
        if (!workTypeName) return COLORS.GRAY[500];

        const name = workTypeName.toLowerCase();
        if (name.includes('dog') || name.includes('chó')) return COLORS.INFO[600];
        if (name.includes('cat') || name.includes('mèo')) return COLORS.WARNING[600];
        return COLORS.PRIMARY[600];
    }, []);

    const getTaskForService = useCallback((taskId) => {
        return taskTemplates.find(t => t.id === taskId);
    }, [taskTemplates]);

    const getSlotsCountForService = useCallback((taskId) => {
        const serviceSlots = slots.filter(s => s.task_id === taskId);
        return {
            total: serviceSlots.length,
            available: serviceSlots.filter(s => s.service_status === 'AVAILABLE').length,
            unavailable: serviceSlots.filter(s => s.service_status === 'UNAVAILABLE').length
        };
    }, [slots]);

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
                    { label: 'Tổng Nhiệm vụ Công khai', value: stats.totalTasks, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Chưa có Dịch vụ', value: stats.availableTasks, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Dịch vụ Hoạt động', value: stats.activeServices, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Tổng Dịch vụ', value: stats.totalServices, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${3 * 16}px) / 4)`;
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
                            {/* Row 1 - Search and main filters */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <TextField
                                    placeholder="Tìm dịch vụ..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        startTransition(() => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        });
                                    }}
                                    size="small"
                                    sx={{ flex: 1, minWidth: 300 }}
                                />
                                {isPending && (
                                    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
                                        <Chip
                                            label="Đang tìm kiếm..."
                                            size="small"
                                            sx={{
                                                bgcolor: COLORS.INFO[500],
                                                color: 'white',
                                                fontWeight: 600
                                            }}
                                        />
                                    </Box>
                                )}
                                <FormControl size="small" sx={{ width: 200 }}>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select value={filterServiceStatus} onChange={(e) => { setFilterServiceStatus(e.target.value); setPage(1); loadServices(); }} label="Trạng thái">
                                        <MenuItem value="active">Hoạt động</MenuItem>
                                        <MenuItem value="inactive">Không hoạt động</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ width: 240 }}>
                                    <InputLabel>Nhiệm vụ</InputLabel>
                                    <Select value={filterTaskId} onChange={(e) => { setFilterTaskId(e.target.value); setPage(1); loadServices(); }} label="Nhiệm vụ">
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        {taskTemplates.map(t => (<MenuItem key={t.id} value={t.id}>{t.title || t.name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Row 2 - Additional filters */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                                <TextField label="Giá từ" size="small" value={filterMinPriceText} onChange={handleMinPriceInputChange} onBlur={handleMinPriceBlur} onFocus={handleMinPriceFocus} inputMode="numeric" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                                <TextField label="đến" size="small" value={filterMaxPriceText} onChange={handleMaxPriceInputChange} onBlur={handleMaxPriceBlur} onFocus={handleMaxPriceFocus} inputMode="numeric" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                                <TextField label="Giờ bắt đầu" type="time" size="small" value={filterStartTime} onChange={(e) => { setFilterStartTime(e.target.value); loadServices(); }} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                                <TextField label="Giờ kết thúc" type="time" size="small" value={filterEndTime} onChange={(e) => { setFilterEndTime(e.target.value); loadServices(); }} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                                <FormControl size="small" sx={{ width: 220 }}>
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
                                <FormControl size="small" sx={{ width: 220 }}>
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
                                <FormControl size="small" sx={{ width: 220 }}>
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
                            </Box>
                        </Toolbar>
                    </Paper>

                    {/* Services Table */}
                    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                        <Table size="medium" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }} width="5%">STT</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="7%">Ảnh</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="10%">Loại</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="20%">Tên Dịch vụ</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="9%">Thời gian</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right" width="10%">Giá</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="9%">Ca</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="12%">Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="8%">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPageItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
                                                                : COLORS.TEXT.SECONDARY,
                                                            fontWeight: 600
                                                        }}
                                                    />
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
                            totalPages={totalPagesForDisplay}
                            onPageChange={(newPage) => {
                                setPage(newPage);
                                // Don't reload if we're using client-side pagination (when search is active)
                                if (currentTab === 0 && (!searchQuery || searchQuery.trim().length === 0)) {
                                    // Only reload if not searching (server-side pagination)
                                    loadServices();
                                }
                            }}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setPage(1);
                                // Don't reload if we're using client-side pagination (when search is active)
                                if (currentTab === 0 && (!searchQuery || searchQuery.trim().length === 0)) {
                                    // Only reload if not searching (server-side pagination)
                                    loadServices();
                                }
                            }}
                            totalItems={currentTab === 0 ? filteredServices.length : filteredAvailableTasks.length}
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
                                    startTransition(() => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    });
                                }}
                                size="small"
                                sx={{ minWidth: 250 }}
                            />

                            <Box sx={{ flexGrow: 1 }} />
                        </Toolbar>
                    </Paper>

                    {/* Available Tasks Table */}
                    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                        <Table size="medium" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }} width="5%">STT</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="12%">Loại công việc</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="25%">Tên Nhiệm vụ</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} width="38%">Mô tả</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="10%">Thời gian</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center" width="10%">Thao tác</TableCell>
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
                onClose={() => {
                    setServiceFormOpen(false);
                    setEditingService(null);
                    setSelectedTask(null);
                }}
                onSubmit={handleServiceFormSubmit}
                taskData={selectedTask}
                initialData={editingService}
                mode={editingService ? 'edit' : 'create'}
            />

            <ServiceDetailModal
                open={serviceDetailOpen}
                onClose={() => {
                    setServiceDetailOpen(false);
                    setSelectedService(null);
                }}
                service={selectedService}
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
                            setSelectedService(menuService);
                            setServiceDetailOpen(true);
                        }
                        setServiceMenuAnchor(null);
                        setMenuService(null);
                    }}
                >
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
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
