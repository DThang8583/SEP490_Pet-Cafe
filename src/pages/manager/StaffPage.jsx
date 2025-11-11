import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, Grid, Menu, ListItemIcon, ListItemText, Tooltip, Switch, Tabs, Tab } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AddStaffModal from '../../components/modals/AddStaffModal';
import AlertModal from '../../components/modals/AlertModal';
import { Edit, MoreVert, Visibility, VisibilityOff, People, Assignment } from '@mui/icons-material';
import employeeApi from '../../api/employeeApi';
import AttendanceTab from './AttendanceTab';

const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salary);
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
        case 'MANAGER': return 'Manager';
        case 'SALE_STAFF': return 'Sale Staff';
        case 'WORKING_STAFF': return 'Working Staff';
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
    const [currentTab, setCurrentTab] = useState(0); // 0: Danh sách nhân viên, 1: Điểm danh

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [allStaff, setAllStaff] = useState([]); // Store all staff (excluding managers)
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
    const [apiErrors, setApiErrors] = useState(null);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuStaff, setMenuStaff] = useState(null);

    // Salary visibility state
    const [showSalaries, setShowSalaries] = useState(false);

    // Toggle status loading state
    const [togglingStatus, setTogglingStatus] = useState({});

    // Load ALL staff data from API (excluding managers)
    const loadAllStaff = async ({ showSpinner = false } = {}) => {
        try {
            if (showSpinner) {
                setIsLoading(true);
            }
            setError('');

            const aggregatedEmployees = [];
            let pageIndex = 0;
            let safetyCounter = 0;

            while (safetyCounter < 20) { // guard against infinite loops
                let response;
                try {
                    response = await employeeApi.getAllEmployees({
                        page_index: pageIndex,
                        page_size: 10
                    });
                } catch (_) {
                    // If a page fails, break to avoid locking the UI
                    break;
                }

                const pageData = response?.data || [];
                aggregatedEmployees.push(...pageData);

                const pagination = response?.pagination || {};
                const hasNextRaw = pagination?.has_next;
                const hasNext = typeof hasNextRaw === 'string'
                    ? hasNextRaw.toLowerCase() === 'true'
                    : Boolean(hasNextRaw);

                if (!hasNext || pageData.length === 0) {
                    break;
                }

                pageIndex = (pagination.page_index ?? pageIndex) + 1;
                safetyCounter += 1;
            }

            // Deduplicate employees by ID (API pages can overlap)
            const uniqueEmployees = Array.from(
                new Map((aggregatedEmployees || []).map(emp => [emp.id, emp])).values()
            );

            // Filter out MANAGER role - Manager cannot manage other Managers
            const nonManagerStaff = uniqueEmployees.filter(s => {
                const displayRole = getDisplayRole(s);
                return displayRole !== 'MANAGER';
            });

            // Sort by created_at descending so latest employees appear first
            nonManagerStaff.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });

            setAllStaff(nonManagerStaff);
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

    // Load on mount
    useEffect(() => {
        loadAllStaff({ showSpinner: true });
    }, []); // Only load once on mount, not when page/itemsPerPage change

    const filtered = useMemo(() => {
        return allStaff.filter(s => {
            // Managers already filtered out in loadStaff, but double-check
            const displayRole = getDisplayRole(s);
            if (displayRole === 'MANAGER') return false;

            if (filterRole !== 'all') {
                if (displayRole !== filterRole) return false;
            }
            if (filterStatus !== 'all') {
                const isActive = s.account?.is_active;
                if (filterStatus === 'active' && !isActive) return false;
                if (filterStatus === 'inactive' && isActive) return false;
            }
            const text = `${s.full_name} ${s.email} ${s.phone}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [allStaff, q, filterRole, filterStatus]);

    // Statistics - exclude MANAGER from counts
    const stats = useMemo(() => {
        return {
            total: allStaff.length,
            saleStaff: allStaff.filter(s => getDisplayRole(s) === 'SALE_STAFF').length,
            workingStaff: allStaff.filter(s => getDisplayRole(s) === 'WORKING_STAFF').length,
            active: allStaff.filter(s => s.account?.is_active === true).length,
            inactive: allStaff.filter(s => s.account?.is_active === false).length
        };
    }, [allStaff]);

    // Pagination calculations - use filtered results for display
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentPageStaff = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filtered]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (page > 1 && filtered.length > 0) {
            const maxPage = Math.ceil(filtered.length / itemsPerPage);
            if (page > maxPage) {
                setPage(1);
            }
        }
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
            'areaid': 'area_id',
            'area_id': 'area_id',
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
                const response = await employeeApi.updateEmployee(selectedStaff.id, {
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    sub_role: staffData.sub_role,
                    skills: staffData.skills || [],
                    area_id: staffData.area_id || null,
                    avatar_url: staffData.avatar_url || selectedStaff.avatar_url || '',
                    password: staffData.password || undefined
                });

                if (response.success) {
                    // Reload all staff data
                    await loadAllStaff();

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
                    area_id: staffData.area_id || null,
                    avatar_url: staffData.avatar_url || '',
                    password: staffData.password
                });

                if (response.success) {
                    // Reload all staff data
                    await loadAllStaff();

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

    // Handle toggle employee status
    const handleToggleStatus = async (employee) => {
        const employeeId = employee.id;
        const currentStatus = employee.account?.is_active;
        const newStatus = !currentStatus;

        try {
            setTogglingStatus(prev => ({ ...prev, [employeeId]: true }));

            // Get current employee data first
            const currentEmployee = await employeeApi.getEmployeeById(employeeId);

            // Update employee with new is_active status
            // API requires password field, so we need to include it even if we're only updating status
            // Since we don't have the actual password, we'll send an empty string or use a placeholder
            // The API should handle this appropriately (either ignore it or require actual password)
            await employeeApi.updateEmployee(employeeId, {
                full_name: currentEmployee.full_name,
                phone: currentEmployee.phone,
                address: currentEmployee.address || '',
                salary: currentEmployee.salary,
                skills: currentEmployee.skills || [],
                area_id: currentEmployee.area_id || null,
                email: currentEmployee.email,
                avatar_url: currentEmployee.avatar_url || '',
                sub_role: currentEmployee.sub_role,
                password: '', // Send empty string as placeholder since API requires this field
                is_active: newStatus
            });

            // Reload all staff data to ensure consistency
            await loadAllStaff();

            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} nhân viên thành công!`,
                type: 'success'
            });
        } catch (error) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.response?.data?.message || error.message || 'Không thể thay đổi trạng thái nhân viên',
                type: 'error'
            });

            // Reload all staff data to revert any changes
            await loadAllStaff();
        } finally {
            setTogglingStatus(prev => {
                const newState = { ...prev };
                delete newState[employeeId];
                return newState;
            });
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

                {/* Tabs Navigation */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => {
                            setCurrentTab(newValue);
                            setPage(1);
                        }}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '1rem',
                                minHeight: 60
                            },
                            '& .Mui-selected': {
                                color: COLORS.ERROR[600]
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: COLORS.ERROR[600]
                            }
                        }}
                    >
                        <Tab
                            icon={<People />}
                            iconPosition="start"
                            label="Danh sách nhân viên"
                        />
                        <Tab
                            icon={<Assignment />}
                            iconPosition="start"
                            label="Điểm danh"
                        />
                    </Tabs>
                </Paper>

                {/* Tab Content: Danh sách nhân viên */}
                {currentTab === 0 && (
                    <>
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
                                    setApiErrors(null);
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
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <Switch
                                                            checked={s.account?.is_active === true}
                                                            onChange={() => handleToggleStatus(s)}
                                                            disabled={togglingStatus[s.id]}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: COLORS.SUCCESS[600],
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: COLORS.SUCCESS[600],
                                                                },
                                                            }}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={st.label}
                                                            sx={{
                                                                background: st.bg,
                                                                color: st.color,
                                                                fontWeight: 700
                                                            }}
                                                        />
                                                    </Stack>
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
                        </Menu>
                    </>
                )}

                {/* Tab Content: Điểm danh */}
                {currentTab === 1 && (
                    <AttendanceTab />
                )}
            </Box>
        </Box>
    );
};

export default StaffPage;
