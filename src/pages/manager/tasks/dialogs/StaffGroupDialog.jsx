import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Stack, TextField, FormGroup, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';

const StaffGroupDialog = ({ open, onClose, staff, staffGroupForm, setStaffGroupForm, onSave }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Tạo nhóm nhân viên</Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Tên nhóm"
                        value={staffGroupForm.name}
                        onChange={(e) => setStaffGroupForm({ ...staffGroupForm, name: e.target.value })}
                        fullWidth
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Chọn nhân viên</Typography>
                        <FormGroup>
                            {staff.filter(s => s.status === 'active').map(s => (
                                <FormControlLabel
                                    key={s.id}
                                    control={
                                        <Checkbox
                                            checked={staffGroupForm.staffIds.includes(s.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setStaffGroupForm(prev => ({
                                                    ...prev,
                                                    staffIds: checked
                                                        ? [...prev.staffIds, s.id]
                                                        : prev.staffIds.filter(id => id !== s.id)
                                                }));
                                            }}
                                        />
                                    }
                                    label={`${s.full_name} (${s.role === 'sale_staff' ? 'Sale' : 'Working'})`}
                                />
                            ))}
                        </FormGroup>
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel>Chọn leader</InputLabel>
                        <Select
                            value={staffGroupForm.leaderId}
                            onChange={(e) => setStaffGroupForm({ ...staffGroupForm, leaderId: e.target.value })}
                            label="Chọn leader"
                        >
                            {staff.filter(s => staffGroupForm.staffIds.includes(s.id)).map(s => (
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
                    disabled={!staffGroupForm.name || staffGroupForm.staffIds.length === 0 || !staffGroupForm.leaderId}
                >
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StaffGroupDialog;

