import React from 'react';
import { Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { INTERNAL_TEMPLATES } from '../../../../api/tasksApi';

const StepSelectTask = ({ formData, setFormData, services }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {formData.type === 'internal' ? 'Chọn nhiệm vụ nội bộ' : 'Chọn dịch vụ'}
            </Typography>

            {formData.type === 'internal' ? (
                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Chọn từ mẫu hoặc nhập tên</InputLabel>
                        <Select
                            value={formData.internalName}
                            onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                            label="Chọn từ mẫu hoặc nhập tên"
                        >
                            {INTERNAL_TEMPLATES.map(t => (
                                <MenuItem key={t.key} value={t.name}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Hoặc nhập tên tùy chỉnh"
                        value={formData.internalName}
                        onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                        fullWidth
                    />
                </Stack>
            ) : (
                <FormControl fullWidth>
                    <InputLabel>Chọn dịch vụ</InputLabel>
                    <Select
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        label="Chọn dịch vụ"
                    >
                        {services.map(s => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name} ({s.timeSlots.length} khung giờ)
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};

export default StepSelectTask;

