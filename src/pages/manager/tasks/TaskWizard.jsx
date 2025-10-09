import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Stack, Typography, IconButton, Button, Stepper, Step, StepLabel } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { WIZARD_STEPS, createInitialFormData } from '../../../api/tasksApi';

// Wizard Steps
import StepTaskType from './wizardSteps/StepTaskType';
import StepSelectTask from './wizardSteps/StepSelectTask';
import StepTimeframe from './wizardSteps/StepTimeframe';
import StepShift from './wizardSteps/StepShift';
import StepAssignment from './wizardSteps/StepAssignment';
import StepConfirmation from './wizardSteps/StepConfirmation';

// Dialogs
import StaffGroupDialog from './dialogs/StaffGroupDialog';
import PetGroupDialog from './dialogs/PetGroupDialog';

const TaskWizard = ({
    open,
    onClose,
    onCreateTask,
    services,
    areas,
    staff,
    petGroupNames,
    petGroupsMap
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(createInitialFormData());

    // Staff group dialog
    const [staffGroupDialogOpen, setStaffGroupDialogOpen] = useState(false);
    const [staffGroupForm, setStaffGroupForm] = useState({ name: '', staffIds: [], leaderId: '' });
    const [staffGroupContext, setStaffGroupContext] = useState(null);

    // Pet group dialog
    const [petGroupDialogOpen, setPetGroupDialogOpen] = useState(false);
    const [petGroupContext, setPetGroupContext] = useState(null);

    const selectedService = useMemo(() => {
        return services.find(s => s.id === formData.serviceId);
    }, [services, formData.serviceId]);

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleReset = () => {
        setActiveStep(0);
        setFormData(createInitialFormData());
    };

    const handleCreateTask = () => {
        const newTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...formData,
            createdAt: Date.now()
        };
        onCreateTask(newTask);
        onClose();
        handleReset();
    };

    const openStaffGroupDialog = (context) => {
        setStaffGroupContext(context);
        setStaffGroupForm({ name: '', staffIds: [], leaderId: '' });
        setStaffGroupDialogOpen(true);
    };

    const saveStaffGroup = () => {
        const newGroup = { ...staffGroupForm };

        if (staffGroupContext === 'internal') {
            setFormData(prev => ({
                ...prev,
                internalAssignment: {
                    ...prev.internalAssignment,
                    staffGroups: [...prev.internalAssignment.staffGroups, newGroup]
                }
            }));
        } else if (staffGroupContext?.timeSlot) {
            const timeSlot = staffGroupContext.timeSlot;
            setFormData(prev => ({
                ...prev,
                timeSlotAssignments: {
                    ...prev.timeSlotAssignments,
                    [timeSlot]: {
                        ...prev.timeSlotAssignments[timeSlot],
                        staffGroups: [
                            ...(prev.timeSlotAssignments[timeSlot]?.staffGroups || []),
                            newGroup
                        ]
                    }
                }
            }));
        }

        setStaffGroupDialogOpen(false);
    };

    const openPetGroupDialog = (context) => {
        setPetGroupContext(context);
        setPetGroupDialogOpen(true);
    };

    const togglePetGroup = (groupName) => {
        const petIds = petGroupsMap[groupName].map(p => p.id);
        const count = petIds.length;

        if (petGroupContext === 'internal') {
            setFormData(prev => {
                const existing = prev.internalAssignment.petGroups.find(pg => pg.groupName === groupName);
                if (existing) {
                    return {
                        ...prev,
                        internalAssignment: {
                            ...prev.internalAssignment,
                            petGroups: prev.internalAssignment.petGroups.filter(pg => pg.groupName !== groupName)
                        }
                    };
                } else {
                    return {
                        ...prev,
                        internalAssignment: {
                            ...prev.internalAssignment,
                            petGroups: [...prev.internalAssignment.petGroups, { groupName, petIds, count }]
                        }
                    };
                }
            });
        } else if (petGroupContext?.timeSlot) {
            const timeSlot = petGroupContext.timeSlot;
            setFormData(prev => {
                const assignment = prev.timeSlotAssignments[timeSlot] || { areaIds: [], petGroups: [], staffGroups: [] };
                const existing = assignment.petGroups.find(pg => pg.groupName === groupName);

                if (existing) {
                    return {
                        ...prev,
                        timeSlotAssignments: {
                            ...prev.timeSlotAssignments,
                            [timeSlot]: {
                                ...assignment,
                                petGroups: assignment.petGroups.filter(pg => pg.groupName !== groupName)
                            }
                        }
                    };
                } else {
                    return {
                        ...prev,
                        timeSlotAssignments: {
                            ...prev.timeSlotAssignments,
                            [timeSlot]: {
                                ...assignment,
                                petGroups: [...assignment.petGroups, { groupName, petIds, count }]
                            }
                        }
                    };
                }
            });
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <StepTaskType formData={formData} setFormData={setFormData} />;
            case 1:
                return <StepSelectTask formData={formData} setFormData={setFormData} services={services} />;
            case 2:
                return <StepTimeframe formData={formData} setFormData={setFormData} selectedService={selectedService} />;
            case 3:
                return <StepShift formData={formData} setFormData={setFormData} />;
            case 4:
                return (
                    <StepAssignment
                        formData={formData}
                        setFormData={setFormData}
                        areas={areas}
                        staff={staff}
                        selectedService={selectedService}
                        openStaffGroupDialog={openStaffGroupDialog}
                        openPetGroupDialog={openPetGroupDialog}
                    />
                );
            case 5:
                return <StepConfirmation formData={formData} selectedService={selectedService} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}` }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>
                                Tạo nhiệm vụ mới
                            </Typography>
                            <IconButton onClick={onClose}>
                                <Close />
                            </IconButton>
                        </Stack>
                    </Box>

                    <Stepper activeStep={activeStep} sx={{ p: 3 }}>
                        {WIZARD_STEPS.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ minHeight: 400, maxHeight: 500, overflowY: 'auto' }}>
                        {renderStepContent(activeStep)}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}` }}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Quay lại
                    </Button>
                    {activeStep === WIZARD_STEPS.length - 1 ? (
                        <Button variant="contained" onClick={handleCreateTask}>
                            Tạo nhiệm vụ
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>
                            Tiếp theo
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Staff Group Dialog */}
            <StaffGroupDialog
                open={staffGroupDialogOpen}
                onClose={() => setStaffGroupDialogOpen(false)}
                staff={staff}
                staffGroupForm={staffGroupForm}
                setStaffGroupForm={setStaffGroupForm}
                onSave={saveStaffGroup}
            />

            {/* Pet Group Dialog */}
            <PetGroupDialog
                open={petGroupDialogOpen}
                onClose={() => setPetGroupDialogOpen(false)}
                petGroupNames={petGroupNames}
                petGroupsMap={petGroupsMap}
                petGroupContext={petGroupContext}
                formData={formData}
                togglePetGroup={togglePetGroup}
            />
        </>
    );
};

export default TaskWizard;

