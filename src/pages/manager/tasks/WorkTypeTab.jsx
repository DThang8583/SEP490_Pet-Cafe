import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Stack,
    Toolbar,
    TextField,
    Grid,
    Paper,
    alpha,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    WorkOutline,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import WorkTypeFormModal from '../../../components/modals/WorkTypeFormModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import workTypeApi from '../../../api/workTypeApi';

const WorkTypeTab = ({ onAlert }) => {
    const [loading, setLoading] = useState(false);
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
            setLoading(true);
            const response = await workTypeApi.getWorkTypes();
            if (response.success) {
                setWorkTypes(response.data.filter(wt => !wt.is_deleted));
            }
        } catch (error) {
            console.error('Error loading work types:', error);
            onAlert?.({
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách loại công việc',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkTypes = workTypes.filter(wt =>
        wt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wt.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: workTypes.length,
        active: workTypes.filter(wt => wt.is_active).length,
        inactive: workTypes.filter(wt => !wt.is_active).length
    };

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
            if (formMode === 'create') {
                const response = await workTypeApi.createWorkType(formData);
                if (response.success) {
                    setWorkTypes(prev => [...prev, response.data]);
                    onAlert?.({
                        title: 'Thành công',
                        message: 'Tạo loại công việc thành công!',
                        type: 'success'
                    });
                }
            } else {
                const response = await workTypeApi.updateWorkType(selectedWorkType.id, formData);
                if (response.success) {
                    setWorkTypes(prev => prev.map(wt =>
                        wt.id === selectedWorkType.id ? response.data : wt
                    ));
                    onAlert?.({
                        title: 'Thành công',
                        message: 'Cập nhật loại công việc thành công!',
                        type: 'success'
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
            if (response.success) {
                setWorkTypes(prev => prev.filter(wt => wt.id !== deleteTarget.id));
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
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tổng loại công việc
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
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
                    <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.ERROR[500]}` }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Không hoạt động
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color={COLORS.ERROR[700]}>
                            {stats.inactive}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Paper sx={{ mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Tìm kiếm loại công việc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ minWidth: 300 }}
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
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                        <TableRow>
                            <TableCell width="5%">STT</TableCell>
                            <TableCell width="20%">Tên loại công việc</TableCell>
                            <TableCell width="55%">Mô tả</TableCell>
                            <TableCell width="10%" align="center">Trạng thái</TableCell>
                            <TableCell width="10%" align="center">Thao tác</TableCell>
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
                                            <MoreVertIcon fontSize="small" />
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

