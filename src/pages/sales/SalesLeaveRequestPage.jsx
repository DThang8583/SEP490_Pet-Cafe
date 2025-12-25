import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Snackbar, Alert, FormControl, Select, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Send, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import workingStaffApi from '../../api/workingStaffApi';
import { createLeaveRequest } from '../../api/leaveRequestApi';
import { getAllEmployees } from '../../api/employeeApi';
import COLORS from '../../constants/colors';
import PageTitle from '../../components/common/PageTitle';
import AlertModal from '../../components/modals/AlertModal';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Official backend-supported leave types: ADVANCE
// EMERGENCY no longer used; default to ADVANCE and do not show choice to user.
const LEAVE_TYPE_OPTIONS = [
    { value: 'ADVANCE', label: 'Nghỉ trước' }
];

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const SalesLeaveRequestPage = () => {
    const profile = workingStaffApi.getProfile();
    const profileSubRole = (profile?.sub_role || profile?.subRole || profile?.role || profile?.account?.role || '') || '';
    const normalizedProfileSubRole = String(profileSubRole || '').trim().toLowerCase();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

    const [formData, setFormData] = useState({
        employee_id: profile?.id || profile?.employee_id || profile?.account_id || '',
        leave_date: '',
        leave_type: 'ADVANCE',
        replacement_employee_id: '',
        team_ids: [],
        reason: ''
    });
    const [dateError, setDateError] = useState('');

    const [selectedReplacement, setSelectedReplacement] = useState(null);
    const leaveDateInputRef = useRef(null);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertProps, setAlertProps] = useState({ title: 'Thông báo', message: '', type: 'info', okText: 'OK' });

    // Load teams that user belongs to
    useEffect(() => {
        let mounted = true;
        const loadTeams = async () => {
            try {
                const data = await workingStaffApi.getMyTeams();
                if (mounted) {
                    setTeams(data || []);
                }
            } catch (error) {
                console.error('Failed to load teams', error);
                setTeams([]);
            }
        };
        loadTeams();
        return () => {
            mounted = false;
        };
    }, []);

    // Load employees for replacement selection
    useEffect(() => {
        let mounted = true;
        const loadEmployees = async () => {
            try {
                setLoading(true);

                // Fetch all employees across multiple pages
                const allEmployees = [];
                let pageIndex = 0;
                let hasNext = true;
                const pageSize = 100;

                while (hasNext && pageIndex < 50) {
                    try {
                        const response = await getAllEmployees({
                            page_index: pageIndex,
                            page_size: pageSize
                        });

                        if (response && response.data && Array.isArray(response.data)) {
                            allEmployees.push(...response.data);

                            const pagination = response.pagination || {};
                            hasNext = pagination.has_next === true || pagination.has_next === 'true';
                            pageIndex++;

                            if (!hasNext || allEmployees.length >= (pagination.total_items_count || 0)) {
                                break;
                            }
                        } else {
                            break;
                        }
                    } catch (pageError) {
                        console.error(`Error loading page ${pageIndex}:`, pageError);
                        break;
                    }
                }

                if (mounted) {
                    const currentId = formData.employee_id;
                    // debug: print current profile info
                    // eslint-disable-next-line no-console
                    console.debug('[SalesLeaveRequest] currentId=', currentId, 'profileSubRole=', profileSubRole);

                    const filtered = allEmployees.filter(emp => {
                        const empId = emp.id || emp.employee_id || emp.account_id;
                        const empSubRole = (emp.sub_role || emp.subRole || emp.role || '').toString();
                        const empAccountRole = (emp.account && (emp.account.role || emp.account?.role)) || '';
                        let reason = null;

                        // Exclude explicitly inactive employees
                        if (emp.is_active === false) reason = 'inactive';
                        if (!reason && emp.account && emp.account.is_active === false) reason = 'inactive';

                        // Exclude manager/admin accounts
                        const possibleRoles = [
                            emp.sub_role,
                            emp.role,
                            emp.subRole,
                            emp.account && emp.account.role,
                            emp.account && emp.account?.role
                        ].filter(Boolean).map(r => String(r).toLowerCase()).join(' ');
                        if (!reason && (possibleRoles.includes('manager') || possibleRoles.includes('admin'))) reason = 'is-manager';

                        // Exclude same as current user
                        if (!reason && empId === currentId) reason = 'same-as-current';

                        // Enforce same sub_role as requester when requester's sub_role is known
                        if (!reason && normalizedProfileSubRole) {
                            try {
                                const candidateSubRole = String(emp.sub_role || emp.subRole || emp.role || emp.account?.role || '').trim();
                                if (candidateSubRole) {
                                    const normalizedCandidate = candidateSubRole.toLowerCase();
                                    const dropPlural = (s) => s.replace(/s$/,'');
                                    const candNorm = dropPlural(normalizedCandidate);
                                    const profNorm = dropPlural(normalizedProfileSubRole);
                                    // Accept exact match, substring match, or plural-insensitive match
                                    if (!(candNorm === profNorm || candNorm.includes(profNorm) || profNorm.includes(candNorm))) {
                                        // fallback: allow permissive match for sale/sales variants or account.role containing 'sale'
                                        const accountRoleNorm = String(emp.account?.role || '').trim().toLowerCase();
                                        const containsSale = (s) => s && s.includes('sale');
                                        if (containsSale(profNorm) && (containsSale(candNorm) || containsSale(accountRoleNorm))) {
                                            // treat as match
                                        } else {
                                            reason = 'sub-role-mismatch';
                                        }
                                    }
                                }
                            } catch (err) {
                                // ignore parsing issues
                            }
                        }

                        // debug log each evaluated employee
                        // eslint-disable-next-line no-console
                        console.debug('[SalesLeaveRequest] evalEmp', { empId, empSubRole, empAccountRole, reason });

                        return !reason;
                    });
                    // debug: print accepted employees after filtering
                    // eslint-disable-next-line no-console
                    console.debug('[SalesLeaveRequest] acceptedEmployees', filtered.map(emp => ({
                        empId: emp.id || emp.employee_id || emp.account_id,
                        full_name: emp.full_name || emp.name || '',
                        sub_role: emp.sub_role || emp.subRole || emp.role || '',
                        account_role: emp.account?.role || ''
                    })));
                    setEmployees(filtered);
                }
            } catch (error) {
                console.error('Failed to load employees', error);
                if (mounted) {
                    setEmployees([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        loadEmployees();
        return () => {
            mounted = false;
        };
    }, [formData.employee_id]);

    useEffect(() => {
        if (formData.replacement_employee_id && employees.length > 0) {
            const selected = employees.find(emp => {
                const id = emp.id || emp.employee_id || emp.account_id;
                return id === formData.replacement_employee_id;
            });
            setSelectedReplacement(selected || null);
        } else {
            setSelectedReplacement(null);
        }
    }, [formData.replacement_employee_id, employees]);

    const handleInputChange = (field, value) => {
        // For leave_date we expect native date value (yyyy-mm-dd) from type="date" picker
        if (field === 'leave_date') {
            setFormData(prev => ({ ...prev, [field]: value }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validate dd/mm/yyyy strictly
    const isValidDDMMYYYY = (s) => {
        if (!s || typeof s !== 'string') return false;
        const parts = s.split('/');
        if (parts.length !== 3) return false;
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return false;
        if (y < 1900 || y > 2100) return false;
        if (m < 1 || m > 12) return false;
        const test = new Date(y, m - 1, d);
        return test.getFullYear() === y && test.getMonth() === (m - 1) && test.getDate() === d;
    };

    // Return true if date (ISO yyyy-mm-dd or dd/mm/yyyy) is at least n days after today
    const isAtLeastNDaysFromToday = (rawDate, n) => {
        if (!rawDate) return false;
        let parsedDate;
        try {
            if (rawDate.includes('-')) {
                parsedDate = new Date(rawDate);
            } else if (rawDate.includes('/')) {
                const parts = rawDate.split('/');
                if (parts.length !== 3) return false;
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                parsedDate = new Date(year, month, day);
            } else {
                return false;
            }
            if (Number.isNaN(parsedDate.getTime())) return false;
            // Normalize both dates to local date (midnight)
            const today = new Date();
            today.setHours(0,0,0,0);
            const minDate = new Date(today);
            minDate.setDate(minDate.getDate() + n);
            parsedDate.setHours(0,0,0,0);
            return parsedDate >= minDate;
        } catch (err) {
            return false;
        }
    };

    const validateDateOnBlur = () => {
        const raw = (formData.leave_date || '').trim();
        if (!raw) return true;
        // accept ISO or dd/mm/yyyy
        if (raw.includes('-')) {
            const dt = new Date(raw);
            if (Number.isNaN(dt.getTime())) {
                setSnackbar({ message: 'Ngày không hợp lệ. Vui lòng nhập theo dd/mm/yyyy hoặc chọn ngày.', severity: 'error' });
                return false;
            }
            // keep ISO (yyyy-mm-dd) for date input value
            const isoDate = dt.toISOString().split('T')[0];
            // enforce minimum 3 days ahead
            if (!isAtLeastNDaysFromToday(isoDate, 3)) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const min = new Date(today);
                min.setDate(min.getDate() + 3);
                const minStr = `${String(min.getDate()).padStart(2,'0')}/${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()}`;
                setSnackbar({ message: `Ngày nghỉ phải cách ngày hiện tại ít nhất 3 ngày. Vui lòng chọn từ ${minStr} trở đi.`, severity: 'error' });
                setDateError(`Ngày nghỉ phải từ ${minStr} trở đi`);
                return false;
            }
            setFormData(prev => ({ ...prev, leave_date: isoDate }));
            setDateError('');
            return true;
        }
        // If user typed 8 continuous digits like 29122025, format to dd/mm/yyyy
        if (/^\d{8}$/.test(raw)) {
            const d = raw.slice(0,2);
            const m = raw.slice(2,4);
            const y = raw.slice(4);
            const formatted = `${d}/${m}/${y}`;
            if (isValidDDMMYYYY(formatted)) {
                // convert dd/mm/yyyy to ISO yyyy-mm-dd for input value
                const yy = formatted.split('/')[2];
                const mm = formatted.split('/')[1];
                const dd = formatted.split('/')[0];
                const iso = `${yy}-${mm}-${dd}`;
                // enforce minimum 3 days ahead
                if (!isAtLeastNDaysFromToday(formatted, 3)) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const min = new Date(today);
                    min.setDate(min.getDate() + 3);
                    const minStr = `${String(min.getDate()).padStart(2,'0')}/${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()}`;
                    setSnackbar({ message: `Ngày nghỉ phải cách ngày hiện tại ít nhất 3 ngày. Vui lòng chọn từ ${minStr} trở đi.`, severity: 'error' });
                    setDateError(`Ngày nghỉ phải từ ${minStr} trở đi`);
                    return false;
                }
                setFormData(prev => ({ ...prev, leave_date: iso }));
                setDateError('');
                return true;
            } else {
                setSnackbar({ message: 'Ngày không hợp lệ. Vui lòng nhập theo dd/mm/yyyy (ví dụ: 23/12/2025).', severity: 'error' });
                return false;
            }
        }

        if (!isValidDDMMYYYY(raw)) {
            setSnackbar({ message: 'Ngày không hợp lệ. Vui lòng nhập theo dd/mm/yyyy (ví dụ: 23/12/2025).', severity: 'error' });
            return false;
        }
        // final check for dd/mm/yyyy formatted raw string
        if (!isAtLeastNDaysFromToday(raw, 3)) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const min = new Date(today);
            min.setDate(min.getDate() + 3);
            const minStr = `${String(min.getDate()).padStart(2,'0')}/${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()}`;
            setSnackbar({ message: `Ngày nghỉ phải cách ngày hiện tại ít nhất 3 ngày. Vui lòng chọn từ ${minStr} trở đi.`, severity: 'error' });
            setDateError(`Ngày nghỉ phải từ ${minStr} trở đi`);
            return false;
        }
        setDateError('');
        return true;
    };

    const handleSubmit = async () => {
        if (submitting) return; // prevent double submissions
        if (!formData.leave_date.trim()) {
            setSnackbar({ message: 'Vui lòng nhập ngày nghỉ', severity: 'error' });
            return;
        }
        if (!formData.reason.trim()) {
            setSnackbar({ message: 'Vui lòng nhập lý do nghỉ', severity: 'error' });
            return;
        }
        // leave_type is defaulted to 'ADVANCE' and not selectable by user

        setSubmitting(true);
        try {
            let leaveDateISO = '';
            try {
                const raw = formData.leave_date.trim();
                // Accept ISO (yyyy-mm-dd or full ISO) or dd/mm/yyyy
                if (raw.includes('-')) {
                    const parsedDate = new Date(raw);
                    if (Number.isNaN(parsedDate.getTime())) throw new Error('Invalid date');
                    parsedDate.setHours(12, 0, 0, 0);
                    leaveDateISO = parsedDate.toISOString();
                } else {
                    const dateParts = raw.split('/');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10) - 1;
                    const year = parseInt(dateParts[2], 10);
                    const parsedDate = new Date(year, month, day);
                        if (Number.isNaN(parsedDate.getTime())) throw new Error('Invalid date');
                    parsedDate.setHours(12, 0, 0, 0);
                    leaveDateISO = parsedDate.toISOString();
                } else {
                    throw new Error('Invalid date format');
                    }
                }
                // enforce minimum 3 days ahead (use local date comparison)
                if (!isAtLeastNDaysFromToday(formData.leave_date, 3)) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const min = new Date(today);
                    min.setDate(min.getDate() + 3);
                    const minStr = `${String(min.getDate()).padStart(2,'0')}/${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()}`;
                    setSnackbar({ message: `Ngày nghỉ phải cách ngày hiện tại ít nhất 3 ngày. Vui lòng chọn từ ${minStr} trở đi.`, severity: 'error' });
                    setSubmitting(false);
                    return;
                }
            } catch (error) {
                setSnackbar({ message: 'Vui lòng nhập ngày nghỉ đúng định dạng dd/mm/yyyy hoặc chọn ngày', severity: 'error' });
                setSubmitting(false);
                return;
            }

            const requestData = {
                employee_id: formData.employee_id,
                replacement_employee_id: formData.replacement_employee_id || null,
                leave_date: leaveDateISO,
                reason: formData.reason.trim(),
                leave_type: formData.leave_type.trim()
            };
            // Prevent accidental duplicate submissions from UI (same payload in progress)
            let didSetGlobalFlag = false;
            try {
                const payloadKey = JSON.stringify(requestData);
                if (window._leaveRequestInProgress && window._lastLeaveRequestKey === payloadKey) {
                    // duplicate attempt while previous identical request still in progress
                    setAlertProps({
                        title: 'Đang gửi đơn',
                        message: 'Đơn này đang được gửi. Vui lòng chờ trong giây lát.',
                        type: 'info',
                        okText: 'Đóng'
                    });
                    setAlertOpen(true);
                    setSubmitting(false);
                    return;
                } else {
                    window._leaveRequestInProgress = true;
                    window._lastLeaveRequestKey = payloadKey;
                    didSetGlobalFlag = true;
                    // debug log to help trace duplicate submissions in Network/Console
                    // eslint-disable-next-line no-console
                    console.debug('[leave-request] sending', requestData);
            await createLeaveRequest(requestData);
                }
            } finally {
                // Only clear the global-in-progress flag if THIS invocation set it.
                if (didSetGlobalFlag) {
                    window._leaveRequestInProgress = false;
                }
            }

            // Show success modal
            setAlertProps({
                title: 'Gửi đơn thành công',
                message: 'Đã gửi đơn xin nghỉ phép. Vui lòng chờ phê duyệt.',
                type: 'success',
                okText: 'Đóng'
            });
            setAlertOpen(true);

            // Reset form (leave_type stays ADVANCE)
            setFormData({
                employee_id: profile?.id || profile?.employee_id || profile?.account_id || '',
                leave_date: '',
                leave_type: 'ADVANCE',
                replacement_employee_id: '',
                team_ids: [],
                reason: ''
            });
            setSelectedReplacement(null);
        } catch (error) {
            console.error('Failed to submit leave request:', error);
            // Prefer server-provided message when available
            const serverMessage = error.response?.data?.message || error.response?.data || error.message || 'Không thể gửi đơn xin nghỉ phép';
            setAlertProps({
                title: 'Lỗi khi gửi đơn',
                message: String(serverMessage),
                type: 'error',
                okText: 'Đóng'
            });
            setAlertOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ErrorBoundary>
        <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
            <Box sx={{ width: '100%', px: { xs: 2, md: 6, lg: 8, xl: 10 } }}>
                {/* Back button outside the document card */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBack sx={{ fontSize: 24 }} />}
                        onClick={() => navigate('/sales/leave-requests')}
                        variant="contained"
                        sx={{
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            px: 3,
                            py: 1.25,
                            borderRadius: 3,
                            textTransform: 'none',
                            bgcolor: COLORS.PRIMARY[600],
                            color: 'white',
                            minHeight: 48,
                            boxShadow: `0 6px 18px ${alpha(COLORS.PRIMARY[300], 0.2)}`,
                            '&:hover': {
                                bgcolor: COLORS.PRIMARY[700]
                            }
                        }}
                    >
                        Quay lại
                    </Button>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: '#fff',
                        boxShadow: '0 14px 40px -12px rgba(2,6,23,0.25)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        width: '100%',
                        borderRadius: 6,
                        '@media print': {
                            boxShadow: 'none',
                            border: '1px solid #000',
                            bgcolor: '#fff'
                        }
                    }}
                >
                    <Box sx={{ px: { xs: 3, md: 6 }, pb: 4 }}>
                        {/* removed inner back button (moved outside paper) */}
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PageTitle title="ĐƠN XIN NGHỈ PHÉP" subtitle="" center={true} />
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <Box>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            mb: 3,
                                            pb: 1,
                                            borderBottom: '2px solid #9ca3af',
                                            color: '#000',
                                            fontSize: '1.5rem',
                                            fontFamily: 'Times, serif'
                                        }}
                                    >
                                        I. THÔNG TIN NGƯỜI LÀM ĐƠN
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    width: '180px',
                                                    fontSize: '1.25rem',
                                                    color: '#000',
                                                    fontFamily: 'Times, serif',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Họ và tên nhân viên:
                                            </Typography>
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    borderBottom: '1px dotted #9ca3af',
                                                    pb: 0.5,
                                                    minHeight: '1.5rem'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif'
                                                    }}
                                                >
                                                    {profile?.full_name || profile?.name || ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        width: '80px',
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif'
                                                    }}
                                                >
                                                    Email:
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        borderBottom: '1px dotted #9ca3af',
                                                        pb: 0.5,
                                                        minHeight: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: '1.25rem',
                                                            color: '#000',
                                                            fontFamily: 'Times, serif'
                                                        }}
                                                    >
                                                        {profile?.email || ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        width: '140px',
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    Số điện thoại:
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        borderBottom: '1px dotted #9ca3af',
                                                        pb: 0.5,
                                                        minHeight: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: '1.25rem',
                                                            color: '#000',
                                                            fontFamily: 'Times, serif'
                                                        }}
                                                    >
                                                        {profile?.phone || profile?.phone_number || ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            mb: 3,
                                            pb: 1,
                                            borderBottom: '2px solid #9ca3af',
                                            color: '#000',
                                            fontSize: '1.5rem',
                                            fontFamily: 'Times, serif'
                                        }}
                                    >
                                        II. THÔNG TIN NGHỈ PHÉP
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    width: '160px',
                                                    fontSize: '1.25rem',
                                                    color: '#000',
                                                    fontFamily: 'Times, serif'
                                                }}
                                            >
                                                Ngày nghỉ:
                                            </Typography>
                                            <TextField
                                                variant="standard"
                                                type="date"
                                                value={formData.leave_date || ''}
                                                onChange={(e) => handleInputChange('leave_date', e.target.value)}
                                                onBlur={() => validateDateOnBlur()}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    disableUnderline: true,
                                                    sx: {
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        '& input': {
                                                            padding: 0,
                                                            pb: 0.5
                                                        }
                                                    }
                                                }}
                                                sx={{
                                                    flex: 1,
                                                    borderBottom: '1px dotted #9ca3af',
                                                    '& .MuiInputBase-root': {
                                                        minHeight: '1.5rem'
                                                    },
                                                    '& input[type="date"]': {
                                                        py: 0.5
                                                    }
                                                }}
                                            />
                                            {dateError && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0 }}>
                                                    {dateError}
                                                </Typography>
                                            )}
                                        </Box>
                                        {/* Loại nghỉ phép: mặc định ADVANCE (Nghỉ trước) — không hiển thị lựa chọn cho user */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    width: '160px',
                                                    fontSize: '1.25rem',
                                                    color: '#000',
                                                    fontFamily: 'Times, serif',
                                                    pt: 0.5
                                                }}
                                            >
                                                Nhóm:
                                            </Typography>
                                            <FormControl
                                                variant="standard"
                                                sx={{
                                                    flex: 1,
                                                    borderBottom: '1px dotted #9ca3af',
                                                    '& .MuiInput-underline:before': {
                                                        borderBottom: 'none'
                                                    },
                                                    '& .MuiInput-underline:hover:before': {
                                                        borderBottom: 'none'
                                                    },
                                                    '& .MuiInput-underline:after': {
                                                        borderBottom: 'none'
                                                    }
                                                }}
                                            >
                                                <Select
                                                    multiple
                                                    value={formData.team_ids}
                                                    onChange={(e) => handleInputChange('team_ids', e.target.value)}
                                                    displayEmpty
                                                    disableUnderline
                                                    renderValue={(selected) => {
                                                        if (selected.length === 0) {
                                                            return <em style={{ color: '#9ca3af' }}>Chọn nhóm</em>;
                                                        }
                                                        const selectedTeams = selected
                                                            .map((teamId) => {
                                                                const team = teams.find(t => t.id === teamId);
                                                                return team ? team.name : null;
                                                            })
                                                            .filter(Boolean);
                                                        return (
                                                            <Typography
                                                                component="span"
                                                                sx={{
                                                                    fontSize: '1.25rem',
                                                                    color: '#000',
                                                                    fontFamily: 'Times, serif',
                                                                    whiteSpace: 'normal',
                                                                    wordBreak: 'break-word'
                                                                }}
                                                            >
                                                                {selectedTeams.join(', ')}
                                                            </Typography>
                                                        );
                                                    }}
                                                    sx={{
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        '& .MuiSelect-select': {
                                                            padding: 0,
                                                            pb: 0.5,
                                                            minHeight: '1.5rem'
                                                        },
                                                        '&:before': {
                                                            borderBottom: 'none'
                                                        },
                                                        '&:after': {
                                                            borderBottom: 'none'
                                                        }
                                                    }}
                                                >
                                                    {teams.map((team) => (
                                                        <MenuItem key={team.id} value={team.id}>
                                                            {team.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    width: '180px',
                                                    fontSize: '1.25rem',
                                                    color: '#000',
                                                    fontFamily: 'Times, serif',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Nhân viên thay thế:
                                            </Typography>
                                            <FormControl
                                                variant="standard"
                                                sx={{
                                                    flex: 1,
                                                    borderBottom: '1px dotted #9ca3af',
                                                    '& .MuiInput-underline:before': {
                                                        borderBottom: 'none'
                                                    },
                                                    '& .MuiInput-underline:hover:before': {
                                                        borderBottom: 'none'
                                                    },
                                                    '& .MuiInput-underline:after': {
                                                        borderBottom: 'none'
                                                    }
                                                }}
                                            >
                                                <Select
                                                    value={formData.replacement_employee_id}
                                                    onChange={(e) => {
                                                        const empId = e.target.value;
                                                        handleInputChange('replacement_employee_id', empId);
                                                    }}
                                                    displayEmpty
                                                    disableUnderline
                                                    sx={{
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        '& .MuiSelect-select': {
                                                            padding: 0,
                                                            pb: 0.5,
                                                            minHeight: '1.5rem'
                                                        },
                                                        '&:before': {
                                                            borderBottom: 'none'
                                                        },
                                                        '&:after': {
                                                            borderBottom: 'none'
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="">
                                                        <em style={{ color: '#9ca3af' }}>Chọn nhân viên thay thế</em>
                                                    </MenuItem>
                                                    {employees.map((employee) => {
                                                        const empId = employee.id || employee.employee_id || employee.account_id;
                                                        return (
                                                            <MenuItem key={empId} value={empId}>
                                                                {employee.full_name || employee.name}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mt: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        minWidth: '220px',
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    Email nhân viên thay thế:
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        borderBottom: '1px dotted #9ca3af',
                                                        pb: 0.5,
                                                        minHeight: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: '1.25rem',
                                                            color: '#000',
                                                            fontFamily: 'Times, serif'
                                                        }}
                                                    >
                                                        {selectedReplacement ? (selectedReplacement.email || selectedReplacement.email_address || '') : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        minWidth: '220px',
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    SĐT nhân viên thay thế:
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        borderBottom: '1px dotted #9ca3af',
                                                        pb: 0.5,
                                                        minHeight: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: '1.25rem',
                                                            color: '#000',
                                                            fontFamily: 'Times, serif'
                                                        }}
                                                    >
                                                        {selectedReplacement ? (selectedReplacement.phone || selectedReplacement.phone_number || selectedReplacement.mobile || '') : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    mb: 1,
                                                    fontSize: '1.25rem',
                                                    color: '#000',
                                                    fontFamily: 'Times, serif'
                                                }}
                                            >
                                                Lý do nghỉ phép:
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                value={formData.reason}
                                                onChange={(e) => handleInputChange('reason', e.target.value)}
                                                placeholder="Nhập lý do nghỉ phép..."
                                                variant="standard"
                                                InputProps={{
                                                    disableUnderline: true,
                                                    sx: {
                                                        fontSize: '1.25rem',
                                                        color: '#000',
                                                        fontFamily: 'Times, serif',
                                                        lineHeight: 1.8,
                                                        '& textarea': {
                                                            padding: 0
                                                        }
                                                    }
                                                }}
                                                sx={{
                                                    border: '1px solid #d1d5db',
                                                    p: 2,
                                                    minHeight: 120,
                                                    bgcolor: '#fff',
                                                    '& .MuiInputBase-root': {
                                                        minHeight: 120
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 6, pt: 6, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <Typography
                                sx={{
                                    mb: 4,
                                    fontSize: '1.25rem',
                                    lineHeight: 1.8,
                                    color: '#000',
                                    fontFamily: 'Times, serif',
                                    fontStyle: 'italic'
                                }}
                            >
                                Tôi cam kết sẽ sắp xếp và bàn giao công việc cho nhân viên thay thế trước khi nghỉ phép, đảm bảo công việc được tiếp tục thực hiện trong thời gian tôi vắng mặt.
                            </Typography>
                            <Typography
                                sx={{
                                    mb: 6,
                                    fontSize: '1.25rem',
                                    lineHeight: 1.8,
                                    color: '#000',
                                    fontFamily: 'Times, serif'
                                }}
                            >
                                Rất mong được Trưởng nhóm và Quản lý xem xét và chấp thuận đơn xin nghỉ phép này.
                            </Typography>

                            <Box sx={{ textAlign: 'right', pt: 8, pr: 4 }}>
                                <Typography sx={{ mb: 3, fontSize: '1.125rem', fontWeight: 600, color: '#111' }}>
                                    Người làm đơn
                                </Typography>
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>
                                    {profile?.full_name || profile?.name || ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2,
                        mt: 3,
                        '@media print': {
                            display: 'none'
                        }
                    }}
                >
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                            setFormData({
                                employee_id: profile?.id || profile?.employee_id || profile?.account_id || '',
                                leave_date: '',
                                leave_type: '',
                                replacement_employee_id: '',
                                team_ids: [],
                                reason: ''
                            });
                            setSelectedReplacement(null);
                        }}
                        disabled={submitting}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem',
                            minWidth: 150,
                            bgcolor: COLORS.ERROR[500],
                            color: COLORS.COMMON.WHITE,
                            boxShadow: `
                                0 4px 12px ${alpha(COLORS.ERROR[300], 0.3)},
                                0 2px 4px ${alpha(COLORS.ERROR[200], 0.2)}
                            `,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                bgcolor: COLORS.ERROR[600],
                                transform: 'translateY(-2px)',
                                boxShadow: `
                                    0 6px 16px ${alpha(COLORS.ERROR[400], 0.4)},
                                    0 3px 8px ${alpha(COLORS.ERROR[300], 0.3)}
                                `
                            },
                            '&:disabled': {
                                bgcolor: COLORS.GRAY[400],
                                color: COLORS.GRAY[500],
                                opacity: 0.7,
                                cursor: 'not-allowed'
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        onClick={() => handleSubmit()}
                        disabled={submitting || !formData.leave_date.trim() || !formData.reason.trim() || !!dateError}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            px: 4,
                            py: 1.5,
                            fontWeight: 800,
                            fontSize: '1rem',
                            minWidth: 150,
                            bgcolor: COLORS.PRIMARY[500],
                            color: COLORS.COMMON.WHITE,
                            boxShadow: `0 8px 30px ${alpha(COLORS.PRIMARY[300], 0.12)}`,
                            transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                bgcolor: COLORS.PRIMARY[600],
                                transform: 'translateY(-3px)',
                            },
                            '&:disabled': {
                                bgcolor: COLORS.GRAY[400],
                                color: COLORS.GRAY[500],
                                opacity: 0.7,
                                cursor: 'not-allowed'
                            }
                        }}
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi đơn'}
                    </Button>

                <AlertModal
                    isOpen={alertOpen}
                    onClose={() => {
                        setAlertOpen(false);
                        // After successful submission, navigate back to leave requests list
                        if (alertProps.type === 'success') {
                            navigate('/sales/leave-requests');
                        }
                    }}
                    title={alertProps.title}
                    message={alertProps.message}
                    type={alertProps.type}
                    okText={alertProps.okText || 'OK'}
                />
            </Box>

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
            </Box>
        </Box>
        </ErrorBoundary>
    );
};

export default SalesLeaveRequestPage;
