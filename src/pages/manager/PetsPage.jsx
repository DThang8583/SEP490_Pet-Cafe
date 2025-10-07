import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Stack, Divider, Collapse, IconButton, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl, InputLabel } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Pets as PetsIcon } from '@mui/icons-material';
import { ExpandMore, ExpandLess, MoreVert, Edit, Delete, Check } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { petApi } from '../../api/petApi';

const PetsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pets, setPets] = useState([]);
    const [petStatsMap, setPetStatsMap] = useState({});
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', species: '', breed: '', groupName: '', newGroupName: '' });
    const [groupAnchorEl, setGroupAnchorEl] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState({ species: '', breed: '' });
    const [renameOpen, setRenameOpen] = useState(false);
    const [newBreedName, setNewBreedName] = useState('');
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [schedulePet, setSchedulePet] = useState(null);
    const [scheduleOverviewOpen, setScheduleOverviewOpen] = useState(false);
    const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
    const [scheduleMode, setScheduleMode] = useState('add');
    const [scheduleForm, setScheduleForm] = useState({ petId: '', name: '', date: '', index: -1 });

    useEffect(() => {
        const loadPets = async () => {
            try {
                setIsLoading(true);
                setError('');
                console.log('[PetsPage] Start loadPets');
                const res = await petApi.getPets();
                const data = res?.data || [];
                console.log('[PetsPage] getMyPets() response:', { count: data.length, data });
                setPets(data);

                // Load stats per pet in parallel (best-effort)
                const statsEntries = await Promise.all(
                    data.map(async (p) => {
                        try {
                            const s = await petApi.getPetStats(p.id);
                            const stat = s?.data || {};
                            console.log('[PetsPage] getPetStats()', p.id, stat);
                            return [p.id, stat];
                        } catch (_) {
                            console.warn('[PetsPage] getPetStats() failed for', p.id, _);
                            return [p.id, {}];
                        }
                    })
                );
                const statsMap = Object.fromEntries(statsEntries);
                setPetStatsMap(statsMap);
            } catch (e) {
                console.error('[PetsPage] loadPets error:', e);
                setError(e?.message || 'Không thể tải danh sách thú cưng');
            } finally {
                setIsLoading(false);
                console.log('[PetsPage] Finish loadPets');
            }
        };
        loadPets();
    }, []);

    // Note: do not block with fullScreen loader to keep sidebar visible

    const grouped = useMemo(() => {
        // Group by species -> manager-defined groupName (fallback to breed)
        const map = {};
        for (const p of pets) {
            const species = p.species || 'khac';
            const groupKey = p.groupName || p.breed || 'Chưa rõ nhóm';
            if (!map[species]) map[species] = {};
            if (!map[species][groupKey]) map[species][groupKey] = [];
            map[species][groupKey].push(p);
        }
        return map;
    }, [pets]);

    const speciesKeys = useMemo(() => Object.keys(grouped), [grouped]);
    const [selectedSpecies, setSelectedSpecies] = useState('');
    const [expandedBreeds, setExpandedBreeds] = useState({});

    const groupsBySpecies = useMemo(() => {
        const map = {};
        for (const p of pets) {
            const s = p.species || 'khac';
            const g = p.groupName || p.breed || 'Chưa rõ nhóm';
            if (!map[s]) map[s] = new Set();
            map[s].add(g);
        }
        const out = {};
        for (const [k, v] of Object.entries(map)) out[k] = Array.from(v).sort();
        return out;
    }, [pets]);

    useEffect(() => {
        if (!selectedSpecies && speciesKeys.length) {
            setSelectedSpecies(speciesKeys[0]);
        }
        console.log('[PetsPage] grouped species ->', speciesKeys);
        console.log('[PetsPage] selectedSpecies ->', selectedSpecies);
    }, [speciesKeys, selectedSpecies]);

    const toggleBreed = (breedKey) => {
        setExpandedBreeds((prev) => ({ ...prev, [breedKey]: !prev[breedKey] }));
    };

    const openGroupMenu = (event, species, breed) => {
        setSelectedGroup({ species, breed });
        setGroupAnchorEl(event.currentTarget);
    };
    const closeGroupMenu = () => setGroupAnchorEl(null);
    const openRenameBreed = () => {
        closeGroupMenu();
        setNewBreedName(selectedGroup.breed);
        setRenameOpen(true);
    };
    const confirmRenameBreed = async () => {
        try {
            // Update all pets in this breed to new name (mock grouping management)
            const petsInBreed = pets.filter(p => (p.species === selectedGroup.species) && (p.breed === selectedGroup.breed));
            for (const p of petsInBreed) {
                await petApi.updatePet(p.id, { breed: newBreedName });
            }
            const res = await petApi.getPets();
            setPets(res?.data || []);
            setRenameOpen(false);
        } catch (e) {
            console.error(e);
        }
    };
    const deleteBreedGroup = async () => {
        closeGroupMenu();
        try {
            // Set breed to "Chưa rõ giống" for all pets in this group to simulate deletion
            const petsInBreed = pets.filter(p => (p.species === selectedGroup.species) && (p.breed === selectedGroup.breed));
            for (const p of petsInBreed) {
                await petApi.updatePet(p.id, { breed: 'Chưa rõ giống' });
            }
            const res = await petApi.getPets();
            setPets(res?.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const renderTopState = () => {
        if (isLoading) {
            return (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                    <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải danh sách thú cưng..." />
                </Box>
            );
        }
        if (error) {
            return (
                <Box sx={{ width: '100%', p: 2 }}>
                    <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 700 }}>{error}</Typography>
                </Box>
            );
        }
        if (!pets.length) {
            return (
                <Box sx={{ width: '100%', p: 2 }}>
                    <Stack spacing={2} alignItems="center">
                        <PetsIcon sx={{ fontSize: 48, color: COLORS.ERROR[400] }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Chưa có thú cưng nào</Typography>
                    </Stack>
                </Box>
            );
        }
        return null;
    };

    const openActions = (event, pet) => {
        setSelectedPet(pet);
        setActionAnchorEl(event.currentTarget);
    };

    const closeActions = () => setActionAnchorEl(null);

    const handleDelete = () => {
        closeActions();
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await petApi.deletePet(selectedPet.id);
            const res = await petApi.getPets();
            setPets(res?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmOpen(false);
        }
    };

    const handleEdit = () => {
        closeActions();
        setEditForm({ name: selectedPet?.name || '', species: selectedPet?.species || '', breed: selectedPet?.breed || '', groupName: selectedPet?.groupName || '', newGroupName: '' });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editForm.name?.trim()) return;
        try {
            const groupNameFinal = editForm.groupName === '__new__' ? (editForm.newGroupName || editForm.breed) : editForm.groupName;
            if (selectedPet) {
                await petApi.updatePet(selectedPet.id, { name: editForm.name, species: editForm.species, breed: editForm.breed, groupName: groupNameFinal });
            } else {
                await petApi.addPet({ name: editForm.name, species: editForm.species || selectedSpecies, breed: editForm.breed, groupName: groupNameFinal });
            }
            const res = await petApi.getPets();
            setPets(res?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setEditOpen(false);
        }
    };

    const prettySpecies = (s) => {
        switch (s) {
            case 'dog': return 'Chó';
            case 'cat': return 'Mèo';
            case 'bird': return 'Chim';
            case 'rabbit': return 'Thỏ';
            default: return 'Khác';
        }
    };

    const detailRow = (label, value) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, minWidth: 110 }}>{label}:</Typography>
            <Typography variant="body2" sx={{ color: COLORS.TEXT.PRIMARY }}>{value || '—'}</Typography>
        </Stack>
    );

    const translateHealthStatus = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'excellent':
                return 'Xuất sắc';
            case 'good':
                return 'Tốt';
            case 'fair':
                return 'Trung bình';
            case 'poor':
                return 'Kém';
            case 'critical':
                return 'Nguy kịch';
            case 'up_to_date':
                return 'Đã cập nhật';
            default:
                return status || '—';
        }
    };

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%', transition: 'padding-left 0.3s ease, width 0.3s ease' }}>
            <Container maxWidth={false} disableGutters sx={{ py: 3, px: { xs: 2, md: 4 }, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                    <PetsIcon sx={{ color: COLORS.ERROR[500] }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Quản lý thú cưng</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="contained" onClick={() => { setSelectedPet(null); setEditForm({ name: '', species: selectedSpecies || speciesKeys[0] || '', breed: '', groupName: '', newGroupName: '' }); setEditOpen(true); }} sx={{
                        backgroundColor: COLORS.ERROR[500], fontWeight: 700,
                        '&:hover': { backgroundColor: COLORS.ERROR[600] }
                    }}>Thêm thú cưng</Button>
                </Stack>

                {renderTopState()}

                {/* Species selector + Schedule chip */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    {speciesKeys.map((s) => (
                        <Chip
                            key={s}
                            label={prettySpecies(s)}
                            onClick={() => setSelectedSpecies(s)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedSpecies === s ? alpha(COLORS.ERROR[100], 0.7) : alpha(COLORS.SECONDARY[50], 0.8),
                                color: selectedSpecies === s ? COLORS.ERROR[700] : COLORS.TEXT.SECONDARY,
                                fontWeight: selectedSpecies === s ? 800 : 600,
                                px: 2,
                                py: 0.5,
                                fontSize: { xs: '0.9rem', md: '1rem' }
                            }}
                        />
                    ))}
                    <Chip
                        label="Lịch tiêm"
                        onClick={() => setScheduleOverviewOpen((v) => !v)}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: alpha(COLORS.ERROR[100], 0.7),
                            color: COLORS.ERROR[800],
                            fontWeight: 800,
                            px: 2,
                            py: 0.5,
                            fontSize: { xs: '0.9rem', md: '1rem' }
                        }}
                    />
                </Stack>

                {scheduleOverviewOpen && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: 2, background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}` }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600], mb: 1 }}>
                            Lịch tiêm - {selectedSpecies ? prettySpecies(selectedSpecies) : 'Tất cả'}
                        </Typography>
                        <Divider sx={{ mb: 2, borderColor: alpha(COLORS.ERROR[200], 0.6) }} />
                        <Stack spacing={2}>
                            {(() => {
                                const petsInScope = selectedSpecies ? pets.filter(p => p.species === selectedSpecies) : pets;
                                if (!petsInScope.length) return <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>Không có thú cưng.</Typography>;
                                return petsInScope.map((p) => {
                                    const upcoming = p.upcomingVaccinations || [];
                                    const list = upcoming.filter((u) => u && u.name);
                                    return (
                                        <Box key={`sch-inline-${p.id}`}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{p.name}</Typography>
                                                <Chip size="small" label={`Mã: ${p.id}`} sx={{ background: alpha(COLORS.GRAY[200], 0.5) }} />
                                                <Box sx={{ flexGrow: 1 }} />
                                                <Button size="small" variant="outlined" onClick={() => {
                                                    setScheduleMode('add');
                                                    setScheduleForm({ petId: p.id, name: '', date: '', index: -1 });
                                                    setScheduleEditOpen(true);
                                                }}>Thêm lịch</Button>
                                            </Stack>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {(p.vaccinations || []).map((v) => (
                                                    <Chip key={`${p.id}-done-inline-${v.name}-${v.date}`} label={`Đã tiêm: ${v.name} (${v.date})`} size="small" sx={{ background: alpha(COLORS.SECONDARY[100], 0.9), color: COLORS.SECONDARY[800], fontWeight: 600 }} />
                                                ))}
                                                {list.length ? list.map((u, idx) => (
                                                    <Stack key={`${p.id}-up-inline-${u.name}-${u.date || idx}`} direction="row" alignItems="center" spacing={0.5} sx={{ mr: 1, mb: 1 }}>
                                                        <Chip label={`Sắp tiêm: ${u.name}${u.date ? ` (${u.date})` : ''}`} size="small" sx={{ background: alpha(COLORS.ERROR[100], 0.7), color: COLORS.ERROR[800], fontWeight: 600 }} />
                                                        <IconButton size="small" onClick={() => {
                                                            setScheduleMode('edit');
                                                            setScheduleForm({ petId: p.id, name: u.name, date: u.date || '', index: idx });
                                                            setScheduleEditOpen(true);
                                                        }}><Edit fontSize="inherit" /></IconButton>
                                                        <IconButton size="small" onClick={async () => {
                                                            try {
                                                                const pet = pets.find(pt => pt.id === p.id);
                                                                const upcomingNew = (pet.upcomingVaccinations || []).filter((_, i) => i !== idx);
                                                                await petApi.updatePet(p.id, { upcomingVaccinations: upcomingNew });
                                                                const res = await petApi.getPets();
                                                                setPets(res?.data || []);
                                                            } catch (e) { console.error(e); }
                                                        }}><Delete fontSize="inherit" /></IconButton>
                                                        <Tooltip title="Đánh dấu đã tiêm">
                                                            <IconButton size="small" onClick={async () => {
                                                                try {
                                                                    const pet = pets.find(pt => pt.id === p.id);
                                                                    const upcomingArr = pet.upcomingVaccinations || [];
                                                                    const item = upcomingArr[idx];
                                                                    const upcomingNew = upcomingArr.filter((_, i) => i !== idx);
                                                                    const vaccinationsNew = [...(pet.vaccinations || []), { name: item.name, date: item.date || new Date().toISOString().slice(0, 10) }];
                                                                    await petApi.updatePet(p.id, { upcomingVaccinations: upcomingNew, vaccinations: vaccinationsNew });
                                                                    const res = await petApi.getPets();
                                                                    setPets(res?.data || []);
                                                                } catch (e) { console.error(e); }
                                                            }}><Check fontSize="inherit" /></IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                )) : (
                                                    <Chip label="Không có lịch sắp tới" size="small" sx={{ background: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY }} />
                                                )}
                                            </Stack>
                                        </Box>
                                    );
                                });
                            })()}
                        </Stack>
                    </Box>
                )}

                {selectedSpecies && (
                    <Box key={selectedSpecies} sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[500], mb: 2 }}>
                            {prettySpecies(selectedSpecies)}
                        </Typography>
                        <Divider sx={{ mb: 2, borderColor: alpha(COLORS.ERROR[200], 0.6) }} />

                        {Object.entries(grouped[selectedSpecies] || {}).map(([breed, list]) => (
                            <Box key={breed} sx={{ mb: 3 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'pointer' }} onClick={() => toggleBreed(`${selectedSpecies}-${breed}`)}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY }}>{breed}</Typography>
                                        <IconButton size="small" aria-label="toggle-breed" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {expandedBreeds[`${selectedSpecies}-${breed}`] ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </Stack>
                                    <IconButton size="small" onClick={(e) => openGroupMenu(e, selectedSpecies, breed)} sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        <MoreVert />
                                    </IconButton>
                                </Stack>
                                <Collapse in={Boolean(expandedBreeds[`${selectedSpecies}-${breed}`])} timeout="auto" unmountOnExit>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: 'repeat(1, minmax(0, 1fr))',
                                                sm: 'repeat(2, minmax(0, 1fr))',
                                                md: 'repeat(3, minmax(0, 1fr))'
                                            },
                                            gap: { xs: 2, md: 3 }
                                        }}
                                    >
                                        {list.map((pet) => {
                                            const stats = petStatsMap[pet.id] || {};
                                            return (
                                                <Card key={pet.id} sx={{
                                                    height: '100%',
                                                    borderRadius: 3,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                                                    boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.18)}`,
                                                    transition: 'transform 0.2s ease',
                                                    '&:hover': { transform: 'translateY(-2px)' }
                                                }}>
                                                    <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Stack spacing={0.2}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.ERROR[600], lineHeight: 1.2 }}>{pet.name}</Typography>
                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>Mã: {pet.id}</Typography>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Chip size="small" label={prettySpecies(pet.species)} sx={{ background: alpha(COLORS.ERROR[100], 0.7), color: COLORS.ERROR[700], fontWeight: 700 }} />
                                                            <Chip size="small" label="Lịch tiêm" onClick={() => { setSchedulePet(pet); setScheduleOpen(true); }} sx={{ background: alpha(COLORS.SECONDARY[100], 0.8), color: COLORS.SECONDARY[800], fontWeight: 700, cursor: 'pointer' }} />
                                                            <IconButton size="small" onClick={(e) => openActions(e, pet)} sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                <span style={{ fontWeight: 900 }}>⋮</span>
                                                            </IconButton>
                                                        </Stack>
                                                    </Box>
                                                    <CardMedia
                                                        component="img"
                                                        height={180}
                                                        image={pet.avatar}
                                                        alt={pet.name}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1558944351-c0d3e9061f4b?q=80&w=800&auto=format&fit=crop'; }}
                                                    />
                                                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        {detailRow('Loài', prettySpecies(pet.species))}
                                                        {detailRow('Giống', pet.breed)}
                                                        {detailRow('Tuổi', `${pet.age} tuổi`)}
                                                        {detailRow('Giới tính', pet.gender === 'male' ? 'Đực' : pet.gender === 'female' ? 'Cái' : '—')}
                                                        {detailRow('Cân nặng', pet.weight ? `${pet.weight} kg` : '—')}
                                                        {detailRow('Màu lông', pet.color)}
                                                        {detailRow('Sở thích', (pet.preferences?.favoriteToys || []).join(', ') || '—')}
                                                        {detailRow('Sức khỏe hiện tại', translateHealthStatus(stats.healthStatus))}
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, mb: 0.5 }}>Vaccine đã tiêm:</Typography>
                                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                {(pet.vaccinations || []).length ? (
                                                                    pet.vaccinations.map((v) => (
                                                                        <Chip key={`${pet.id}-${v.name}-${v.date}`}
                                                                            label={`${v.name} (${v.date})`}
                                                                            size="small"
                                                                            sx={{ background: alpha(COLORS.SECONDARY[100], 0.8), color: COLORS.SECONDARY[700], fontWeight: 600 }} />
                                                                    ))
                                                                ) : (
                                                                    <Chip label="Chưa có" size="small" sx={{ background: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY }} />
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                </Collapse>
                            </Box>
                        ))}

                        {/* Actions Menu */}
                        <Menu anchorEl={actionAnchorEl} open={Boolean(actionAnchorEl)} onClose={closeActions}>
                            <MenuItem onClick={handleEdit}>Sửa thông tin</MenuItem>
                            <MenuItem onClick={handleDelete} sx={{ color: COLORS.ERROR[600], fontWeight: 700 }}>Xóa</MenuItem>
                        </Menu>

                        {/* Group menu */}
                        <Menu anchorEl={groupAnchorEl} open={Boolean(groupAnchorEl)} onClose={closeGroupMenu}>
                            <MenuItem onClick={openRenameBreed}>Đổi tên nhóm</MenuItem>
                            <MenuItem onClick={deleteBreedGroup} sx={{ color: COLORS.ERROR[600], fontWeight: 700 }}>Xóa nhóm</MenuItem>
                        </Menu>

                        {/* Xác nhận xóa */}
                        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                            <DialogTitle>Xóa thú cưng</DialogTitle>
                            <DialogContent>Bạn có chắc muốn xóa "{selectedPet?.name}"?</DialogContent>
                            <DialogActions>
                                <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
                                <Button onClick={confirmDelete} color="error" variant="contained">Xóa</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Thêm/Sửa lịch tiêm (trong khối tổng) */}
                        <Dialog open={scheduleEditOpen} onClose={() => setScheduleEditOpen(false)} fullWidth maxWidth="xs">
                            <DialogTitle>{scheduleMode === 'add' ? 'Thêm lịch tiêm' : 'Sửa lịch tiêm'}</DialogTitle>
                            <DialogContent>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <TextField label="Tên vaccine" value={scheduleForm.name} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} fullWidth />
                                    <TextField label="Ngày tiêm (YYYY-MM-DD)" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} fullWidth />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setScheduleEditOpen(false)}>Hủy</Button>
                                <Button onClick={async () => {
                                    if (!scheduleForm.name?.trim()) return;
                                    try {
                                        const pet = pets.find(p => p.id === scheduleForm.petId);
                                        const up = [...(pet.upcomingVaccinations || [])];
                                        if (scheduleMode === 'add') {
                                            up.push({ name: scheduleForm.name, date: scheduleForm.date });
                                        } else if (scheduleMode === 'edit' && scheduleForm.index > -1) {
                                            up[scheduleForm.index] = { name: scheduleForm.name, date: scheduleForm.date };
                                        }
                                        await petApi.updatePet(scheduleForm.petId, { upcomingVaccinations: up });
                                        const res = await petApi.getPets();
                                        setPets(res?.data || []);
                                        setScheduleEditOpen(false);
                                    } catch (e) { console.error(e); }
                                }} variant="contained">Lưu</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Lịch tiêm vaccine */}
                        <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} fullWidth maxWidth="sm">
                            <DialogTitle>Lịch tiêm - {schedulePet?.name}</DialogTitle>
                            <DialogContent sx={{ pt: 2 }}>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.TEXT.SECONDARY, mb: 1 }}>Đã tiêm</Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {(schedulePet?.vaccinations || []).length ? (
                                                schedulePet.vaccinations.map((v) => (
                                                    <Chip key={`${schedulePet.id}-done-${v.name}-${v.date}`} label={`${v.name} (${v.date})`} size="small" sx={{ background: alpha(COLORS.SECONDARY[100], 0.9), color: COLORS.SECONDARY[800], fontWeight: 600 }} />
                                                ))
                                            ) : (
                                                <Chip label="Chưa có" size="small" sx={{ background: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY }} />
                                            )}
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.TEXT.SECONDARY, mb: 1 }}>Chuẩn bị tiêm</Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {(() => {
                                                const upcoming = schedulePet?.upcomingVaccinations || [];
                                                const list = upcoming.filter((u) => u && u.name);
                                                return list.length ? list.map((u, idx) => (
                                                    <Chip key={`${schedulePet?.id}-up-${u.name}-${u.date || idx}`} label={`${u.name}${u.date ? ` (${u.date})` : ''}`} size="small" sx={{ background: alpha(COLORS.ERROR[100], 0.7), color: COLORS.ERROR[800], fontWeight: 600 }} />
                                                )) : (
                                                    <Chip label="Chưa có lịch" size="small" sx={{ background: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY }} />
                                                );
                                            })()}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setScheduleOpen(false)}>Đóng</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Tổng lịch tiêm theo loài đã chọn - hiển thị inline phía trên, không dùng modal */}

                        {/* Thêm/Sửa thú cưng (đơn giản) */}
                        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                            <DialogTitle>{selectedPet ? 'Sửa thông tin thú cưng' : 'Thêm thú cưng'}</DialogTitle>
                            <DialogContent sx={{ pt: 2 }}>
                                <Stack spacing={2}>
                                    <TextField label="Tên" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
                                    <TextField label="Loài" value={editForm.species} onChange={(e) => setEditForm({ ...editForm, species: e.target.value })} fullWidth />
                                    <TextField label="Giống" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} fullWidth />
                                    <FormControl fullWidth>
                                        <InputLabel id="group-label">Nhóm (Manager)</InputLabel>
                                        <Select labelId="group-label" label="Nhóm (Manager)" value={editForm.groupName} onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })}>
                                            {(groupsBySpecies[editForm.species] || []).map((g) => (
                                                <MenuItem key={g} value={g}>{g}</MenuItem>
                                            ))}
                                            <MenuItem value="__new__">+ Tạo nhóm mới</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {editForm.groupName === '__new__' && (
                                        <TextField label="Tên nhóm mới" value={editForm.newGroupName} onChange={(e) => setEditForm({ ...editForm, newGroupName: e.target.value })} fullWidth placeholder="Mặc định theo Giống nếu để trống" />
                                    )}
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setEditOpen(false)}>Hủy</Button>
                                <Button onClick={saveEdit} variant="contained">Lưu</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Đổi tên nhóm */}
                        <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} fullWidth maxWidth="xs">
                            <DialogTitle>Đổi tên nhóm</DialogTitle>
                            <DialogContent>
                                <TextField fullWidth label="Tên nhóm mới" value={newBreedName} onChange={(e) => setNewBreedName(e.target.value)} sx={{ mt: 1 }} />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setRenameOpen(false)}>Hủy</Button>
                                <Button onClick={confirmRenameBreed} variant="contained">Lưu</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default PetsPage;
