import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Button, Avatar, Grid, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AddStaffModal from '../../components/modals/AddStaffModal';
import AlertModal from '../../components/modals/AlertModal';
import { Edit, Delete, People, PersonAdd, Person, EventBusy, Schedule, Add, Close, AccessTime } from '@mui/icons-material';
import { managerApi } from '../../api/userApi';
import workshiftApi from '../../api/workshiftApi';

const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salary);
};

const roleLabel = (r) => {
    switch (r) {
        case 'sales_staff': return 'Sale staff';
        case 'working_staff': return 'Working staff';
        default: return r;
    }
};

const roleColor = (r) => {
    switch (r) {
        case 'sales_staff': return { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] };
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

    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState('');

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Work Shifts states
    const [shifts, setShifts] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [openShiftDialog, setOpenShiftDialog] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [shiftFormData, setShiftFormData] = useState({
        name: '',
        start_time: '',
        end_time: '',
        description: ''
    });

    // Staff assignment states
    const [openStaffDialog, setOpenStaffDialog] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [shiftStaff, setShiftStaff] = useState([]);
    const [loadingShiftStaff, setLoadingShiftStaff] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState([]); // Nhân viên đang chờ assign
    const [pendingRemovals, setPendingRemovals] = useState([]); // Nhân viên đang chờ remove
    const [staffShiftsMap, setStaffShiftsMap] = useState({}); // Map staff ID -> các shifts đã assign

    // Load staff data from API
    useEffect(() => {
        const loadStaff = async () => {
            try {
                setIsLoading(true);
                setError('');
                const response = await managerApi.getStaff();
                if (response.success) {
                    setStaff(response.data);
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
                setIsLoading(false);
            }
        };
        loadStaff();
    }, []);

    // Load work shifts
    const loadShifts = async () => {
        try {
            setLoadingShifts(true);
            const response = await workshiftApi.getAllShifts();
            if (response.success) {
                setShifts(response.data);
            }
        } catch (error) {
            console.error('Error loading shifts:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc',
                type: 'error'
            });
        } finally {
            setLoadingShifts(false);
        }
    };

    // Load shifts when switching to shifts tab
    useEffect(() => {
        if (currentTab === 1) {
            loadShiftsWithStaffCount();
        }
    }, [currentTab]);

    // Load shifts with staff count
    const loadShiftsWithStaffCount = async () => {
        try {
            setLoadingShifts(true);
            const response = await workshiftApi.getAllShifts();
            if (response.success) {
                // Get staff count for each shift
                const shiftsWithStaffCount = await Promise.all(
                    response.data.map(async (shift) => {
                        const staffResponse = await workshiftApi.getShiftStaff(shift.id);
                        return {
                            ...shift,
                            staffCount: staffResponse.success ? staffResponse.data.total : 0
                        };
                    })
                );
                setShifts(shiftsWithStaffCount);
            }
        } catch (error) {
            console.error('Error loading shifts:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc',
                type: 'error'
            });
        } finally {
            setLoadingShifts(false);
        }
    };

    const filtered = useMemo(() => {
        return staff.filter(s => {
            if (filterRole !== 'all' && s.role !== filterRole) return false;
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            const text = `${s.full_name} ${s.email} ${s.phone}`.toLowerCase();
            return text.includes(q.toLowerCase());
        });
    }, [staff, q, filterRole, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: staff.length,
            saleStaff: staff.filter(s => s.role === 'sales_staff').length,
            workingStaff: staff.filter(s => s.role === 'working_staff').length,
            active: staff.filter(s => s.status === 'active').length,
            onLeave: staff.filter(s => s.status === 'on_leave').length
        };
    }, [staff]);

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentPageStaff = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [page, itemsPerPage, filtered]);

    // Handle shift dialog open/close
    const handleOpenShiftDialog = (shift = null) => {
        if (shift) {
            setEditingShift(shift);
            setShiftFormData({
                name: shift.name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                description: shift.description || ''
            });
        } else {
            setEditingShift(null);
            setShiftFormData({
                name: '',
                start_time: '',
                end_time: '',
                description: ''
            });
        }
        setOpenShiftDialog(true);
    };

    const handleCloseShiftDialog = () => {
        setOpenShiftDialog(false);
        setEditingShift(null);
    };

    // Handle shift save
    const handleSaveShift = async () => {
        try {
            if (!shiftFormData.name || !shiftFormData.start_time || !shiftFormData.end_time) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: 'Vui lòng điền đầy đủ thông tin!',
                    type: 'error'
                });
                return;
            }

            let response;
            if (editingShift) {
                response = await workshiftApi.updateShift(editingShift.id, shiftFormData);
            } else {
                response = await workshiftApi.createShift(shiftFormData);
            }

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editingShift ? 'Cập nhật ca làm việc thành công!' : 'Tạo ca làm việc mới thành công!',
                    type: 'success'
                });
                await loadShiftsWithStaffCount();
                handleCloseShiftDialog();
            }
        } catch (error) {
            console.error('Error saving shift:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu ca làm việc',
                type: 'error'
            });
        }
    };

    // Handle shift delete
    const handleDeleteShift = async (shiftId) => {
        if (window.confirm('Bạn có chắc muốn xóa ca làm việc này?')) {
            try {
                const response = await workshiftApi.deleteShift(shiftId);
                if (response.success) {
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Xóa ca làm việc thành công!',
                        type: 'success'
                    });
                    await loadShiftsWithStaffCount();
                }
            } catch (error) {
                console.error('Error deleting shift:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể xóa ca làm việc',
                    type: 'error'
                });
            }
        }
    };

    // Check if two time ranges overlap
    const checkTimeOverlap = (start1, end1, start2, end2) => {
        const [h1Start, m1Start] = start1.split(':').map(Number);
        const [h1End, m1End] = end1.split(':').map(Number);
        const [h2Start, m2Start] = start2.split(':').map(Number);
        const [h2End, m2End] = end2.split(':').map(Number);

        let minutes1Start = h1Start * 60 + m1Start;
        let minutes1End = h1End * 60 + m1End;
        let minutes2Start = h2Start * 60 + m2Start;
        let minutes2End = h2End * 60 + m2End;

        // Handle overnight shifts
        if (minutes1End <= minutes1Start) minutes1End += 24 * 60;
        if (minutes2End <= minutes2Start) minutes2End += 24 * 60;

        // Check overlap
        return minutes1Start < minutes2End && minutes1End > minutes2Start;
    };

    // Handle manage staff dialog
    const handleOpenStaffDialog = async (shift) => {
        setSelectedShift(shift);
        setOpenStaffDialog(true);

        // Reset pending states
        setPendingAssignments([]);
        setPendingRemovals([]);

        try {
            setLoadingShiftStaff(true);

            // Load assigned staff for this shift
            const response = await workshiftApi.getShiftStaff(shift.id);
            if (response.success) {
                const staffIds = response.data.staff_ids;
                const assignedStaff = staff.filter(s => staffIds.includes(s.id));
                setShiftStaff(assignedStaff);
            }

            // Load all shifts for all staff to check conflicts
            const staffShiftsPromises = staff.map(async (s) => {
                try {
                    const shiftsResponse = await workshiftApi.getStaffShifts(s.id);
                    return {
                        staffId: s.id,
                        shifts: shiftsResponse.success ? shiftsResponse.data.shifts : []
                    };
                } catch (error) {
                    console.error(`Error loading shifts for staff ${s.id}:`, error);
                    return { staffId: s.id, shifts: [] };
                }
            });

            const staffShiftsData = await Promise.all(staffShiftsPromises);
            const newStaffShiftsMap = {};
            staffShiftsData.forEach(data => {
                newStaffShiftsMap[data.staffId] = data.shifts;
            });
            setStaffShiftsMap(newStaffShiftsMap);

        } catch (error) {
            console.error('Error loading shift staff:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách nhân viên',
                type: 'error'
            });
        } finally {
            setLoadingShiftStaff(false);
        }
    };

    const handleCloseStaffDialog = async () => {
        // Bulk assign/remove khi đóng dialog
        if (pendingAssignments.length > 0 || pendingRemovals.length > 0) {
            try {
                const assignPromises = pendingAssignments.map(staffId =>
                    workshiftApi.assignStaffToShift(selectedShift.id, staffId)
                );
                const removePromises = pendingRemovals.map(staffId =>
                    workshiftApi.removeStaffFromShift(selectedShift.id, staffId)
                );

                await Promise.all([...assignPromises, ...removePromises]);

                const totalChanges = pendingAssignments.length + pendingRemovals.length;
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: `Đã cập nhật phân công ${totalChanges} nhân viên thành công!`,
                    type: 'success'
                });

                // Reload shifts to update staff count
                await loadShiftsWithStaffCount();
            } catch (error) {
                console.error('Error saving staff assignments:', error);
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: error.message || 'Không thể lưu phân công nhân viên',
                    type: 'error'
                });
            }
        }

        // Reset states
        setOpenStaffDialog(false);
        setSelectedShift(null);
        setShiftStaff([]);
        setPendingAssignments([]);
        setPendingRemovals([]);
    };

    // Handle assign staff (chỉ thêm vào pending, không gọi API ngay)
    const handleAssignStaff = (staffId) => {
        if (!selectedShift) return;

        // Check time conflict
        const staffShifts = staffShiftsMap[staffId] || [];
        const conflictShift = staffShifts.find(shift =>
            shift.id !== selectedShift.id &&
            checkTimeOverlap(
                selectedShift.start_time,
                selectedShift.end_time,
                shift.start_time,
                shift.end_time
            )
        );

        if (conflictShift) {
            setAlert({
                open: true,
                title: 'Xung đột ca làm việc',
                message: `Nhân viên đã có ca "${conflictShift.name}" (${conflictShift.start_time} - ${conflictShift.end_time}) trùng với ca này!`,
                type: 'warning'
            });
            return;
        }

        // Thêm vào pending assignments
        setPendingAssignments(prev => [...prev, staffId]);

        // Thêm vào shiftStaff để hiển thị UI
        const staffToAdd = staff.find(s => s.id === staffId);
        if (staffToAdd) {
            setShiftStaff(prev => [...prev, staffToAdd]);
        }

        // Nếu staff đang trong pending removals, xóa khỏi đó
        setPendingRemovals(prev => prev.filter(id => id !== staffId));
    };

    // Handle remove staff (chỉ thêm vào pending hoặc xóa khỏi pending assign)
    const handleRemoveStaff = (staffId) => {
        if (!selectedShift) return;

        // Xóa khỏi shiftStaff để cập nhật UI
        setShiftStaff(prev => prev.filter(s => s.id !== staffId));

        // Nếu staff đang trong pending assignments, chỉ xóa khỏi đó
        if (pendingAssignments.includes(staffId)) {
            setPendingAssignments(prev => prev.filter(id => id !== staffId));
        } else {
            // Nếu không, thêm vào pending removals (staff đã được assign trước đó)
            setPendingRemovals(prev => [...prev, staffId]);
        }

        // Xóa khỏi pending assignments nếu có
        setPendingAssignments(prev => prev.filter(id => id !== staffId));
    };

    // Handle submit staff (add/edit)
    const handleSubmitStaff = async (staffData) => {
        try {
            setIsSubmitting(true);

            if (editMode) {
                // Update existing staff
                const response = await managerApi.updateStaff(selectedStaff.id, {
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    role: staffData.role,
                    avatar_url: staffData.avatar_url || selectedStaff.avatar_url || ''
                });

                if (response.success) {
                    // Update local state
                    setStaff(prev => prev.map(s =>
                        s.id === selectedStaff.id ? response.data : s
                    ));

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Cập nhật thông tin nhân viên thành công!',
                        type: 'success'
                    });
                }
            } else {
                // Add new staff
                const response = await managerApi.createStaff({
                    full_name: staffData.full_name,
                    email: staffData.email,
                    phone: staffData.phone,
                    address: staffData.address,
                    salary: parseFloat(staffData.salary),
                    role: staffData.role,
                    avatar_url: staffData.avatar_url || '',
                    password: staffData.password
                });

                if (response.success) {
                    // Add to local state
                    setStaff(prev => [...prev, response.data]);

                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Thêm nhân viên mới thành công!',
                        type: 'success'
                    });
                }
            }

            // Close modal
            setAddStaffModalOpen(false);
            setSelectedStaff(null);
            setEditMode(false);
        } catch (error) {
            console.error('Error submitting staff:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin nhân viên',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
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
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600], mb: 3 }}>Quản lý nhân viên</Typography>

                {/* Tabs */}
                <Paper sx={{ mb: 3, borderRadius: 2 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem'
                            }
                        }}
                    >
                        <Tab
                            icon={<People />}
                            iconPosition="start"
                            label="Danh sách nhân viên"
                        />
                        <Tab
                            icon={<Schedule />}
                            iconPosition="start"
                            label="Ca làm việc"
                        />
                    </Tabs>
                </Paper>

                {/* Tab 0: Danh sách nhân viên */}
                {currentTab === 0 && (
                    <>
                        {/* Status Badges */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[100], 0.6)} 100%)`,
                                        border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.3)}`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <People sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                            {stats.total}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.PRIMARY[600], fontWeight: 600 }}>
                                            Tổng nhân viên
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={6} sm={6} md={2.4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.8)} 0%, ${alpha(COLORS.INFO[100], 0.6)} 100%)`,
                                        border: `2px solid ${alpha(COLORS.INFO[300], 0.3)}`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(COLORS.INFO[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <PersonAdd sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                            {stats.saleStaff}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.INFO[600], fontWeight: 600 }}>
                                            Sale Staff
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={6} sm={6} md={2.4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.8)} 0%, ${alpha(COLORS.WARNING[100], 0.6)} 100%)`,
                                        border: `2px solid ${alpha(COLORS.WARNING[300], 0.3)}`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(COLORS.WARNING[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: `linear-gradient(135deg, ${COLORS.WARNING[400]} 0%, ${COLORS.WARNING[600]} 100%)`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Person sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                            {stats.workingStaff}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.WARNING[600], fontWeight: 600 }}>
                                            Working Staff
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={6} sm={6} md={2.4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.8)} 0%, ${alpha(COLORS.SUCCESS[100], 0.6)} 100%)`,
                                        border: `2px solid ${alpha(COLORS.SUCCESS[300], 0.3)}`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(COLORS.SUCCESS[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: `linear-gradient(135deg, ${COLORS.SUCCESS[400]} 0%, ${COLORS.SUCCESS[600]} 100%)`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <People sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                            {stats.active}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.SUCCESS[600], fontWeight: 600 }}>
                                            Đang làm việc
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={6} sm={6} md={2.4}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.6)} 100%)`,
                                        border: `2px solid ${alpha(COLORS.ERROR[300], 0.3)}`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[500], 0.2)}`
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: `linear-gradient(135deg, ${COLORS.ERROR[400]} 0%, ${COLORS.ERROR[600]} 100%)`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <EventBusy sx={{ color: 'white', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[700] }}>
                                            {stats.onLeave}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.ERROR[600], fontWeight: 600 }}>
                                            Nghỉ phép
                                        </Typography>
                                    </Box>
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
                                    <MenuItem value="sales_staff">Sale staff</MenuItem>
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
                                    setEditMode(false);
                                    setSelectedStaff(null);
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
                                                            setEditMode(true);
                                                            setSelectedStaff(s);
                                                            setAddStaffModalOpen(true);
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
                    </>
                )}

                {/* Tab 1: Ca làm việc */}
                {currentTab === 1 && (
                    <>
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Danh sách ca làm việc ({shifts.length})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenShiftDialog()}
                                sx={{
                                    bgcolor: COLORS.PRIMARY[500],
                                    '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                                }}
                            >
                                Thêm ca làm việc
                            </Button>
                        </Box>

                        {loadingShifts ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography>Đang tải ca làm việc...</Typography>
                            </Box>
                        ) : shifts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Schedule sx={{ fontSize: 60, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                                <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Chưa có ca làm việc nào
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 1 }}>
                                    Nhấn "Thêm ca làm việc" để tạo ca mới
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[500], 0.1) }}>
                                            <TableCell sx={{ fontWeight: 800 }}>Tên ca</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Thời lượng</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Nhân viên</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Mô tả</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shifts.map((shift) => {
                                            const duration = shift.duration_hours
                                                ? `${shift.duration_hours} giờ`
                                                : (shift.duration ? `${shift.duration} phút` : '—');
                                            return (
                                                <TableRow key={shift.id} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>{shift.name}</TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <AccessTime fontSize="small" sx={{ color: COLORS.PRIMARY[500] }} />
                                                            <Typography variant="body2">
                                                                {shift.start_time} - {shift.end_time}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>{duration}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={<People fontSize="small" />}
                                                            label={`${shift.staffCount || 0} nhân viên`}
                                                            size="small"
                                                            onClick={() => handleOpenStaffDialog(shift)}
                                                            sx={{
                                                                bgcolor: alpha(COLORS.INFO[100], 0.7),
                                                                color: COLORS.INFO[800],
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                '&:hover': {
                                                                    bgcolor: alpha(COLORS.INFO[200], 0.8)
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            {shift.description || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenShiftDialog(shift)}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteShift(shift.id)}
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
                        )}
                    </>
                )}

                {/* Add/Edit Staff Modal */}
                <AddStaffModal
                    isOpen={addStaffModalOpen}
                    onClose={() => {
                        setAddStaffModalOpen(false);
                        setSelectedStaff(null);
                        setEditMode(false);
                    }}
                    onSubmit={handleSubmitStaff}
                    editMode={editMode}
                    initialData={selectedStaff}
                    isLoading={isSubmitting}
                />

                {/* Confirm Delete Modal */}
                <ConfirmModal
                    isOpen={confirmDeleteOpen}
                    onClose={() => {
                        setConfirmDeleteOpen(false);
                        setPendingDeleteId('');
                    }}
                    onConfirm={async () => {
                        try {
                            const response = await managerApi.deleteStaff(pendingDeleteId);
                            if (response.success) {
                                setStaff(prev => prev.filter(s => s.id !== pendingDeleteId));
                                setAlert({
                                    open: true,
                                    title: 'Thành công',
                                    message: 'Xóa nhân viên thành công!',
                                    type: 'success'
                                });
                            }
                        } catch (error) {
                            setAlert({
                                open: true,
                                title: 'Lỗi',
                                message: error.message || 'Không thể xóa nhân viên',
                                type: 'error'
                            });
                        } finally {
                            setConfirmDeleteOpen(false);
                            setPendingDeleteId('');
                        }
                    }}
                    title="Xóa nhân viên"
                    message="Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác."
                    confirmText="Xóa"
                    cancelText="Hủy"
                    type="error"
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alert.open}
                    onClose={() => setAlert({ ...alert, open: false })}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                />

                {/* Shift Dialog */}
                <Dialog open={openShiftDialog} onClose={handleCloseShiftDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: COLORS.PRIMARY[500], color: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Schedule />
                            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                {editingShift ? 'Sửa ca làm việc' : 'Thêm ca làm việc mới'}
                            </Typography>
                            <IconButton onClick={handleCloseShiftDialog} sx={{ color: 'white' }}>
                                <Close />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Stack spacing={3}>
                            <TextField
                                label="Tên ca làm việc"
                                fullWidth
                                required
                                value={shiftFormData.name}
                                onChange={(e) => setShiftFormData({ ...shiftFormData, name: e.target.value })}
                                placeholder="VD: Ca sáng, Ca chiều"
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Giờ bắt đầu"
                                    fullWidth
                                    required
                                    type="time"
                                    value={shiftFormData.start_time}
                                    onChange={(e) => setShiftFormData({ ...shiftFormData, start_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Giờ kết thúc"
                                    fullWidth
                                    required
                                    type="time"
                                    value={shiftFormData.end_time}
                                    onChange={(e) => setShiftFormData({ ...shiftFormData, end_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                            <TextField
                                label="Mô tả"
                                fullWidth
                                multiline
                                rows={3}
                                value={shiftFormData.description}
                                onChange={(e) => setShiftFormData({ ...shiftFormData, description: e.target.value })}
                                placeholder="Mô tả về ca làm việc..."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={handleCloseShiftDialog} variant="outlined">Hủy</Button>
                        <Button
                            onClick={handleSaveShift}
                            variant="contained"
                            sx={{
                                bgcolor: COLORS.PRIMARY[500],
                                '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                            }}
                        >
                            {editingShift ? 'Cập nhật' : 'Tạo ca'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Staff Management Dialog */}
                <Dialog open={openStaffDialog} onClose={handleCloseStaffDialog} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ bgcolor: COLORS.INFO[500], color: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <People />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Quản lý nhân viên - {selectedShift?.name}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {selectedShift?.start_time} - {selectedShift?.end_time}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleCloseStaffDialog} sx={{ color: 'white' }}>
                                <Close />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        {loadingShiftStaff ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography>Đang tải...</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={3}>
                                {/* Assigned Staff */}
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                        Nhân viên đã phân công ({shiftStaff.length})
                                    </Typography>
                                    {shiftStaff.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 3, bgcolor: COLORS.BACKGROUND.NEUTRAL, borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Chưa có nhân viên nào được phân công
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Stack spacing={1}>
                                            {shiftStaff.map((s) => {
                                                const isPending = pendingAssignments.includes(s.id);
                                                return (
                                                    <Paper
                                                        key={s.id}
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                            border: isPending ? `2px solid ${COLORS.SUCCESS[500]}` : 'none',
                                                            bgcolor: isPending ? alpha(COLORS.SUCCESS[50], 0.5) : 'white'
                                                        }}
                                                    >
                                                        <Avatar src={s.avatar_url} alt={s.full_name} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography sx={{ fontWeight: 600 }}>{s.full_name}</Typography>
                                                                {isPending && (
                                                                    <Chip
                                                                        label="Mới"
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: COLORS.SUCCESS[500],
                                                                            color: 'white',
                                                                            height: 20,
                                                                            fontSize: '0.7rem'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                {roleLabel(s.role)}
                                                            </Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveStaff(s.id)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Box>

                                {/* Available Staff */}
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                        Nhân viên khả dụng
                                    </Typography>
                                    {staff.filter(s => !shiftStaff.find(assigned => assigned.id === s.id)).length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 3, bgcolor: COLORS.BACKGROUND.NEUTRAL, borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Không còn nhân viên khả dụng
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                            {staff
                                                .filter(s => !shiftStaff.find(assigned => assigned.id === s.id))
                                                .map((s) => {
                                                    // Check if staff has time conflict
                                                    const staffShifts = staffShiftsMap[s.id] || [];
                                                    const conflictShift = selectedShift ? staffShifts.find(shift =>
                                                        shift.id !== selectedShift.id &&
                                                        checkTimeOverlap(
                                                            selectedShift.start_time,
                                                            selectedShift.end_time,
                                                            shift.start_time,
                                                            shift.end_time
                                                        )
                                                    ) : null;

                                                    return (
                                                        <Paper
                                                            key={s.id}
                                                            sx={{
                                                                p: 2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 2,
                                                                opacity: conflictShift ? 0.6 : 1,
                                                                border: conflictShift ? `1px dashed ${COLORS.WARNING[500]}` : 'none'
                                                            }}
                                                        >
                                                            <Avatar src={s.avatar_url} alt={s.full_name} />
                                                            <Box sx={{ flex: 1 }}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography sx={{ fontWeight: 600 }}>{s.full_name}</Typography>
                                                                    {conflictShift && (
                                                                        <Chip
                                                                            label="Trùng ca"
                                                                            size="small"
                                                                            icon={<EventBusy fontSize="small" />}
                                                                            sx={{
                                                                                bgcolor: alpha(COLORS.WARNING[100], 0.8),
                                                                                color: COLORS.WARNING[800],
                                                                                height: 20,
                                                                                fontSize: '0.7rem'
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {roleLabel(s.role)}
                                                                </Typography>
                                                                {conflictShift && (
                                                                    <Typography variant="caption" sx={{ color: COLORS.WARNING[700], fontWeight: 600 }}>
                                                                        Ca "{conflictShift.name}" ({conflictShift.start_time}-{conflictShift.end_time})
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<Add />}
                                                                onClick={() => handleAssignStaff(s.id)}
                                                                disabled={!!conflictShift}
                                                                sx={{
                                                                    borderColor: conflictShift ? COLORS.GRAY[400] : COLORS.INFO[500],
                                                                    color: conflictShift ? COLORS.GRAY[500] : COLORS.INFO[700],
                                                                    '&:hover': conflictShift ? {} : {
                                                                        borderColor: COLORS.INFO[600],
                                                                        bgcolor: alpha(COLORS.INFO[100], 0.1)
                                                                    }
                                                                }}
                                                            >
                                                                Thêm
                                                            </Button>
                                                        </Paper>
                                                    );
                                                })}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                        <Box>
                            {(pendingAssignments.length > 0 || pendingRemovals.length > 0) && (
                                <Typography variant="body2" sx={{ color: COLORS.WARNING[700], fontWeight: 600 }}>
                                    {pendingAssignments.length > 0 && `+${pendingAssignments.length} thêm`}
                                    {pendingAssignments.length > 0 && pendingRemovals.length > 0 && ', '}
                                    {pendingRemovals.length > 0 && `-${pendingRemovals.length} xóa`}
                                </Typography>
                            )}
                        </Box>
                        <Button
                            onClick={handleCloseStaffDialog}
                            variant="contained"
                            sx={{
                                bgcolor: (pendingAssignments.length > 0 || pendingRemovals.length > 0)
                                    ? COLORS.SUCCESS[500]
                                    : COLORS.PRIMARY[500],
                                '&:hover': {
                                    bgcolor: (pendingAssignments.length > 0 || pendingRemovals.length > 0)
                                        ? COLORS.SUCCESS[600]
                                        : COLORS.PRIMARY[600]
                                }
                            }}
                        >
                            {(pendingAssignments.length > 0 || pendingRemovals.length > 0) ? 'Lưu thay đổi' : 'Đóng'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default StaffPage;


