import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Chip, Typography, Paper, Divider, InputAdornment, FormHelperText, OutlinedInput, alpha, IconButton, Stack } from '@mui/material';
import { Close, RocketLaunch } from '@mui/icons-material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';
import * as areasApi from '../../api/areasApi';
import { COLORS } from '../../constants/colors';

const SlotPublishModal = ({ open, onClose, onSubmit, slotData }) => {
    const [formData, setFormData] = useState({
        capacity: 1,
        price: 0,
        description: '',
        start_time: '',
        end_time: '',
        applicable_days: []
    });

    const [areaInfo, setAreaInfo] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Reset form function - defined before useEffect to avoid initialization error
    const resetForm = useCallback(() => {
        setFormData({
            capacity: 1,
            price: 0,
            description: '',
            start_time: '',
            end_time: '',
            applicable_days: []
        });
        setAreaInfo(null);
        setErrors({});
    }, []);

    // Load area info function
    const loadAreaInfo = useCallback(async (areaId) => {
        if (!areaId) return;
        try {
            const response = await areasApi.getAreaById(areaId);
            setAreaInfo(response);
        } catch (error) {
            console.error('Error loading area info:', error);
            setErrors(prev => ({
                ...prev,
                submit: 'Không thể tải thông tin khu vực'
            }));
        }
    }, []);

    // Load slot data and area info when modal opens
    useEffect(() => {
        if (open && slotData) {
            // Initialize form with slot data
            setFormData({
                capacity: slotData.capacity || 1,
                price: slotData.price || 0,
                description: slotData.description || '',
                start_time: slotData.start_time || '',
                end_time: slotData.end_time || '',
                applicable_days: slotData.applicable_days || []
            });

            // Load area info for capacity validation
            loadAreaInfo(slotData.area_id);
        } else {
            resetForm();
        }
    }, [open, slotData, loadAreaInfo, resetForm]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field using functional update
        setErrors(prev => {
            if (prev[field]) {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            }
            return prev;
        });
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};

        // Capacity validation (Required)
        if (!formData.capacity || formData.capacity <= 0) {
            newErrors.capacity = 'Capacity phải lớn hơn 0';
        }

        // Validate capacity with area capacity
        if (areaInfo && formData.capacity > areaInfo.capacity) {
            newErrors.capacity = `Capacity vượt quá giới hạn của khu vực (${areaInfo.capacity})`;
        }

        // Time validation
        if (!formData.start_time) {
            newErrors.start_time = 'Thời gian bắt đầu là bắt buộc';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Thời gian kết thúc là bắt buộc';
        }

        if (formData.start_time && formData.end_time) {
            const start = formData.start_time.split(':').map(Number);
            const end = formData.end_time.split(':').map(Number);
            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];

            if (endMinutes <= startMinutes) {
                newErrors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
            }
        }

        // Applicable days validation
        if (formData.applicable_days.length === 0) {
            newErrors.applicable_days = 'Phải chọn ít nhất 1 ngày';
        }

        // Price validation (optional but if provided must be valid)
        if (formData.price < 0) {
            newErrors.price = 'Giá không được âm';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, areaInfo]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            resetForm();
            onClose();
        } catch (error) {
            setErrors({
                submit: error.message || 'Có lỗi xảy ra'
            });
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, onSubmit, resetForm, onClose]);

    const handleClose = useCallback(() => {
        if (loading) return;
        resetForm();
        onClose();
    }, [loading, resetForm, onClose]);

    // Memoize computed values for performance
    const capacityUsagePercent = useMemo(() => {
        return areaInfo && areaInfo.capacity > 0 ? (formData.capacity / areaInfo.capacity) * 100 : 0;
    }, [areaInfo, formData.capacity]);

    const formattedPrice = useMemo(() => {
        return formData.price > 0 ? formatPrice(formData.price) : null;
    }, [formData.price]);

    const capacityColor = useMemo(() => {
        if (capacityUsagePercent > 100) return { bg: '#ffebee', border: '#f44336', bar: '#f44336' };
        if (capacityUsagePercent > 80) return { bg: '#fff3e0', border: '#ff9800', bar: '#ff9800' };
        return { bg: '#e8f5e9', border: '#4caf50', bar: '#4caf50' };
    }, [capacityUsagePercent]);

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
                    bgcolor: COLORS.SUCCESS[50],
                    borderBottom: `3px solid ${COLORS.SUCCESS[500]}`
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    color: COLORS.SUCCESS[800],
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <RocketLaunch />
                        <Typography variant="h6" component="span">
                            🚀 Publish Slot cho khách hàng
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={handleClose}
                        disabled={loading}
                        sx={{
                            color: COLORS.SUCCESS[800],
                            '&:hover': {
                                bgcolor: alpha(COLORS.SUCCESS[100], 0.5)
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Current Slot Info */}
                {slotData && (
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            bgcolor: alpha(COLORS.INFO[50], 0.3),
                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: COLORS.INFO[700] }}>
                            📋 Thông tin slot hiện tại:
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                            {slotData.start_time} - {slotData.end_time}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {slotData.applicable_days?.map(day => (
                                <Chip
                                    key={day}
                                    label={WEEKDAY_LABELS[day]}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Time Range (Can Edit) */}
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            ⏰ Chỉnh sửa thời gian (Tùy chọn)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <TextField
                                fullWidth
                                required
                                type="time"
                                label="Thời gian bắt đầu *"
                                value={formData.start_time}
                                onChange={(e) => handleChange('start_time', e.target.value)}
                                disabled={loading}
                                error={!!errors.start_time}
                                helperText={errors.start_time}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                fullWidth
                                required
                                type="time"
                                label="Thời gian kết thúc *"
                                value={formData.end_time}
                                onChange={(e) => handleChange('end_time', e.target.value)}
                                disabled={loading}
                                error={!!errors.end_time}
                                helperText={errors.end_time}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                    </Box>

                    {/* Applicable Days (Can Edit) */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            📅 Chỉnh sửa ngày áp dụng (Tùy chọn)
                        </Typography>
                        <FormControl fullWidth error={!!errors.applicable_days} sx={{ mt: 1 }}>
                            <InputLabel>Áp dụng cho các ngày *</InputLabel>
                            <Select
                                multiple
                                value={formData.applicable_days}
                                onChange={(e) => handleChange('applicable_days', e.target.value)}
                                input={<OutlinedInput label="Áp dụng cho các ngày *" />}
                                disabled={loading}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={WEEKDAY_LABELS[value]} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {WEEKDAYS.map((day) => (
                                    <MenuItem key={day} value={day}>
                                        {WEEKDAY_LABELS[day]}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.applicable_days && (
                                <FormHelperText>{errors.applicable_days}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>

                    <Divider />

                    {/* Capacity (Required) */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            👥 Capacity (Bắt buộc)
                        </Typography>
                        <TextField
                            fullWidth
                            required
                            type="number"
                            label="Số lượng khách tối đa *"
                            value={formData.capacity || ''}
                            onChange={(e) => handleChange('capacity', e.target.value === '' ? '' : parseInt(e.target.value))}
                            disabled={loading}
                            error={!!errors.capacity}
                            helperText={errors.capacity || `Tối đa: ${areaInfo?.capacity || '...'} khách (giới hạn khu vực)`}
                            placeholder="Nhập số lượng khách"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">khách</InputAdornment>,
                                inputProps: { min: 1, max: areaInfo?.capacity || 100 }
                            }}
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        {/* Area Capacity Info */}
                        {areaInfo && (
                            <Box
                                sx={{
                                    p: 2,
                                    mt: 2,
                                    borderRadius: 2,
                                    bgcolor: capacityColor.bg,
                                    border: `1px solid ${alpha(capacityColor.border, 0.3)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    📍 Khu vực: <strong>{areaInfo.name}</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Capacity: <strong>{formData.capacity} / {areaInfo.capacity}</strong> khách
                                    ({capacityUsagePercent.toFixed(0)}%)
                                </Typography>
                                <Box sx={{
                                    mt: 1.5,
                                    height: 8,
                                    borderRadius: 1,
                                    bgcolor: alpha(COLORS.GRAY[300], 0.3),
                                    overflow: 'hidden'
                                }}>
                                    <Box
                                        sx={{
                                            height: '100%',
                                            width: `${Math.min(capacityUsagePercent, 100)}%`,
                                            bgcolor: capacityColor.bar,
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Price (Optional) */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            💰 Giá dịch vụ (Tùy chọn)
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            label="Giá"
                            value={formData.price || ''}
                            onChange={(e) => handleChange('price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            disabled={loading}
                            error={!!errors.price}
                            helperText={errors.price || 'Để trống nếu không muốn hiển thị giá'}
                            placeholder="Nhập giá (VNĐ)"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                                inputProps: { min: 0, step: 1000 }
                            }}
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        {/* Price Preview */}
                        {formattedPrice && (
                            <Box
                                sx={{
                                    p: 2,
                                    mt: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(COLORS.SUCCESS[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 0.5, fontWeight: 600 }}>
                                    💰 Khách hàng sẽ thấy
                                </Typography>
                                <Typography variant="h5" fontWeight={700} sx={{ color: COLORS.SUCCESS[700] }}>
                                    {formattedPrice}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Description (Optional) */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            📝 Mô tả (Tùy chọn)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Mô tả thêm"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={loading}
                            placeholder="Thêm mô tả hoặc ghi chú cho slot này..."
                            helperText="Thông tin này sẽ hiển thị cho khách hàng"
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>

                    {/* Status Change Info */}
                    <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                            ✅ Sau khi publish, slot này sẽ được công khai và khách hàng có thể đặt lịch.
                        </Typography>
                    </Alert>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                pt: 2,
                pb: 2,
                gap: 1.5
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{
                        minWidth: 100,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: alpha(COLORS.BORDER.DEFAULT, 0.5)
                    }}
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !areaInfo}
                    variant="contained"
                    color="success"
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[500], 0.3)}`,
                        '&:hover': {
                            boxShadow: `0 6px 16px ${alpha(COLORS.SUCCESS[500], 0.4)}`
                        }
                    }}
                >
                    {loading ? 'Đang publish...' : '🚀 Publish'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotPublishModal;

