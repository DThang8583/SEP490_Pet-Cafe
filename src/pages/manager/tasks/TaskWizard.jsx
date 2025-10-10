import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Stack, Typography, IconButton, Button, Stepper, Step, StepLabel } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { WIZARD_STEPS, createInitialFormData } from '../../../api/tasksApi';
import { StaffGroupDialog, PetGroupDialog } from './TaskDialogs';
import { StepTaskType, StepSelectTask, StepTimeframe, StepShift, StepAssignment, StepConfirmation } from './WizardSteps';
import AlertModal from '../../../components/modals/AlertModal';

const TaskWizard = ({ open, onClose, onCreateTask, onUpdateTask, editingTask, services, areas, staff, petGroupNames, petGroupsMap }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(createInitialFormData());
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error', title: 'Lỗi' });

    // Load data when editing
    React.useEffect(() => {
        if (open && editingTask) {
            setFormData(editingTask);
            setActiveStep(1); // Bắt đầu từ bước "Chọn nhiệm vụ" khi edit
        } else if (open && !editingTask) {
            setFormData(createInitialFormData());
            setActiveStep(0);
        }
    }, [open, editingTask]);

    // Staff group dialog
    const [staffGroupDialogOpen, setStaffGroupDialogOpen] = useState(false);
    const [staffGroupForm, setStaffGroupForm] = useState({ name: '', staffIds: [], leaderId: '' });
    const [staffGroupContext, setStaffGroupContext] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editGroupIndex, setEditGroupIndex] = useState(-1);

    // Pet group dialog
    const [petGroupDialogOpen, setPetGroupDialogOpen] = useState(false);
    const [petGroupContext, setPetGroupContext] = useState(null);

    const selectedService = useMemo(() => {
        return services.find(s => s.id === formData.serviceId);
    }, [services, formData.serviceId]);

    const handleNext = () => {
        // Validate assignment step before proceeding
        if (activeStep === 4) { // Assignment step
            const validationError = validateAssignments();
            if (validationError) {
                setAlert({
                    open: true,
                    title: 'Lỗi',
                    message: validationError,
                    type: 'error'
                });
                return;
            }
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const validateAssignments = () => {
        if (formData.type === 'internal') {
            // Validate internal task assignments
            const shifts = formData.shifts || [];
            if (shifts.length === 0) {
                return 'Vui lòng chọn ít nhất một ca làm việc';
            }

            for (const shift of shifts) {
                const assignment = formData.shiftAssignments?.[shift];
                if (!assignment) {
                    return `Chưa phân công cho ca "${shift}"`;
                }

                // Check if at least one staff group is assigned
                if (!assignment.staffGroups || assignment.staffGroups.length === 0) {
                    return `Ca "${shift}": Chưa có nhóm nhân viên nào được phân công`;
                }

                // Validate each staff group has a leader
                for (let i = 0; i < assignment.staffGroups.length; i++) {
                    const group = assignment.staffGroups[i];
                    if (!group.leaderId) {
                        return `Ca "${shift}", Nhóm "${group.name}": Chưa chọn Leader`;
                    }
                    if (!group.staffIds || group.staffIds.length === 0) {
                        return `Ca "${shift}", Nhóm "${group.name}": Chưa có thành viên nào`;
                    }
                }
            }
        } else if (formData.type === 'service') {
            // Validate service task assignments (now using shifts like internal tasks)
            if (!formData.shifts || formData.shifts.length === 0) {
                return 'Chưa chọn ca làm việc nào';
            }

            for (const shift of formData.shifts) {
                const assignment = formData.shiftAssignments?.[shift];
                if (!assignment) {
                    return `Chưa phân công cho ca làm "${shift}"`;
                }

                // Check if at least one staff group is assigned
                if (!assignment.staffGroups || assignment.staffGroups.length === 0) {
                    return `Ca làm "${shift}": Chưa có nhóm nhân viên nào được phân công`;
                }

                // Validate each staff group has a leader
                for (let i = 0; i < assignment.staffGroups.length; i++) {
                    const group = assignment.staffGroups[i];
                    if (!group.leaderId) {
                        return `Ca làm "${shift}", Nhóm "${group.name}": Chưa chọn Leader`;
                    }
                    if (!group.staffIds || group.staffIds.length === 0) {
                        return `Ca làm "${shift}", Nhóm "${group.name}": Chưa có thành viên nào`;
                    }
                }
            }
        }

        return null; // No errors
    };

    const handleReset = () => {
        setActiveStep(0);
        setFormData(createInitialFormData());
    };

    const handleSaveTask = () => {
        if (editingTask) {
            // Update existing task
            const updatedTask = {
                ...editingTask,
                ...formData,
                updatedAt: Date.now()
            };
            onUpdateTask(updatedTask);
        } else {
            // Create new task
            const newTask = {
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                ...formData,
                createdAt: Date.now()
            };
            onCreateTask(newTask);
        }
        onClose();
        handleReset();
    };

    const openStaffGroupDialog = (context) => {
        setStaffGroupContext(context);
        setStaffGroupForm({ name: '', staffIds: [], leaderId: '' });
        setIsEditMode(false);
        setEditGroupIndex(-1);
        setStaffGroupDialogOpen(true);
    };

    const editStaffGroup = (context, groupIndex, groupData) => {
        setStaffGroupContext(context);
        setStaffGroupForm({
            name: groupData.name,
            staffIds: [...groupData.staffIds],
            leaderId: groupData.leaderId
        });
        setIsEditMode(true);
        setEditGroupIndex(groupIndex);
        setStaffGroupDialogOpen(true);
    };

    const saveStaffGroup = () => {
        const groupData = { ...staffGroupForm };

        if (staffGroupContext?.shift) {
            const shift = staffGroupContext.shift;
            setFormData(prev => {
                const currentGroups = prev.shiftAssignments?.[shift]?.staffGroups || [];
                const updatedGroups = isEditMode
                    ? currentGroups.map((g, idx) => idx === editGroupIndex ? groupData : g)
                    : [...currentGroups, groupData];

                return {
                    ...prev,
                    shiftAssignments: {
                        ...prev.shiftAssignments,
                        [shift]: {
                            ...prev.shiftAssignments[shift],
                            staffGroups: updatedGroups
                        }
                    }
                };
            });
        }
        // NOTE: timeSlot context removed - services now use shifts like internal tasks

        setStaffGroupDialogOpen(false);
        setIsEditMode(false);
        setEditGroupIndex(-1);
    };

    const openPetGroupDialog = (context) => {
        setPetGroupContext(context);
        setPetGroupDialogOpen(true);
    };

    const togglePetGroup = (groupName) => {
        const petIds = petGroupsMap[groupName].map(p => p.id);
        const count = petIds.length;

        if (petGroupContext?.shift) {
            const shift = petGroupContext.shift;
            setFormData(prev => {
                const assignment = prev.shiftAssignments[shift] || { areaIds: [], petGroups: [], staffGroups: [] };
                const existing = assignment.petGroups.find(pg => pg.groupName === groupName);

                if (existing) {
                    return {
                        ...prev,
                        shiftAssignments: {
                            ...prev.shiftAssignments,
                            [shift]: {
                                ...assignment,
                                petGroups: assignment.petGroups.filter(pg => pg.groupName !== groupName)
                            }
                        }
                    };
                } else {
                    return {
                        ...prev,
                        shiftAssignments: {
                            ...prev.shiftAssignments,
                            [shift]: {
                                ...assignment,
                                petGroups: [...assignment.petGroups, { groupName, petIds, count }]
                            }
                        }
                    };
                }
            });
        }
        // NOTE: timeSlot context removed - services now use shifts like internal tasks
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <StepTaskType formData={formData} setFormData={setFormData} />;
            case 1:
                return <StepSelectTask formData={formData} setFormData={setFormData} services={services} isEditMode={!!editingTask} />;
            case 2:
                return <StepTimeframe formData={formData} setFormData={setFormData} selectedService={selectedService} />;
            case 3:
                return <StepShift formData={formData} setFormData={setFormData} selectedService={selectedService} />;
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
                        editStaffGroup={editStaffGroup}
                    />
                );
            case 5:
                return <StepConfirmation formData={formData} selectedService={selectedService} areas={areas} staff={staff} petGroupsMap={petGroupsMap} />;
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
                                {editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
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
                    <Button
                        disabled={editingTask ? activeStep === 1 : activeStep === 0}
                        onClick={handleBack}
                    >
                        Quay lại
                    </Button>
                    {activeStep === WIZARD_STEPS.length - 1 ? (
                        <Button variant="contained" onClick={handleSaveTask}>
                            {editingTask ? 'Cập nhật' : 'Tạo nhiệm vụ'}
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
                formData={formData}
                staffGroupContext={staffGroupContext}
                isEditMode={isEditMode}
                editGroupIndex={editGroupIndex}
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

            {/* Alert Modal */}
            <AlertModal
                isOpen={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </>
    );
};

export default TaskWizard;

