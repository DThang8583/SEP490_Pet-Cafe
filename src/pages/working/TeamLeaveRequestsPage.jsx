import React, { useEffect, useState } from 'react';
import {
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Typography,
    Chip,
    CircularProgress,
    Button,
    TextField,
    Toolbar
} from '@mui/material';
import Loading from '../../components/loading/Loading';
import PageTitle from '../../components/common/PageTitle';
import workingStaffApi from '../../api/workingStaffApi';
import { getLeaveRequests } from '../../api/leaveRequestApi';
import Pagination from '../../components/common/Pagination';

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
        return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return iso;
    }
};

const TeamLeaveRequestsPage = () => {
    const profile = workingStaffApi.getProfile();
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [loading, setLoading] = useState(false);
    const [allRequests, setAllRequests] = useState([]);
    // filters
    const [statusFilter, setStatusFilter] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [fromDateFilter, setFromDateFilter] = useState('');
    const [toDateFilter, setToDateFilter] = useState('');

    // pagination (client-side)
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const myTeams = await workingStaffApi.getMyTeams();
                if (!mounted) return;
                setTeams(myTeams || []);
                // Only set default selected team if not already selected
                if ((!selectedTeamId || selectedTeamId === '') && myTeams && myTeams.length > 0) {
                    setSelectedTeamId(myTeams[0].id);
                }
            } catch (err) {
                console.error('Failed to load teams for leader page', err);
                setTeams([]);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, []);

    // prevent duplicate fetches when selectedTeamId doesn't change
    const lastFetchedTeamRef = React.useRef(null);

    useEffect(() => {
        if (!selectedTeamId) {
            setAllRequests([]);
            return;
        }

        let mounted = true;
        const loadRequestsForTeam = async () => {
            // skip if we've already fetched for this team and nothing changed
            if (lastFetchedTeamRef.current === selectedTeamId) return;
            setLoading(true);
            try {
                // get team members
                const team = teams.find(t => t.id === selectedTeamId);
                const members = team?.members || [];
                const memberIds = members.map(m => m.employee_id || m.employee?.id || m.account_id || m.account?.id).filter(Boolean);
                // ensure include leader themselves
                const leaderIds = [
                    profile?.id,
                    profile?.employee?.id,
                    profile?.employee_id,
                    profile?.account?.id,
                    profile?.account_id
                ].filter(Boolean);
                const allowedIds = Array.from(new Set([...memberIds, ...leaderIds]));
                if (allowedIds.length === 0) {
                    if (mounted) {
                        setAllRequests([]);
                        setLoading(false);
                    }
                    return;
                }

                // fetch per employee (request a large limit to aggregate full data) and merge
                const promises = allowedIds.map(id => getLeaveRequests({ EmployeeId: id, page: 0, limit: 1000 }).catch(() => ({ data: [] })));
                const responses = await Promise.all(promises);
                const merged = responses.flatMap(r => r.data || []);
                // dedupe
                const byId = new Map();
                merged.forEach(item => {
                    if (item && item.id) byId.set(item.id, item);
                });
                // sort by leave_date descending (newest leave_date first), fallback to created_at
                const deduped = Array.from(byId.values()).slice().sort((a, b) => {
                    const ta = a && a.leave_date ? new Date(a.leave_date).getTime() : (a && a.created_at ? new Date(a.created_at).getTime() : 0);
                    const tb = b && b.leave_date ? new Date(b.leave_date).getTime() : (b && b.created_at ? new Date(b.created_at).getTime() : 0);
                    return tb - ta;
                });
                if (mounted) {
                    setAllRequests(deduped);
                    setPage(0);
                    // mark this team as fetched successfully
                    lastFetchedTeamRef.current = selectedTeamId;
                }
            } catch (err) {
                console.error('Failed to load leave requests for team', err);
                if (mounted) {
                    setAllRequests([]);
                    // clear fetched marker so that user can retry selecting same team
                    lastFetchedTeamRef.current = null;
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadRequestsForTeam();
        return () => { mounted = false; };
    }, [selectedTeamId, teams, profile]);

    const filteredRequests = React.useMemo(() => {
        if (!allRequests || allRequests.length === 0) return [];
        return allRequests.filter(r => {
            // status filter
            if (statusFilter && r.status !== statusFilter) return false;
            // employee filter (match employee.id or employee_id)
            if (employeeFilter) {
                const eid = r.employee?.id || r.employee_id || r.employee?.account_id;
                if (eid !== employeeFilter) return false;
            }
            // date range filter (compare YYYY-MM-DD)
            if (fromDateFilter) {
                const d = r.leave_date ? r.leave_date.slice(0,10) : '';
                if (!d || d < fromDateFilter) return false;
            }
            if (toDateFilter) {
                const d = r.leave_date ? r.leave_date.slice(0,10) : '';
                if (!d || d > toDateFilter) return false;
            }
            return true;
        });
    }, [allRequests, statusFilter, employeeFilter, fromDateFilter, toDateFilter]);

    const totalItems = filteredRequests.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const paged = filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    if (loading) {
        return <Loading message="Đang tải danh sách đơn nghỉ phép..." fullScreen variant="dots" />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageTitle title="Đơn nghỉ phép (Trưởng nhóm)" subtitle="Xem các đơn của thành viên trong nhóm bạn quản lý" center={false} />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 300 }}>
                    <InputLabel id="team-select-label">Chọn nhóm</InputLabel>
                    <Select
                        labelId="team-select-label"
                        value={selectedTeamId || ''}
                        label="Chọn nhóm"
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {teams.map(t => (
                            <MenuItem key={t.id} value={t.id}>
                                {t.name || `Nhóm ${t.id}`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
            </Box>

            {/* Filters: Status, Employee (members), FromDate, ToDate */}
            <Paper sx={{ mb: 2, p: 2 }}>
                <Toolbar sx={{ gap: 2, flexWrap: 'wrap', p: 0 }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Trạng thái"
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                            <MenuItem value="REJECTED">Từ chối</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 240 }}>
                        <InputLabel>Nhân viên</InputLabel>
                        <Select
                            value={employeeFilter}
                            label="Nhân viên"
                            onChange={(e) => { setEmployeeFilter(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {(() => {
                                const team = teams.find(t => t.id === selectedTeamId) || {};
                                const members = team.members || [];
                                return members.map(m => {
                                    const id = m.employee_id || m.employee?.id || m.account_id || m.account?.id || m.id;
                                    const name = m.employee?.full_name || m.full_name || m.name || id;
                                    return <MenuItem key={id} value={id}>{name}</MenuItem>;
                                });
                            })()}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        type="date"
                        label="Từ ngày"
                        InputLabelProps={{ shrink: true }}
                        value={fromDateFilter}
                        onChange={(e) => { setFromDateFilter(e.target.value); setPage(0); }}
                        sx={{ minWidth: 160 }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label="Đến ngày"
                        InputLabelProps={{ shrink: true }}
                        value={toDateFilter}
                        onChange={(e) => { setToDateFilter(e.target.value); setPage(0); }}
                        sx={{ minWidth: 160 }}
                    />
                </Toolbar>
            </Paper>

            <Paper>
                <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Ngày nghỉ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Lý do</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Nhân viên</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Email NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>SĐT NV thay thế</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Ngày tạo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">Không có đơn nào</TableCell>
                                    </TableRow>
                                ) : paged.map(row => (
                                    <TableRow key={row.id}>
                                        <TableCell>{formatDate(row.leave_date)}</TableCell>
                                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.reason || ''}</TableCell>
                                        <TableCell>{row.employee?.full_name || row.employee?.name || ''}</TableCell>
                                        <TableCell>{row.replacement_employee?.full_name || ''}</TableCell>
                                        <TableCell>{row.replacement_employee?.email || row.replacement_employee?.email_address || ''}</TableCell>
                                        <TableCell>{row.replacement_employee?.phone || row.replacement_employee?.phone_number || row.replacement_employee?.mobile || ''}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={STATUS_LABELS[row.status] || row.status}
                                                color={
                                                    row.status === 'APPROVED'
                                                        ? 'success'
                                                        : row.status === 'REJECTED'
                                                        ? 'error'
                                                        : row.status === 'CANCELLED'
                                                        ? 'warning'
                                                        : 'info'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{formatDateTime(row.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                </TableContainer>

                <Box sx={{ px: 2, py: 1 }}>
                    <Pagination
                        page={page + 1}
                        totalPages={totalPages}
                        onPageChange={(newPage) => setPage(newPage - 1)}
                        itemsPerPage={rowsPerPage}
                        onItemsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
                        totalItems={totalItems}
                        showItemsPerPage
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default TeamLeaveRequestsPage;


