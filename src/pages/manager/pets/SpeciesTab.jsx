import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, TextField, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Toolbar, Grid, alpha, Menu, MenuItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import { Add, Edit, Delete, Search, Pets, Block, MoreVert } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import AlertModal from '../../../components/modals/AlertModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import AddSpeciesModal from '../../../components/modals/AddSpeciesModal';
import petSpeciesApi from '../../../api/petSpeciesApi';

const SpeciesTab = ({ onDataChange }) => {
    // Species state
    const [species, setSpecies] = useState([]);
    const [openSpeciesDialog, setOpenSpeciesDialog] = useState(false);
    const [openDeleteSpeciesDialog, setOpenDeleteSpeciesDialog] = useState(false);
    const [openToggleSpeciesDialog, setOpenToggleSpeciesDialog] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState(null);
    const [deleteSpeciesId, setDeleteSpeciesId] = useState(null);
    const [toggleSpecies, setToggleSpecies] = useState(null);
    const [speciesSearchQuery, setSpeciesSearchQuery] = useState('');
    const [speciesActiveFilter, setSpeciesActiveFilter] = useState(undefined);

    // Menu state
    const [speciesMenuAnchor, setSpeciesMenuAnchor] = useState(null);
    const [menuSpecies, setMenuSpecies] = useState(null);

    // Alert state
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Load species
    const loadSpecies = async () => {
        try {
            // If filter is "all" (undefined), fetch all species without filter
            if (speciesActiveFilter === undefined) {
                const response = await petSpeciesApi.getAllSpecies();
                const allSpecies = response?.data || [];

                // Deduplicate by id to prevent duplicates
                const uniqueSpecies = Array.from(
                    new Map(allSpecies.map(item => [item.id, item])).values()
                );

                setSpecies(uniqueSpecies);
            } else {
                // For "active" or "inactive" filter, use single request
                const response = await petSpeciesApi.getAllSpecies({
                    is_active: speciesActiveFilter
                });
                const filteredSpecies = response?.data || [];

                // Deduplicate by id to prevent duplicates
                const uniqueSpecies = Array.from(
                    new Map(filteredSpecies.map(item => [item.id, item])).values()
                );

                setSpecies(uniqueSpecies);
            }
        } catch (error) {
            console.error('Error loading species:', error);
            const errorMessage = error.message || 'Lỗi tải dữ liệu loài!';
            setAlert({
                open: true,
                title: 'Lỗi',
                message: errorMessage,
                type: 'error'
            });
        }
    };

    useEffect(() => {
        loadSpecies();
    }, [speciesActiveFilter]);

    // Statistics
    const stats = useMemo(() => ({
        total: species.length,
        active: species.filter(s => s.is_active).length,
        inactive: species.filter(s => !s.is_active).length
    }), [species]);

    // Filtered species
    const filteredSpecies = useMemo(() => {
        if (!speciesSearchQuery) return species;
        const query = speciesSearchQuery.toLowerCase();
        return species.filter(sp =>
            sp.name?.toLowerCase().includes(query) ||
            (sp.description && sp.description.toLowerCase().includes(query))
        );
    }, [species, speciesSearchQuery]);

    const handleOpenSpeciesDialog = (speciesItem = null) => {
        setEditingSpecies(speciesItem);
        setOpenSpeciesDialog(true);
    };

    const handleCloseSpeciesDialog = () => {
        setOpenSpeciesDialog(false);
        setEditingSpecies(null);
    };

    const handleSaveSpecies = async (speciesData) => {
        try {
            if (editingSpecies) {
                await petSpeciesApi.updateSpecies(editingSpecies.id, speciesData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Cập nhật loài thành công!',
                    type: 'success'
                });
            } else {
                await petSpeciesApi.createSpecies(speciesData);
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Thêm loài mới thành công!',
                    type: 'success'
                });
            }
            handleCloseSpeciesDialog();
            loadSpecies();
            // Refresh all data in PetsPage to update species list in other tabs
            if (onDataChange) {
                await onDataChange();
            }
        } catch (error) {
            console.error('Error saving species:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi lưu loài!',
                type: 'error'
            });
        }
    };

    const handleDeleteSpecies = (speciesId) => {
        setDeleteSpeciesId(speciesId);
        setOpenDeleteSpeciesDialog(true);
    };

    const confirmDeleteSpecies = async () => {
        try {
            await petSpeciesApi.deleteSpecies(deleteSpeciesId);
            setAlert({
                open: true,
                title: 'Thành công',
                message: 'Xóa loài thành công!',
                type: 'success'
            });
            loadSpecies();
            // Refresh all data in PetsPage to update species list in other tabs
            if (onDataChange) {
                await onDataChange();
            }
        } catch (error) {
            console.error('Error deleting species:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Lỗi khi xóa loài!',
                type: 'error'
            });
        } finally {
            setOpenDeleteSpeciesDialog(false);
            setDeleteSpeciesId(null);
        }
    };

    const handleToggleSpeciesStatus = (speciesItem) => {
        setToggleSpecies(speciesItem);
        setOpenToggleSpeciesDialog(true);
    };

    const confirmToggleSpeciesStatus = async () => {
        if (!toggleSpecies) return;

        const willDisable = toggleSpecies.is_active;
        try {
            const response = await petSpeciesApi.toggleSpeciesStatus(toggleSpecies.id, willDisable);
            setAlert({
                open: true,
                title: 'Thành công',
                message: response.message || 'Đã cập nhật trạng thái loài!',
                type: 'success'
            });
            loadSpecies();
            // Refresh all data in PetsPage to update species list in other tabs
            if (onDataChange) {
                await onDataChange();
            }
        } catch (error) {
            console.error('Error toggling species status:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật trạng thái',
                type: 'error'
            });
        } finally {
            setOpenToggleSpeciesDialog(false);
            setToggleSpecies(null);
        }
    };

    return (
        <Box>
            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng loài
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                            {stats.total}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Đang hoạt động
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                            {stats.active}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Vô hiệu hóa
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                            {stats.inactive}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Toolbar
                disableGutters
                sx={{
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.6)}, ${alpha(COLORS.SECONDARY[50], 0.4)})`,
                    border: `1px solid ${alpha(COLORS.BORDER.PRIMARY, 0.4)}`
                }}
            >
                <TextField
                    size="small"
                    placeholder="Tìm theo tên, mô tả..."
                    value={speciesSearchQuery}
                    onChange={(e) => setSpeciesSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                    }}
                    sx={{ width: '1330px', flexShrink: 0 }}
                />
                <TextField
                    select
                    size="small"
                    value={speciesActiveFilter === undefined ? '' : speciesActiveFilter ? 'true' : 'false'}
                    onChange={(e) => {
                        const v = e.target.value;
                        setSpeciesActiveFilter(v === '' ? undefined : v === 'true');
                    }}
                    SelectProps={{ native: true }}
                    sx={{ minWidth: 160 }}
                    label="Trạng thái"
                    InputLabelProps={{ shrink: true }}
                >
                    <option value="">Tất cả</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                </TextField>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenSpeciesDialog()}
                    sx={{
                        bgcolor: COLORS.ERROR[500],
                        '&:hover': { bgcolor: COLORS.ERROR[600] }
                    }}
                >
                    Thêm loài
                </Button>
            </Toolbar>

            {/* Table */}
            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                    boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`
                }}
            >
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: alpha(COLORS.ERROR[50], 0.6) } }}>
                            <TableCell sx={{ fontWeight: 800 }}>Tên loài</TableCell>
                            <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSpecies.map((speciesItem) => (
                            <TableRow
                                key={speciesItem.id}
                                hover
                                sx={{ '&:hover': { backgroundColor: alpha(COLORS.ERROR[50], 0.5) } }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>
                                    {capitalizeName(speciesItem.name)}
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 480 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {speciesItem.description || '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={speciesItem.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                                        size="small"
                                        color={speciesItem.is_active ? 'success' : 'default'}
                                        variant={speciesItem.is_active ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            color={speciesItem.is_active ? 'default' : 'success'}
                                            onClick={() => handleToggleSpeciesStatus(speciesItem)}
                                            title={speciesItem.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                        >
                                            <Block fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setSpeciesMenuAnchor(e.currentTarget);
                                                setMenuSpecies(speciesItem);
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Empty State */}
            {filteredSpecies.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Pets sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                        Không tìm thấy loài nào
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        Thử thay đổi bộ lọc hoặc thêm loài mới
                    </Typography>
                </Box>
            )}

            {/* Modals */}
            <AddSpeciesModal
                open={openSpeciesDialog}
                onClose={handleCloseSpeciesDialog}
                onSave={handleSaveSpecies}
                editingSpecies={editingSpecies}
            />

            <ConfirmModal
                isOpen={openDeleteSpeciesDialog}
                onClose={() => {
                    setOpenDeleteSpeciesDialog(false);
                    setDeleteSpeciesId(null);
                }}
                onConfirm={confirmDeleteSpecies}
                title="Xóa loài"
                message="Bạn có chắc chắn muốn xóa loài này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            <ConfirmModal
                isOpen={openToggleSpeciesDialog}
                onClose={() => {
                    setOpenToggleSpeciesDialog(false);
                    setToggleSpecies(null);
                }}
                onConfirm={confirmToggleSpeciesStatus}
                title={toggleSpecies?.is_active ? 'Vô hiệu hóa loài' : 'Kích hoạt loài'}
                message={
                    toggleSpecies?.is_active
                        ? `Loài "${capitalizeName(toggleSpecies?.name)}" sẽ bị vô hiệu hóa. Bạn có chắc chắn muốn tiếp tục?`
                        : `Loài "${capitalizeName(toggleSpecies?.name)}" sẽ được kích hoạt lại. Bạn có chắc chắn muốn tiếp tục?`
                }
                confirmText={toggleSpecies?.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                cancelText="Hủy"
                type={toggleSpecies?.is_active ? 'warning' : 'success'}
            />

            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            {/* Species Actions Menu */}
            <Menu
                anchorEl={speciesMenuAnchor}
                open={Boolean(speciesMenuAnchor)}
                onClose={() => {
                    setSpeciesMenuAnchor(null);
                    setMenuSpecies(null);
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
                        if (menuSpecies) {
                            handleOpenSpeciesDialog(menuSpecies);
                        }
                        setSpeciesMenuAnchor(null);
                        setMenuSpecies(null);
                    }}
                >
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuSpecies) {
                            handleDeleteSpecies(menuSpecies.id);
                        }
                        setSpeciesMenuAnchor(null);
                        setMenuSpecies(null);
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

export default SpeciesTab;