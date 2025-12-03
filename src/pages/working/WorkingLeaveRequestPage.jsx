import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Snackbar, Alert, FormControl, Select } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Send } from '@mui/icons-material';
import workingStaffApi from '../../api/workingStaffApi';
import { createLeaveRequest } from '../../api/leaveRequestApi';
import { getAllEmployees } from '../../api/employeeApi';
import COLORS from '../../constants/colors';

const LEAVE_TYPE_OPTIONS = [
    { value: 'PERSONAL', label: 'Nghỉ phép cá nhân' },
    { value: 'SICK', label: 'Nghỉ ốm' },
    { value: 'ANNUAL', label: 'Nghỉ phép năm' },
    { value: 'EMERGENCY', label: 'Nghỉ khẩn cấp' },
    { value: 'OTHER', label: 'Khác' }
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

const WorkingLeaveRequestPage = () => {
    const profile = workingStaffApi.getProfile();
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

    const [formData, setFormData] = useState({
        employee_id: profile?.id || profile?.employee_id || profile?.account_id || '',
        leave_date: '',
        leave_type: '',
        replacement_employee_id: '',
        team_ids: [],
        reason: ''
    });

    const [selectedReplacement, setSelectedReplacement] = useState(null);

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
                    const filtered = allEmployees.filter(emp => {
                        const empId = emp.id || emp.employee_id || emp.account_id;
                        const currentId = formData.employee_id;
                        return empId !== currentId;
                    });
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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.leave_date.trim()) {
            setSnackbar({ message: 'Vui lòng nhập ngày nghỉ', severity: 'error' });
            return;
        }
        if (!formData.reason.trim()) {
            setSnackbar({ message: 'Vui lòng nhập lý do nghỉ', severity: 'error' });
            return;
        }
        if (!formData.leave_type.trim()) {
            setSnackbar({ message: 'Vui lòng nhập loại nghỉ phép', severity: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            let leaveDateISO = '';
            try {
                const dateParts = formData.leave_date.trim().split('/');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10) - 1;
                    const year = parseInt(dateParts[2], 10);
                    const parsedDate = new Date(year, month, day);
                    parsedDate.setHours(12, 0, 0, 0);
                    leaveDateISO = parsedDate.toISOString();
                } else {
                    throw new Error('Invalid date format');
                }
            } catch (error) {
                setSnackbar({ message: 'Vui lòng nhập ngày nghỉ đúng định dạng dd/mm/yyyy', severity: 'error' });
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

            await createLeaveRequest(requestData);
            setSnackbar({
                message: 'Gửi đơn xin nghỉ phép thành công',
                severity: 'success'
            });

            setFormData({
                employee_id: profile?.id || profile?.employee_id || profile?.account_id || '',
                leave_date: '',
                leave_type: '',
                replacement_employee_id: '',
                team_ids: [],
                reason: ''
            });
            setSelectedReplacement(null);
        } catch (error) {
            console.error('Failed to submit leave request:', error);
            setSnackbar({
                message: error.message || 'Không thể gửi đơn xin nghỉ phép',
                severity: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
            <Box sx={{ width: '100%', px: { xs: 2, md: 6, lg: 8, xl: 10 } }}>
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #d1d5db',
                        width: '100%',
                        fontFamily: 'Times, serif',
                        '@media print': {
                            boxShadow: 'none',
                            border: '1px solid #000',
                            bgcolor: '#fff'
                        }
                    }}
                >
                    <Box sx={{ px: { xs: 3, md: 6 }, pb: 4 }}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 3,
                                    color: '#000',
                                    fontSize: '3rem',
                                    fontFamily: 'Times, serif'
                                }}
                            >
                                ĐƠN XIN NGHỈ PHÉP
                            </Typography>
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
                                                value={formData.leave_date}
                                                onChange={(e) => handleInputChange('leave_date', e.target.value)}
                                                placeholder="dd/mm/yyyy"
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
                                                    }
                                                }}
                                            />
                                        </Box>
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
                                                Loại nghỉ phép:
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
                                                    value={formData.leave_type}
                                                    onChange={(e) => handleInputChange('leave_type', e.target.value)}
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
                                                        <em style={{ color: '#9ca3af' }}>Chọn loại nghỉ phép</em>
                                                    </MenuItem>
                                                    {LEAVE_TYPE_OPTIONS.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
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

                        <Box sx={{ mt: 6, pt: 6, borderTop: '1px solid #d1d5db' }}>
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
                                <Typography
                                    sx={{
                                        mb: 3,
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: '#000',
                                        fontFamily: 'Times, serif'
                                    }}
                                >
                                    Người làm đơn
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: '#000',
                                        fontFamily: 'Times, serif'
                                    }}
                                >
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
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        onClick={handleSubmit}
                        disabled={submitting || !formData.leave_date.trim() || !formData.reason.trim() || !formData.leave_type.trim()}
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
                            border: `1px solid ${alpha(COLORS.PRIMARY[400], 0.3)}`,
                            boxShadow: `
                                0 4px 12px ${alpha(COLORS.PRIMARY[300], 0.3)}, 
                                0 2px 4px ${alpha(COLORS.PRIMARY[200], 0.2)}
                            `,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                bgcolor: COLORS.PRIMARY[600],
                                transform: 'translateY(-2px)',
                                boxShadow: `
                                    0 6px 16px ${alpha(COLORS.PRIMARY[400], 0.4)}, 
                                    0 3px 8px ${alpha(COLORS.PRIMARY[300], 0.3)}
                                `
                            },
                            '&:disabled': {
                                bgcolor: COLORS.GRAY[400],
                                color: COLORS.GRAY[500],
                                border: `1px solid ${alpha(COLORS.GRAY[300], 0.3)}`,
                                boxShadow: `0 1px 2px ${alpha(COLORS.GRAY[200], 0.2)}`,
                                transform: 'none',
                                cursor: 'not-allowed',
                                opacity: 0.7
                            }
                        }}
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi đơn'}
                    </Button>
                </Box>
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
    );
};

export default WorkingLeaveRequestPage;