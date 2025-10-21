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
const ShiftAssignment = ({ shift, formData, setFormData, areas, staff, petGroupsMap, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const assignment = formData.shiftAssignments[shift] || { areaIds: [], petGroups: [], staffGroups: [], areas: [] };
    const [expandedGroups, setExpandedGroups] = React.useState({});
    const [workShift, setWorkShift] = React.useState(null);
    const [allWorkShifts, setAllWorkShifts] = React.useState([]);
    const [loadingWorkShifts, setLoadingWorkShifts] = React.useState(true);

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Fetch work shift details
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Get this work shift details
                const shiftResponse = await workshiftApi.getShiftById(shift);
                if (shiftResponse.success) {
                    setWorkShift(shiftResponse.data);
                }

                // Get all work shifts (to get teams)
                const allShiftsResponse = await workshiftApi.getAllShifts();
                if (allShiftsResponse.success) {
                    setAllWorkShifts(allShiftsResponse.data);
                }
            } catch (error) {
                console.error('Error fetching shift data:', error);
            } finally {
                setLoadingWorkShifts(false);
            }
        };
        fetchData();
    }, [shift]);

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

    // Calculate date range based on timeframe type
    const getDateRange = () => {
        const { timeframeType, date, week, month } = formData;
        const dates = [];

        if (timeframeType === 'day' && date) {
            dates.push(date);
        } else if (timeframeType === 'week' && week) {
            // week format: "2025-W03"
            const [year, weekNum] = week.split('-W').map(Number);
            const firstDay = new Date(year, 0, 1 + (weekNum - 1) * 7);
            const dayOfWeek = firstDay.getDay();
            const monday = new Date(firstDay);
            monday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                dates.push(d.toISOString().split('T')[0]);
            }
        } else if (timeframeType === 'month' && month) {
            // month format: "2025-01"
            const [year, monthNum] = month.split('-').map(Number);
            const daysInMonth = new Date(year, monthNum, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(year, monthNum - 1, day);
                dates.push(d.toISOString().split('T')[0]);
            }
        }

        return dates;
    };

    // Get day name from date string
    const getDayNameFromDate = (dateStr) => {
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return dayNames[d.getDay()];
    };

    // Group teams by date
    const teamsByDate = React.useMemo(() => {
        if (!workShift || loadingWorkShifts) return {};

        const dates = getDateRange();
        const grouped = {};

        dates.forEach(dateStr => {
            const targetDay = getDayNameFromDate(dateStr);

            // Find all shifts that match the day and time
            const matchedShifts = allWorkShifts.filter(ws => {
                const dayOk = targetDay ? Array.isArray(ws.applicable_days) && ws.applicable_days.includes(targetDay) : true;
                const timeOk = checkTimeOverlap(workShift.start_time, workShift.end_time, ws.start_time, ws.end_time);
                return dayOk && timeOk;
            });

            const teams = [];
            matchedShifts.forEach(ws => {
                if (Array.isArray(ws.team_work_shifts)) {
                    ws.team_work_shifts.forEach(t => teams.push({ ...t, shift_id: ws.id, shift_name: ws.name }));
                }
            });

            grouped[dateStr] = teams;
        });

        return grouped;
    }, [workShift, allWorkShifts, loadingWorkShifts, formData]);

    // Add team as staff group (with date info)
    const addTeamAsStaffGroup = (team, dateStr) => {
        // Check if this team is already assigned for this date
        const existingGroups = assignment.staffGroups || [];
        const isDuplicate = existingGroups.some(g =>
            g.name === team.name && g.assignedDate === dateStr
        );

        if (isDuplicate) {
            // Optional: Show a notification that team is already added
            console.warn(`Team "${team.name}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const teamMemberIds = (team.members || []).map(m => m.id).filter(Boolean);
        const leaderId = team?.leader?.id || '';
        const uniqueIds = Array.from(new Set([leaderId, ...teamMemberIds].filter(Boolean)));

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newGroup = {
            name: team.name || 'Team',
            staffIds: uniqueIds,
            leaderId,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };

        setFormData(prev => ({
            ...prev,
            shiftAssignments: {
                ...prev.shiftAssignments,
                [shift]: {
                    ...assignment,
                    staffGroups: [...(assignment.staffGroups || []), newGroup]
                }
            }
        }));
    };

    // Add area by date
    const addAreaByDate = (area, dateStr) => {
        const existingAreas = assignment.areas || [];
        const isDuplicate = existingAreas.some(a =>
            a.areaId === area.id && a.assignedDate === dateStr
        );

        if (isDuplicate) {
            console.warn(`Khu vực "${area.name}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newArea = {
            areaId: area.id,
            areaName: area.name,
            capacity: area.capacity,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };

        setFormData(prev => ({
            ...prev,
            shiftAssignments: {
                ...prev.shiftAssignments,
                [shift]: {
                    ...assignment,
                    areaIds: [],  // Clear old format
                    areas: [...(assignment.areas || []), newArea]
                }
            }
        }));
    };

    // Add pet group by date
    const addPetGroupByDate = (groupName, dateStr) => {
        const existingPetGroups = assignment.petGroups || [];
        const isDuplicate = existingPetGroups.some(pg =>
            pg.groupName === groupName && pg.assignedDate === dateStr
        );

        if (isDuplicate) {
            console.warn(`Nhóm pet "${groupName}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const petIds = (petGroupsMap[groupName] || []).map(p => p.id);
        const count = petIds.length;

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newPetGroup = {
            groupName,
            petIds,
            count,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };

        setFormData(prev => ({
            ...prev,
            shiftAssignments: {
                ...prev.shiftAssignments,
                [shift]: {
                    ...assignment,
                    petGroups: [...(assignment.petGroups || []), newPetGroup]
                }
            }
        }));
    };

    return (
        <Stack spacing={4}>
            {/* Areas Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.INFO[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.3)} 0%, ${alpha(COLORS.INFO[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>📍</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                            Khu vực
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn khu vực phân công theo từng ngày
                        </Typography>
                    </Box>
                </Stack>

                {loadingWorkShifts ? (
                    <Alert severity="info">
                        Đang tải...
                    </Alert>
                ) : (
                    <Box>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có ngày phù hợp với ca làm việc này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    // Group dates by day of week
                                    const datesByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!datesByDayOfWeek[dayName]) {
                                            datesByDayOfWeek[dayName] = [];
                                        }
                                        datesByDayOfWeek[dayName].push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                                    return dayOrder.filter(day => datesByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const dates = datesByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {(areas || []).map(area => {
                                                        // Check if area is selected for ALL dates of this day
                                                        const selectedCount = dates.filter(d =>
                                                            (assignment.areas || []).some(a => a.areaId === area.id && a.assignedDate === d)
                                                        ).length;
                                                        const isFullySelected = selectedCount === dateCount;
                                                        const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;

                                                        return (
                                                            <Chip
                                                                key={area.id}
                                                                label={`${area.name} (Sức chứa: ${area.capacity})${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                onClick={() => {
                                                                    // Add area for ALL dates of this day of week
                                                                    dates.forEach(dateStr => {
                                                                        addAreaByDate(area, dateStr);
                                                                    });
                                                                }}
                                                                sx={{
                                                                    bgcolor: isFullySelected
                                                                        ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                        : isPartiallySelected
                                                                            ? alpha(COLORS.WARNING[100], 0.5)
                                                                            : alpha(COLORS.INFO[50], 0.8),
                                                                    cursor: isFullySelected ? 'default' : 'pointer',
                                                                    opacity: isFullySelected ? 0.6 : 1,
                                                                    '&:hover': {
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[200], 0.6)
                                                                                : alpha(COLORS.INFO[100], 0.9)
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned areas */}
                {(assignment.areas || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.INFO[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.INFO[700], display: 'block', mb: 1.5 }}>
                            📍 Đã chọn ({assignment.areas.length} khu vực):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[...(assignment.areas || [])]
                                .sort((a, b) => {
                                    if (a.assignedDate && b.assignedDate) {
                                        return new Date(a.assignedDate) - new Date(b.assignedDate);
                                    }
                                    return 0;
                                })
                                .map((area, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${area.areaName} - ${area.assignedDayName}, ${area.assignedDate}`}
                                        onDelete={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                shiftAssignments: {
                                                    ...prev.shiftAssignments,
                                                    [shift]: {
                                                        ...assignment,
                                                        areas: assignment.areas.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                        sx={{
                                            bgcolor: alpha(COLORS.INFO[100], 0.8),
                                            fontWeight: 600,
                                            borderLeft: `3px solid ${COLORS.INFO[500]}`
                                        }}
                                    />
                                ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Pet Groups Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.3)} 0%, ${alpha(COLORS.SECONDARY[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.SECONDARY[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>🐾</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SECONDARY[700] }}>
                            Nhóm pet
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn nhóm pet phân công theo từng ngày
                        </Typography>
                    </Box>
                </Stack>

                {loadingWorkShifts ? (
                    <Alert severity="info">
                        Đang tải...
                    </Alert>
                ) : (
                    <Box>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có ngày phù hợp với ca làm việc này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    // Group dates by day of week (reuse logic from areas)
                                    const datesByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!datesByDayOfWeek[dayName]) {
                                            datesByDayOfWeek[dayName] = [];
                                        }
                                        datesByDayOfWeek[dayName].push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                                    const petGroupNames = Object.keys(petGroupsMap || {});

                                    return dayOrder.filter(day => datesByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const dates = datesByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {petGroupNames.map(groupName => {
                                                        // Check if pet group is selected for ALL dates of this day
                                                        const selectedCount = dates.filter(d =>
                                                            (assignment.petGroups || []).some(pg => pg.groupName === groupName && pg.assignedDate === d)
                                                        ).length;
                                                        const isFullySelected = selectedCount === dateCount;
                                                        const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;
                                                        const petCount = (petGroupsMap[groupName] || []).length;

                                                        return (
                                                            <Chip
                                                                key={groupName}
                                                                label={`${groupName} (${petCount} con)${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                onClick={() => {
                                                                    // Add pet group for ALL dates of this day of week
                                                                    dates.forEach(dateStr => {
                                                                        addPetGroupByDate(groupName, dateStr);
                                                                    });
                                                                }}
                                                                sx={{
                                                                    bgcolor: isFullySelected
                                                                        ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                        : isPartiallySelected
                                                                            ? alpha(COLORS.WARNING[100], 0.5)
                                                                            : alpha(COLORS.INFO[50], 0.8),
                                                                    cursor: isFullySelected ? 'default' : 'pointer',
                                                                    opacity: isFullySelected ? 0.6 : 1,
                                                                    '&:hover': {
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[200], 0.6)
                                                                                : alpha(COLORS.INFO[100], 0.9)
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned pet groups */}
                {(assignment.petGroups || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.SECONDARY[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.SECONDARY[700], display: 'block', mb: 1.5 }}>
                            🐾 Đã chọn ({assignment.petGroups.length} nhóm):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[...(assignment.petGroups || [])]
                                .sort((a, b) => {
                                    if (a.assignedDate && b.assignedDate) {
                                        return new Date(a.assignedDate) - new Date(b.assignedDate);
                                    }
                                    return 0;
                                })
                                .map((pg, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${pg.groupName} (${pg.count} con) - ${pg.assignedDayName}, ${pg.assignedDate}`}
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
                                        sx={{
                                            bgcolor: alpha(COLORS.SECONDARY[100], 0.8),
                                            fontWeight: 600,
                                            borderLeft: `3px solid ${COLORS.SECONDARY[500]}`
                                        }}
                                    />
                                ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Staff Groups Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)} 0%, ${alpha(COLORS.PRIMARY[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>👥</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                            Nhóm nhân viên
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn nhóm từ WorkShift hoặc tạo nhóm tùy chỉnh
                        </Typography>
                    </Box>
                </Stack>

                {/* Teams from WorkShift matching day/time */}
                {loadingWorkShifts ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Đang tải danh sách team từ WorkShift...
                    </Alert>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 1 }}>
                            Gợi ý từ WorkShift (chọn team theo ngày trong tuần):
                        </Typography>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có team phù hợp với ca làm việc này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    // Group dates by day of week
                                    const teamsByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr, teams]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!teamsByDayOfWeek[dayName]) {
                                            teamsByDayOfWeek[dayName] = {
                                                teams,
                                                dates: []
                                            };
                                        }
                                        teamsByDayOfWeek[dayName].dates.push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                                    return dayOrder.filter(day => teamsByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const { teams, dates } = teamsByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                {teams.length === 0 ? (
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                                        Không có team
                                                    </Typography>
                                                ) : (
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        {teams.map(team => {
                                                            // Check if team is selected for ALL dates of this day
                                                            const selectedCount = dates.filter(d =>
                                                                (assignment.staffGroups || []).some(g => g.name === team.name && g.assignedDate === d)
                                                            ).length;
                                                            const isFullySelected = selectedCount === dateCount;
                                                            const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;

                                                            return (
                                                                <Chip
                                                                    key={team.id}
                                                                    label={`${team.name} • Leader: ${team?.leader?.full_name || '—'}${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                    onClick={() => {
                                                                        // Add team for ALL dates of this day of week
                                                                        dates.forEach(dateStr => {
                                                                            addTeamAsStaffGroup(team, dateStr);
                                                                        });
                                                                    }}
                                                                    sx={{
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[100], 0.5)
                                                                                : alpha(COLORS.INFO[50], 0.8),
                                                                        cursor: isFullySelected ? 'default' : 'pointer',
                                                                        opacity: isFullySelected ? 0.6 : 1,
                                                                        '&:hover': {
                                                                            bgcolor: isFullySelected
                                                                                ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                                : isPartiallySelected
                                                                                    ? alpha(COLORS.WARNING[200], 0.6)
                                                                                    : alpha(COLORS.INFO[100], 0.9)
                                                                        }
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </Stack>
                                                )}
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned staff groups */}
                {(assignment.staffGroups || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.PRIMARY[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], display: 'block', mb: 2 }}>
                            👥 Nhóm đã phân công ({assignment.staffGroups.length}):
                        </Typography>
                        {[...(assignment.staffGroups || [])]
                            .sort((a, b) => {
                                // Sort by date
                                if (a.assignedDate && b.assignedDate) {
                                    return new Date(a.assignedDate) - new Date(b.assignedDate);
                                }
                                return 0;
                            })
                            .map((sg, idx) => (
                                <Paper key={idx} sx={{ mb: 2, border: `1px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, overflow: 'hidden', boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY[500], 0.1)}` }}>
                                    <Box sx={{ p: 2 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                                    {sg.assignedDayName && (
                                                        <Chip
                                                            label={`${sg.assignedDayName}, ${sg.assignedDate}`}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                                backgroundColor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                color: COLORS.PRIMARY[700],
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
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
                                                    sx={{ color: COLORS.ERROR[600] }}
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
                )}
            </Paper>
        </Stack>
    );
};

// ==================== INTERNAL ASSIGNMENT ====================
export const InternalAssignment = ({ formData, setFormData, areas, staff, petGroupsMap, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
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
                                        petGroupsMap={petGroupsMap}
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
const ServiceSlotAssignment = ({ slotId, slot, formData, setFormData, areas, staff, petGroupsMap, selectedService, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const assignment = formData.timeSlotAssignments?.[slotId] || { areaIds: [], petGroups: [], staffGroups: [], areas: [] };
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

    // Get day name from date string
    const getDayNameFromDate = (dateStr) => {
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return dayNames[d.getDay()];
    };

    // Get applicable dates for this slot
    const getApplicableDates = () => {
        if (!slot) return [];

        // For service_period timeframe, generate all dates between start and end
        if (formData?.timeframeType === 'service_period') {
            const startDate = selectedService?.startDate || formData?.servicePeriodStart;
            const endDate = selectedService?.endDate || formData?.servicePeriodEnd;

            if (startDate && endDate) {
                const dates = [];
                const current = new Date(startDate);
                const end = new Date(endDate);

                while (current <= end) {
                    dates.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                }
                return dates;
            }
        }

        // For day timeframe, use single date
        if (formData?.timeframeType === 'day' && formData?.date) {
            return [formData.date];
        }

        // Fallback: use slot's applicable_days if available
        if (Array.isArray(slot.applicable_days) && slot.applicable_days.length > 0) {
            return slot.applicable_days;
        }

        return [];
    };

    // Group teams by date
    const teamsByDate = React.useMemo(() => {
        if (!slot || loadingWorkShifts) return {};

        const dates = getApplicableDates();
        const grouped = {};

        dates.forEach(dateStr => {
            const targetDay = getDayNameFromDate(dateStr);

            // Find all shifts that match the day and time
            const matchedShifts = workShifts.filter(ws => {
                const dayOk = targetDay ? Array.isArray(ws.applicable_days) && ws.applicable_days.includes(targetDay) : true;
                const timeOk = checkTimeOverlap(slot.start_time, slot.end_time, ws.start_time, ws.end_time);
                return dayOk && timeOk;
            });

            const teams = [];
            matchedShifts.forEach(ws => {
                if (Array.isArray(ws.team_work_shifts)) {
                    ws.team_work_shifts.forEach(t => teams.push({ ...t, shift_id: ws.id, shift_name: ws.name }));
                }
            });

            grouped[dateStr] = teams;
        });

        return grouped;
    }, [slot, workShifts, loadingWorkShifts, formData]);

    const addTeamAsStaffGroup = (team, dateStr) => {
        // Check if this team is already assigned for this date
        const existingGroups = assignment.staffGroups || [];
        const isDuplicate = existingGroups.some(g =>
            g.name === team.name && g.assignedDate === dateStr
        );

        if (isDuplicate) {
            // Optional: Show a notification that team is already added
            console.warn(`Team "${team.name}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const teamMemberIds = (team.members || []).map(m => m.id).filter(Boolean);
        const leaderId = team?.leader?.id || '';
        const uniqueIds = Array.from(new Set([leaderId, ...teamMemberIds].filter(Boolean)));

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newGroup = {
            name: team.name || 'Team',
            staffIds: uniqueIds,
            leaderId,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };
        setFormData(prev => ({
            ...prev,
            timeSlotAssignments: {
                ...prev.timeSlotAssignments,
                [slotId]: {
                    ...assignment,
                    staffGroups: [...(assignment.staffGroups || []), newGroup]
                }
            }
        }));
    };

    // Add area by date (for service slots)
    const addAreaByDate = (area, dateStr) => {
        const existingAreas = assignment.areas || [];
        const isDuplicate = existingAreas.some(a =>
            a.areaId === area.id && a.assignedDate === dateStr
        );

        if (isDuplicate) {
            console.warn(`Khu vực "${area.name}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newArea = {
            areaId: area.id,
            areaName: area.name,
            capacity: area.capacity,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };

        setFormData(prev => ({
            ...prev,
            timeSlotAssignments: {
                ...prev.timeSlotAssignments,
                [slotId]: {
                    ...assignment,
                    areaIds: [],  // Clear old format
                    areas: [...(assignment.areas || []), newArea]
                }
            }
        }));
    };

    // Add pet group by date (for service slots)
    const addPetGroupByDate = (groupName, dateStr) => {
        const existingPetGroups = assignment.petGroups || [];
        const isDuplicate = existingPetGroups.some(pg =>
            pg.groupName === groupName && pg.assignedDate === dateStr
        );

        if (isDuplicate) {
            console.warn(`Nhóm pet "${groupName}" đã được thêm cho ngày ${dateStr}`);
            return;
        }

        const petIds = (petGroupsMap[groupName] || []).map(p => p.id);
        const count = petIds.length;

        const dayName = getDayNameFromDate(dateStr);
        const dayNameVi = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3',
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }[dayName] || dayName;

        const newPetGroup = {
            groupName,
            petIds,
            count,
            assignedDate: dateStr,
            assignedDayName: dayNameVi
        };

        setFormData(prev => ({
            ...prev,
            timeSlotAssignments: {
                ...prev.timeSlotAssignments,
                [slotId]: {
                    ...assignment,
                    petGroups: [...(assignment.petGroups || []), newPetGroup]
                }
            }
        }));
    };

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <Stack spacing={4}>
            {/* Areas Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.INFO[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.3)} 0%, ${alpha(COLORS.INFO[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.INFO[400]} 0%, ${COLORS.INFO[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>📍</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                            Khu vực
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn khu vực phân công theo từng ngày
                        </Typography>
                    </Box>
                </Stack>

                {loadingWorkShifts ? (
                    <Alert severity="info">
                        Đang tải...
                    </Alert>
                ) : (
                    <Box>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có ngày phù hợp với ca dịch vụ này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    // Group dates by day of week
                                    const datesByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!datesByDayOfWeek[dayName]) {
                                            datesByDayOfWeek[dayName] = [];
                                        }
                                        datesByDayOfWeek[dayName].push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                                    return dayOrder.filter(day => datesByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const dates = datesByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {(areas || []).map(area => {
                                                        const selectedCount = dates.filter(d =>
                                                            (assignment.areas || []).some(a => a.areaId === area.id && a.assignedDate === d)
                                                        ).length;
                                                        const isFullySelected = selectedCount === dateCount;
                                                        const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;

                                                        return (
                                                            <Chip
                                                                key={area.id}
                                                                label={`${area.name} (Sức chứa: ${area.capacity})${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                onClick={() => {
                                                                    dates.forEach(dateStr => {
                                                                        addAreaByDate(area, dateStr);
                                                                    });
                                                                }}
                                                                sx={{
                                                                    bgcolor: isFullySelected
                                                                        ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                        : isPartiallySelected
                                                                            ? alpha(COLORS.WARNING[100], 0.5)
                                                                            : alpha(COLORS.INFO[50], 0.8),
                                                                    cursor: isFullySelected ? 'default' : 'pointer',
                                                                    opacity: isFullySelected ? 0.6 : 1,
                                                                    '&:hover': {
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[200], 0.6)
                                                                                : alpha(COLORS.INFO[100], 0.9)
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned areas */}
                {(assignment.areas || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.INFO[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.INFO[700], display: 'block', mb: 1.5 }}>
                            📍 Đã chọn ({assignment.areas.length} khu vực):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[...(assignment.areas || [])]
                                .sort((a, b) => {
                                    if (a.assignedDate && b.assignedDate) {
                                        return new Date(a.assignedDate) - new Date(b.assignedDate);
                                    }
                                    return 0;
                                })
                                .map((area, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${area.areaName} - ${area.assignedDayName}, ${area.assignedDate}`}
                                        onDelete={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                timeSlotAssignments: {
                                                    ...prev.timeSlotAssignments,
                                                    [slotId]: {
                                                        ...assignment,
                                                        areas: assignment.areas.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                        sx={{
                                            bgcolor: alpha(COLORS.INFO[100], 0.8),
                                            fontWeight: 600,
                                            borderLeft: `3px solid ${COLORS.INFO[500]}`
                                        }}
                                    />
                                ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Pet Groups Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.SECONDARY[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.3)} 0%, ${alpha(COLORS.SECONDARY[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.SECONDARY[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>🐾</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SECONDARY[700] }}>
                            Nhóm pet
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn nhóm pet phân công theo từng ngày
                        </Typography>
                    </Box>
                </Stack>

                {loadingWorkShifts ? (
                    <Alert severity="info">
                        Đang tải...
                    </Alert>
                ) : (
                    <Box>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có ngày phù hợp với ca dịch vụ này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    const datesByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!datesByDayOfWeek[dayName]) {
                                            datesByDayOfWeek[dayName] = [];
                                        }
                                        datesByDayOfWeek[dayName].push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                                    const petGroupNames = Object.keys(petGroupsMap || {});

                                    return dayOrder.filter(day => datesByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const dates = datesByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {petGroupNames.map(groupName => {
                                                        const selectedCount = dates.filter(d =>
                                                            (assignment.petGroups || []).some(pg => pg.groupName === groupName && pg.assignedDate === d)
                                                        ).length;
                                                        const isFullySelected = selectedCount === dateCount;
                                                        const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;
                                                        const petCount = (petGroupsMap[groupName] || []).length;

                                                        return (
                                                            <Chip
                                                                key={groupName}
                                                                label={`${groupName} (${petCount} con)${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                onClick={() => {
                                                                    dates.forEach(dateStr => {
                                                                        addPetGroupByDate(groupName, dateStr);
                                                                    });
                                                                }}
                                                                sx={{
                                                                    bgcolor: isFullySelected
                                                                        ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                        : isPartiallySelected
                                                                            ? alpha(COLORS.WARNING[100], 0.5)
                                                                            : alpha(COLORS.INFO[50], 0.8),
                                                                    cursor: isFullySelected ? 'default' : 'pointer',
                                                                    opacity: isFullySelected ? 0.6 : 1,
                                                                    '&:hover': {
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[200], 0.6)
                                                                                : alpha(COLORS.INFO[100], 0.9)
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned pet groups */}
                {(assignment.petGroups || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.SECONDARY[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.SECONDARY[700], display: 'block', mb: 1.5 }}>
                            🐾 Đã chọn ({assignment.petGroups.length} nhóm):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[...(assignment.petGroups || [])]
                                .sort((a, b) => {
                                    if (a.assignedDate && b.assignedDate) {
                                        return new Date(a.assignedDate) - new Date(b.assignedDate);
                                    }
                                    return 0;
                                })
                                .map((pg, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${pg.groupName} (${pg.count} con) - ${pg.assignedDayName}, ${pg.assignedDate}`}
                                        onDelete={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                timeSlotAssignments: {
                                                    ...prev.timeSlotAssignments,
                                                    [slotId]: {
                                                        ...assignment,
                                                        petGroups: assignment.petGroups.filter((_, i) => i !== idx)
                                                    }
                                                }
                                            }));
                                        }}
                                        sx={{
                                            bgcolor: alpha(COLORS.SECONDARY[100], 0.8),
                                            fontWeight: 600,
                                            borderLeft: `3px solid ${COLORS.SECONDARY[500]}`
                                        }}
                                    />
                                ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Staff Groups Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${alpha(COLORS.PRIMARY[300], 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)} 0%, ${alpha(COLORS.PRIMARY[100], 0.2)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>👥</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                            Nhóm nhân viên
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Chọn nhóm từ WorkShift hoặc tạo nhóm tùy chỉnh
                        </Typography>
                    </Box>
                </Stack>

                {/* Teams from WorkShift matching day/time */}
                {loadingWorkShifts ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Đang tải danh sách team từ WorkShift...
                    </Alert>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 1 }}>
                            Gợi ý từ WorkShift (chọn team theo ngày trong tuần):
                        </Typography>
                        {Object.keys(teamsByDate).length === 0 ? (
                            <Alert severity="warning">
                                Không có team phù hợp với ca dịch vụ này
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {(() => {
                                    // Group dates by day of week
                                    const teamsByDayOfWeek = {};
                                    Object.entries(teamsByDate).forEach(([dateStr, teams]) => {
                                        const dayName = getDayNameFromDate(dateStr);
                                        if (!teamsByDayOfWeek[dayName]) {
                                            teamsByDayOfWeek[dayName] = {
                                                teams,
                                                dates: []
                                            };
                                        }
                                        teamsByDayOfWeek[dayName].dates.push(dateStr);
                                    });

                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                                    return dayOrder.filter(day => teamsByDayOfWeek[day]).map(dayName => {
                                        const dayNameVi = {
                                            'MONDAY': 'Thứ 2',
                                            'TUESDAY': 'Thứ 3',
                                            'WEDNESDAY': 'Thứ 4',
                                            'THURSDAY': 'Thứ 5',
                                            'FRIDAY': 'Thứ 6',
                                            'SATURDAY': 'Thứ 7',
                                            'SUNDAY': 'Chủ nhật'
                                        }[dayName];

                                        const { teams, dates } = teamsByDayOfWeek[dayName];
                                        const dateCount = dates.length;

                                        return (
                                            <Box key={dayName}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.PRIMARY[600], display: 'block', mb: 0.5 }}>
                                                    {dayNameVi} ({dateCount} ngày: {dates[0]}{dateCount > 1 ? `, ... ${dates[dates.length - 1]}` : ''})
                                                </Typography>
                                                {teams.length === 0 ? (
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                                        Không có team
                                                    </Typography>
                                                ) : (
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        {teams.map(team => {
                                                            // Check if team is selected for ALL dates of this day
                                                            const selectedCount = dates.filter(d =>
                                                                (assignment.staffGroups || []).some(g => g.name === team.name && g.assignedDate === d)
                                                            ).length;
                                                            const isFullySelected = selectedCount === dateCount;
                                                            const isPartiallySelected = selectedCount > 0 && selectedCount < dateCount;

                                                            return (
                                                                <Chip
                                                                    key={team.id}
                                                                    label={`${team.name} • Leader: ${team?.leader?.full_name || '—'}${isPartiallySelected ? ` (${selectedCount}/${dateCount})` : ''}`}
                                                                    onClick={() => {
                                                                        // Add team for ALL dates of this day of week
                                                                        dates.forEach(dateStr => {
                                                                            addTeamAsStaffGroup(team, dateStr);
                                                                        });
                                                                    }}
                                                                    sx={{
                                                                        bgcolor: isFullySelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                            : isPartiallySelected
                                                                                ? alpha(COLORS.WARNING[100], 0.5)
                                                                                : alpha(COLORS.INFO[50], 0.8),
                                                                        cursor: isFullySelected ? 'default' : 'pointer',
                                                                        opacity: isFullySelected ? 0.6 : 1,
                                                                        '&:hover': {
                                                                            bgcolor: isFullySelected
                                                                                ? alpha(COLORS.SUCCESS[200], 0.3)
                                                                                : isPartiallySelected
                                                                                    ? alpha(COLORS.WARNING[200], 0.6)
                                                                                    : alpha(COLORS.INFO[100], 0.9)
                                                                        }
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </Stack>
                                                )}
                                            </Box>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Display assigned staff groups */}
                {(assignment.staffGroups || []).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${alpha(COLORS.PRIMARY[300], 0.5)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], display: 'block', mb: 2 }}>
                            👥 Nhóm đã phân công ({assignment.staffGroups.length}):
                        </Typography>
                        {[...(assignment.staffGroups || [])]
                            .sort((a, b) => {
                                // Sort by date
                                if (a.assignedDate && b.assignedDate) {
                                    return new Date(a.assignedDate) - new Date(b.assignedDate);
                                }
                                return 0;
                            })
                            .map((sg, idx) => (
                                <Paper key={idx} sx={{ mb: 2, border: `1px solid ${alpha(COLORS.PRIMARY[200], 0.4)}`, overflow: 'hidden', boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY[500], 0.1)}` }}>
                                    <Box sx={{ p: 2 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                                    {sg.assignedDayName && (
                                                        <Chip
                                                            label={`${sg.assignedDayName}, ${sg.assignedDate}`}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                                backgroundColor: alpha(COLORS.PRIMARY[500], 0.1),
                                                                color: COLORS.PRIMARY[700],
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
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
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            timeSlotAssignments: {
                                                                ...prev.timeSlotAssignments,
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
                )}
            </Paper>
        </Stack>
    );
};

// ==================== SERVICE ASSIGNMENT ====================
export const ServiceAssignment = ({ formData, setFormData, areas, staff, petGroupsMap, selectedService, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
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

    const selectedSlotIds = formData.selectedTimeSlots || [];

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
                                petGroupsMap={petGroupsMap}
                                selectedService={selectedService}
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

