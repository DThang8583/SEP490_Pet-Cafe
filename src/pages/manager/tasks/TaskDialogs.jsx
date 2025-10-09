import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Stack, TextField, FormGroup, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button, Box, Alert, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../../constants/colors';

// ==================== PET GROUP DIALOG ====================
export const PetGroupDialog = ({ open, onClose, petGroupNames, petGroupsMap, petGroupContext, formData, togglePetGroup }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn nhóm pet</Typography>
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
                                    />
                                }
                                label={`${groupName} (${petGroupsMap?.[groupName]?.length || 0} con)`}
                            />
                        );
                    })}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    {isEditMode ? 'Sửa nhóm nhân viên' : 'Tạo nhóm nhân viên'}
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Tên nhóm"
                        value={staffGroupForm.name}
                        onChange={(e) => setStaffGroupForm({ ...staffGroupForm, name: e.target.value })}
                        fullWidth
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Chọn nhân viên</Typography>
                        {(() => {
                            // Filter: active staff AND not already assigned to other groups
                            const availableStaff = (staff || []).filter(s =>
                                s.status === 'active' && !getAssignedStaffIds.has(s.id)
                            );

                            if (availableStaff.length === 0) {
                                return (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
                                        {getAssignedStaffIds.size > 0
                                            ? 'Tất cả nhân viên đã được phân vào các nhóm khác'
                                            : 'Không có nhân viên đang làm việc'}
                                    </Typography>
                                );
                            }

                            // Sắp xếp: Leader lên đầu
                            const sortedStaff = [...availableStaff].sort((a, b) => {
                                if (a.id === staffGroupForm.leaderId) return -1;
                                if (b.id === staffGroupForm.leaderId) return 1;
                                return 0;
                            });

                            return (
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
                                                />
                                            }
                                            label={
                                                <span>
                                                    {s.full_name} ({s.role === 'sale_staff' ? 'Sale' : 'Working'})
                                                    {s.id === staffGroupForm.leaderId && (
                                                        <Chip
                                                            label="Leader"
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: 18,
                                                                fontSize: '0.65rem',
                                                                backgroundColor: alpha(COLORS.ERROR[500], 0.1),
                                                                color: COLORS.ERROR[600],
                                                                fontWeight: 700
                                                            }}
                                                        />
                                                    )}
                                                </span>
                                            }
                                        />
                                    ))}
                                </FormGroup>
                            );
                        })()}
                    </Box>

                    {/* Warning nếu leader không trong nhóm */}
                    {staffGroupForm.leaderId && !(staffGroupForm.staffIds || []).includes(staffGroupForm.leaderId) && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            Leader hiện tại đã bị xóa khỏi nhóm. Vui lòng chọn leader mới!
                        </Alert>
                    )}

                    <FormControl fullWidth>
                        <InputLabel>Chọn leader</InputLabel>
                        <Select
                            value={staffGroupForm.leaderId}
                            onChange={(e) => setStaffGroupForm({ ...staffGroupForm, leaderId: e.target.value })}
                            label="Chọn leader"
                        >
                            {(staff || [])
                                .filter(s => (staffGroupForm.staffIds || []).includes(s.id) && s.status === 'active')
                                .map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={
                        !staffGroupForm.name ||
                        staffGroupForm.staffIds.length === 0 ||
                        !staffGroupForm.leaderId ||
                        !(staffGroupForm.staffIds || []).includes(staffGroupForm.leaderId)
                    }
                >
                    {isEditMode ? 'Lưu thay đổi' : 'Tạo nhóm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

