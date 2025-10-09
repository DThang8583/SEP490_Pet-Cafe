import React from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const StepTaskType = ({ formData, setFormData }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn loại nhiệm vụ</Typography>
            <RadioGroup value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <FormControlLabel value="internal" control={<Radio />} label="Nội bộ" />
                <FormControlLabel value="service" control={<Radio />} label="Dịch vụ" />
            </RadioGroup>
        </Box>
    );
};

export default StepTaskType;

