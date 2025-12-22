import { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Stack, Tabs, Tab } from '@mui/material';
import { Pets as PetsIcon, Category, Groups, Pets } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import petsApi from '../../../api/petsApi';
import petSpeciesApi from '../../../api/petSpeciesApi';
import petBreedsApi from '../../../api/petBreedsApi';
import petGroupsApi from '../../../api/petGroupsApi';
import PetsTab from './PetsTab';
import BreedsTab from './BreedsTab';
import GroupsTab from './GroupsTab';
import SpeciesTab from './SpeciesTab';

const PetsPage = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Tab state - Initialize from sessionStorage, default to 0 if not found
    const [currentTab, setCurrentTabState] = useState(() => {
        const savedTab = sessionStorage.getItem('petsPageTab');
        return savedTab !== null ? parseInt(savedTab, 10) : 0;
    });

    // Wrapper function to update currentTab and save to sessionStorage
    const setCurrentTab = useCallback((newTab) => {
        setCurrentTabState(newTab);
        sessionStorage.setItem('petsPageTab', newTab.toString());
    }, []);

    // Shared data for all tabs
    const [pets, setPets] = useState([]);
    const [species, setSpecies] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [groups, setGroups] = useState([]);

    // Load pets list (for stats & sharing to tabs)
    const loadPets = useCallback(async () => {
        try {
            const response = await petsApi.getAllPets({ page_size: 1000 });
            const allPets = response?.data || [];

            // Deduplicate by id to prevent duplicates
            const uniquePets = Array.from(
                new Map(allPets.map(item => [item.id, item])).values()
            );

            setPets(uniquePets);
        } catch (error) {
            console.error('Error loading pets:', error);
            setPets([]);
        }
    }, []);

    // Load species list
    const loadSpecies = useCallback(async () => {
        try {
            const response = await petSpeciesApi.getAllSpecies();
            const allSpecies = response?.data || [];

            // Deduplicate by id to prevent duplicates
            const uniqueSpecies = Array.from(
                new Map(allSpecies.map(item => [item.id, item])).values()
            );

            setSpecies(uniqueSpecies);
        } catch (error) {
            console.error('Error loading species:', error);
            setSpecies([]);
        }
    }, []);

    // Load all breeds (for filters & stats)
    const loadBreeds = useCallback(async () => {
        try {
            // Lấy đầy đủ toàn bộ giống để thống kê & hiển thị, không chỉ mỗi trang đầu
            const response = await petBreedsApi.getAllBreeds({
                page: 0,      // page_index
                limit: 1000   // page_size lớn để tránh cắt mất data
            });
            const allBreeds = response?.data || [];

            // Deduplicate by id to prevent duplicates
            const uniqueBreeds = Array.from(
                new Map(allBreeds.map(item => [item.id, item])).values()
            );

            setBreeds(uniqueBreeds);
        } catch (error) {
            console.error('Error loading breeds:', error);
            setBreeds([]);
        }
    }, []);

    // Load all groups (for filters & stats)
    const loadGroups = useCallback(async () => {
        try {
            // Lấy đầy đủ danh sách nhóm từ API (không chỉ mỗi trang đầu)
            const response = await petGroupsApi.getAllGroups({
                page: 0,
                limit: 1000
            });
            const allGroups = response?.data || [];

            // Deduplicate by id to prevent duplicates
            const uniqueGroups = Array.from(
                new Map(allGroups.map(item => [item.id, item])).values()
            );

            setGroups(uniqueGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
            setGroups([]);
        }
    }, []);

    // Load all shared data at once
    const loadAllData = useCallback(async () => {
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
    }, [loadPets, loadSpecies, loadBreeds, loadGroups]);

    // Initial load
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

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
                    <Tab label="Nhóm" icon={<Groups />} iconPosition="start" />
                    <Tab label="Giống" icon={<Category />} iconPosition="start" />
                    <Tab label="Loài" icon={<Pets />} iconPosition="start" />
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
                    <GroupsTab
                        pets={pets}
                        species={species}
                        breeds={breeds}
                        groups={groups}
                        onDataChange={loadAllData}
                    />
                )}

                {currentTab === 2 && (
                    <BreedsTab
                        pets={pets}
                        species={species}
                        breeds={breeds}
                        onDataChange={loadAllData}
                    />
                )}

                {currentTab === 3 && (
                    <SpeciesTab onDataChange={loadAllData} />
                )}
            </Box>
        </Box>
    );
};

export default PetsPage;