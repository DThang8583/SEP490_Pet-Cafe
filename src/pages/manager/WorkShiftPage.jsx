import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Stack, IconButton, Button, Avatar, Grid, Card, CardContent, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import Pagination from '../../components/common/Pagination';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import ShiftFormModal from '../../components/modals/ShiftFormModal';
import TeamFormModal from '../../components/modals/TeamFormModal';
import TeamMembersModal from '../../components/modals/TeamMembersModal';
import { Edit, Delete, Schedule, AccessTime, GroupAdd, Groups, Search, MoreVert, Person, PersonAdd, Book, Assignment, Event, CalendarToday, Email, Phone, Work } from '@mui/icons-material';
import workShiftApi, { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';
import teamApi from '../../api/teamApi';
import employeeApi from '../../api/employeeApi';
import workTypeApi from '../../api/workTypeApi';
import TeamAssignWorkShiftModal from '../../components/modals/TeamAssignWorkShiftModal';
import TeamAssignMembersModal from '../../components/modals/TeamAssignMembersModal';

const WorkShiftPage = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Alert modal
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Confirm modals
    const [confirmDeleteShiftOpen, setConfirmDeleteShiftOpen] = useState(false);
    const [deleteShiftTarget, setDeleteShiftTarget] = useState(null);

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

    // Pagination states for Teams (main pagination)
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

    // Teams states
    const [teams, setTeams] = useState([]);
    const [newTeams, setNewTeams] = useState([]); // Teams without workshifts and members
    const [loadingNewTeams, setLoadingNewTeams] = useState(false);
    const [slots, setSlots] = useState([]);
    const [openTeamDialog, setOpenTeamDialog] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [openAssignWorkShiftModal, setOpenAssignWorkShiftModal] = useState(false);
    const [selectedTeamForWorkShift, setSelectedTeamForWorkShift] = useState(null);
    const [selectedWorkShiftIds, setSelectedWorkShiftIds] = useState([]);
    const [assigningWorkShifts, setAssigningWorkShifts] = useState(false);
    const [openAssignMembersModal, setOpenAssignMembersModal] = useState(false);
    const [selectedTeamForAssignMembers, setSelectedTeamForAssignMembers] = useState(null);
    const [assignMembersExcludedIds, setAssignMembersExcludedIds] = useState([]);
    const [assignMembersFetching, setAssignMembersFetching] = useState(false);
    const [assigningMembers, setAssigningMembers] = useState(false);
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

    // Menu states
    const [shiftMenuAnchor, setShiftMenuAnchor] = useState(null);
    const [menuShift, setMenuShift] = useState(null);
    const [menuShiftDay, setMenuShiftDay] = useState(null); // Store the day context when opening menu
    const [teamMenuAnchor, setTeamMenuAnchor] = useState(null);
    const [menuTeam, setMenuTeam] = useState(null);

    // View and filter states
    const [searchQuery, setSearchQuery] = useState('');

    // Load data from API
    useEffect(() => {
        loadShifts();
        loadTeams();
        loadNewTeams();
        loadSlots();
        loadEmployees();
        loadWorkTypes();
    }, []);

    // Reload teams when pagination changes
    useEffect(() => {
        loadTeams();
    }, [page, itemsPerPage]);

    const loadShifts = async () => {
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
            console.error('Error loading shifts:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc'
            });
        }
    };

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            // Fetch teams with pagination
            // API uses 'page' and 'limit' parameters (not page_index and page_size)
            const response = await teamApi.getTeams({
                page: page - 1, // API uses 0-based index, UI uses 1-based
                limit: itemsPerPage
                // Explicitly NOT passing: is_active, working_day, start_working_time, end_working_time, work_type_id
                // This ensures we get all teams regardless of their status
            });

            if (!response.success || !Array.isArray(response.data)) {
                console.warn('loadTeams: invalid response', response);
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
                            console.warn(`Failed to load data for team ${team.id} (${team.name}):`, error);
                            return {
                                ...team,
                                team_members: [],
                                team_work_shifts: []
                            };
                        }
                    })
                );

                setTeams(teamsWithData);
            } else {
                setTeams([]);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
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
    };

    const loadSlots = async () => {
        try {
            const response = await teamApi.getAllTeamSlots();
            if (response.success) {
                setSlots(response.data);
            }
        } catch (error) {
            console.error('Error loading slots:', error);
        }
    };

    const loadEmployees = async () => {
        try {
            const response = await employeeApi.getEmployees();
            if (response.success) {
                setAllEmployees(response.data);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    };

    const loadWorkTypes = async () => {
        try {
            const response = await workTypeApi.getWorkTypes();
            if (response.success) {
                setAllWorkTypes(response.data);
            }
        } catch (error) {
            console.error('Error loading work types:', error);
        }
    };

    const loadNewTeams = async () => {
        try {
            setLoadingNewTeams(true);
            // Fetch all teams across multiple pages
            const allTeams = [];
            let pageIndex = 0;
            let hasNext = true;
            const pageSize = 100;

            while (hasNext && pageIndex < 50) {
                try {
                    const response = await teamApi.getTeams({
                        page: pageIndex,
                        limit: pageSize
                    });

                    if (response.success && Array.isArray(response.data)) {
                        allTeams.push(...response.data);
                        const pagination = response.pagination || {};
                        hasNext = pagination.has_next === true || pagination.has_next === 'true';
                        pageIndex++;

                        if (!hasNext || allTeams.length >= (pagination.total_items_count || 0)) {
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

            // Enrich teams with members and workshifts data
            const teamsWithData = await Promise.all(
                allTeams.map(async (team) => {
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
                        console.warn(`Failed to load data for team ${team.id}:`, error);
                        return {
                            ...team,
                            team_members: [],
                            team_work_shifts: []
                        };
                    }
                })
            );

            // Filter teams that are missing members or workshifts (excluding leader)
            const filteredNewTeams = teamsWithData.filter(team => {
                const hasWorkShifts = (team.team_work_shifts?.length || 0) > 0;
                const hasMembers = (team.team_members?.filter(m => {
                    const memberId = m.employee?.id || m.employee_id;
                    return memberId && memberId !== team.leader_id;
                }).length || 0) > 0;
                return !(hasWorkShifts && hasMembers);
            });

            setNewTeams(filteredNewTeams);
        } catch (error) {
            console.error('Error loading new teams:', error);
            setNewTeams([]);
        } finally {
            setLoadingNewTeams(false);
        }
    };

    // Build schedule: Group shifts by day
    const scheduleByDay = useMemo(() => {
        const schedule = {};

        WEEKDAYS.forEach(day => {
            schedule[day] = shifts
                .filter(shift => shift.applicable_days && shift.applicable_days.includes(day))
                .filter(shift => {
                    // Filter out deleted shifts
                    if (shift.is_deleted) return false;

                    const matchesSearch = shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        shift.description.toLowerCase().includes(searchQuery.toLowerCase());

                    return matchesSearch;
                })
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return schedule;
    }, [shifts, searchQuery]);

    // Helper: Get teams for a shift based on team_work_shifts
    const getTeamsForShift = (shift, day) => {
        if (!shift || !day || !teams || teams.length === 0) {
            return [];
        }

        // Filter teams that have this shift assigned and work on this day
        return teams.filter(team => {
            // Check if team has this work shift assigned
            const hasThisShift = team.team_work_shifts?.some(tws => {
                const workShift = tws?.work_shift;
                if (!workShift || workShift.id !== shift.id) {
                    return false;
                }

                // Check if shift's applicable_days includes the current day
                const applicableDays = Array.isArray(workShift.applicable_days) ? workShift.applicable_days : [];
                return applicableDays.includes(day);
            });

            return hasThisShift;
        });
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalShifts = shifts.length;
        // API doesn't have is_active field, so all shifts are considered active if not deleted
        const activeShifts = shifts.filter(s => !s.is_deleted).length;
        // Use pagination.total_items_count for total teams (from API), not teams.length (current page)
        const totalTeams = pagination.total_items_count || 0;

        // Count total staff assignments based on current team data (only current page)
        // Note: This is an approximation since we only have current page data
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

    // Shift CRUD handlers
    const handleOpenShiftDialog = () => {
        setEditingShift(null);
        setShiftFormData({
            name: '',
            start_time: '',
            end_time: '',
            description: '',
            applicable_days: []
        });
        setOpenShiftDialog(true);
    };

    const handleEditShift = (shift) => {
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
    };

    const handleSaveShift = async () => {
        try {
            // Helper to format time for API (ensure HH:mm:ss format)
            const formatTimeForAPI = (time) => {
                if (!time) return '';
                // If already in HH:mm:ss format, return as is
                if (time.includes(':') && time.split(':').length === 3) {
                    return time;
                }
                // If in HH:mm format, add :00 for seconds
                if (time.includes(':') && time.split(':').length === 2) {
                    return time + ':00';
                }
                return time;
            };

            // Prepare data according to API spec
            // API PUT work shift: { name, start_time, end_time, description, applicable_days }
            const submitData = {
                name: shiftFormData.name?.trim() || '',
                start_time: formatTimeForAPI(shiftFormData.start_time),
                end_time: formatTimeForAPI(shiftFormData.end_time),
                description: shiftFormData.description?.trim() || '',
                applicable_days: Array.isArray(shiftFormData.applicable_days) ? shiftFormData.applicable_days : []
            };

            if (editingShift) {
                // Get original days and new days being added
                const originalDays = editingShift.applicable_days || [];
                const newDays = submitData.applicable_days.filter(day => !originalDays.includes(day));

                // Only check for conflicts with NEW days being added (not existing days)
                if (newDays.length > 0) {
                    // Check if there are other shifts with same name and time (excluding current shift)
                    const otherShiftsWithSameNameAndTime = shifts.filter(s =>
                        s.id !== editingShift.id &&
                        !s.is_deleted &&
                        s.name === submitData.name &&
                        s.start_time === submitData.start_time &&
                        s.end_time === submitData.end_time
                    );

                    if (otherShiftsWithSameNameAndTime.length > 0) {
                        // Only check conflicts with NEW days
                        const conflictingDays = [];
                        otherShiftsWithSameNameAndTime.forEach(otherShift => {
                            otherShift.applicable_days?.forEach(day => {
                                // Only check if this day is in newDays (being added)
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
            console.error('Error saving shift:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                editingShift: editingShift?.id
            });

            // Display error message from API
            let errorMessage = error.message || 'Không thể lưu ca làm việc';

            // If editing and error is about time conflict, check if it's a false positive
            // (API checking the shift against itself for existing days)
            if (editingShift && errorMessage.includes('trùng thời gian')) {
                const originalDays = editingShift.applicable_days || [];
                const newDays = shiftFormData.applicable_days.filter(day => !originalDays.includes(day));

                // Extract conflicting days from error message (format: "vào các ngày: MONDAY, TUESDAY")
                const conflictingDaysMatch = errorMessage.match(/vào các ngày: ([A-Z, ]+)/);
                if (conflictingDaysMatch) {
                    const conflictingDaysStr = conflictingDaysMatch[1];
                    const conflictingDays = conflictingDaysStr.split(',').map(d => d.trim());

                    // Check if ALL conflicting days are in originalDays (already existed in the shift)
                    const allConflictingDaysAreOriginal = conflictingDays.every(day => originalDays.includes(day));

                    // Check if there are NEW days being added
                    const hasNewDays = newDays.length > 0;

                    // Check if any of the conflicting days are in newDays (newly added days)
                    const newDaysConflicts = conflictingDays.filter(day => newDays.includes(day));

                    // If all conflicting days are original days and no new days are conflicting,
                    // this is a false positive - API is checking the shift against itself
                    if (allConflictingDaysAreOriginal && hasNewDays && newDaysConflicts.length === 0) {
                        // Reload data to get the updated shift (API may have updated it despite the error)
                        try {
                            await loadShifts();
                            await loadSlots();

                            // Show success message
                            setAlert({
                                open: true,
                                type: 'success',
                                title: 'Thành công',
                                message: 'Cập nhật ca làm việc thành công!'
                            });
                            setOpenShiftDialog(false);
                            return;
                        } catch (reloadError) {
                            // Fall through to show error
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
    };

    const handleDeleteShift = (shift) => {
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
    };

    const handleConfirmDeleteShift = async () => {
        try {
            const shift = deleteShiftTarget;
            const currentDay = menuShiftDay;

            if (!shift) {
                throw new Error('Không tìm thấy ca làm việc');
            }

            if (!currentDay) {
                // If no day context, delete entire shift
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

            // Check if shift has only one day - if so, delete the entire shift
            if (shift.applicable_days && shift.applicable_days.length === 1) {
                // Delete entire shift if it only has one day
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
                // Remove the day from applicable_days
                const updatedDays = shift.applicable_days.filter(day => day !== currentDay);

                if (updatedDays.length === 0) {
                    // If no days left, delete the entire shift
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
                    // Update shift to remove the day
                    // Ensure time format is correct (HH:mm:ss)
                    const formatTimeForAPI = (time) => {
                        if (!time) return '';
                        // If already in HH:mm:ss format, return as is
                        if (time.includes(':') && time.split(':').length === 3) {
                            return time;
                        }
                        // If in HH:mm format, add :00 for seconds
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
                        // If update fails due to time conflict, delete the entire shift
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
                            // Re-throw other errors
                            throw updateError;
                        }
                    }
                }
            } else {
                // Fallback: delete entire shift if applicable_days is invalid
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
            console.error('Error deleting shift:', error);

            // Parse error message for time conflict
            let errorMessage = error.message || 'Không thể xóa ca làm việc';

            if (error.message && error.message.includes('trùng thời gian')) {
                // Time conflict error - provide more helpful message
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
    };

    // Team CRUD handlers
    const getStatusLabel = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'ACTIVE':
                return { text: 'Đang vận hành', color: COLORS.SUCCESS[700], bg: alpha(COLORS.SUCCESS[500], 0.1) };
            case 'INACTIVE':
                return { text: 'Tạm ngưng', color: COLORS.ERROR[700], bg: alpha(COLORS.ERROR[500], 0.1) };
            default:
                return { text: status || 'Không xác định', color: COLORS.TEXT.SECONDARY, bg: alpha(COLORS.GRAY[400], 0.15) };
        }
    };

    const getActiveLabel = (isActive) => {
        return isActive
            ? { text: 'Kích hoạt', color: COLORS.INFO[700], bg: alpha(COLORS.INFO[500], 0.1) }
            : { text: 'Ngừng kích hoạt', color: COLORS.GRAY[700], bg: alpha(COLORS.GRAY[400], 0.2) };
    };

    const handleOpenTeamDialog = () => {
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
    };

    const handleOpenAssignWorkShiftModal = (team) => {
        if (!team) return;
        const existingShifts = (team.team_work_shifts || []).map(tws => {
            return tws.work_shift_id || tws.work_shift?.id || tws.id;
        }).filter(Boolean);
        setSelectedTeamForWorkShift(team);
        setSelectedWorkShiftIds(existingShifts);
        setOpenAssignWorkShiftModal(true);
    };

    const handleCloseAssignWorkShiftModal = () => {
        setOpenAssignWorkShiftModal(false);
        setSelectedTeamForWorkShift(null);
        setSelectedWorkShiftIds([]);
    };

    const handleAssignWorkShifts = async (workShiftIds) => {
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
            await loadNewTeams();
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
    };

    const handleOpenAssignMembersQuick = async (team) => {
        if (!team) return;
        setSelectedTeamForAssignMembers(team);
        setOpenAssignMembersModal(true);
        setAssignMembersFetching(true);
        try {
            const response = await teamApi.getTeamMembers(team.id);
            if (response.success) {
                const existingIds = (response.data || [])
                    .map(member => member.employee?.id || member.employee_id)
                    .filter(Boolean);
                setAssignMembersExcludedIds(existingIds);
            } else {
                setAssignMembersExcludedIds([]);
            }
        } catch (error) {
            console.error('Error loading team members for assign modal:', error);
            setAssignMembersExcludedIds([]);
        } finally {
            setAssignMembersFetching(false);
        }
    };

    const handleCloseAssignMembersModal = () => {
        setOpenAssignMembersModal(false);
        setSelectedTeamForAssignMembers(null);
        setAssignMembersExcludedIds([]);
        setAssignMembersFetching(false);
    };

    const handleAssignMembers = async (memberIds) => {
        if (!selectedTeamForAssignMembers) return;
        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Vui lòng chọn ít nhất một nhân viên'
            });
            return;
        }
        setAssigningMembers(true);
        try {
            const payload = memberIds.map(id => ({ employee_id: id }));
            await teamApi.addTeamMembers(selectedTeamForAssignMembers.id, payload);
            setAlert({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Thêm thành viên vào nhóm thành công!'
            });
            handleCloseAssignMembersModal();
            await loadTeams();
            await loadNewTeams();
        } catch (error) {
            console.error('Error assigning members:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể thêm thành viên vào nhóm'
            });
        } finally {
            setAssigningMembers(false);
        }
    };

    const handleEditTeam = (team) => {
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
    };

    const handleSaveTeam = async () => {
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
                        await loadNewTeams();
                        await loadSlots();
                        return;
                    } else {
                        throw new Error(response.message || 'Không thể cập nhật nhóm');
                    }
                } catch (error) {
                    console.error('Error updating team:', error);
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
                // Create team first
                try {
                    // Prepare data for createTeam API - only send required fields
                    const createTeamData = {
                        name: teamFormData.name?.trim(),
                        description: teamFormData.description?.trim(),
                        leader_id: teamFormData.leader_id,
                        work_type_ids: teamFormData.work_type_ids || [],
                        status: teamFormData.status || 'ACTIVE'
                    };

                    // Validate data before sending
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

                    // Validate UUID format for leader_id and work_type_ids
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
                    await loadNewTeams();
                    await loadSlots();
                } catch (error) {
                    console.error('Error creating team:', error);

                    // Extract detailed error message
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

                    // Log full error in development
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Full error details:', {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status
                        });
                    }

                    setAlert({
                        open: true,
                        type: 'error',
                        title: 'Lỗi',
                        message: errorMessage
                    });
                    // Don't close dialog or reload on error - let user fix and retry
                    return;
                }
            }
        } catch (error) {
            console.error('Error saving team:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể lưu nhóm'
            });
        }
    };

    // Team Members Management handlers
    const handleOpenTeamMembersModal = async (team) => {
        setSelectedTeamForMembers(team);

        // Load team members
        try {
            const response = await teamApi.getTeamMembers(team.id);
            if (response.success) {
                // Ensure is_active is set to true by default if not provided or if it's null/undefined
                // API might return is_active: false or null, so we need to check for both undefined and null
                const membersWithDefaultActive = response.data.map(member => ({
                    ...member,
                    // If is_active is explicitly false, keep it. Otherwise default to true
                    is_active: member.is_active === false ? false : (member.is_active ?? true)
                }));
                setTeamMembers(membersWithDefaultActive);
                setOriginalTeamMembers(JSON.parse(JSON.stringify(membersWithDefaultActive))); // Deep copy
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            setTeamMembers([]);
            setOriginalTeamMembers([]);
        }

        setMemberSearchQuery('');
        setMemberRoleFilter('all');
        setMemberSkillFilter('all');
        setOpenTeamMembersModal(true);
        setTeamMenuAnchor(null);
    };

    const handleAddMember = (employee) => {
        // Check if already in team
        const alreadyExists = teamMembers.some(m =>
            (m.employee?.id || m.employee_id) === employee.id
        );

        if (alreadyExists) return;

        const newMember = {
            employee_id: employee.id,
            employee: employee,
            is_active: true, // New members are always active by default
            team: null,
            daily_schedules: []
        };

        setTeamMembers([...teamMembers, newMember]);
    };

    const handleRemoveMember = (employeeId) => {
        setTeamMembers(teamMembers.filter(m =>
            (m.employee?.id || m.employee_id) !== employeeId
        ));
    };

    const handleToggleMemberStatus = (employeeId) => {
        setTeamMembers(teamMembers.map(m => {
            const memberId = m.employee?.id || m.employee_id;
            if (memberId === employeeId) {
                // Toggle is_active, default to true if undefined
                const currentActive = m.is_active !== undefined ? m.is_active : true;
                return { ...m, is_active: !currentActive };
            }
            return m;
        }));
    };

    const handleSaveTeamMembers = async () => {
        try {
            const teamId = selectedTeamForMembers.id;

            // Find added members
            const addedMembers = teamMembers.filter(m =>
                !originalTeamMembers.some(om =>
                    (om.employee?.id || om.employee_id) === (m.employee?.id || m.employee_id)
                )
            ).map(m => ({ employee_id: m.employee?.id || m.employee_id }));

            // Find removed members
            const removedMembers = originalTeamMembers.filter(om =>
                !teamMembers.some(m =>
                    (m.employee?.id || m.employee_id) === (om.employee?.id || om.employee_id)
                )
            );

            // Find members with changed status
            const updatedMembers = teamMembers.filter(m => {
                const original = originalTeamMembers.find(om =>
                    (om.employee?.id || om.employee_id) === (m.employee?.id || m.employee_id)
                );
                return original && original.is_active !== m.is_active;
            }).map(m => ({
                employee_id: m.employee?.id || m.employee_id,
                is_active: m.is_active
            }));

            // Call APIs
            if (addedMembers.length > 0) {
                await teamApi.addTeamMembers(teamId, addedMembers);
            }

            if (updatedMembers.length > 0) {
                await teamApi.updateTeamMembers(teamId, updatedMembers);
            }

            for (const member of removedMembers) {
                const employeeId = member.employee?.id || member.employee_id;
                await teamApi.removeTeamMember(teamId, employeeId);
            }

            setAlert({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Cập nhật thành viên nhóm thành công!'
            });

            setOpenTeamMembersModal(false);
            await loadTeams(); // Reload to get updated data
            await loadNewTeams(); // Reload new teams list
            await loadSlots(); // Reload slots to reflect changes
        } catch (error) {
            console.error('Error saving team members:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể lưu thành viên nhóm'
            });
        }
    };

    // Menu handlers
    const handleShiftMenuOpen = (event, shift, day) => {
        setShiftMenuAnchor(event.currentTarget);
        setMenuShift(shift);
        setMenuShiftDay(day); // Store the day context
    };

    const handleShiftMenuClose = () => {
        setShiftMenuAnchor(null);
    };

    const handleTeamMenuOpen = (event, team) => {
        setTeamMenuAnchor(event.currentTarget);
        setMenuTeam(team);
    };

    const handleTeamMenuClose = () => {
        setTeamMenuAnchor(null);
        setMenuTeam(null);
    };

    // Format time
    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    if (isLoading) {
        return <Loading />;
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <Search sx={{ color: COLORS.GRAY[400], mr: 0.5, fontSize: 20 }} />
                    }}
                    sx={{ minWidth: { xs: '100%', sm: 1350 }, flexGrow: { xs: 1, sm: 0 } }}
                />
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
                                                        onClick={() => handleOpenAssignMembersQuick(team)}
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
                                                        Thêm thành viên
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
                                    {dayShifts.map((shift) => (
                                        <Box key={shift.id}>
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
                                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                        <Typography variant="h6" fontWeight={700}>
                                                            {shift.name}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <AccessTime sx={{ fontSize: 16, color: COLORS.GRAY[500] }} />
                                                            <Typography variant="body2" color="text.secondary">
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
                                                                                        onClick={(e) => handleTeamMenuOpen(e, team)}
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

                                                                            {/* Working Days - Show team's working days from team_work_shifts using applicable_days from API */}
                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                    Ngày làm việc:
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                    {(() => {
                                                                                        // Collect all applicable_days from work_shifts assigned to this team
                                                                                        // API chính thức chỉ có applicable_days, không có working_days
                                                                                        const allWorkingDays = new Set();
                                                                                        if (team.team_work_shifts && Array.isArray(team.team_work_shifts)) {
                                                                                            team.team_work_shifts.forEach(tws => {
                                                                                                // Use applicable_days from work_shift (API chính thức)
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
                                    ))}
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
            <TeamAssignMembersModal
                open={openAssignMembersModal}
                onClose={handleCloseAssignMembersModal}
                team={selectedTeamForAssignMembers}
                employees={allEmployees}
                excludedIds={assignMembersExcludedIds}
                loading={assignMembersFetching}
                submitting={assigningMembers}
                onSubmit={handleAssignMembers}
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

            {/* Pagination */}
            {pagination.total_items_count > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        page={page}
                        totalPages={pagination.total_pages_count}
                        onPageChange={setPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(newValue) => {
                            setItemsPerPage(newValue);
                            setPage(1);
                        }}
                        totalItems={pagination.total_items_count}
                    />
                </Box>
            )}

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
