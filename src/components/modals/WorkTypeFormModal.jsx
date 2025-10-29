import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    Switch,
    FormControlLabel,
    Alert,
    alpha
} from '@mui/material';
import { Close, WorkOutline } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const WorkTypeFormModal = ({
    open,
    onClose,
    onSubmit,
    initialData = null,
    mode = 'create' // 'create' or 'edit'
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    is_active: initialData.is_active !== undefined ? initialData.is_active : true
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    is_active: true
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên loại công việc là bắt buộc';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Tên loại công việc phải có ít nhất 3 ký tự';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Tên loại công việc không được vượt quá 100 ký tự';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
        } else if (formData.description.trim().length > 500) {
            newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
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

    const handleSubmit = () => {
        if (validate()) {
            // For create: only send name and description
            // For edit: send name, description, and is_active
            const submitData = mode === 'create'
                ? {
                    name: formData.name.trim(),
                    description: formData.description.trim()
                }
                : {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
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
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2,
                    borderBottom: `1px solid ${COLORS.GRAY[200]}`
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(COLORS.PRIMARY[500], 0.1)
                        }}
                    >
                        <WorkOutline sx={{ color: COLORS.PRIMARY[600], fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} color={COLORS.TEXT.PRIMARY}>
                        {mode === 'create' ? 'Tạo loại công việc mới' : 'Chỉnh sửa loại công việc'}
                    </Typography>
                </Box>

                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: COLORS.GRAY[600],
                        '&:hover': { bgcolor: alpha(COLORS.GRAY[100], 0.8) }
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Name */}
                    <TextField
                        label="Tên loại công việc"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name || 'VD: Food & Beverage, Pet Care, Cleaning'}
                        placeholder="Nhập tên loại công việc"
                    />

                    {/* Description */}
                    <TextField
                        label="Mô tả"
                        fullWidth
                        required
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        error={!!errors.description}
                        helperText={errors.description || 'Mô tả chi tiết về loại công việc này'}
                        placeholder="Nhập mô tả chi tiết về trách nhiệm và công việc..."
                    />

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
                                                ? 'Loại công việc này đang được sử dụng'
                                                : 'Loại công việc này đã bị vô hiệu hóa'}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    )}

                    {/* Info Alert */}
                    {mode === 'create' && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Loại công việc mới sẽ được tạo ở trạng thái <strong>hoạt động</strong> mặc định.
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${COLORS.GRAY[200]}`,
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

export default WorkTypeFormModal;

