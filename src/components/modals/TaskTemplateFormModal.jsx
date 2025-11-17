import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Typography, Switch, FormControlLabel, Stack, alpha } from '@mui/material';
import { COLORS } from '../../constants/colors';

const TaskTemplateFormModal = ({ open, onClose, onSubmit, initialData = null, mode = 'create', workTypes = [], services = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        work_type_id: '',
        service_id: '',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        is_public: false,
        estimated_hours: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    title: initialData.title || initialData.name || '',
                    description: initialData.description || '',
                    work_type_id: initialData.work_type_id || '',
                    service_id: initialData.service_id || '',
                    priority: initialData.priority || 'MEDIUM',
                    status: initialData.status || 'ACTIVE',
                    is_public: initialData.is_public || false,
                    estimated_hours: initialData.estimated_hours ?? '',
                    // image_url removed - not in API spec
                });
            } else {
                // Reset form for create mode
                setFormData({
                    title: '',
                    description: '',
                    work_type_id: '',
                    service_id: '',
                    priority: 'MEDIUM',
                    status: 'ACTIVE',
                    is_public: false,
                    estimated_hours: '',
                    // image_url removed - not in API spec
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    // Handle input change
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

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

        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Tên nhiệm vụ là bắt buộc';
        }

        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        }

        if (!formData.work_type_id) {
            newErrors.work_type_id = 'Loại công việc là bắt buộc';
        }

        const estimatedHours = formData.estimated_hours === '' || formData.estimated_hours === null || formData.estimated_hours === undefined ? 0 : Number(formData.estimated_hours);
        if (isNaN(estimatedHours) || estimatedHours < 0) {
            newErrors.estimated_hours = 'Thời gian ước tính không được âm và phải là số hợp lệ';
        }
        if (estimatedHours === 0) {
            newErrors.estimated_hours = 'Thời gian ước tính là bắt buộc';
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
            // Submit data matching official API structure
            const submitData = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                estimated_hours: formData.estimated_hours === '' || formData.estimated_hours === null || formData.estimated_hours === undefined ? 0 : Number(formData.estimated_hours),
                is_public: formData.is_public,
                work_type_id: formData.work_type_id,
                service_id: formData.service_id || null,
                // image_url removed - not in API POST /api/tasks specification
            };

            await onSubmit(submitData);
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
                title: '',
                description: '',
                work_type_id: '',
                service_id: '',
                priority: 'MEDIUM',
                status: 'ACTIVE',
                is_public: false,
                estimated_hours: ''
                // image_url removed - not in API spec
            });
            setErrors({});
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
                    📋 {mode === 'edit' ? '✏️ Chỉnh sửa nhiệm vụ' : '➕ Tạo nhiệm vụ mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {errors.submit && (
                        <Alert severity="error" onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}>
                            {errors.submit}
                        </Alert>
                    )}

                    {/* Title */}
                    <TextField
                        label="Tên nhiệm vụ"
                        fullWidth
                        required
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        error={!!errors.title}
                        helperText={errors.title}
                        placeholder="VD: Chăm sóc mèo buổi sáng"
                    />

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
                        helperText={errors.description}
                        placeholder="Mô tả chi tiết về nhiệm vụ..."
                    />

                    {/* Work Type & Service */}
                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth required error={!!errors.work_type_id}>
                            <InputLabel>Loại công việc</InputLabel>
                            <Select
                                value={formData.work_type_id}
                                onChange={(e) => handleChange('work_type_id', e.target.value)}
                                label="Loại công việc"
                            >
                                <MenuItem value="">
                                    <em>Chọn loại công việc</em>
                                </MenuItem>
                                {workTypes.map(workType => (
                                    <MenuItem key={workType.id} value={workType.id}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {workType.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {workType.description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.work_type_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                    {errors.work_type_id}
                                </Typography>
                            )}
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Dịch vụ (Tùy chọn)</InputLabel>
                            <Select
                                value={formData.service_id}
                                onChange={(e) => handleChange('service_id', e.target.value)}
                                label="Dịch vụ (Tùy chọn)"
                            >
                                <MenuItem value="">
                                    <em>Không liên quan</em>
                                </MenuItem>
                                {services.map(service => (
                                    <MenuItem key={service.id} value={service.id}>
                                        {service.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Priority & Estimated Hours */}
                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel>Độ ưu tiên</InputLabel>
                            <Select
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                label="Độ ưu tiên"
                            >
                                <MenuItem value="LOW">Thấp</MenuItem>
                                <MenuItem value="MEDIUM">Trung bình</MenuItem>
                                <MenuItem value="HIGH">Cao</MenuItem>
                                <MenuItem value="URGENT">Khẩn cấp</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Thời gian ước tính (giờ)"
                            fullWidth
                            required
                            type="number"
                            inputProps={{ min: 0, step: 0.5 }}
                            value={formData.estimated_hours === '' || formData.estimated_hours === 0 ? '' : formData.estimated_hours}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string for clearing
                                if (value === '') {
                                    handleChange('estimated_hours', '');
                                    return;
                                }

                                // Remove leading zeros and parse
                                const cleanedValue = value.replace(/^0+/, '') || '0';
                                const numValue = parseFloat(cleanedValue);

                                // Only update if it's a valid number
                                if (!isNaN(numValue) && numValue >= 0) {
                                    handleChange('estimated_hours', numValue);
                                }
                            }}
                            onBlur={(e) => {
                                // Normalize the value on blur (remove leading zeros, keep empty if empty)
                                const value = e.target.value;
                                if (value === '' || value === null || value === undefined) {
                                    handleChange('estimated_hours', '');
                                } else {
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                        handleChange('estimated_hours', numValue);
                                    } else {
                                        handleChange('estimated_hours', '');
                                    }
                                }
                            }}
                            error={!!errors.estimated_hours}
                            helperText={errors.estimated_hours}
                            placeholder="Nhập số giờ"
                        />
                    </Stack>

                    {/* Status & Flags */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl fullWidth>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                label="Trạng thái"
                            >
                                <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                                <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
                            </Select>
                        </FormControl>

                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_public}
                                        onChange={(e) => handleChange('is_public', e.target.checked)}
                                    />
                                }
                                label="Công khai"
                            />
                        </Box>
                    </Stack>

                    {/* Image URL field removed - not in official API POST /api/tasks specification */}

                    {/* Info box */}
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'info.lighter',
                            borderRadius: 1,
                            border: '1px dashed',
                            borderColor: 'info.main'
                        }}
                    >
                        <Typography variant="body2" color="info.dark">
                            💡 <strong>Lưu ý:</strong> Nhiệm vụ công khai sẽ xuất hiện trong trải nghiệm đặt dịch vụ của khách hàng.
                            Hãy đảm bảo mô tả rõ ràng và thời gian ước tính phù hợp để hỗ trợ việc sắp ca.
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={handleClose} disabled={loading}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo mới')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskTemplateFormModal;
