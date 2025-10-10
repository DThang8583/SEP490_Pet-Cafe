import React from 'react';
import { Box, Typography, Stack, FormGroup, FormControlLabel, Checkbox, Button, Chip, Paper, IconButton, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Delete, ExpandMore, ChevronRight, Edit } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';

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
                            label={area.name}
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
                        onClick={() => openStaffGroupDialog({ shift })}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Thêm nhóm NV
                    </Button>
                </Stack>

                {(assignment.staffGroups || []).map((sg, idx) => (
                    <Paper key={idx} sx={{ mb: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                    <Typography variant="caption">
                                        {sg.staffIds?.length || 0} nhân viên | Leader: {staff.find(s => s.id === sg.leaderId)?.full_name || '—'}
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
                                        onClick={() => editStaffGroup({ shift }, idx, sg)}
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

// ==================== INTERNAL ASSIGNMENT ====================
export const InternalAssignment = ({ formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    const selectedShifts = formData.shifts || [];

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

            <Stack spacing={2}>
                {selectedShifts.map((shift, idx) => (
                    <Accordion key={shift} defaultExpanded={idx === 0}>
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.5),
                                '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[100], 0.5) }
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                🕐 Ca làm: {shift}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 2 }}>
                            <ShiftAssignment
                                shift={shift}
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

// ==================== SERVICE ASSIGNMENT ====================
export const ServiceAssignment = ({ formData, setFormData, areas, staff, selectedService, openStaffGroupDialog, openPetGroupDialog, editStaffGroup }) => {
    // Service tasks now use shift-based assignment (same as internal tasks)
    return (
        <InternalAssignment
            formData={formData}
            setFormData={setFormData}
            areas={areas}
            staff={staff}
            openStaffGroupDialog={openStaffGroupDialog}
            openPetGroupDialog={openPetGroupDialog}
            editStaffGroup={editStaffGroup}
        />
    );
};

