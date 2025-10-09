import React from 'react';
import { Box, Typography, FormGroup, FormControlLabel, Checkbox, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import TimeSlotAssignment from './TimeSlotAssignment';

const ServiceAssignment = ({
    formData,
    setFormData,
    areas,
    staff,
    selectedService,
    openStaffGroupDialog,
    openPetGroupDialog
}) => {
    if (!selectedService) {
        return <Alert severity="warning">Vui lòng chọn dịch vụ trước</Alert>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Phân công cho dịch vụ: {selectedService.name}</Typography>

            {/* TimeSlot Selection */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Chọn các khung giờ cần phân công</Typography>
                <FormGroup>
                    {selectedService.timeSlots.map(ts => (
                        <FormControlLabel
                            key={ts}
                            control={
                                <Checkbox
                                    checked={formData.selectedTimeSlots.includes(ts)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => {
                                            const newSelected = checked
                                                ? [...prev.selectedTimeSlots, ts]
                                                : prev.selectedTimeSlots.filter(t => t !== ts);

                                            // Initialize assignment if selecting
                                            const newAssignments = { ...prev.timeSlotAssignments };
                                            if (checked && !newAssignments[ts]) {
                                                newAssignments[ts] = { areaIds: [], petGroups: [], staffGroups: [] };
                                            }

                                            return {
                                                ...prev,
                                                selectedTimeSlots: newSelected,
                                                timeSlotAssignments: newAssignments
                                            };
                                        });
                                    }}
                                />
                            }
                            label={ts}
                        />
                    ))}
                </FormGroup>
            </Box>

            {/* Assignments for each selected timeSlot */}
            {formData.selectedTimeSlots.map(timeSlot => (
                <Accordion key={timeSlot} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Khung giờ: {timeSlot}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TimeSlotAssignment
                            timeSlot={timeSlot}
                            formData={formData}
                            setFormData={setFormData}
                            areas={areas}
                            staff={staff}
                            openStaffGroupDialog={openStaffGroupDialog}
                            openPetGroupDialog={openPetGroupDialog}
                        />
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default ServiceAssignment;

