import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Stack, alpha } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { DAILY_TASK_STATUS, TASK_PRIORITY } from '../../api/dailyTasksApi';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const DailyTaskFormModal = ({ open, onClose, onSubmit, teams = [], tasks = [], slots = [] }) => {
    const [formData, setFormData] = useState({
        team_id: '',
        task_id: '',
        slot_id: '',
        title: '',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '17:00'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            // Reset form when modal opens
            setFormData({
                team_id: '',
                task_id: '',
                slot_id: '',
                title: '',
                priority: 'MEDIUM',
                status: 'SCHEDULED',
                assigned_date: new Date().toISOString().split('T')[0],
                start_time: '08:00',
                end_time: '17:00'
            });
            setErrors({});
        }
    }, [open]);

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // If task_id changes, clear slot_id (slot depends on task)
            if (field === 'task_id') {
                newData.slot_id = '';
            }

            return newData;
        });

        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.team_id) {
            newErrors.team_id = 'Vui lòng chọn team';
        }
        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = 'Vui lòng nhập tên nhiệm vụ';
        }
        if (!formData.assigned_date) {
            newErrors.assigned_date = 'Vui lòng chọn ngày';
        }
        if (!formData.start_time) {
            newErrors.start_time = 'Vui lòng nhập giờ bắt đầu';
        }
        if (!formData.end_time) {
            newErrors.end_time = 'Vui lòng nhập giờ kết thúc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            console.error('Error creating daily task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    // Get filtered slots based on selected task
    const filteredSlots = formData.task_id
        ? slots.filter(slot => slot.task_id === formData.task_id)
        : slots;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    minHeight: '70vh'
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
                    <Assignment />
                    ➕ Tạo nhiệm vụ hằng ngày
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Row 1: Team + Priority + Status */}
                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth error={!!errors.team_id} required>
                            <InputLabel>Team</InputLabel>
                            <Select
                                value={formData.team_id}
                                onChange={(e) => handleChange('team_id', e.target.value)}
                                label="Team"
                                disabled={loading}
                            >
                                {teams.map(team => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.team_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.team_id}
                                </Typography>
                            )}
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} required>
                            <InputLabel>Độ ưu tiên</InputLabel>
                            <Select
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                label="Độ ưu tiên"
                                disabled={loading}
                            >
                                <MenuItem value={TASK_PRIORITY.URGENT}>🔴 Khẩn cấp</MenuItem>
                                <MenuItem value={TASK_PRIORITY.HIGH}>🟠 Cao</MenuItem>
                                <MenuItem value={TASK_PRIORITY.MEDIUM}>🟡 Trung bình</MenuItem>
                                <MenuItem value={TASK_PRIORITY.LOW}>🟢 Thấp</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 180 }} required>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                label="Trạng thái"
                                disabled={loading}
                            >
                                <MenuItem value={DAILY_TASK_STATUS.SCHEDULED}>Chưa bắt đầu</MenuItem>
                                <MenuItem value={DAILY_TASK_STATUS.IN_PROGRESS}>Đang làm</MenuItem>
                                <MenuItem value={DAILY_TASK_STATUS.COMPLETED}>Hoàn thành</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Row 2: Title */}
                    <TextField
                        fullWidth
                        required
                        label="Tên nhiệm vụ *"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        error={!!errors.title}
                        helperText={errors.title || 'VD: Vệ sinh khẩn cấp khu vực mèo'}
                        disabled={loading}
                        placeholder="Nhập tên nhiệm vụ cần thực hiện"
                    />

                    {/* Row 3: Task + Slot (Optional) */}
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Nhiệm vụ gốc</InputLabel>
                                <Select
                                    value={formData.task_id}
                                    onChange={(e) => handleChange('task_id', e.target.value)}
                                    label="Nhiệm vụ gốc"
                                    disabled={loading}
                                >
                                    <MenuItem value="">
                                        <em>Không liên quan</em>
                                    </MenuItem>
                                    {tasks.map(task => (
                                        <MenuItem key={task.id} value={task.id}>
                                            {task.name || task.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Ca</InputLabel>
                                <Select
                                    value={formData.slot_id}
                                    onChange={(e) => handleChange('slot_id', e.target.value)}
                                    label="Ca"
                                    disabled={loading || !formData.task_id}
                                >
                                    <MenuItem value="">
                                        <em>Không chọn</em>
                                    </MenuItem>
                                    {filteredSlots.map(slot => {
                                        const startTime = slot.start_time?.substring(0, 5) || '';
                                        const endTime = slot.end_time?.substring(0, 5) || '';
                                        const dayLabel = slot.day_of_week ? WEEKDAY_LABELS[slot.day_of_week] : '';
                                        const displayText = dayLabel
                                            ? `${startTime} - ${endTime} (${dayLabel})`
                                            : `${startTime} - ${endTime}`;

                                        return (
                                            <MenuItem key={slot.id} value={slot.id}>
                                                {displayText}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                            {!formData.task_id && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                                    Chọn nhiệm vụ gốc trước để xem ca làm việc
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    {/* Row 4: Date + Time Range */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            required
                            type="date"
                            label="Ngày thực hiện *"
                            value={formData.assigned_date}
                            onChange={(e) => handleChange('assigned_date', e.target.value)}
                            error={!!errors.assigned_date}
                            helperText={errors.assigned_date || 'Ngày phải hoàn thành nhiệm vụ'}
                            disabled={loading}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            sx={{ minWidth: 180 }}
                            required
                            type="time"
                            label="Giờ bắt đầu *"
                            value={formData.start_time}
                            onChange={(e) => handleChange('start_time', e.target.value)}
                            error={!!errors.start_time}
                            helperText={errors.start_time}
                            disabled={loading}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            sx={{ minWidth: 180 }}
                            required
                            type="time"
                            label="Giờ kết thúc *"
                            value={formData.end_time}
                            onChange={(e) => handleChange('end_time', e.target.value)}
                            error={!!errors.end_time}
                            helperText={errors.end_time}
                            disabled={loading}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Stack>

                <Box sx={{
                    mt: 4,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha(COLORS.INFO[50], 0.5),
                    border: `1px dashed ${COLORS.INFO[300]}`
                }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        💡 <strong>Lưu ý:</strong> Nhiệm vụ này sẽ được giao cho team ngay lập tức.
                        Bạn có thể tạo nhiệm vụ đột xuất, có thể không liên quan đến Nhiệm vụ có sẵn để xử lý các tình huống phát sinh.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                py: 2.5,
                gap: 2,
                bgcolor: alpha(COLORS.GRAY[50], 0.5)
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    size="large"
                    sx={{
                        minWidth: 120,
                        height: 44,
                        fontWeight: 600
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    size="large"
                    sx={{
                        minWidth: 160,
                        height: 44,
                        fontWeight: 600,
                        boxShadow: 2
                    }}
                >
                    {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DailyTaskFormModal;

