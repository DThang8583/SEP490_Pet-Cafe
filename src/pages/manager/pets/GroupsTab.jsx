import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Groups, Pets as PetsIcon, Visibility, Close, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddGroupPetModal from '../../../components/modals/AddGroupPetModal';
import petsApi from '../../../api/petsApi';
import petGroupsApi from '../../../api/petGroupsApi';

const GroupsTab = ({ pets, species, breeds, groups, onDataChange }) => {
    const [searchGroup, setSearchGroup] = useState('');
    const [groupFilterSpecies, setGroupFilterSpecies] = useState('all');
    const [groupPage, setGroupPage] = useState(1);
    const [groupItemsPerPage, setGroupItemsPerPage] = useState(10);

    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [confirmAddPetsOpen, setConfirmAddPetsOpen] = useState(false);
    const [petsToAdd, setPetsToAdd] = useState([]);

    const [confirmRemovePetOpen, setConfirmRemovePetOpen] = useState(false);
    const [petToRemove, setPetToRemove] = useState(null);

    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuGroup, setMenuGroup] = useState(null);

    const [groupDetailDialog, setGroupDetailDialog] = useState({ open: false, group: null, pets: [] });
    const [addPetToGroupDialog, setAddPetToGroupDialog] = useState({ open: false, group: null });

    // Local groups data & pagination for server-side pagination (independent from PetsPage)
    const [groupsPageData, setGroupsPageData] = useState([]);
    const [groupsPagination, setGroupsPagination] = useState({
        total_items_count: 0,
        page_size: groupItemsPerPage,
        total_pages_count: 0,
        page_index: 0
    });
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    // Helper function to capitalize first letter
    const capitalizeName = useCallback((name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    }, []);

    // Precompute species & breed maps for O(1) lookup
    const speciesNameMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();
        return new Map(species.map(s => [s.id, capitalizeName(s.name)]));
    }, [species, capitalizeName]);

    const breedNameMap = useMemo(() => {
        if (!Array.isArray(breeds)) return new Map();
        return new Map(breeds.map(b => [b.id, b.name]));
    }, [breeds]);

    // Color palette per species so chips dễ phân biệt theo Loài
    const speciesColorMap = useMemo(() => {
        if (!Array.isArray(species)) return new Map();

        const colorPairs = [
            { bg: COLORS.WARNING[100], text: COLORS.WARNING[800] },    // ví dụ: Chó
            { bg: COLORS.INFO[100], text: COLORS.INFO[800] },          // ví dụ: Mèo
            { bg: COLORS.SUCCESS[100], text: COLORS.SUCCESS[800] },
            { bg: COLORS.ERROR[100], text: COLORS.ERROR[800] }
        ];

        const map = new Map();
        species.forEach((s, index) => {
            map.set(s.id, colorPairs[index % colorPairs.length]);
        });

        return map;
    }, [species]);

    const getSpeciesChipColors = useCallback(
        (speciesId) => {
            if (!speciesId) {
                return { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
            }
            return speciesColorMap.get(speciesId) || { bg: COLORS.WARNING[50], text: COLORS.WARNING[700] };
        },
        [speciesColorMap]
    );

    // Colors for dog & cat stats cards – đồng bộ với chip Loài
    const dogSpeciesColors = useMemo(() => {
        let palette = null;
        species.forEach((s) => {
            if ((s.name || '').toLowerCase() === 'chó') {
                palette = speciesColorMap.get(s.id) || palette;
            }
        });
        return palette || { bg: COLORS.WARNING[100], text: COLORS.WARNING[800] };
    }, [species, speciesColorMap]);

    const catSpeciesColors = useMemo(() => {
        let palette = null;
        species.forEach((s) => {
            if ((s.name || '').toLowerCase() === 'mèo') {
                palette = speciesColorMap.get(s.id) || palette;
            }
        });
        return palette || { bg: COLORS.INFO[100], text: COLORS.INFO[800] };
    }, [species, speciesColorMap]);

    // Get species name by ID
    const getSpeciesName = useCallback((speciesId) => {
        if (!speciesId) return '—';
        return speciesNameMap.get(speciesId) || '—';
    }, [speciesNameMap]);

    // Get breed name by ID
    const getBreedName = useCallback((breedId) => {
        if (!breedId) return '—';
        return breedNameMap.get(breedId) || '—';
    }, [breedNameMap]);

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

    // Smooth search for groups to avoid blocking when typing
    const deferredSearchGroup = useDeferredValue(searchGroup);

    // Load groups page from API using page & limit (server-side pagination)
    const loadGroupsPage = useCallback(async () => {
        try {
            setIsLoadingGroups(true);

            const speciesFilter =
                groupFilterSpecies && groupFilterSpecies !== 'all' ? groupFilterSpecies : null;

            const response = await petGroupsApi.getAllGroups({
                page: groupPage - 1,
                limit: groupItemsPerPage,
                pet_species_id: speciesFilter
            });

            const data = response?.data || [];
            const pagination = response?.pagination || {};

            setGroupsPageData(Array.isArray(data) ? data : []);
            setGroupsPagination({
                total_items_count: pagination.total_items_count ?? data.length,
                page_size: pagination.page_size ?? groupItemsPerPage,
                total_pages_count: pagination.total_pages_count ?? 1,
                page_index: pagination.page_index ?? (groupPage - 1)
            });
        } catch (error) {
            console.error('Error loading groups page:', error);
            setGroupsPageData([]);
        } finally {
            setIsLoadingGroups(false);
        }
    }, [groupFilterSpecies, groupItemsPerPage, groupPage]);

    // Trigger load when pagination or filter changes
    useEffect(() => {
        loadGroupsPage();
    }, [loadGroupsPage]);

    // Statistics
    const stats = useMemo(() => {
        const total = groups.length;
        const active = groups.filter(g => g.is_active !== false).length;
        const inactive = groups.filter(g => g.is_active === false).length;

        let dogGroups = 0;
        let catGroups = 0;

        groups.forEach(group => {
            const speciesName = (speciesNameMap.get(group.pet_species_id) || '').toLowerCase();
            if (speciesName === 'chó') {
                dogGroups += 1;
            } else if (speciesName === 'mèo') {
                catGroups += 1;
            }
        });

        return {
            total,
            active,
            inactive,
            dogGroups,
            catGroups
        };
    }, [groups, speciesNameMap]);

    // Filtered groups (search applied client-side on current page)
    const filteredGroups = useMemo(() => {
        const searchLower = deferredSearchGroup.trim().toLowerCase();

        return groupsPageData.filter(group => {
            const matchSearch = searchLower
                ? (group.name || '').toLowerCase().includes(searchLower)
                : true;
            const matchSpecies = groupFilterSpecies === 'all' || group.pet_species_id === groupFilterSpecies;
            return matchSearch && matchSpecies;
        });
    }, [groupsPageData, deferredSearchGroup, groupFilterSpecies]);

    // Pagination
    const groupTotalPages = groupsPagination.total_pages_count || 1;
    const currentPageGroups = useMemo(() => {
        // Server-side pagination: filteredGroups đã là dữ liệu của page hiện tại
        return filteredGroups;
    }, [filteredGroups]);

    // Handle group add/edit
    const handleOpenGroupDialog = (group = null) => {
        if (group) {
            setEditMode(true);
            setSelectedGroup(group);
        } else {
            setEditMode(false);
            setSelectedGroup(null);
        }
        setGroupDialogOpen(true);
    };

    const handleSubmitGroup = async (groupFormData) => {
        try {
            setIsSubmitting(true);

            const groupData = {
                name: groupFormData.name.trim(),
                description: groupFormData.description.trim(),
                pet_species_id: groupFormData.pet_species_id,
                pet_breed_id: groupFormData.pet_breed_id || null
            };

            let response;
            if (editMode && selectedGroup) {
                response = await petGroupsApi.updateGroup(selectedGroup.id, groupData);
            } else {
                response = await petGroupsApi.createGroup(groupData);
            }

            if (response.success) {
                await onDataChange();
                setGroupDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || (editMode ? 'Cập nhật nhóm thành công!' : 'Thêm nhóm mới thành công!'),
                    type: 'success'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin nhóm',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = (id) => {
        setDeleteTarget(id);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await petGroupsApi.deleteGroup(deleteTarget);
            if (response.success) {
                onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: response.message || 'Xóa nhóm thành công!',
                    type: 'success'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa',
                type: 'error'
            });
        } finally {
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    // Handle view group details - fetch fresh data from API
    const handleViewGroupDetails = async (group) => {
        if (!group) return;

        try {
            // Fetch fresh data directly from API
            const [petsResponse, groupsResponse] = await Promise.all([
                petsApi.getAllPets({ page_size: 1000 }),
                petGroupsApi.getAllGroups({ page_size: 1000 })
            ]);

            const allPets = petsResponse?.data || [];
            const allGroups = groupsResponse?.data || [];

            // Filter pets that are actually in this group
            const groupPets = allPets.filter(p => p.group_id === group.id);
            // Get updated group data
            const updatedGroup = allGroups.find(g => g.id === group.id) || group;

            setGroupDetailDialog({ open: true, group: updatedGroup, pets: groupPets });
        } catch (error) {
            console.error('Error loading group details:', error);
            // Fallback: use props data if API fails
            const groupPets = pets.filter(p => p.group_id === group.id);
            setGroupDetailDialog({ open: true, group, pets: groupPets });
        }
    };

    // Handle add pets to group
    const handleOpenAddPetsDialog = (group) => {
        if (!group) {
            console.error('Group is null or undefined');
            return;
        }
        setAddPetToGroupDialog({ open: true, group });
    };

    // Handle request to add pets to group (show confirm modal)
    const handleRequestAddPetsToGroup = (selectedPetIds) => {
        if (!selectedPetIds || selectedPetIds.length === 0) {
            return;
        }
        setPetsToAdd(selectedPetIds);
        setConfirmAddPetsOpen(true);
    };

    // Confirm and execute adding pets to group
    const confirmAddPetsToGroup = async () => {
        try {
            const group = addPetToGroupDialog.group;
            if (!group || !petsToAdd || petsToAdd.length === 0) {
                setConfirmAddPetsOpen(false);
                setPetsToAdd([]);
                return;
            }

            // Store count before clearing
            const petsCount = petsToAdd.length;
            const groupName = group.name;

            // Update pets with group_id using official API
            const updatePromises = petsToAdd.map(async (petId) => {
                // Get current pet data first
                const pet = pets.find(p => p.id === petId);
                if (!pet) {
                    throw new Error(`Không tìm thấy thú cưng với ID: ${petId}`);
                }

                // Update pet with group_id, preserving all other fields
                return petsApi.updatePet(petId, {
                    name: pet.name,
                    age: pet.age,
                    species_id: pet.species_id,
                    breed_id: pet.breed_id,
                    color: pet.color,
                    weight: pet.weight,
                    preferences: pet.preferences,
                    special_notes: pet.special_notes,
                    image_url: pet.image_url || pet.image,
                    arrival_date: pet.arrival_date,
                    gender: pet.gender,
                    health_status: pet.health_status || 'HEALTHY',
                    group_id: group.id
                });
            });

            await Promise.all(updatePromises);

            // Close dialogs
            setAddPetToGroupDialog({ open: false, group: null });
            setConfirmAddPetsOpen(false);
            setPetsToAdd([]);

            // Refresh only the group details modal
            await refreshGroupDetailsModal(group.id);

            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã thêm ${petsCount} thú cưng vào nhóm "${groupName}"!`,
                type: 'success'
            });
        } catch (error) {
            setConfirmAddPetsOpen(false);
            setPetsToAdd([]);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể thêm thú cưng vào nhóm',
                type: 'error'
            });
        }
    };

    // Helper function to refresh only the group details modal
    const refreshGroupDetailsModal = async (groupId) => {
        if (!groupId || !groupDetailDialog.open || groupDetailDialog.group?.id !== groupId) {
            return;
        }

        try {
            // Fetch fresh data directly from API
            const [petsResponse, groupsResponse] = await Promise.all([
                petsApi.getAllPets({ page_size: 1000 }),
                petGroupsApi.getAllGroups({ page_size: 1000 })
            ]);

            const allPets = petsResponse?.data || [];
            const allGroups = groupsResponse?.data || [];

            const freshGroupPets = allPets.filter(p => p.group_id === groupId);
            const updatedGroup = allGroups.find(g => g.id === groupId);

            if (updatedGroup) {
                setGroupDetailDialog({ open: true, group: updatedGroup, pets: freshGroupPets });
            }
        } catch (error) {
            console.error('Error refreshing group details:', error);
            // Fallback: try to refresh from props
            const freshGroupPets = pets.filter(p => p.group_id === groupId);
            const updatedGroup = groups.find(g => g.id === groupId);
            if (updatedGroup) {
                setGroupDetailDialog({ open: true, group: updatedGroup, pets: freshGroupPets });
            }
        }
    };

    // Handle request to remove pet from group (show confirm modal)
    const handleRequestRemovePetFromGroup = (pet, group) => {
        if (!pet || !group) {
            return;
        }
        setPetToRemove({ pet, group });
        setConfirmRemovePetOpen(true);
    };

    // Confirm and execute removing pet from group
    const confirmRemovePetFromGroup = async () => {
        try {
            if (!petToRemove || !petToRemove.pet || !petToRemove.group) {
                setConfirmRemovePetOpen(false);
                setPetToRemove(null);
                return;
            }

            const { pet, group } = petToRemove;

            // Set group_id to null using official API, preserving all other fields
            await petsApi.updatePet(pet.id, {
                name: pet.name,
                age: pet.age,
                species_id: pet.species_id,
                breed_id: pet.breed_id,
                color: pet.color,
                weight: pet.weight,
                preferences: pet.preferences,
                special_notes: pet.special_notes,
                image_url: pet.image_url || pet.image,
                arrival_date: pet.arrival_date,
                gender: pet.gender,
                health_status: pet.health_status || 'HEALTHY',
                group_id: null
            });

            // Close confirm modal
            setConfirmRemovePetOpen(false);
            const groupId = group.id;
            setPetToRemove(null);

            // Refresh only the group details modal
            await refreshGroupDetailsModal(groupId);

            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã xóa ${pet.name} khỏi nhóm!`,
                type: 'success'
            });
        } catch (error) {
            setConfirmRemovePetOpen(false);
            setPetToRemove(null);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa thú cưng khỏi nhóm',
                type: 'error'
            });
        }
    };

    return (
        <Box>
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
                    { label: 'Tổng nhóm', value: stats.total, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                    { label: 'Đang hoạt động', value: stats.active, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Tổng nhóm chó', value: stats.dogGroups, color: dogSpeciesColors.bg, valueColor: dogSpeciesColors.text },
                    { label: 'Tổng nhóm mèo', value: stats.catGroups, color: catSpeciesColors.bg, valueColor: catSpeciesColors.text }
                ].map((stat, index, arr) => {
                    const cardWidth = `calc((100% - ${(arr.length - 1) * 16}px) / ${arr.length})`;
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

            {/* Toolbar */}
            <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'nowrap', mb: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên nhóm..."
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                    sx={{ flex: 1, minWidth: 0 }}
                />
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={groupFilterSpecies} onChange={(e) => setGroupFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{capitalizeName(s.name)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenGroupDialog()}
                    sx={{
                        backgroundColor: COLORS.ERROR[500],
                        '&:hover': { backgroundColor: COLORS.ERROR[600] },
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
                >
                    Thêm nhóm
                </Button>
            </Toolbar>

            {/* Groups Table */}
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.WARNING[200], 0.15)}`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Groups sx={{ color: COLORS.WARNING[700], fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                        Danh sách nhóm
                    </Typography>
                    <Chip
                        label={filteredGroups.length}
                        size="small"
                        sx={{
                            bgcolor: alpha(COLORS.WARNING[600], 0.2),
                            color: COLORS.WARNING[700],
                            fontWeight: 600
                        }}
                    />
                </Stack>
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
                                <TableCell sx={{ fontWeight: 800 }}>Tên nhóm</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Giống</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoadingGroups ? null : currentPageGroups.map((group) => (
                                <TableRow
                                    key={group.id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            background: alpha(COLORS.WARNING[50], 0.3)
                                        }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600 }}>{group.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={getSpeciesName(group.pet_species_id)}
                                            sx={{
                                                bgcolor: alpha(getSpeciesChipColors(group.pet_species_id).bg, 0.9),
                                                color: getSpeciesChipColors(group.pet_species_id).text,
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                        {group.pet_breed_id ? getBreedName(group.pet_breed_id) : 'Tất cả'}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, maxWidth: 300 }}>
                                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {group.description || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setMenuAnchor(e.currentTarget);
                                                setMenuGroup(group);
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
            </Paper>

            {/* Pagination */}
            {groupsPagination.total_items_count > 0 && (
                <Pagination
                    page={groupPage}
                    totalPages={groupTotalPages}
                    onPageChange={setGroupPage}
                    itemsPerPage={groupItemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        setGroupItemsPerPage(newValue);
                        setGroupPage(1);
                    }}
                    totalItems={groupsPagination.total_items_count}
                />
            )}

            {/* Add/Edit Modal */}
            <AddGroupPetModal
                isOpen={groupDialogOpen}
                onClose={() => setGroupDialogOpen(false)}
                onSubmit={handleSubmitGroup}
                editMode={editMode}
                initialData={selectedGroup}
                isLoading={isSubmitting}
                species={species}
                breeds={breeds}
            />

            {/* Detail Dialog */}
            <Dialog
                open={groupDetailDialog.open}
                onClose={() => setGroupDetailDialog({ open: false, group: null, pets: [] })}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                {/* Header */}
                <DialogTitle
                    sx={{
                        bgcolor: COLORS.WARNING[500],
                        color: 'white',
                        pb: 2
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Groups sx={{ fontSize: 32 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Chi tiết nhóm
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                {groupDetailDialog.group?.name || 'Thông tin chi tiết nhóm thú cưng'}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setGroupDetailDialog({ open: false, group: null, pets: [] })} sx={{ color: 'white' }}>
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                {/* Content */}
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    {groupDetailDialog.group && (
                        <Stack spacing={3}>
                            {/* Group Info */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    background: alpha(COLORS.WARNING[50], 0.3)
                                }}
                            >
                                <Stack spacing={2}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                        {groupDetailDialog.group.name}
                                    </Typography>

                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Chip
                                            icon={<PetsIcon />}
                                            label={getSpeciesName(groupDetailDialog.group.pet_species_id)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        {groupDetailDialog.group.pet_breed_id && (
                                            <Chip
                                                label={getBreedName(groupDetailDialog.group.pet_breed_id)}
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Stack>

                                    <Typography variant="body2" color="text.secondary">
                                        {groupDetailDialog.group.description || 'Không có mô tả'}
                                    </Typography>

                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: alpha(COLORS.WARNING[500], 0.1),
                                            border: '2px solid',
                                            borderColor: COLORS.WARNING[300],
                                            display: 'inline-block'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            Số lượng thú cưng
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                            {groupDetailDialog.pets.length}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>

                            <Divider />

                            {/* Pets List */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <PetsIcon sx={{ color: COLORS.ERROR[700], fontSize: 24 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[700] }}>
                                        Thú cưng trong nhóm
                                    </Typography>
                                    <Chip
                                        label={groupDetailDialog.pets.length}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(COLORS.ERROR[100], 0.7),
                                            color: COLORS.ERROR[800],
                                            fontWeight: 700
                                        }}
                                    />
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => {
                                            if (groupDetailDialog.group) {
                                                handleOpenAddPetsDialog(groupDetailDialog.group);
                                            }
                                        }}
                                        sx={{
                                            bgcolor: COLORS.ERROR[500],
                                            color: 'white',
                                            fontWeight: 700,
                                            '&:hover': {
                                                bgcolor: COLORS.ERROR[600]
                                            }
                                        }}
                                    >
                                        Thêm thú cưng vào nhóm
                                    </Button>
                                </Stack>

                                {groupDetailDialog.pets.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {groupDetailDialog.pets.map((pet) => (
                                            <Paper
                                                key={pet.id}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:hover': {
                                                        bgcolor: alpha(COLORS.ERROR[50], 0.3)
                                                    }
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        src={pet.image || pet.image_url}
                                                        alt={pet.name}
                                                        sx={{ width: 56, height: 56 }}
                                                    >
                                                        <PetsIcon />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {pet.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {getBreedName(pet.breed_id)} • {pet.age} tuổi • {pet.weight} kg
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={getPetHealthStatus(pet).label}
                                                        size="small"
                                                        color={getPetHealthStatus(pet).label === 'Khỏe mạnh' ? 'success' : 'warning'}
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRequestRemovePetFromGroup(pet, groupDetailDialog.group)}
                                                        sx={{
                                                            color: COLORS.ERROR[600],
                                                            '&:hover': {
                                                                bgcolor: alpha(COLORS.ERROR[500], 0.1)
                                                            }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 4,
                                            textAlign: 'center',
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <PetsIcon sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            Chưa có thú cưng trong nhóm này
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>

                {/* Actions */}
                <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.WARNING[500], 0.02) }}>
                    <Button
                        onClick={() => setGroupDetailDialog({ open: false, group: null, pets: [] })}
                        variant="contained"
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            color: 'white',
                            fontWeight: 700,
                            '&:hover': {
                                bgcolor: COLORS.WARNING[600]
                            }
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={confirmDelete}
                title="Xóa nhóm"
                message="Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Confirm Add Pets to Group Modal */}
            <ConfirmModal
                isOpen={confirmAddPetsOpen}
                onClose={() => {
                    setConfirmAddPetsOpen(false);
                    setPetsToAdd([]);
                }}
                onConfirm={confirmAddPetsToGroup}
                title="Thêm thú cưng vào nhóm"
                message={`Bạn có chắc chắn muốn thêm ${petsToAdd.length} thú cưng vào nhóm "${addPetToGroupDialog.group?.name}"?`}
                confirmText="Thêm"
                cancelText="Hủy"
                type="info"
            />

            {/* Confirm Remove Pet from Group Modal */}
            <ConfirmModal
                isOpen={confirmRemovePetOpen}
                onClose={() => {
                    setConfirmRemovePetOpen(false);
                    setPetToRemove(null);
                }}
                onConfirm={confirmRemovePetFromGroup}
                title="Xóa thú cưng khỏi nhóm"
                message={`Bạn có chắc chắn muốn xóa "${petToRemove?.pet?.name}" khỏi nhóm "${petToRemove?.group?.name}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="warning"
            />

            {/* Add Pets to Group Dialog */}
            <Dialog
                open={addPetToGroupDialog.open}
                onClose={() => setAddPetToGroupDialog({ open: false, group: null })}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.ERROR[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: COLORS.ERROR[600],
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        py: 2.5
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <PetsIcon sx={{ fontSize: 32 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                            Thêm thú cưng vào {addPetToGroupDialog.group?.name}
                        </Typography>
                        <IconButton
                            onClick={() => setAddPetToGroupDialog({ open: false, group: null })}
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
                    <AddPetsToGroupContent
                        group={addPetToGroupDialog.group}
                        allPets={pets}
                        species={species}
                        breeds={breeds}
                        groups={groups}
                        onSubmit={handleRequestAddPetsToGroup}
                        onClose={() => setAddPetToGroupDialog({ open: false, group: null })}
                    />
                </DialogContent>
            </Dialog>

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Group Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuGroup(null);
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
                        if (menuGroup) {
                            handleViewGroupDetails(menuGroup);
                        }
                        setMenuAnchor(null);
                        setMenuGroup(null);
                    }}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuGroup) {
                            handleOpenGroupDialog(menuGroup);
                        }
                        setMenuAnchor(null);
                        setMenuGroup(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuGroup) {
                            handleDelete(menuGroup.id);
                        }
                        setMenuAnchor(null);
                        setMenuGroup(null);
                    }}
                >
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

// Component for adding pets to group
const AddPetsToGroupContent = ({ group, allPets, species, breeds, groups, onSubmit, onClose }) => {
    const [selectedPets, setSelectedPets] = useState([]);
    const [searchPet, setSearchPet] = useState('');

    // Get breed name
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '—';
    };

    // Get group name by ID
    const getGroupName = (groupId) => {
        const gr = groups.find(g => g.id === groupId);
        return gr ? gr.name : 'Nhóm không xác định';
    };

    // Filter eligible pets by species and search only
    const eligiblePets = useMemo(() => {
        if (!group) return [];

        return allPets.filter(pet => {
            const matchSpecies = pet.species_id === group.pet_species_id;
            const matchSearch = pet.name?.toLowerCase().includes(searchPet.toLowerCase());

            // Filter by species and search term
            return matchSpecies && matchSearch;
        });
    }, [group, allPets, searchPet]);

    // Separate pets into available (no group) and already in other groups
    const { availablePets, petsInOtherGroups } = useMemo(() => {
        const available = [];
        const inOtherGroups = [];

        eligiblePets.forEach(pet => {
            // Pet is already in the current group - DO NOT SHOW
            if (pet.group_id === group?.id) {
                // Skip this pet - it's already in the group
                return;
            }

            // Pet is in another group - show but cannot select
            if (pet.group_id && pet.group_id !== group?.id) {
                inOtherGroups.push(pet);
            }
            // Pet is not in any group (can be added)
            else if (!pet.group_id || pet.group_id === null) {
                available.push(pet);
            }
        });

        return { availablePets: available, petsInOtherGroups: inOtherGroups };
    }, [eligiblePets, group]);

    const handleTogglePet = (petId) => {
        // Check if pet is already in another group
        const pet = allPets.find(p => p.id === petId);
        if (pet?.group_id && pet.group_id !== group?.id) {
            // Don't allow selection of pets already in other groups
            return;
        }

        setSelectedPets(prev =>
            prev.includes(petId)
                ? prev.filter(id => id !== petId)
                : [...prev, petId]
        );
    };

    const handleSubmit = () => {
        if (selectedPets.length === 0) {
            return;
        }
        onSubmit(selectedPets);
    };

    return (
        <Stack spacing={3}>
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    background: alpha(COLORS.INFO[50], 0.5),
                    border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                }}
            >
                <Typography variant="body2" sx={{ color: COLORS.INFO[800], fontWeight: 600 }}>
                    ℹ️ Chỉ hiển thị thú cưng phù hợp với loài và giống của nhóm
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.INFO[700], display: 'block', mt: 0.5 }}>
                    • Thú cưng đã thuộc nhóm khác sẽ hiển thị nhưng không thể chọn
                </Typography>
            </Box>

            <TextField
                size="small"
                placeholder="Tìm theo tên thú cưng..."
                value={searchPet}
                onChange={(e) => setSearchPet(e.target.value)}
                fullWidth
            />

            <Paper
                sx={{
                    maxHeight: 400,
                    overflow: 'auto',
                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                    borderRadius: 2
                }}
            >
                {eligiblePets.length > 0 ? (
                    <Stack>
                        {/* Available pets (can be selected) */}
                        {availablePets.length > 0 && (
                            <>
                                <Box sx={{ p: 1.5, background: alpha(COLORS.SUCCESS[50], 0.3), borderBottom: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}` }}>
                                    <Typography variant="caption" sx={{ color: COLORS.SUCCESS[800], fontWeight: 700 }}>
                                        ✓ Có thể thêm ({availablePets.length})
                                    </Typography>
                                </Box>
                                {availablePets.map((pet) => (
                                    <Box
                                        key={pet.id}
                                        onClick={() => handleTogglePet(pet.id)}
                                        sx={{
                                            p: 2,
                                            borderBottom: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                                            cursor: 'pointer',
                                            background: selectedPets.includes(pet.id)
                                                ? alpha(COLORS.ERROR[100], 0.3)
                                                : 'transparent',
                                            '&:hover': {
                                                background: alpha(COLORS.ERROR[50], 0.5)
                                            },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 1,
                                                    border: `2px solid ${selectedPets.includes(pet.id) ? COLORS.ERROR[600] : COLORS.BORDER.DEFAULT}`,
                                                    background: selectedPets.includes(pet.id) ? COLORS.ERROR[600] : '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {selectedPets.includes(pet.id) && '✓'}
                                            </Box>
                                            <Avatar
                                                src={pet.image || pet.image_url}
                                                alt={pet.name}
                                                sx={{ width: 40, height: 40 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 700 }}>{pet.name}</Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {getBreedName(pet.breed_id)} • {pet.age} tuổi • {pet.weight} kg
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                ))}
                            </>
                        )}

                        {/* Pets in other groups (cannot be selected) */}
                        {petsInOtherGroups.length > 0 && (
                            <>
                                <Box sx={{ p: 1.5, background: alpha(COLORS.WARNING[50], 0.3), borderBottom: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}` }}>
                                    <Typography variant="caption" sx={{ color: COLORS.WARNING[800], fontWeight: 700 }}>
                                        ⚠️ Đã thuộc nhóm khác ({petsInOtherGroups.length})
                                    </Typography>
                                </Box>
                                {petsInOtherGroups.map((pet) => (
                                    <Box
                                        key={pet.id}
                                        sx={{
                                            p: 2,
                                            borderBottom: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                                            cursor: 'not-allowed',
                                            background: alpha(COLORS.WARNING[50], 0.2),
                                            opacity: 0.6,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 1,
                                                    border: `2px solid ${COLORS.BORDER.DEFAULT}`,
                                                    background: alpha(COLORS.WARNING[100], 0.5),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: COLORS.WARNING[700],
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                🔒
                                            </Box>
                                            <Avatar
                                                src={pet.image || pet.image_url}
                                                alt={pet.name}
                                                sx={{ width: 40, height: 40, opacity: 0.7 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 700 }}>{pet.name}</Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {getBreedName(pet.breed_id)} • {pet.age} tuổi • {pet.weight} kg
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', color: COLORS.WARNING[700], fontWeight: 600, mt: 0.5 }}>
                                                    📍 Đang ở: {getGroupName(pet.group_id)}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label="Không thể chọn"
                                                size="small"
                                                sx={{
                                                    background: alpha(COLORS.WARNING[100], 0.7),
                                                    color: COLORS.WARNING[800],
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </Stack>
                                    </Box>
                                ))}
                            </>
                        )}
                    </Stack>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            {searchPet ? 'Không tìm thấy thú cưng phù hợp' : 'Không có thú cưng nào phù hợp để thêm vào nhóm'}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {selectedPets.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        background: alpha(COLORS.SUCCESS[50], 0.5),
                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                        borderRadius: 2
                    }}
                >
                    <Typography variant="body2" sx={{ color: COLORS.SUCCESS[800], fontWeight: 700 }}>
                        ✓ Đã chọn {selectedPets.length} thú cưng
                    </Typography>
                </Paper>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    onClick={onClose}
                    sx={{ fontWeight: 600 }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={selectedPets.length === 0}
                    sx={{
                        bgcolor: COLORS.ERROR[600],
                        color: '#fff',
                        fontWeight: 700,
                        '&:hover': {
                            bgcolor: COLORS.ERROR[700]
                        },
                        '&:disabled': {
                            bgcolor: COLORS.BORDER.DEFAULT,
                            color: COLORS.TEXT.SECONDARY
                        }
                    }}
                >
                    Thêm {selectedPets.length > 0 && `(${selectedPets.length})`}
                </Button>
            </Stack>
        </Stack>
    );
};

export default GroupsTab;