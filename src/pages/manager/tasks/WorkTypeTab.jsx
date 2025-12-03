import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Stack, Toolbar, TextField, Paper, alpha, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon, WorkOutline, CheckCircle, Cancel } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import WorkTypeFormModal from '../../../components/modals/WorkTypeFormModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import workTypeApi from '../../../api/workTypeApi';

const WorkTypeTab = ({ onAlert }) => {
    const [workTypes, setWorkTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [selectedWorkType, setSelectedWorkType] = useState(null);

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuWorkType, setMenuWorkType] = useState(null);

    // Confirm delete
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        loadWorkTypes();
    }, []);

    const loadWorkTypes = async () => {
        try {
            const response = await workTypeApi.getWorkTypes();
            if (response?.success) {
                setWorkTypes(response.data.filter(wt => !wt.is_deleted));
            } else {
                setWorkTypes(response?.data || []);
            }
        } catch (error) {
            console.error('Error loading work types:', error);
            onAlert?.({
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách loại công việc',
                type: 'error'
            });
        }
    };

    const filteredWorkTypes = useMemo(() => {
        if (!searchQuery) return workTypes;
        const query = searchQuery.toLowerCase();
        return workTypes.filter(wt =>
            wt.name?.toLowerCase().includes(query) ||
            wt.description?.toLowerCase().includes(query)
        );
    }, [workTypes, searchQuery]);

    const stats = useMemo(() => ({
        total: workTypes.length,
        active: workTypes.filter(wt => wt.is_active).length,
        inactive: workTypes.filter(wt => !wt.is_active).length
    }), [workTypes]);

    const handleCreate = () => {
        setFormMode('create');
        setSelectedWorkType(null);
        setFormModalOpen(true);
    };

    const handleEdit = (workType) => {
        setFormMode('edit');
        setSelectedWorkType(workType);
        setFormModalOpen(true);
        setMenuAnchor(null);
    };

    const handleDelete = (workType) => {
        setDeleteTarget(workType);
        setConfirmDeleteOpen(true);
        setMenuAnchor(null);
    };

    const handleFormSubmit = async (formData) => {
        try {
            let response;
            if (formMode === 'create') {
                response = await workTypeApi.createWorkType(formData);
                if (response?.success) {
                    // Luôn refetch để đồng bộ hoàn toàn với BE
                    await loadWorkTypes();
                    onAlert?.({
                        title: 'Thành công',
                        message: 'Tạo loại công việc thành công!',
                        type: 'success'
                    });
                } else {
                    onAlert?.({
                        title: 'Lỗi',
                        message: response?.message || 'Không thể tạo loại công việc',
                        type: 'error'
                    });
                }
            } else {
                response = await workTypeApi.updateWorkType(selectedWorkType.id, formData);
                if (response?.success) {
                    // Refetch từ BE sau khi cập nhật
                    await loadWorkTypes();
                    onAlert?.({
                        title: 'Thành công',
                        message: 'Cập nhật loại công việc thành công!',
                        type: 'success'
                    });
                } else {
                    onAlert?.({
                        title: 'Lỗi',
                        message: response?.message || 'Không thể cập nhật loại công việc',
                        type: 'error'
                    });
                }
            }
            setFormModalOpen(false);
        } catch (error) {
            console.error('Error submitting work type:', error);
            onAlert?.({
                title: 'Lỗi',
                message: error.message || 'Không thể lưu loại công việc',
                type: 'error'
            });
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await workTypeApi.deleteWorkType(deleteTarget.id);
            if (response?.success) {
                await loadWorkTypes();
                onAlert?.({
                    title: 'Thành công',
                    message: 'Xóa loại công việc thành công!',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error deleting work type:', error);
            onAlert?.({
                title: 'Lỗi',
                message: error.message || 'Không thể xóa loại công việc',
                type: 'error'
            });
        } finally {
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
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
                    { label: 'Tổng loại công việc', value: stats.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Đang hoạt động', value: stats.active, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Không hoạt động', value: stats.inactive, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${2 * 16}px) / 3)`;
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
            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Tìm kiếm loại công việc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ width: '1395px', flexShrink: 0 }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                        sx={{
                            bgcolor: COLORS.PRIMARY[500],
                            '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                        }}
                    >
                        Tạo loại công việc
                    </Button>
                </Toolbar>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                <Table size="medium" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }} width="5%">STT</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="20%">Tên loại công việc</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} width="55%">Mô tả</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="10%">Trạng thái</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center" width="10%">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredWorkTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {searchQuery ? 'Không tìm thấy loại công việc nào' : 'Chưa có loại công việc nào'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWorkTypes.map((workType, index) => (
                                <TableRow key={workType.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <WorkOutline fontSize="small" sx={{ color: COLORS.PRIMARY[500] }} />
                                            <Typography variant="body2" fontWeight={600}>
                                                {workType.name}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {workType.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={workType.is_active ? <CheckCircle /> : <Cancel />}
                                            label={workType.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                            size="small"
                                            sx={{
                                                bgcolor: workType.is_active
                                                    ? alpha(COLORS.SUCCESS[100], 0.8)
                                                    : alpha(COLORS.ERROR[100], 0.8),
                                                color: workType.is_active
                                                    ? COLORS.SUCCESS[700]
                                                    : COLORS.ERROR[700],
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setMenuAnchor(e.currentTarget);
                                                setMenuWorkType(workType);
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Form Modal */}
            <WorkTypeFormModal
                open={formModalOpen}
                onClose={() => {
                    setFormModalOpen(false);
                    setSelectedWorkType(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedWorkType}
                mode={formMode}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={confirmDelete}
                title="Xóa loại công việc?"
                message={`Bạn có chắc chắn muốn xóa loại công việc "${deleteTarget?.name}"?`}
                confirmText="Xóa"
                type="error"
            />

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null);
                    setMenuWorkType(null);
                }}
            >
                <MenuItem onClick={() => handleEdit(menuWorkType)}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDelete(menuWorkType)}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default WorkTypeTab;

