import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Avatar, Chip, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, IconButton, Tabs, Tab, Menu, MenuItem, ListItemIcon, ListItemText, FormControl, InputLabel, Select, TextField, InputAdornment, Grid } from '@mui/material';
import { Vaccines, Schedule, Visibility, Close, Pets, CalendarToday, MedicalServices, Event, Add, MoreVert, Edit, Delete, Search } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import VaccinationCalendar from '../../components/vaccination/VaccinationCalendar';
import VaccinationScheduleModal from '../../components/modals/VaccinationScheduleModal';
import { vaccinationApi } from '../../api/vaccinationApi';
import vaccinationSchedulesApi from '../../api/vaccinationSchedulesApi';
import petsApi from '../../api/petsApi';
import petSpeciesApi from '../../api/petSpeciesApi';
import petBreedsApi from '../../api/petBreedsApi';
import teamApi from '../../api/teamApi';

const VaccinationsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);
    const [vaccinationStats, setVaccinationStats] = useState(null);
    const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
    const [allUpcomingVaccinations, setAllUpcomingVaccinations] = useState([]); // Store all data from API
    const [vaccinationRecords, setVaccinationRecords] = useState([]);
    const [pets, setPets] = useState([]);
    const [species, setSpecies] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [teams, setTeams] = useState([]);

    // Helper function to format scheduled_date without timezone conversion
    // Backend stores time as "fake UTC" representing local Vietnam time
    const formatScheduledDate = (isoString, includeTime = false) => {
        if (!isoString) return '—';

        // Extract date/time directly from string to avoid timezone issues
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (!match) return isoString;

        const [, year, month, day, hours, minutes] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        const dateStr = date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (includeTime) {
            return `${dateStr}, ${hours}:${minutes}`;
        }
        return dateStr;
    };

    // Helper for short format (DD/MM/YYYY HH:MM)
    const formatScheduledDateShort = (isoString) => {
        if (!isoString) return '—';

        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (!match) return isoString;

        const [, year, month, day, hours, minutes] = match;
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    };

    // Detail dialog
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedPetDetails, setSelectedPetDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Schedule modal
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [scheduleEditMode, setScheduleEditMode] = useState(false);

    // Menu for schedule actions
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuSchedule, setMenuSchedule] = useState(null);

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);

    // Pagination for upcoming vaccinations
    const [upcomingPage, setUpcomingPage] = useState(1);
    const [upcomingItemsPerPage, setUpcomingItemsPerPage] = useState(5);

    // Pagination for vaccination records
    const [recordsPage, setRecordsPage] = useState(1);
    const [recordsItemsPerPage, setRecordsItemsPerPage] = useState(5);

    // Search and filters for vaccination schedules
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPetId, setFilterPetId] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Separate state for date inputs to avoid triggering fetch while typing
    const [tempFromDate, setTempFromDate] = useState('');
    const [tempToDate, setTempToDate] = useState('');

    // Load initial data (all data including stats and records)
    useEffect(() => {
        loadAllVaccinationData();
    }, []);

    // Load only schedules data when filters change
    const loadSchedulesOnly = async () => {
        try {
            setIsLoading(true);

            // Load pets, species, breeds, teams data (only if not already loaded)
            if (pets.length === 0 || species.length === 0 || teams.length === 0) {
                const [petsRes, speciesRes, breedsRes, teamsRes] = await Promise.allSettled([
                    petsApi.getAllPets({ page: 0, limit: 1000 }),
                    petSpeciesApi.getAllSpecies({ page: 0, limit: 1000 }),
                    petBreedsApi.getAllBreeds({ page: 0, limit: 1000 }),
                    teamApi.getTeams({ page_index: 0, page_size: 1000 })
                ]);

                const petsData = petsRes.status === 'fulfilled' ? (petsRes.value?.data || []) : [];
                const speciesData = speciesRes.status === 'fulfilled' ? (speciesRes.value?.data || []) : [];
                const breedsData = breedsRes.status === 'fulfilled' ? (breedsRes.value?.data || []) : [];
                const teamsData = teamsRes.status === 'fulfilled' ? (teamsRes.value?.data || []) : [];

                setPets(petsData);
                setSpecies(speciesData);
                setBreeds(breedsData);
                setTeams(teamsData);
            }

            // Prepare filter params for API - Only use date/status filters, let client-side handle the rest
            const scheduleParams = {
                page: 0,
                limit: 1000
            };
            // Only use date and status filters from API, filter the rest client-side
            if (filterFromDate) {
                // filterFromDate should be in YYYY-MM-DD format from date input
                // Ensure it's valid before sending to API
                if (filterFromDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const fromDate = new Date(filterFromDate + 'T00:00:00');
                    if (!isNaN(fromDate.getTime())) {
                        scheduleParams.FromDate = fromDate.toISOString();
                    }
                }
            }
            if (filterToDate) {
                // filterToDate should be in YYYY-MM-DD format from date input
                if (filterToDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const toDate = new Date(filterToDate + 'T23:59:59');
                    if (!isNaN(toDate.getTime())) {
                        toDate.setHours(23, 59, 59, 999);
                        scheduleParams.ToDate = toDate.toISOString();
                    }
                }
            }
            if (filterStatus) {
                scheduleParams.Status = filterStatus;
            }

            // Load only vaccination schedules data for the table
            const upcomingRes = await vaccinationSchedulesApi.getAllVaccinationSchedules(scheduleParams);

            // Process schedules data - DO NOT FILTER HERE, store all data from API
            let upcomingData = upcomingRes?.data || [];

            // Debug: Log to check if all data is received
            console.log('📊 Vaccination Schedules from API:', {
                totalFromAPI: upcomingData.length,
                pagination: upcomingRes?.pagination,
                scheduleParams
            });

            // Populate pet data if not already included (use pets from state if available)
            const currentPets = pets.length > 0 ? pets : [];
            upcomingData = upcomingData.map(item => {
                // If pet object is incomplete or missing, try to find it from pets array
                if (item.pet_id && (!item.pet || !item.pet.image_url)) {
                    const fullPet = currentPets.find(p => p.id === item.pet_id);
                    if (fullPet) {
                        return {
                            ...item,
                            pet: {
                                ...item.pet,
                                ...fullPet,
                                image_url: fullPet.image || fullPet.image_url || fullPet.avatar || item.pet?.image_url || item.pet?.avatar
                            }
                        };
                    }
                }
                return item;
            });

            // Store ALL data from API without filtering - filtering will be done in useMemo
            setAllUpcomingVaccinations(upcomingData);
        } catch (error) {
            console.error('Error loading vaccination schedules:', error);
            setUpcomingVaccinations([]);
            setAllUpcomingVaccinations([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload only schedules data when filters change (excluding date inputs - they have separate handler)
    useEffect(() => {
        if (!isLoading) {
            loadSchedulesOnly();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filterPetId, filterStatus]);

    // Load all vaccination data (stats, schedules, records) - only on initial load
    const loadAllVaccinationData = async () => {
        try {
            setIsLoading(true);

            // Load pets, species, breeds, teams data
            const [petsRes, speciesRes, breedsRes, teamsRes] = await Promise.allSettled([
                petsApi.getAllPets({ page: 0, limit: 1000 }),
                petSpeciesApi.getAllSpecies({ page: 0, limit: 1000 }),
                petBreedsApi.getAllBreeds({ page: 0, limit: 1000 }),
                teamApi.getTeams({ page_index: 0, page_size: 1000 })
            ]);

            const petsData = petsRes.status === 'fulfilled' ? (petsRes.value?.data || []) : [];
            const speciesData = speciesRes.status === 'fulfilled' ? (speciesRes.value?.data || []) : [];
            const breedsData = breedsRes.status === 'fulfilled' ? (breedsRes.value?.data || []) : [];
            const teamsData = teamsRes.status === 'fulfilled' ? (teamsRes.value?.data || []) : [];

            setPets(petsData);
            setSpecies(speciesData);
            setBreeds(breedsData);
            setTeams(teamsData);

            // Load all vaccination data (stats, schedules, records)
            const [statsRes, upcomingRes, recordsRes] = await Promise.all([
                vaccinationApi.getVaccinationStats(),
                vaccinationSchedulesApi.getAllVaccinationSchedules({ page: 0, limit: 1000 }),
                vaccinationApi.getVaccinationRecords(null, petsData)
            ]);

            if (statsRes.success) {
                setVaccinationStats(statsRes.data);
            }

            if (recordsRes.success) {
                setVaccinationRecords(recordsRes.data);
            }

            // Process schedules data - DO NOT FILTER HERE, store all data from API
            let upcomingData = upcomingRes?.data || [];

            // Populate pet data if not already included
            upcomingData = upcomingData.map(item => {
                // If pet object is incomplete or missing, try to find it from pets array
                if (item.pet_id && (!item.pet || !item.pet.image_url)) {
                    const fullPet = petsData.find(p => p.id === item.pet_id);
                    if (fullPet) {
                        return {
                            ...item,
                            pet: {
                                ...item.pet,
                                ...fullPet,
                                image_url: fullPet.image || fullPet.image_url || fullPet.avatar || item.pet?.image_url || item.pet?.avatar
                            }
                        };
                    }
                }
                return item;
            });

            // Store ALL data from API without filtering - filtering will be done in useMemo
            setAllUpcomingVaccinations(upcomingData);
        } catch (error) {
            console.error('Error loading vaccination data:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu tiêm phòng',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };


    // Handle view details
    const handleViewDetails = async (item) => {
        try {
            setDetailLoading(true);
            setDetailDialogOpen(true);
            setSelectedItem(item);

            // Load full pet details
            if (item.pet?.id) {
                try {
                    const petData = await petsApi.getPetById(item.pet.id);
                    setSelectedPetDetails(petData);
                } catch (error) {
                    console.error('Error loading pet details:', error);
                    // Fallback to using pet data from item if API fails
                    if (item.pet) {
                        setSelectedPetDetails(item.pet);
                    }
                }
            } else if (item.pet) {
                // Use pet data directly from item if no ID
                setSelectedPetDetails(item.pet);
            }
        } catch (error) {
            console.error('Error loading details:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải thông tin chi tiết',
                type: 'error'
            });
        } finally {
            setDetailLoading(false);
        }
    };

    // Handle close detail dialog
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedItem(null);
        setSelectedPetDetails(null);
    };

    // Handle open schedule modal
    const handleOpenScheduleModal = async (schedule = null) => {
        if (schedule) {
            // If editing, fetch full schedule details to ensure we have all fields including team_id
            try {
                const fullScheduleResponse = await vaccinationSchedulesApi.getVaccinationScheduleById(schedule.id);
                const fullSchedule = fullScheduleResponse || schedule;

                // Debug: Log to see what API returns
                console.log('🔍 Fetched schedule detail from API:', {
                    scheduleId: schedule.id,
                    fullScheduleResponse,
                    team_id: fullSchedule.team_id,
                    team: fullSchedule.team,
                    allKeys: Object.keys(fullSchedule)
                });

                setCurrentSchedule(fullSchedule);
            } catch (error) {
                console.error('Error loading schedule details:', error);
                // Fallback to using schedule data from list
                console.log('⚠️ Using schedule data from list:', {
                    scheduleId: schedule.id,
                    team_id: schedule.team_id,
                    team: schedule.team
                });
                setCurrentSchedule(schedule);
            }
        } else {
            setCurrentSchedule(null);
        }
        setScheduleEditMode(!!schedule);
        setScheduleModalOpen(true);
    };

    // Handle close schedule modal
    const handleCloseScheduleModal = () => {
        setScheduleModalOpen(false);
        setScheduleEditMode(false);
        setCurrentSchedule(null);
    };

    // Handle delete schedule
    const handleDeleteSchedule = (schedule) => {
        setScheduleToDelete(schedule);
        setDeleteDialogOpen(true);
        setMenuAnchor(null);
        setMenuSchedule(null);
    };

    // Confirm delete schedule
    const confirmDeleteSchedule = async () => {
        if (!scheduleToDelete) return;

        try {
            setIsLoading(true);
            await vaccinationSchedulesApi.deleteVaccinationSchedule(scheduleToDelete.id);
            await loadSchedulesOnly();
            setDeleteDialogOpen(false);
            setScheduleToDelete(null);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa lịch tiêm thành công',
                type: 'success'
            });
        } catch (error) {
            console.error('Error deleting schedule:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa lịch tiêm',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle create/update schedule
    const handleSaveSchedule = async (formData) => {
        try {
            setIsLoading(true);

            // Prepare schedule data according to API specification
            const scheduleData = {
                pet_id: formData.pet_id,
                scheduled_date: formData.scheduled_date, // Already in ISO format from modal
                notes: formData.notes || '',
                team_id: formData.team_id || null // API accepts team_id, send null if empty
            };

            let response;
            if (scheduleEditMode && currentSchedule) {
                // Update existing schedule - include all fields that can be updated
                const updateData = {
                    pet_id: scheduleData.pet_id,
                    scheduled_date: scheduleData.scheduled_date,
                    notes: scheduleData.notes,
                    team_id: scheduleData.team_id,
                    status: formData.status || currentSchedule.status // Include status for update
                };
                response = await vaccinationSchedulesApi.updateVaccinationSchedule(currentSchedule.id, updateData);
            } else {
                // Create new schedule
                response = await vaccinationSchedulesApi.createVaccinationSchedule(scheduleData);
            }

            if (response.success) {
                await loadSchedulesOnly();
                handleCloseScheduleModal();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || (scheduleEditMode ? 'Cập nhật lịch tiêm thành công' : 'Tạo lịch tiêm thành công'),
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu lịch tiêm',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Helper functions to get names from IDs
    const getSpeciesName = (speciesId) => {
        const speciesObj = species.find(s => s.id === speciesId);
        return speciesObj ? capitalizeName(speciesObj.name) : '—';
    };

    const getBreedName = (breedId) => {
        const breedObj = breeds.find(b => b.id === breedId);
        return breedObj ? breedObj.name : '—';
    };

    // Filter upcomingVaccinations based on all filters (client-side)
    const filteredUpcomingVaccinations = useMemo(() => {
        let filtered = [...allUpcomingVaccinations];

        // Filter by search query
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const petName = item.pet?.name?.toLowerCase() || '';
                const notes = item.notes?.toLowerCase() || '';
                return petName.includes(searchLower) ||
                    notes.includes(searchLower);
            });
        }

        // Filter by pet
        if (filterPetId) {
            filtered = filtered.filter(item => {
                const itemPetId = item.pet_id || item.pet?.id;
                return itemPetId === filterPetId;
            });
        }

        // Filter by status
        if (filterStatus) {
            filtered = filtered.filter(item => {
                return item.status === filterStatus;
            });
        }

        // Filter by date range (client-side only)
        if (filterFromDate && filterFromDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Extract date directly from ISO string to avoid timezone conversion
                filtered = filtered.filter(item => {
                    if (!item.scheduled_date) return false;
                const match = item.scheduled_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!match) return false;
                const [, year, month, day] = match;
                const scheduledDateStr = `${year}-${month}-${day}`;
                return scheduledDateStr >= filterFromDate;
                });
        }

        if (filterToDate && filterToDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Extract date directly from ISO string to avoid timezone conversion
                filtered = filtered.filter(item => {
                    if (!item.scheduled_date) return false;
                const match = item.scheduled_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!match) return false;
                const [, year, month, day] = match;
                const scheduledDateStr = `${year}-${month}-${day}`;
                return scheduledDateStr <= filterToDate;
                });
        }

        // Sort by closest date (nearest first)
        const now = new Date();
        const sorted = filtered
            .map(item => ({
                ...item,
                timeDiff: Math.abs(new Date(item.scheduled_date) - now)
            }))
            .sort((a, b) => a.timeDiff - b.timeDiff)
            .map(({ timeDiff, ...item }) => item);

        // Debug: Log filtered results
        if (filterPetId || filterStatus || filterFromDate || filterToDate || searchQuery) {
            console.log('🔍 Filtered vaccination schedules:', {
                total: sorted.length,
                filters: {
                    petId: filterPetId,
                    status: filterStatus,
                    fromDate: filterFromDate,
                    toDate: filterToDate,
                    search: searchQuery
                }
            });
        }

        return sorted;
    }, [allUpcomingVaccinations, searchQuery, filterPetId, filterStatus, filterFromDate, filterToDate]);

    // Paginated data for upcoming vaccinations
    const paginatedUpcomingVaccinations = useMemo(() => {
        const startIndex = (upcomingPage - 1) * upcomingItemsPerPage;
        const endIndex = startIndex + upcomingItemsPerPage;
        return filteredUpcomingVaccinations.slice(startIndex, endIndex);
    }, [filteredUpcomingVaccinations, upcomingPage, upcomingItemsPerPage]);

    const upcomingTotalPages = Math.ceil(filteredUpcomingVaccinations.length / upcomingItemsPerPage);

    // Paginated data for vaccination records
    const paginatedVaccinationRecords = useMemo(() => {
        const startIndex = (recordsPage - 1) * recordsItemsPerPage;
        const endIndex = startIndex + recordsItemsPerPage;
        return vaccinationRecords.slice(startIndex, endIndex);
    }, [vaccinationRecords, recordsPage, recordsItemsPerPage]);

    const recordsTotalPages = Math.ceil(vaccinationRecords.length / recordsItemsPerPage);

    // Helper function to get status label in Vietnamese
    const getStatusLabel = (status) => {
        const statusMap = {
            'PENDING': 'Đã lên lịch',
            'COMPLETED': 'Đã hoàn thành',
            'CANCELLED': 'Đã hủy',
            'IN_PROGRESS': 'Đang thực hiện'
        };
        return statusMap[status] || status;
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        const colorMap = {
            'PENDING': { bg: COLORS.WARNING[100], color: COLORS.WARNING[800] },
            'COMPLETED': { bg: COLORS.SUCCESS[100], color: COLORS.SUCCESS[800] },
            'CANCELLED': { bg: COLORS.ERROR[100], color: COLORS.ERROR[800] },
            'IN_PROGRESS': { bg: COLORS.INFO[100], color: COLORS.INFO[800] }
        };
        return colorMap[status] || { bg: COLORS.WARNING[100], color: COLORS.WARNING[800] };
    };

    // Get vaccination status based on next_due_date
    const getVaccinationStatus = (record) => {
        if (!record.next_due_date) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDueDate = new Date(record.next_due_date);
        nextDueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.floor((nextDueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            // Overdue
            return {
                label: `Quá hạn ${Math.abs(daysUntilDue)} ngày`,
                color: COLORS.ERROR,
                icon: '🚨'
            };
        } else if (daysUntilDue === 0) {
            return {
                label: 'Đến hạn hôm nay',
                color: COLORS.ERROR,
                icon: '⚠️'
            };
        } else if (daysUntilDue <= 7) {
            return {
                label: `Còn ${daysUntilDue} ngày`,
                color: COLORS.ERROR,
                icon: '⚠️'
            };
        } else if (daysUntilDue <= 30) {
            return {
                label: `Còn ${daysUntilDue} ngày`,
                color: COLORS.WARNING,
                icon: '⏰'
            };
        } else if (daysUntilDue <= 90) {
            return {
                label: `Còn ${daysUntilDue} ngày`,
                color: COLORS.INFO,
                icon: '📅'
            };
        } else {
            return {
                label: 'Còn thời gian',
                color: COLORS.SUCCESS,
                icon: '✅'
            };
        }
    };

    // Count overdue records
    const statusCounts = useMemo(() => {
        let overdue = 0;

        vaccinationRecords.forEach(record => {
            const status = getVaccinationStatus(record);
            if (status && status.label.includes('Quá hạn')) {
                overdue++;
            }
        });

        return { overdue };
    }, [vaccinationRecords]);

    if (isLoading) {
        return <Loading message="Đang tải dữ liệu tiêm phòng..." fullScreen />;
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Vaccines sx={{ fontSize: 40, color: COLORS.PRIMARY[500] }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.PRIMARY[600] }}>
                        Quản lý tiêm phòng
                    </Typography>
                </Stack>

                {/* Status Badges */}
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
                        {
                            label: 'Lịch tháng này',
                            value: (() => {
                                const today = new Date();
                                const currentMonth = today.getMonth();
                                const currentYear = today.getFullYear();
                                return upcomingVaccinations.filter(v => {
                                    const date = new Date(v.scheduled_date);
                                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                                }).length;
                            })(),
                            color: COLORS.INFO[500],
                            valueColor: COLORS.INFO[700],
                            onClick: () => setCurrentTab(0),
                            cursor: 'pointer'
                        },
                        {
                            label: 'Tổng hồ sơ',
                            value: vaccinationRecords.length,
                            color: COLORS.INFO[500],
                            valueColor: COLORS.INFO[700]
                        },
                        {
                            label: 'Đã tiêm',
                            value: vaccinationRecords.length,
                            color: COLORS.SUCCESS[500],
                            valueColor: COLORS.SUCCESS[700]
                        },
                        {
                            label: 'Đã lên lịch',
                            value: filteredUpcomingVaccinations.length,
                            color: COLORS.WARNING[500],
                            valueColor: COLORS.WARNING[700],
                            onClick: () => setCurrentTab(1),
                            cursor: 'pointer'
                        },
                        {
                            label: 'Quá hạn',
                            value: statusCounts.overdue,
                            color: COLORS.ERROR[500],
                            valueColor: COLORS.ERROR[700]
                        }
                    ].map((stat, index) => {
                        const cardWidth = `calc((100% - ${5 * 16}px) / 6)`;
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
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`,
                                    cursor: stat.cursor || 'default',
                                    '&:hover': stat.onClick ? {
                                        boxShadow: `0 4px 12px ${alpha(stat.color, 0.2)}`,
                                        transform: 'translateY(-2px)',
                                        transition: 'all 0.2s ease'
                                    } : {}
                                }} onClick={stat.onClick}>
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
                <Paper
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.3)}`,
                        boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[200], 0.15)}`,
                        mb: 3,
                        overflow: 'hidden'
                    }}
                >
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{
                            background: alpha(COLORS.PRIMARY[50], 0.3),
                            borderBottom: `2px solid ${alpha(COLORS.PRIMARY[200], 0.3)}`,
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                fontSize: '1rem',
                                textTransform: 'none',
                                minHeight: 60,
                                color: COLORS.TEXT.SECONDARY,
                                '&.Mui-selected': {
                                    color: COLORS.PRIMARY[700]
                                }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                backgroundColor: COLORS.PRIMARY[600]
                            }
                        }}
                    >
                        <Tab
                            icon={<Event />}
                            iconPosition="start"
                            label="Lịch theo tháng"
                        />
                        <Tab
                            icon={<Schedule />}
                            iconPosition="start"
                            label={`Lịch tiêm sắp tới (${filteredUpcomingVaccinations.length})`}
                        />
                    </Tabs>
                </Paper>

                {/* Tab Content: Calendar View */}
                {currentTab === 0 && (
                    <VaccinationCalendar upcomingVaccinations={filteredUpcomingVaccinations} />
                )}

                {/* Tab Content: Upcoming Vaccinations */}
                {currentTab === 1 && (
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`,
                            boxShadow: `0 10px 24px ${alpha(COLORS.WARNING[200], 0.15)}`
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                            <Schedule sx={{ color: COLORS.WARNING[700], fontSize: 28 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                Danh sách lịch tiêm sắp tới
                            </Typography>
                            <Chip
                                label={filteredUpcomingVaccinations.length}
                                size="small"
                                sx={{
                                    bgcolor: alpha(COLORS.WARNING[600], 0.2),
                                    color: COLORS.WARNING[700],
                                    fontWeight: 600
                                }}
                            />
                        </Stack>

                        {/* Search and Filters - Row 1 */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                alignItems: 'center'
                            }}
                        >
                            <TextField
                                placeholder="Tìm kiếm lịch tiêm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="small"
                                sx={{ flex: 1, minWidth: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: COLORS.TEXT.SECONDARY }} />
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <FormControl size="small" sx={{ minWidth: 250 }}>
                                <InputLabel shrink>Thú cưng</InputLabel>
                                <Select
                                    value={filterPetId}
                                    onChange={(e) => setFilterPetId(e.target.value)}
                                    label="Thú cưng"
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (!selected || selected === '') {
                                            return 'Tất cả';
                                        }
                                        const pet = pets.find(p => p.id === selected);
                                        return pet ? pet.name : '';
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Tất cả</em>
                                    </MenuItem>
                                    {pets.map(pet => (
                                        <MenuItem key={pet.id} value={pet.id}>
                                            {pet.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>


                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenScheduleModal()}
                                sx={{
                                    bgcolor: COLORS.WARNING[500],
                                    color: '#fff',
                                    fontWeight: 700,
                                    px: 3,
                                    '&:hover': {
                                        bgcolor: COLORS.WARNING[600]
                                    }
                                }}
                            >
                                Tạo lịch tiêm
                            </Button>
                        </Box>

                        {/* Search and Filters - Row 2 */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                mb: 3,
                                alignItems: 'center'
                            }}
                        >
                            <TextField
                                size="small"
                                type="date"
                                label="Từ ngày"
                                value={tempFromDate || filterFromDate}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTempFromDate(value);
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                        setFilterFromDate(value);
                                        setTempFromDate('');
                                    } else if (value === '') {
                                        setFilterFromDate('');
                                        setTempFromDate('');
                                    } else {
                                        // Invalid format, reset to previous value
                                        setTempFromDate('');
                                    }
                                }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    max: filterToDate || tempToDate || undefined
                                }}
                                sx={{ minWidth: 250 }}
                            />

                            <TextField
                                size="small"
                                type="date"
                                label="Đến ngày"
                                value={tempToDate || filterToDate}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTempToDate(value);
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                        setFilterToDate(value);
                                        setTempToDate('');
                                    } else if (value === '') {
                                        setFilterToDate('');
                                        setTempToDate('');
                                    } else {
                                        // Invalid format, reset to previous value
                                        setTempToDate('');
                                    }
                                }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: filterFromDate || tempFromDate || undefined
                                }}
                                sx={{ minWidth: 250 }}
                            />

                            <FormControl size="small" sx={{ minWidth: 250 }}>
                                <InputLabel shrink>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (!selected || selected === '') {
                                            return 'Tất cả';
                                        }
                                        return getStatusLabel(selected);
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Tất cả</em>
                                    </MenuItem>
                                    <MenuItem value="PENDING">Đã lên lịch</MenuItem>
                                    <MenuItem value="IN_PROGRESS">Đang thực hiện</MenuItem>
                                    <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
                                    <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {filteredUpcomingVaccinations.length > 0 ? (
                            <>
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
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>Thú cưng</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Ngày tiêm dự kiến</TableCell>
                                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Ngày hoàn thành</TableCell>
                                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Ghi chú</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedUpcomingVaccinations.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    hover
                                                    sx={{
                                                        '&:hover': {
                                                            background: alpha(COLORS.WARNING[50], 0.3)
                                                        }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Avatar
                                                                src={item.pet?.image_url || item.pet?.avatar}
                                                                alt={item.pet?.name}
                                                                sx={{ width: 40, height: 40 }}
                                                            >
                                                                <Pets />
                                                            </Avatar>
                                                            <Typography sx={{ fontWeight: 600 }}>{item.pet?.name || '—'}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatScheduledDateShort(item.scheduled_date)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                        {item.completed_date ? (
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                                                {new Date(item.completed_date).toLocaleDateString('vi-VN', {
                                                                    year: 'numeric',
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.DISABLED, fontStyle: 'italic' }}>
                                                                Chưa hoàn thành
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, maxWidth: 400 }}>
                                                            {item.notes || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={getStatusLabel(item.status)}
                                                            size="small"
                                                            sx={{
                                                                background: alpha(getStatusColor(item.status).bg, 0.7),
                                                                color: getStatusColor(item.status).color,
                                                                fontWeight: 700
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                setMenuAnchor(e.currentTarget);
                                                                setMenuSchedule(item);
                                                            }}
                                                            sx={{
                                                                color: COLORS.INFO[700],
                                                                '&:hover': {
                                                                    background: alpha(COLORS.INFO[100], 0.5)
                                                                }
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
                                <Box sx={{ mt: 2 }}>
                                    <Pagination
                                        page={upcomingPage}
                                        totalPages={upcomingTotalPages}
                                        onPageChange={setUpcomingPage}
                                        itemsPerPage={upcomingItemsPerPage}
                                        onItemsPerPageChange={(newValue) => {
                                            setUpcomingItemsPerPage(newValue);
                                            setUpcomingPage(1);
                                        }}
                                        totalItems={filteredUpcomingVaccinations.length}
                                        itemsPerPageOptions={[5, 10, 15, 20]}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Schedule sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                                <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                                    Không có lịch tiêm nào
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Thử tạo lịch tiêm mới hoặc thay đổi bộ lọc
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}

            </Box>

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetailDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.PRIMARY[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: COLORS.INFO[500],
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        py: 2.5,
                        position: 'relative'
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <MedicalServices sx={{ fontSize: 32 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                            Chi tiết tiêm phòng
                        </Typography>
                        <IconButton
                            onClick={handleCloseDetailDialog}
                            sx={{
                                color: '#fff',
                                '&:hover': {
                                    background: alpha('#fff', 0.2)
                                }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    {detailLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Loading message="Đang tải thông tin chi tiết..." />
                        </Box>
                    ) : selectedItem && (
                        <Stack spacing={3}>
                            {/* Pet Information */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.PRIMARY[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Pets sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                        Thông tin thú cưng
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Avatar
                                                src={selectedPetDetails?.image_url || selectedPetDetails?.avatar || selectedItem.pet?.avatar}
                                                alt={selectedPetDetails?.name || selectedItem.pet?.name}
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    margin: '0 auto',
                                                    border: `3px solid ${COLORS.PRIMARY[300]}`,
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Tên thú cưng
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], lineHeight: 1.3 }}>
                                                    {selectedPetDetails?.name || selectedItem.pet?.name || '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Loài
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {(() => {
                                                        // Try to get species name from various sources (priority order)
                                                        // 1. From selectedPetDetails.species.name (nested object from API)
                                                        if (selectedPetDetails?.species?.name) {
                                                            return capitalizeName(selectedPetDetails.species.name);
                                                        }
                                                        // 2. From selectedItem.pet.species.name (nested object from schedule)
                                                        if (selectedItem?.pet?.species?.name) {
                                                            return capitalizeName(selectedItem.pet.species.name);
                                                        }
                                                        // 3. From selectedPetDetails.species_id (using helper function with species state)
                                                        if (selectedPetDetails?.species_id) {
                                                            const speciesName = getSpeciesName(selectedPetDetails.species_id);
                                                            if (speciesName !== '—') {
                                                                return speciesName;
                                                            }
                                                        }
                                                        // 4. From selectedItem.pet.species_id (using helper function from schedule)
                                                        if (selectedItem?.pet?.species_id) {
                                                            const speciesName = getSpeciesName(selectedItem.pet.species_id);
                                                            if (speciesName !== '—') {
                                                                return speciesName;
                                                            }
                                                        }
                                                        // 5. Try to find in pets array (from loaded pets data)
                                                        const petFromList = pets.find(p =>
                                                            p.id === selectedPetDetails?.id ||
                                                            p.id === selectedItem?.pet?.id
                                                        );
                                                        if (petFromList?.species?.name) {
                                                            return capitalizeName(petFromList.species.name);
                                                        }
                                                        if (petFromList?.species_id) {
                                                            const speciesName = getSpeciesName(petFromList.species_id);
                                                            if (speciesName !== '—') {
                                                                return speciesName;
                                                            }
                                                        }
                                                        return '—';
                                                    })()}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Giống
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.breed_id ? getBreedName(selectedPetDetails.breed_id) : '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Giới tính
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.gender === 'Male' ? 'Đực' : selectedPetDetails?.gender === 'Female' ? 'Cái' : '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Tuổi
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.age ? `${selectedPetDetails.age} tuổi` : '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Cân nặng
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.weight ? `${selectedPetDetails.weight} kg` : '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Màu sắc
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.color || '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    Ngày đến quán
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedPetDetails?.arrival_date
                                                        ? new Date(selectedPetDetails.arrival_date).toLocaleDateString('vi-VN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })
                                                        : '—'}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12}>
                                        {selectedPetDetails?.preferences && (
                                            <>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                        Sở thích & Lưu ý
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: COLORS.TEXT.PRIMARY, flex: 1 }}>
                                                        {selectedPetDetails.preferences}
                                                    </Typography>
                                                </Stack>
                                            </>
                                        )}
                                        {selectedPetDetails?.special_notes && (
                                            <Stack direction="row" spacing={2} sx={{ mt: selectedPetDetails?.preferences ? 1.5 : 0 }}>
                                                <Typography variant="caption" sx={{ color: COLORS.WARNING[800], fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, width: '140px', flexShrink: 0 }}>
                                                    ⚠️ Ghi chú đặc biệt
                                                </Typography>
                                                <Typography variant="body2" sx={{ lineHeight: 1.6, color: COLORS.WARNING[900], fontWeight: 600, flex: 1 }}>
                                                    {selectedPetDetails.special_notes}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Vaccine Information */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.SUCCESS[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Vaccines sx={{ color: COLORS.SUCCESS[600], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                        Thông tin vaccine
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                </Stack>
                            </Paper>

                            {/* Vaccination Details */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.WARNING[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <CalendarToday sx={{ color: COLORS.WARNING[600], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                        Thông tin lịch tiêm phòng
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                    {/* Scheduled Date */}
                                    <Stack direction="row" spacing={2}>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                            Ngày tiêm dự kiến
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                            {formatScheduledDate(selectedItem.scheduled_date, true)}
                                        </Typography>
                                    </Stack>

                                    {/* Status */}
                                    <Stack direction="row" spacing={2}>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                            Trạng thái
                                        </Typography>
                                        <Chip
                                            label={getStatusLabel(selectedItem.status)}
                                            size="small"
                                            sx={{
                                                background: alpha(getStatusColor(selectedItem.status).bg, 0.7),
                                                color: getStatusColor(selectedItem.status).color,
                                                fontWeight: 700
                                            }}
                                        />
                                    </Stack>

                                    {/* Completed Date */}
                                    {selectedItem.completed_date && (
                                        <Stack direction="row" spacing={2}>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                Ngày hoàn thành
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                {new Date(selectedItem.completed_date).toLocaleDateString('vi-VN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Typography>
                                        </Stack>
                                    )}

                                    {/* Record Information (if completed) */}
                                    {selectedItem.record && (
                                        <>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700], mb: 1 }}>
                                                Thông tin tiêm phòng
                                            </Typography>

                                            {/* Vaccination Date from Record */}
                                            {selectedItem.record.vaccination_date && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                        Ngày đã tiêm
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                        {new Date(selectedItem.record.vaccination_date).toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Stack>
                                            )}

                                            {/* Next Due Date */}
                                            {selectedItem.record.next_due_date && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                        Ngày cần tiêm lại
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                        {new Date(selectedItem.record.next_due_date).toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Stack>
                                            )}

                                            {/* Veterinarian */}
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Bác sĩ thú y
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5, flex: 1 }}>
                                                    {selectedItem.record.veterinarian || '—'}
                                                </Typography>
                                            </Stack>

                                            {/* Clinic Name */}
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Phòng khám
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5, flex: 1 }}>
                                                    {selectedItem.record.clinic_name || '—'}
                                                </Typography>
                                            </Stack>

                                            {/* Batch Number */}
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Lô vaccine
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5, flex: 1 }}>
                                                    {selectedItem.record.batch_number || '—'}
                                                </Typography>
                                            </Stack>

                                            {/* Notes from Record */}
                                            {selectedItem.record.notes && (
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                        Ghi chú tiêm phòng
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: COLORS.TEXT.PRIMARY, flex: 1 }}>
                                                        {selectedItem.record.notes}
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </>
                                    )}

                                    {/* Notes from Schedule */}
                                    {selectedItem.notes && (
                                        <>
                                            <Divider sx={{ my: 1 }} />
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Ghi chú lịch tiêm
                                                </Typography>
                                                <Typography variant="body2" sx={{ lineHeight: 1.6, color: COLORS.TEXT.PRIMARY, flex: 1 }}>
                                                    {selectedItem.notes}
                                                </Typography>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                    <Button
                        onClick={handleCloseDetailDialog}
                        variant="contained"
                        sx={{
                            bgcolor: COLORS.INFO[500],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: COLORS.INFO[600]
                            }
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Vaccination Schedule Modal */}
            <VaccinationScheduleModal
                isOpen={scheduleModalOpen}
                onClose={handleCloseScheduleModal}
                onSubmit={handleSaveSchedule}
                editMode={scheduleEditMode}
                initialData={currentSchedule}
                pets={pets}
                species={species}
                teams={teams}
                isLoading={isLoading}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setScheduleToDelete(null);
                }}
                onConfirm={confirmDeleteSchedule}
                title="Xóa lịch tiêm"
                message={`Bạn có chắc chắn muốn xóa lịch tiêm cho "${scheduleToDelete?.pet?.name || '—'}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
                isLoading={isLoading}
            />

            {/* Schedule Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuSchedule(null);
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
                        if (menuSchedule) {
                            handleViewDetails(menuSchedule);
                        }
                        setMenuAnchor(null);
                        setMenuSchedule(null);
                    }}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuSchedule) {
                            handleOpenScheduleModal(menuSchedule);
                        }
                        setMenuAnchor(null);
                        setMenuSchedule(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.WARNING[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuSchedule) {
                            handleDeleteSchedule(menuSchedule);
                        }
                    }}
                >
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>

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

export default VaccinationsPage;