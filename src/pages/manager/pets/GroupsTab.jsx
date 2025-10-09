import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, alpha, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import { Add, Edit, Delete, Groups, Pets as PetsIcon, Visibility, Close } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AlertModal from '../../../components/modals/AlertModal';
import AddGroupPetModal from '../../../components/modals/AddGroupPetModal';
import { petApi } from '../../../api/petApi';

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
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    const [groupDetailDialog, setGroupDetailDialog] = useState({ open: false, group: null, pets: [] });

    // Get species name by ID
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? sp.name : '—';
    };

    // Get breed name by ID
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '—';
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

    // Get group capacity status
    const getGroupCapacityStatus = (currentCount, maxCapacity) => {
        const percent = (currentCount / maxCapacity) * 100;
        if (percent >= 100) {
            return { label: 'Đầy', color: COLORS.ERROR, bg: COLORS.ERROR[100] };
        }
        if (percent >= 90) {
            return { label: 'Sắp đầy', color: COLORS.WARNING, bg: COLORS.WARNING[100] };
        }
        if (percent >= 70) {
            return { label: 'Còn chỗ', color: COLORS.INFO, bg: COLORS.INFO[100] };
        }
        return { label: 'Trống', color: COLORS.SUCCESS, bg: COLORS.SUCCESS[100] };
    };

    // Filtered groups
    const filteredGroups = useMemo(() => {
        return groups.filter(group => {
            const matchSearch = group.name?.toLowerCase().includes(searchGroup.toLowerCase());
            const matchSpecies = groupFilterSpecies === 'all' || group.pet_species_id === groupFilterSpecies;
            return matchSearch && matchSpecies;
        });
    }, [groups, searchGroup, groupFilterSpecies]);

    // Pagination
    const groupTotalPages = Math.ceil(filteredGroups.length / groupItemsPerPage);
    const currentPageGroups = useMemo(() => {
        const startIndex = (groupPage - 1) * groupItemsPerPage;
        return filteredGroups.slice(startIndex, startIndex + groupItemsPerPage);
    }, [groupPage, groupItemsPerPage, filteredGroups]);

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
                pet_species_id: groupFormData.pet_species_id,
                pet_breed_id: groupFormData.pet_breed_id || null,
                description: groupFormData.description.trim(),
                max_capacity: parseInt(groupFormData.max_capacity),
                current_count: parseInt(groupFormData.current_count || 0)
            };

            let response;
            if (editMode && selectedGroup) {
                response = await petApi.updatePetGroup(selectedGroup.id, groupData);
            } else {
                response = await petApi.createPetGroup(groupData);
            }

            if (response.success) {
                onDataChange();
                setGroupDialogOpen(false);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editMode ? 'Cập nhật nhóm thành công!' : 'Thêm nhóm mới thành công!',
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
            const response = await petApi.deletePetGroup(deleteTarget);
            if (response.success) {
                onDataChange();
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa nhóm thành công!',
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

    // Handle view group details
    const handleViewGroupDetails = (group) => {
        const groupPets = pets.filter(p => {
            const matchSpecies = p.species_id === group.pet_species_id;
            const matchBreed = !group.pet_breed_id || p.breed_id === group.pet_breed_id;
            return matchSpecies && matchBreed;
        });
        setGroupDetailDialog({ open: true, group, pets: groupPets });
    };

    return (
        <Box>
            {/* Toolbar */}
            <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên nhóm..."
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 280 } }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Loài</InputLabel>
                    <Select label="Loài" value={groupFilterSpecies} onChange={(e) => setGroupFilterSpecies(e.target.value)}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        {species.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenGroupDialog()}
                    sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
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
                            background: alpha(COLORS.WARNING[100], 0.7),
                            color: COLORS.WARNING[800],
                            fontWeight: 700
                        }}
                    />
                </Stack>
                <TableContainer
                    sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`,
                        overflowX: 'auto'
                    }}
                >
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5) }}>Tên nhóm</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5) }}>Loài</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5), display: { xs: 'none', sm: 'table-cell' } }}>Giống</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5), display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5), display: { xs: 'none', lg: 'table-cell' } }}>Sức chứa</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5) }}>Số lượng</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5) }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 800, background: alpha(COLORS.WARNING[50], 0.5), textAlign: 'right' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageGroups.map((group) => {
                                const capacityPercent = (group.current_count / group.max_capacity) * 100;
                                const capacityColor = capacityPercent >= 90 ? COLORS.ERROR[700] :
                                    capacityPercent >= 70 ? COLORS.WARNING[700] :
                                        COLORS.SUCCESS[700];
                                const capacityStatus = getGroupCapacityStatus(group.current_count, group.max_capacity);

                                return (
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
                                                    background: alpha(COLORS.WARNING[100], 0.7),
                                                    color: COLORS.WARNING[800],
                                                    fontWeight: 700
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                            {group.pet_breed_id ? getBreedName(group.pet_breed_id) : 'Tất cả'}
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 300 }}>
                                            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {group.description || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                            {group.max_capacity}
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700, color: capacityColor, fontSize: '0.95rem' }}>
                                                {group.current_count}/{group.max_capacity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={capacityStatus.label}
                                                icon={
                                                    capacityPercent >= 100 ? <span>🔴</span> :
                                                        capacityPercent >= 90 ? <span>🟡</span> :
                                                            capacityPercent >= 70 ? <span>🔵</span> : <span>🟢</span>
                                                }
                                                sx={{
                                                    background: alpha(capacityStatus.bg, 0.7),
                                                    color: capacityStatus.color[800],
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                sx={{ color: COLORS.INFO[600] }}
                                                onClick={() => handleViewGroupDetails(group)}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenGroupDialog(group)}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(group.id)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Pagination */}
            {filteredGroups.length > 0 && (
                <Pagination
                    page={groupPage}
                    totalPages={groupTotalPages}
                    onPageChange={setGroupPage}
                    itemsPerPage={groupItemsPerPage}
                    onItemsPerPageChange={(newValue) => {
                        setGroupItemsPerPage(newValue);
                        setGroupPage(1);
                    }}
                    totalItems={filteredGroups.length}
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
                        boxShadow: `0 20px 60px ${alpha(COLORS.WARNING[900], 0.3)}`
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[700]} 100())`,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        py: 2.5
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Groups sx={{ fontSize: 32 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                            Chi tiết nhóm
                        </Typography>
                        <IconButton
                            onClick={() => setGroupDetailDialog({ open: false, group: null, pets: [] })}
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
                    {groupDetailDialog.group && (
                        <Stack spacing={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.WARNING[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.WARNING[200], 0.4)}`
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.WARNING[700], mb: 2 }}>
                                    👥 Thông tin nhóm
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tên nhóm:</Typography>
                                        <Typography sx={{ fontWeight: 700, flex: 1 }}>{groupDetailDialog.group.name}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Loài:</Typography>
                                        <Typography sx={{ flex: 1 }}>{getSpeciesName(groupDetailDialog.group.pet_species_id)}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Giống (nếu có):</Typography>
                                        <Typography sx={{ flex: 1 }}>
                                            {groupDetailDialog.group.pet_breed_id ? getBreedName(groupDetailDialog.group.pet_breed_id) : 'Tất cả'}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Sức chứa tối đa:</Typography>
                                        <Typography sx={{ flex: 1 }}>{groupDetailDialog.group.max_capacity}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Số lượng hiện tại:</Typography>
                                        <Typography sx={{ flex: 1 }}>{groupDetailDialog.group.current_count}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Typography sx={{ width: '180px', color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Mô tả:</Typography>
                                        <Typography sx={{ flex: 1 }}>{groupDetailDialog.group.description || '—'}</Typography>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.ERROR[50], 0.3),
                                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <PetsIcon sx={{ color: COLORS.ERROR[700], fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                        Thú cưng trong nhóm
                                    </Typography>
                                    <Chip
                                        label={groupDetailDialog.pets.length}
                                        size="small"
                                        sx={{
                                            background: alpha(COLORS.ERROR[100], 0.7),
                                            color: COLORS.ERROR[800],
                                            fontWeight: 700
                                        }}
                                    />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                {groupDetailDialog.pets.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {groupDetailDialog.pets.map((pet) => (
                                            <Paper
                                                key={pet.id}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    background: '#fff',
                                                    border: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                                    borderRadius: 2
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        src={pet.image_url}
                                                        alt={pet.name}
                                                        sx={{ width: 40, height: 40 }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 700 }}>{pet.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {getBreedName(pet.breed_id)} • {pet.age} tuổi • {pet.weight} kg
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={getPetHealthStatus(pet).label}
                                                        size="small"
                                                        sx={{
                                                            background: alpha(getPetHealthStatus(pet).bg, 0.7),
                                                            color: getPetHealthStatus(pet).color[800],
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center', py: 2 }}>
                                        Chưa có thú cưng trong nhóm này
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                    <Button
                        onClick={() => setGroupDetailDialog({ open: false, group: null, pets: [] })}
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[700]} 100())`,
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[800]} 100())`
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

export default GroupsTab;

