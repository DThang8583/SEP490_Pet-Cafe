import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Chip, Typography, Paper, Divider, InputAdornment, FormHelperText, OutlinedInput } from '@mui/material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';
import * as areasApi from '../../api/areasApi';

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
    }, [open, slotData]);

    const loadAreaInfo = async (areaId) => {
        try {
            const response = await areasApi.getAreaById(areaId);
            // areasApi.getAreaById returns area object directly, not wrapped in {data: ...}
            setAreaInfo(response);
        } catch (error) {
            console.error('Error loading area info:', error);
            setErrors({ submit: 'Không thể tải thông tin khu vực' });
        }
    };

    const resetForm = () => {
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
    };

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

    const validateForm = () => {
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
    };

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

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    const capacityUsagePercent = areaInfo ? (formData.capacity / areaInfo.capacity) * 100 : 0;

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
                🚀 Publish Slot cho khách hàng
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Current Slot Info */}
                {slotData && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📋 Slot hiện tại
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {slotData.start_time} - {slotData.end_time}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {slotData.applicable_days?.map(day => (
                                <Chip key={day} label={WEEKDAY_LABELS[day]} size="small" />
                            ))}
                        </Box>
                    </Paper>
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
                                label="Thời gian bắt đầu"
                                value={formData.start_time}
                                onChange={(e) => handleChange('start_time', e.target.value)}
                                disabled={loading}
                                error={!!errors.start_time}
                                helperText={errors.start_time}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                required
                                type="time"
                                label="Thời gian kết thúc"
                                value={formData.end_time}
                                onChange={(e) => handleChange('end_time', e.target.value)}
                                disabled={loading}
                                error={!!errors.end_time}
                                helperText={errors.end_time}
                                InputLabelProps={{ shrink: true }}
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
                            label="Số lượng khách tối đa"
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
                            sx={{ mt: 1 }}
                        />

                        {/* Area Capacity Info */}
                        {areaInfo && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mt: 2,
                                    bgcolor: capacityUsagePercent > 100 ? '#ffebee' : capacityUsagePercent > 80 ? '#fff3e0' : '#e8f5e9',
                                    borderRadius: 1,
                                    border: `1px solid ${capacityUsagePercent > 100 ? '#f44336' : capacityUsagePercent > 80 ? '#ff9800' : '#4caf50'}40`
                                }}
                            >
                                <Typography variant="body2" gutterBottom>
                                    📍 Khu vực: <strong>{areaInfo.name}</strong>
                                </Typography>
                                <Typography variant="body2">
                                    Capacity: <strong>{formData.capacity} / {areaInfo.capacity}</strong> khách
                                    ({capacityUsagePercent.toFixed(0)}%)
                                </Typography>
                                <Box sx={{
                                    mt: 1,
                                    height: 8,
                                    bgcolor: 'rgba(0,0,0,0.1)',
                                    borderRadius: 1,
                                    overflow: 'hidden'
                                }}>
                                    <Box
                                        sx={{
                                            height: '100%',
                                            width: `${Math.min(capacityUsagePercent, 100)}%`,
                                            bgcolor: capacityUsagePercent > 100 ? '#f44336' : capacityUsagePercent > 80 ? '#ff9800' : '#4caf50',
                                            transition: 'width 0.3s'
                                        }}
                                    />
                                </Box>
                            </Paper>
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
                            sx={{ mt: 1 }}
                        />

                        {/* Price Preview */}
                        {formData.price > 0 && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mt: 2,
                                    bgcolor: '#e8f5e9',
                                    borderRadius: 1,
                                    border: '1px solid #4caf5040'
                                }}
                            >
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Khách hàng sẽ thấy
                                </Typography>
                                <Typography variant="h5" fontWeight={600} color="success.main">
                                    {formatPrice(formData.price)}
                                </Typography>
                            </Paper>
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
                            sx={{ mt: 1 }}
                        />
                    </Box>

                    {/* Status Change Info */}
                    <Alert severity="success" variant="outlined">
                        <Typography variant="body2">
                            ✅ Sau khi publish, slot này sẽ được công khai và khách hàng có thể đặt lịch.
                        </Typography>
                    </Alert>
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
                    disabled={loading || !areaInfo}
                    variant="contained"
                    color="success"
                    sx={{ minWidth: 100 }}
                >
                    {loading ? 'Đang publish...' : '🚀 Publish'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotPublishModal;

