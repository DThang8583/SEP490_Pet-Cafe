import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Typography, Stack, InputAdornment } from '@mui/material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';

const SLOT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    BOOKED: 'BOOKED',
    CANCELLED: 'CANCELLED'
};

const SlotFormModal = ({ open, onClose, onSubmit, taskData, initialData = null, mode = 'create', areas = [], petGroups = [], teams = [] }) => {
    const [formData, setFormData] = useState({
        task_id: '',
        area_id: '',
        pet_group_id: '',
        team_id: '',
        pet_id: '',
        start_time: '',
        end_time: '',
        max_capacity: 0,
        special_notes: '',
        day_of_week: '',
        price: 0,
        service_status: SLOT_STATUS.UNAVAILABLE
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Filter teams based on selected time range
    const filteredTeams = useMemo(() => {
        if (!formData.start_time || !formData.end_time || !teams || teams.length === 0) {
            return teams || [];
        }

        // Convert time strings to comparable format (HH:MM:SS)
        const slotStart = formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time;
        const slotEnd = formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time;

        return teams.filter(team => {
            // Team must have at least one work shift that covers the slot time range
            if (!team.team_work_shifts || team.team_work_shifts.length === 0) {
                return false;
            }

            return team.team_work_shifts.some(tws => {
                if (!tws.work_shift) return false;

                const shiftStart = tws.work_shift.start_time;
                const shiftEnd = tws.work_shift.end_time;

                // Check if work shift covers or overlaps with the slot time
                // Work shift must start at or before slot start AND end at or after slot end
                return shiftStart <= slotStart && shiftEnd >= slotEnd;
            });
        });
    }, [teams, formData.start_time, formData.end_time]);

    // Initialize form when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                // Edit mode: load existing slot data
                setFormData({
                    task_id: initialData.task_id || '',
                    area_id: initialData.area_id || '',
                    pet_group_id: initialData.pet_group_id || '',
                    team_id: initialData.team_id || '',
                    pet_id: initialData.pet_id || '',
                    start_time: initialData.start_time || '',
                    end_time: initialData.end_time || '',
                    max_capacity: initialData.max_capacity ?? 0,
                    special_notes: initialData.special_notes || '',
                    day_of_week: initialData.day_of_week || '',
                    price: initialData.price ?? 0,
                    service_status: initialData.service_status || SLOT_STATUS.UNAVAILABLE
                });
            } else if (mode === 'create' && taskData) {
                // Create mode: auto-fill task_id
                setFormData(prev => ({
                    ...prev,
                    task_id: taskData.id
                }));
            } else {
                resetForm();
            }
            setErrors({});
        }
    }, [open, mode, taskData, initialData]);

    // Reset team_id if selected team is no longer in filtered list
    useEffect(() => {
        if (formData.team_id && formData.start_time && formData.end_time) {
            const isTeamStillValid = filteredTeams.some(team => team.id === formData.team_id);
            if (!isTeamStillValid) {
                setFormData(prev => ({
                    ...prev,
                    team_id: ''
                }));
            }
        }
    }, [filteredTeams, formData.team_id, formData.start_time, formData.end_time]);

    const resetForm = () => {
        setFormData({
            task_id: '',
            area_id: '',
            pet_group_id: '',
            team_id: '',
            pet_id: '',
            start_time: '',
            end_time: '',
            max_capacity: 0,
            special_notes: '',
            day_of_week: '',
            price: 0,
            service_status: SLOT_STATUS.UNAVAILABLE
        });
        setErrors({});
    };

    const handleChange = (field, value) => {
        // Special handling for area_id change
        if (field === 'area_id') {
            const selectedArea = areas.find(a => a.id === value);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                // Auto-fill max_capacity from selected area
                max_capacity: selectedArea ? selectedArea.max_capacity : 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

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

        if (!formData.task_id) {
            newErrors.task_id = 'Task là bắt buộc';
        }

        if (!formData.day_of_week) {
            newErrors.day_of_week = 'Ngày trong tuần là bắt buộc';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Giờ bắt đầu là bắt buộc';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Giờ kết thúc là bắt buộc';
        }

        // Validate time range
        if (formData.start_time && formData.end_time) {
            if (formData.start_time >= formData.end_time) {
                newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
            }
        }

        if (formData.max_capacity < 0) {
            newErrors.max_capacity = 'Sức chứa không được âm';
        }

        // Validate max_capacity against area's max_capacity
        if (formData.area_id && formData.max_capacity > 0) {
            const selectedArea = areas.find(a => a.id === formData.area_id);
            if (selectedArea && formData.max_capacity > selectedArea.max_capacity) {
                newErrors.max_capacity = `Sức chứa không được vượt quá ${selectedArea.max_capacity} (sức chứa của khu vực ${selectedArea.name})`;
            }
        }

        // Validate price for edit mode (only for public tasks)
        if (mode === 'edit') {
            if (taskData && taskData.is_public) {
                if (formData.price === undefined || formData.price === null || formData.price < 0) {
                    newErrors.price = 'Giá không được âm';
                }
            }

            if (!formData.service_status) {
                newErrors.service_status = 'Trạng thái là bắt buộc';
            }
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
            // Base submit data (for both create and edit)
            const submitData = {
                task_id: formData.task_id,
                area_id: formData.area_id || null,
                pet_group_id: formData.pet_group_id || null,
                team_id: formData.team_id || null,
                pet_id: formData.pet_id || null,
                start_time: formData.start_time,
                end_time: formData.end_time,
                max_capacity: parseInt(formData.max_capacity) || 0,
                special_notes: formData.special_notes || null,
                day_of_week: formData.day_of_week
            };

            // Add price and service_status for edit mode
            if (mode === 'edit') {
                // Only add price for public tasks
                if (taskData && taskData.is_public) {
                    submitData.price = parseFloat(formData.price) || 0;
                }
                submitData.service_status = formData.service_status;
            }

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

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

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
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                    {mode === 'edit' ? 'Chỉnh sửa Ca làm việc' : 'Tạo Ca làm việc mới'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {taskData?.title || taskData?.name || initialData?.task?.title}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {errors.submit && (
                        <Alert severity="error" onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}>
                            {errors.submit}
                        </Alert>
                    )}

                    {/* Day of week */}
                    <FormControl fullWidth required error={!!errors.day_of_week}>
                        <InputLabel>Ngày trong tuần</InputLabel>
                        <Select
                            value={formData.day_of_week}
                            onChange={(e) => handleChange('day_of_week', e.target.value)}
                            label="Ngày trong tuần"
                        >
                            <MenuItem value="">
                                <em>Chọn ngày</em>
                            </MenuItem>
                            {WEEKDAYS.map(day => (
                                <MenuItem key={day} value={day}>
                                    {WEEKDAY_LABELS[day]}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.day_of_week && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                {errors.day_of_week}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Warning for past day selection */}
                    {formData.day_of_week && (() => {
                        const today = new Date();
                        const todayDayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][today.getDay()];
                        const todayIndex = WEEKDAYS.indexOf(todayDayOfWeek);
                        const selectedIndex = WEEKDAYS.indexOf(formData.day_of_week);
                        const isPast = selectedIndex < todayIndex;

                        if (isPast) {
                            return (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    ⚠️ <strong>{WEEKDAY_LABELS[formData.day_of_week]}</strong> đã qua trong tuần này.
                                    Nhiệm vụ hằng ngày sẽ được tạo cho <strong>tuần sau</strong>,
                                    không tạo cho ngày trong quá khứ.
                                </Alert>
                            );
                        } else if (selectedIndex === todayIndex) {
                            return (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    ℹ️ Đây là ngày <strong>hôm nay</strong>.
                                    Nhiệm vụ hằng ngày sẽ được tạo cho tuần này.
                                </Alert>
                            );
                        } else {
                            return (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                    ✅ <strong>{WEEKDAY_LABELS[formData.day_of_week]}</strong> chưa tới trong tuần này.
                                    Nhiệm vụ hằng ngày sẽ được tạo cho tuần này.
                                </Alert>
                            );
                        }
                    })()}

                    {/* Time range */}
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
                        />
                    </Stack>

                    {/* Team */}
                    <FormControl fullWidth>
                        <InputLabel>Team (Tùy chọn)</InputLabel>
                        <Select
                            value={formData.team_id}
                            onChange={(e) => handleChange('team_id', e.target.value)}
                            label="Team (Tùy chọn)"
                            disabled={!formData.start_time || !formData.end_time}
                        >
                            <MenuItem value="">
                                <em>Không chọn</em>
                            </MenuItem>
                            {filteredTeams.map(team => (
                                <MenuItem key={team.id} value={team.id}>
                                    {team.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formData.start_time && formData.end_time && filteredTeams.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
                                Không có team nào phù hợp với khung giờ này
                            </Typography>
                        )}
                    </FormControl>

                    {/* Area */}
                    <FormControl fullWidth>
                        <InputLabel>Khu vực (Tùy chọn)</InputLabel>
                        <Select
                            value={formData.area_id}
                            onChange={(e) => handleChange('area_id', e.target.value)}
                            label="Khu vực (Tùy chọn)"
                        >
                            <MenuItem value="">
                                <em>Không chọn</em>
                            </MenuItem>
                            {areas.map(area => (
                                <MenuItem key={area.id} value={area.id}>
                                    {area.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Pet Group */}
                    <FormControl fullWidth>
                        <InputLabel>Nhóm Pet (Tùy chọn)</InputLabel>
                        <Select
                            value={formData.pet_group_id}
                            onChange={(e) => handleChange('pet_group_id', e.target.value)}
                            label="Nhóm Pet (Tùy chọn)"
                        >
                            <MenuItem value="">
                                <em>Không chọn</em>
                            </MenuItem>
                            {petGroups.map(group => (
                                <MenuItem key={group.id} value={group.id}>
                                    {group.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Max capacity */}
                    <TextField
                        label="Sức chứa tối đa"
                        type="number"
                        fullWidth
                        placeholder="Nhập sức chứa tối đa"
                        inputProps={{
                            min: 0,
                            max: formData.area_id
                                ? areas.find(a => a.id === formData.area_id)?.max_capacity
                                : undefined
                        }}
                        value={formData.max_capacity ?? ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            handleChange('max_capacity', value === '' ? 0 : parseInt(value));
                        }}
                        error={!!errors.max_capacity}
                        helperText={
                            errors.max_capacity ||
                            (formData.area_id
                                ? `Tối đa: ${areas.find(a => a.id === formData.area_id)?.max_capacity || 0} (giới hạn của khu vực)`
                                : 'Chọn khu vực trước để xem giới hạn sức chứa')
                        }
                    />

                    {/* Special notes */}
                    <TextField
                        label="Ghi chú đặc biệt (Tùy chọn)"
                        multiline
                        rows={3}
                        fullWidth
                        value={formData.special_notes}
                        onChange={(e) => handleChange('special_notes', e.target.value)}
                        placeholder="Hướng dẫn, lưu ý đặc biệt cho ca này..."
                    />

                    {/* Price - Only for Edit Mode & Public Tasks */}
                    {mode === 'edit' && taskData && taskData.is_public && (
                        <>
                            <TextField
                                label="Giá"
                                type="number"
                                fullWidth
                                required
                                placeholder="Nhập giá (VD: 150000)"
                                inputProps={{ min: 0, step: 1000 }}
                                value={formData.price === 0 ? '' : formData.price}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleChange('price', value === '' ? 0 : parseFloat(value));
                                }}
                                error={!!errors.price}
                                helperText={errors.price || 'Giá cho ca này (để trống = Miễn phí)'}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>
                                }}
                            />

                            {formData.price > 0 && (
                                <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        💰 Giá: <strong style={{ color: '#2e7d32' }}>{formatPrice(formData.price)}</strong>
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Service Status - Only for Edit Mode */}
                    {mode === 'edit' && (
                        <FormControl fullWidth required error={!!errors.service_status}>
                            <InputLabel>Trạng thái Ca</InputLabel>
                            <Select
                                value={formData.service_status}
                                onChange={(e) => handleChange('service_status', e.target.value)}
                                label="Trạng thái Ca"
                            >
                                <MenuItem value={SLOT_STATUS.AVAILABLE}>
                                    <Typography variant="body2">Có sẵn</Typography>
                                </MenuItem>
                                <MenuItem value={SLOT_STATUS.UNAVAILABLE}>
                                    <Typography variant="body2">Không có sẵn</Typography>
                                </MenuItem>
                                <MenuItem value={SLOT_STATUS.BOOKED}>
                                    <Typography variant="body2">Đã đặt</Typography>
                                </MenuItem>
                                <MenuItem value={SLOT_STATUS.CANCELLED}>
                                    <Typography variant="body2">Đã hủy</Typography>
                                </MenuItem>
                            </Select>
                            {errors.service_status && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                    {errors.service_status}
                                </Typography>
                            )}
                        </FormControl>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo Ca')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotFormModal;

