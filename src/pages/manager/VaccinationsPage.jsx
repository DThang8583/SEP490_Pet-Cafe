import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Avatar, Chip, Grid, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, IconButton, Tabs, Tab } from '@mui/material';
import { Vaccines, CheckCircle, Schedule, Visibility, Close, Pets, CalendarToday, Person, LocalHospital, MedicalServices, Event, Add } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import Pagination from '../../components/common/Pagination';
import VaccinationCalendar from '../../components/vaccination/VaccinationCalendar';
import VaccineTypesTab from './VaccineTypesTab';
import VaccinationScheduleModal from '../../components/modals/VaccinationScheduleModal';
import { vaccinationApi } from '../../api/vaccinationApi';
import petsApi from '../../api/petsApi';
import petSpeciesApi from '../../api/petSpeciesApi';
import petBreedsApi from '../../api/petBreedsApi';
import petGroupsApi from '../../api/petGroupsApi';

const VaccinationsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);
    const [vaccinationStats, setVaccinationStats] = useState(null);
    const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
    const [vaccinationRecords, setVaccinationRecords] = useState([]);
    const [pets, setPets] = useState([]);
    const [species, setSpecies] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [groups, setGroups] = useState([]);
    const [vaccineTypes, setVaccineTypes] = useState([]);

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

    // Pagination for upcoming vaccinations
    const [upcomingPage, setUpcomingPage] = useState(1);
    const [upcomingItemsPerPage, setUpcomingItemsPerPage] = useState(5);

    // Pagination for vaccination records
    const [recordsPage, setRecordsPage] = useState(1);
    const [recordsItemsPerPage, setRecordsItemsPerPage] = useState(5);

    // Load initial data
    useEffect(() => {
        loadVaccinationData();
    }, []);

    const loadVaccinationData = async () => {
        try {
            setIsLoading(true);

            // Load pets, species, breeds, groups, vaccine types data
            const [petsRes, speciesRes, breedsRes, groupsRes, vaccineTypesRes] = await Promise.all([
                petsApi.getAllPets({ page_size: 0, page_index: 0 }), // Get all pets for vaccination data
                petSpeciesApi.getAllSpecies({ page_size: 1000 }),
                petBreedsApi.getAllBreeds({ page_size: 1000 }),
                petGroupsApi.getAllGroups({ page_size: 1000 }),
                vaccinationApi.getVaccineTypes()
            ]);

            const petsData = petsRes?.data || [];
            const speciesData = speciesRes?.data || [];
            const breedsData = breedsRes?.data || [];
            const groupsData = groupsRes?.data || [];
            const vaccineTypesData = vaccineTypesRes.success ? vaccineTypesRes.data : [];

            setPets(petsData);
            setSpecies(speciesData);
            setBreeds(breedsData);
            setGroups(groupsData);
            setVaccineTypes(vaccineTypesData);

            // Then load vaccination data with pets data
            const [statsRes, upcomingRes, recordsRes] = await Promise.all([
                vaccinationApi.getVaccinationStats(),
                vaccinationApi.getUpcomingVaccinations(30, petsData),
                vaccinationApi.getVaccinationRecords(null, petsData)
            ]);

            if (statsRes.success) {
                setVaccinationStats(statsRes.data);
            }

            if (upcomingRes.success) {
                setUpcomingVaccinations(upcomingRes.data);
            }

            if (recordsRes.success) {
                setVaccinationRecords(recordsRes.data);
            }
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
                }
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
    const handleOpenScheduleModal = (schedule = null) => {
        setScheduleEditMode(!!schedule);
        setCurrentSchedule(schedule);
        setScheduleModalOpen(true);
    };

    // Handle close schedule modal
    const handleCloseScheduleModal = () => {
        setScheduleModalOpen(false);
        setScheduleEditMode(false);
        setCurrentSchedule(null);
    };

    // Handle create/update schedule
    const handleSaveSchedule = async (formData) => {
        try {
            setIsLoading(true);

            // Create schedule for single pet
            const scheduleData = {
                pet_id: formData.pet_id,
                vaccine_type_id: formData.vaccine_type_id,
                scheduled_date: new Date(formData.scheduled_date).toISOString(),
                notes: formData.notes
            };

            const response = await vaccinationApi.createVaccinationSchedule(scheduleData, pets);

            if (response.success) {
                await loadVaccinationData();
                handleCloseScheduleModal();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Tạo lịch tiêm thành công',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tạo lịch tiêm',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions to get names from IDs
    const getSpeciesName = (speciesId) => {
        const speciesObj = species.find(s => s.id === speciesId);
        return speciesObj ? speciesObj.name : '—';
    };

    const getBreedName = (breedId) => {
        const breedObj = breeds.find(b => b.id === breedId);
        return breedObj ? breedObj.name : '—';
    };

    // Paginated data for upcoming vaccinations
    const paginatedUpcomingVaccinations = useMemo(() => {
        const startIndex = (upcomingPage - 1) * upcomingItemsPerPage;
        const endIndex = startIndex + upcomingItemsPerPage;
        return upcomingVaccinations.slice(startIndex, endIndex);
    }, [upcomingVaccinations, upcomingPage, upcomingItemsPerPage]);

    const upcomingTotalPages = Math.ceil(upcomingVaccinations.length / upcomingItemsPerPage);

    // Paginated data for vaccination records
    const paginatedVaccinationRecords = useMemo(() => {
        const startIndex = (recordsPage - 1) * recordsItemsPerPage;
        const endIndex = startIndex + recordsItemsPerPage;
        return vaccinationRecords.slice(startIndex, endIndex);
    }, [vaccinationRecords, recordsPage, recordsItemsPerPage]);

    const recordsTotalPages = Math.ceil(vaccinationRecords.length / recordsItemsPerPage);

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
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Lịch tháng này */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}`, cursor: 'pointer' }} onClick={() => setCurrentTab(0)}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Lịch tháng này
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {(() => {
                                    const today = new Date();
                                    const currentMonth = today.getMonth();
                                    const currentYear = today.getFullYear();
                                    return upcomingVaccinations.filter(v => {
                                        const date = new Date(v.scheduled_date);
                                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                                    }).length;
                                })()}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Tổng loại vaccine */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}`, cursor: 'pointer' }} onClick={() => setCurrentTab(2)}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng loại vaccine
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {vaccinationStats?.total_vaccine_types || 0}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Tổng hồ sơ */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng hồ sơ
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {vaccinationRecords.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Đã tiêm */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Đã tiêm
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {vaccinationRecords.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Đã lên lịch */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}`, cursor: 'pointer' }} onClick={() => setCurrentTab(1)}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Đã lên lịch
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                {upcomingVaccinations.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Quá hạn */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Quá hạn
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                                {statusCounts.overdue}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

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
                            label={`Lịch tiêm sắp tới (${upcomingVaccinations.length})`}
                        />
                        <Tab
                            icon={<Vaccines />}
                            iconPosition="start"
                            label="Quản lý Vaccines"
                        />
                    </Tabs>
                </Paper>

                {/* Tab Content: Calendar View */}
                {currentTab === 0 && (
                    <VaccinationCalendar upcomingVaccinations={upcomingVaccinations} />
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
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Schedule sx={{ color: COLORS.WARNING[700], fontSize: 28 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                    Danh sách lịch tiêm sắp tới
                                </Typography>
                                <Chip
                                    label={upcomingVaccinations.length}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(COLORS.WARNING[600], 0.2),
                                        color: COLORS.WARNING[700],
                                        fontWeight: 600
                                    }}
                                />
                            </Stack>
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
                        </Stack>
                        {upcomingVaccinations.length > 0 ? (
                            <>
                                <Stack spacing={2}>
                                    {paginatedUpcomingVaccinations.map((item) => (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                background: alpha(COLORS.WARNING[50], 0.3),
                                                border: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 12px ${alpha(COLORS.WARNING[300], 0.2)}`,
                                                    border: `1px solid ${alpha(COLORS.WARNING[300], 0.5)}`
                                                }
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar
                                                    src={item.pet?.avatar}
                                                    alt={item.pet?.name}
                                                    sx={{ width: 50, height: 50 }}
                                                />
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                        {item.pet?.name} - {item.vaccine_type?.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        📅 Ngày: {new Date(item.scheduled_date).toLocaleDateString('vi-VN', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </Typography>
                                                    {item.notes && (
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            📝 {item.notes}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label="Đã lên lịch"
                                                        size="small"
                                                        sx={{
                                                            background: alpha(COLORS.WARNING[100], 0.7),
                                                            color: COLORS.WARNING[800],
                                                            fontWeight: 700
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewDetails(item)}
                                                        sx={{
                                                            background: alpha(COLORS.INFO[100], 0.5),
                                                            color: COLORS.INFO[700],
                                                            '&:hover': {
                                                                background: alpha(COLORS.INFO[200], 0.7)
                                                            }
                                                        }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                                <Pagination
                                    page={upcomingPage}
                                    totalPages={upcomingTotalPages}
                                    onPageChange={setUpcomingPage}
                                    itemsPerPage={upcomingItemsPerPage}
                                    onItemsPerPageChange={(newValue) => {
                                        setUpcomingItemsPerPage(newValue);
                                        setUpcomingPage(1);
                                    }}
                                    totalItems={upcomingVaccinations.length}
                                    itemsPerPageOptions={[5, 10, 15, 20]}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 3 }}>
                                Không có lịch tiêm nào sắp tới trong 30 ngày
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Tab Content: Vaccine Types Management */}
                {currentTab === 2 && (
                    <VaccineTypesTab species={species} />
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
                                                    {selectedPetDetails?.species_id ? getSpeciesName(selectedPetDetails.species_id) : '—'}
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
                                    <Stack direction="row" spacing={2}>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                            Tên vaccine
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700], lineHeight: 1.3 }}>
                                            {selectedItem.vaccine_type?.name || '—'}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                            Mức độ quan trọng
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                            {selectedItem.vaccine_type?.is_required ? 'Bắt buộc' : 'Không bắt buộc'}
                                        </Typography>
                                    </Stack>
                                    {selectedItem.vaccine_type?.interval_months && (
                                        <Stack direction="row" spacing={2}>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                Chu kỳ tiêm lại
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                {selectedItem.vaccine_type.interval_months} tháng
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" spacing={2}>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                            Mô tả vaccine
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY, lineHeight: 1.6, flex: 1 }}>
                                            {selectedItem.vaccine_type?.description || 'Không có mô tả'}
                                        </Typography>
                                    </Stack>
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
                                        {selectedItem.vaccination_date ? 'Thông tin tiêm phòng' : 'Lịch tiêm phòng'}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                    {selectedItem.vaccination_date ? (
                                        // Completed vaccination record
                                        <>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Ngày đã tiêm
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {new Date(selectedItem.vaccination_date).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Ngày cần tiêm lại
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {new Date(selectedItem.next_due_date).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Bác sĩ thú y
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedItem.veterinarian || '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Phòng khám
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {selectedItem.clinic_name || '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Lô vaccine
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5, fontFamily: 'monospace' }}>
                                                    {selectedItem.batch_number || '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Trạng thái tiêm lại
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 600,
                                                    lineHeight: 1.5,
                                                    color: (() => {
                                                        const status = getVaccinationStatus(selectedItem);
                                                        return status ? status.color[700] : 'inherit';
                                                    })()
                                                }}>
                                                    {(() => {
                                                        const status = getVaccinationStatus(selectedItem);
                                                        return status ? status.label : 'Còn thời gian';
                                                    })()}
                                                </Typography>
                                            </Stack>
                                        </>
                                    ) : (
                                        // Scheduled vaccination
                                        <>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Ngày tiêm dự kiến
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    {new Date(selectedItem.scheduled_date).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Trạng thái
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                    Đã lên lịch
                                                </Typography>
                                            </Stack>
                                        </>
                                    )}
                                    {selectedItem.notes && (
                                        <>
                                            <Divider sx={{ my: 0.5 }} />
                                            <Stack direction="row" spacing={2}>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: '160px', flexShrink: 0 }}>
                                                    Ghi chú
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
                groups={groups}
                vaccineTypes={vaccineTypes}
                isLoading={isLoading}
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

export default VaccinationsPage;

