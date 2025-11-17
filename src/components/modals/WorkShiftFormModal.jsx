import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, IconButton, Switch, FormControlLabel, Alert, alpha, Chip, Stack, FormGroup, Checkbox, FormControl, FormLabel } from '@mui/material';
import { Close, Schedule } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS, WEEKDAYS } from '../../api/workShiftApi';

const WorkShiftFormModal = ({
    open,
    onClose,
    onSubmit,
    initialData = null,
    mode = 'create' // 'create' or 'edit'
}) => {
    const [formData, setFormData] = useState({
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        applicable_days: [],
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name || '',
                    start_time: initialData.start_time || '',
                    end_time: initialData.end_time || '',
                    description: initialData.description || '',
                    applicable_days: initialData.applicable_days || [],
                    is_active: initialData.is_active !== undefined ? initialData.is_active : true
                });
            } else {
                setFormData({
                    name: '',
                    start_time: '',
                    end_time: '',
                    description: '',
                    applicable_days: [],
                    is_active: true
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên ca làm việc là bắt buộc';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Tên ca làm việc phải có ít nhất 3 ký tự';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Giờ bắt đầu là bắt buộc';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Giờ kết thúc là bắt buộc';
        }

        // Validate start_time < end_time
        if (formData.start_time && formData.end_time) {
            const start = formData.start_time.split(':').map(Number);
            const end = formData.end_time.split(':').map(Number);
            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];

            if (startMinutes >= endMinutes) {
                newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
            }
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
        }

        if (formData.applicable_days.length === 0) {
            newErrors.applicable_days = 'Phải chọn ít nhất một ngày áp dụng';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleDayToggle = (day) => {
        const newDays = formData.applicable_days.includes(day)
            ? formData.applicable_days.filter(d => d !== day)
            : [...formData.applicable_days, day];

        handleChange('applicable_days', newDays);
    };

    const handleSelectAllDays = () => {
        if (formData.applicable_days.length === WEEKDAYS.length) {
            handleChange('applicable_days', []);
        } else {
            handleChange('applicable_days', [...WEEKDAYS]);
        }
    };

    const handleSubmit = () => {
        if (validate()) {
            const submitData = mode === 'create'
                ? {
                    name: formData.name.trim(),
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    description: formData.description.trim(),
                    applicable_days: formData.applicable_days
                }
                : {
                    name: formData.name.trim(),
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    description: formData.description.trim(),
                    applicable_days: formData.applicable_days,
                    is_active: formData.is_active
                };

            onSubmit(submitData);
        }
    };

    const handleClose = () => {
        if (!errors.submitting) {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`
                }
            }}
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule />
                    {mode === 'create' ? '➕ Tạo ca làm việc mới' : '✏️ Chỉnh sửa ca làm việc'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Name */}
                    <TextField
                        label="Tên ca làm việc"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name || 'VD: Ca Sáng, Ca Chiều, Ca Tối'}
                        placeholder="Nhập tên ca làm việc"
                    />

                    {/* Time */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Giờ bắt đầu"
                            type="time"
                            fullWidth
                            required
                            value={formData.start_time}
                            onChange={(e) => handleChange('start_time', e.target.value)}
                            error={!!errors.start_time}
                            helperText={errors.start_time}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                        />
                        <TextField
                            label="Giờ kết thúc"
                            type="time"
                            fullWidth
                            required
                            value={formData.end_time}
                            onChange={(e) => handleChange('end_time', e.target.value)}
                            error={!!errors.end_time}
                            helperText={errors.end_time}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                        />
                    </Stack>

                    {/* Description */}
                    <TextField
                        label="Mô tả"
                        fullWidth
                        required
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        error={!!errors.description}
                        helperText={errors.description || 'Mô tả chi tiết về công việc trong ca này'}
                        placeholder="Nhập mô tả chi tiết..."
                    />

                    {/* Applicable Days */}
                    <FormControl error={!!errors.applicable_days} component="fieldset">
                        <FormLabel component="legend">
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                Ngày áp dụng *
                            </Typography>
                        </FormLabel>

                        <Box sx={{ mb: 1 }}>
                            <Button
                                size="small"
                                onClick={handleSelectAllDays}
                                variant="outlined"
                            >
                                {formData.applicable_days.length === WEEKDAYS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </Button>
                        </Box>

                        <FormGroup>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {WEEKDAYS.map(day => (
                                    <FormControlLabel
                                        key={day}
                                        control={
                                            <Checkbox
                                                checked={formData.applicable_days.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                            />
                                        }
                                        label={WEEKDAY_LABELS[day]}
                                    />
                                ))}
                            </Box>
                        </FormGroup>

                        {errors.applicable_days && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                                {errors.applicable_days}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Active Status (only for edit mode) */}
                    {mode === 'edit' && (
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => handleChange('is_active', e.target.checked)}
                                        color="success"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formData.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formData.is_active
                                                ? 'Ca làm việc này đang được sử dụng'
                                                : 'Ca làm việc này đã bị vô hiệu hóa'}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    )}

                    {/* Info Alert */}
                    {mode === 'create' && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Ca làm việc mới sẽ được tạo ở trạng thái <strong>hoạt động</strong> mặc định.
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                    gap: 1.5
                }}
            >
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        borderColor: COLORS.GRAY[300],
                        color: COLORS.TEXT.SECONDARY,
                        '&:hover': {
                            borderColor: COLORS.GRAY[400],
                            bgcolor: alpha(COLORS.GRAY[100], 0.5)
                        }
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                    }}
                >
                    {mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkShiftFormModal;

