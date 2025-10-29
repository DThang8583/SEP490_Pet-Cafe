import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, Grid, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AddStaffModal from '../../components/modals/AddStaffModal';
import AlertModal from '../../components/modals/AlertModal';
import { Edit, Delete, People, PersonAdd, Person, EventBusy, MoreVert } from '@mui/icons-material';
import employeeApi from '../../api/employeeApi';

const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salary);
};

const roleLabel = (r) => {
    switch (r) {
        case 'SALE_STAFF': return 'Sale Staff';
        case 'WORKING_STAFF': return 'Working Staff';
        default: return r;
    }
};

const roleColor = (r) => {
    switch (r) {
        case 'SALE_STAFF': return { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] };
        case 'WORKING_STAFF': return { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] };
        default: return { bg: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY };
    }
};

const statusColor = (isActive) => {
    if (isActive) {
        return { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700], label: 'Hoạt động' };
    } else {
        return { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700], label: 'Không hoạt động' };
    }
};

const StaffPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [staff, setStaff] = useState([]);
    const [q, setQ] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState('');

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuStaff, setMenuStaff] = useState(null);

    // Load staff data from API
    useEffect(() => {
        const loadStaff = async () => {
            try {
                setIsLoading(true);
                setError('');
                const response = await employeeApi.getEmployees();
                if (response.success) {
                    setStaff(response.data);
                }
            } catch (e) {
                setError(e.message || 'Không thể tải danh sách nhân viên');
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: e.message || 'Không thể tải danh sách nhân viên',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadStaff();
    }, []);

    const filtered = useMemo(() => {
        return staff.filter(s => {
            if (filterRole !== 'all' && s.sub_role !== filterRole) return false;
            if (filterStatus !== 'all') {
                const isActive = s.account?.is_active;
                if (filterStatus === 'active' && !isActive) return false;
                if (filterStatus === 'inactive' && isActive) return false;
            }
            const text = `${s.full_name} ${s.email} ${s.phone}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [staff, q, filterRole, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: staff.length,
            saleStaff: staff.filter(s => s.sub_role === 'SALE_STAFF').length,
            workingStaff: staff.filter(s => s.sub_role === 'WORKING_STAFF').length,
            active: staff.filter(s => s.account?.is_active === true).length,
            inactive: staff.filter(s => s.account?.is_active === false).length
        };
    }, [staff]);

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentPageStaff = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filtered]);

    // Handle submit staff (add/edit)
    const handleSubmitStaff = async (staffData) => {
        try {
            setIsSubmitting(true);

            if (editMode) {
                // Update existing staff
                const response = await employeeApi.updateEmployee(selectedStaff.id, {
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    sub_role: staffData.sub_role,
                    skills: staffData.skills || [],
                    avatar_url: staffData.avatar_url || selectedStaff.avatar_url || '',
                    password: staffData.password || undefined
                });

                if (response.success) {
                    // Update local state
                    setStaff(prev => prev.map(s =>
                        s.id === selectedStaff.id ? response.data : s
                    ));

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Cập nhật thông tin nhân viên thành công!',
                        type: 'success'
                    });
                }
            } else {
                // Add new staff
                const response = await employeeApi.createEmployee({
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    sub_role: staffData.sub_role,
                    skills: staffData.skills || [],
                    avatar_url: staffData.avatar_url || '',
                    password: staffData.password
                });

                if (response.success) {
                    // Add to local state
                    setStaff(prev => [...prev, response.data]);

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Thêm nhân viên mới thành công!',
                        type: 'success'
                    });
                }
            }

            // Close modal
            setAddStaffModalOpen(false);
            setSelectedStaff(null);
            setEditMode(false);
        } catch (error) {
            console.error('Error submitting staff:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin nhân viên',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
                <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải danh sách nhân viên..." />
            </Box>
        );
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600], mb: 3 }}>
                    Quản lý nhân viên
                </Typography>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng nhân viên
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {stats.total}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Sale Staff
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {stats.saleStaff}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Working Staff
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                {stats.workingStaff}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Hoạt động
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.active}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={2.4}>
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

                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 280 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Vai trò</InputLabel>
                        <Select label="Vai trò" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="SALE_STAFF">Sale Staff</MenuItem>
                            <MenuItem value="WORKING_STAFF">Working Staff</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="active">Hoạt động</MenuItem>
                            <MenuItem value="inactive">Không hoạt động</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        onClick={() => {
                            setEditMode(false);
                            setSelectedStaff(null);
                            setAddStaffModalOpen(true);
                        }}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Thêm nhân viên
                    </Button>
                </Toolbar>

                {/* Staff List Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`, overflowX: 'auto' }}>
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Nhân viên</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>SĐT</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Địa chỉ</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', xl: 'table-cell' } }}>Kỹ năng</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Lương</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Vai trò</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageStaff.map((s) => {
                                const rColor = roleColor(s.sub_role);
                                const st = statusColor(s.account?.is_active);
                                return (
                                    <TableRow key={s.id} hover>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Avatar src={s.avatar_url} alt={s.full_name} sx={{ width: 40, height: 40 }} />
                                                <Typography sx={{ fontWeight: 600 }}>{s.full_name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.email}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.phone}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{s.address || '—'}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                                                {s.skills && s.skills.length > 0 ? (
                                                    s.skills.map((skill, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={skill}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                height: 22,
                                                                bgcolor: alpha(COLORS.INFO[100], 0.7),
                                                                color: COLORS.INFO[800],
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                            <Typography variant="body2" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                                {formatSalary(s.salary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={roleLabel(s.sub_role)} sx={{ background: rColor.bg, color: rColor.color, fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={st.label} sx={{ background: st.bg, color: st.color, fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setMenuAnchor(e.currentTarget);
                                                    setMenuStaff(s);
                                                }}
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {filtered.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={filtered.length}
                    />
                )}

                {/* Add/Edit Staff Modal */}
                <AddStaffModal
                    isOpen={addStaffModalOpen}
                    onClose={() => {
                        setAddStaffModalOpen(false);
                        setSelectedStaff(null);
                        setEditMode(false);
                    }}
                    onSubmit={handleSubmitStaff}
                    editMode={editMode}
                    initialData={selectedStaff}
                    isLoading={isSubmitting}
                />

                {/* Confirm Delete Modal */}
                <ConfirmModal
                    isOpen={confirmDeleteOpen}
                    onClose={() => {
                        setConfirmDeleteOpen(false);
                        setPendingDeleteId('');
                    }}
                    onConfirm={async () => {
                        try {
                            const response = await employeeApi.deleteEmployee(pendingDeleteId);
                            if (response.success) {
                                setStaff(prev => prev.filter(s => s.id !== pendingDeleteId));
                                setAlert({
                                    open: true,
                                    title: 'Thành công',
                                    message: 'Xóa nhân viên thành công!',
                                    type: 'success'
                                });
                            }
                        } catch (error) {
                            setAlert({
                                open: true,
                                title: 'Lỗi',
                                message: error.message || 'Không thể xóa nhân viên',
                                type: 'error'
                            });
                        } finally {
                            setConfirmDeleteOpen(false);
                            setPendingDeleteId('');
                        }
                    }}
                    title="Xóa nhân viên"
                    message="Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác."
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

                {/* Staff Actions Menu */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => {
                        setMenuAnchor(null);
                        setMenuStaff(null);
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
                            if (menuStaff) {
                                setEditMode(true);
                                setSelectedStaff(menuStaff);
                                setAddStaffModalOpen(true);
                            }
                            setMenuAnchor(null);
                            setMenuStaff(null);
                        }}
                    >
                        <ListItemIcon>
                            <Edit fontSize="small" sx={{ color: COLORS.INFO[600] }} />
                        </ListItemIcon>
                        <ListItemText>Chỉnh sửa</ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            if (menuStaff) {
                                setPendingDeleteId(menuStaff.id);
                                setConfirmDeleteOpen(true);
                            }
                            setMenuAnchor(null);
                            setMenuStaff(null);
                        }}
                    >
                        <ListItemIcon>
                            <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                        </ListItemIcon>
                        <ListItemText>Xóa</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
};

export default StaffPage;
