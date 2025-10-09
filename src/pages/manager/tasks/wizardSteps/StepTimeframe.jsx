import React from 'react';
import { Box, Typography, Stack, RadioGroup, FormControlLabel, Radio, TextField, Alert } from '@mui/material';

const StepTimeframe = ({ formData, setFormData, selectedService }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn khung thời gian</Typography>

            {formData.type === 'internal' ? (
                <Stack spacing={2}>
                    <RadioGroup
                        value={formData.timeframeType}
                        onChange={(e) => setFormData({ ...formData, timeframeType: e.target.value })}
                    >
                        <FormControlLabel value="day" control={<Radio />} label="Theo ngày" />
                        <FormControlLabel value="week" control={<Radio />} label="Theo tuần" />
                        <FormControlLabel value="month" control={<Radio />} label="Theo tháng" />
                    </RadioGroup>

                    {formData.timeframeType === 'day' && (
                        <TextField
                            type="date"
                            label="Chọn ngày"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                    {formData.timeframeType === 'week' && (
                        <TextField
                            type="week"
                            label="Chọn tuần"
                            value={formData.week}
                            onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                    {formData.timeframeType === 'month' && (
                        <TextField
                            type="month"
                            label="Chọn tháng"
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                </Stack>
            ) : (
                <Stack spacing={2}>
                    <RadioGroup
                        value={formData.timeframeType}
                        onChange={(e) => setFormData({ ...formData, timeframeType: e.target.value })}
                    >
                        <FormControlLabel value="day" control={<Radio />} label="Theo ngày" />
                        <FormControlLabel value="service_period" control={<Radio />} label="Theo khoảng thời gian dịch vụ" />
                    </RadioGroup>

                    {formData.timeframeType === 'day' && (
                        <TextField
                            type="date"
                            label="Chọn ngày"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}

                    {formData.timeframeType === 'service_period' && selectedService && (
                        <Box>
                            {selectedService.startDate && selectedService.endDate ? (
                                <Alert severity="info">
                                    Dịch vụ này diễn ra từ {selectedService.startDate} đến {selectedService.endDate}
                                </Alert>
                            ) : (
                                <Stack spacing={2}>
                                    <TextField
                                        type="date"
                                        label="Ngày bắt đầu"
                                        value={formData.servicePeriodStart}
                                        onChange={(e) => setFormData({ ...formData, servicePeriodStart: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                    <TextField
                                        type="date"
                                        label="Ngày kết thúc"
                                        value={formData.servicePeriodEnd}
                                        onChange={(e) => setFormData({ ...formData, servicePeriodEnd: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                </Stack>
                            )}
                        </Box>
                    )}
                </Stack>
            )}
        </Box>
    );
};

export default StepTimeframe;

