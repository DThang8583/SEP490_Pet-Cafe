import React from 'react';
import { Box, Typography, Stack, FormGroup, FormControlLabel, Checkbox, Button, Chip, Paper, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Delete } from '@mui/icons-material';
import { COLORS } from '../../../../constants/colors';

const TimeSlotAssignment = ({
    timeSlot,
    formData,
    setFormData,
    areas,
    staff,
    openStaffGroupDialog,
    openPetGroupDialog
}) => {
    const assignment = formData.timeSlotAssignments[timeSlot] || { areaIds: [], petGroups: [], staffGroups: [] };

    return (
        <Stack spacing={3}>
            {/* Areas */}
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Khu vực</Typography>
                <FormGroup>
                    {areas.map(area => (
                        <FormControlLabel
                            key={area.id}
                            control={
                                <Checkbox
                                    checked={assignment.areaIds.includes(area.id)}
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
                    {assignment.petGroups.map((pg, idx) => (
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

                {assignment.staffGroups.map((sg, idx) => (
                    <Paper key={idx} sx={{ p: 2, mb: 1, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}` }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
                                <Typography variant="caption">
                                    {sg.staffIds.length} nhân viên | Leader: {staff.find(s => s.id === sg.leaderId)?.full_name || '—'}
                                </Typography>
                            </Box>
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
                    </Paper>
                ))}
            </Box>
        </Stack>
    );
};

export default TimeSlotAssignment;

