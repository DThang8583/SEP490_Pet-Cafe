import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import { Edit, Delete } from '@mui/icons-material';

const mockFetchStaff = () => new Promise((resolve) => {
    setTimeout(() => {
        resolve([
            {
                id: 'u-001',
                full_name: 'Nguyễn Văn An',
                phone: '0901 111 222',
                email: 'an@petcafe.com',
                address: '12 Trần Hưng Đạo, Q1, TP.HCM',
                salary: 8000000,
                role: 'sale_staff',
                status: 'active',
                avatar_url: 'https://i.pravatar.cc/150?img=1'
            },
            {
                id: 'u-002',
                full_name: 'Trần Thị Bình',
                phone: '0902 222 333',
                email: 'binh@petcafe.com',
                address: '45 Lê Lợi, Q1, TP.HCM',
                salary: 7500000,
                role: 'sale_staff',
                status: 'active',
                avatar_url: 'https://i.pravatar.cc/150?img=5'
            },
            {
                id: 'u-003',
                full_name: 'Lê Văn Chi',
                phone: '0903 333 444',
                email: 'chi@petcafe.com',
                address: '88 Nguyễn Trãi, Q5, TP.HCM',
                salary: 9000000,
                role: 'working_staff',
                status: 'on_leave',
                avatar_url: 'https://i.pravatar.cc/150?img=12'
            },
            {
                id: 'u-004',
                full_name: 'Phạm Thị Dung',
                phone: '0904 444 555',
                email: 'dung@petcafe.com',
                address: '23 CMT8, Q10, TP.HCM',
                salary: 7000000,
                role: 'working_staff',
                status: 'active',
                avatar_url: 'https://i.pravatar.cc/150?img=9'
            },
            {
                id: 'u-005',
                full_name: 'Hoàng Văn Minh',
                phone: '0905 555 666',
                email: 'minh@petcafe.com',
                address: '101 Điện Biên Phủ, Q3, TP.HCM',
                salary: 8500000,
                role: 'working_staff',
                status: 'active',
                avatar_url: 'https://i.pravatar.cc/150?img=13'
            },
            {
                id: 'u-006',
                full_name: 'Vũ Thị Nga',
                phone: '0906 666 777',
                email: 'nga@petcafe.com',
                address: '5 Pasteur, Q1, TP.HCM',
                salary: 6500000,
                role: 'sale_staff',
                status: 'on_leave',
                avatar_url: 'https://i.pravatar.cc/150?img=10'
            },
        ]);
    }, 500);
});

const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salary);
};

const roleLabel = (r) => {
    switch (r) {
        case 'sale_staff': return 'Sale staff';
        case 'working_staff': return 'Working staff';
        default: return r;
    }
};

const roleColor = (r) => {
    switch (r) {
        case 'sale_staff': return { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] };
        case 'working_staff': return { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] };
        default: return { bg: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY };
    }
};

const statusColor = (s) => {
    switch (s) {
        case 'active': return { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700], label: 'Đang làm' };
        case 'on_leave': return { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700], label: 'Nghỉ phép' };
        default: return { bg: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY, label: s || '—' };
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
    const [editOpen, setEditOpen] = useState(false);
    const [editMode, setEditMode] = useState('add');
    const [editForm, setEditForm] = useState({
        id: '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        salary: '',
        role: '',
        status: 'active',
        avatar_url: '',
        password: ''
    });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState('');
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setError('');
                const data = await mockFetchStaff();
                setStaff(data);
            } catch (e) {
                setError('Không thể tải danh sách nhân viên');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        return staff.filter(s => {
            if (filterRole !== 'all' && s.role !== filterRole) return false;
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            const text = `${s.full_name} ${s.email} ${s.phone}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [staff, q, filterRole, filterStatus]);

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentPageStaff = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filtered]);

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
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Quản lý nhân viên</Typography>
                    <Chip label={`Tổng: ${staff.length}`} size="small" sx={{ background: alpha(COLORS.SECONDARY[100], 0.7), color: COLORS.SECONDARY[800], fontWeight: 700 }} />
                </Stack>

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
                            <MenuItem value="sale_staff">Sale staff</MenuItem>
                            <MenuItem value="working_staff">Working staff</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="active">Đang làm</MenuItem>
                            <MenuItem value="on_leave">Nghỉ phép</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        onClick={() => {
                            setEditMode('add');
                            setEditForm({
                                id: '',
                                full_name: '',
                                email: '',
                                phone: '',
                                address: '',
                                salary: '',
                                role: '',
                                status: 'active',
                                avatar_url: '',
                                password: ''
                            });
                            setEditOpen(true);
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
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Lương</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Vai trò</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageStaff.map((s) => {
                                const rColor = roleColor(s.role);
                                const st = statusColor(s.status);
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
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                            {formatSalary(s.salary)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={roleLabel(s.role)} sx={{ background: rColor.bg, color: rColor.color, fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" label={st.label} sx={{ background: st.bg, color: st.color, fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => {
                                                    setEditMode('edit');
                                                    setEditForm({
                                                        ...s,
                                                        password: '' // Don't show password when editing
                                                    });
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setPendingDeleteId(s.id);
                                                    setConfirmDeleteOpen(true);
                                                }}
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

                {/* Add/Edit Staff Dialog */}
                <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                            {editMode === 'add' ? 'Thêm nhân viên' : 'Sửa thông tin nhân viên'}
                        </Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Họ và tên *"
                                value={editForm.full_name}
                                error={!!formErrors.full_name}
                                helperText={formErrors.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Email *"
                                type="email"
                                value={editForm.email}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Số điện thoại *"
                                value={editForm.phone}
                                error={!!formErrors.phone}
                                helperText={formErrors.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Địa chỉ *"
                                value={editForm.address}
                                error={!!formErrors.address}
                                helperText={formErrors.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Lương (VNĐ) *"
                                type="number"
                                value={editForm.salary}
                                error={!!formErrors.salary}
                                helperText={formErrors.salary}
                                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                                fullWidth
                            />
                            <FormControl fullWidth error={!!formErrors.role}>
                                <InputLabel>Vai trò *</InputLabel>
                                <Select
                                    label="Vai trò *"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                >
                                    <MenuItem value="sale_staff">Sale staff</MenuItem>
                                    <MenuItem value="working_staff">Working staff</MenuItem>
                                </Select>
                                {formErrors.role && (
                                    <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5 }}>
                                        {formErrors.role}
                                    </Typography>
                                )}
                            </FormControl>
                            <FormControl fullWidth error={!!formErrors.status}>
                                <InputLabel>Trạng thái *</InputLabel>
                                <Select
                                    label="Trạng thái *"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <MenuItem value="active">Đang làm</MenuItem>
                                    <MenuItem value="on_leave">Nghỉ phép</MenuItem>
                                </Select>
                                {formErrors.status && (
                                    <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5 }}>
                                        {formErrors.status}
                                    </Typography>
                                )}
                            </FormControl>
                            <TextField
                                label="URL Avatar"
                                value={editForm.avatar_url}
                                onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                                fullWidth
                                placeholder="https://example.com/avatar.jpg"
                                helperText="Để trống nếu muốn sử dụng avatar mặc định"
                            />
                            {editMode === 'add' && (
                                <TextField
                                    label="Mật khẩu *"
                                    type="password"
                                    value={editForm.password}
                                    error={!!formErrors.password}
                                    helperText={formErrors.password || "Mật khẩu cho tài khoản nhân viên"}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    fullWidth
                                />
                            )}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setEditOpen(false)}>Hủy</Button>
                        <Button variant="contained" onClick={() => {
                            // Validation
                            const errs = {};
                            if (!editForm.full_name?.trim()) errs.full_name = 'Bắt buộc';
                            if (!editForm.email?.trim()) errs.email = 'Bắt buộc';
                            if (!editForm.phone?.trim()) errs.phone = 'Bắt buộc';
                            if (!editForm.address?.trim()) errs.address = 'Bắt buộc';
                            if (!editForm.salary || parseFloat(editForm.salary) <= 0) errs.salary = 'Lương phải lớn hơn 0';
                            if (!editForm.role) errs.role = 'Bắt buộc';
                            if (!editForm.status) errs.status = 'Bắt buộc';
                            if (editMode === 'add' && !editForm.password?.trim()) errs.password = 'Bắt buộc';

                            setFormErrors(errs);
                            if (Object.keys(errs).length) return;

                            let next = [...staff];
                            if (editMode === 'add') {
                                const newItem = {
                                    ...editForm,
                                    id: `u-${Math.random().toString(36).slice(2, 7)}`,
                                    salary: parseFloat(editForm.salary)
                                };
                                // Don't save password in state (it would be sent to API)
                                delete newItem.password;
                                next.push(newItem);
                            } else {
                                const idx = next.findIndex(x => x.id === editForm.id);
                                if (idx !== -1) {
                                    next[idx] = {
                                        ...editForm,
                                        salary: parseFloat(editForm.salary)
                                    };
                                }
                            }
                            setStaff(next);
                            setEditOpen(false);
                            setFormErrors({});
                        }}>Lưu</Button>
                    </Stack>
                </Dialog>

                {/* Confirm delete staff */}
                <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                    <DialogTitle>Xóa nhân viên</DialogTitle>
                    <DialogContent>Bạn có chắc muốn xóa nhân viên này?</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDeleteOpen(false)}>Hủy</Button>
                        <Button color="error" variant="contained" onClick={() => {
                            setStaff(prev => prev.filter(s => s.id !== pendingDeleteId));
                            setConfirmDeleteOpen(false);
                        }}>Xóa</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default StaffPage;


