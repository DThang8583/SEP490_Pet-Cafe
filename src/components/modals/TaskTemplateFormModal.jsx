import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, InputAdornment, Typography, FormHelperText, Autocomplete, Chip } from '@mui/material';
import { TASK_TYPES } from '../../api/taskTemplateApi';

const TaskTemplateFormModal = ({ open, onClose, onSubmit, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        task_type: '',
        name: '',
        description: '',
        estimate_duration: 0 // Default to 0, will be set to 30 when "Làm service" is selected
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                const taskType = initialData.task_type || '';
                setFormData({
                    task_type: taskType,
                    name: initialData.name || '',
                    description: initialData.description || '',
                    // Only set estimate_duration if task type is "Làm service"
                    estimate_duration: taskType === 'Làm service' ? (initialData.estimate_duration || 30) : 0
                });
            } else {
                // Reset form for create mode
                setFormData({
                    task_type: '',
                    name: '',
                    description: '',
                    estimate_duration: 0
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    // Handle input change
    const handleChange = (field, value) => {
        const newFormData = {
            ...formData,
            [field]: value
        };

        // If task_type changed and it's not "Làm service", set estimate_duration to 0
        if (field === 'task_type' && value !== 'Làm service') {
            newFormData.estimate_duration = 0;
        }
        // If task_type changed to "Làm service" and estimate_duration is 0, set default
        else if (field === 'task_type' && value === 'Làm service' && (!formData.estimate_duration || formData.estimate_duration === 0)) {
            newFormData.estimate_duration = 30;
        }

        setFormData(newFormData);

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.task_type) {
            newErrors.task_type = 'Task Type là bắt buộc';
        }

        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'Tên task là bắt buộc';
        }

        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Mô tả task là bắt buộc';
        }

        // Only validate estimate_duration for "Làm service" type
        if (formData.task_type === 'Làm service') {
            if (!formData.estimate_duration || formData.estimate_duration <= 0) {
                newErrors.estimate_duration = 'Thời gian ước tính phải lớn hơn 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            setErrors({
                submit: error.message || 'Có lỗi xảy ra'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!loading) {
            setFormData({
                task_type: '',
                name: '',
                description: '',
                estimate_duration: 0
            });
            setErrors({});
            onClose();
        }
    };

    // Get task type info - match by name instead of key
    const selectedTaskType = TASK_TYPES.find(t => t.name === formData.task_type);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: 24
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid #e0e0e0',
                pb: 2,
                fontWeight: 600
            }}>
                {mode === 'edit' ? '✏️ Chỉnh sửa Task' : '➕ Tạo Task mới'}
            </DialogTitle>

            <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Task Type - Autocomplete with freeSolo */}
                    <Autocomplete
                        freeSolo
                        options={TASK_TYPES.map(type => type.name)}
                        value={formData.task_type}
                        onChange={(event, newValue) => {
                            handleChange('task_type', newValue || '');
                        }}
                        onInputChange={(event, newInputValue) => {
                            handleChange('task_type', newInputValue);
                        }}
                        disabled={loading}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Loại nhiệm vụ"
                                required
                                error={!!errors.task_type}
                                helperText={errors.task_type || 'Chọn từ gợi ý hoặc nhập loại nhiệm vụ mới'}
                                placeholder="Ví dụ: Dọn dẹp, Cho pet ăn, Thu ngân..."
                            />
                        )}
                        renderOption={(props, option) => {
                            return (
                                <Box component="li" {...props}>
                                    <span>{option}</span>
                                </Box>
                            );
                        }}
                        sx={{ mt: 1 }}
                    />

                    {/* Selected Task Type Preview */}
                    {selectedTaskType && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: `${selectedTaskType.color}15`,
                                borderRadius: 1,
                                border: `1px solid ${selectedTaskType.color}40`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{selectedTaskType.icon}</span>
                            <Typography variant="body2" fontWeight={600}>
                                {selectedTaskType.name}
                            </Typography>
                        </Box>
                    )}

                    {/* Custom Task Type Notice */}
                    {formData.task_type && !selectedTaskType && (
                        <Alert severity="info" sx={{ mt: -1 }}>
                            <Typography variant="body2">
                                <strong>Loại nhiệm vụ mới:</strong> "{formData.task_type}"
                            </Typography>
                            <Typography variant="caption">
                                Loại nhiệm vụ này sẽ được thêm vào hệ thống.
                            </Typography>
                        </Alert>
                    )}

                    {/* Name */}
                    <TextField
                        fullWidth
                        required
                        label="Tên nhiệm vụ"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={loading}
                        error={!!errors.name}
                        helperText={errors.name || 'Tên hiển thị của nhiệm vụ'}
                        placeholder="Ví dụ: Tắm rửa thú cưng cơ bản"
                    />

                    {/* Description */}
                    <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Mô tả chi tiết"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        disabled={loading}
                        error={!!errors.description}
                        helperText={errors.description || 'Mô tả chi tiết về nhiệm vụ'}
                        placeholder="Mô tả chi tiết về công việc này..."
                    />

                    {/* Estimate Duration - Only for "Làm service" type */}
                    {formData.task_type === 'Làm service' && (
                        <>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Thời gian ước tính (phút)"
                                value={formData.estimate_duration || ''}
                                onChange={(e) => handleChange('estimate_duration', e.target.value === '' ? '' : parseInt(e.target.value))}
                                disabled={loading}
                                error={!!errors.estimate_duration}
                                helperText={errors.estimate_duration || 'Thời gian dự kiến hoàn thành'}
                                placeholder="Nhập thời gian (phút)"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                                    inputProps: { min: 1, step: 5 }
                                }}
                            />

                            {/* Duration Preview */}
                            {formData.estimate_duration > 0 && (
                                <Box sx={{
                                    p: 1.5,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        ⏱️ Thời gian: <strong>{formData.estimate_duration} phút</strong>
                                        {formData.estimate_duration >= 60 && (
                                            <span> ({Math.floor(formData.estimate_duration / 60)}h {formData.estimate_duration % 60}m)</span>
                                        )}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: '1px solid #e0e0e0',
                px: 3,
                py: 2,
                gap: 1
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{ minWidth: 100 }}
                >
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo mới')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskTemplateFormModal;

