import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Stack, Typography, IconButton, Button, Stepper, Step, StepLabel } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close, Assignment } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { WIZARD_STEPS, createInitialFormData } from '../../../api/tasksApi';
import { StaffGroupDialog, PetGroupDialog } from './TaskDialogs';
import { StepTaskType, StepSelectTask, StepTimeframe, StepShift, StepAssignment, StepConfirmation } from './TaskFormSteps';
import AlertModal from '../../../components/modals/AlertModal';

const TaskFormModal = ({ open, onClose, onCreateTask, onUpdateTask, editingTask, services, areas, staff, petGroupNames, petGroupsMap }) => {
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
            // Validate service task assignments (using selectedTimeSlots)
            if (!formData.selectedTimeSlots || formData.selectedTimeSlots.length === 0) {
                return 'Chưa chọn ca dịch vụ nào';
            }

            for (const slotId of formData.selectedTimeSlots) {
                const assignment = formData.timeSlotAssignments?.[slotId];
                if (!assignment) {
                    return `Chưa phân công cho ca dịch vụ "${slotId}"`;
                }

                // Check if at least one staff group is assigned
                if (!assignment.staffGroups || assignment.staffGroups.length === 0) {
                    return `Ca dịch vụ "${slotId}": Chưa có nhóm nhân viên nào được phân công`;
                }

                // Validate each staff group has a leader
                for (let i = 0; i < assignment.staffGroups.length; i++) {
                    const group = assignment.staffGroups[i];
                    if (!group.leaderId) {
                        return `Ca dịch vụ "${slotId}", Nhóm "${group.name}": Chưa chọn Leader`;
                    }
                    if (!group.staffIds || group.staffIds.length === 0) {
                        return `Ca dịch vụ "${slotId}", Nhóm "${group.name}": Chưa có thành viên nào`;
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

    const editStaffGroup = (context) => {
        const { groupIndex, groupData } = context;
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
                        petGroupsMap={petGroupsMap}
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
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Box
                        sx={{
                            p: 3,
                            background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.5)} 100%)`,
                            borderBottom: `3px solid ${COLORS.ERROR[500]}`
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.3)}`
                                }}
                            >
                                <Assignment sx={{ fontSize: 28, color: 'white' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[700], lineHeight: 1.2 }}>
                                    {editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.ERROR[600], fontWeight: 500 }}>
                                    {editingTask ? 'Cập nhật thông tin nhiệm vụ' : 'Phân công nhiệm vụ cho nhân viên'}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={onClose}
                                sx={{
                                    bgcolor: alpha(COLORS.ERROR[100], 0.5),
                                    '&:hover': { bgcolor: alpha(COLORS.ERROR[200], 0.8) }
                                }}
                            >
                                <Close />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Stepper */}
                    <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3) }}>
                        <Stepper
                            activeStep={activeStep}
                            sx={{
                                '& .MuiStepLabel-root .Mui-completed': {
                                    color: COLORS.SUCCESS[600]
                                },
                                '& .MuiStepLabel-root .Mui-active': {
                                    color: COLORS.ERROR[600]
                                },
                                '& .MuiStepLabel-label.Mui-active': {
                                    fontWeight: 700
                                },
                                '& .MuiStepLabel-label.Mui-completed': {
                                    fontWeight: 600
                                }
                            }}
                        >
                            {WIZARD_STEPS.map((label, index) => (
                                <Step key={label}>
                                    <StepLabel>
                                        <Typography variant="body2" sx={{ fontWeight: activeStep === index ? 700 : 500 }}>
                                            {label}
                                        </Typography>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>

                    {/* Content */}
                    <Box
                        sx={{
                            minHeight: 450,
                            maxHeight: 550,
                            overflowY: 'auto',
                            bgcolor: COLORS.BACKGROUND.DEFAULT
                        }}
                    >
                        {renderStepContent(activeStep)}
                    </Box>
                </DialogContent>

                {/* Actions */}
                <DialogActions
                    sx={{
                        p: 2.5,
                        borderTop: `2px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                        bgcolor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3)
                    }}
                >
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            borderColor: COLORS.TEXT.SECONDARY,
                            color: COLORS.TEXT.SECONDARY,
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: COLORS.TEXT.PRIMARY,
                                bgcolor: alpha(COLORS.TEXT.SECONDARY, 0.05)
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            disabled={editingTask ? activeStep === 1 : activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            sx={{
                                borderColor: COLORS.ERROR[300],
                                color: COLORS.ERROR[600],
                                fontWeight: 600,
                                '&:hover': {
                                    borderColor: COLORS.ERROR[500],
                                    bgcolor: alpha(COLORS.ERROR[50], 0.5)
                                }
                            }}
                        >
                            ← Quay lại
                        </Button>
                        {activeStep === WIZARD_STEPS.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleSaveTask}
                                sx={{
                                    backgroundColor: COLORS.SUCCESS[600],
                                    fontWeight: 700,
                                    px: 3,
                                    boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[500], 0.3)}`,
                                    '&:hover': {
                                        backgroundColor: COLORS.SUCCESS[700],
                                        boxShadow: `0 6px 16px ${alpha(COLORS.SUCCESS[600], 0.4)}`
                                    }
                                }}
                            >
                                {editingTask ? '✓ Cập nhật nhiệm vụ' : '✓ Tạo nhiệm vụ'}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{
                                    backgroundColor: COLORS.ERROR[500],
                                    fontWeight: 700,
                                    px: 3,
                                    boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.3)}`,
                                    '&:hover': {
                                        backgroundColor: COLORS.ERROR[600],
                                        boxShadow: `0 6px 16px ${alpha(COLORS.ERROR[600], 0.4)}`
                                    }
                                }}
                            >
                                Tiếp theo →
                            </Button>
                        )}
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* Staff Group Dialog */}
            <StaffGroupDialog
                open={staffGroupDialogOpen}
                onClose={() => setStaffGroupDialogOpen(false)}
                staff={staffGroupContext?.availableStaff || staff}
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

export default TaskFormModal;

