import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, Tabs, Tab, Grid, alpha } from '@mui/material';
import { Pets as PetsIcon, Category, Groups } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import { petApi } from '../../../api/petApi';
import PetsTab from './PetsTab';
import BreedsTab from './BreedsTab';
import GroupsTab from './GroupsTab';

const PetsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0); // 0: Pets, 1: Breeds, 2: Groups

    // Shared data for all tabs
    const [pets, setPets] = useState([]);
    const [species, setSpecies] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [groups, setGroups] = useState([]);

    // Load initial data
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setIsLoading(true);
            await Promise.all([
                loadPets(),
                loadSpecies(),
                loadBreeds(),
                loadGroups()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPets = async () => {
        const response = await petApi.getPets();
        if (response.success) {
            setPets(response.data);
        }
    };

    const loadSpecies = async () => {
        const response = await petApi.getPetSpecies();
        if (response.success) {
            setSpecies(response.data);
        }
    };

    const loadBreeds = async () => {
        const response = await petApi.getPetBreeds();
        if (response.success) {
            setBreeds(response.data);
        }
    };

    const loadGroups = async () => {
        const response = await petApi.getPetGroups();
        if (response.success) {
            setGroups(response.data);
        }
    };

    // Get pet health status
    const getPetHealthStatus = (pet) => {
        if (pet.age < 1 || pet.age > 12) {
            return { label: 'Cần theo dõi', color: COLORS.WARNING, bg: COLORS.WARNING[100] };
        }
        if (pet.weight < 2 || pet.weight > 50) {
            return { label: 'Cần kiểm tra', color: COLORS.INFO, bg: COLORS.INFO[100] };
        }
        return { label: 'Khỏe mạnh', color: COLORS.SUCCESS, bg: COLORS.SUCCESS[100] };
    };

    // Count pets by gender and health status
    const petStats = useMemo(() => {
        const stats = {
            male: 0,
            female: 0,
            healthy: 0,
            needMonitoring: 0,
            needCheckup: 0
        };

        pets.forEach(pet => {
            // Count gender
            if (pet.gender === 'male') {
                stats.male++;
            } else if (pet.gender === 'female') {
                stats.female++;
            }

            // Count health status
            const healthStatus = getPetHealthStatus(pet);
            if (healthStatus.label === 'Khỏe mạnh') {
                stats.healthy++;
            } else if (healthStatus.label === 'Cần theo dõi') {
                stats.needMonitoring++;
            } else if (healthStatus.label === 'Cần kiểm tra') {
                stats.needCheckup++;
            }
        });

        return stats;
    }, [pets]);

    if (isLoading) {
        return <Loading message="Đang tải dữ liệu thú cưng..." fullScreen />;
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <PetsIcon sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                        Quản lý thú cưng
                    </Typography>
                </Stack>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Tổng thú cưng */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Thú cưng
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                                {pets.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Giống */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Giống
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {breeds.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Nhóm */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nhóm
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                {groups.length}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Đực */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Đực
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {petStats.male}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Cái */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Cái
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                                {petStats.female}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Khỏe mạnh */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Khỏe mạnh
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {petStats.healthy}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Cần theo dõi */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Cần theo dõi
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                {petStats.needMonitoring}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Cần kiểm tra */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Cần kiểm tra
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {petStats.needCheckup}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Tabs Navigation */}
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem' },
                        '& .Mui-selected': { color: COLORS.ERROR[600] },
                        '& .MuiTabs-indicator': { backgroundColor: COLORS.ERROR[600] }
                    }}
                >
                    <Tab label="Thú cưng" icon={<PetsIcon />} iconPosition="start" />
                    <Tab label="Giống" icon={<Category />} iconPosition="start" />
                    <Tab label="Nhóm" icon={<Groups />} iconPosition="start" />
                </Tabs>

                {/* Tab Content */}
                {currentTab === 0 && (
                    <PetsTab
                        pets={pets}
                        species={species}
                        breeds={breeds}
                        groups={groups}
                        onDataChange={loadAllData}
                    />
                )}

                {currentTab === 1 && (
                    <BreedsTab
                        pets={pets}
                        species={species}
                        breeds={breeds}
                        onDataChange={loadAllData}
                    />
                )}

                {currentTab === 2 && (
                    <GroupsTab
                        pets={pets}
                        species={species}
                        breeds={breeds}
                        groups={groups}
                        onDataChange={loadAllData}
                    />
                )}
            </Box>
        </Box>
    );
};

export default PetsPage;
