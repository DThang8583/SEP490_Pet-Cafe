import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Card, CardContent, Typography, TextField, Chip, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://petcafes.azurewebsites.net/api/pet-groups?order_by=%7B%22order_column%22%3A%22string%22%2C%22order_dir%22%3A%22string%22%7D';

const PetGroupsPage = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [petsDialogOpen, setPetsDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [pets, setPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const resp = await fetch(API_URL);
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setGroups(list);
            } catch (e) {
                setError(e.message || 'Không thể tải dữ liệu');
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => groups.filter(g => (g.name || '').toLowerCase().includes(keyword.toLowerCase())), [groups, keyword]);

    const loadPetsForGroup = async (group) => {
        setSelectedGroup(group);
        setPetsDialogOpen(true);
        setLoadingPets(true);
        try {
            const resp = await fetch('https://petcafes.azurewebsites.net/api/pets?page=0&limit=999');
            const json = await resp.json();
            const allPets = Array.isArray(json?.data) ? json.data : [];
            const targetSpeciesId = group?.pet_species_id;
            const targetSpeciesName = (group?.pet_species?.name || '').toLowerCase();
            const filtered = allPets.filter(p => {
                if (targetSpeciesId && p.species_id === targetSpeciesId) return true;
                if (targetSpeciesName) {
                    const petSpeciesName = (p.species?.name || '').toLowerCase();
                    return petSpeciesName === targetSpeciesName;
                }
                return false;
            });
            setPets(filtered);
        } catch (e) {
            setError(e.message || 'Không thể tải danh sách thú cưng');
        } finally {
            setLoadingPets(false);
        }
    };

    return (
        <Box sx={{
            py: 3,
            minHeight: '100vh',
            background: `radial-gradient(900px 260px at -10% -10%, ${COLORS.ERROR[50]}, transparent 60%),
                         radial-gradient(900px 260px at 110% 0%, ${COLORS.INFO[50]}, transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            <Container maxWidth="xl">
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }} spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Nhóm thú cưng</Typography>
                        <Chip color="error" label={`Tổng: ${groups.length}`} />
                    </Stack>
                    <TextField
                        fullWidth
                        placeholder="Tìm nhóm..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        sx={{ maxWidth: 420, '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' } }}
                    />
                </Stack>

                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)' }, gap: 2, alignItems: 'stretch' }}>
                    {filtered.map(g => {
                        const speciesName = (g.pet_species?.name || '').toLowerCase();
                        const isCat = speciesName.includes('mèo');
                        const isDog = speciesName.includes('chó');
                        const emoji = isCat ? '🐱' : (isDog ? '🐶' : '🐾');
                        const bg = isCat ? '#FFF3E0' : (isDog ? '#E3F2FD' : '#F3E5F5');
                        return (
                            <Box key={g.id}>
                                <Card sx={{
                                    borderRadius: 4,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    boxShadow: 6,
                                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                                    cursor: 'pointer',
                                    '&:hover': { transform: 'translateY(-3px)', boxShadow: 10 }
                                }} onClick={() => loadPetsForGroup(g)}>
                                    <Box sx={{ height: 140, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
                                        {emoji}
                                    </Box>
                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>{g.name}</Typography>
                                        <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1.5 }}>{g.description}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                                            <Chip size="small" label={`Loài: ${g.pet_species?.name || '-'}`} />
                                            <Chip size="small" label={`Giống: ${g.pet_breed?.name || '-'}`} />
                                        </Stack>
                                        <Box sx={{ flexGrow: 1 }} />
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })}
                </Box>
            </Container>

            <Dialog open={petsDialogOpen} onClose={() => setPetsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                    Danh sách thú cưng - {selectedGroup?.name}
                </DialogTitle>
                <DialogContent>
                    {loadingPets ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress color="error" />
                        </Box>
                    ) : pets.length === 0 ? (
                        <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 4 }}>Chưa có thú cưng nào trong nhóm này.</Typography>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
                            {pets.map(pet => {
                                const speciesName = (pet.species?.name || '').toLowerCase();
                                const isCat = speciesName.includes('mèo');
                                const isDog = speciesName.includes('chó');
                                const emoji = isCat ? '🐱' : (isDog ? '🐶' : '🐾');
                                return (
                                    <Box key={pet.id}>
                                        <Card sx={{ borderRadius: 3, height: '100%', overflow: 'hidden', boxShadow: 3 }}>
                                            {pet.image_url && (
                                                <Box component="img" src={pet.image_url} alt={pet.name} sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
                                            )}
                                            <CardContent>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{emoji} {pet.name}</Typography>
                                                </Stack>
                                                <Typography sx={{ fontSize: 14, color: COLORS.TEXT.SECONDARY, mb: 0.5 }}>
                                                    <b>Loài:</b> {pet.species?.name || '-'} | <b>Giống:</b> {pet.breed?.name || '-'}
                                                </Typography>
                                                <Typography sx={{ fontSize: 14, color: COLORS.TEXT.SECONDARY, mb: 0.5 }}>
                                                    <b>Tuổi:</b> {pet.age} tuổi | <b>Giới tính:</b> {pet.gender === 'Male' ? 'Đực' : pet.gender === 'Female' ? 'Cái' : pet.gender}
                                                </Typography>
                                                <Typography sx={{ fontSize: 14, color: COLORS.TEXT.SECONDARY, mb: 0.5 }}>
                                                    <b>Cân nặng:</b> {pet.weight} kg | <b>Màu sắc:</b> {pet.color || '-'}
                                                </Typography>
                                                {pet.preferences && (
                                                    <Typography sx={{ fontSize: 13, color: COLORS.TEXT.SECONDARY, fontStyle: 'italic', mt: 1 }}>
                                                        {pet.preferences}
                                                    </Typography>
                                                )}
                                                {pet.special_notes && (
                                                    <Typography sx={{ fontSize: 13, color: COLORS.ERROR[600], mt: 0.5 }}>
                                                        <b>Lưu ý:</b> {pet.special_notes}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPetsDialogOpen(false)} color="error">Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PetGroupsPage;

