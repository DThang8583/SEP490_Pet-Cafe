import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, Menu, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AddStaffModal from '../../components/modals/AddStaffModal';
import AlertModal from '../../components/modals/AlertModal';
import { Edit, MoreVert, Visibility, VisibilityOff, People, WorkOutline } from '@mui/icons-material';
import employeeApi from '../../api/employeeApi';

const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN').format(salary) + ' VNĐ';
};

// Helper to get the display role from employee data
const getDisplayRole = (employee) => {
    // If account.role is MANAGER, use that
    if (employee.account?.role === 'MANAGER') {
        return 'MANAGER';
    }
    // Otherwise use sub_role (for EMPLOYEE)
    const subRole = employee.sub_role?.trim();
    if (subRole) {
        return subRole;
    }
    return null;
};

const roleLabel = (role) => {
    switch (role) {
        case 'MANAGER': return 'Quản lý';
        case 'SALE_STAFF': return 'Nhân viên bán hàng';
        case 'WORKING_STAFF': return 'Nhân viên chăm sóc';
        default: return role || '—';
    }
};

const roleColor = (role) => {
    switch (role) {
        case 'MANAGER': return { bg: alpha(COLORS.ERROR[100], 0.8), color: COLORS.ERROR[700] };
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
    const [allStaff, setAllStaff] = useState([]); // Store all staff (excluding managers)
    const [q, setQ] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        total_items_count: 0,
        page_size: 999,
        total_pages_count: 0,
        page_index: 0,
        has_next: false,
        has_previous: false
    });

    // Store all staff for statistics (load all pages in background)
    const [allStaffForStats, setAllStaffForStats] = useState([]);

    // Modal states
    const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiErrors, setApiErrors] = useState(null);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuStaff, setMenuStaff] = useState(null);
    // optional shifts UI removed

    // Salary visibility state
    const [showSalaries, setShowSalaries] = useState(false);


    // Load staff data from API with pagination (excluding managers)
    const loadStaff = async ({ showSpinner = false } = {}) => {
        try {
            if (showSpinner) {
                setIsLoading(true);
            }
            setError('');

            const pageIndex = page - 1; // Convert to 0-based index
            console.log(`[loadStaff] Loading page ${page} (page_index: ${pageIndex}), itemsPerPage: ${itemsPerPage}`);

            const response = await employeeApi.getAllEmployees({
                page_index: pageIndex,
                page_size: itemsPerPage
            });

            const pageData = response?.data || [];
            console.log(`[loadStaff] Received ${pageData.length} employees from API`);
            console.log(`[loadStaff] API pagination:`, response?.pagination);

            // Filter out MANAGER role - Manager cannot manage other Managers
            const nonManagerStaff = pageData.filter(s => {
                const displayRole = getDisplayRole(s);
                return displayRole !== 'MANAGER';
            });

            console.log(`[loadStaff] After filtering MANAGER: ${nonManagerStaff.length} employees`);

            setAllStaff(nonManagerStaff);

            // Update pagination from API response
            if (response?.pagination) {
                // We need to adjust total_items_count because we filter out MANAGERs
                // But we can't know the exact count without loading all pages
                // So we'll use the API pagination and adjust it in stats calculation
                setPagination(response.pagination);
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
            if (showSpinner) {
                setIsLoading(false);
            }
        }
    };

    // Load all staff cho thống kê (chạy nền, không block UI)
    const loadAllStaffForStats = async () => {
        try {
            const aggregatedEmployees = [];
            const seenIds = new Set(); // Track seen employee IDs to avoid duplicates
            let pageIndex = 0;
            let safetyCounter = 0;
            const largePageSize = 999; // Try to get all employees in one request (but API may limit to 10)

            while (safetyCounter < 20) { // guard against infinite loops
                let response;
                try {
                    response = await employeeApi.getAllEmployees({
                        page_index: pageIndex,
                        page_size: largePageSize // Use large page size (API may still limit to 10)
                    });
                } catch (_) {
                    break;
                }

                const pageData = response?.data || [];
                const pagination = response?.pagination || {};

                console.log(`[loadAllStaffForStats] Page ${pageIndex}: Loaded ${pageData.length} employees, Total so far: ${aggregatedEmployees.length}, has_next: ${pagination?.has_next}`);

                // Add only new employees (not seen before) to avoid duplicates
                let newEmployeesCount = 0;
                pageData.forEach(emp => {
                    if (!seenIds.has(emp.id)) {
                        seenIds.add(emp.id);
                        aggregatedEmployees.push(emp);
                        newEmployeesCount++;
                    }
                });

                // Check pagination to see if there are more pages
                const hasNextRaw = pagination?.has_next;
                const hasNext = typeof hasNextRaw === 'string'
                    ? hasNextRaw.toLowerCase() === 'true'
                    : Boolean(hasNextRaw);

                const totalItems = pagination?.total_items_count ?? 0;

                // Stop conditions:
                // 1. No more pages (has_next = false)
                // 2. No data returned
                // 3. We've collected all items (aggregatedEmployees.length >= totalItems)
                // 4. We got no new employees and there's no next page (duplicate data)
                if (!hasNext || pageData.length === 0 || (totalItems > 0 && aggregatedEmployees.length >= totalItems)) {
                    console.log(`[loadAllStaffForStats] Stopping: has_next=${hasNext}, pageData.length=${pageData.length}, aggregated=${aggregatedEmployees.length}, total=${totalItems}`);
                    break;
                }

                // If we got no new employees but has_next is true, continue (might be API pagination issue)
                if (newEmployeesCount === 0 && pageData.length > 0 && !hasNext) {
                    console.log(`[loadAllStaffForStats] Stopping: No new employees and no next page`);
                    break;
                }

                // Move to next page
                pageIndex = (pagination.page_index ?? pageIndex) + 1;
                safetyCounter += 1;
            }

            console.log(`[loadAllStaffForStats] Final: Loaded ${aggregatedEmployees.length} total employees`);

            // Filter out MANAGER role
            const nonManagerStaff = aggregatedEmployees.filter(s => {
                const displayRole = getDisplayRole(s);
                return displayRole !== 'MANAGER';
            });

            console.log(`[loadAllStaffForStats] After filtering MANAGER: ${nonManagerStaff.length} employees`);

            setAllStaffForStats(nonManagerStaff);
        } catch (e) {
            // Silently fail for stats - not critical
            console.warn('Failed to load all staff for statistics:', e);
        }
    };

    // Load danh sách nhân viên theo trang
    useEffect(() => {
        loadStaff({ showSpinner: true });
    }, [page, itemsPerPage]);

    // Load thống kê allStaffForStats khi cần (chỉ khi chưa có dữ liệu)
    useEffect(() => {
        if (allStaffForStats.length === 0) {
            loadAllStaffForStats();
        }
    }, [allStaffForStats.length]);

    const filtered = useMemo(() => {
        return allStaff.filter(s => {
            // Managers already filtered out in loadStaff, but double-check
            const displayRole = getDisplayRole(s);
            if (displayRole === 'MANAGER') return false;

            if (filterRole !== 'all') {
                if (displayRole !== filterRole) return false;
            }
            if (filterStatus !== 'all') {
                // Use is_active from root level (as per API), fallback to account.is_active if not available
                const isActive = s.is_active !== undefined ? s.is_active : s.account?.is_active;
                if (filterStatus === 'active' && !isActive) return false;
                if (filterStatus === 'inactive' && isActive) return false;
            }
            const text = `${s.full_name} ${s.email} ${s.phone}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [allStaff, q, filterRole, filterStatus]);

    // Statistics - use allStaffForStats if available, otherwise use current page data
    const stats = useMemo(() => {
        const sourceData = allStaffForStats.length > 0 ? allStaffForStats : allStaff;
        return {
            total: sourceData.length,
            saleStaff: sourceData.filter(s => getDisplayRole(s) === 'SALE_STAFF').length,
            workingStaff: sourceData.filter(s => getDisplayRole(s) === 'WORKING_STAFF').length,
            // Use is_active from root level (as per API), fallback to account.is_active if not available
            active: sourceData.filter(s => {
                const isActive = s.is_active !== undefined ? s.is_active : s.account?.is_active;
                return isActive === true;
            }).length,
            inactive: sourceData.filter(s => {
                const isActive = s.is_active !== undefined ? s.is_active : s.account?.is_active;
                return isActive === false;
            }).length
        };
    }, [allStaffForStats, allStaff]);

    // Pagination calculations - use API pagination but adjust for filtered data
    // Since we filter MANAGERs client-side, we need to calculate total pages correctly
    const totalPages = useMemo(() => {
        // If we have stats from allStaffForStats (after filtering MANAGERs), use that for accurate pagination
        if (allStaffForStats.length > 0) {
            return Math.ceil(allStaffForStats.length / itemsPerPage);
        }
        // Otherwise, use API pagination but adjust for MANAGERs
        // API says total_items_count = 18, but we filter out MANAGERs
        // We estimate: if there's 1 MANAGER, then non-manager count = 18 - 1 = 17
        // But we can't know exact count without loading all pages, so we use API's total_pages_count
        // and adjust based on the fact that we're filtering MANAGERs
        if (pagination.total_pages_count > 0) {
            // Use API's total_pages_count as base, but it might be slightly off due to MANAGER filtering
            return pagination.total_pages_count;
        }
        // Fallback: estimate based on total_items_count
        const estimatedNonManagerCount = Math.max(0, pagination.total_items_count - 1); // Assume 1 MANAGER
        return Math.ceil(estimatedNonManagerCount / itemsPerPage) || 1;
    }, [allStaffForStats, pagination, itemsPerPage]);

    const currentPageStaff = useMemo(() => {
        // Use filtered data from current page (already filtered for MANAGERs)
        return filtered;
    }, [filtered]);

    // Reset to page 1 when filters change (but keep current page if data exists)
    useEffect(() => {
        // Only reset if we're on a page that would be empty
        // Since we're using server-side pagination, we don't need to reset on filter changes
        // The filter is applied client-side on the current page data
    }, [filtered.length, itemsPerPage, page]);

    // Parse API error response to extract field-specific errors
    const parseApiErrors = (error) => {
        const fieldErrors = {};

        // Check if error has response data with validation errors
        if (error.response?.data) {
            const errorData = error.response.data;

            // Handle format: { error: Array(2) ['Password: ...', 'Password: ...'] }
            if (errorData.error && Array.isArray(errorData.error)) {
                errorData.error.forEach(message => {
                    if (typeof message === 'string') {
                        // Check if message contains field name prefix like "Password: ..."
                        const fieldPrefixMatch = message.match(/^(\w+):\s*(.+)$/i);
                        if (fieldPrefixMatch) {
                            const fieldName = fieldPrefixMatch[1].toLowerCase();
                            const errorText = fieldPrefixMatch[2].trim();
                            const mappedField = mapFieldName(fieldName);

                            // If field already has error, append to it
                            if (fieldErrors[mappedField]) {
                                fieldErrors[mappedField] += '. ' + errorText;
                            } else {
                                fieldErrors[mappedField] = errorText;
                            }
                        }
                    }
                });
            }
            // Handle different error response formats
            else if (errorData.errors && typeof errorData.errors === 'object') {
                // ASP.NET Core validation errors format: { "errors": { "field": ["error1", "error2"] } }
                Object.keys(errorData.errors).forEach(field => {
                    const fieldName = field.toLowerCase();
                    const errorMessages = errorData.errors[field];
                    if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                        // Map common field names
                        const mappedField = mapFieldName(fieldName);
                        // Combine all error messages for this field
                        const combinedMessage = errorMessages.length > 1
                            ? errorMessages.join('. ')
                            : errorMessages[0];
                        fieldErrors[mappedField] = combinedMessage;
                    }
                });
            } else if (errorData.message) {
                // Handle single message or array of messages
                let messages = [];
                if (Array.isArray(errorData.message)) {
                    messages = errorData.message;
                } else if (typeof errorData.message === 'string') {
                    messages = [errorData.message];
                }

                // Process each message
                messages.forEach(message => {
                    // Check if message contains field name prefix like "Password: ..."
                    const fieldPrefixMatch = message.match(/^(\w+):\s*(.+)$/i);
                    if (fieldPrefixMatch) {
                        const fieldName = fieldPrefixMatch[1].toLowerCase();
                        const errorText = fieldPrefixMatch[2].trim();
                        const mappedField = mapFieldName(fieldName);

                        // If field already has error, append to it
                        if (fieldErrors[mappedField]) {
                            fieldErrors[mappedField] += '. ' + errorText;
                        } else {
                            fieldErrors[mappedField] = errorText;
                        }
                    } else {
                        // Try to extract field name from message
                        const fieldMatch = message.match(/(?:field|fieldname|property)\s+['"]?(\w+)['"]?/i);
                        if (fieldMatch) {
                            const mappedField = mapFieldName(fieldMatch[1].toLowerCase());
                            if (fieldErrors[mappedField]) {
                                fieldErrors[mappedField] += '. ' + message;
                            } else {
                                fieldErrors[mappedField] = message;
                            }
                        } else {
                            // Check common field names in message
                            const commonFields = ['email', 'phone', 'password', 'full_name', 'fullname', 'sub_role', 'subrole'];
                            for (const field of commonFields) {
                                if (message.toLowerCase().includes(field)) {
                                    const mappedField = mapFieldName(field);
                                    if (fieldErrors[mappedField]) {
                                        fieldErrors[mappedField] += '. ' + message;
                                    } else {
                                        fieldErrors[mappedField] = message;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        }

        return fieldErrors;
    };

    // Map API field names to form field names
    const mapFieldName = (apiFieldName) => {
        const mapping = {
            'fullname': 'full_name',
            'full_name': 'full_name',
            'email': 'email',
            'phone': 'phone',
            'address': 'address',
            'salary': 'salary',
            'subrole': 'sub_role',
            'sub_role': 'sub_role',
            'password': 'password',
            'avatarurl': 'avatar_url',
            'avatar_url': 'avatar_url',
            'skills': 'skills'
        };
        return mapping[apiFieldName] || apiFieldName;
    };

    // Handle submit staff (add/edit)
    const handleSubmitStaff = async (staffData) => {
        try {
            setIsSubmitting(true);
            setApiErrors(null); // Clear previous errors

            if (editMode) {
                // Update existing staff
                const updateData = {
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    sub_role: staffData.sub_role,
                    skills: staffData.skills || [],
                    avatar_url: staffData.avatar_url || selectedStaff.avatar_url || '',
                    is_active: staffData.is_active !== undefined ? Boolean(staffData.is_active) : true
                };

                // Only include password fields if password is provided
                if (staffData.password && staffData.password.trim()) {
                    updateData.new_password = staffData.password;
                }

                const response = await employeeApi.updateEmployee(selectedStaff.id, updateData);

                if (response.success) {
                    // optional-work-shifts handling removed (not used)

                    // Reload current page and stats
                    await loadStaff();
                    await loadAllStaffForStats();

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Cập nhật thông tin nhân viên thành công!',
                        type: 'success'
                    });

                    // Close modal on success
                    setAddStaffModalOpen(false);
                    setSelectedStaff(null);
                    setEditMode(false);
                    setApiErrors(null);
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
                    // Reload current page and stats
                    await loadStaff();
                    await loadAllStaffForStats();

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Thêm nhân viên mới thành công!',
                        type: 'success'
                    });

                    // Close modal on success
                    setAddStaffModalOpen(false);
                    setSelectedStaff(null);
                    setEditMode(false);
                    setApiErrors(null);
                }
            }
        } catch (error) {
            // Parse API errors to get field-specific errors
            const fieldErrors = parseApiErrors(error);

            if (Object.keys(fieldErrors).length > 0) {
                // We have field-specific errors - display them in the form
                setApiErrors(fieldErrors);
                // Don't close modal - let user see and fix errors
            } else {
                // Generic error (network, server error, etc.) - show in alert modal
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.response?.data?.message || error.message || 'Không thể lưu thông tin nhân viên',
                    type: 'error'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return (
            <Loading fullScreen message="Đang tải danh sách nhân viên..." />
        );
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Page Header */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <People sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                        <Typography variant="h4" fontWeight={600}>
                            Quản lý Nhân viên
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Theo dõi, phân loại và cập nhật thông tin nhân viên trong hệ thống
                    </Typography>
                </Box>

                {/* Danh sách nhân viên */}
                <>
                    {/* Status Badges */}
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
                            { label: 'Tổng nhân viên', value: stats.total, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[700] },
                            { label: 'Nhân viên bán hàng', value: stats.saleStaff, color: COLORS.INFO[500], valueColor: COLORS.INFO[700] },
                            { label: 'Nhân viên chăm sóc', value: stats.workingStaff, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] },
                            { label: 'Hoạt động', value: stats.active, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[700] },
                            { label: 'Không hoạt động', value: stats.inactive, color: COLORS.ERROR[500], valueColor: COLORS.ERROR[700] }
                        ].map((stat, index) => {
                            const cardWidth = `calc((100% - ${4 * 16}px) / 5)`;
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

                    <Toolbar
                        disableGutters
                        sx={{
                            gap: 2,
                            flexWrap: 'wrap',
                            mb: 2,
                            alignItems: 'center',
                            position: 'relative',
                            minHeight: '64px !important',
                            '& > *': {
                                flexShrink: 0
                            }
                        }}
                    >
                        <TextField
                            size="small"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            sx={{ minWidth: { xs: '100%', sm: 1000 }, flexGrow: { xs: 1, sm: 0 }, flexShrink: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 180, flexShrink: 0 }}>
                            <InputLabel>Vai trò</InputLabel>
                            <Select label="Vai trò" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="SALE_STAFF">Nhân viên bán hàng</MenuItem>
                                <MenuItem value="WORKING_STAFF">Nhân viên chăm sóc</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0 }}>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="active">Hoạt động</MenuItem>
                                <MenuItem value="inactive">Không hoạt động</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ flexGrow: 1, flexShrink: 0, minWidth: 0 }} />
                        <Button
                            variant="contained"
                            onClick={() => {
                                setEditMode(false);
                                setSelectedStaff(null);
                                setApiErrors(null);
                                setAddStaffModalOpen(true);
                            }}
                            sx={{
                                backgroundColor: COLORS.ERROR[500],
                                '&:hover': { backgroundColor: COLORS.ERROR[600] },
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
                            }}
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
                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', lg: 'table-cell' } }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography sx={{ fontWeight: 800 }}>Lương</Typography>
                                            <Tooltip title={showSalaries ? "Ẩn lương" : "Hiện lương"} arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setShowSalaries(!showSalaries)}
                                                    sx={{
                                                        color: showSalaries ? COLORS.PRIMARY[600] : COLORS.GRAY[500],
                                                        '&:hover': {
                                                            bgcolor: alpha(COLORS.PRIMARY[100], 0.5)
                                                        }
                                                    }}
                                                >
                                                    {showSalaries ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Vai trò</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPageStaff.map((s) => {
                                    const displayRole = getDisplayRole(s);
                                    const rColor = roleColor(displayRole);
                                    // Use is_active from root level (as per API), fallback to account.is_active if not available
                                    const isActive = s.is_active !== undefined ? s.is_active : s.account?.is_active;
                                    const st = statusColor(isActive);
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
                                                {showSalaries ? (
                                                    <Typography variant="body2" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                                        {formatSalary(s.salary)}
                                                    </Typography>
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{
                                                            color: COLORS.GRAY[500],
                                                            letterSpacing: 2,
                                                            userSelect: 'none'
                                                        }}
                                                    >
                                                        ••••••••
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={roleLabel(displayRole)} sx={{ background: rColor.bg, color: rColor.color, fontWeight: 700 }} />
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
                    {(currentPageStaff.length > 0 || page === 1) && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(newValue) => {
                                setItemsPerPage(newValue);
                                setPage(1);
                            }}
                            totalItems={
                                allStaffForStats.length > 0
                                    ? allStaffForStats.length
                                    : Math.max(0, pagination.total_items_count - 1) // Estimate: subtract 1 for MANAGER
                            }
                        />
                    )}

                    {/* Add/Edit Staff Modal */}
                    <AddStaffModal
                        isOpen={addStaffModalOpen}
                        onClose={() => {
                            setAddStaffModalOpen(false);
                            setSelectedStaff(null);
                            setEditMode(false);
                            setApiErrors(null);
                        }}
                        onSubmit={handleSubmitStaff}
                        editMode={editMode}
                        initialData={selectedStaff}
                        isLoading={isSubmitting}
                        apiErrors={apiErrors}
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
                        disableScrollLock={true}
                        MenuListProps={{
                            sx: {
                                py: 0.5,
                            }
                        }}
                        PaperProps={{
                            sx: {
                                mt: 0.5,
                                position: 'absolute',
                            }
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                if (menuStaff) {
                                    setEditMode(true);
                                    setSelectedStaff(menuStaff);
                                    setApiErrors(null);
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
                            {/* Optional shifts feature removed */}
                    </Menu>
                    {/* EditOptionalShiftsModal removed */}
                </>
            </Box>
        </Box>
    );
};

export default StaffPage;
