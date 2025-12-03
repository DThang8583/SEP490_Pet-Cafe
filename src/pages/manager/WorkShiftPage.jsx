import React, { useEffect, useMemo, useState, useCallback, useTransition, useDeferredValue } from 'react';
import { Box, Typography, Paper, Chip, Stack, IconButton, Button, Grid, Card, CardContent, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import ShiftFormModal from '../../components/modals/ShiftFormModal';
import TeamFormModal from '../../components/modals/TeamFormModal';
import TeamMembersModal from '../../components/modals/TeamMembersModal';
import { Edit, Delete, Schedule, AccessTime, GroupAdd, Groups, Search, MoreVert, Person, PersonAdd } from '@mui/icons-material';
import workShiftApi, { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';
import teamApi from '../../api/teamApi';
import employeeApi from '../../api/employeeApi';
import workTypeApi from '../../api/workTypeApi';
import TeamAssignWorkShiftModal from '../../components/modals/TeamAssignWorkShiftModal';
import TeamWorkShiftsManagementModal from '../../components/modals/TeamWorkShiftsManagementModal';

const WorkShiftPage = () => {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Confirm modals
    const [confirmDeleteShiftOpen, setConfirmDeleteShiftOpen] = useState(false);
    const [deleteShiftTarget, setDeleteShiftTarget] = useState(null);
    const [confirmDeleteTeamOpen, setConfirmDeleteTeamOpen] = useState(false);
    const [deleteTeamTarget, setDeleteTeamTarget] = useState(null);
    const [confirmDeleteTeamWorkShiftOpen, setConfirmDeleteTeamWorkShiftOpen] = useState(false);
    const [deleteTeamWorkShiftTarget, setDeleteTeamWorkShiftTarget] = useState(null);

    // Work Shifts states
    const [shifts, setShifts] = useState([]);
    const [openShiftDialog, setOpenShiftDialog] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [shiftFormData, setShiftFormData] = useState({
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        applicable_days: []
    });

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(999);
    const [pagination, setPagination] = useState({
        total_items_count: 0,
        page_size: 999,
        total_pages_count: 0,
        page_index: 0,
        has_next: false,
        has_previous: false
    });

    // Teams states
    const [teams, setTeams] = useState([]);
    const [slots, setSlots] = useState([]);
    const [openTeamDialog, setOpenTeamDialog] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [openAssignWorkShiftModal, setOpenAssignWorkShiftModal] = useState(false);
    const [selectedTeamForWorkShift, setSelectedTeamForWorkShift] = useState(null);
    const [selectedWorkShiftIds, setSelectedWorkShiftIds] = useState([]);
    const [assigningWorkShifts, setAssigningWorkShifts] = useState(false);
    const [teamFormData, setTeamFormData] = useState({
        name: '',
        description: '',
        leader_id: '',
        work_type_ids: [],
        is_active: true,
        status: 'ACTIVE'
    });

    // Data for team modal
    const [allEmployees, setAllEmployees] = useState([]);
    const [allWorkTypes, setAllWorkTypes] = useState([]);

    // Team Members Modal states
    const [openTeamMembersModal, setOpenTeamMembersModal] = useState(false);
    const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [originalTeamMembers, setOriginalTeamMembers] = useState([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState('all');
    const [memberSkillFilter, setMemberSkillFilter] = useState('all');

    // Team Work Shifts Management Modal states
    const [openTeamWorkShiftsManagementModal, setOpenTeamWorkShiftsManagementModal] = useState(false);
    const [selectedTeamForWorkShiftsManagement, setSelectedTeamForWorkShiftsManagement] = useState(null);

    // Menu states
    const [shiftMenuAnchor, setShiftMenuAnchor] = useState(null);
    const [menuShift, setMenuShift] = useState(null);
    const [menuShiftDay, setMenuShiftDay] = useState(null); // Store the day context when opening menu
    const [teamMenuAnchor, setTeamMenuAnchor] = useState(null);
    const [menuTeam, setMenuTeam] = useState(null);
    const [menuTeamShiftContext, setMenuTeamShiftContext] = useState(null); // Store shift context when opening team menu

    // View and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    // Load data functions
    const loadShifts = useCallback(async () => {
        try {
            // Load all shifts without pagination (for schedule display)
            const response = await workShiftApi.getWorkShifts({
                page_index: 0,
                page_size: 1000
            });
            if (response.success) {
                // Filter out deleted shifts by default (API might return them)
                const activeShifts = (response.data || []).filter(s => !s.is_deleted);
                setShifts(activeShifts);
            } else {
                setAlert({
                    open: true,
                    type: 'error',
                    title: 'Lỗi',
                    message: response.message || 'Không thể tải danh sách ca làm việc'
                });
            }
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc'
            });
        }
    }, []);

    const loadTeams = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await teamApi.getTeams({
                page: page - 1,
                limit: itemsPerPage
            });

            if (!response.success || !Array.isArray(response.data)) {
                setTeams([]);
                setPagination({
                    total_items_count: 0,
                    page_size: itemsPerPage,
                    total_pages_count: 0,
                    page_index: page - 1,
                    has_next: false,
                    has_previous: false
                });
                return;
            }

            // Update pagination state
            if (response.pagination) {
                setPagination(response.pagination);
            }

            if (response.data.length > 0) {
                // Load team members and work shifts for each team in current page
                const teamsWithData = await Promise.all(
                    response.data.map(async (team) => {
                        try {
                            const [membersResponse, workShiftsResponse] = await Promise.allSettled([
                                teamApi.getTeamMembers(team.id),
                                teamApi.getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 })
                            ]);

                            const teamMembers = membersResponse.status === 'fulfilled' && membersResponse.value.success
                                ? membersResponse.value.data || []
                                : [];

                            const teamWorkShifts = workShiftsResponse.status === 'fulfilled' && workShiftsResponse.value.success
                                ? workShiftsResponse.value.data || []
                                : [];

                            return {
                                ...team,
                                team_members: teamMembers,
                                team_work_shifts: teamWorkShifts
                            };
                        } catch (error) {
                            return {
                                ...team,
                                team_members: [],
                                team_work_shifts: []
                            };
                        }
                    })
                );

                startTransition(() => {
                setTeams(teamsWithData);
                });
            } else {
                setTeams([]);
            }
        } catch (error) {
            setTeams([]);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách nhóm'
            });
        } finally {
            setIsLoading(false);
        }
    }, [page, itemsPerPage, startTransition]);

    const loadSlots = useCallback(async () => {
        try {
            const response = await teamApi.getAllTeamSlots();
            if (response.success) {
                setSlots(response.data);
            }
        } catch (error) {
            // Silent fail for background loading
        }
    }, []);

    const loadEmployees = useCallback(async () => {
        try {
            const response = await employeeApi.getEmployees();
            if (response.success) {
                setAllEmployees(response.data);
            }
        } catch (error) {
            // Silent fail for background loading
        }
    }, []);

    const loadWorkTypes = useCallback(async () => {
        try {
            const response = await workTypeApi.getWorkTypes();
            if (response.success) {
                setAllWorkTypes(response.data);
            }
        } catch (error) {
            // Silent fail for background loading
        }
    }, []);

    useEffect(() => {
        (async () => {
            await Promise.all([loadShifts(), loadTeams()]);
            loadSlots();
            loadEmployees();
            loadWorkTypes();
        })();
    }, [loadShifts, loadTeams, loadSlots, loadEmployees, loadWorkTypes]);

    // Reload teams when pagination changes
    useEffect(() => {
        loadTeams();
    }, [loadTeams]);


    const newTeams = useMemo(() => {
        if (!Array.isArray(teams) || teams.length === 0) {
            return [];
                    }

        return teams.filter(team => {
                const hasWorkShifts = (team.team_work_shifts?.length || 0) > 0;
                const hasMembers = (team.team_members?.filter(m => {
                    const memberId = m.employee?.id || m.employee_id;
                    return memberId && memberId !== team.leader_id;
                }).length || 0) > 0;
                return !(hasWorkShifts && hasMembers);
            });
    }, [teams]);

    const scheduleByDay = useMemo(() => {
        const schedule = {};
        const searchLower = deferredSearchQuery.toLowerCase();
        const hasSearch = searchLower.length > 0;

        const validShifts = shifts.filter(shift => !shift.is_deleted);

        const searchMatches = hasSearch ? new Set(
            validShifts
                .filter(shift => {
                    const nameMatch = shift.name?.toLowerCase().includes(searchLower);
                    const descMatch = shift.description?.toLowerCase().includes(searchLower);
                    return nameMatch || descMatch;
                })
                .map(s => s.id)
        ) : null;

        WEEKDAYS.forEach(day => {
            schedule[day] = validShifts
                .filter(shift => {
                    if (!shift.applicable_days || !shift.applicable_days.includes(day)) return false;
                    if (hasSearch && searchMatches && !searchMatches.has(shift.id)) return false;
                    return true;
                })
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return schedule;
    }, [shifts, deferredSearchQuery]);

    const teamsByShiftAndDay = useMemo(() => {
        const map = {};

        if (!Array.isArray(teams) || teams.length === 0) {
            return map;
        }

        teams.forEach((team) => {
            if (!Array.isArray(team.team_work_shifts) || team.team_work_shifts.length === 0) return;

            team.team_work_shifts.forEach((tws) => {
                const workShift = tws?.work_shift;
                if (!workShift || !workShift.id) return;

                const applicableDays = Array.isArray(workShift.applicable_days) ? workShift.applicable_days : [];
                applicableDays.forEach((day) => {
                    const key = `${workShift.id}_${day}`;
                    if (!map[key]) {
                        map[key] = [];
                    }
                    map[key].push(team);
                });
            });
            });

        return map;
    }, [teams]);

    const getTeamsForShift = useCallback((shift, day) => {
        if (!shift || !day) return [];
        const key = `${shift.id}_${day}`;
        return teamsByShiftAndDay[key] || [];
    }, [teamsByShiftAndDay]);

    const stats = useMemo(() => {
        const totalShifts = shifts.length;
        const activeShifts = shifts.filter(s => !s.is_deleted).length;
        const totalTeams = pagination.total_items_count || 0;
        const totalAssignments = teams.reduce((sum, team) => {
            const membersCount = (team.team_members?.length || 0);
            const leaderCount = team.leader ? 1 : 0;
            return sum + membersCount + leaderCount;
        }, 0);

        return {
            totalShifts,
            activeShifts,
            totalTeams,
            totalAssignments
        };
    }, [shifts, teams, pagination]);

    const handleOpenShiftDialog = useCallback(() => {
        setEditingShift(null);
        setShiftFormData({
            name: '',
            start_time: '',
            end_time: '',
            description: '',
            applicable_days: []
        });
        setOpenShiftDialog(true);
    }, []);

    const handleEditShift = useCallback((shift) => {
        setEditingShift(shift);
        setShiftFormData({
            name: shift.name || '',
            start_time: shift.start_time || '',
            end_time: shift.end_time || '',
            description: shift.description || '',
            applicable_days: shift.applicable_days || []
        });
        setOpenShiftDialog(true);
        setShiftMenuAnchor(null);
        setMenuShiftDay(null); // Reset day context for edit
    }, []);

    const handleSaveShift = useCallback(async () => {
        try {
            const formatTimeForAPI = (time) => {
                if (!time) return '';
                if (time.includes(':') && time.split(':').length === 3) {
                    return time;
                }
                if (time.includes(':') && time.split(':').length === 2) {
                    return time + ':00';
                }
                return time;
            };

            const submitData = {
                name: shiftFormData.name?.trim() || '',
                start_time: formatTimeForAPI(shiftFormData.start_time),
                end_time: formatTimeForAPI(shiftFormData.end_time),
                description: shiftFormData.description?.trim() || '',
                applicable_days: Array.isArray(shiftFormData.applicable_days) ? shiftFormData.applicable_days : []
            };

            if (editingShift) {
                const originalDays = editingShift.applicable_days || [];
                const newDays = submitData.applicable_days.filter(day => !originalDays.includes(day));

                if (newDays.length > 0) {
                    const otherShiftsWithSameNameAndTime = shifts.filter(s =>
                        s.id !== editingShift.id &&
                        !s.is_deleted &&
                        s.name === submitData.name &&
                        s.start_time === submitData.start_time &&
                        s.end_time === submitData.end_time
                    );

                    if (otherShiftsWithSameNameAndTime.length > 0) {
                        const conflictingDays = [];
                        otherShiftsWithSameNameAndTime.forEach(otherShift => {
                            otherShift.applicable_days?.forEach(day => {
                                if (newDays.includes(day) && !conflictingDays.includes(day)) {
                                    conflictingDays.push(day);
                                }
                            });
                        });

                        if (conflictingDays.length > 0) {
                            const conflictingDaysLabels = conflictingDays.map(day => WEEKDAY_LABELS[day] || day).join(', ');
                            setAlert({
                                open: true,
                                type: 'error',
                                title: 'Lỗi trùng thời gian',
                                message: `Không thể thêm các ngày mới (${conflictingDaysLabels}) vào ca "${submitData.name}" vì đã có ca khác (ID: ${otherShiftsWithSameNameAndTime.map(s => s.id).join(', ')}) trùng thời gian vào các ngày này. Vui lòng chọn ngày khác hoặc xóa ca trùng trước.`
                            });
                            return;
                        }
                    }
                }

                const response = await workShiftApi.updateWorkShift(editingShift.id, submitData);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Cập nhật ca làm việc thành công!'
                    });
                    setOpenShiftDialog(false);
                    await loadShifts();
                    await loadSlots();
                }
            } else {
                const response = await workShiftApi.createWorkShift(submitData);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Tạo ca làm việc thành công!'
                    });
                    setOpenShiftDialog(false);
                    await loadShifts();
                    await loadSlots();
                }
            }
        } catch (error) {
            let errorMessage = error.message || 'Không thể lưu ca làm việc';

            if (editingShift && errorMessage.includes('trùng thời gian')) {
                const originalDays = editingShift.applicable_days || [];
                const newDays = shiftFormData.applicable_days.filter(day => !originalDays.includes(day));

                const conflictingDaysMatch = errorMessage.match(/vào các ngày: ([A-Z, ]+)/);
                if (conflictingDaysMatch) {
                    const conflictingDaysStr = conflictingDaysMatch[1];
                    const conflictingDays = conflictingDaysStr.split(',').map(d => d.trim());

                    const allConflictingDaysAreOriginal = conflictingDays.every(day => originalDays.includes(day));
                    const hasNewDays = newDays.length > 0;
                    const newDaysConflicts = conflictingDays.filter(day => newDays.includes(day));

                    if (allConflictingDaysAreOriginal && hasNewDays && newDaysConflicts.length === 0) {
                        try {
                            await loadShifts();
                            await loadSlots();

                            setAlert({
                                open: true,
                                type: 'success',
                                title: 'Thành công',
                                message: 'Cập nhật ca làm việc thành công!'
                            });
                            setOpenShiftDialog(false);
                            return;
                        } catch (reloadError) {
                            // Continue to show error
                        }
                    }
                }
            }

            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: errorMessage
            });
        }
    }, [editingShift, shiftFormData, shifts, loadShifts, loadSlots]);

    const handleDeleteShift = useCallback((shift) => {
        if (!menuShiftDay) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể xác định ngày cần xóa. Vui lòng thử lại.'
            });
            return;
        }
        setDeleteShiftTarget(shift);
        setConfirmDeleteShiftOpen(true);
        setShiftMenuAnchor(null);
    }, [menuShiftDay]);

    const handleConfirmDeleteShift = useCallback(async () => {
        try {
            const shift = deleteShiftTarget;
            const currentDay = menuShiftDay;

            if (!shift) {
                throw new Error('Không tìm thấy ca làm việc');
            }

            if (!currentDay) {
                const response = await workShiftApi.deleteWorkShift(shift.id);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Xóa ca làm việc thành công!'
                    });
                }
                await loadShifts();
                await loadSlots();
                return;
            }

            if (shift.applicable_days && shift.applicable_days.length === 1) {
                const response = await workShiftApi.deleteWorkShift(shift.id);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Xóa ca làm việc thành công!'
                    });
                }
            } else if (shift.applicable_days && Array.isArray(shift.applicable_days)) {
                const updatedDays = shift.applicable_days.filter(day => day !== currentDay);

                if (updatedDays.length === 0) {
                    const response = await workShiftApi.deleteWorkShift(shift.id);
                    if (response.success) {
                        setAlert({
                            open: true,
                            type: 'success',
                            title: 'Thành công',
                            message: 'Xóa ca làm việc thành công!'
                        });
                    }
                } else {
                    const formatTimeForAPI = (time) => {
                        if (!time) return '';
                        if (time.includes(':') && time.split(':').length === 3) {
                            return time;
                        }
                        if (time.includes(':') && time.split(':').length === 2) {
                            return time + ':00';
                        }
                        return time;
                    };

                    try {
                        const response = await workShiftApi.updateWorkShift(shift.id, {
                            name: shift.name || '',
                            start_time: formatTimeForAPI(shift.start_time),
                            end_time: formatTimeForAPI(shift.end_time),
                            description: shift.description || '',
                            applicable_days: updatedDays
                        });

                        if (response.success) {
                            setAlert({
                                open: true,
                                type: 'success',
                                title: 'Thành công',
                                message: `Đã xóa ca "${shift.name}" khỏi ${WEEKDAY_LABELS[currentDay]}!`
                            });
                        }
                    } catch (updateError) {
                        if (updateError.message && updateError.message.includes('trùng thời gian')) {
                            const deleteResponse = await workShiftApi.deleteWorkShift(shift.id);
                            if (deleteResponse.success) {
                                setAlert({
                                    open: true,
                                    type: 'success',
                                    title: 'Thành công',
                                    message: `Đã xóa toàn bộ ca "${shift.name}" (bao gồm tất cả các ngày)!`
                                });
                            }
                        } else {
                            throw updateError;
                        }
                    }
                }
            } else {
                const response = await workShiftApi.deleteWorkShift(shift.id);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Xóa ca làm việc thành công!'
                    });
                }
            }

            await loadShifts();
            await loadSlots();
        } catch (error) {
            let errorMessage = error.message || 'Không thể xóa ca làm việc';

            if (error.message && error.message.includes('trùng thời gian')) {
                errorMessage = `Không thể xóa ca khỏi ngày này vì có ca khác trùng thời gian vào các ngày còn lại. Vui lòng xóa toàn bộ ca nếu muốn xóa.`;
            } else if (error.response?.data?.message) {
                errorMessage = Array.isArray(error.response.data.message)
                    ? error.response.data.message.join('. ')
                    : error.response.data.message;
            } else if (error.response?.data?.error) {
                const errorData = error.response.data.error;
                errorMessage = Array.isArray(errorData) ? errorData.join('. ') : errorData;
            }

            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: errorMessage
            });
        } finally {
            setConfirmDeleteShiftOpen(false);
            setDeleteShiftTarget(null);
            setMenuShiftDay(null);
        }
    }, [deleteShiftTarget, menuShiftDay, loadShifts, loadSlots]);

    const getStatusLabel = useCallback((status) => {
        switch ((status || '').toUpperCase()) {
            case 'ACTIVE':
                return { text: 'Đang vận hành', color: COLORS.SUCCESS[700], bg: alpha(COLORS.SUCCESS[500], 0.1) };
            case 'INACTIVE':
                return { text: 'Tạm ngưng', color: COLORS.ERROR[700], bg: alpha(COLORS.ERROR[500], 0.1) };
            default:
                return { text: status || 'Không xác định', color: COLORS.TEXT.SECONDARY, bg: alpha(COLORS.GRAY[400], 0.15) };
        }
    }, []);

    const getActiveLabel = useCallback((isActive) => {
        return isActive
            ? { text: 'Kích hoạt', color: COLORS.INFO[700], bg: alpha(COLORS.INFO[500], 0.1) }
            : { text: 'Ngừng kích hoạt', color: COLORS.GRAY[700], bg: alpha(COLORS.GRAY[400], 0.2) };
    }, []);

    const handleOpenTeamDialog = useCallback(() => {
        setEditingTeam(null);
        setTeamFormData({
            name: '',
            description: '',
            leader_id: '',
            work_type_ids: [],
            is_active: true,
            status: 'ACTIVE'
        });
        setOpenTeamDialog(true);
    }, []);

    const handleOpenAssignWorkShiftModal = useCallback((team) => {
        if (!team) return;
        const existingShifts = (team.team_work_shifts || []).map(tws => {
            return tws.work_shift_id || tws.work_shift?.id || tws.id;
        }).filter(Boolean);
        setSelectedTeamForWorkShift(team);
        setSelectedWorkShiftIds(existingShifts);
        setOpenAssignWorkShiftModal(true);
    }, []);

    const handleCloseAssignWorkShiftModal = useCallback(() => {
        setOpenAssignWorkShiftModal(false);
        setSelectedTeamForWorkShift(null);
        setSelectedWorkShiftIds([]);
    }, []);

    const handleAssignWorkShifts = useCallback(async (workShiftIds) => {
        if (!selectedTeamForWorkShift) return;
        if (!Array.isArray(workShiftIds) || workShiftIds.length === 0) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Vui lòng chọn ít nhất một ca làm việc'
            });
            return;
        }
        setAssigningWorkShifts(true);
        try {
            await teamApi.assignTeamWorkShifts(selectedTeamForWorkShift.id, { work_shift_ids: workShiftIds });
            setAlert({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Phân ca cho nhóm thành công!'
            });
            handleCloseAssignWorkShiftModal();
            await loadTeams();
            await loadSlots();
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể phân ca cho nhóm'
            });
        } finally {
            setAssigningWorkShifts(false);
        }
    }, [selectedTeamForWorkShift, loadTeams, loadSlots]);

    const handleEditTeam = useCallback((team) => {
        setEditingTeam(team);
        setTeamFormData({
            name: team.name,
            description: team.description,
            leader_id: team.leader_id,
            work_type_ids: team.team_work_types?.map(wt => wt.work_type?.id || wt.work_type_id) || [],
            is_active: team.is_active ?? true,
            status: team.status || 'ACTIVE'
        });
        setOpenTeamDialog(true);
        setTeamMenuAnchor(null);
    }, []);

    const handleSaveTeam = useCallback(async () => {
        try {
            if (editingTeam) {
                try {
                    const response = await teamApi.updateTeam(editingTeam.id, {
                        name: teamFormData.name?.trim(),
                        description: teamFormData.description?.trim(),
                        leader_id: teamFormData.leader_id,
                        work_type_ids: teamFormData.work_type_ids || [],
                        is_active: teamFormData.is_active ?? true,
                        status: teamFormData.status || 'ACTIVE'
                    });
                    if (response.success) {
                        setAlert({
                            open: true,
                            type: 'success',
                            title: 'Thành công',
                            message: 'Cập nhật nhóm thành công!'
                        });
                        setOpenTeamDialog(false);
                        await loadTeams();
                        await loadSlots();
                        return;
                    } else {
                        throw new Error(response.message || 'Không thể cập nhật nhóm');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật nhóm';
                    setAlert({
                        open: true,
                        type: 'error',
                        title: 'Lỗi',
                        message: `Không thể cập nhật nhóm: ${errorMessage}`
                    });
                    return;
                }
            } else {
                try {
                    const createTeamData = {
                        name: teamFormData.name?.trim(),
                        description: teamFormData.description?.trim(),
                        leader_id: teamFormData.leader_id,
                        work_type_ids: teamFormData.work_type_ids || [],
                        status: teamFormData.status || 'ACTIVE'
                    };

                    if (!createTeamData.name || !createTeamData.name.trim()) {
                        setAlert({
                            open: true,
                            type: 'error',
                            title: 'Lỗi',
                            message: 'Tên nhóm là bắt buộc và không được để trống.'
                        });
                        return;
                    }
                    if (!createTeamData.description || !createTeamData.description.trim()) {
                        setAlert({
                            open: true,
                            type: 'error',
                            title: 'Lỗi',
                            message: 'Mô tả là bắt buộc và không được để trống.'
                        });
                        return;
                    }
                    if (!createTeamData.leader_id) {
                        setAlert({
                            open: true,
                            type: 'error',
                            title: 'Lỗi',
                            message: 'Trưởng nhóm là bắt buộc. Vui lòng chọn trưởng nhóm.'
                        });
                        return;
                    }
                    if (!Array.isArray(createTeamData.work_type_ids) || createTeamData.work_type_ids.length === 0) {
                        setAlert({
                            open: true,
                            type: 'error',
                            title: 'Lỗi',
                            message: 'Phải chọn ít nhất một loại công việc.'
                        });
                        return;
                    }

                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(createTeamData.leader_id)) {
                        setAlert({
                            open: true,
                            type: 'error',
                            title: 'Lỗi',
                            message: 'Trưởng nhóm không hợp lệ. Vui lòng chọn lại trưởng nhóm.'
                        });
                        return;
                    }
                    for (const workTypeId of createTeamData.work_type_ids) {
                        if (!uuidRegex.test(workTypeId)) {
                            setAlert({
                                open: true,
                                type: 'error',
                                title: 'Lỗi',
                                message: 'Một hoặc nhiều loại công việc không hợp lệ. Vui lòng chọn lại.'
                            });
                            return;
                        }
                    }

                    const response = await teamApi.createTeam(createTeamData);

                    if (!response.success) {
                        throw new Error(response.message || 'Không thể tạo nhóm');
                    }

                    if (!response.data || !response.data.id) {
                        throw new Error('API không trả về ID nhóm mới tạo');
                    }

                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Tạo nhóm thành công!'
                    });

                    setOpenTeamDialog(false);
                    await loadTeams();
                    await loadSlots();
                } catch (error) {
                    let errorMessage = 'Không thể tạo nhóm';

                    if (error.message) {
                        errorMessage = error.message;
                    } else if (error.response?.data) {
                        const errorData = error.response.data;
                        if (errorData.message) {
                            errorMessage = Array.isArray(errorData.message)
                                ? errorData.message.join('. ')
                                : errorData.message;
                        } else if (errorData.error) {
                            errorMessage = Array.isArray(errorData.error)
                                ? errorData.error.join('. ')
                                : errorData.error;
                        } else if (errorData.detail) {
                            errorMessage = errorData.detail;
                        } else if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        }
                    }

                    setAlert({
                        open: true,
                        type: 'error',
                        title: 'Lỗi',
                        message: errorMessage
                    });
                    return;
                }
            }
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể lưu nhóm'
            });
        }
    }, [editingTeam, teamFormData, loadTeams, loadSlots]);

    const handleOpenTeamMembersModal = useCallback(async (team) => {
        setSelectedTeamForMembers(team);

        try {
            const response = await teamApi.getTeamMembers(team.id);
            if (response.success) {
                const membersWithDefaultActive = response.data.map(member => ({
                    ...member,
                    is_active: member.is_active === false ? false : (member.is_active ?? true)
                }));
                setTeamMembers(membersWithDefaultActive);
                setOriginalTeamMembers(JSON.parse(JSON.stringify(membersWithDefaultActive)));
            }
        } catch (error) {
            setTeamMembers([]);
            setOriginalTeamMembers([]);
        }

        setMemberSearchQuery('');
        setMemberRoleFilter('all');
        setMemberSkillFilter('all');
        setOpenTeamMembersModal(true);
        setTeamMenuAnchor(null);
    }, []);

    const handleAddMember = useCallback((employee) => {
        setTeamMembers(prev => {
            const alreadyExists = prev.some(m =>
            (m.employee?.id || m.employee_id) === employee.id
        );
            if (alreadyExists) return prev;

        const newMember = {
            employee_id: employee.id,
            employee: employee,
                is_active: true,
            team: null,
            daily_schedules: []
        };
            return [...prev, newMember];
        });
    }, []);

    const handleRemoveMember = useCallback((employeeId) => {
        setTeamMembers(prev => prev.filter(m =>
            (m.employee?.id || m.employee_id) !== employeeId
        ));
    }, []);

    const handleToggleMemberStatus = useCallback((employeeId) => {
        setTeamMembers(prev => prev.map(m => {
            const memberId = m.employee?.id || m.employee_id;
            if (memberId === employeeId) {
                const currentActive = m.is_active !== undefined ? m.is_active : true;
                return { ...m, is_active: !currentActive };
            }
            return m;
        }));
    }, []);

    const handleSaveTeamMembers = useCallback(async () => {
        try {
            const teamId = selectedTeamForMembers.id;

            const addedMembers = teamMembers.filter(m =>
                !originalTeamMembers.some(om =>
                    (om.employee?.id || om.employee_id) === (m.employee?.id || m.employee_id)
                )
            ).map(m => ({ employee_id: m.employee?.id || m.employee_id }));

            const removedMembers = originalTeamMembers.filter(om =>
                !teamMembers.some(m =>
                    (m.employee?.id || m.employee_id) === (om.employee?.id || om.employee_id)
                )
            );

            const updatedMembers = teamMembers.filter(m => {
                const original = originalTeamMembers.find(om =>
                    (om.employee?.id || om.employee_id) === (m.employee?.id || m.employee_id)
                );
                return original && original.is_active !== m.is_active;
            }).map(m => ({
                employee_id: m.employee?.id || m.employee_id,
                is_active: m.is_active
            }));

            if (addedMembers.length > 0) {
                await teamApi.addTeamMembers(teamId, addedMembers);
            }

            if (updatedMembers.length > 0) {
                await teamApi.updateTeamMembers(teamId, updatedMembers);
            }

            for (const member of removedMembers) {
                const teamMemberId = member.id || member.team_member_id;
                if (teamMemberId) {
                    await teamApi.removeTeamMember(teamMemberId);
                }
            }

            setAlert({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Cập nhật thành viên nhóm thành công!'
            });

            setOpenTeamMembersModal(false);
            await loadTeams();
            await loadSlots();
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thành viên nhóm'
            });
        }
    }, [selectedTeamForMembers, teamMembers, originalTeamMembers, loadTeams, loadSlots]);

    const handleShiftMenuOpen = useCallback((event, shift, day) => {
        setShiftMenuAnchor(event.currentTarget);
        setMenuShift(shift);
        setMenuShiftDay(day); // Store the day context
    }, []);

    const handleShiftMenuClose = useCallback(() => {
        setShiftMenuAnchor(null);
    }, []);

    const handleTeamMenuOpen = useCallback((event, team, shiftContext = null) => {
        setTeamMenuAnchor(event.currentTarget);
        setMenuTeam(team);
        setMenuTeamShiftContext(shiftContext);
    }, []);

    const handleTeamMenuClose = useCallback(() => {
        setTeamMenuAnchor(null);
        setMenuTeam(null);
        setMenuTeamShiftContext(null);
    }, []);

    const handleOpenTeamWorkShiftsManagement = useCallback((team) => {
        setSelectedTeamForWorkShiftsManagement(team);
        setOpenTeamWorkShiftsManagementModal(true);
        setTeamMenuAnchor(null);
    }, []);

    const handleCloseTeamWorkShiftsManagement = useCallback(() => {
        setOpenTeamWorkShiftsManagementModal(false);
        setSelectedTeamForWorkShiftsManagement(null);
    }, []);

    const handleTeamWorkShiftsUpdate = useCallback(async () => {
        await loadTeams();
    }, [loadTeams]);

    const handleDeleteTeam = useCallback((team) => {
        setDeleteTeamTarget(team);
        setConfirmDeleteTeamOpen(true);
        setTeamMenuAnchor(null);
    }, []);

    const handleConfirmDeleteTeam = useCallback(async () => {
        try {
            const team = deleteTeamTarget;

            if (!team) {
                throw new Error('Không tìm thấy team');
            }

            const response = await teamApi.deleteTeam(team.id);
            if (response.success) {
                setAlert({
                    open: true,
                    type: 'success',
                    title: 'Thành công',
                    message: 'Xóa team thành công!'
                });
            }
            await loadTeams();
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa team'
            });
        } finally {
            setConfirmDeleteTeamOpen(false);
            setDeleteTeamTarget(null);
        }
    }, [deleteTeamTarget, loadTeams]);

    const handleDeleteTeamWorkShift = useCallback((team, shift) => {
        if (!team || !shift) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể xác định team hoặc ca làm việc'
            });
            return;
        }

        const teamWorkShift = team.team_work_shifts?.find(tws => {
            const workShiftId = tws.work_shift_id || tws.work_shift?.id;
            return workShiftId === shift.id;
        });

        if (!teamWorkShift || !teamWorkShift.id) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Không tìm thấy thông tin ca làm việc của team này'
            });
            return;
        }

        setDeleteTeamWorkShiftTarget({
            teamWorkShiftId: teamWorkShift.id,
            teamName: team.name,
            shiftName: shift.name
        });
        setConfirmDeleteTeamWorkShiftOpen(true);
        setTeamMenuAnchor(null);
    }, []);

    const handleConfirmDeleteTeamWorkShift = useCallback(async () => {
        try {
            const target = deleteTeamWorkShiftTarget;

            if (!target || !target.teamWorkShiftId) {
                throw new Error('Không tìm thấy thông tin ca làm việc');
            }

            const response = await teamApi.deleteTeamWorkShift(target.teamWorkShiftId);
            if (response.success) {
                setAlert({
                    open: true,
                    type: 'success',
                    title: 'Thành công',
                    message: `Đã xóa ca "${target.shiftName}" khỏi team "${target.teamName}"!`
                });
            }
            await loadTeams();
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa ca làm việc khỏi team'
            });
        } finally {
            setConfirmDeleteTeamWorkShiftOpen(false);
            setDeleteTeamWorkShiftTarget(null);
        }
    }, [deleteTeamWorkShiftTarget, loadTeams]);

    const formatTime = useCallback((time) => {
        if (!time) return '';
        return time.substring(0, 5);
    }, []);

    if (isLoading) {
        return <Loading fullScreen variant="cafe" />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY, mb: 0.5 }}>
                    Quản lý ca làm việc
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                    Lập lịch và quản lý ca làm việc của nhân viên
                </Typography>
            </Box>

            {/* Statistics Cards */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: 2.5,
                    mb: 4,
                    width: '100%',
                    overflow: 'visible'
                }}
            >
                {[
                    { label: 'Tổng số ca', value: stats.totalShifts, color: COLORS.PRIMARY[500], valueColor: COLORS.PRIMARY[500] },
                    { label: 'Ca đang hoạt động', value: stats.activeShifts, color: COLORS.SUCCESS[500], valueColor: COLORS.SUCCESS[500] },
                    { label: 'Tổng số nhóm', value: stats.totalTeams, color: COLORS.INFO[500], valueColor: COLORS.INFO[600] },
                    { label: 'Nhân viên phân công', value: stats.totalAssignments, color: COLORS.WARNING[500], valueColor: COLORS.WARNING[700] }
                ].map((stat, index) => {
                    const cardWidth = `calc((100% - ${3 * 20}px) / 4)`;
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
                            <Card
                                sx={{
                                    borderTop: `4px solid ${stat.color}`,
                                    borderRadius: 2,
                                    height: '100%',
                                    boxShadow: `4px 6px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}, 0 4px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}, 2px 2px 4px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`
                                }}
                            >
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color={stat.valueColor}>
                                        {stat.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Box>

            {/* Filters and Actions */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                <TextField
                    size="small"
                    placeholder="Tìm ca làm việc, nhân viên..."
                    value={searchQuery}
                    onChange={(e) => {
                        startTransition(() => {
                            setSearchQuery(e.target.value);
                        });
                    }}
                    InputProps={{
                        startAdornment: <Search sx={{ color: COLORS.GRAY[400], mr: 0.5, fontSize: 20 }} />
                    }}
                    sx={{ minWidth: { xs: '100%', sm: 1350 }, flexGrow: { xs: 1, sm: 0 } }}
                />
                {isPending && (
                    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
                        <Chip
                            label="Đang tìm kiếm..."
                            size="small"
                            sx={{
                                bgcolor: COLORS.INFO[500],
                                color: 'white',
                                fontWeight: 600
                            }}
                        />
                    </Box>
                )}
                <Box sx={{ flexGrow: { xs: 0, sm: 1 } }} />
                <Button
                    variant="contained"
                    startIcon={<Schedule />}
                    onClick={handleOpenShiftDialog}
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] },
                        textTransform: 'none',
                        fontWeight: 600,
                        height: 40,
                        px: 2.5
                    }}
                >
                    Tạo ca làm việc
                </Button>
                <Button
                    variant="contained"
                    startIcon={<GroupAdd />}
                    onClick={handleOpenTeamDialog}
                    sx={{
                        bgcolor: COLORS.SUCCESS[500],
                        '&:hover': { bgcolor: COLORS.SUCCESS[600] },
                        textTransform: 'none',
                        fontWeight: 600,
                        height: 40,
                        px: 2.5
                    }}
                >
                    Tạo nhóm
                </Button>
            </Stack>

            {/* New Teams Section */}
            {newTeams.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Box
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            color: 'white',
                            p: 2,
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0
                        }}
                    >
                        <Typography variant="h6" fontWeight={700}>
                            Các team mới
                        </Typography>
                        <Chip
                            label={`${newTeams.length} team chưa được phân công`}
                            sx={{
                                bgcolor: 'white',
                                color: COLORS.WARNING[700],
                                fontWeight: 600
                            }}
                        />
                    </Box>
                    <Paper
                        sx={{
                            borderRadius: '0 0 8px 8px',
                            boxShadow: `0 2px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                            p: 3
                        }}
                    >
                        <Grid container spacing={2}>
                            {newTeams.map((team) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={team.id}>
                                    <Card
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: `2px solid ${COLORS.WARNING[300]}`,
                                            borderRadius: 2,
                                            bgcolor: alpha(COLORS.WARNING[50], 0.3),
                                            '&:hover': {
                                                boxShadow: `0 4px 12px ${alpha(COLORS.WARNING[300], 0.3)}`,
                                                borderColor: COLORS.WARNING[500]
                                            },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color={COLORS.WARNING[700]} sx={{ mb: 0.5 }}>
                                                        {team.name}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                        {(() => {
                                                            const statusMeta = getStatusLabel(team.status);
                                                            return (
                                                                <Chip
                                                                    label={statusMeta.text}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.6rem',
                                                                        bgcolor: statusMeta.bg,
                                                                        color: statusMeta.color
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                        {(() => {
                                                            const activeMeta = getActiveLabel(team.is_active);
                                                            return (
                                                                <Chip
                                                                    label={activeMeta.text}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.6rem',
                                                                        bgcolor: activeMeta.bg,
                                                                        color: activeMeta.color
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                    </Stack>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleTeamMenuOpen(e, team)}
                                                    sx={{
                                                        p: 0.5,
                                                        '&:hover': {
                                                            bgcolor: alpha(COLORS.WARNING[500], 0.1)
                                                        }
                                                    }}
                                                >
                                                    <MoreVert sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>

                                            {/* Description */}
                                            {team.description && (
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                                                        {team.description}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Leader */}
                                            {team.leader && (
                                                <Box sx={{ mb: team.team_members && team.team_members.length > 0 ? 1 : 0 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Person sx={{ fontSize: 14, color: COLORS.GRAY[500] }} />
                                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                            Leader: {team.leader.full_name || 'N/A'}
                                                        </Typography>
                                                    </Stack>
                                                    {(() => {
                                                        const members = team.team_members
                                                            ?.filter(m => {
                                                                const memberId = m.employee?.id || m.employee_id;
                                                                return memberId && memberId !== team.leader_id;
                                                            })
                                                            .map(m => ({
                                                                id: m.employee?.id || m.employee_id,
                                                                name: m.employee?.full_name || m.full_name
                                                            }))
                                                            .filter(m => m.id && m.name);
                                                        if (!members || members.length === 0) {
                                                            return null;
                                                        }
                                                        return (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                                                    Thành viên ({members.length}):
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.5 }}>
                                                                    {members.map((member, idx) => (
                                                                        <Chip
                                                                            key={member.id || idx}
                                                                            label={member.name}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 22,
                                                                                fontSize: '0.65rem',
                                                                                bgcolor: alpha(COLORS.PRIMARY[100], idx % 2 === 0 ? 0.7 : 0.4),
                                                                                color: COLORS.PRIMARY[800],
                                                                                fontWeight: 600
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        );
                                                    })()}
                                                </Box>
                                            )}

                                            {/* Warning message */}
                                            <Box sx={{ mt: 'auto', pt: 1.5, borderTop: `1px dashed ${COLORS.WARNING[300]}` }}>
                                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                                                    {(() => {
                                                        const hasWorkShifts = (team.team_work_shifts?.length || 0) > 0;
                                                        const hasMembers = (team.team_members?.filter(m => {
                                                            const memberId = m.employee?.id || m.employee_id;
                                                            return memberId && memberId !== team.leader_id;
                                                        }).length || 0) > 0;
                                                        let message = '⚠️ Chưa có ca làm việc và thành viên';
                                                        if (hasWorkShifts && !hasMembers) {
                                                            message = '⚠️ Chưa có thành viên';
                                                        } else if (!hasWorkShifts && hasMembers) {
                                                            message = '⚠️ Chưa có ca làm việc';
                                                        }
                                                        return (
                                                            <Typography variant="caption" color={COLORS.WARNING[700]} fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                                                                {message}
                                                            </Typography>
                                                        );
                                                    })()}
                                                </Stack>
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Schedule />}
                                                        onClick={() => handleOpenAssignWorkShiftModal(team)}
                                                        disabled={(() => {
                                                            const membersCount = (team.team_members?.filter(m => {
                                                                const memberId = m.employee?.id || m.employee_id;
                                                                return memberId && memberId !== team.leader_id;
                                                            }).length || 0);
                                                            return membersCount === 0;
                                                        })()}
                                                        sx={{
                                                            flex: 1,
                                                            textTransform: 'none',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            borderColor: COLORS.PRIMARY[500],
                                                            color: COLORS.PRIMARY[700],
                                                            '&:hover': {
                                                                borderColor: COLORS.PRIMARY[600],
                                                                bgcolor: alpha(COLORS.PRIMARY[500], 0.1)
                                                            },
                                                            '&.Mui-disabled': {
                                                                borderColor: COLORS.GRAY[300],
                                                                color: COLORS.GRAY[400]
                                                            }
                                                        }}
                                                    >
                                                        Phân ca
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PersonAdd />}
                                                        onClick={() => handleOpenTeamMembersModal(team)}
                                                        sx={{
                                                            flex: 1,
                                                            textTransform: 'none',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            borderColor: COLORS.SUCCESS[500],
                                                            color: COLORS.SUCCESS[700],
                                                            '&:hover': {
                                                                borderColor: COLORS.SUCCESS[600],
                                                                bgcolor: alpha(COLORS.SUCCESS[500], 0.1)
                                                            }
                                                        }}
                                                    >
                                                        Quản lý thành viên
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Box>
            )}

            {/* Schedule by Day */}
            <Stack spacing={3}>
                {WEEKDAYS.map((day) => {
                    const dayShifts = scheduleByDay[day] || [];

                    if (dayShifts.length === 0) return null;

                    return (
                        <Box key={day}>
                            {/* Day Header */}
                            <Box
                                sx={{
                                    bgcolor: COLORS.PRIMARY[500],
                                    color: 'white',
                                    p: 2,
                                    borderRadius: '8px 8px 0 0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography variant="h6" fontWeight={700}>
                                    {WEEKDAY_LABELS[day]}
                                </Typography>
                                <Chip
                                    label={`${dayShifts.length} ca làm việc`}
                                    sx={{
                                        bgcolor: 'white',
                                        color: COLORS.PRIMARY[700],
                                        fontWeight: 600
                                    }}
                                />
                            </Box>

                            {/* Day Content */}
                            <Paper
                                sx={{
                                    borderRadius: '0 0 8px 8px',
                                    boxShadow: `0 2px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`
                                }}
                            >
                                <Stack spacing={3} sx={{ p: 3 }}>
                                    {dayShifts.map((shift, shiftIndex) => {
                                        const shiftColors = [
                                            COLORS.PRIMARY[500],
                                            COLORS.SUCCESS[500],
                                            COLORS.INFO[500],
                                            COLORS.WARNING[500],
                                            COLORS.ERROR[400]
                                        ];
                                        const color = shiftColors[shiftIndex % shiftColors.length];

                                        return (
                                            <Box
                                                key={shift.id}
                                                sx={{
                                                    borderRadius: 2,
                                                    borderLeft: `4px solid ${color}`,
                                                    bgcolor: alpha(color, 0.03),
                                                    boxShadow: `0 2px 6px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                                                    p: 2.25
                                                }}
                                            >
                                            {/* Shift Info */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    mb: 2
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1.5}
                                                            alignItems="center"
                                                            sx={{ mb: 1 }}
                                                        >
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={800}
                                                                sx={{ color }}
                                                            >
                                                            {shift.name}
                                                        </Typography>
                                                            <Stack
                                                                direction="row"
                                                                spacing={0.5}
                                                                alignItems="center"
                                                                sx={{
                                                                    px: 1,
                                                                    py: 0.25,
                                                                    borderRadius: 999,
                                                                    bgcolor: alpha(color, 0.08)
                                                                }}
                                                            >
                                                                <AccessTime sx={{ fontSize: 16, color }} />
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600 }}
                                                                >
                                                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                            </Typography>
                                                        </Stack>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleShiftMenuOpen(e, shift, day)}
                                                        >
                                                            <MoreVert fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {shift.description}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Teams Section */}
                                            <Box>
                                                {(() => {
                                                    const shiftTeams = getTeamsForShift(shift, day);
                                                    return (
                                                        <>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                                                <Groups sx={{ fontSize: 20, color: COLORS.PRIMARY[500] }} />
                                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                                    Nhóm làm việc
                                                                </Typography>
                                                                <Chip
                                                                    label={shiftTeams.length}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                        color: COLORS.PRIMARY[700],
                                                                        fontWeight: 600,
                                                                        fontSize: '0.7rem'
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </>
                                                    );
                                                })()}

                                                {/* Teams Grid */}
                                                {(() => {
                                                    const shiftTeams = getTeamsForShift(shift, day);
                                                    return shiftTeams.length === 0 ? (
                                                        <Box
                                                            sx={{
                                                                textAlign: 'center',
                                                                py: 3,
                                                                bgcolor: alpha(COLORS.GRAY[100], 0.3),
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <Typography variant="body2" color="text.secondary">
                                                                Chưa có nhóm nào được phân công
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
                                                            {shiftTeams.map((team) => (
                                                                <Grid item xs={12} sm={6} md={3} lg={3} key={team.id} sx={{ display: 'flex' }}>
                                                                    <Card
                                                                        sx={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            border: `1px solid ${COLORS.GRAY[200]}`,
                                                                            borderRadius: 2,
                                                                            '&:hover': {
                                                                                boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`,
                                                                                borderColor: COLORS.PRIMARY[300]
                                                                            },
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                                                <Box sx={{ flex: 1 }}>
                                                                                    <Typography variant="subtitle2" fontWeight={700} color={COLORS.PRIMARY[700]} sx={{ mb: 0.5 }}>
                                                                                        {team.name}
                                                                                    </Typography>
                                                                                    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                        {(() => {
                                                                                            const statusMeta = getStatusLabel(team.status);
                                                                                            return (
                                                                                                <Chip
                                                                                                    label={statusMeta.text}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        height: 18,
                                                                                                        fontSize: '0.6rem',
                                                                                                        bgcolor: statusMeta.bg,
                                                                                                        color: statusMeta.color
                                                                                                    }}
                                                                                                />
                                                                                            );
                                                                                        })()}
                                                                                        {(() => {
                                                                                            const activeMeta = getActiveLabel(team.is_active);
                                                                                            return (
                                                                                                <Chip
                                                                                                    label={activeMeta.text}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        height: 18,
                                                                                                        fontSize: '0.6rem',
                                                                                                        bgcolor: activeMeta.bg,
                                                                                                        color: activeMeta.color
                                                                                                    }}
                                                                                                />
                                                                                            );
                                                                                        })()}
                                                                                    </Stack>
                                                                                </Box>
                                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                    <Chip
                                                                                        label={`${(team.team_members?.filter(m => {
                                                                                            const memberId = m.employee?.id || m.employee_id;
                                                                                            return memberId && memberId !== team.leader_id;
                                                                                        }).length || 0) + 1} người`}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            height: 20,
                                                                                            fontSize: '0.65rem',
                                                                                            bgcolor: alpha(COLORS.INFO[500], 0.1),
                                                                                            color: COLORS.INFO[700]
                                                                                        }}
                                                                                    />
                                                                                    <IconButton
                                                                                        size="small"
                                                                                            onClick={(e) => handleTeamMenuOpen(e, team, shift)}
                                                                                        sx={{
                                                                                            p: 0.5,
                                                                                            '&:hover': {
                                                                                                bgcolor: alpha(COLORS.PRIMARY[500], 0.1)
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <MoreVert sx={{ fontSize: 16 }} />
                                                                                    </IconButton>
                                                                                </Stack>
                                                                            </Stack>

                                                                            {/* Description */}
                                                                            {team.description && (
                                                                                <Box sx={{ mb: 1.5 }}>
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                                                                                        {team.description}
                                                                                    </Typography>
                                                                                </Box>
                                                                            )}

                                                                            {/* Work Types */}
                                                                            {team.team_work_types && team.team_work_types.length > 0 && (
                                                                                <Box sx={{ mb: 1.5 }}>
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                                                                        Loại công việc:
                                                                                    </Typography>
                                                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                        {team.team_work_types.map((twt) => (
                                                                                            <Chip
                                                                                                key={twt.id || twt.work_type_id}
                                                                                                label={twt.work_type?.name || 'N/A'}
                                                                                                size="small"
                                                                                                sx={{
                                                                                                    height: 20,
                                                                                                    fontSize: '0.65rem',
                                                                                                    bgcolor: alpha(COLORS.SUCCESS[500], 0.1),
                                                                                                    color: COLORS.SUCCESS[700],
                                                                                                    fontWeight: 500
                                                                                                }}
                                                                                            />
                                                                                        ))}
                                                                                    </Stack>
                                                                                </Box>
                                                                            )}

                                                                            {/* Leader */}
                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                    <Person sx={{ fontSize: 14, color: COLORS.GRAY[500] }} />
                                                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                                        Leader: {team.leader?.full_name || 'N/A'}
                                                                                    </Typography>
                                                                                </Stack>
                                                                            </Box>

                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                    Ngày làm việc:
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                    {(() => {
                                                                                        const allWorkingDays = new Set();
                                                                                        if (team.team_work_shifts && Array.isArray(team.team_work_shifts)) {
                                                                                            team.team_work_shifts.forEach(tws => {
                                                                                                if (tws.work_shift && Array.isArray(tws.work_shift.applicable_days)) {
                                                                                                    tws.work_shift.applicable_days.forEach(day => allWorkingDays.add(day));
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        const sortedDays = WEEKDAYS.filter(day => allWorkingDays.has(day));
                                                                                        return sortedDays.length > 0 ? (
                                                                                            sortedDays.map((d) => (
                                                                                                <Chip
                                                                                                    key={d}
                                                                                                    label={WEEKDAY_LABELS[d]}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        height: 20,
                                                                                                        fontSize: '0.65rem',
                                                                                                        bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                                                        color: COLORS.PRIMARY[700]
                                                                                                    }}
                                                                                                />
                                                                                            ))
                                                                                        ) : (
                                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                                                Chưa có lịch làm việc
                                                                                            </Typography>
                                                                                        );
                                                                                    })()}
                                                                                </Stack>
                                                                            </Box>

                                                                            {/* Team Members */}
                                                                            <Box sx={{ mt: 'auto' }}>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                    Thành viên ({(team.team_members?.filter(m => {
                                                                                        const memberId = m.employee?.id || m.employee_id;
                                                                                        return memberId && memberId !== team.leader_id;
                                                                                    }).length || 0) + (team.leader ? 1 : 0)}):
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                    {/* Leader */}
                                                                                    {team.leader && (
                                                                                        <Chip
                                                                                            label={team.leader.full_name}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 22,
                                                                                                fontSize: '0.7rem',
                                                                                                bgcolor: alpha(COLORS.PRIMARY[100], 0.8),
                                                                                                color: COLORS.PRIMARY[700],
                                                                                                fontWeight: 600
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                    {/* Other Members - exclude leader */}
                                                                                    {team.team_members?.filter(member => {
                                                                                        const memberId = member.employee?.id || member.employee_id;
                                                                                        return memberId !== team.leader_id;
                                                                                    }).map((member, idx) => (
                                                                                        <Chip
                                                                                            key={member.employee?.id || member.employee_id || idx}
                                                                                            label={member.employee?.full_name}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 22,
                                                                                                fontSize: '0.7rem',
                                                                                                bgcolor: alpha(COLORS.GRAY[100], 0.8)
                                                                                            }}
                                                                                        />
                                                                                    ))}
                                                                                </Stack>
                                                                            </Box>
                                                                        </CardContent>
                                                                    </Card>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    );
                                                })()}
                                            </Box>

                                            {/* Divider between shifts */}
                                            {dayShifts.indexOf(shift) < dayShifts.length - 1 && (
                                                <Divider sx={{ mt: 3 }} />
                                            )}
                                        </Box>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        </Box>
                    );
                })}
            </Stack>

            {/* Shift Menu */}
            <Menu
                anchorEl={shiftMenuAnchor}
                open={Boolean(shiftMenuAnchor)}
                onClose={handleShiftMenuClose}
            >
                <MenuItem onClick={() => handleEditShift(menuShift)}>
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.PRIMARY[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDeleteShift(menuShift)}>
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa</ListItemText>
                </MenuItem>
            </Menu>

            {/* Team Menu */}
            <Menu
                anchorEl={teamMenuAnchor}
                open={Boolean(teamMenuAnchor)}
                onClose={handleTeamMenuClose}
            >
                <MenuItem onClick={() => handleEditTeam(menuTeam)}>
                    <ListItemIcon>
                        <Edit fontSize="small" sx={{ color: COLORS.PRIMARY[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa nhóm</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleOpenTeamMembersModal(menuTeam)}>
                    <ListItemIcon>
                        <PersonAdd fontSize="small" sx={{ color: COLORS.SUCCESS[600] }} />
                    </ListItemIcon>
                    <ListItemText>Quản lý thành viên</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleOpenTeamWorkShiftsManagement(menuTeam)}>
                    <ListItemIcon>
                        <Schedule fontSize="small" sx={{ color: COLORS.PRIMARY[600] }} />
                    </ListItemIcon>
                    <ListItemText>Chỉnh sửa ca làm việc</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleDeleteTeam(menuTeam)}>
                    <ListItemIcon>
                        <Delete fontSize="small" sx={{ color: COLORS.ERROR[600] }} />
                    </ListItemIcon>
                    <ListItemText>Xóa team</ListItemText>
                </MenuItem>
            </Menu>

            {/* Shift Form Modal */}
            <ShiftFormModal
                open={openShiftDialog}
                onClose={() => setOpenShiftDialog(false)}
                editingShift={editingShift}
                formData={shiftFormData}
                onFormChange={setShiftFormData}
                onSave={handleSaveShift}
            />

            {/* Team Form Modal */}
            <TeamFormModal
                open={openTeamDialog}
                onClose={() => setOpenTeamDialog(false)}
                editingTeam={editingTeam}
                formData={teamFormData}
                loading={false}
                onFormChange={setTeamFormData}
                onSave={handleSaveTeam}
                allEmployees={allEmployees}
                allWorkTypes={allWorkTypes}
            />

            <TeamAssignWorkShiftModal
                open={openAssignWorkShiftModal}
                onClose={handleCloseAssignWorkShiftModal}
                team={selectedTeamForWorkShift}
                workShifts={shifts}
                initialSelected={selectedWorkShiftIds}
                loading={assigningWorkShifts}
                onSubmit={handleAssignWorkShifts}
            />
            {/* Team Members Modal */}
            <TeamMembersModal
                open={openTeamMembersModal}
                onClose={() => setOpenTeamMembersModal(false)}
                team={selectedTeamForMembers}
                currentShift={null}
                teamMembers={teamMembers}
                originalTeamMembers={originalTeamMembers}
                allStaff={allEmployees}
                searchQuery={memberSearchQuery}
                roleFilter={memberRoleFilter}
                skillFilter={memberSkillFilter}
                loading={false}
                onSearchChange={setMemberSearchQuery}
                onRoleFilterChange={setMemberRoleFilter}
                onSkillFilterChange={setMemberSkillFilter}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onToggleMemberStatus={handleToggleMemberStatus}
                onSave={handleSaveTeamMembers}
            />

            {/* Team Work Shifts Management Modal */}
            <TeamWorkShiftsManagementModal
                open={openTeamWorkShiftsManagementModal}
                onClose={handleCloseTeamWorkShiftsManagement}
                team={selectedTeamForWorkShiftsManagement}
                allWorkShifts={shifts}
                onUpdate={handleTeamWorkShiftsUpdate}
                    />

            {/* Confirm Delete Shift */}
            <ConfirmModal
                isOpen={confirmDeleteShiftOpen}
                onClose={() => {
                    setConfirmDeleteShiftOpen(false);
                    setDeleteShiftTarget(null);
                    setMenuShiftDay(null);
                }}
                onConfirm={handleConfirmDeleteShift}
                title="Xác nhận xóa ca làm việc"
                message={
                    deleteShiftTarget && menuShiftDay
                        ? (deleteShiftTarget.applicable_days && deleteShiftTarget.applicable_days.length === 1
                            ? `Bạn có chắc chắn muốn xóa ca "${deleteShiftTarget.name}"? (Ca này chỉ có 1 ngày nên sẽ bị xóa hoàn toàn)`
                            : `Bạn có chắc chắn muốn xóa ca "${deleteShiftTarget.name}" khỏi ${WEEKDAY_LABELS[menuShiftDay]}?`)
                        : `Bạn có chắc chắn muốn xóa ca "${deleteShiftTarget?.name}"?`
                }
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Confirm Delete Team Modal */}
            <ConfirmModal
                isOpen={confirmDeleteTeamOpen}
                onClose={() => {
                    setConfirmDeleteTeamOpen(false);
                    setDeleteTeamTarget(null);
                }}
                onConfirm={handleConfirmDeleteTeam}
                title="Xác nhận xóa team"
                message={`Bạn có chắc chắn muốn xóa team "${deleteTeamTarget?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />

            {/* Confirm Delete Team Work Shift Modal */}
            <ConfirmModal
                isOpen={confirmDeleteTeamWorkShiftOpen}
                onClose={() => {
                    setConfirmDeleteTeamWorkShiftOpen(false);
                    setDeleteTeamWorkShiftTarget(null);
                }}
                onConfirm={handleConfirmDeleteTeamWorkShift}
                title="Xác nhận xóa ca làm việc"
                message={deleteTeamWorkShiftTarget ? `Bạn có chắc chắn muốn xóa ca "${deleteTeamWorkShiftTarget.shiftName}" khỏi team "${deleteTeamWorkShiftTarget.teamName}"?` : ''}
                confirmText="Xóa"
                cancelText="Hủy"
                type="warning"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default WorkShiftPage;
