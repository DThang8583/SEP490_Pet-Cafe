import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    alpha,
    Fade,
    CircularProgress,
    Alert,
    Button,
    Paper
} from '@mui/material';
import { Search, Pets, Cake, LocalCafe, Cake as SpeciesIcon, Wc, Palette, Scale, Favorite, HealthAndSafety, CalendarToday, FilterList } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const PetsListPage = () => {
    const [pets, setPets] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // Load pet groups
    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const token = localStorage.getItem('authToken');
                
                const response = await fetch('https://petcafes.azurewebsites.net/api/pet-groups?page=0&limit=999', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();
                console.log('[PetsListPage] Groups API response:', json);
                const allGroups = Array.isArray(json?.data) ? json.data : [];
                console.log('[PetsListPage] All groups:', allGroups);
                console.log('[PetsListPage] All group names:', allGroups.map(g => ({ id: g.id, name: g.name, is_active: g.is_active, is_deleted: g.is_deleted })));
                
                // Hiển thị tất cả groups (không filter theo is_active hoặc is_deleted)
                // Chỉ filter nếu is_deleted = true
                const activeGroups = allGroups.filter(group => group.is_deleted !== true);
                console.log('[PetsListPage] Active groups after filter:', activeGroups);
                console.log('[PetsListPage] Active group names:', activeGroups.map(g => ({ id: g.id, name: g.name })));
                console.log('[PetsListPage] Groups state will be set to:', activeGroups.length, 'groups');
                
                setGroups(activeGroups);
            } catch (e) {
                console.error('[PetsListPage] Error loading groups:', e);
                setGroups([]);
            } finally {
                setLoadingGroups(false);
            }
        };

        loadGroups();
    }, []);

    // Debug: Log when groups state changes
    useEffect(() => {
        console.log('[PetsListPage] Groups state updated:', groups);
        console.log('[PetsListPage] Groups count:', groups.length);
        if (groups.length > 0) {
            console.log('[PetsListPage] First group:', groups[0]);
            console.log('[PetsListPage] First group name:', groups[0]?.name);
        }
    }, [groups]);

    // Load pets based on selected group
    useEffect(() => {
        const loadPets = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('authToken');
                
                let url = 'https://petcafes.azurewebsites.net/api/pets?page=0&limit=999';
                
                // If group is selected, fetch from group API
                if (selectedGroupId) {
                    url = `https://petcafes.azurewebsites.net/api/pet-groups/${selectedGroupId}`;
                }
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();
                console.log('[PetsListPage] Pets API response:', json);
                let allPets = [];
                
                // If fetching from group API, pets are in the pets array
                if (selectedGroupId) {
                    // Group API returns pets in json.pets array
                    allPets = Array.isArray(json?.pets) ? json.pets : [];
                    console.log('[PetsListPage] Pets from group:', allPets);
                } else {
                    // Regular pets API returns data array
                    allPets = Array.isArray(json?.data) ? json.data : [];
                    console.log('[PetsListPage] All pets:', allPets);
                }
                
                // Filter only active pets
                const activePets = allPets.filter(pet => pet?.is_active && !pet?.is_deleted);
                console.log('[PetsListPage] Active pets:', activePets);
                
                setPets(activePets);
            } catch (e) {
                console.error('[PetsListPage] Error loading pets:', e);
                setError(e.message || 'Không thể tải danh sách thú cưng');
            } finally {
                setLoading(false);
            }
        };

        loadPets();
    }, [selectedGroupId]);

    const filteredPets = pets.filter(pet => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            pet.name?.toLowerCase().includes(query) ||
            pet.species?.name?.toLowerCase().includes(query) ||
            pet.breed?.name?.toLowerCase().includes(query) ||
            pet.group?.name?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <CircularProgress size={60} sx={{ color: COLORS.ERROR[500] }} />
            </Box>
        );
    }

    return (
        <Fade in timeout={800}>
            <Box sx={{
                py: { xs: 2, md: 4 },
                minHeight: '100vh',
                background: `radial-gradient(900px 260px at -10% -10%, ${alpha(COLORS.ERROR[50], 0.6)}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${alpha(COLORS.INFO[50], 0.6)}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="lg">
                    {/* Header */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 4 }} spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Pets sx={{ fontSize: 40, color: COLORS.ERROR[500] }} />
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                    Danh sách chó mèo
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}>
                                    Khám phá những người bạn bốn chân đáng yêu
                                </Typography>
                            </Box>
                        </Stack>
                        {filteredPets.length > 0 && (
                            <Chip
                                color="error"
                                label={`Tổng: ${filteredPets.length} thú cưng`}
                                sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.95rem', py: 1.5, px: 2 }}
                            />
                        )}
                    </Stack>

                    {/* Group Filters */}
                    <Box sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <FilterList sx={{ fontSize: 20, color: COLORS.ERROR[500] }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[600] }}>
                                Lọc theo nhóm
                            </Typography>
                        </Stack>
                        {loadingGroups ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={20} sx={{ color: COLORS.ERROR[500] }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Đang tải nhóm...
                                </Typography>
                            </Box>
                        ) : (
                            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                                <Button
                                    variant={selectedGroupId === null ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => setSelectedGroupId(null)}
                                    startIcon={<Pets />}
                                    sx={{
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        px: 3,
                                        py: 1,
                                        boxShadow: selectedGroupId === null ? 4 : 0,
                                        '&:hover': {
                                            boxShadow: selectedGroupId === null ? 6 : 2
                                        }
                                    }}
                                >
                                    Tất cả
                                </Button>
                                {groups.length > 0 ? (
                                    groups.map((group) => {
                                        const groupName = group.name || 'Nhóm không tên';
                                        console.log('[PetsListPage] Rendering group button:', { id: group.id, name: groupName, hasName: !!group.name });
                                        return (
                                            <Button
                                                key={group.id}
                                                variant={selectedGroupId === group.id ? 'contained' : 'outlined'}
                                                color="error"
                                                onClick={() => setSelectedGroupId(group.id)}
                                                startIcon={group.image_url ? (
                                                    <Box
                                                        component="img"
                                                        src={group.image_url}
                                                        alt={groupName}
                                                        sx={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 1 }}
                                                    />
                                                ) : group.pet_species?.name === 'chó' ? (
                                                    <Pets />
                                                ) : group.pet_species?.name === 'mèo' ? (
                                                    <LocalCafe />
                                                ) : (
                                                    <LocalCafe />
                                                )}
                                                sx={{
                                                    borderRadius: 3,
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    px: 3,
                                                    py: 1,
                                                    boxShadow: selectedGroupId === group.id ? 4 : 0,
                                                    '&:hover': {
                                                        boxShadow: selectedGroupId === group.id ? 6 : 2
                                                    }
                                                }}
                                            >
                                                {groupName}
                                            </Button>
                                        );
                                    })
                                ) : (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, py: 1 }}>
                                        Không có nhóm nào
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>

                    {/* Search Bar */}
                    <Box sx={{ mb: 4 }}>
                        <TextField
                            fullWidth
                            placeholder="Tìm kiếm theo tên, loài, giống..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: COLORS.ERROR[500] }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    backgroundColor: COLORS.BACKGROUND.PAPER,
                                    '&:hover fieldset': {
                                        borderColor: COLORS.ERROR[300],
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: COLORS.ERROR[500],
                                    },
                                },
                            }}
                        />
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Pets Grid */}
                    {filteredPets.length === 0 ? (
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: 6,
                            border: `1px solid ${COLORS.BORDER.LIGHT}`,
                            backgroundColor: COLORS.BACKGROUND.PAPER,
                            textAlign: 'center',
                            py: 6
                        }}>
                            <CardContent>
                                <Pets sx={{ fontSize: 64, color: COLORS.ERROR[300], mb: 2, opacity: 0.6 }} />
                                <Typography variant="h6" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                    {searchQuery ? 'Không tìm thấy thú cưng nào' : 'Chưa có thú cưng nào'}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                            {filteredPets.map((pet) => (
                                <Grid key={pet.id} sx={{ 
                                    width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Card sx={{
                                        borderRadius: 4,
                                        boxShadow: 6,
                                        border: `1px solid ${COLORS.BORDER.LIGHT}`,
                                        backgroundColor: COLORS.BACKGROUND.PAPER,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 10
                                        }
                                    }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={pet.image_url || pet.avatar_url || 'https://via.placeholder.com/300x200?text=Pet'}
                                            alt={pet.name}
                                            sx={{
                                                objectFit: 'cover',
                                                backgroundColor: alpha(COLORS.ERROR[100], 0.3)
                                            }}
                                        />
                                        <CardContent sx={{ 
                                            flexGrow: 1, 
                                            p: 2.5,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Typography variant="h6" sx={{
                                                    fontWeight: 800,
                                                    color: COLORS.ERROR[600],
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {pet.name || 'Chưa có tên'}
                                                </Typography>
                                                {pet.health_status && (
                                                    <Chip
                                                        label={
                                                            pet.health_status === 'HEALTHY' ? 'Khỏe mạnh' :
                                                            pet.health_status === 'RECOVERING' ? 'Đang hồi phục' :
                                                            pet.health_status === 'UNDER_OBSERVATION' ? 'Theo dõi' :
                                                            pet.health_status
                                                        }
                                                        color={
                                                            pet.health_status === 'HEALTHY' ? 'success' :
                                                            pet.health_status === 'RECOVERING' ? 'warning' :
                                                            pet.health_status === 'UNDER_OBSERVATION' ? 'info' :
                                                            'default'
                                                        }
                                                        size="small"
                                                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                            
                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                {pet.species && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <SpeciesIcon sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Loài:</strong> {pet.species.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.breed && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Pets sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Giống:</strong> {pet.breed.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.age !== undefined && pet.age !== null && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarToday sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Tuổi:</strong> {pet.age} tuổi
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.gender && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Wc sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Giới tính:</strong> {pet.gender === 'Male' ? 'Đực' : pet.gender === 'Female' ? 'Cái' : pet.gender}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.color && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Palette sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Màu:</strong> {pet.color}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.weight && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Scale sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Cân nặng:</strong> {pet.weight} kg
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {pet.group && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LocalCafe sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.85rem' }}>
                                                            <strong>Nhóm:</strong> {pet.group.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            {pet.preferences && (
                                                <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: alpha(COLORS.ERROR[50], 0.3), border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Favorite sx={{ fontSize: 16, color: COLORS.ERROR[500] }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], fontSize: '0.85rem' }}>
                                                            Sở thích:
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.8rem', pl: 2.5 }}>
                                                        {pet.preferences}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {pet.special_notes && (
                                                <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: alpha(COLORS.WARNING[50], 0.3), border: `1px solid ${alpha(COLORS.WARNING[200], 0.5)}` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <HealthAndSafety sx={{ fontSize: 16, color: COLORS.WARNING[600] }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.WARNING[700], fontSize: '0.85rem' }}>
                                                            Lưu ý đặc biệt:
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.8rem', pl: 2.5 }}>
                                                        {pet.special_notes}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {pet.arrival_date && (
                                                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarToday sx={{ fontSize: 14, color: COLORS.TEXT.SECONDARY }} />
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.75rem' }}>
                                                        Đến từ: {new Date(pet.arrival_date).toLocaleDateString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Box sx={{ mt: 'auto', pt: 2 }}>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                                    {pet.is_active && (
                                                        <Chip
                                                            label="Đang hoạt động"
                                                            color="success"
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>
        </Fade>
    );
};

export default PetsListPage;
