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
import TeamScheduleMatrixModal from '../../components/modals/TeamScheduleMatrixModal';
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
        work_type_id: '',
        scheduleMatrix: {}, // Matrix of weekday-timeSlot selections
        selectedShiftIds: [] // For creating team in multiple shifts
    });

    // Team shift management states
    const [openTeamShiftDialog, setOpenTeamShiftDialog] = useState(false);
    const [managingTeam, setManagingTeam] = useState(null);

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

    const handleOpenTeamFormDialog = (shift = null, team = null) => {
        if (shift) {
            setCurrentShiftId(shift.id);
        } else {
            setCurrentShiftId(null);
        }

        if (team) {
            // Edit mode
            setEditingTeam(team);
            setTeamFormData({
                name: team.name || '',
                description: team.description || '',
                work_type_id: team.work_type?.id || '',
                scheduleMatrix: {},
                selectedShiftsWithDays: []
            });
        } else {
            // Create mode
            setEditingTeam(null);

            // Pre-select from shift if provided
            const scheduleMatrix = {};
            const selectedShiftsWithDays = [];
            if (shift) {
                const timeKey = `${shift.start_time}-${shift.end_time}`;
                const applicableDays = shift.applicable_days || [];
                applicableDays.forEach(day => {
                    scheduleMatrix[`${day}-${timeKey}`] = true;
                });
                selectedShiftsWithDays.push({
                    shiftId: shift.id,
                    shift: shift,
                    working_days: applicableDays
                });
            }

            setTeamFormData({
                name: '',
                description: '',
                work_type_id: '',
                scheduleMatrix,
                selectedShiftsWithDays
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
            work_type_id: '',
            scheduleMatrix: {},
            selectedShiftIds: []
        });
    };

    const handleSaveTeam = async () => {
        if (!teamFormData.name) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng điền tên nhóm!',
                type: 'error'
            });
            return;
        }

        // For new team, check if shifts are selected
        if (!editingTeam && (!teamFormData.selectedShiftsWithDays || teamFormData.selectedShiftsWithDays.length === 0)) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Vui lòng chọn ít nhất một ca làm việc!',
                type: 'error'
            });
            return;
        }

        // For editing team, we need currentShiftId
        if (editingTeam && !currentShiftId) {
            setAlert({
                open: true,
                title: 'Lỗi',
                message: 'Không xác định được ca làm việc!',
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

            if (editingTeam) {
                // Update existing team in single shift
                const response = await workshiftApi.updateTeamWorkShift(currentShiftId, editingTeam.id, teamDataToSend);

                if (response.success) {
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: 'Cập nhật nhóm thành công!',
                        type: 'success'
                    });
                    await loadShiftsWithStaffCount();
                    handleCloseTeamFormDialog();
                }
            } else {
                // Create new team in multiple shifts with working_days
                const selectedShiftsWithDays = teamFormData.selectedShiftsWithDays;
                let successCount = 0;
                let failCount = 0;

                for (const shiftData of selectedShiftsWithDays) {
                    try {
                        const shiftId = shiftData.shiftId || shiftData.shift?.id;
                        const working_days = shiftData.working_days || [];
                        await workshiftApi.createTeamWorkShift(shiftId, { ...teamDataToSend, working_days });
                        successCount++;
                    } catch (error) {
                        console.error(`Error creating team in shift:`, error);
                        failCount++;
                    }
                }

                if (successCount > 0) {
                    setAlert({
                        open: true,
                        title: 'Thành công',
                        message: `Đã tạo nhóm "${teamFormData.name}" cho ${successCount} ca làm việc${failCount > 0 ? ` (${failCount} ca thất bại)` : ''}!`,
                        type: successCount === selectedShiftsWithDays.length ? 'success' : 'warning'
                    });
                    await loadShiftsWithStaffCount();
                    handleCloseTeamFormDialog();
                } else {
                    setAlert({
                        open: true,
                        title: 'Lỗi',
                        message: 'Không thể tạo nhóm cho bất kỳ ca làm việc nào!',
                        type: 'error'
                    });
                }
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

    const handleOpenTeamShiftDialog = (shift, team) => {
        setCurrentShiftId(shift.id);
        setManagingTeam(team);
        setOpenTeamShiftDialog(true);
    };

    const handleCloseTeamShiftDialog = () => {
        setOpenTeamShiftDialog(false);
        setManagingTeam(null);
        setCurrentShiftId(null);
    };

    const handleSaveTeamShifts = async (team, shiftsToAdd, shiftsToRemove, shiftsToUpdate = []) => {
        try {
            setLoadingTeamAction(true);

            let addCount = 0;
            let removeCount = 0;
            let updateCount = 0;

            // Prepare team data (copy from existing team)
            const teamDataToSend = {
                name: team.name,
                description: team.description || '',
                work_type_id: team.work_type?.id || '',
                leader: team.leader || null,
                members: team.members || []
            };

            // Remove team from shifts
            for (const shift of shiftsToRemove) {
                try {
                    const shiftId = typeof shift === 'string' ? shift : shift.id;
                    const shiftObj = shifts.find(s => s.id === shiftId);
                    const teamInShift = shiftObj?.team_work_shifts?.find(t => t.name === team.name);
                    if (teamInShift) {
                        await workshiftApi.deleteTeamWorkShift(shiftId, teamInShift.id);
                        removeCount++;
                    }
                } catch (error) {
                    console.error(`Error removing team from shift:`, error);
                }
            }

            // Add team to new shifts with working_days
            for (const shiftData of shiftsToAdd) {
                try {
                    const shiftId = typeof shiftData === 'string' ? shiftData : (shiftData.shift?.id || shiftData.id);
                    const working_days = shiftData.working_days || [];
                    await workshiftApi.createTeamWorkShift(shiftId, { ...teamDataToSend, working_days });
                    addCount++;
                } catch (error) {
                    console.error(`Error adding team to shift:`, error);
                }
            }

            // Update working_days for existing teams in shifts
            for (const shiftData of shiftsToUpdate) {
                try {
                    const shiftId = typeof shiftData === 'string' ? shiftData : (shiftData.shift?.id || shiftData.id);
                    const working_days = shiftData.working_days || [];
                    const shiftObj = shifts.find(s => s.id === shiftId);
                    const teamInShift = shiftObj?.team_work_shifts?.find(t => t.name === team.name);
                    if (teamInShift) {
                        await workshiftApi.updateTeamWorkShift(shiftId, teamInShift.id, { working_days });
                        updateCount++;
                    }
                } catch (error) {
                    console.error(`Error updating team in shift:`, error);
                }
            }

            if (addCount > 0 || removeCount > 0 || updateCount > 0) {
                const messages = [];
                if (addCount > 0) messages.push(`Thêm vào ${addCount} ca`);
                if (updateCount > 0) messages.push(`Cập nhật ${updateCount} ca`);
                if (removeCount > 0) messages.push(`Xóa khỏi ${removeCount} ca`);

                setAlert({
                    open: true,
                    title: 'Thành công',
                    message: `Đã cập nhật nhóm "${team.name}": ${messages.join(', ')}`,
                    type: 'success'
                });
                await loadShiftsWithStaffCount();
                handleCloseTeamShiftDialog();
            } else {
                setAlert({
                    open: true,
                    title: 'Thông báo',
                    message: 'Không có thay đổi nào',
                    type: 'info'
                });
                handleCloseTeamShiftDialog();
            }
        } catch (error) {
            console.error('Error saving team shifts:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật ca làm việc cho nhóm',
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

    // Filtered shifts with staff search support
    const filteredShifts = useMemo(() => {
        return shifts.filter(shift => {
            const query = searchQuery.toLowerCase();

            // Search in shift name and description
            const matchShiftName = shift.name.toLowerCase().includes(query) ||
                (shift.description || '').toLowerCase().includes(query);

            // Search in team members and leaders
            const teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];
            const matchStaff = teams.some(team => {
                // Search in team name
                if (team.name?.toLowerCase().includes(query)) return true;

                // Search in leader
                if (team.leader?.full_name?.toLowerCase().includes(query)) return true;

                // Search in members
                const members = Array.isArray(team.members) ? team.members : [];
                return members.some(member =>
                    member.full_name?.toLowerCase().includes(query)
                );
            });

            const matchSearch = matchShiftName || matchStaff;

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

    // Helper function to check if team matches search query
    const teamMatchesSearch = (team, query) => {
        if (!query) return false;
        const q = query.toLowerCase();

        // Check team name
        if (team.name?.toLowerCase().includes(q)) return true;

        // Check leader
        if (team.leader?.full_name?.toLowerCase().includes(q)) return true;

        // Check members
        const members = Array.isArray(team.members) ? team.members : [];
        return members.some(member => member.full_name?.toLowerCase().includes(q));
    };

    // Helper function to check if staff name matches search
    const staffMatchesSearch = (staffName, query) => {
        if (!query || !staffName) return false;
        return staffName.toLowerCase().includes(query.toLowerCase());
    };

    const renderShiftRow = (shift, currentDay = null) => {
        const active = typeof shift.is_active === 'boolean' ? shift.is_active : (shift.status !== 'inactive');
        let teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];

        // Filter teams by working_days if currentDay is specified
        if (currentDay) {
            teams = teams.filter(team => {
                const workingDays = team.working_days || [];
                return workingDays.includes(currentDay);
            });
        }

        // Filter teams by search query if specified
        if (searchQuery && searchQuery.trim()) {
            teams = teams.filter(team => teamMatchesSearch(team, searchQuery));
        }

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
                            bgcolor: active ? alpha(COLORS.SUCCESS[600], 0.2) : alpha(COLORS.ERROR[600], 0.2),
                            color: active ? COLORS.SUCCESS[700] : COLORS.ERROR[700],
                            fontWeight: 600
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
                            <Grid container spacing={2} alignItems="stretch">
                                {teams.map((team) => {
                                    const leaderName = team?.leader?.full_name || team?.leader?.name || 'Chưa có leader';
                                    const members = Array.isArray(team?.members) ? team.members : [];
                                    const totalMembers = members.length + (team?.leader ? 1 : 0);
                                    const isHighlighted = teamMatchesSearch(team, searchQuery);

                                    return (
                                        <Grid item xs={12} md={6} key={team?.id || leaderName} sx={{ display: 'flex' }}>
                                            <Paper sx={{
                                                p: 2.5,
                                                borderRadius: 2.5,
                                                border: isHighlighted
                                                    ? `2px solid ${COLORS.WARNING[500]}`
                                                    : `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                                                bgcolor: isHighlighted
                                                    ? alpha(COLORS.WARNING[50], 0.3)
                                                    : 'white',
                                                transition: 'all 0.3s ease',
                                                boxShadow: isHighlighted
                                                    ? `0 4px 12px ${alpha(COLORS.WARNING[300], 0.4)}`
                                                    : 'none',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: isHighlighted
                                                        ? `0 6px 16px ${alpha(COLORS.WARNING[300], 0.5)}`
                                                        : `0 6px 16px ${alpha(COLORS.INFO[200], 0.3)}`
                                                },
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
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
                                                                    bgcolor: alpha(COLORS.INFO[600], 0.2),
                                                                    color: COLORS.INFO[700],
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </Stack>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Person sx={{ fontSize: 16, color: COLORS.PRIMARY[600] }} />
                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                                                Leader: <strong style={{
                                                                    color: staffMatchesSearch(leaderName, searchQuery)
                                                                        ? COLORS.WARNING[700]
                                                                        : COLORS.PRIMARY[700],
                                                                    backgroundColor: staffMatchesSearch(leaderName, searchQuery)
                                                                        ? alpha(COLORS.WARNING[200], 0.3)
                                                                        : 'transparent',
                                                                    padding: staffMatchesSearch(leaderName, searchQuery) ? '2px 6px' : '0',
                                                                    borderRadius: '4px'
                                                                }}>{leaderName}</strong>
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
                                                        <Tooltip title="Quản lý ca làm việc">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenTeamShiftDialog(shift, team)}
                                                                sx={{
                                                                    bgcolor: alpha(COLORS.PRIMARY[100], 0.6),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(COLORS.PRIMARY[200], 0.8)
                                                                    }
                                                                }}
                                                            >
                                                                <Schedule fontSize="small" sx={{ color: COLORS.PRIMARY[700] }} />
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

                                                {/* Working Days */}
                                                {currentDay && (
                                                    <Box sx={{ mb: 1.5 }}>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, display: 'block', mb: 0.75 }}>
                                                            Ngày làm việc:
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                            {(team.working_days || []).map((day) => (
                                                                <Chip
                                                                    key={day}
                                                                    label={dayLabel(day)}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: day === currentDay
                                                                            ? alpha(COLORS.PRIMARY[600], 0.2)
                                                                            : alpha(COLORS.GRAY[600], 0.2),
                                                                        color: day === currentDay
                                                                            ? COLORS.PRIMARY[700]
                                                                            : COLORS.GRAY[700],
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )}

                                                {/* Team Members */}
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, display: 'block', mb: 1 }}>
                                                        Thành viên ({members.length}):
                                                    </Typography>
                                                    {members.length > 0 ? (
                                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                                            {members.map((m) => {
                                                                const memberName = m?.full_name || m?.name || '—';
                                                                const isMatched = staffMatchesSearch(memberName, searchQuery);
                                                                return (
                                                                    <Chip
                                                                        key={m?.id || m?.full_name || Math.random()}
                                                                        label={memberName}
                                                                        size="small"
                                                                        avatar={<Avatar src={m?.avatar_url} sx={{ width: 24, height: 24 }} />}
                                                                        sx={{
                                                                            bgcolor: isMatched
                                                                                ? alpha(COLORS.WARNING[600], 0.2)
                                                                                : alpha(COLORS.GRAY[600], 0.2),
                                                                            fontWeight: 600,
                                                                            color: isMatched ? COLORS.WARNING[700] : COLORS.GRAY[700],
                                                                            border: isMatched ? `1px solid ${COLORS.WARNING[400]}` : 'none'
                                                                        }}
                                                                    />
                                                                );
                                                            })}
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
                        <Stack direction="row" spacing={2}>
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
                    </Stack>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.PRIMARY[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng số ca
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.PRIMARY[700]}>
                                {statistics.totalShifts}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.SUCCESS[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Ca đang hoạt động
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.SUCCESS[700]}>
                                {statistics.activeShifts}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.INFO[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng số nhóm
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.INFO[700]}>
                                {statistics.totalTeams}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2.5, borderTop: `4px solid ${COLORS.WARNING[500]}` }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nhân viên phân công
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={COLORS.WARNING[700]}>
                                {statistics.totalAssignedStaff}
                            </Typography>
                        </Paper>
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
                                    placeholder="Tìm ca làm việc, nhân viên, nhóm..."
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
                                                fontWeight: 600
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
                                                    {dayShifts.map((s) => renderShiftRow(s, day))}
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
                                                fontWeight: 600
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
                    availableShifts={shifts}
                />

                {/* Team Shift Management Dialog */}
                <TeamScheduleMatrixModal
                    open={openTeamShiftDialog}
                    onClose={handleCloseTeamShiftDialog}
                    team={managingTeam}
                    allShifts={shifts}
                    currentShiftId={currentShiftId}
                    loading={loadingTeamAction}
                    onSave={handleSaveTeamShifts}
                />
            </Box>
        </Box>
    );
};

export default WorkShiftPage;
