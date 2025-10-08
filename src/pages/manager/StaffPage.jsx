import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Menu } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import { Edit, Delete, GroupAdd } from '@mui/icons-material';

const mockFetchStaff = () => new Promise((resolve) => {
    setTimeout(() => {
        resolve([
            { id: 'u-001', name: 'Nguyễn An', role: 'sale_staff', status: 'active', group: 'Sale A', phone: '0901 111 222', email: 'an@example.com', dob: '12/04/1999', address: '12 Trần Hưng Đạo, Q1, TP.HCM' },
            { id: 'u-002', name: 'Trần Bình', role: 'sale_staff', status: 'active', group: 'Sale A', phone: '0902 222 333', email: 'binh@example.com', dob: '03/10/1998', address: '45 Lê Lợi, Q1, TP.HCM' },
            { id: 'u-003', name: 'Lê Chi', role: 'working_staff', status: 'on_leave', group: 'Pha chế', phone: '0903 333 444', email: 'chi@example.com', dob: '20/02/2000', address: '88 Nguyễn Trãi, Q5, TP.HCM' },
            { id: 'u-004', name: 'Phạm Dũng', role: 'working_staff', status: 'active', group: 'Pha chế', phone: '0904 444 555', email: 'dung@example.com', dob: '15/07/1997', address: '23 CMT8, Q10, TP.HCM' },
            { id: 'u-005', name: 'Hoàng Mai', role: 'sale_staff', status: 'on_leave', group: 'Sale B', phone: '0905 555 666', email: 'mai@example.com', dob: '30/09/1995', address: '101 Điện Biên Phủ, Q3, TP.HCM' },
            { id: 'u-006', name: 'Vũ Nam', role: 'working_staff', status: 'active', group: 'Bếp', phone: '0906 666 777', email: 'nam@example.com', dob: '11/12/1994', address: '5 Pasteur, Q1, TP.HCM' },
        ]);
    }, 500);
});

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
    const [editOpen, setEditOpen] = useState(false);
    const [editMode, setEditMode] = useState('add');
    const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '', dob: '', address: '', role: '', status: 'active' });
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [groupForm, setGroupForm] = useState({ mode: 'create', currentGroup: '', newGroupName: '', leaderId: '', moveToGroup: '' });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [tab, setTab] = useState('list');
    const [shifts, setShifts] = useState(['Sáng', 'Chiều', 'Tối']);
    const [shiftAssign, setShiftAssign] = useState({});
    const [shiftLeaders, setShiftLeaders] = useState({}); // { shiftName: staffId }
    const [shiftRoles, setShiftRoles] = useState({}); // { shiftName: { staffId: role } }
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
    const [shiftForm, setShiftForm] = useState({ mode: 'create', currentShift: '', newShiftName: '' });

    // Group management within Shifts
    const [leaderDialogOpen, setLeaderDialogOpen] = useState(false);
    const [leaderContext, setLeaderContext] = useState({ key: '', staffId: '' });
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameContext, setRenameContext] = useState({ shiftName: '', oldGroupName: '', newGroupName: '' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState({ shiftName: '', groupName: '' });

    // Edit members in a group within a shift
    const [editMembersOpen, setEditMembersOpen] = useState(false);
    const [editMembersContext, setEditMembersContext] = useState({ shiftName: '', groupName: '', selectedIds: [], query: '' });

    // Track saved groups to show edit button
    const [savedGroups, setSavedGroups] = useState(new Set());
    // Edit menu (for saved groups)
    const [editMenuAnchor, setEditMenuAnchor] = useState(null);
    const [editMenuContext, setEditMenuContext] = useState({ shiftName: '', groupName: '' });

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

    // Persist shift/group assignments for use in TasksPage
    useEffect(() => {
        const payload = {
            shifts,
            shiftAssign,
            staff: staff.map(s => ({ id: s.id, name: s.name, role: s.role, status: s.status, group: s.group })),
            leaders: shiftLeaders,
            savedGroups: Array.from(savedGroups)
        };
        try { localStorage.setItem('mgr_shift_data', JSON.stringify(payload)); } catch { }
    }, [shifts, shiftAssign, staff, shiftLeaders, savedGroups]);

    const groups = useMemo(() => {
        return Array.from(new Set(staff.map(s => s.group).filter(Boolean))).sort();
    }, [staff]);

    const filtered = useMemo(() => {
        return staff.filter(s => {
            if (filterRole !== 'all' && s.role !== filterRole) return false;
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            const text = `${s.name} ${s.email} ${s.phone} ${s.group}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [staff, q, filterRole, filterStatus]);

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

                {/* Tabs as chips */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip label="Danh sách" onClick={() => setTab('list')} sx={{ cursor: 'pointer', background: tab === 'list' ? alpha(COLORS.ERROR[100], 0.7) : alpha(COLORS.SECONDARY[50], 0.8), color: tab === 'list' ? COLORS.ERROR[700] : COLORS.TEXT.SECONDARY, fontWeight: tab === 'list' ? 800 : 600 }} />
                    <Chip label="Ca làm" onClick={() => setTab('shifts')} sx={{ cursor: 'pointer', background: tab === 'shifts' ? alpha(COLORS.ERROR[100], 0.7) : alpha(COLORS.SECONDARY[50], 0.8), color: tab === 'shifts' ? COLORS.ERROR[700] : COLORS.TEXT.SECONDARY, fontWeight: tab === 'shifts' ? 800 : 600 }} />
                </Stack>

                {tab === 'list' && (
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
                        <Button variant="contained" onClick={() => { setEditMode('add'); setEditForm({ id: '', name: '', email: '', phone: '', dob: '', address: '', role: '', status: 'active' }); setEditOpen(true); }} sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}>Thêm nhân viên</Button>
                    </Toolbar>
                )}

                {tab === 'shifts' && (
                    <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel>Chọn nhân viên</InputLabel>
                            <Select label="Chọn nhân viên" value={editForm.id} onChange={(e) => { const s = staff.find(x => x.id === e.target.value); setEditForm({ ...editForm, id: s?.id || '', name: s?.name || '' }); }}>
                                {staff.filter(s => s.status !== 'on_leave').map(s => (
                                    <MenuItem key={s.id} value={s.id}>{`${s.name} — ${roleLabel(s.role)}`}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Ca</InputLabel>
                            <Select label="Ca" value={shiftForm.currentShift} onChange={(e) => setShiftForm({ ...shiftForm, currentShift: e.target.value })}>
                                {shifts.map(sh => (<MenuItem key={sh} value={sh}>{sh}</MenuItem>))}
                            </Select>
                        </FormControl>
                        <Button variant="contained" onClick={() => {
                            if (!editForm.id || !shiftForm.currentShift) return;
                            setShiftAssign(prev => {
                                const next = { ...prev };
                                const arr = new Set(next[shiftForm.currentShift] || []);
                                arr.add(editForm.id);
                                next[shiftForm.currentShift] = Array.from(arr);
                                return next;
                            });
                        }}>Thêm vào ca</Button>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="outlined" onClick={() => { setShiftForm({ mode: 'create', currentShift: '', newShiftName: '' }); setShiftDialogOpen(true); }}>Quản lý ca</Button>
                    </Toolbar>
                )}

                {tab === 'list' && (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.15)}`, overflowX: 'auto' }}>
                        <Table size="medium" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Họ tên</TableCell>
                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>SĐT</TableCell>
                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Ngày sinh</TableCell>
                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Địa chỉ</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Vai trò</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Hành động</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((s) => {
                                    const rColor = roleColor(s.role);
                                    const st = statusColor(s.status);
                                    return (
                                        <TableRow key={s.id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.email}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.phone}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.dob || '—'}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{s.address || '—'}</TableCell>
                                            <TableCell>
                                                <Chip size="small" label={roleLabel(s.role)} sx={{ background: rColor.bg, color: rColor.color, fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={st.label} sx={{ background: st.bg, color: st.color, fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="primary" onClick={() => { setEditMode('edit'); setEditForm({ ...s }); setEditOpen(true); }}><Edit fontSize="small" /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => { setPendingDeleteId(s.id); setConfirmDeleteOpen(true); }}><Delete fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {tab === 'shifts' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {shifts.map(shiftName => {
                            const shiftStaff = shiftAssign[shiftName] || [];
                            const groupedStaff = shiftStaff.reduce((acc, staffId) => {
                                const s = staff.find(x => x.id === staffId);
                                if (!s) return acc;
                                if (!s.group) return acc; // không tự động đưa vào nhóm khác
                                const group = s.group;
                                if (!acc[group]) acc[group] = [];
                                acc[group].push(s);
                                return acc;
                            }, {});

                            // Thêm nhóm "Chưa phân nhóm" cho những nhân viên trong ca nhưng không có nhóm
                            const unassignedStaff = shiftStaff.filter(staffId => {
                                const s = staff.find(x => x.id === staffId);
                                return s && !s.group;
                            }).map(staffId => staff.find(x => x.id === staffId)).filter(Boolean);

                            if (unassignedStaff.length > 0) {
                                groupedStaff['Chưa phân nhóm'] = unassignedStaff;
                            }

                            return (
                                <Paper key={shiftName} sx={{ p: 3, borderRadius: 3, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}` }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>{shiftName}</Typography>
                                        <Chip label={`${shiftStaff.length} nhân viên`} color="primary" />
                                    </Stack>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {Object.entries(groupedStaff).map(([groupName, groupStaff]) => (
                                            <Paper key={`${shiftName}-${groupName}`} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, background: alpha(COLORS.SECONDARY[50], 0.2) }}>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1, gap: 1.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, maxWidth: { xs: '100%', sm: 360 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{groupName}</Typography>
                                                        <Chip size="small" label={`${groupStaff.length} người`} sx={{ background: alpha(COLORS.SECONDARY[100], 0.6), color: COLORS.SECONDARY[800], fontWeight: 700 }} />
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                                                        {/* Always show Leader chip */}
                                                        <Chip size="small" label={`Leader: ${shiftLeaders[`${shiftName}-${groupName}`] ? (staff.find(x => x.id === shiftLeaders[`${shiftName}-${groupName}`])?.name || '—') : '—'}`} color="success" />

                                                        {/* If group already saved → only allow Edit */}
                                                        {savedGroups.has(`${shiftName}-${groupName}`) ? (
                                                            <>
                                                                <Button size="small" variant="contained" onClick={(e) => {
                                                                    setEditMenuContext({ shiftName, groupName });
                                                                    setEditMenuAnchor(e.currentTarget);
                                                                }}>Chỉnh sửa</Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Before save: full controls must be available */}
                                                                <Button size="small" variant="outlined" onClick={() => { setLeaderContext({ key: `${shiftName}-${groupName}`, staffId: shiftLeaders[`${shiftName}-${groupName}`] || '' }); setLeaderDialogOpen(true); }}>Chọn leader</Button>
                                                                <Button size="small" onClick={() => { setRenameContext({ shiftName, oldGroupName: groupName, newGroupName: groupName }); setRenameDialogOpen(true); }}>Đổi tên nhóm</Button>
                                                                <Button size="small" color="error" onClick={() => { setDeleteContext({ shiftName, groupName }); setDeleteDialogOpen(true); }}>Xóa nhóm</Button>
                                                                <Button size="small" variant="outlined" color="primary" onClick={() => {
                                                                    // Thêm nhân viên vào nhóm
                                                                    const idsInShift = (shiftAssign[shiftName] || []);
                                                                    const selected = idsInShift.filter(id => {
                                                                        const s = staff.find(x => x.id === id);
                                                                        if (!s) return false;
                                                                        if (groupName === 'Chưa phân nhóm') {
                                                                            return !s.group;
                                                                        }
                                                                        return s.group === groupName;
                                                                    });
                                                                    setEditMembersContext({ shiftName, groupName, selectedIds: selected });
                                                                    setEditMembersOpen(true);
                                                                }}>Thêm vào nhóm</Button>
                                                                <Button size="small" variant="outlined" color="success" onClick={() => {
                                                                    // Validate before save
                                                                    const groupKey = `${shiftName}-${groupName}`;
                                                                    const hasName = !!groupName && groupName !== 'Chưa phân nhóm';
                                                                    const leaderId = shiftLeaders[groupKey];
                                                                    const idsInShift = (shiftAssign[shiftName] || []);
                                                                    const leaderIsInGroup = !!leaderId && idsInShift.some(id => {
                                                                        const s = staff.find(x => x.id === id);
                                                                        return s && s.id === leaderId && (s.group || 'Chưa phân nhóm') === groupName;
                                                                    });
                                                                    if (!hasName) { window.alert('Vui lòng đặt tên nhóm trước khi lưu.'); return; }
                                                                    if (!leaderId || !leaderIsInGroup) { window.alert('Vui lòng chọn leader thuộc nhóm này trước khi lưu.'); return; }
                                                                    setSavedGroups(prev => new Set([...prev, groupKey]));
                                                                }}>Lưu</Button>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Stack>

                                                <Stack spacing={1}>
                                                    {groupStaff.map(s => (
                                                        <Stack key={`${shiftName}-${groupName}-${s.id}`} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ p: 1.5, borderRadius: 2, background: alpha(COLORS.SUCCESS[50], 0.3), border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.2)}`, gap: { xs: 1, sm: 2 } }}>
                                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                                                                <Typography sx={{ fontWeight: 600, minWidth: 120, maxWidth: { xs: '100%', sm: 240 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</Typography>
                                                                <Chip size="small" label={roleLabel(s.role)} sx={{ background: roleColor(s.role).bg, color: roleColor(s.role).color }} />
                                                                <Chip size="small" label={statusColor(s.status).label} sx={{ background: statusColor(s.status).bg, color: statusColor(s.status).color }} />
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                                                <Chip size="small" label={`${roleLabel(shiftRoles[`${shiftName}-${groupName}`]?.[s.id] || s.role)}`} sx={{ background: roleColor(s.role).bg, color: roleColor(s.role).color, fontWeight: 700 }} />
                                                                {!savedGroups.has(`${shiftName}-${groupName}`) && (
                                                                    <Button size="small" color="error" onClick={() => {
                                                                        setShiftAssign(prev => {
                                                                            const next = { ...prev };
                                                                            next[shiftName] = (next[shiftName] || []).filter(x => x !== s.id);
                                                                            return next;
                                                                        });
                                                                    }}>Bỏ khỏi ca</Button>
                                                                )}
                                                            </Stack>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                )}

                {/* Add/Edit Staff Dialog */}
                <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>{editMode === 'add' ? 'Thêm nhân viên' : 'Sửa nhân viên'}</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Stack spacing={2}>
                            <TextField label="Họ tên" value={editForm.name} error={!!formErrors.name} helperText={formErrors.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
                            <TextField label="Email" value={editForm.email} error={!!formErrors.email} helperText={formErrors.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} fullWidth />
                            <TextField label="Số điện thoại" value={editForm.phone} error={!!formErrors.phone} helperText={formErrors.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} fullWidth />
                            <TextField label="Ngày sinh" value={editForm.dob} error={!!formErrors.dob} helperText={formErrors.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} fullWidth placeholder="dd/mm/yyyy" />
                            <TextField label="Địa chỉ" value={editForm.address} error={!!formErrors.address} helperText={formErrors.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} fullWidth />
                            <FormControl fullWidth>
                                <InputLabel>Vai trò</InputLabel>
                                <Select label="Vai trò" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                    <MenuItem value="sale_staff">Sale staff</MenuItem>
                                    <MenuItem value="working_staff">Working staff</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setEditOpen(false)}>Hủy</Button>
                        <Button variant="contained" onClick={() => {
                            // simple validation
                            const errs = {};
                            if (!editForm.name?.trim()) errs.name = 'Bắt buộc';
                            if (!editForm.email?.trim()) errs.email = 'Bắt buộc';
                            if (!editForm.phone?.trim()) errs.phone = 'Bắt buộc';
                            if (!editForm.dob?.trim()) errs.dob = 'Bắt buộc';
                            if (!editForm.address?.trim()) errs.address = 'Bắt buộc';
                            if (!editForm.role?.trim()) errs.role = 'Bắt buộc';
                            setFormErrors(errs);
                            if (Object.keys(errs).length) return;

                            let next = [...staff];
                            if (editMode === 'add') {
                                const newItem = { ...editForm, id: `u-${Math.random().toString(36).slice(2, 7)}`, group: 'Chưa phân nhóm' };
                                next.push(newItem);
                            } else {
                                const idx = next.findIndex(x => x.id === editForm.id);
                                if (idx !== -1) next[idx] = { ...editForm };
                            }
                            setStaff(next);
                            setEditOpen(false);
                        }}>Lưu</Button>
                    </Stack>
                </Dialog>

                {/* Edit Menu for Saved Group */}
                <Menu anchorEl={editMenuAnchor} open={Boolean(editMenuAnchor)} onClose={() => setEditMenuAnchor(null)}>
                    <MenuItem onClick={() => {
                        setRenameContext({ shiftName: editMenuContext.shiftName, oldGroupName: editMenuContext.groupName, newGroupName: editMenuContext.groupName });
                        setRenameDialogOpen(true);
                        setEditMenuAnchor(null);
                    }}>Đổi tên nhóm</MenuItem>
                    <MenuItem onClick={() => {
                        const { shiftName, groupName } = editMenuContext;
                        const idsInShift = (shiftAssign[shiftName] || []);
                        const selected = idsInShift.filter(id => {
                            const s = staff.find(x => x.id === id);
                            if (!s) return false;
                            if (groupName === 'Chưa phân nhóm') { return !s.group; }
                            return s.group === groupName;
                        });
                        setEditMembersContext({ shiftName, groupName, selectedIds: selected, query: '' });
                        setEditMembersOpen(true);
                        setEditMenuAnchor(null);
                    }}>Thêm/Bớt nhân viên</MenuItem>
                    <MenuItem onClick={() => {
                        setLeaderContext({ key: `${editMenuContext.shiftName}-${editMenuContext.groupName}`, staffId: shiftLeaders[`${editMenuContext.shiftName}-${editMenuContext.groupName}`] || '' });
                        setLeaderDialogOpen(true);
                        setEditMenuAnchor(null);
                    }}>Chọn leader</MenuItem>
                    <MenuItem onClick={() => {
                        setDeleteContext({ shiftName: editMenuContext.shiftName, groupName: editMenuContext.groupName });
                        setDeleteDialogOpen(true);
                        setEditMenuAnchor(null);
                    }}>Xóa nhóm</MenuItem>
                    <MenuItem onClick={() => {
                        // Save edits: đánh dấu nhóm là đã lưu để chuyển sang chế độ "Chỉnh sửa"
                        const key = `${editMenuContext.shiftName}-${editMenuContext.groupName}`;
                        setSavedGroups(prev => new Set([...prev, key]));
                        setEditMenuAnchor(null);
                    }}>Lưu chỉnh sửa</MenuItem>
                </Menu>

                {/* Choose Leader Dialog */}
                <Dialog
                    open={leaderDialogOpen}
                    onClose={() => setLeaderDialogOpen(false)}
                    fullWidth
                    maxWidth="xs"
                    keepMounted={false}
                    disablePortal={false}
                    disableEscapeKeyDown={false}
                    hideBackdrop={false}
                >
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Chọn leader</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Nhân viên</InputLabel>
                            <Select label="Nhân viên" value={leaderContext.staffId} onChange={(e) => setLeaderContext({ ...leaderContext, staffId: e.target.value })}>
                                {(shiftAssign[leaderContext.key.split('-')[0]] || [])
                                    .map(id => staff.find(s => s.id === id))
                                    .filter(Boolean)
                                    .filter(s => (s.group || 'Chưa phân nhóm') === leaderContext.key.split('-').slice(1).join('-'))
                                    .map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setLeaderDialogOpen(false)}>Hủy</Button>
                        <Button variant="contained" onClick={() => {
                            setShiftLeaders(prev => ({ ...prev, [leaderContext.key]: leaderContext.staffId }));
                            setLeaderDialogOpen(false);
                        }}>Lưu</Button>
                    </Stack>
                </Dialog>

                {/* Rename Group Dialog */}
                <Dialog
                    open={renameDialogOpen}
                    onClose={() => setRenameDialogOpen(false)}
                    fullWidth
                    maxWidth="xs"
                    keepMounted={false}
                    disablePortal={false}
                    disableEscapeKeyDown={false}
                    hideBackdrop={false}
                >
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Đổi tên nhóm</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <TextField fullWidth label="Tên nhóm" value={renameContext.newGroupName} onChange={(e) => setRenameContext({ ...renameContext, newGroupName: e.target.value })} />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setRenameDialogOpen(false)}>Hủy</Button>
                        <Button variant="contained" onClick={() => {
                            // Rename within staff groups (display-only here)
                            setStaff(prev => prev.map(s => (s.group === renameContext.oldGroupName ? { ...s, group: renameContext.newGroupName } : s)));
                            // Move leader key
                            setShiftLeaders(prev => {
                                const next = { ...prev };
                                const oldKey = `${renameContext.shiftName}-${renameContext.oldGroupName}`;
                                const newKey = `${renameContext.shiftName}-${renameContext.newGroupName}`;
                                if (next[oldKey]) { next[newKey] = next[oldKey]; delete next[oldKey]; }
                                return next;
                            });
                            // Sync savedGroups key
                            setSavedGroups(prev => {
                                const next = new Set();
                                const oldKey = `${renameContext.shiftName}-${renameContext.oldGroupName}`;
                                const newKey = `${renameContext.shiftName}-${renameContext.newGroupName}`;
                                prev.forEach(k => next.add(k === oldKey ? newKey : k));
                                return next;
                            });
                            setRenameDialogOpen(false);
                        }}>Lưu</Button>
                    </Stack>
                </Dialog>

                {/* Delete Group Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    fullWidth
                    maxWidth="xs"
                    keepMounted={false}
                    disablePortal={false}
                    disableEscapeKeyDown={false}
                    hideBackdrop={false}
                >
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Xóa nhóm</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Typography>Bạn có chắc muốn xóa toàn bộ nhóm này khỏi ca? Tất cả nhân viên trong nhóm sẽ bị xóa khỏi ca.</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
                        <Button color="error" variant="contained" onClick={() => {
                            const key = `${deleteContext.shiftName}-${deleteContext.groupName}`;

                            // Xóa toàn bộ nhóm: bỏ nhân viên khỏi ca
                            const idsInShift = (shiftAssign[deleteContext.shiftName] || []);
                            const groupIds = idsInShift.filter(id => {
                                const s = staff.find(x => x.id === id);
                                return s && s.group === deleteContext.groupName;
                            });


                            // XÓA TOÀN BỘ NHÓM: bỏ nhân viên khỏi ca
                            setShiftAssign(prev => {
                                const next = { ...prev };
                                next[deleteContext.shiftName] = (next[deleteContext.shiftName] || []).filter(id => !groupIds.includes(id));
                                return next;
                            });

                            // Xóa leader của nhóm trong ca này
                            setShiftLeaders(prev => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                            });

                            // Remove any savedGroups entry for this group in this shift
                            setSavedGroups(prev => {
                                const next = new Set([...prev]);
                                next.delete(key);
                                return next;
                            });

                            setDeleteDialogOpen(false);
                        }}>Xóa</Button>
                    </Stack>
                </Dialog>

                {/* Edit Members Dialog */}
                <Dialog
                    open={editMembersOpen}
                    onClose={() => setEditMembersOpen(false)}
                    fullWidth
                    maxWidth="sm"
                    keepMounted={false}
                    disablePortal={false}
                    disableEscapeKeyDown={false}
                    hideBackdrop={false}
                >
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Quản lý thành viên nhóm</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>{editMembersContext.shiftName} • {editMembersContext.groupName}</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>Tất cả nhân viên trong ca</Typography>
                            <TextField size="small" placeholder="Tìm theo tên..." fullWidth sx={{ mb: 1 }} onChange={(e) => setEditMembersContext(prev => ({ ...prev, query: e.target.value }))} />
                            <Stack sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                {([...((shiftAssign[editMembersContext.shiftName] || []))]
                                    .map(id => staff.find(x => x.id === id))
                                    .filter(s => s && s.status !== 'on_leave')
                                    .filter(s => !editMembersContext.query || s.name.toLowerCase().includes(editMembersContext.query.toLowerCase()))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(s => (
                                        <Stack key={s.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1 }}>
                                            <Typography>{s.name}</Typography>
                                            <Button size="small" variant={editMembersContext.selectedIds.includes(s.id) ? 'contained' : 'outlined'} onClick={() => {
                                                setEditMembersContext(prev => {
                                                    const setIds = new Set(prev.selectedIds);
                                                    if (setIds.has(s.id)) setIds.delete(s.id); else setIds.add(s.id);
                                                    return { ...prev, selectedIds: Array.from(setIds) };
                                                });
                                            }}>{editMembersContext.selectedIds.includes(s.id) ? 'Đã chọn' : 'Chọn'}</Button>
                                        </Stack>
                                    )))}
                            </Stack>
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>Thành viên nhóm hiện tại</Typography>
                            <Stack sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                {[...editMembersContext.selectedIds]
                                    .map(id => staff.find(x => x.id === id))
                                    .filter(Boolean)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(s => (
                                        <Typography key={`selected-${s.id}`} sx={{ p: 1 }}>{s.name}</Typography>
                                    ))}
                            </Stack>
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>Lưu ý: Nhân viên nghỉ phép không hiển thị trong danh sách chọn.</Typography>
                        <Box>
                            <Button onClick={() => setEditMembersOpen(false)}>Hủy</Button>
                            <Button variant="contained" onClick={() => {
                                // Commit: only affect members of this group that are not on leave
                                const { shiftName, groupName, selectedIds } = editMembersContext;
                                const idsInShift = (shiftAssign[shiftName] || []);
                                const originalActiveInGroup = idsInShift.filter(id => {
                                    const st = staff.find(x => x.id === id);
                                    return st && st.status !== 'on_leave' && (st.group || '') === groupName;
                                });
                                setStaff(prev => prev.map(s => {
                                    if (!idsInShift.includes(s.id) || s.status === 'on_leave') return s;
                                    if (selectedIds.includes(s.id)) return { ...s, group: groupName };
                                    if (originalActiveInGroup.includes(s.id)) return { ...s, group: '' };
                                    return s;
                                }));

                                // KHÔNG đánh dấu nhóm là đã lưu - giữ nguyên các button quản lý
                                // const groupKey = `${shiftName}-${groupName}`;
                                // setSavedGroups(prev => new Set([...prev, groupKey]));

                                setEditMembersOpen(false);
                            }}>Lưu</Button>
                        </Box>
                    </Stack>
                </Dialog>

                {/* Manage Groups Dialog */}
                <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} fullWidth maxWidth="sm">
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Quản lý nhóm</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Chế độ</InputLabel>
                                <Select label="Chế độ" value={groupForm.mode} onChange={(e) => setGroupForm({ ...groupForm, mode: e.target.value })}>
                                    <MenuItem value="create">Tạo nhóm mới</MenuItem>
                                    <MenuItem value="rename">Đổi tên nhóm</MenuItem>
                                    <MenuItem value="delete">Xóa nhóm</MenuItem>
                                </Select>
                            </FormControl>
                            {(groupForm.mode === 'rename') && (
                                <FormControl fullWidth>
                                    <InputLabel>Nhóm hiện tại</InputLabel>
                                    <Select label="Nhóm hiện tại" value={groupForm.currentGroup} onChange={(e) => setGroupForm({ ...groupForm, currentGroup: e.target.value })}>
                                        {groups.map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            )}
                            {(groupForm.mode === 'create' || groupForm.mode === 'rename') && (
                                <TextField label={groupForm.mode === 'create' ? 'Tên nhóm mới' : 'Tên mới'} value={groupForm.newGroupName} onChange={(e) => setGroupForm({ ...groupForm, newGroupName: e.target.value })} fullWidth />
                            )}
                            {groupForm.mode === 'delete' && (
                                <>
                                    <FormControl fullWidth>
                                        <InputLabel>Nhóm cần xóa</InputLabel>
                                        <Select label="Nhóm cần xóa" value={groupForm.currentGroup} onChange={(e) => setGroupForm({ ...groupForm, currentGroup: e.target.value })}>
                                            {groups.map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel>Chuyển nhân viên sang</InputLabel>
                                        <Select label="Chuyển nhân viên sang" value={groupForm.moveToGroup} onChange={(e) => setGroupForm({ ...groupForm, moveToGroup: e.target.value })}>
                                            <MenuItem value="">Không (bỏ trống nhóm)</MenuItem>
                                            {groups.filter(g => g !== groupForm.currentGroup).map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setGroupDialogOpen(false)}>Đóng</Button>
                        <Button variant="contained" onClick={() => {
                            let updated = [...staff];
                            if (groupForm.mode === 'create') {
                                // tạo nhóm: không thay đổi nhân viên
                            } else if (groupForm.mode === 'rename') {
                                updated = updated.map(s => s.group === groupForm.currentGroup ? { ...s, group: groupForm.newGroupName } : s);
                            } else if (groupForm.mode === 'delete') {
                                // chuyển hoặc bỏ trống nhóm cho các staff trong nhóm bị xóa
                                updated = updated.map(s => s.group === groupForm.currentGroup ? { ...s, group: groupForm.moveToGroup || '' } : s);
                            }
                            setStaff(updated);
                            setGroupDialogOpen(false);
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

                {/* Manage Shifts Dialog */}
                <Dialog open={shiftDialogOpen} onClose={() => setShiftDialogOpen(false)} fullWidth maxWidth="xs">
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Quản lý ca</Typography>
                    </Box>
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Chế độ</InputLabel>
                                <Select label="Chế độ" value={shiftForm.mode} onChange={(e) => setShiftForm({ ...shiftForm, mode: e.target.value })}>
                                    <MenuItem value="create">Tạo ca mới</MenuItem>
                                    <MenuItem value="rename">Đổi tên ca</MenuItem>
                                    <MenuItem value="delete">Xóa ca</MenuItem>
                                </Select>
                            </FormControl>
                            {shiftForm.mode !== 'create' && (
                                <FormControl fullWidth>
                                    <InputLabel>Ca hiện tại</InputLabel>
                                    <Select label="Ca hiện tại" value={shiftForm.currentShift} onChange={(e) => setShiftForm({ ...shiftForm, currentShift: e.target.value })}>
                                        {shifts.map(sh => (<MenuItem key={sh} value={sh}>{sh}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            )}
                            {(shiftForm.mode === 'create' || shiftForm.mode === 'rename') && (
                                <TextField label={shiftForm.mode === 'create' ? 'Tên ca mới' : 'Tên mới'} value={shiftForm.newShiftName} onChange={(e) => setShiftForm({ ...shiftForm, newShiftName: e.target.value })} fullWidth />
                            )}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setShiftDialogOpen(false)}>Đóng</Button>
                        <Button variant="contained" onClick={() => {
                            if (shiftForm.mode === 'create') {
                                if (!shiftForm.newShiftName?.trim()) return;
                                setShifts(prev => Array.from(new Set([...prev, shiftForm.newShiftName])));
                            } else if (shiftForm.mode === 'rename') {
                                setShifts(prev => prev.map(sh => sh === shiftForm.currentShift ? shiftForm.newShiftName : sh));
                                setShiftAssign(prev => {
                                    const next = { ...prev };
                                    if (next[shiftForm.currentShift]) {
                                        next[shiftForm.newShiftName] = next[shiftForm.currentShift];
                                        delete next[shiftForm.currentShift];
                                    }
                                    return next;
                                });
                            } else if (shiftForm.mode === 'delete') {
                                setShifts(prev => prev.filter(sh => sh !== shiftForm.currentShift));
                                setShiftAssign(prev => {
                                    const next = { ...prev };
                                    delete next[shiftForm.currentShift];
                                    return next;
                                });
                            }
                            setShiftDialogOpen(false);
                        }}>Lưu</Button>
                    </Stack>
                </Dialog>
            </Box>
        </Box>
    );
};

export default StaffPage;


