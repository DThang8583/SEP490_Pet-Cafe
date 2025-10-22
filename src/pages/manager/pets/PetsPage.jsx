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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.ERROR[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Thú cưng
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.ERROR[700], fontWeight: 900, lineHeight: 1 }}>
                                        {pets.length}
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
                                    <PetsIcon sx={{ fontSize: 32, color: COLORS.ERROR[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Giống */}
                    <Grid item xs={12} sm={6} md={3}>
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
                            onClick={() => setCurrentTab(1)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.INFO[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Giống
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.INFO[700], fontWeight: 900, lineHeight: 1 }}>
                                        {breeds.length}
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
                                    <Category sx={{ fontSize: 32, color: COLORS.INFO[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Nhóm */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.9)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100())`,
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
                            onClick={() => setCurrentTab(2)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.WARNING[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Nhóm
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.WARNING[700], fontWeight: 900, lineHeight: 1 }}>
                                        {groups.length}
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
                                    <Groups sx={{ fontSize: 32, color: COLORS.WARNING[600] }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Đực */}
                    <Grid item xs={12} sm={6} md={3}>
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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Đực
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.PRIMARY[700], fontWeight: 900, lineHeight: 1 }}>
                                        {petStats.male}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>♂️</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Cái */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.9)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100())`,
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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.ERROR[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Cái
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.ERROR[700], fontWeight: 900, lineHeight: 1 }}>
                                        {petStats.female}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>♀️</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Khỏe mạnh */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Khỏe mạnh
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.SUCCESS[700], fontWeight: 900, lineHeight: 1 }}>
                                        {petStats.healthy}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>💪</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Cần theo dõi */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.WARNING[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Cần theo dõi
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.WARNING[700], fontWeight: 900, lineHeight: 1 }}>
                                        {petStats.needMonitoring}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>⚠️</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Cần kiểm tra */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.9)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100())`,
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
                            onClick={() => setCurrentTab(0)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ color: COLORS.INFO[600], fontWeight: 600, mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Cần kiểm tra
                                    </Typography>
                                    <Typography variant="h3" sx={{ color: COLORS.INFO[700], fontWeight: 900, lineHeight: 1 }}>
                                        {petStats.needCheckup}
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
                                    <Typography variant="h3" sx={{ fontSize: '2rem' }}>🏥</Typography>
                                </Box>
                            </Stack>
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
