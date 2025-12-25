import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Chip,
    TextField,
    MenuItem,
    Stack,
    Avatar,
    Toolbar
} from '@mui/material';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import { EventAvailable } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getLeaveRequests } from '../../api/leaveRequestApi';
import { COLORS } from '../../constants/colors';
import workingStaffApi from '../../api/workingStaffApi';

const LEAVE_TYPE_LABELS = {
    ADVANCE: 'Nghỉ trước',
    EMERGENCY: 'Nghỉ khẩn cấp'
};
const STATUS_LABELS = {
    PENDING: 'Đang chờ',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã huỷ'
};

const formatDate = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return iso;
    }
};

const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return iso;
    }
};

const LeaveRequestPage = () => {
    const navigate = useNavigate();
    const profile = workingStaffApi.getProfile();
    const [requests, setRequests] = useState([]);
    const [prefetchMap, setPrefetchMap] = useState({});
    const [loading, setLoading] = useState(false);
    // page is 1-based for UI (matches manager page)
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pagination, setPagination] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [allRequests, setAllRequests] = useState(null);

    const fetchRequests = async (uiPage = 1, limit = rowsPerPage) => {
        setLoading(true);
        try {
            const employeeParam =
                profile?.employee?.id ||
                profile?.employee_id ||
                profile?.id;

            if (!employeeParam) {
                console.warn('[LeaveRequestPage] No employee identifier found on profile', profile);
                setRequests([]);
                setPagination(null);
                return;
            }

            // Convert UI page (1-based) to server's 0-based page param
            const pageParam = Math.max(0, Number(uiPage) - 1);
            const limitParam = Number(limit);

            const params = {
                EmployeeId: employeeParam,
                page: pageParam,
                limit: limitParam
            };
            if (statusFilter) params.Status = statusFilter;
            if (fromDate) params.FromDate = fromDate;
            if (toDate) params.ToDate = toDate;

            const resp = await getLeaveRequests(params);
            const data = resp.data || [];
            const pag = resp.pagination || null;

            // If server reports more items than page size, fetch aggregated dataset
            if (pag && (pag.total_items_count ?? 0) > limitParam) {
                try {
                    const fetchLimit = Math.min(pag.total_items_count, 1000);
                    const aggParams = {
                        EmployeeId: employeeParam,
                        page: 0,
                        limit: fetchLimit
                    };
                    if (statusFilter) aggParams.Status = statusFilter;
                    if (fromDate) aggParams.FromDate = fromDate;
                    if (toDate) aggParams.ToDate = toDate;

                    const aggResp = await getLeaveRequests(aggParams);
                    const all = aggResp.data || [];
                    // global sort by leave_date desc
                    const sortedAll = (all || []).slice().sort((a, b) => {
                        const ta = a && a.leave_date ? new Date(a.leave_date).getTime() : 0;
                        const tb = b && b.leave_date ? new Date(b.leave_date).getTime() : 0;
                        return tb - ta;
                    });
                    setAllRequests(sortedAll);

                    // derive pagination from full dataset
                    const totalItems = sortedAll.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / limitParam));
                    setPagination({
                        total_items_count: totalItems,
                        page_size: limitParam,
                        total_pages_count: totalPages,
                        page_index: Math.max(0, uiPage - 1),
                        has_next: uiPage < totalPages,
                        has_previous: uiPage > 1
                    });

                    // set current page slice
                    const start = (uiPage - 1) * limitParam;
                    setRequests(sortedAll.slice(start, start + limitParam));
                } catch (aggErr) {
                    console.warn('[LeaveRequestPage] aggregated fetch failed, falling back to page response', aggErr);
                    // fallback: use per-page response sorted locally
                    const sorted = (data || []).slice().sort((a, b) => {
                        const ta = a && a.leave_date ? new Date(a.leave_date).getTime() : 0;
                        const tb = b && b.leave_date ? new Date(b.leave_date).getTime() : 0;
                        return tb - ta;
                    });
                    setRequests(sorted);
                    if (pag) {
                        setPagination({
                            total_items_count: pag.total_items_count,
                            page_size: pag.page_size,
                            total_pages_count: pag.total_pages_count,
                            page_index: pag.page_index,
                            has_next: Boolean(pag.has_next),
                            has_previous: Boolean(pag.has_previous)
                        });
                    } else {
                        setPagination(null);
                    }
                }
            } else {
                // server returned small dataset, sort globally within returned items
                const sorted = (data || []).slice().sort((a, b) => {
                    const ta = a && a.leave_date ? new Date(a.leave_date).getTime() : 0;
                    const tb = b && b.leave_date ? new Date(b.leave_date).getTime() : 0;
                    return tb - ta;
                });
                setRequests(sorted);

                if (pag) {
                    setPagination({
                        total_items_count: pag.total_items_count,
                        page_size: pag.page_size,
                        total_pages_count: pag.total_pages_count,
                        page_index: pag.page_index,
                        has_next: Boolean(pag.has_next),
                        has_previous: Boolean(pag.has_previous)
                    });
                } else {
                    setPagination(null);
                }
            }

            // Prefetch next page if available
            try {
                const totalPages = (pag && (pag.total_pages_count ?? (pag.has_next ? 2 : 1))) || 1;
                const nextUIPage = Number(uiPage) + 1;
                if (nextUIPage <= totalPages) {
                    const nextParams = { ...params, page: Math.max(0, nextUIPage - 1) };
                    const nextResp = await getLeaveRequests(nextParams);
                    const nextData = nextResp.data || [];
                    if (nextData.length > 0) {
                        const nextSorted = (nextData || []).slice().sort((a, b) => {
                            const ta = a && a.leave_date ? new Date(a.leave_date).getTime() : 0;
                            const tb = b && b.leave_date ? new Date(b.leave_date).getTime() : 0;
                            return tb - ta;
                        });
                        setPrefetchMap(prev => ({ ...prev, [nextUIPage]: nextSorted }));
                    }
                }
            } catch (prefetchErr) {
                console.warn('[LeaveRequestPage] prefetch failed', prefetchErr);
            }
        } catch (err) {
            console.error('[LeaveRequestPage] fetch failed', err);
            setRequests([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(page, rowsPerPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, statusFilter, fromDate, toDate]);

    // Show global loading same as other manager pages
    if (loading) {
        return <Loading message="Đang tải danh sách đơn..." fullScreen />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box>
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ bgcolor: COLORS.PRIMARY[600], width: 56, height: 56 }}>
                        <EventAvailable sx={{ fontSize: 28, color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Đơn nghỉ phép
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Tạo và quản lý đơn nghỉ phép của bạn
                        </Typography>
                    </Box>
                </Stack>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={() => navigate('/staff/leave-requests/new')}
                    sx={{ textTransform: 'none', px: 3, py: 1.25 }}
                >
                    Tạo đơn nghỉ phép
                </Button>
            </Box>

            <Paper>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Toolbar sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'center', p: 0 }}>
                        <TextField
                            select
                            size="small"
                            label="Trạng thái"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            sx={{ minWidth: 200 }}
                        >
                            <MenuItem value=''>Tất cả</MenuItem>
                            <MenuItem value='PENDING'>Đang chờ</MenuItem>
                            <MenuItem value='APPROVED'>Đã duyệt</MenuItem>
                            <MenuItem value='REJECTED'>Bị từ chối</MenuItem>
                            <MenuItem value='CANCELLED'>Đã huỷ</MenuItem>
                        </TextField>

                        <TextField
                            size="small"
                            type="date"
                            label="Từ ngày"
                            InputLabelProps={{ shrink: true }}
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            sx={{ minWidth: 160 }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="Đến ngày"
                            InputLabelProps={{ shrink: true }}
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            sx={{ minWidth: 160 }}
                        />
                    </Toolbar>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Ngày nghỉ</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Lý do</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>SĐT</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Ngày tạo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(!requests || requests.length === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có đơn nào</TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((row) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell>{row.leave_date ? new Date(row.leave_date).toLocaleDateString('vi-VN') : '-'}</TableCell>
                                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.reason || '-'}</TableCell>
                                            <TableCell>{row.replacement_employee?.full_name || '-'}</TableCell>
                                            <TableCell>{row.replacement_employee?.email || '-'}</TableCell>
                                            <TableCell>{row.replacement_employee?.phone || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={STATUS_LABELS[row.status] || row.status} color={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'error' : row.status === 'CANCELLED' ? 'warning' : 'info'} />
                                            </TableCell>
                                            <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString('vi-VN') : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                </TableContainer>

                <Box sx={{ px: 2, py: 1 }}>
                    <Pagination
                        page={page}
                        totalPages={pagination?.total_pages_count ?? Math.max(1, Math.ceil((pagination?.total_items_count ?? (requests.length || 0)) / rowsPerPage))}
                        itemsPerPage={pagination?.page_size ?? rowsPerPage}
                        totalItems={pagination?.total_items_count ?? (requests.length || 0)}
                        onPageChange={(newPage) => {
                            // if prefetched, use cached data
                            if (prefetchMap && prefetchMap[newPage]) {
                                setRequests(prefetchMap[newPage]);
                                setPrefetchMap(prev => {
                                    const next = { ...prev };
                                    delete next[newPage];
                                    return next;
                                });
                                setPage(newPage);
                                return;
                            }
                            setPage(newPage);
                        }}
                        onItemsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
                        showItemsPerPage={true}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default LeaveRequestPage;


