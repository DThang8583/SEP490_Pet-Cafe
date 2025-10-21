import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Avatar, Chip, Grid, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, IconButton, Tabs, Tab } from '@mui/material';
import { Vaccines, CheckCircle, Schedule, Visibility, Close, Pets, CalendarToday, Person, LocalHospital, MedicalServices, Event } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import Pagination from '../../components/common/Pagination';
import VaccinationCalendar from '../../components/vaccination/VaccinationCalendar';
import { vaccinationApi } from '../../api/vaccinationApi';
import { petApi, MOCK_PET_SPECIES, MOCK_PET_BREEDS } from '../../api/petApi';

const VaccinationsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);
    const [vaccinationStats, setVaccinationStats] = useState(null);
    const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
    const [vaccinationRecords, setVaccinationRecords] = useState([]);
    const [pets, setPets] = useState([]);
    const [species, setSpecies] = useState([]);
    const [breeds, setBreeds] = useState([]);

    // Detail dialog
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedPetDetails, setSelectedPetDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

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

            // Load pets, species, breeds data
            const [petsRes, speciesRes, breedsRes] = await Promise.all([
                petApi.getPets(),
                petApi.getPetSpecies(),
                petApi.getPetBreeds()
            ]);

            const petsData = petsRes.success ? petsRes.data : [];
            const speciesData = speciesRes.success ? speciesRes.data : [];
            const breedsData = breedsRes.success ? breedsRes.data : [];

            setPets(petsData);
            setSpecies(speciesData);
            setBreeds(breedsData);

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
                const petRes = await petApi.getPetById(item.pet.id);
                if (petRes.success) {
                    setSelectedPetDetails(petRes.data);
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
                        <Paper
                            elevation={0}
                            onClick={() => setCurrentTab(0)}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.9)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.INFO[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.INFO[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.INFO[300], 0.4)}`,
                                    border: `2px solid ${COLORS.INFO[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.INFO[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Lịch tháng này
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.INFO[700], fontWeight: 900, lineHeight: 1 }}>
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
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.INFO[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Event sx={{ fontSize: 32, color: COLORS.INFO[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Tổng loại vaccine */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.9)} 0%, ${alpha(COLORS.PRIMARY[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.PRIMARY[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.PRIMARY[300], 0.4)}`,
                                    border: `2px solid ${COLORS.PRIMARY[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Tổng loại vaccine
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.PRIMARY[700], fontWeight: 900, lineHeight: 1 }}>
                                        {vaccinationStats?.total_vaccine_types || 0}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.PRIMARY[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Vaccines sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Tổng hồ sơ */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.9)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.INFO[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.INFO[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.INFO[300], 0.4)}`,
                                    border: `2px solid ${COLORS.INFO[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.INFO[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Tổng hồ sơ
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.INFO[700], fontWeight: 900, lineHeight: 1 }}>
                                        {vaccinationRecords.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.INFO[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <CheckCircle sx={{ fontSize: 32, color: COLORS.INFO[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Đã tiêm */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper
                            elevation={0}
                            onClick={() => setCurrentTab(2)}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.9)} 0%, ${alpha(COLORS.SUCCESS[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.SUCCESS[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.SUCCESS[300], 0.4)}`,
                                    border: `2px solid ${COLORS.SUCCESS[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Đã tiêm
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.SUCCESS[700], fontWeight: 900, lineHeight: 1 }}>
                                        {vaccinationRecords.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.SUCCESS[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <CheckCircle sx={{ fontSize: 32, color: COLORS.SUCCESS[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Đã lên lịch */}
                    <Grid item xs={12} sm={6} md={2}>
                        <Paper
                            elevation={0}
                            onClick={() => setCurrentTab(1)}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.9)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100%)`,
                                border: `2px solid ${COLORS.WARNING[200]}`,
                                boxShadow: `0 4px 12px ${alpha(COLORS.WARNING[200], 0.3)}`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.WARNING[300], 0.4)}`,
                                    border: `2px solid ${COLORS.WARNING[300]}`
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.WARNING[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Đã lên lịch
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.WARNING[700], fontWeight: 900, lineHeight: 1 }}>
                                        {upcomingVaccinations.length}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: alpha(COLORS.WARNING[200], 0.4),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Schedule sx={{ fontSize: 32, color: COLORS.WARNING[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Quá hạn */}
                    <Grid item xs={12} sm={6} md={2}>
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
                                        Quá hạn
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.ERROR[700], fontWeight: 900, lineHeight: 1 }}>
                                        {statusCounts.overdue}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>🚨</Typography>
                                </Box>
                            </Stack>
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
                            icon={<CheckCircle />}
                            iconPosition="start"
                            label={`Hồ sơ đã thực hiện (${vaccinationRecords.length})`}
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
                            boxShadow: `0 10px 24px ${alpha(COLORS.WARNING[200], 0.15)}`,
                            mb: 3
                        }}
                    >
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

                {/* Tab Content: Vaccination Records */}
                {currentTab === 2 && (
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`,
                            boxShadow: `0 10px 24px ${alpha(COLORS.SUCCESS[200], 0.15)}`
                        }}
                    >
                        {vaccinationRecords.length > 0 ? (
                            <>
                                <TableContainer
                                    sx={{
                                        borderRadius: 2,
                                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                        overflowX: 'auto'
                                    }}
                                >
                                    <Table size="medium" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Thú cưng</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Vaccine</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Ngày tiêm</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Ngày tiêm lại</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', sm: 'table-cell' } }}>Bác sĩ</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Phòng khám</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', xl: 'table-cell' } }}>Lô vaccine</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Ghi chú</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Trạng thái</TableCell>
                                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.SUCCESS[50], 0.5) }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedVaccinationRecords.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    hover
                                                    sx={{
                                                        '&:hover': {
                                                            background: alpha(COLORS.SUCCESS[50], 0.3)
                                                        }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Avatar
                                                                src={record.pet?.avatar}
                                                                alt={record.pet?.name}
                                                                sx={{ width: 40, height: 40 }}
                                                            />
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                                                    {record.pet?.name || '—'}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {record.pet?.species || ''}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                            {record.vaccine_type?.name || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                        <Typography variant="body2">
                                                            {new Date(record.vaccination_date).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                        <Typography variant="body2" sx={{ color: COLORS.WARNING[700], fontWeight: 600 }}>
                                                            {new Date(record.next_due_date).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                                        <Typography variant="body2">
                                                            {record.veterinarian || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                        <Typography variant="body2">
                                                            {record.clinic_name || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                                                        <Chip
                                                            label={record.batch_number || '—'}
                                                            size="small"
                                                            sx={{
                                                                background: alpha(COLORS.INFO[100], 0.5),
                                                                color: COLORS.INFO[800],
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, maxWidth: 200 }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: COLORS.TEXT.SECONDARY,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                display: 'block'
                                                            }}
                                                        >
                                                            {record.notes || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const status = getVaccinationStatus(record);
                                                            if (!status) {
                                                                return (
                                                                    <Chip
                                                                        label="Hoàn thành"
                                                                        size="small"
                                                                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                                                        sx={{
                                                                            background: alpha(COLORS.SUCCESS[100], 0.7),
                                                                            color: COLORS.SUCCESS[800],
                                                                            fontWeight: 700,
                                                                            fontSize: '0.75rem'
                                                                        }}
                                                                    />
                                                                );
                                                            }
                                                            return (
                                                                <Chip
                                                                    label={status.label}
                                                                    size="small"
                                                                    icon={<span style={{ fontSize: '14px' }}>{status.icon}</span>}
                                                                    sx={{
                                                                        background: alpha(status.color[100], 0.7),
                                                                        color: status.color[800],
                                                                        fontWeight: 700,
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewDetails(record)}
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
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Pagination
                                    page={recordsPage}
                                    totalPages={recordsTotalPages}
                                    onPageChange={setRecordsPage}
                                    itemsPerPage={recordsItemsPerPage}
                                    onItemsPerPageChange={(newValue) => {
                                        setRecordsItemsPerPage(newValue);
                                        setRecordsPage(1);
                                    }}
                                    totalItems={vaccinationRecords.length}
                                    itemsPerPageOptions={[5, 10, 20, 50]}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 3 }}>
                                Chưa có hồ sơ tiêm phòng nào
                            </Typography>
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
                        background: `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[700]} 100%)`,
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
                                                    {selectedPetDetails?.gender === 'male' ? 'Đực' : selectedPetDetails?.gender === 'female' ? 'Cái' : '—'}
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
                            background: `linear-gradient(135deg, ${COLORS.INFO[500]} 0%, ${COLORS.INFO[700]} 100%)`,
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.INFO[600]} 0%, ${COLORS.INFO[800]} 100%)`
                            }
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

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

