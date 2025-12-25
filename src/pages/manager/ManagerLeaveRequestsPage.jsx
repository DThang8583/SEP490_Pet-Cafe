import React, { useEffect, useState } from 'react';
import {Box,Paper,Table,TableHead,TableRow,TableCell,TableBody,TableContainer,Button,Chip,Stack,Typography,Toolbar,IconButton,Menu,ListItemIcon,Dialog,DialogTitle,DialogContent,DialogActions,TextField,FormControl,InputLabel,Select,MenuItem} from '@mui/material';
import Loading from '../../components/loading/Loading';
import { alpha } from '@mui/material/styles';
import { EventAvailable, MoreVert, CheckCircle, Block, Cancel } from '@mui/icons-material';
import Pagination from '../../components/common/Pagination';
import { COLORS } from '../../constants/colors';
import { getLeaveRequests, updateLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest } from '../../api/leaveRequestApi';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import workingStaffApi from '../../api/workingStaffApi';
import employeeApi from '../../api/employeeApi';

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy'
};

// leave type labels removed — 'Loại' column/filter not displayed for manager page

const ManagerLeaveRequestsPage = () => {
    const profile = workingStaffApi.getProfile();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: '',
        status: '',
        leaveType: '',
        fromDate: '',
        toDate: ''
    });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [leaveStats, setLeaveStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
    });
    const [allRequests, setAllRequests] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuTarget, setMenuTarget] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'APPROVED'|'REJECTED'|'CANCELLED', row }
    const [alertState, setAlertState] = useState({ open: false, type: 'info', title: '', message: '' });

    const fetchAll = async () => {
        setLoading(true);
        try {
            // manager sees all requests
            // Backend expects zero-based page index (page_index). Convert UI 1-based page to server page.
            const params = {
                page: Math.max(0, page - 1),
                limit
            };
            if (filters.employeeId) params.EmployeeId = filters.employeeId;
            if (filters.status) params.Status = filters.status;
            if (filters.fromDate) params.FromDate = filters.fromDate;
            if (filters.toDate) params.ToDate = filters.toDate;

            // Force client-side processing: ensure aggregated dataset loaded and use it as single source
            const sourceAll = (allRequests && allRequests.length > 0) ? allRequests : await loadStats();
            let data = (sourceAll || []).slice();
            if (filters.employeeId) {
                data = data.filter(d => (d.employee_id === filters.employeeId) || (d.employee?.id === filters.employeeId));
            }
            if (filters.status) {
                data = data.filter(d => d.status === filters.status);
            }
            if (filters.fromDate) {
                data = data.filter(d => {
                    if (!d.leave_date) return false;
                    const dateKey = d.leave_date.slice(0,10);
                    return dateKey >= filters.fromDate;
                });
            }
            if (filters.toDate) {
                data = data.filter(d => {
                    if (!d.leave_date) return false;
                    const dateKey = d.leave_date.slice(0,10);
                    return dateKey <= filters.toDate;
                });
            }
            if (searchQuery && searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                data = data.filter(r => {
                    const empName = (r.employee?.full_name || '').toLowerCase();
                    const replacementName = (r.replacement_employee?.full_name || '').toLowerCase();
                    const reason = (r.reason || '').toLowerCase();
                    return empName.includes(q) || replacementName.includes(q) || reason.includes(q);
                });
            }
            try {
                const dateKey = (item) => {
                    if (!item || !item.leave_date) return 0;
                    const d = new Date(item.leave_date);
                    const y = d.getUTCFullYear();
                    const m = d.getUTCMonth() + 1;
                    const day = d.getUTCDate();
                    return y * 10000 + m * 100 + day;
                };
                data.sort((a, b) => dateKey(b) - dateKey(a));
            } catch (e) {
                console.warn('[ManagerLeaveRequestsPage] sort failed', e);
            }
            const total = data.length;
            const totalPages = Math.max(1, Math.ceil(total / limit));
            setPagination({
                total_items_count: total,
                page_size: limit,
                total_pages_count: totalPages,
                page_index: Math.max(0, page - 1),
                has_next: page < totalPages,
                has_previous: page > 1
            });
            setRequests(data);
            // update simple stats from the data variable (works for both client-side and server-side flows)
            try {
                const statsSource = (typeof data !== 'undefined') ? data : [];
                const total = statsSource.length;
                const pending = statsSource.filter(d => d.status === 'PENDING').length;
                const approved = statsSource.filter(d => d.status === 'APPROVED').length;
                const rejected = statsSource.filter(d => d.status === 'REJECTED').length;
                const cancelled = statsSource.filter(d => d.status === 'CANCELLED').length;
                setLeaveStats({ total, pending, approved, rejected, cancelled });
            } catch (e) {
                console.warn('[ManagerLeaveRequestsPage] failed to compute leaveStats from page data', e);
            }
        } catch (err) {
            console.error('Failed to load leave requests for manager', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Load aggregate stats (fetch more items up to large limit) to compute accurate status counts
    const loadStats = async () => {
        try {
            const resp = await getLeaveRequests({ page: 0, limit: 1000 });
            const all = resp.data || [];
            const total = resp.pagination?.total_items_count ?? all.length;
            const pending = all.filter(d => d.status === 'PENDING').length;
            const approved = all.filter(d => d.status === 'APPROVED').length;
            const rejected = all.filter(d => d.status === 'REJECTED').length;
            const cancelled = all.filter(d => d.status === 'CANCELLED').length;
            setLeaveStats({ total, pending, approved, rejected, cancelled });
            // store aggregated dataset for client-side sorting/pagination
            setAllRequests(all);
            return all;
        } catch (err) {
            console.warn('[ManagerLeaveRequestsPage] failed to load aggregate stats', err);
            return [];
        }
    };

    useEffect(() => {
        // load aggregate dataset first (up to limit) then populate page view from client-side dataset
        (async () => {
            await loadStats();
            await fetchAll();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // load employees for filter dropdown
        let mounted = true;
        (async () => {
            try {
                const resp = await employeeApi.getAllEmployees({ page_index: 0, page_size: 1000 });
                if (!mounted) return;
                const list = resp?.data || resp || [];
                // Exclude managers from selection dropdown
                const filtered = (list || []).filter(emp => {
                    const possibleRoles = [
                        emp.account && emp.account.role,
                        emp.sub_role,
                        emp.role,
                        emp.subRole
                    ].filter(Boolean).map(r => String(r).toLowerCase()).join(' ');
                    if (possibleRoles.includes('manager')) return false;
                    return true;
                });
                setEmployees(filtered);
            } catch (err) {
                console.warn('Failed to load employees for manager filters', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        // refetch whenever filters, page or limit change
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, page, limit]);

    // reset page when filters or search change
    useEffect(() => {
        setPage(1);
    }, [filters, searchQuery]);

    const filteredRequests = React.useMemo(() => {
        if (!searchQuery || !searchQuery.trim()) return requests;
        const q = searchQuery.trim().toLowerCase();
        return (requests || []).filter(r => {
            const empName = (r.employee?.full_name || '').toLowerCase();
            const replacementName = (r.replacement_employee?.full_name || '').toLowerCase();
            const reason = (r.reason || '').toLowerCase();
            return empName.includes(q) || replacementName.includes(q) || reason.includes(q);
        });
    }, [requests, searchQuery]);

    const useClientPaging = (allRequests && allRequests.length > 0);

    const displayRequests = React.useMemo(() => {
        if (useClientPaging) {
            const start = (page - 1) * limit;
            return (filteredRequests || []).slice(start, start + limit);
        }
        // server-side: requests already represent current page
        return filteredRequests;
    }, [filteredRequests, page, limit, pagination, useClientPaging]);

    const openReview = (row) => {
        setSelected(row);
        setReviewNotes(row.review_notes || '');
    };

    const handleOpenMenu = (event, row) => {
        setMenuAnchor(event.currentTarget);
        setMenuTarget(row);
    };
    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuTarget(null);
    };

    const handleAction = async (status, row) => {
        // keep backward compatible if called directly
        if (!row && !menuTarget) return;
        const target = row || menuTarget;
        setActionLoading(true);
            try {
            if (status === 'APPROVED') {
                await approveLeaveRequest(target.id, { status, review_notes: target.review_notes || '' });
            } else if (status === 'REJECTED') {
                // backend provides dedicated PUT reject endpoint
                await rejectLeaveRequest(target.id, { status, review_notes: target.review_notes || '' });
            } else if (status === 'CANCELLED') {
                // backend provides dedicated PUT cancel endpoint
                await cancelLeaveRequest(target.id, { status, review_notes: target.review_notes || '' });
            } else {
                await updateLeaveRequest(target.id, { status });
            }
            await fetchAll();
            setAlertState({ open: true, type: 'success', title: 'Thành công', message: `Đã ${status === 'APPROVED' ? 'duyệt' : status === 'REJECTED' ? 'từ chối' : 'hủy'} đơn` });
        } catch (err) {
            console.error('Failed to perform action on leave request', err);
            const msg = err?.message || 'Thao tác không thành công';
            setAlertState({ open: true, type: 'error', title: 'Lỗi', message: msg });
        } finally {
            setActionLoading(false);
            handleCloseMenu();
            setConfirmOpen(false);
            setPendingAction(null);
        }
    };

    const openConfirmForAction = (actionType, row) => {
        setPendingAction({ type: actionType, row });
        setConfirmOpen(true);
        handleCloseMenu();
    };

    const closeReview = () => {
        setSelected(null);
        setReviewNotes('');
    };

    const submitReview = async (status) => {
        if (!selected) return;
        setActionLoading(true);
        try {
            // backend expects reviewed_by etc handled server-side; send status and review_notes
            if (status === 'APPROVED') {
                await approveLeaveRequest(selected.id, { status, review_notes: reviewNotes });
            } else if (status === 'REJECTED') {
                await rejectLeaveRequest(selected.id, { status, review_notes: reviewNotes });
            } else if (status === 'CANCELLED') {
                await cancelLeaveRequest(selected.id, { status, review_notes: reviewNotes });
            } else {
                await updateLeaveRequest(selected.id, {
                    status,
                    review_notes: reviewNotes
                });
            }
            // refresh list
            await fetchAll();
            closeReview();
        } catch (err) {
            console.error('Failed to update leave request', err);
        } finally {
            setActionLoading(false);
        }
    };
    // Show global loading same as other manager pages
    if (loading) {
        return <Loading message="Đang tải danh sách đơn..." fullScreen />;
    }

    return (
        <Box sx={{ bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventAvailable sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                    Quản lý Đơn nghỉ phép
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Xem và duyệt các đơn nghỉ phép nhân viên gửi tới
                </Typography>
            </Box>
            {/* Stats cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {[
                    { label: 'Tổng đơn', key: 'total', value: leaveStats.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                    { label: 'Chờ duyệt', key: 'pending', value: leaveStats.pending, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
                    { label: 'Đã duyệt', key: 'approved', value: leaveStats.approved, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                    { label: 'Từ chối', key: 'rejected', value: leaveStats.rejected, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] }
                ].map((stat) => (
                    <Box key={stat.key} sx={{ flex: '1 1 0' }}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${stat.color}`, borderRadius: 2, height: '100%', boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>{stat.label}</Typography>
                            <Typography variant="h4" fontWeight={600} color={stat.valueColor}>{stat.value}</Typography>
                        </Paper>
                    </Box>
                ))}
            </Box>
            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Tìm kiếm đơn, nhân viên, lý do..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', md: 620 }, flexShrink: 0 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Nhân viên</InputLabel>
                        <Select
                            value={filters.employeeId}
                            label="Nhân viên"
                            onChange={(e) => setFilters(f => ({ ...f, employeeId: e.target.value }))}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>{emp.full_name || emp.email || emp.id}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={filters.status}
                            label="Trạng thái"
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                            <MenuItem value="REJECTED">Từ chối</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                        </Select>
                    </FormControl>

                    {/* 'Loại' filter removed */}

                    <TextField
                        size="small"
                        type="date"
                        label="Từ ngày"
                        InputLabelProps={{ shrink: true }}
                        value={filters.fromDate}
                        onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))}
                        sx={{ minWidth: 160 }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label="Đến ngày"
                        InputLabelProps={{ shrink: true }}
                        value={filters.toDate}
                        onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))}
                        sx={{ minWidth: 160 }}
                    />

                    
                </Toolbar>
            </Paper>

            <TableContainer component={Paper} sx={{ mt: 0, borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                        <Table size="medium" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Nhân viên</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Ngày nghỉ</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Lý do</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Email NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>SĐT NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Không có đơn nào</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayRequests.map((r) => (
                                        <TableRow key={r.id} hover>
                                            <TableCell>{r.employee?.full_name || r.employee_name || '-'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.leave_date ? new Date(r.leave_date).toLocaleDateString('vi-VN') : '-'}</TableCell>
                                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason || '-'}</TableCell>
                                            <TableCell>{r.replacement_employee?.full_name || '-'}</TableCell>
                                            <TableCell>{r.replacement_employee?.email || '-'}</TableCell>
                                            <TableCell>{r.replacement_employee?.phone || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={STATUS_LABELS[r.status] || r.status} color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'info'} sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '-'}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    {r.status === 'PENDING' && (
                                                        <IconButton size="small" onClick={(e) => handleOpenMenu(e, r)}>
                                                            <MoreVert />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                            <Pagination
                                page={page}
                                totalPages={pagination?.total_pages_count ?? Math.max(1, Math.ceil((filteredRequests.length || 0) / limit))}
                                itemsPerPage={pagination?.page_size ?? limit}
                                totalItems={pagination?.total_items_count ?? (filteredRequests.length || 0)}
                                onPageChange={(newPage) => setPage(newPage)}
                                onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }}
                            />
                        </Box>
            </TableContainer>

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => openConfirmForAction('APPROVED', menuTarget)} disabled={actionLoading} sx={{ color: COLORS.SUCCESS[700] }}>
                    <ListItemIcon sx={{ color: 'inherit' }}><CheckCircle fontSize="small" /></ListItemIcon>
                    Duyệt
                </MenuItem>
                <MenuItem onClick={() => openConfirmForAction('REJECTED', menuTarget)} disabled={actionLoading} sx={{ color: COLORS.ERROR[700] }}>
                    <ListItemIcon sx={{ color: 'inherit' }}><Block fontSize="small" /></ListItemIcon>
                    Từ chối
                </MenuItem>
                {/* 'Hủy' removed from MoreVert menu per design decision */}
            </Menu>

            <Dialog open={Boolean(selected)} onClose={closeReview} maxWidth="sm" fullWidth>
                <DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <Stack spacing={2}>
                            <Typography><strong>Nhân viên:</strong> {selected.employee?.full_name || '-'}</Typography>
                            <Typography><strong>Ngày nghỉ:</strong> {selected.leave_date ? new Date(selected.leave_date).toLocaleDateString('vi-VN') : '-'}</Typography>
                            <Typography><strong>Loại:</strong> {selected.leave_type}</Typography>
                            <Typography><strong>Lý do:</strong> {selected.reason}</Typography>
                            <Typography><strong>NV thay thế:</strong> {selected.replacement_employee?.full_name || '-'}</Typography>
                            <TextField
                                label="Ghi chú duyệt"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                multiline
                                minRows={3}
                                fullWidth
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeReview}>Đóng</Button>
                    <Button color="error" onClick={() => submitReview('REJECTED')} disabled={actionLoading}>Từ chối</Button>
                    <Button variant="contained" color="success" onClick={() => submitReview('APPROVED')} disabled={actionLoading}>Duyệt</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm modal for approve/reject/cancel */}
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
                onConfirm={() => {
                    if (!pendingAction) return;
                    handleAction(pendingAction.type, pendingAction.row);
                }}
                title={pendingAction?.type === 'APPROVED' ? 'Duyệt đơn' : pendingAction?.type === 'REJECTED' ? 'Từ chối đơn' : 'Hủy đơn'}
                message={pendingAction?.type === 'APPROVED' ? 'Bạn có chắc chắn muốn duyệt đơn này?' : pendingAction?.type === 'REJECTED' ? 'Bạn có chắc chắn muốn từ chối đơn này?' : 'Bạn có chắc chắn muốn hủy đơn này?'}
                type={pendingAction?.type === 'REJECTED' ? 'error' : pendingAction?.type === 'CANCELLED' ? 'warning' : 'success'}
                isLoading={actionLoading}
                confirmText={pendingAction?.type === 'APPROVED' ? 'Duyệt' : pendingAction?.type === 'REJECTED' ? 'Từ chối' : 'Hủy'}
            />

            {/* Alert modal for success/error */}
            <AlertModal
                open={alertState.open}
                onClose={() => setAlertState(s => ({ ...s, open: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                okText="Đóng"
            />
        </Box>
    );
};

export default ManagerLeaveRequestsPage;


