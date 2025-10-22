import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem, IconButton, Typography, Box } from '@mui/material';
import { Schedule, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const DAYS_IN_WEEK = [
    { value: 'MONDAY', label: 'Thứ Hai' },
    { value: 'TUESDAY', label: 'Thứ Ba' },
    { value: 'WEDNESDAY', label: 'Thứ Tư' },
    { value: 'THURSDAY', label: 'Thứ Năm' },
    { value: 'FRIDAY', label: 'Thứ Sáu' },
    { value: 'SATURDAY', label: 'Thứ Bảy' },
    { value: 'SUNDAY', label: 'Chủ nhật' }
];

const ShiftFormModal = ({
    open,
    onClose,
    editingShift,
    formData,
    onFormChange,
    onSave
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minWidth: 600 } }}>
            <DialogTitle sx={{ bgcolor: COLORS.PRIMARY[500], color: 'white', py: 2.5, px: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Schedule sx={{ fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                        {editingShift ? 'Sửa ca làm việc' : 'Tạo ca làm việc mới'}
                    </Typography>
                    <IconButton onClick={onClose} size="medium" sx={{ color: 'white' }}>
                        <Close sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <TextField
                        label="Tên ca làm việc"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="VD: Ca sáng, Ca chiều"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    <Stack direction="row" spacing={2.5}>
                        <TextField
                            label="Giờ bắt đầu"
                            required
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => onFormChange({ ...formData, start_time: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1, '& .MuiInputBase-root': { height: 56 } }}
                        />
                        <TextField
                            label="Giờ kết thúc"
                            required
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => onFormChange({ ...formData, end_time: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1, '& .MuiInputBase-root': { height: 56 } }}
                        />
                    </Stack>

                    <TextField
                        label="Mô tả"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                        placeholder="Mô tả về ca làm việc..."
                    />

                    <FormControl fullWidth>
                        <InputLabel>Ngày áp dụng</InputLabel>
                        <Select
                            multiple
                            label="Ngày áp dụng"
                            value={formData.applicable_days}
                            onChange={(e) => onFormChange({ ...formData, applicable_days: e.target.value })}
                            renderValue={(selected) => {
                                if (!selected || selected.length === 0) return 'Chọn ngày';
                                if (selected.length === 7) return 'Tất cả các ngày';
                                return `${selected.length} ngày đã chọn`;
                            }}
                            sx={{ height: 56 }}
                        >
                            {DAYS_IN_WEEK.map(day => (
                                <MenuItem key={day.value} value={day.value}>
                                    {day.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="large"
                    sx={{ minWidth: 130, height: 44 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    size="large"
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] },
                        minWidth: 130,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {editingShift ? 'Cập nhật' : 'Tạo ca'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShiftFormModal;

