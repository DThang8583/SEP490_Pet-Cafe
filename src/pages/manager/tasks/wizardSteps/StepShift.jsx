import React from 'react';
import { Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { SHIFTS } from '../../../../api/tasksApi';

const StepShift = ({ formData, setFormData }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn ca làm</Typography>
            <Stack spacing={2}>
                <FormControl fullWidth>
                    <InputLabel>Ca</InputLabel>
                    <Select
                        value={formData.shift}
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                        label="Ca"
                    >
                        {SHIFTS.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {formData.shift === 'Khung giờ tùy chỉnh' && (
                    <Stack direction="row" spacing={2}>
                        <TextField
                            type="time"
                            label="Giờ bắt đầu"
                            value={formData.customShiftStart}
                            onChange={(e) => setFormData({ ...formData, customShiftStart: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            type="time"
                            label="Giờ kết thúc"
                            value={formData.customShiftEnd}
                            onChange={(e) => setFormData({ ...formData, customShiftEnd: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default StepShift;

