import React from 'react';
import { Box, Typography, Stack, FormGroup, FormControlLabel, Checkbox, Button, Chip, Paper, IconButton, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Delete, ExpandMore, ChevronRight, Edit } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import slotApi from '../../../api/slotApi';
import workshiftApi from '../../../api/workshiftApi';

// ==================== TIME SLOT ASSIGNMENT ====================
const TimeSlotAssignment = ({ timeSlot, formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const assignment = formData.timeSlotAssignments[timeSlot] || { areaIds: [], petGroups: [], staffGroups: [] };
    const [expandedGroups, setExpandedGroups] = React.useState({});

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <Stack spacing={3}>
            {/* Areas */}
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Khu vực</Typography>
                <FormGroup>
                    {(areas || []).map(area => (
                        <FormControlLabel
                            key={area.id}
                            control={
                                <Checkbox
                                    checked={(assignment.areaIds || []).includes(area.id)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            timeSlotAssignments: {
                                                ...prev.timeSlotAssignments,
                                                [timeSlot]: {
                                                    ...assignment,
                                                    areaIds: checked
                                                        ? [...assignment.areaIds, area.id]
                                                        : assignment.areaIds.filter(id => id !== area.id)
                                                }
                                            }
                                        }));
                                    }}
                                />
                            }
                            label={area.name}
                        />
                    ))}
                </FormGroup>
            </Box>

            {/* Pet Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm pet</Typography>
                    <Button size="small" variant="outlined" onClick={() => openPetGroupDialog({ timeSlot })}>
                        Chọn nhóm pet
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(assignment.petGroups || []).map((pg, idx) => (
                        <Chip
                            key={idx}
                            label={`${pg.groupName} (${pg.count} con)`}
                            onDelete={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    timeSlotAssignments: {
                                        ...prev.timeSlotAssignments,
                                        [timeSlot]: {
                                            ...assignment,
                                            petGroups: assignment.petGroups.filter((_, i) => i !== idx)
                                        }
                                    }
                                }));
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Staff Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm nhân viên</Typography>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => openStaffGroupDialog({ timeSlot })}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Thêm nhóm NV
                    </Button>
                </Stack>

                {(assignment.staffGroups || []).map((sg, idx) => (
                    <Paper key={idx} sx={{ mb: 1, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                    <Typography variant="caption">
                                        {sg.staffIds?.length || 0} nhân viên | Leader: {staff.find(s => s.id === sg.leaderId)?.full_name || '—'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleGroup(idx)}
                                        sx={{ color: COLORS.PRIMARY[600] }}
                                    >
                                        {expandedGroups[idx] ? <ExpandMore /> : <ChevronRight />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => editStaffGroup({ timeSlot }, idx, sg)}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                timeSlotAssignments: {
                                                    ...prev.timeSlotAssignments,
                                                    [timeSlot]: {
                                                        ...assignment,
                                                        staffGroups: assignment.staffGroups.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Box>

                        {expandedGroups[idx] && (
                            <Box sx={{
                                px: 2,
                                pb: 2,
                                pt: 0,
                                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3)
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY, display: 'block', mb: 1, mt: 2 }}>
                                    Thành viên:
                                </Typography>
                                <Stack spacing={0.5}>
                                    {[...(sg.staffIds || [])].sort((a, b) => {
                                        // Sắp xếp: Leader lên đầu
                                        if (a === sg.leaderId) return -1;
                                        if (b === sg.leaderId) return 1;
                                        return 0;
                                    }).map(staffId => {
                                        const member = staff.find(s => s.id === staffId);
                                        const isLeader = staffId === sg.leaderId;
                                        return member ? (
                                            <Box key={staffId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    backgroundColor: isLeader ? COLORS.ERROR[500] : COLORS.SECONDARY[400]
                                                }} />
                                                <Typography variant="body2">
                                                    {member.full_name}
                                                    {isLeader && (
                                                        <Chip
                                                            label="Leader"
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: 18,
                                                                fontSize: '0.65rem',
                                                                backgroundColor: alpha(COLORS.ERROR[500], 0.1),
                                                                color: COLORS.ERROR[600]
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                            </Box>
                                        ) : null;
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                ))}
            </Box>
        </Stack>
    );
};

// ==================== SHIFT ASSIGNMENT (for Internal tasks with multiple shifts) ====================
const ShiftAssignment = ({ shift, formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const assignment = formData.shiftAssignments[shift] || { areaIds: [], petGroups: [], staffGroups: [] };
    const [expandedGroups, setExpandedGroups] = React.useState({});
    const [workShift, setWorkShift] = React.useState(null);
    const [staffShifts, setStaffShifts] = React.useState({});
    const [loadingStaff, setLoadingStaff] = React.useState(true);

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Fetch work shift details and staff shifts
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Get work shift details
                const shiftResponse = await workshiftApi.getShiftById(shift);
                if (shiftResponse.success) {
                    setWorkShift(shiftResponse.data);
                }

                // Get all staff shifts
                const shiftsMap = {};
                await Promise.all(
                    staff.map(async (s) => {
                        const response = await workshiftApi.getStaffShifts(s.id);
                        if (response.success) {
                            shiftsMap[s.id] = response.data.shifts || [];
                        }
                    })
                );
                setStaffShifts(shiftsMap);
            } catch (error) {
                console.error('Error fetching shift data:', error);
            } finally {
                setLoadingStaff(false);
            }
        };
        fetchData();
    }, [shift, staff]);

    // Utility: Check time overlap
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

    // Filter staff who have shifts that overlap with this work shift
    const availableStaff = React.useMemo(() => {
        if (!workShift || loadingStaff) return [];

        return staff.filter(s => {
            const shifts = staffShifts[s.id] || [];
            return shifts.some(staffShift =>
                checkTimeOverlap(workShift.start_time, workShift.end_time, staffShift.start_time, staffShift.end_time)
            );
        });
    }, [staff, workShift, staffShifts, loadingStaff]);

    return (
        <Stack spacing={3}>
            {/* Areas */}
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Khu vực</Typography>
                <FormGroup>
                    {(areas || []).map(area => (
                        <FormControlLabel
                            key={area.id}
                            control={
                                <Checkbox
                                    checked={(assignment.areaIds || []).includes(area.id)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            shiftAssignments: {
                                                ...prev.shiftAssignments,
                                                [shift]: {
                                                    ...assignment,
                                                    areaIds: checked
                                                        ? [...assignment.areaIds, area.id]
                                                        : assignment.areaIds.filter(id => id !== area.id)
                                                }
                                            }
                                        }));
                                    }}
                                />
                            }
                            label={`${area.name} (Sức chứa: ${area.capacity || 0})`}
                        />
                    ))}
                </FormGroup>
            </Box>

            {/* Pet Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm pet</Typography>
                    <Button size="small" variant="outlined" onClick={() => openPetGroupDialog({ shift })}>
                        Chọn nhóm pet
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(assignment.petGroups || []).map((pg, idx) => (
                        <Chip
                            key={idx}
                            label={`${pg.groupName} (${pg.count} con)`}
                            onDelete={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    shiftAssignments: {
                                        ...prev.shiftAssignments,
                                        [shift]: {
                                            ...assignment,
                                            petGroups: assignment.petGroups.filter((_, i) => i !== idx)
                                        }
                                    }
                                }));
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Staff Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm nhân viên</Typography>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => openStaffGroupDialog({ shift, availableStaff })}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Thêm nhóm NV
                    </Button>
                </Stack>

                {loadingStaff && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Đang tải danh sách nhân viên khả dụng...
                    </Alert>
                )}

                {!loadingStaff && workShift && availableStaff.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Không có nhân viên nào có ca làm trùng với ca làm việc này ({workShift.start_time} - {workShift.end_time})
                    </Alert>
                )}

                {!loadingStaff && workShift && availableStaff.length > 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Có <strong>{availableStaff.length}</strong> nhân viên có ca làm trùng với ca làm việc này
                    </Alert>
                )}

                {(assignment.staffGroups || []).map((sg, idx) => (
                    <Paper key={idx} sx={{ mb: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                    <Typography variant="caption">
                                        {sg.staffIds?.length || 0} nhân viên | Leader: {availableStaff.find(s => s.id === sg.leaderId)?.full_name || staff.find(s => s.id === sg.leaderId)?.full_name || '—'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleGroup(idx)}
                                        sx={{ color: COLORS.PRIMARY[600] }}
                                    >
                                        {expandedGroups[idx] ? <ExpandMore /> : <ChevronRight />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => editStaffGroup({ shift, groupIndex: idx, groupData: sg, availableStaff })}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                shiftAssignments: {
                                                    ...prev.shiftAssignments,
                                                    [shift]: {
                                                        ...assignment,
                                                        staffGroups: assignment.staffGroups.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Box>

                        {expandedGroups[idx] && (
                            <Box sx={{
                                px: 2,
                                pb: 2,
                                pt: 0,
                                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3)
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY, display: 'block', mb: 1, mt: 2 }}>
                                    Thành viên:
                                </Typography>
                                <Stack spacing={0.5}>
                                    {[...(sg.staffIds || [])].sort((a, b) => {
                                        if (a === sg.leaderId) return -1;
                                        if (b === sg.leaderId) return 1;
                                        return 0;
                                    }).map(staffId => {
                                        const member = availableStaff.find(s => s.id === staffId) || staff.find(s => s.id === staffId);
                                        const isLeader = staffId === sg.leaderId;
                                        return member ? (
                                            <Box key={staffId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    backgroundColor: isLeader ? COLORS.ERROR[500] : COLORS.SECONDARY[400]
                                                }} />
                                                <Typography variant="body2">
                                                    {member.full_name}
                                                    {isLeader && (
                                                        <Chip
                                                            label="Leader"
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: 18,
                                                                fontSize: '0.65rem',
                                                                backgroundColor: alpha(COLORS.ERROR[500], 0.1),
                                                                color: COLORS.ERROR[600]
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                            </Box>
                                        ) : null;
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                ))}
            </Box>
        </Stack>
    );
};

// ==================== INTERNAL ASSIGNMENT ====================
export const InternalAssignment = ({ formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const selectedShifts = formData.shifts || [];
    const [workShifts, setWorkShifts] = React.useState([]);
    const [loadingShifts, setLoadingShifts] = React.useState(true);

    // Fetch work shifts to get shift names
    React.useEffect(() => {
        workshiftApi.getAllShifts()
            .then(response => {
                if (response.success) {
                    setWorkShifts(response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching work shifts:', error);
            })
            .finally(() => {
                setLoadingShifts(false);
            });
    }, []);

    if (selectedShifts.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    Vui lòng chọn ít nhất một ca làm việc ở bước trước
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Phân công cho nhiệm vụ nội bộ ({selectedShifts.length} ca)
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                Phân công nhân viên, khu vực và pet cho từng ca làm việc. Nhân viên có thể làm việc ở nhiều ca khác nhau.
            </Typography>

            {loadingShifts ? (
                <Alert severity="info">Đang tải thông tin ca làm việc...</Alert>
            ) : (
                <Stack spacing={2}>
                    {selectedShifts.map((shiftId, idx) => {
                        const shift = workShifts.find(s => s.id === shiftId);
                        const shiftName = shift ? shift.name : shiftId;
                        const shiftTime = shift ? `${shift.start_time} - ${shift.end_time}` : '';

                        return (
                            <Accordion key={shiftId} defaultExpanded={idx === 0}>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    sx={{
                                        backgroundColor: alpha(COLORS.PRIMARY[50], 0.5),
                                        '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[100], 0.5) }
                                    }}
                                >
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                        🕐 Ca làm: {shiftName} {shiftTime && `(${shiftTime})`}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 2 }}>
                                    <ShiftAssignment
                                        shift={shiftId}
                                        formData={formData}
                                        setFormData={setFormData}
                                        areas={areas}
                                        staff={staff}
                                        openStaffGroupDialog={openStaffGroupDialog}
                                        openPetGroupDialog={openPetGroupDialog}
                                        editStaffGroup={editStaffGroup}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
};

// Utility: Check time overlap between two time ranges
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

// ==================== SERVICE SLOT ASSIGNMENT ====================
const ServiceSlotAssignment = ({ slotId, slot, formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const assignment = formData.shiftAssignments[slotId] || { areaIds: [], petGroups: [], staffGroups: [] };
    const [expandedGroups, setExpandedGroups] = React.useState({});
    const [staffShifts, setStaffShifts] = React.useState({});
    const [loadingStaff, setLoadingStaff] = React.useState(true);
    const [workShifts, setWorkShifts] = React.useState([]);
    const [loadingWorkShifts, setLoadingWorkShifts] = React.useState(true);

    // Fetch all staff shifts on mount
    React.useEffect(() => {
        const fetchStaffShifts = async () => {
            try {
                const shiftsMap = {};
                await Promise.all(
                    staff.map(async (s) => {
                        const response = await workshiftApi.getStaffShifts(s.id);
                        if (response.success) {
                            // Extract shifts array from response.data.shifts
                            shiftsMap[s.id] = response.data.shifts || [];
                        }
                    })
                );
                setStaffShifts(shiftsMap);
            } catch (error) {
                console.error('Error fetching staff shifts:', error);
            } finally {
                setLoadingStaff(false);
            }
        };
        fetchStaffShifts();
    }, [staff]);

    // Fetch all work shifts (to derive teams from WorkShift)
    React.useEffect(() => {
        const fetchWorkShifts = async () => {
            try {
                setLoadingWorkShifts(true);
                const response = await workshiftApi.getAllShifts();
                if (response.success) setWorkShifts(response.data);
            } catch (e) {
                console.error('Error fetching work shifts:', e);
            } finally {
                setLoadingWorkShifts(false);
            }
        };
        fetchWorkShifts();
    }, []);

    // Filter staff who have shifts that overlap with this slot
    const availableStaff = React.useMemo(() => {
        if (!slot || loadingStaff) return [];

        return staff.filter(s => {
            const shifts = staffShifts[s.id] || [];
            return shifts.some(shift =>
                checkTimeOverlap(slot.start_time, slot.end_time, shift.start_time, shift.end_time)
            );
        });
    }, [staff, slot, staffShifts, loadingStaff]);

    // Helpers to compute target day-of-week from formData/slot
    const getTargetDayName = () => {
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dateStr = formData?.timeframeType === 'day' ? formData?.date : (Array.isArray(slot?.applicable_days) && slot.applicable_days.length > 0 ? slot.applicable_days[0] : null);
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return dayNames[d.getDay()];
    };

    // Derive available teams from WorkShift by day and time overlap
    const availableTeams = React.useMemo(() => {
        if (!slot || loadingWorkShifts) return [];
        const targetDay = getTargetDayName();
        const matchedShifts = workShifts.filter(ws => {
            const dayOk = targetDay ? Array.isArray(ws.applicable_days) && ws.applicable_days.includes(targetDay) : true;
            const timeOk = checkTimeOverlap(slot.start_time, slot.end_time, ws.start_time, ws.end_time);
            return dayOk && timeOk;
        });
        const teams = [];
        matchedShifts.forEach(ws => {
            if (Array.isArray(ws.team_work_shifts)) {
                ws.team_work_shifts.forEach(t => teams.push({ ...t, shift_id: ws.id }));
            }
        });
        return teams;
    }, [slot, workShifts, loadingWorkShifts, formData]);

    const addTeamAsStaffGroup = (team) => {
        const teamMemberIds = (team.members || []).map(m => m.id).filter(Boolean);
        const leaderId = team?.leader?.id || '';
        const uniqueIds = Array.from(new Set([leaderId, ...teamMemberIds].filter(Boolean)));
        const newGroup = {
            name: team.name || 'Team',
            staffIds: uniqueIds,
            leaderId
        };
        setFormData(prev => ({
            ...prev,
            shiftAssignments: {
                ...prev.shiftAssignments,
                [slotId]: {
                    ...assignment,
                    staffGroups: [...(assignment.staffGroups || []), newGroup]
                }
            }
        }));
    };

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <Stack spacing={3}>
            {/* Areas */}
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Khu vực</Typography>
                <FormGroup>
                    {(areas || []).map(area => (
                        <FormControlLabel
                            key={area.id}
                            control={
                                <Checkbox
                                    checked={(assignment.areaIds || []).includes(area.id)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            shiftAssignments: {
                                                ...prev.shiftAssignments,
                                                [slotId]: {
                                                    ...assignment,
                                                    areaIds: checked
                                                        ? [...assignment.areaIds, area.id]
                                                        : assignment.areaIds.filter(id => id !== area.id)
                                                }
                                            }
                                        }));
                                    }}
                                />
                            }
                            label={`${area.name} (Sức chứa: ${area.capacity || 0})`}
                        />
                    ))}
                </FormGroup>
            </Box>

            {/* Pet Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm pet</Typography>
                    <Button size="small" variant="outlined" onClick={() => openPetGroupDialog({ shift: slotId })}>
                        Chọn nhóm pet
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(assignment.petGroups || []).map((pg, idx) => (
                        <Chip
                            key={idx}
                            label={`${pg.groupName} (${pg.count} con)`}
                            onDelete={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    shiftAssignments: {
                                        ...prev.shiftAssignments,
                                        [slotId]: {
                                            ...assignment,
                                            petGroups: assignment.petGroups.filter((_, i) => i !== idx)
                                        }
                                    }
                                }));
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Staff Groups */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhóm nhân viên</Typography>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => openStaffGroupDialog({ shift: slotId, availableStaff })}
                        sx={{ backgroundColor: COLORS.SECONDARY[500], '&:hover': { backgroundColor: COLORS.SECONDARY[600] } }}
                    >
                        Tạo nhóm tuỳ chỉnh
                    </Button>
                </Stack>

                {/* Suggested teams from WorkShift matching day/time */}
                {!loadingWorkShifts && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                            Gợi ý từ WorkShift (khớp ngày/giờ):
                        </Typography>
                        {availableTeams.length === 0 ? (
                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Không có team phù hợp
                            </Typography>
                        ) : (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {availableTeams.map(team => (
                                    <Chip
                                        key={team.id}
                                        label={`${team.name} • Leader: ${team?.leader?.full_name || '—'}`}
                                        onClick={() => addTeamAsStaffGroup(team)}
                                        sx={{ bgcolor: alpha(COLORS.INFO[50], 0.8) }}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}

                {loadingStaff && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Đang tải danh sách nhân viên khả dụng...
                    </Alert>
                )}

                {!loadingStaff && availableStaff.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Không có nhân viên nào có ca làm trùng với ca dịch vụ này ({slot?.start_time} - {slot?.end_time})
                    </Alert>
                )}

                {!loadingStaff && availableStaff.length > 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Có <strong>{availableStaff.length}</strong> nhân viên có ca làm trùng với ca dịch vụ này
                    </Alert>
                )}

                {(assignment.staffGroups || []).map((sg, idx) => (
                    <Paper key={idx} sx={{ mb: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                    <Typography variant="caption">
                                        {sg.staffIds?.length || 0} nhân viên | Leader: {availableStaff.find(s => s.id === sg.leaderId)?.full_name || '—'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => editStaffGroup({ shift: slotId, groupIndex: idx, groupData: sg, availableStaff })}
                                        sx={{ color: COLORS.PRIMARY[600] }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                shiftAssignments: {
                                                    ...prev.shiftAssignments,
                                                    [slotId]: {
                                                        ...assignment,
                                                        staffGroups: assignment.staffGroups.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                        sx={{ color: COLORS.ERROR[600] }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {expandedGroups[idx] && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                                        Thành viên:
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {(sg.staffIds || []).map(staffId => {
                                            const staffMember = availableStaff.find(s => s.id === staffId);
                                            return staffMember ? (
                                                <Chip
                                                    key={staffId}
                                                    label={staffMember.full_name}
                                                    size="small"
                                                    variant={staffId === sg.leaderId ? 'filled' : 'outlined'}
                                                    sx={{
                                                        backgroundColor: staffId === sg.leaderId ? COLORS.WARNING[100] : 'transparent',
                                                        borderColor: staffId === sg.leaderId ? COLORS.WARNING[500] : COLORS.SECONDARY[300]
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                backgroundColor: alpha(COLORS.SECONDARY[50], 0.5),
                                borderTop: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: alpha(COLORS.SECONDARY[100], 0.5) }
                            }}
                            onClick={() => toggleGroup(idx)}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                {expandedGroups[idx] ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                                <Typography variant="caption">
                                    {expandedGroups[idx] ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                </Typography>
                            </Stack>
                        </Box>
                    </Paper>
                ))}
            </Box>
        </Stack>
    );
};

// ==================== SERVICE ASSIGNMENT ====================
export const ServiceAssignment = ({ formData, setFormData, areas, staff, selectedService, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const [serviceSlots, setServiceSlots] = React.useState([]);
    const [loadingSlots, setLoadingSlots] = React.useState(true);

    // Fetch service slots
    React.useEffect(() => {
        if (selectedService) {
            setLoadingSlots(true);
            slotApi.getSlotsByService(selectedService.id)
                .then(response => {
                    if (response.success) {
                        setServiceSlots(response.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching slots:', error);
                })
                .finally(() => {
                    setLoadingSlots(false);
                });
        }
    }, [selectedService]);

    const selectedSlotIds = formData.shifts || [];

    if (selectedSlotIds.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    Vui lòng chọn ít nhất một ca dịch vụ ở bước trước
                </Alert>
            </Box>
        );
    }

    if (loadingSlots) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    Đang tải thông tin ca dịch vụ...
                </Alert>
            </Box>
        );
    }

    const selectedSlots = serviceSlots.filter(s => selectedSlotIds.includes(s.id));

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Phân công cho dịch vụ ({selectedSlots.length} ca)
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                Chỉ hiển thị nhân viên có ca làm việc trùng với thời gian ca dịch vụ
            </Typography>

            <Stack spacing={2}>
                {selectedSlots.map((slot, idx) => (
                    <Accordion key={slot.id} defaultExpanded={idx === 0}>
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.5),
                                '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[100], 0.5) }
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                🕐 Ca dịch vụ: {slot.start_time} - {slot.end_time}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 2 }}>
                            <ServiceSlotAssignment
                                slotId={slot.id}
                                slot={slot}
                                formData={formData}
                                setFormData={setFormData}
                                areas={areas}
                                staff={staff}
                                openStaffGroupDialog={openStaffGroupDialog}
                                openPetGroupDialog={openPetGroupDialog}
                                editStaffGroup={editStaffGroup}
                            />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>
        </Box>
    );
};

