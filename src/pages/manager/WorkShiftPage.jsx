import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Stack, IconButton, Button, Avatar, Grid, Card, CardContent, Tooltip, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import ShiftFormModal from '../../components/modals/ShiftFormModal';
import TeamFormModal from '../../components/modals/TeamFormModal';
import TeamMembersModal from '../../components/modals/TeamMembersModal';
import { Edit, Delete, Schedule, Add, AccessTime, GroupAdd, Groups, CheckCircle, People, Search, MoreVert, Person, PersonAdd } from '@mui/icons-material';
import workShiftApi, { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';
import teamApi from '../../api/teamApi';
import employeeApi from '../../api/employeeApi';
import workTypeApi from '../../api/workTypeApi';

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
        is_active: true,
        applicable_days: []
    });

    // Teams states
    const [teams, setTeams] = useState([]);
    const [slots, setSlots] = useState([]);
    const [openTeamDialog, setOpenTeamDialog] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [teamFormData, setTeamFormData] = useState({
        name: '',
        description: '',
        leader_id: '',
        work_type_ids: [],
        work_shift_ids: [],
        scheduleMatrix: {},
        is_active: true
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

    // Menu states
    const [shiftMenuAnchor, setShiftMenuAnchor] = useState(null);
    const [menuShift, setMenuShift] = useState(null);
    const [teamMenuAnchor, setTeamMenuAnchor] = useState(null);
    const [menuTeam, setMenuTeam] = useState(null);

    // View and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Load data from API
    useEffect(() => {
        loadShifts();
        loadTeams();
        loadSlots();
        loadEmployees();
        loadWorkTypes();
    }, []);

    const loadShifts = async () => {
        try {
            setIsLoading(true);
            const response = await workShiftApi.getWorkShifts();
            if (response.success) {
                setShifts(response.data);
            }
        } catch (error) {
            console.error('Error loading shifts:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể tải danh sách ca làm việc'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadTeams = async () => {
        try {
            const response = await teamApi.getTeams();
            if (response.success) {
                setTeams(response.data);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
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

    // Build schedule: Group shifts by day
    const scheduleByDay = useMemo(() => {
        const schedule = {};

        WEEKDAYS.forEach(day => {
            schedule[day] = shifts
                .filter(shift => shift.applicable_days && shift.applicable_days.includes(day))
                .filter(shift => {
                    const matchesSearch = shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        shift.description.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter === 'all' ||
                        (statusFilter === 'active' && shift.is_active) ||
                        (statusFilter === 'inactive' && !shift.is_active);
                    return matchesSearch && matchesStatus;
                })
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return schedule;
    }, [shifts, searchQuery, statusFilter]);

    // Helper: Get teams for a shift based on slots
    const getTeamsForShift = (shift, day) => {
        // Normalize time format (HH:MM:SS or HH:MM to HH:MM)
        const normalizeTime = (time) => {
            if (!time) return '';
            return time.substring(0, 5); // Get HH:MM part only
        };

        const shiftStartTime = normalizeTime(shift.start_time);
        const shiftEndTime = normalizeTime(shift.end_time);

        // Filter slots that match this shift's day and time
        const matchingSlots = slots.filter(slot => {
            const slotStartTime = normalizeTime(slot.start_time);
            const slotEndTime = normalizeTime(slot.end_time);

            return slot.day_of_week === day &&
                slotStartTime === shiftStartTime &&
                slotEndTime === shiftEndTime;
        });

        // Get unique team IDs
        const teamIds = [...new Set(matchingSlots.map(slot => slot.team_id))];

        // Return teams that have slots in this shift
        return teams.filter(team => teamIds.includes(team.id));
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalShifts = shifts.length;
        const activeShifts = shifts.filter(s => s.is_active).length;
        const totalTeams = teams.length;

        // Count total staff assignments based on current team data
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
    }, [shifts, teams]);

    // Shift CRUD handlers
    const handleOpenShiftDialog = () => {
        setEditingShift(null);
        setShiftFormData({
            name: '',
            start_time: '',
            end_time: '',
            description: '',
            is_active: true,
            applicable_days: []
        });
        setOpenShiftDialog(true);
    };

    const handleEditShift = (shift) => {
        setEditingShift(shift);
        setShiftFormData({
            name: shift.name,
            start_time: shift.start_time,
            end_time: shift.end_time,
            description: shift.description,
            is_active: shift.is_active,
            applicable_days: shift.applicable_days || []
        });
        setOpenShiftDialog(true);
        setShiftMenuAnchor(null);
    };

    const handleSaveShift = async () => {
        try {
            if (editingShift) {
                const response = await workShiftApi.updateWorkShift(editingShift.id, shiftFormData);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Cập nhật ca làm việc thành công!'
                    });
                }
            } else {
                const response = await workShiftApi.createWorkShift(shiftFormData);
                if (response.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Tạo ca làm việc thành công!'
                    });
                }
            }
            setOpenShiftDialog(false);
            await loadShifts();
            await loadSlots();
        } catch (error) {
            console.error('Error saving shift:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể lưu ca làm việc'
            });
        }
    };

    const handleDeleteShift = (shift) => {
        setDeleteShiftTarget(shift);
        setConfirmDeleteShiftOpen(true);
        setShiftMenuAnchor(null);
    };

    const handleConfirmDeleteShift = async () => {
        try {
            const response = await workShiftApi.deleteWorkShift(deleteShiftTarget.id);
            if (response.success) {
                setAlert({
                    open: true,
                    type: 'success',
                    title: 'Thành công',
                    message: 'Xóa ca làm việc thành công!'
                });
                await loadShifts();
                await loadSlots();
            }
        } catch (error) {
            console.error('Error deleting shift:', error);
            setAlert({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: error.message || 'Không thể xóa ca làm việc'
            });
        } finally {
            setConfirmDeleteShiftOpen(false);
            setDeleteShiftTarget(null);
        }
    };

    // Team CRUD handlers
    const handleOpenTeamDialog = () => {
        setEditingTeam(null);
        setTeamFormData({
            name: '',
            description: '',
            leader_id: '',
            work_type_ids: [],
            work_shift_ids: [],
            scheduleMatrix: {},
            is_active: true
        });
        setOpenTeamDialog(true);
    };

    const handleEditTeam = (team) => {
        setEditingTeam(team);
        setTeamFormData({
            name: team.name,
            description: team.description,
            leader_id: team.leader_id,
            work_type_ids: team.team_work_types?.map(wt => wt.work_type?.id || wt.work_type_id) || [],
            is_active: team.is_active ?? true
        });
        setOpenTeamDialog(true);
        setTeamMenuAnchor(null);
    };

    const handleSaveTeam = async () => {
        try {
            if (editingTeam) {
                const response = await teamApi.updateTeam(editingTeam.id, teamFormData);
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
                }
            } else {
                // Create team first
                const response = await teamApi.createTeam(teamFormData);

                if (response.success) {
                    const newTeamId = response.data.id;

                    // Then assign work shifts to the team
                    if (teamFormData.work_shift_ids && teamFormData.work_shift_ids.length > 0) {
                        try {
                            await teamApi.assignTeamWorkShifts(newTeamId, {
                                work_shift_ids: teamFormData.work_shift_ids
                            });
                        } catch (shiftError) {
                            console.error('Error assigning work shifts:', shiftError);
                            // Show warning but don't fail the whole operation
                            setAlert({
                                open: true,
                                type: 'warning',
                                title: 'Cảnh báo',
                                message: 'Tạo nhóm thành công nhưng không thể phân công ca làm việc. Vui lòng thử lại sau.'
                            });
                            setOpenTeamDialog(false);
                            await loadTeams();
                            await loadSlots();
                            return;
                        }
                    }

                    setAlert({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: 'Tạo nhóm và phân công ca làm việc thành công!'
                    });
                }
            }
            setOpenTeamDialog(false);
            await loadTeams();
            await loadSlots();
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
                setTeamMembers(response.data);
                setOriginalTeamMembers(JSON.parse(JSON.stringify(response.data))); // Deep copy
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            setTeamMembers([]);
            setOriginalTeamMembers([]);
        }

        setMemberSearchQuery('');
        setMemberRoleFilter('all');
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
            is_active: true
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
                return { ...m, is_active: !m.is_active };
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
    const handleShiftMenuOpen = (event, shift) => {
        setShiftMenuAnchor(event.currentTarget);
        setMenuShift(shift);
    };

    const handleShiftMenuClose = () => {
        setShiftMenuAnchor(null);
        setMenuShift(null);
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
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderTop: `4px solid ${COLORS.PRIMARY[500]}`,
                            borderRadius: 2,
                            boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                        }}
                    >
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng số ca
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={COLORS.PRIMARY[500]}>
                                {stats.totalShifts}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderTop: `4px solid ${COLORS.SUCCESS[500]}`,
                            borderRadius: 2,
                            boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                        }}
                    >
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Ca đang hoạt động
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={COLORS.SUCCESS[500]}>
                                {stats.activeShifts}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderTop: `4px solid ${COLORS.INFO[500]}`,
                            borderRadius: 2,
                            boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                        }}
                    >
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tổng số nhóm
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={COLORS.INFO[600]}>
                                {stats.totalTeams}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderTop: `4px solid ${COLORS.WARNING[500]}`,
                            borderRadius: 2,
                            boxShadow: `0 2px 8px ${alpha(COLORS.SHADOW.LIGHT, 0.1)}`
                        }}
                    >
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nhân viên phân công
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={COLORS.WARNING[700]}>
                                {stats.totalAssignments}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

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
                    sx={{ flex: 1, maxWidth: 400 }}
                />
                <TextField
                    select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Trạng thái"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Không hoạt động</MenuItem>
                </TextField>
                <Box sx={{ flexGrow: 1 }} />
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
                                                        <Chip
                                                            label={shift.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: shift.is_active
                                                                    ? alpha(COLORS.SUCCESS[500], 0.1)
                                                                    : alpha(COLORS.GRAY[500], 0.1),
                                                                color: shift.is_active ? COLORS.SUCCESS[700] : COLORS.GRAY[700],
                                                                fontWeight: 600,
                                                                height: 24
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleShiftMenuOpen(e, shift)}
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
                                                        <Grid container spacing={2}>
                                                            {shiftTeams.map((team) => (
                                                                <Grid item xs={12} sm={6} md={4} lg={3} key={team.id}>
                                                                    <Card
                                                                        sx={{
                                                                            border: `1px solid ${COLORS.GRAY[200]}`,
                                                                            borderRadius: 2,
                                                                            '&:hover': {
                                                                                boxShadow: `0 4px 12px ${alpha(COLORS.SHADOW.LIGHT, 0.15)}`,
                                                                                borderColor: COLORS.PRIMARY[300]
                                                                            },
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        <CardContent sx={{ p: 2 }}>
                                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                                                <Typography variant="subtitle2" fontWeight={700} color={COLORS.PRIMARY[700]}>
                                                                                    {team.name}
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                    <Chip
                                                                                        label={`${(team.team_members?.length || 0) + 1} người`}
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

                                                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                                                                                <Person sx={{ fontSize: 14, color: COLORS.GRAY[500] }} />
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Leader: {team.leader?.full_name || 'N/A'}
                                                                                </Typography>
                                                                            </Stack>

                                                                            {/* Working Days */}
                                                                            <Box sx={{ mb: 1 }}>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                    Ngày làm việc:
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                    {shift.applicable_days?.map((d) => (
                                                                                        <Chip
                                                                                            key={d}
                                                                                            label={WEEKDAY_LABELS[d]}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 20,
                                                                                                fontSize: '0.65rem',
                                                                                                bgcolor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                                                color: COLORS.PRIMARY[700],
                                                                                                mb: 0.5
                                                                                            }}
                                                                                        />
                                                                                    ))}
                                                                                </Stack>
                                                                            </Box>

                                                                            {/* Team Members */}
                                                                            <Box>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                    Thành viên ({(team.team_members?.length || 0) + 1}):
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                                    {/* Leader */}
                                                                                    {team.leader && (
                                                                                        <Chip
                                                                                            avatar={
                                                                                                <Avatar
                                                                                                    src={team.leader.avatar_url || undefined}
                                                                                                    sx={{ width: 20, height: 20, bgcolor: COLORS.PRIMARY[500] }}
                                                                                                >
                                                                                                    {!team.leader.avatar_url && team.leader.full_name?.charAt(0)}
                                                                                                </Avatar>
                                                                                            }
                                                                                            label={team.leader.full_name}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 24,
                                                                                                fontSize: '0.7rem',
                                                                                                bgcolor: alpha(COLORS.PRIMARY[100], 0.8),
                                                                                                color: COLORS.PRIMARY[700],
                                                                                                fontWeight: 600,
                                                                                                mb: 0.5
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                    {/* Other Members */}
                                                                                    {team.team_members?.map((member, idx) => (
                                                                                        <Chip
                                                                                            key={idx}
                                                                                            avatar={
                                                                                                <Avatar
                                                                                                    src={member.employee?.avatar_url || undefined}
                                                                                                    sx={{ width: 20, height: 20, bgcolor: COLORS.GRAY[400] }}
                                                                                                >
                                                                                                    {!member.employee?.avatar_url && member.employee?.full_name?.charAt(0)}
                                                                                                </Avatar>
                                                                                            }
                                                                                            label={member.employee?.full_name}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 24,
                                                                                                fontSize: '0.7rem',
                                                                                                bgcolor: alpha(COLORS.GRAY[100], 0.8),
                                                                                                mb: 0.5
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
                allWorkShifts={shifts}
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
                loading={false}
                onSearchChange={setMemberSearchQuery}
                onRoleFilterChange={setMemberRoleFilter}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onToggleMemberStatus={handleToggleMemberStatus}
                onSave={handleSaveTeamMembers}
            />

            {/* Confirm Delete Shift */}
            <ConfirmModal
                open={confirmDeleteShiftOpen}
                onClose={() => setConfirmDeleteShiftOpen(false)}
                onConfirm={handleConfirmDeleteShift}
                title="Xác nhận xóa ca làm việc"
                message={`Bạn có chắc chắn muốn xóa ca "${deleteShiftTarget?.name}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
            />

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </Box>
    );
};

export default WorkShiftPage;
