import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Stack, TextField, FormGroup, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button, Box, Alert, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../../constants/colors';

// ==================== PET GROUP DIALOG ====================
export const PetGroupDialog = ({ open, onClose, petGroupNames, petGroupsMap, petGroupContext, formData, togglePetGroup }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent sx={{ p: 0 }}>
                {/* Header */}
                <Box
                    sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)} 0%, ${alpha(COLORS.SECONDARY[100], 0.5)} 100%)`,
                        borderBottom: `3px solid ${COLORS.SECONDARY[500]}`
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SECONDARY[700] }}>
                            🐾 Chọn nhóm pet
                        </Typography>
                    </Stack>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                        Chọn các nhóm pet cần phân công cho nhiệm vụ
                    </Typography>
                    <FormGroup>
                        {(petGroupNames || []).map(groupName => {
                            const isSelected = petGroupContext?.shift
                                ? (formData.shiftAssignments?.[petGroupContext.shift]?.petGroups || []).some(pg => pg.groupName === groupName)
                                : petGroupContext?.timeSlot
                                    ? (formData.timeSlotAssignments?.[petGroupContext.timeSlot]?.petGroups || []).some(pg => pg.groupName === groupName)
                                    : false;

                            return (
                                <FormControlLabel
                                    key={groupName}
                                    control={
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => togglePetGroup(groupName)}
                                            sx={{
                                                color: COLORS.SECONDARY[400],
                                                '&.Mui-checked': {
                                                    color: COLORS.SECONDARY[600]
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                                                {groupName}
                                            </Typography>
                                            <Chip
                                                label={`${petGroupsMap?.[groupName]?.length || 0} con`}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    bgcolor: isSelected ? alpha(COLORS.SECONDARY[100], 0.8) : alpha(COLORS.TEXT.SECONDARY, 0.1),
                                                    color: isSelected ? COLORS.SECONDARY[700] : COLORS.TEXT.SECONDARY
                                                }}
                                            />
                                        </Stack>
                                    }
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        bgcolor: isSelected ? alpha(COLORS.SECONDARY[50], 0.3) : 'transparent',
                                        '&:hover': {
                                            bgcolor: alpha(COLORS.SECONDARY[50], 0.5)
                                        }
                                    }}
                                />
                            );
                        })}
                    </FormGroup>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}` }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: COLORS.SECONDARY[500],
                        fontWeight: 700,
                        '&:hover': { bgcolor: COLORS.SECONDARY[600] }
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ==================== STAFF GROUP DIALOG ====================
export const StaffGroupDialog = ({ open, onClose, staff, staffGroupForm, setStaffGroupForm, onSave, formData, staffGroupContext, isEditMode, editGroupIndex }) => {
    // Debug logging
    React.useEffect(() => {
        if (open) {
            console.log('StaffGroupDialog opened');
            console.log('Total staff:', staff?.length || 0);
            console.log('Staff data:', staff);
            const workingStaff = (staff || []).filter(s => s.status === 'active');
            console.log('Active staff (status=active):', workingStaff.length);
            console.log('Active staff data:', workingStaff);
        }
    }, [open, staff]);

    // Get all staff IDs that are already assigned to other groups (excluding current group if editing)
    const getAssignedStaffIds = React.useMemo(() => {
        const assignedIds = new Set();

        if (staffGroupContext?.shift) {
            // For internal tasks with shifts, get staff from this shift's existing groups (skip current group if editing)
            const shift = staffGroupContext.shift;
            const groups = formData?.shiftAssignments?.[shift]?.staffGroups || [];
            groups.forEach((group, idx) => {
                if (!(isEditMode && idx === editGroupIndex)) {
                    (group.staffIds || []).forEach(id => assignedIds.add(id));
                }
            });
        } else if (staffGroupContext?.timeSlot) {
            // For service tasks, get staff from this timeSlot's existing groups (skip current group if editing)
            const timeSlot = staffGroupContext.timeSlot;
            const groups = formData?.timeSlotAssignments?.[timeSlot]?.staffGroups || [];
            groups.forEach((group, idx) => {
                if (!(isEditMode && idx === editGroupIndex)) {
                    (group.staffIds || []).forEach(id => assignedIds.add(id));
                }
            });
        }

        return assignedIds;
    }, [formData, staffGroupContext, isEditMode, editGroupIndex]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogContent sx={{ p: 0 }}>
                {/* Header */}
                <Box
                    sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.8)} 0%, ${alpha(COLORS.PRIMARY[100], 0.5)} 100%)`,
                        borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.PRIMARY[700] }}>
                            👥 {isEditMode ? 'Sửa nhóm nhân viên' : 'Tạo nhóm nhân viên'}
                        </Typography>
                    </Stack>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <TextField
                            label="Tên nhóm"
                            value={staffGroupForm.name}
                            onChange={(e) => setStaffGroupForm({ ...staffGroupForm, name: e.target.value })}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: COLORS.PRIMARY[400]
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: COLORS.PRIMARY[500],
                                        borderWidth: 2
                                    }
                                }
                            }}
                        />

                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                Chọn thành viên nhóm
                            </Typography>
                            {(() => {
                                // Filter: active staff AND not already assigned to other groups
                                const availableStaff = (staff || []).filter(s =>
                                    s.status === 'active' && !getAssignedStaffIds.has(s.id)
                                );

                                if (availableStaff.length === 0) {
                                    return (
                                        <Alert severity="warning" sx={{ my: 2 }}>
                                            <Typography variant="body2">
                                                {getAssignedStaffIds.size > 0
                                                    ? 'Tất cả nhân viên đã được phân vào các nhóm khác'
                                                    : 'Không có nhân viên đang làm việc'}
                                            </Typography>
                                        </Alert>
                                    );
                                }

                                // Sắp xếp: Leader lên đầu
                                const sortedStaff = [...availableStaff].sort((a, b) => {
                                    if (a.id === staffGroupForm.leaderId) return -1;
                                    if (b.id === staffGroupForm.leaderId) return 1;
                                    return 0;
                                });

                                return (
                                    <Box
                                        sx={{
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                            borderRadius: 2,
                                            p: 1
                                        }}
                                    >
                                        <FormGroup>
                                            {sortedStaff.map(s => (
                                                <FormControlLabel
                                                    key={s.id}
                                                    control={
                                                        <Checkbox
                                                            checked={(staffGroupForm.staffIds || []).includes(s.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setStaffGroupForm(prev => {
                                                                    const newStaffIds = checked
                                                                        ? [...prev.staffIds, s.id]
                                                                        : prev.staffIds.filter(id => id !== s.id);

                                                                    // Nếu bỏ check Leader hiện tại, reset leaderId
                                                                    const newLeaderId = (!checked && s.id === prev.leaderId)
                                                                        ? ''
                                                                        : prev.leaderId;

                                                                    return {
                                                                        ...prev,
                                                                        staffIds: newStaffIds,
                                                                        leaderId: newLeaderId
                                                                    };
                                                                });
                                                            }}
                                                            sx={{
                                                                color: COLORS.PRIMARY[400],
                                                                '&.Mui-checked': {
                                                                    color: COLORS.PRIMARY[600]
                                                                }
                                                            }}
                                                        />
                                                    }
                                                    label={
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography variant="body2" sx={{ fontWeight: (staffGroupForm.staffIds || []).includes(s.id) ? 700 : 500 }}>
                                                                {s.full_name}
                                                            </Typography>
                                                            <Chip
                                                                label={s.role === 'sale_staff' ? 'Sale' : 'Working'}
                                                                size="small"
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: '0.65rem',
                                                                    bgcolor: s.role === 'sale_staff' ? alpha(COLORS.INFO[100], 0.6) : alpha(COLORS.SUCCESS[100], 0.6),
                                                                    color: s.role === 'sale_staff' ? COLORS.INFO[700] : COLORS.SUCCESS[700]
                                                                }}
                                                            />
                                                            {s.id === staffGroupForm.leaderId && (
                                                                <Chip
                                                                    label="Leader"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.65rem',
                                                                        backgroundColor: COLORS.ERROR[500],
                                                                        color: 'white',
                                                                        fontWeight: 700
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    }
                                                    sx={{
                                                        p: 1,
                                                        borderRadius: 1,
                                                        bgcolor: (staffGroupForm.staffIds || []).includes(s.id) ? alpha(COLORS.PRIMARY[50], 0.3) : 'transparent',
                                                        '&:hover': {
                                                            bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Box>
                                );
                            })()}
                        </Box>

                        {/* Warning nếu leader không trong nhóm */}
                        {staffGroupForm.leaderId && !(staffGroupForm.staffIds || []).includes(staffGroupForm.leaderId) && (
                            <Alert severity="warning" sx={{ borderLeft: `4px solid ${COLORS.WARNING[500]}` }}>
                                Leader hiện tại đã bị xóa khỏi nhóm. Vui lòng chọn leader mới!
                            </Alert>
                        )}

                        <FormControl
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: COLORS.ERROR[400]
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: COLORS.ERROR[500],
                                        borderWidth: 2
                                    }
                                }
                            }}
                        >
                            <InputLabel sx={{ fontWeight: 600 }}>Chọn leader</InputLabel>
                            <Select
                                value={staffGroupForm.leaderId}
                                onChange={(e) => setStaffGroupForm({ ...staffGroupForm, leaderId: e.target.value })}
                                label="Chọn leader"
                            >
                                {(staff || [])
                                    .filter(s => (staffGroupForm.staffIds || []).includes(s.id) && s.status === 'active')
                                    .map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body2">{s.full_name}</Typography>
                                                <Chip
                                                    label="Leader"
                                                    size="small"
                                                    sx={{
                                                        height: 18,
                                                        fontSize: '0.65rem',
                                                        bgcolor: COLORS.ERROR[500],
                                                        color: 'white'
                                                    }}
                                                />
                                            </Stack>
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, borderTop: `2px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`, bgcolor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3) }}>
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
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={
                        !staffGroupForm.name ||
                        staffGroupForm.staffIds.length === 0 ||
                        !staffGroupForm.leaderId ||
                        !(staffGroupForm.staffIds || []).includes(staffGroupForm.leaderId)
                    }
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        fontWeight: 700,
                        px: 3,
                        boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`,
                        '&:hover': {
                            bgcolor: COLORS.PRIMARY[600],
                            boxShadow: `0 6px 16px ${alpha(COLORS.PRIMARY[600], 0.4)}`
                        },
                        '&:disabled': {
                            bgcolor: alpha(COLORS.TEXT.SECONDARY, 0.3)
                        }
                    }}
                >
                    {isEditMode ? '✓ Lưu thay đổi' : '✓ Tạo nhóm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

