import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, IconButton, Button, Avatar, Grid, Card, CardContent, Badge, Tooltip, TextField, Select, MenuItem, InputLabel, FormControl, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import ShiftFormModal from '../../components/modals/ShiftFormModal';
import StaffAssignmentModal from '../../components/modals/StaffAssignmentModal';
import TeamMembersModal from '../../components/modals/TeamMembersModal';
import TeamFormModal from '../../components/modals/TeamFormModal';
import { Edit, Delete, Schedule, Add, AccessTime, GroupAdd, Groups, CalendarMonth, CheckCircle, People, Search, Person } from '@mui/icons-material';
import { managerApi } from '../../api/userApi';
import workshiftApi from '../../api/workshiftApi';

// Helper function for role labels (used in multiple places)
const roleLabel = (r) => {
    switch (r) {
        case 'sales_staff': return 'Sale staff';
        case 'working_staff': return 'Working staff';
        default: return r;
    }
};

const WorkShiftPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState([]);

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
        description: '',
        is_active: true,
        applicable_days: []
    });

    // Staff assignment states
    const [openStaffDialog, setOpenStaffDialog] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [shiftStaff, setShiftStaff] = useState([]);
    const [loadingShiftStaff, setLoadingShiftStaff] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState([]);
    const [pendingRemovals, setPendingRemovals] = useState([]);
    const [staffShiftsMap, setStaffShiftsMap] = useState({});

    // Team management states
    const [openTeamDialog, setOpenTeamDialog] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [currentShiftId, setCurrentShiftId] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [originalTeamMembers, setOriginalTeamMembers] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [selectedStaffToAdd, setSelectedStaffToAdd] = useState(null);
    const [loadingTeamAction, setLoadingTeamAction] = useState(false);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Team create/edit states
    const [openTeamFormDialog, setOpenTeamFormDialog] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [teamFormData, setTeamFormData] = useState({
        name: '',
        description: '',
        work_type_id: ''
    });

    // View and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Load staff data from API
    useEffect(() => {
        const loadStaff = async () => {
            try {
                setIsLoading(true);
                const response = await managerApi.getStaff();
                if (response.success) {
                    setStaff(response.data);
                }
            } catch (e) {
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

    // Load shifts on mount
    useEffect(() => {
        loadShiftsWithStaffCount();
    }, []);

    // Load shifts with staff count
    const loadShiftsWithStaffCount = async () => {
        try {
            setLoadingShifts(true);
            const response = await workshiftApi.getAllShifts();
            if (response.success) {
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

    // Handle shift dialog open/close
    const handleOpenShiftDialog = (shift = null) => {
        if (shift) {
            setEditingShift(shift);
            setShiftFormData({
                name: shift.name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                description: shift.description || '',
                is_active: typeof shift.is_active === 'boolean' ? shift.is_active : (shift.status !== 'inactive'),
                applicable_days: Array.isArray(shift.applicable_days) ? shift.applicable_days : []
            });
        } else {
            setEditingShift(null);
            setShiftFormData({
                name: '',
                start_time: '',
                end_time: '',
                description: '',
                is_active: true,
                applicable_days: []
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

        if (minutes1End <= minutes1Start) minutes1End += 24 * 60;
        if (minutes2End <= minutes2Start) minutes2End += 24 * 60;

        return minutes1Start < minutes2End && minutes1End > minutes2Start;
    };

    // Handle manage staff dialog
    const handleOpenStaffDialog = async (shift) => {
        setSelectedShift(shift);
        setOpenStaffDialog(true);
        setPendingAssignments([]);
        setPendingRemovals([]);

        try {
            setLoadingShiftStaff(true);

            const response = await workshiftApi.getShiftStaff(shift.id);
            if (response.success) {
                const staffIds = response.data.staff_ids;
                const assignedStaff = staff.filter(s => staffIds.includes(s.id));
                setShiftStaff(assignedStaff);
            }

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

        setOpenStaffDialog(false);
        setSelectedShift(null);
        setShiftStaff([]);
        setPendingAssignments([]);
        setPendingRemovals([]);
    };

    // ===============================================
    // TEAM MANAGEMENT HANDLERS
    // ===============================================

    const handleOpenTeamDialog = async (shift, team) => {
        setCurrentShiftId(shift.id);
        setSelectedTeam(team);

        // Ensure leader is included in team members
        const members = team.members || [];
        const leader = team.leader;

        // Check if leader is already in members list
        const leaderInMembers = leader && members.some(m => m.id === leader.id);

        // If leader exists but not in members, add them
        const allMembers = leaderInMembers || !leader
            ? members
            : [leader, ...members];

        setTeamMembers(allMembers);
        setOriginalTeamMembers(allMembers);
        setOpenTeamDialog(true);
        setStaffSearchQuery('');
        setRoleFilter('all');
        setAvailableStaff(staff);
        setSelectedStaffToAdd(null);
    };

    const handleAddTeamMember = (staffMember) => {
        const newMembers = [...teamMembers];
        newMembers.push({
            id: staffMember.id,
            full_name: staffMember.name,
            avatar_url: staffMember.avatar
        });
        setTeamMembers(newMembers);
    };

    const handleRemoveTeamMember = (memberId) => {
        const newMembers = teamMembers.filter(m => m.id !== memberId);
        setTeamMembers(newMembers);
    };

    const handleSetLeader = async (member) => {
        if (!currentShiftId || !selectedTeam) return;

        try {
            setLoadingTeamAction(true);

            const leaderData = {
                id: member.id,
                full_name: member.full_name || member.name,
                avatar_url: member.avatar_url,
                role: member.role
            };

            const response = await workshiftApi.updateTeamLeader(currentShiftId, selectedTeam.id, leaderData);

            if (response.success) {
                await loadShifts();

                // Update selectedTeam với leader mới
                setSelectedTeam({
                    ...selectedTeam,
                    leader: leaderData
                });

                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: `Đã đặt ${member.full_name || member.name} làm Leader!`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error setting leader:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể đặt leader. Vui lòng thử lại!',
                type: 'error'
            });
        } finally {
            setLoadingTeamAction(false);
        }
    };

    const handleCloseTeamDialog = () => {
        setOpenTeamDialog(false);
        setSelectedTeam(null);
        setCurrentShiftId(null);
        setTeamMembers([]);
        setOriginalTeamMembers([]);
        setAvailableStaff([]);
        setSelectedStaffToAdd(null);
        setStaffSearchQuery('');
        setRoleFilter('all');
    };

    const handleSaveTeamChanges = async () => {
        if (!currentShiftId || !selectedTeam) return;

        const addedIds = teamMembers.filter(m => !originalTeamMembers.some(om => om.id === m.id)).map(m => m.id);
        const removedIds = originalTeamMembers.filter(om => !teamMembers.some(m => m.id === om.id)).map(om => om.id);

        if (addedIds.length === 0 && removedIds.length === 0) {
            handleCloseTeamDialog();
            return;
        }

        try {
            setLoadingTeamAction(true);

            for (const staffId of removedIds) {
                await workshiftApi.removeStaffFromTeam(currentShiftId, selectedTeam.id, staffId);
            }

            for (const staffId of addedIds) {
                const staffMember = staff.find(s => s.id === staffId);
                if (staffMember) {
                    await workshiftApi.addStaffToTeam(currentShiftId, selectedTeam.id, staffMember);
                }
            }

            await loadShifts();

            setAlert({
                open: true,
                title: 'Thành công',
                message: `Đã cập nhật ${addedIds.length + removedIds.length} thay đổi`,
                type: 'success'
            });

            handleCloseTeamDialog();
        } catch (error) {
            console.error('Error saving team changes:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thay đổi',
                type: 'error'
            });
        } finally {
            setLoadingTeamAction(false);
        }
    };

    // ===============================================
    // END TEAM MANAGEMENT HANDLERS
    // ===============================================

    // ===============================================
    // TEAM CREATE/EDIT HANDLERS
    // ===============================================

    const handleOpenTeamFormDialog = (shift, team = null) => {
        setCurrentShiftId(shift.id);
        if (team) {
            // Edit mode
            setEditingTeam(team);
            setTeamFormData({
                name: team.name || '',
                description: team.description || '',
                work_type_id: team.work_type?.id || ''
            });
        } else {
            // Create mode
            setEditingTeam(null);
            setTeamFormData({
                name: '',
                description: '',
                work_type_id: ''
            });
        }
        setOpenTeamFormDialog(true);
    };

    const handleCloseTeamFormDialog = () => {
        setOpenTeamFormDialog(false);
        setEditingTeam(null);
        setCurrentShiftId(null);
        setTeamFormData({
            name: '',
            description: '',
            work_type_id: ''
        });
    };

    const handleSaveTeam = async () => {
        if (!currentShiftId) return;

        if (!teamFormData.name) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền tên nhóm!',
                type: 'error'
            });
            return;
        }

        try {
            setLoadingTeamAction(true);

            // Prepare team data
            const teamDataToSend = {
                name: teamFormData.name,
                description: teamFormData.description || '',
                work_type_id: teamFormData.work_type_id || '',
                leader: editingTeam?.leader || null // Keep existing leader when editing
            };

            let response;
            if (editingTeam) {
                // Update existing team
                response = await workshiftApi.updateTeamWorkShift(currentShiftId, editingTeam.id, teamDataToSend);
            } else {
                // Create new team
                response = await workshiftApi.createTeamWorkShift(currentShiftId, teamDataToSend);
            }

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: editingTeam ? 'Cập nhật nhóm thành công!' : 'Tạo nhóm mới thành công!',
                    type: 'success'
                });
                await loadShiftsWithStaffCount();
                handleCloseTeamFormDialog();
            }
        } catch (error) {
            console.error('Error saving team:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thông tin nhóm',
                type: 'error'
            });
        } finally {
            setLoadingTeamAction(false);
        }
    };

    const handleDeleteTeam = async (shiftId, teamId, teamName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhóm "${teamName}"?`)) {
            return;
        }

        try {
            setLoadingTeamAction(true);
            const response = await workshiftApi.deleteTeamWorkShift(shiftId, teamId);

            if (response.success) {
                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: 'Xóa nhóm thành công!',
                    type: 'success'
                });
                await loadShiftsWithStaffCount();
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể xóa nhóm',
                type: 'error'
            });
        } finally {
            setLoadingTeamAction(false);
        }
    };

    // ===============================================
    // END TEAM CREATE/EDIT HANDLERS
    // ===============================================

    const handleAssignStaff = (staffId) => {
        if (!selectedShift) return;

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

        setPendingAssignments(prev => [...prev, staffId]);

        const staffToAdd = staff.find(s => s.id === staffId);
        if (staffToAdd) {
            setShiftStaff(prev => [...prev, staffToAdd]);
        }

        setPendingRemovals(prev => prev.filter(id => id !== staffId));
    };

    const handleRemoveStaff = (staffId) => {
        if (!selectedShift) return;

        setShiftStaff(prev => prev.filter(s => s.id !== staffId));

        if (pendingAssignments.includes(staffId)) {
            setPendingAssignments(prev => prev.filter(id => id !== staffId));
        } else {
            setPendingRemovals(prev => [...prev, staffId]);
        }

        setPendingAssignments(prev => prev.filter(id => id !== staffId));
    };

    // Statistics calculations
    const statistics = useMemo(() => {
        const totalShifts = shifts.length;
        const activeShifts = shifts.filter(s => s.is_active !== false && s.status !== 'inactive').length;
        const totalTeams = shifts.reduce((acc, shift) => {
            return acc + (Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts.length : 0);
        }, 0);
        const totalAssignedStaff = shifts.reduce((acc, shift) => {
            const teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];
            return acc + teams.reduce((teamAcc, team) => {
                const members = Array.isArray(team.members) ? team.members.length : 0;
                const leader = team.leader ? 1 : 0;
                return teamAcc + members + leader;
            }, 0);
        }, 0);

        return {
            totalShifts,
            activeShifts,
            inactiveShifts: totalShifts - activeShifts,
            totalTeams,
            totalAssignedStaff,
            averageTeamsPerShift: totalShifts > 0 ? (totalTeams / totalShifts).toFixed(1) : 0
        };
    }, [shifts]);

    // Filtered shifts
    const filteredShifts = useMemo(() => {
        return shifts.filter(shift => {
            const matchSearch = shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (shift.description || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && (shift.is_active !== false && shift.status !== 'inactive')) ||
                (statusFilter === 'inactive' && (shift.is_active === false || shift.status === 'inactive'));

            return matchSearch && matchStatus;
        });
    }, [shifts, searchQuery, statusFilter]);

    // Prepare available staff for StaffAssignmentModal
    const availableStaffForAssignment = useMemo(() => {
        return staff
            .filter(s => !shiftStaff.find(assigned => assigned.id === s.id))
            .map((s) => {
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

                return {
                    ...s,
                    hasConflict: !!conflictShift,
                    conflictShift: conflictShift
                };
            });
    }, [staff, shiftStaff, staffShiftsMap, selectedShift]);

    if (isLoading) {
        return (
            <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
                <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải dữ liệu..." />
            </Box>
        );
    }

    const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const dayLabel = (d) => ({
        MONDAY: 'Thứ 2',
        TUESDAY: 'Thứ 3',
        WEDNESDAY: 'Thứ 4',
        THURSDAY: 'Thứ 5',
        FRIDAY: 'Thứ 6',
        SATURDAY: 'Thứ 7',
        SUNDAY: 'Chủ nhật'
    }[d] || d);
    const toHHmm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);

    const renderShiftRow = (shift) => {
        const active = typeof shift.is_active === 'boolean' ? shift.is_active : (shift.status !== 'inactive');
        const teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];
        return (
            <React.Fragment key={shift.id}>
                <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>{shift.name}</TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <AccessTime fontSize="small" sx={{ color: COLORS.PRIMARY[500] }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {toHHmm(shift.start_time)} - {toHHmm(shift.end_time)}
                            </Typography>
                        </Stack>
                    </TableCell>
                    <TableCell>
                        <Chip size="small" label={active ? 'Đang hoạt động' : 'Ngừng'} sx={{
                            bgcolor: active ? alpha(COLORS.SUCCESS[100], 0.8) : alpha(COLORS.ERROR[100], 0.8),
                            color: active ? COLORS.SUCCESS[700] : COLORS.ERROR[700],
                            fontWeight: 700
                        }} />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            {shift.description || '—'}
                        </Typography>
                    </TableCell>
                    <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenShiftDialog(shift)}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteShift(shift.id)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={5} sx={{ py: 2.5, bgcolor: alpha(COLORS.GRAY[50], 0.5) }}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: teams.length > 0 ? 2.5 : 0 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Groups sx={{ color: COLORS.INFO[600], fontSize: 24 }} />
                                <Typography variant="subtitle1" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 700 }}>
                                    Nhóm làm việc
                                </Typography>
                                <Badge badgeContent={teams.length} color="primary" sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: COLORS.INFO[600],
                                        color: 'white',
                                        fontWeight: 700
                                    }
                                }} />
                            </Stack>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenTeamFormDialog(shift)}
                                sx={{
                                    bgcolor: COLORS.INFO[600],
                                    color: 'white',
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: `0 2px 8px ${alpha(COLORS.INFO[500], 0.3)}`,
                                    '&:hover': {
                                        bgcolor: COLORS.INFO[700],
                                        boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.4)}`
                                    }
                                }}
                            >
                                Tạo nhóm
                            </Button>
                        </Stack>
                        {teams.length === 0 ? (
                            <Paper sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'white',
                                borderRadius: 2,
                                border: `2px dashed ${alpha(COLORS.INFO[300], 0.3)}`
                            }}>
                                <Groups sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1, opacity: 0.5 }} />
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500 }}>
                                    Chưa có nhóm làm việc nào. Nhấn "Tạo nhóm" để bắt đầu.
                                </Typography>
                            </Paper>
                        ) : (
                            <Grid container spacing={2}>
                                {teams.map((team) => {
                                    const leaderName = team?.leader?.full_name || team?.leader?.name || 'Chưa có leader';
                                    const members = Array.isArray(team?.members) ? team.members : [];
                                    const totalMembers = members.length + (team?.leader ? 1 : 0);

                                    return (
                                        <Grid item xs={12} md={6} key={team?.id || leaderName}>
                                            <Paper sx={{
                                                p: 2.5,
                                                borderRadius: 2.5,
                                                border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                                                bgcolor: 'white',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 6px 16px ${alpha(COLORS.INFO[200], 0.3)}`
                                                }
                                            }}>
                                                {/* Team Header */}
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[800] }}>
                                                                {team?.name || 'Team'}
                                                            </Typography>
                                                            <Chip
                                                                label={`${totalMembers} người`}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(COLORS.INFO[100], 0.8),
                                                                    color: COLORS.INFO[800],
                                                                    fontWeight: 700,
                                                                    height: 20,
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        </Stack>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Person sx={{ fontSize: 16, color: COLORS.PRIMARY[600] }} />
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                                                Leader: <strong style={{ color: COLORS.PRIMARY[700] }}>{leaderName}</strong>
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>

                                                    {/* Action Buttons */}
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="Sửa nhóm">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenTeamFormDialog(shift, team)}
                                                                sx={{
                                                                    bgcolor: alpha(COLORS.INFO[100], 0.6),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.INFO[200], 0.8)
                                                                    }
                                                                }}
                                                            >
                                                                <Edit fontSize="small" sx={{ color: COLORS.INFO[700] }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Quản lý thành viên">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenTeamDialog(shift, team)}
                                                                sx={{
                                                                    bgcolor: alpha(COLORS.SUCCESS[100], 0.6),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.SUCCESS[200], 0.8)
                                                                    }
                                                                }}
                                                            >
                                                                <GroupAdd fontSize="small" sx={{ color: COLORS.SUCCESS[700] }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa nhóm">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteTeam(shift.id, team.id, team.name)}
                                                                sx={{
                                                                    bgcolor: alpha(COLORS.ERROR[100], 0.6),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.ERROR[200], 0.8)
                                                                    }
                                                                }}
                                                            >
                                                                <Delete fontSize="small" sx={{ color: COLORS.ERROR[700] }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Stack>

                                                <Divider sx={{ my: 1.5 }} />

                                                {/* Team Members */}
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, display: 'block', mb: 1 }}>
                                                        Thành viên ({members.length}):
                                                    </Typography>
                                                    {members.length > 0 ? (
                                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                                            {members.map((m) => (
                                                                <Chip
                                                                    key={m?.id || m?.full_name || Math.random()}
                                                                    label={m?.full_name || m?.name || '—'}
                                                                    size="small"
                                                                    avatar={<Avatar src={m?.avatar_url} sx={{ width: 24, height: 24 }} />}
                                                                    sx={{
                                                                        bgcolor: alpha(COLORS.GRAY[100], 0.8),
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                            Chưa có thành viên
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%', pb: 4 }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], mb: 0.5 }}>
                                Quản lý ca làm việc
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Lập lịch và quản lý ca làm việc của nhân viên
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenShiftDialog()}
                            sx={{
                                bgcolor: COLORS.PRIMARY[600],
                                color: 'white',
                                px: 3,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`,
                                '&:hover': {
                                    bgcolor: COLORS.PRIMARY[700],
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 6px 16px ${alpha(COLORS.PRIMARY[500], 0.4)}`
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Tạo ca làm việc
                        </Button>
                    </Stack>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[100], 0.2)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 20px ${alpha(COLORS.PRIMARY[200], 0.3)}`
                            }
                        }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                        borderRadius: 2,
                                        p: 1.5,
                                        display: 'flex'
                                    }}>
                                        <Schedule sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                                            {statistics.totalShifts}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Tổng số ca
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[100], 0.2)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 20px ${alpha(COLORS.SUCCESS[200], 0.3)}`
                            }
                        }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                        borderRadius: 2,
                                        p: 1.5,
                                        display: 'flex'
                                    }}>
                                        <CheckCircle sx={{ fontSize: 32, color: COLORS.SUCCESS[600] }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                            {statistics.activeShifts}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Ca đang hoạt động
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[100], 0.2)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 20px ${alpha(COLORS.INFO[200], 0.3)}`
                            }
                        }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        bgcolor: alpha(COLORS.INFO[500], 0.1),
                                        borderRadius: 2,
                                        p: 1.5,
                                        display: 'flex'
                                    }}>
                                        <Groups sx={{ fontSize: 32, color: COLORS.INFO[600] }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                            {statistics.totalTeams}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Tổng số nhóm
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            borderRadius: 3,
                            border: `2px solid ${alpha(COLORS.WARNING[200], 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(COLORS.WARNING[100], 0.2)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 20px ${alpha(COLORS.WARNING[200], 0.3)}`
                            }
                        }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        bgcolor: alpha(COLORS.WARNING[500], 0.1),
                                        borderRadius: 2,
                                        p: 1.5,
                                        display: 'flex'
                                    }}>
                                        <People sx={{ fontSize: 32, color: COLORS.WARNING[600] }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.WARNING[700] }}>
                                            {statistics.totalAssignedStaff}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                            Nhân viên phân công
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(COLORS.PRIMARY[50], 0.3) }}>
                        <Stack direction="row" spacing={2} sx={{ p: 2 }} justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                <CalendarMonth sx={{ fontSize: 24, verticalAlign: 'middle', mr: 1 }} />
                                Tất cả ca làm việc
                            </Typography>

                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                <TextField
                                    size="small"
                                    placeholder="Tìm kiếm ca làm việc..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ color: COLORS.TEXT.SECONDARY, mr: 1 }} />,
                                        sx: { bgcolor: 'white', minWidth: 200 }
                                    }}
                                />
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        label="Trạng thái"
                                        sx={{ bgcolor: 'white' }}
                                    >
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        <MenuItem value="active">Đang hoạt động</MenuItem>
                                        <MenuItem value="inactive">Tạm ngừng</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>

                {loadingShifts ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Loading fullScreen={false} variant="cafe" size="medium" message="Đang tải ca làm việc..." />
                    </Box>
                ) : filteredShifts.length === 0 ? (
                    <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 3, border: `2px dashed ${alpha(COLORS.PRIMARY[300], 0.3)}` }}>
                        <Schedule sx={{ fontSize: 80, color: COLORS.TEXT.DISABLED, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, mb: 1 }}>
                            {shifts.length === 0 ? 'Chưa có ca làm việc nào' : 'Không tìm thấy kết quả'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 3 }}>
                            {shifts.length === 0
                                ? 'Bắt đầu bằng cách tạo ca làm việc đầu tiên'
                                : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                            }
                        </Typography>
                        {shifts.length === 0 && (
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenShiftDialog()}
                                sx={{
                                    bgcolor: COLORS.PRIMARY[600],
                                    '&:hover': { bgcolor: COLORS.PRIMARY[700] }
                                }}
                            >
                                Tạo ca làm việc đầu tiên
                            </Button>
                        )}
                    </Paper>
                ) : (
                    <>
                        {daysOrder.map((day) => {
                            const dayShifts = filteredShifts
                                .filter(s => Array.isArray(s.applicable_days) && s.applicable_days.includes(day))
                                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));


                            return (
                                <Paper key={`card-${day}`} sx={{
                                    mb: 3,
                                    borderRadius: 3,
                                    border: `2px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`,
                                    boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY[100], 0.2)}`,
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        px: 3,
                                        py: 2,
                                        background: `linear-gradient(135deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
                                            {dayLabel(day)}
                                        </Typography>
                                        <Chip
                                            label={`${dayShifts.length} ca làm việc`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'white',
                                                color: COLORS.PRIMARY[700],
                                                fontWeight: 700
                                            }}
                                        />
                                    </Box>
                                    {dayShifts.length === 0 ? (
                                        <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                                Chưa có ca làm việc nào
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800 }}>Tên ca</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {dayShifts.map((s) => renderShiftRow(s))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Paper>
                            );
                        })}

                        {/* Shifts without applicable_days */}
                        {(() => {
                            const otherShifts = filteredShifts.filter(s => !Array.isArray(s.applicable_days) || s.applicable_days.length === 0)
                                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

                            if (otherShifts.length === 0) return null;

                            return (
                                <Paper sx={{
                                    mb: 3,
                                    borderRadius: 3,
                                    border: `2px solid ${alpha(COLORS.GRAY[300], 0.4)}`,
                                    boxShadow: `0 2px 8px ${alpha(COLORS.GRAY[200], 0.2)}`,
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        px: 3,
                                        py: 2,
                                        background: `linear-gradient(135deg, ${COLORS.GRAY[400]} 0%, ${COLORS.GRAY[500]} 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
                                            Ca làm việc khác
                                        </Typography>
                                        <Chip
                                            label={`${otherShifts.length} ca làm việc`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'white',
                                                color: COLORS.GRAY[700],
                                                fontWeight: 700
                                            }}
                                        />
                                    </Box>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800 }}>Tên ca</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, display: { xs: 'none', md: 'table-cell' } }}>Mô tả</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Hành động</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {otherShifts.map((s) => renderShiftRow(s))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            );
                        })()}
                    </>
                )}

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alert.open}
                    onClose={() => setAlert({ ...alert, open: false })}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                />

                {/* Shift Dialog */}
                <ShiftFormModal
                    open={openShiftDialog}
                    onClose={handleCloseShiftDialog}
                    editingShift={editingShift}
                    formData={shiftFormData}
                    onFormChange={setShiftFormData}
                    onSave={handleSaveShift}
                />

                {/* Staff Management Dialog */}
                <StaffAssignmentModal
                    open={openStaffDialog}
                    onClose={handleCloseStaffDialog}
                    shift={selectedShift}
                    shiftStaff={shiftStaff}
                    availableStaff={availableStaffForAssignment}
                    pendingAssignments={pendingAssignments}
                    pendingRemovals={pendingRemovals}
                    loading={loadingShiftStaff}
                    onAssign={handleAssignStaff}
                    onRemove={handleRemoveStaff}
                />

                {/* Team Management Dialog */}
                <TeamMembersModal
                    open={openTeamDialog}
                    onClose={handleCloseTeamDialog}
                    team={selectedTeam}
                    currentShift={shifts.find(s => s.id === currentShiftId)}
                    teamMembers={teamMembers}
                    originalTeamMembers={originalTeamMembers}
                    allStaff={staff}
                    searchQuery={staffSearchQuery}
                    roleFilter={roleFilter}
                    loading={loadingTeamAction}
                    onSearchChange={setStaffSearchQuery}
                    onRoleFilterChange={setRoleFilter}
                    onAddMember={handleAddTeamMember}
                    onRemoveMember={handleRemoveTeamMember}
                    onSetLeader={handleSetLeader}
                    onSave={handleSaveTeamChanges}
                />

                {/* Team Create/Edit Dialog */}
                <TeamFormModal
                    open={openTeamFormDialog}
                    onClose={handleCloseTeamFormDialog}
                    editingTeam={editingTeam}
                    formData={teamFormData}
                    loading={loadingTeamAction}
                    onFormChange={setTeamFormData}
                    onSave={handleSaveTeam}
                />
            </Box>
        </Box>
    );
};

export default WorkShiftPage;
