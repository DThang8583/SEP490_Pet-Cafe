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
        teamsByDay: {},      // { 'MONDAY': 'team-id', 'TUESDAY': 'team-id', ... }
        petGroupsByDay: {},  // { 'MONDAY': 'group-id', 'TUESDAY': 'group-id', ... }
        areasByDay: {}       // { 'MONDAY': 'area-id', 'TUESDAY': 'area-id', ... }
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
            setFormData(prev => ({ ...prev, teamsByDay: {} }));
        }
    }, [formData.work_shift_id]);

    // Auto-calculate end_time based on start_time + task duration
    useEffect(() => {
        if (formData.start_time && taskData?.estimate_duration) {
            const [hours, minutes] = formData.start_time.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);

            // Add task duration (in minutes)
            startDate.setMinutes(startDate.getMinutes() + taskData.estimate_duration);

            const endHours = String(startDate.getHours()).padStart(2, '0');
            const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
            const calculatedEndTime = `${endHours}:${endMinutes}`;

            setFormData(prev => ({
                ...prev,
                end_time: calculatedEndTime
            }));
        }
    }, [formData.start_time, taskData?.estimate_duration]);

    // Auto-select shift when start_time or end_time changes
    useEffect(() => {
        if (formData.start_time && formData.end_time && shifts.length > 0) {
            // Normalize time format for comparison (HH:MM:SS -> HH:MM)
            const normalizeTime = (time) => {
                if (!time) return '';
                return time.substring(0, 5); // Get first 5 chars (HH:MM)
            };

            const startTime = normalizeTime(formData.start_time);
            const endTime = normalizeTime(formData.end_time);

            const matchingShift = shifts.find(shift => {
                const shiftStart = normalizeTime(shift.start_time);
                const shiftEnd = normalizeTime(shift.end_time);

                // Check if slot time range is within shift time range
                return startTime >= shiftStart && endTime <= shiftEnd;
            });

            if (matchingShift && matchingShift.id !== formData.work_shift_id) {
                setFormData(prev => ({
                    ...prev,
                    work_shift_id: matchingShift.id
                }));
            }
        }
    }, [formData.start_time, formData.end_time, shifts]);

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
            teamsByDay: {},
            petGroupsByDay: {},
            areasByDay: {}
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

    const handleTeamChangeForDay = (day, teamId) => {
        setFormData(prev => ({
            ...prev,
            teamsByDay: {
                ...prev.teamsByDay,
                [day]: teamId
            }
        }));

        // Clear error for this day
        if (errors[`team_${day}`]) {
            setErrors(prev => ({
                ...prev,
                [`team_${day}`]: ''
            }));
        }
    };

    const handlePetGroupChangeForDay = (day, groupId) => {
        setFormData(prev => ({
            ...prev,
            petGroupsByDay: {
                ...prev.petGroupsByDay,
                [day]: groupId
            }
        }));

        // Clear error for this day
        if (errors[`petGroup_${day}`]) {
            setErrors(prev => ({
                ...prev,
                [`petGroup_${day}`]: ''
            }));
        }
    };

    const handleAreaChangeForDay = (day, areaId) => {
        setFormData(prev => ({
            ...prev,
            areasByDay: {
                ...prev.areasByDay,
                [day]: areaId
            }
        }));

        // Clear error for this day
        if (errors[`area_${day}`]) {
            setErrors(prev => ({
                ...prev,
                [`area_${day}`]: ''
            }));
        }
    };

    // Get teams available for a specific day
    const getTeamsForDay = (day) => {
        return teams.filter(team => {
            const workingDays = team.working_days || [];
            return workingDays.includes(day);
        });
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

        // Validate time range falls within shift
        if (formData.work_shift_id && formData.start_time && formData.end_time) {
            const selectedShift = shifts.find(s => s.id === formData.work_shift_id);
            if (selectedShift) {
                // Normalize time format for comparison
                const normalizeTime = (time) => time ? time.substring(0, 5) : '';
                const startTime = normalizeTime(formData.start_time);
                const endTime = normalizeTime(formData.end_time);
                const shiftStart = normalizeTime(selectedShift.start_time);
                const shiftEnd = normalizeTime(selectedShift.end_time);

                if (startTime < shiftStart || endTime > shiftEnd) {
                    newErrors.start_time = `Thời gian phải nằm trong khoảng ${shiftStart} - ${shiftEnd}`;
                }
            }
        }

        // Validate team, pet group, and area for each applicable day
        formData.applicable_days.forEach(day => {
            if (!formData.teamsByDay[day]) {
                newErrors[`team_${day}`] = `Phải chọn team cho ${WEEKDAY_LABELS[day] || day}`;
            }
            if (!formData.petGroupsByDay[day]) {
                newErrors[`petGroup_${day}`] = `Phải chọn nhóm thú cưng cho ${WEEKDAY_LABELS[day] || day}`;
            }
            if (!formData.areasByDay[day]) {
                newErrors[`area_${day}`] = `Phải chọn khu vực cho ${WEEKDAY_LABELS[day] || day}`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Transform data: Create separate slot for each day
            const slotsToCreate = formData.applicable_days.map(day => ({
                task_id: formData.task_id,
                start_time: formData.start_time,
                end_time: formData.end_time,
                applicable_days: [day], // Single day per slot
                work_shift_id: formData.work_shift_id,
                team_id: formData.teamsByDay[day],
                pet_group_id: formData.petGroupsByDay[day],
                area_id: formData.areasByDay[day]
            }));

            // Pass array of slots to parent
            await onSubmit(slotsToCreate);

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
                            helperText={errors.start_time || `Thời gian kết thúc sẽ tự động được tính (+${taskData?.estimate_duration || 0} phút)`}
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
                            helperText={errors.end_time || '✨ Tự động tính từ thời gian bắt đầu + thời gian nhiệm vụ'}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                readOnly: true,
                                sx: { bgcolor: '#f5f5f5' }
                            }}
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

                    {/* Team Selection - BY DAY (Validated with working_days) */}
                    {formData.applicable_days.length > 0 && !loadingTeams && (
                        <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                                👥 Chọn Team cho từng ngày *
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Team được hiển thị dựa trên lịch làm việc của từng ngày trong Ca đã chọn
                            </Typography>

                            {formData.applicable_days.map((day) => {
                                const availableTeams = getTeamsForDay(day);
                                const selectedTeamId = formData.teamsByDay[day];
                                const selectedTeam = teams.find(t => t.id === selectedTeamId);

                                return (
                                    <Box key={day} sx={{ mb: 2 }}>
                                        <FormControl fullWidth error={!!errors[`team_${day}`]} required>
                                            <InputLabel>{WEEKDAY_LABELS[day] || day} - Team *</InputLabel>
                                            <Select
                                                value={selectedTeamId || ''}
                                                onChange={(e) => handleTeamChangeForDay(day, e.target.value)}
                                                label={`${WEEKDAY_LABELS[day] || day} - Team *`}
                                                disabled={loading || availableTeams.length === 0}
                                            >
                                                {availableTeams.length === 0 ? (
                                                    <MenuItem disabled>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Không có team làm việc vào ngày này
                                                        </Typography>
                                                    </MenuItem>
                                                ) : (
                                                    availableTeams.map(team => (
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
                                                    ))
                                                )}
                                            </Select>
                                            {errors[`team_${day}`] && (
                                                <FormHelperText>{errors[`team_${day}`]}</FormHelperText>
                                            )}
                                            {availableTeams.length === 0 && !errors[`team_${day}`] && (
                                                <FormHelperText>
                                                    ⚠️ Không có team nào làm việc vào {WEEKDAY_LABELS[day]} trong Ca này
                                                </FormHelperText>
                                            )}
                                        </FormControl>

                                        {/* Selected Team Info for this day */}
                                        {selectedTeam && (
                                            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f3e5f5', borderRadius: 1, mt: 1 }}>
                                                <Typography variant="caption" fontWeight={600}>
                                                    ✓ {selectedTeam.name}
                                                </Typography>
                                                {selectedTeam.leader && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        👑 {selectedTeam.leader.full_name || selectedTeam.leader.name}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    👨‍💼 {selectedTeam.members?.length || 0} nhân viên
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {loadingTeams && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Đang tải danh sách team...
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Pet Group & Area Selection - BY DAY */}
                    {formData.applicable_days.length > 0 && (
                        <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                                🐾 Chọn Nhóm thú cưng & Khu vực cho từng ngày *
                            </Typography>

                            {formData.applicable_days.map((day) => {
                                const selectedPetGroupId = formData.petGroupsByDay[day];
                                const selectedAreaId = formData.areasByDay[day];
                                const selectedPetGroup = petGroups.find(g => g.id === selectedPetGroupId);
                                const selectedArea = areas.find(a => a.id === selectedAreaId);

                                return (
                                    <Box key={day} sx={{ mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                                            📅 {WEEKDAY_LABELS[day] || day}
                                        </Typography>

                                        {/* Pet Group for this day */}
                                        <FormControl fullWidth error={!!errors[`petGroup_${day}`]} required sx={{ mb: 2 }}>
                                            <InputLabel>{WEEKDAY_LABELS[day]} - Nhóm thú cưng *</InputLabel>
                                            <Select
                                                value={selectedPetGroupId || ''}
                                                onChange={(e) => handlePetGroupChangeForDay(day, e.target.value)}
                                                label={`${WEEKDAY_LABELS[day]} - Nhóm thú cưng *`}
                                                disabled={loading}
                                            >
                                                {petGroups.map(group => (
                                                    <MenuItem key={group.id} value={group.id}>
                                                        {group.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors[`petGroup_${day}`] && (
                                                <FormHelperText>{errors[`petGroup_${day}`]}</FormHelperText>
                                            )}
                                        </FormControl>

                                        {/* Area for this day */}
                                        <FormControl fullWidth error={!!errors[`area_${day}`]} required>
                                            <InputLabel>{WEEKDAY_LABELS[day]} - Khu vực *</InputLabel>
                                            <Select
                                                value={selectedAreaId || ''}
                                                onChange={(e) => handleAreaChangeForDay(day, e.target.value)}
                                                label={`${WEEKDAY_LABELS[day]} - Khu vực *`}
                                                disabled={loading}
                                            >
                                                {areas.map(area => (
                                                    <MenuItem key={area.id} value={area.id}>
                                                        {area.name} (Capacity: {area.capacity})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors[`area_${day}`] && (
                                                <FormHelperText>{errors[`area_${day}`]}</FormHelperText>
                                            )}
                                        </FormControl>

                                        {/* Selected Info for this day */}
                                        {(selectedPetGroup || selectedArea) && (
                                            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {selectedPetGroup && (
                                                    <Chip
                                                        label={`🐾 ${selectedPetGroup.name}`}
                                                        size="small"
                                                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
                                                    />
                                                )}
                                                {selectedArea && (
                                                    <Chip
                                                        label={`📍 ${selectedArea.name}`}
                                                        size="small"
                                                        sx={{ bgcolor: '#fff3e0', color: '#e65100' }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Info Box */}
                    <Alert severity="info" variant="outlined">
                        <Typography variant="body2">
                            💡 Hệ thống sẽ tạo <strong>{formData.applicable_days.length} slots riêng biệt</strong> (1 slot cho mỗi ngày).
                            Mỗi slot sẽ có status <strong>Internal Only</strong>.
                            Sau khi tạo, bạn có thể publish từng slot để công khai cho khách hàng.
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
                    {loading ? 'Đang tạo...' : `Tạo ${formData.applicable_days.length} Slot${formData.applicable_days.length > 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotFormModal;

