import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Chip, Typography, FormHelperText, OutlinedInput, Divider, Paper } from '@mui/material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import workshiftApi from '../../api/workshiftApi';
import * as areasApi from '../../api/areasApi';
import petApi from '../../api/petApi';

const SlotFormModal = ({ open, onClose, onSubmit, taskData }) => {
    const [formData, setFormData] = useState({
        task_id: '',
        start_time: '',
        end_time: '',
        applicable_days: [],
        work_shift_id: '',
        team_id: '',
        pet_group_id: '',
        area_id: ''
    });

    const [shifts, setShifts] = useState([]);
    const [areas, setAreas] = useState([]);
    const [petGroups, setPetGroups] = useState([]);
    const [teams, setTeams] = useState([]);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);

    // Load initial data
    useEffect(() => {
        if (open) {
            loadInitialData();

            if (taskData) {
                setFormData(prev => ({
                    ...prev,
                    task_id: taskData.id
                }));
            }
        } else {
            // Reset form when closed
            resetForm();
        }
    }, [open, taskData]);

    // Load teams when work shift changes
    useEffect(() => {
        if (formData.work_shift_id) {
            loadTeamsFromShift(formData.work_shift_id);
        } else {
            setTeams([]);
            setFormData(prev => ({ ...prev, team_id: '' }));
        }
    }, [formData.work_shift_id]);

    const loadInitialData = async () => {
        try {
            const [shiftsRes, areasRes, petGroupsRes] = await Promise.all([
                workshiftApi.getAllShifts(),
                areasApi.getAllAreas(),
                petApi.getPetGroups()
            ]);

            // Handle different response formats
            setShifts(shiftsRes.data || []);
            // areasApi.getAllAreas returns array directly, not wrapped in {data: ...}
            setAreas(Array.isArray(areasRes) ? areasRes : (areasRes.data || []));
            setPetGroups(petGroupsRes.data || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
            setErrors({ submit: 'Không thể tải dữ liệu. Vui lòng thử lại.' });
        }
    };

    const loadTeamsFromShift = async (shiftId) => {
        setLoadingTeams(true);
        try {
            const shiftRes = await workshiftApi.getShiftById(shiftId);
            const shift = shiftRes.data;

            // WorkShift uses 'team_work_shifts' field
            const teams = shift.team_work_shifts || shift.teams || [];

            if (teams.length > 0) {
                setTeams(teams);
                // Auto-select first team
                setFormData(prev => ({ ...prev, team_id: teams[0].id }));
            } else {
                setTeams([]);
                setFormData(prev => ({ ...prev, team_id: '' }));
                setErrors(prev => ({ ...prev, work_shift_id: 'Ca làm việc này chưa có team nào' }));
            }
        } catch (error) {
            console.error('Error loading teams:', error);
            setErrors(prev => ({ ...prev, work_shift_id: 'Không thể tải danh sách team' }));
            setTeams([]);
        } finally {
            setLoadingTeams(false);
        }
    };

    const resetForm = () => {
        setFormData({
            task_id: '',
            start_time: '',
            end_time: '',
            applicable_days: [],
            work_shift_id: '',
            team_id: '',
            pet_group_id: '',
            area_id: ''
        });
        setErrors({});
        setTeams([]);
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

        if (formData.applicable_days.length === 0) {
            newErrors.applicable_days = 'Phải chọn ít nhất 1 ngày';
        }

        if (!formData.work_shift_id) {
            newErrors.work_shift_id = 'Ca làm việc là bắt buộc';
        }

        if (!formData.team_id) {
            newErrors.team_id = 'Team là bắt buộc';
        }

        if (!formData.pet_group_id) {
            newErrors.pet_group_id = 'Nhóm thú cưng là bắt buộc';
        }

        if (!formData.area_id) {
            newErrors.area_id = 'Khu vực là bắt buộc';
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

    const selectedShift = shifts.find(s => s.id === formData.work_shift_id);
    const selectedArea = areas.find(a => a.id === formData.area_id);
    const selectedTeam = teams.find(t => t.id === formData.team_id);

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
                📅 Tạo Slot mới
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Task Info */}
                {taskData && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Task
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {taskData.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            ⏱️ {taskData.estimate_duration} phút
                        </Typography>
                    </Paper>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Time Range */}
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

                    {/* Applicable Days */}
                    <FormControl fullWidth error={!!errors.applicable_days}>
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

                    <Divider sx={{ my: 1 }} />

                    {/* WorkShift (Required) */}
                    <FormControl fullWidth error={!!errors.work_shift_id} required>
                        <InputLabel>Ca làm việc *</InputLabel>
                        <Select
                            value={formData.work_shift_id}
                            onChange={(e) => handleChange('work_shift_id', e.target.value)}
                            label="Ca làm việc *"
                            disabled={loading}
                        >
                            {shifts.map(shift => (
                                <MenuItem key={shift.id} value={shift.id}>
                                    {shift.name} ({shift.start_time} - {shift.end_time})
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.work_shift_id && (
                            <FormHelperText>{errors.work_shift_id}</FormHelperText>
                        )}
                        <FormHelperText>
                            Team sẽ được lấy từ Ca làm việc này
                        </FormHelperText>
                    </FormControl>

                    {/* Selected Shift Info */}
                    {selectedShift && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                                📋 {selectedShift.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ⏰ {selectedShift.start_time} - {selectedShift.end_time}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                👥 {(selectedShift.team_work_shifts || selectedShift.teams || []).length} team
                            </Typography>
                        </Paper>
                    )}

                    {/* Team (Auto-loaded from WorkShift) */}
                    <FormControl fullWidth error={!!errors.team_id} required disabled={!formData.work_shift_id || loadingTeams}>
                        <InputLabel>Team *</InputLabel>
                        <Select
                            value={formData.team_id}
                            onChange={(e) => handleChange('team_id', e.target.value)}
                            label="Team *"
                            disabled={loading || !formData.work_shift_id || loadingTeams}
                        >
                            {teams.map(team => (
                                <MenuItem key={team.id} value={team.id}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {team.name} ({team.members?.length || 0} nhân viên)
                                        </Typography>
                                        {team.leader && (
                                            <Typography variant="caption" color="text.secondary">
                                                👑 Leader: {team.leader.full_name || team.leader.name || 'N/A'}
                                            </Typography>
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.team_id && (
                            <FormHelperText>{errors.team_id}</FormHelperText>
                        )}
                        {loadingTeams && (
                            <FormHelperText>Đang tải danh sách team...</FormHelperText>
                        )}
                    </FormControl>

                    {/* Selected Team Info */}
                    {selectedTeam && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                                👥 {selectedTeam.name}
                            </Typography>
                            {selectedTeam.leader && (
                                <Typography variant="body2" color="text.secondary">
                                    👑 Leader: {selectedTeam.leader.full_name || selectedTeam.leader.name}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                👨‍💼 {selectedTeam.members?.length || 0} nhân viên
                            </Typography>
                        </Paper>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Pet Group */}
                    <FormControl fullWidth error={!!errors.pet_group_id} required>
                        <InputLabel>Nhóm thú cưng *</InputLabel>
                        <Select
                            value={formData.pet_group_id}
                            onChange={(e) => handleChange('pet_group_id', e.target.value)}
                            label="Nhóm thú cưng *"
                            disabled={loading}
                        >
                            {petGroups.map(group => (
                                <MenuItem key={group.id} value={group.id}>
                                    {group.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.pet_group_id && (
                            <FormHelperText>{errors.pet_group_id}</FormHelperText>
                        )}
                    </FormControl>

                    {/* Area */}
                    <FormControl fullWidth error={!!errors.area_id} required>
                        <InputLabel>Khu vực *</InputLabel>
                        <Select
                            value={formData.area_id}
                            onChange={(e) => handleChange('area_id', e.target.value)}
                            label="Khu vực *"
                            disabled={loading}
                        >
                            {areas.map(area => (
                                <MenuItem key={area.id} value={area.id}>
                                    {area.name} (Capacity: {area.capacity})
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.area_id && (
                            <FormHelperText>{errors.area_id}</FormHelperText>
                        )}
                    </FormControl>

                    {/* Selected Area Info */}
                    {selectedArea && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                                📍 {selectedArea.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                👥 Capacity: {selectedArea.capacity} khách
                            </Typography>
                        </Paper>
                    )}

                    {/* Info Box */}
                    <Alert severity="info" variant="outlined">
                        <Typography variant="body2">
                            💡 Slot này sẽ được tạo với status <strong>Internal Only</strong>.
                            Sau khi tạo, bạn có thể publish để công khai cho khách hàng.
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
                    disabled={loading || loadingTeams}
                    variant="contained"
                    sx={{ minWidth: 100 }}
                >
                    {loading ? 'Đang tạo...' : 'Tạo Slot'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotFormModal;

