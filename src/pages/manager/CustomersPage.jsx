import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Avatar, Grid, alpha, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import { People } from '@mui/icons-material';
import customerApi from '../../api/customerApi';

const statusColor = (isActive) => {
    if (isActive) {
        return { bg: alpha(COLORS.SUCCESS[100], 0.8), color: COLORS.SUCCESS[700], label: 'Hoạt động' };
    } else {
        return { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700], label: 'Không hoạt động' };
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    } catch (e) {
        return '—';
    }
};

const CustomersPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [customers, setCustomers] = useState([]);
    const [q, setQ] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        total_items_count: 0,
        page_size: 10,
        total_pages_count: 0,
        page_index: 0,
        has_next: false,
        has_previous: false
    });

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Load customers data from API with pagination
    const loadCustomers = async ({ showSpinner = false } = {}) => {
        try {
            if (showSpinner) {
                setIsLoading(true);
            }
            setError('');

            const pageIndex = page - 1; // Convert to 0-based index for API
            console.log(`[loadCustomers] Loading page ${page} (page_index: ${pageIndex}), itemsPerPage: ${itemsPerPage}`);

            const response = await customerApi.getAllCustomers({
                page: pageIndex, // API uses 0-based page index
                limit: itemsPerPage
            });

            const pageData = response?.data || [];
            console.log(`[loadCustomers] Received ${pageData.length} customers from API`);
            console.log(`[loadCustomers] API pagination:`, response?.pagination);

            setCustomers(pageData);

            // Update pagination from API response
            if (response?.pagination) {
                setPagination(response.pagination);
            }
        } catch (e) {
            setError(e.message || 'Không thể tải danh sách khách hàng');
            setAlert({
                open: true,
                title: 'Lỗi',
                message: e.message || 'Không thể tải danh sách khách hàng',
                type: 'error'
            });
        } finally {
            if (showSpinner) {
                setIsLoading(false);
            }
        }
    };

    // Load on mount and when page/itemsPerPage changes
    useEffect(() => {
        loadCustomers({ showSpinner: true });
    }, [page, itemsPerPage]);

    const filtered = useMemo(() => {
        return customers.filter(c => {
            // Search filter
            const text = `${c.full_name || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
            const matchesSearch = text.includes(q.toLowerCase());

            // Status filter
            let matchesStatus = true;
            if (filterStatus !== 'all') {
                const isActive = c.account?.is_active;
                if (filterStatus === 'active' && !isActive) {
                    matchesStatus = false;
                }
                if (filterStatus === 'inactive' && isActive) {
                    matchesStatus = false;
                }
            }

            return matchesSearch && matchesStatus;
        });
    }, [customers, q, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: customers.length,
            active: customers.filter(c => {
                const isActive = c.account?.is_active;
                return isActive === true;
            }).length,
            inactive: customers.filter(c => {
                const isActive = c.account?.is_active;
                return isActive === false;
            }).length
        };
    }, [customers]);

    // Pagination calculations
    const totalPages = useMemo(() => {
        if (pagination.total_pages_count > 0) {
            return pagination.total_pages_count;
        }
        return Math.ceil(pagination.total_items_count / itemsPerPage) || 1;
    }, [pagination, itemsPerPage]);

    // Current page data (already filtered by API, but we apply search filter client-side)
    const currentPageCustomers = useMemo(() => {
        return filtered;
    }, [filtered]);

    if (isLoading) {
        return (
            <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
                <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải danh sách khách hàng..." />
            </Box>
        );
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.PRIMARY[600], mb: 3 }}>
                    Quản lý khách hàng
                </Typography>

                {/* Status Badges */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={6} md={4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng khách hàng
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {stats.total}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={4}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Hoạt động
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {stats.active}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={6} md={4}>
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
                        sx={{ minWidth: { xs: '100%', sm: 1520 }, flexGrow: { xs: 1, sm: 0 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="active">Hoạt động</MenuItem>
                            <MenuItem value="inactive">Không hoạt động</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                </Toolbar>

                {/* Customers List Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, boxShadow: `0 10px 24px ${alpha(COLORS.PRIMARY[200], 0.15)}`, overflowX: 'auto' }}>
                    <Table size="medium" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Khách hàng</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', sm: 'table-cell' } }}>SĐT</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>Địa chỉ</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Ngày sinh</TableCell>
                                <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Điểm thưởng</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPageCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Stack direction="column" alignItems="center" spacing={2}>
                                            <People sx={{ fontSize: 48, color: COLORS.GRAY[400] }} />
                                            <Typography variant="body1" color="text.secondary">
                                                {q ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPageCustomers.map((c) => {
                                    const isActive = c.account?.is_active;
                                    const st = statusColor(isActive);
                                    return (
                                        <TableRow key={c.id} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Avatar
                                                        src={c.avatar_url || null}
                                                        alt={c.full_name || 'Customer'}
                                                        sx={{ width: 40, height: 40 }}
                                                    >
                                                        {c.full_name?.charAt(0)?.toUpperCase() || 'K'}
                                                    </Avatar>
                                                    <Typography sx={{ fontWeight: 600 }}>{c.full_name || '—'}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{c.email || '—'}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{c.phone || '—'}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{c.address || '—'}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(c.date_of_birth)}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Chip
                                                    size="small"
                                                    label={c.loyalty_points || 0}
                                                    sx={{
                                                        bgcolor: alpha(COLORS.WARNING[100], 0.7),
                                                        color: COLORS.WARNING[800],
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={st.label}
                                                    sx={{
                                                        background: st.bg,
                                                        color: st.color,
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {(currentPageCustomers.length > 0 || page === 1) && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                    />
                )}
            </Box>

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </Box>
    );
};

export default CustomersPage;

