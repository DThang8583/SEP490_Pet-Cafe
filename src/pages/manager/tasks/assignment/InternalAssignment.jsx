import React from 'react';
import { Box, Typography, Stack, FormGroup, FormControlLabel, Checkbox, Button, Chip, Paper, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Delete } from '@mui/icons-material';
import { COLORS } from '../../../../constants/colors';

const InternalAssignment = ({ formData, setFormData, areas, staff, openStaffGroupDialog, openPetGroupDialog }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Phân công cho nhiệm vụ nội bộ</Typography>

            {/* Khu vực */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Chọn khu vực (nhiều)</Typography>
                <FormGroup>
                    {areas.map(area => (
                        <FormControlLabel
                            key={area.id}
                            control={
                                <Checkbox
                                    checked={formData.internalAssignment.areaIds.includes(area.id)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            internalAssignment: {
                                                ...prev.internalAssignment,
                                                areaIds: checked
                                                    ? [...prev.internalAssignment.areaIds, area.id]
                                                    : prev.internalAssignment.areaIds.filter(id => id !== area.id)
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

            {/* Pet Groups (Optional) */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Nhóm pet (tùy chọn)</Typography>
                    <Button size="small" variant="outlined" onClick={() => openPetGroupDialog('internal')}>
                        Chọn nhóm pet
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {formData.internalAssignment.petGroups.map((pg, idx) => (
                        <Chip
                            key={idx}
                            label={`${pg.groupName} (${pg.count} con)`}
                            onDelete={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    internalAssignment: {
                                        ...prev.internalAssignment,
                                        petGroups: prev.internalAssignment.petGroups.filter((_, i) => i !== idx)
                                    }
                                }));
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Staff Groups */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Nhóm nhân viên</Typography>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => openStaffGroupDialog('internal')}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Thêm nhóm NV
                    </Button>
                </Stack>

                {formData.internalAssignment.staffGroups.map((sg, idx) => (
                    <Paper key={idx} sx={{ p: 2, mb: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}` }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sg.name}</Typography>
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
                                        internalAssignment: {
                                            ...prev.internalAssignment,
                                            staffGroups: prev.internalAssignment.staffGroups.filter((_, i) => i !== idx)
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
        </Box>
    );
};

export default InternalAssignment;

