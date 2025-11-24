import { useState, useEffect, useMemo } from 'react';
import * as teamApi from '../../api/teamApi';
import * as petsApi from '../../api/petsApi';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Typography, Stack, InputAdornment, FormHelperText, alpha } from '@mui/material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';
import { COLORS } from '../../constants/colors';

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
        specific_date: '',
        price: 0,
        service_status: SLOT_STATUS.UNAVAILABLE
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [localTeams, setLocalTeams] = useState(teams || []);
    const [pets, setPets] = useState([]);

    // Helper function to extract work_type_ids from team (handles both work_type_ids and team_work_types)
    const getTeamWorkTypeIds = (team) => {
        // Try work_type_ids first (if API returns it directly)
        if (team.work_type_ids && Array.isArray(team.work_type_ids)) {
            return team.work_type_ids;
        }
        // Otherwise, extract from team_work_types array
        if (team.team_work_types && Array.isArray(team.team_work_types)) {
            return team.team_work_types
                .map(twt => twt.work_type?.id || twt.work_type_id || twt.id)
                .filter(id => id !== null && id !== undefined);
        }
        return [];
    };

    // Load pets when modal opens
    useEffect(() => {
        const loadPets = async () => {
            if (!open) return;
            try {
                const response = await petsApi.getAllPets({ page_size: 1000 });
                setPets(response?.data || []);
            } catch (error) {
                console.warn('Không thể tải danh sách thú cưng:', error);
                setPets([]);
            }
        };
        loadPets();
    }, [open]);

    // Ensure team data is available when modal opens
    useEffect(() => {
        const ensureTeams = async () => {
            if (!open) return;
            // If parent already passed teams, still enrich with work shifts if missing
            const hasTeams = Array.isArray(teams) && teams.length > 0;
            let baseTeams = hasTeams ? teams : [];

            try {
                if (!hasTeams) {
                    const res = await teamApi.getTeams({ page_index: 0, page_size: 1000 });
                    baseTeams = res.data || [];
                }

                // Enrich each team with work shifts so we can filter by time range
                // getTeamWorkShifts returns team_work_shift objects with structure:
                // { team_id, work_shift_id, working_days, work_shift, ... }
                const enriched = await Promise.allSettled(
                    baseTeams.map(async (team) => {
                        try {
                            const wsRes = await teamApi.getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 });
                            const teamWorkShifts = wsRes.data || [];
                            return {
                                ...team,
                                // team_work_shifts is already in correct format from API
                                team_work_shifts: teamWorkShifts
                            };
                        } catch {
                            return { ...team, team_work_shifts: [] };
                        }
                    })
                );

                setLocalTeams(enriched
                    .filter(r => r.status === 'fulfilled')
                    .map(r => r.value)
                );
            } catch {
                setLocalTeams(baseTeams || []);
            }
        };
        ensureTeams();
    }, [open, teams]);

    // Filter teams based on selected time range and work_type compatibility
    const filteredTeams = useMemo(() => {
        const sourceTeams = (localTeams && localTeams.length > 0 ? localTeams : teams) || [];

        // Get task's work_type_id
        const taskWorkTypeId = taskData?.work_type_id || taskData?.work_type?.id || null;

        // Filter teams by work_type compatibility first
        let workTypeFiltered = sourceTeams;
        if (taskWorkTypeId) {
            workTypeFiltered = sourceTeams.filter(team => {
                const teamWorkTypeIds = getTeamWorkTypeIds(team);
                return teamWorkTypeIds.includes(taskWorkTypeId);
            });
        }

        // If missing inputs, return work_type filtered teams
        if (workTypeFiltered.length === 0 || !formData.start_time || !formData.end_time || !formData.day_of_week) {
            return workTypeFiltered.map(team => ({
                ...team,
                __matchesSlot: false,
                __matchesWorkType: taskWorkTypeId ? getTeamWorkTypeIds(team).includes(taskWorkTypeId) : true
            }));
        }

        // Normalize slot time to HH:mm:ss format
        const normalizeTime = (timeStr) => {
            if (!timeStr) return '';
            // If already in HH:mm:ss format, return as is
            if (timeStr.length === 8 && timeStr.includes(':')) {
                return timeStr;
            }
            // If in HH:mm format, add :00
            if (timeStr.length === 5 && timeStr.includes(':')) {
                return `${timeStr}:00`;
            }
            return timeStr;
        };

        const slotStart = normalizeTime(formData.start_time);
        const slotEnd = normalizeTime(formData.end_time);

        const withMatchFlag = workTypeFiltered.map(team => {
            const matchesTime = team.team_work_shifts?.some(tws => {
                // Handle team_work_shift structure: { team_id, work_shift_id, working_days, work_shift, ... }
                const workShift = tws?.work_shift;
                if (!workShift) return false;

                const shiftStart = normalizeTime(workShift.start_time);
                const shiftEnd = normalizeTime(workShift.end_time);

                // API chính thức chỉ có applicable_days, không có working_days
                // applicable_days là ngày mà ca làm việc (shift) có thể áp dụng
                const workingDays = Array.isArray(workShift.applicable_days) ? workShift.applicable_days : [];

                // Compare normalized time strings (HH:mm:ss format allows string comparison)
                const timeCovered = shiftStart && slotStart && shiftEnd && slotEnd &&
                    shiftStart <= slotStart && shiftEnd >= slotEnd;
                const dayMatches = workingDays.includes(formData.day_of_week);

                // Debug logging for troubleshooting
                if (team.name === 'ABC' || team.name?.includes('ABC')) {
                    console.log('[SlotFormModal] Team ABC work shift check:', {
                        teamName: team.name,
                        workShift: workShift,
                        workingDays: tws.working_days,
                        applicableDays: workShift.applicable_days,
                        shiftStart,
                        shiftEnd,
                        slotStart,
                        slotEnd,
                        dayOfWeek: formData.day_of_week,
                        timeCovered,
                        dayMatches,
                        matches: timeCovered && dayMatches
                    });
                }

                return timeCovered && dayMatches;
            }) ?? false;

            return {
                ...team,
                __matchesSlot: matchesTime,
                __matchesWorkType: taskWorkTypeId ? getTeamWorkTypeIds(team).includes(taskWorkTypeId) : true
            };
        });

        // Show matching teams first, followed by the rest
        return withMatchFlag.sort((a, b) => {
            // First sort by work_type match
            if (a.__matchesWorkType !== b.__matchesWorkType) {
                return Number(b.__matchesWorkType) - Number(a.__matchesWorkType);
            }
            // Then sort by time match
            return Number(b.__matchesSlot) - Number(a.__matchesSlot);
        });
    }, [teams, localTeams, formData.start_time, formData.end_time, formData.day_of_week, taskData]);

    // Helper function to convert HH:mm:ss to HH:mm for time input
    const formatTimeForInput = (timeStr) => {
        if (!timeStr) return '';
        // If already in HH:mm format, return as is
        if (timeStr.length === 5 && timeStr.includes(':')) {
            return timeStr;
        }
        // If in HH:mm:ss format, extract HH:mm
        if (timeStr.length === 8 && timeStr.includes(':')) {
            return timeStr.substring(0, 5);
        }
        return timeStr;
    };

    // Helper function to convert HH:mm to HH:mm:ss for API
    const formatTimeForAPI = (timeStr) => {
        if (!timeStr) return '';
        // If already in HH:mm:ss format, return as is
        if (timeStr.length === 8 && timeStr.includes(':')) {
            return timeStr;
        }
        // If in HH:mm format, add :00
        if (timeStr.length === 5 && timeStr.includes(':')) {
            return `${timeStr}:00`;
        }
        return timeStr;
    };

    // Initialize form when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                // Edit mode: load existing slot data
                // Convert HH:mm:ss to HH:mm for time input display
                setFormData({
                    task_id: initialData.task_id || '',
                    area_id: initialData.area_id || '',
                    pet_group_id: initialData.pet_group_id || '',
                    team_id: initialData.team_id || '',
                    pet_id: initialData.pet_id || '',
                    start_time: formatTimeForInput(initialData.start_time || ''),
                    end_time: formatTimeForInput(initialData.end_time || ''),
                    max_capacity: initialData.max_capacity ?? 0,
                    special_notes: initialData.special_notes || '',
                    day_of_week: initialData.day_of_week || '',
                    specific_date: initialData.specific_date || '',
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
            specific_date: '',
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

        if (!formData.day_of_week && !formData.specific_date) {
            newErrors.day_of_week = 'Phải chọn ngày trong tuần hoặc ngày cụ thể';
            newErrors.specific_date = 'Phải chọn ngày trong tuần hoặc ngày cụ thể';
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

        // Validate team work_type compatibility with task
        if (formData.team_id && taskData) {
            const taskWorkTypeId = taskData.work_type_id || taskData.work_type?.id || null;
            if (taskWorkTypeId) {
                const selectedTeam = filteredTeams.find(t => t.id === formData.team_id);
                if (selectedTeam) {
                    const teamWorkTypeIds = getTeamWorkTypeIds(selectedTeam);
                    if (!teamWorkTypeIds.includes(taskWorkTypeId)) {
                        newErrors.team_id = 'Nhóm không cùng chung công việc với nhiệm vụ này. Vui lòng chọn nhóm khác.';
                    }
                }
            }
        }

        // Note: Backend allows creating slots on any day, regardless of team's working days
        // So we don't validate day_of_week against team's applicable_days here

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
            // Base submit data - exactly as per official API specification
            // Convert HH:mm to HH:mm:ss format for API (official format)

            // Process specific_date: ensure it's ISO datetime string or null
            let processedSpecificDate = null;
            if (formData.specific_date) {
                // If already in ISO format, use as is
                if (formData.specific_date.includes('T') && formData.specific_date.includes('Z')) {
                    processedSpecificDate = formData.specific_date;
                } else if (formData.specific_date.includes('T')) {
                    // If has T but no Z, assume it's already ISO format
                    processedSpecificDate = formData.specific_date;
                } else {
                    // If just date string (YYYY-MM-DD), convert to ISO datetime
                    const date = new Date(formData.specific_date + 'T00:00:00.000Z');
                    processedSpecificDate = date.toISOString();
                }
            }

            // Process is_recurring: true if day_of_week is set, false if specific_date is set
            const isRecurring = !!formData.day_of_week;

            // Helper function to ensure UUID fields are null (not empty string) if not provided
            const ensureUUIDOrNull = (value) => {
                // Handle null, undefined, empty string, or whitespace-only string
                if (value === null || value === undefined) return null;
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
                    // Check if it's a valid UUID format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(trimmed)) {
                        return trimmed;
                    }
                }
                // For non-string values, try to convert and validate
                const strValue = String(value).trim();
                if (strValue === '' || strValue === 'null' || strValue === 'undefined') return null;
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(strValue)) {
                    return strValue;
                }
                return null;
            };

            // Ensure UUID fields are null (not empty string) if not provided
            const submitData = {
                task_id: formData.task_id ? String(formData.task_id).trim() : formData.task_id, // Required, must be valid UUID
                area_id: ensureUUIDOrNull(formData.area_id),
                pet_group_id: ensureUUIDOrNull(formData.pet_group_id),
                team_id: ensureUUIDOrNull(formData.team_id),
                pet_id: ensureUUIDOrNull(formData.pet_id),
                start_time: formatTimeForAPI(formData.start_time), // Required, format: "HH:mm:ss"
                end_time: formatTimeForAPI(formData.end_time), // Required, format: "HH:mm:ss"
                max_capacity: parseInt(formData.max_capacity) || 0, // Required, number >= 0
                special_notes: (formData.special_notes && formData.special_notes.trim()) ? formData.special_notes.trim() : null,
                is_recurring: isRecurring, // Required, boolean
                day_of_week: (formData.day_of_week && formData.day_of_week.trim()) ? formData.day_of_week.trim() : null,
                specific_date: processedSpecificDate // Optional, ISO datetime string or null
            };

            // Final safety check: ensure no empty strings in UUID fields
            if (submitData.area_id === '' || submitData.area_id === undefined) submitData.area_id = null;
            if (submitData.pet_group_id === '' || submitData.pet_group_id === undefined) submitData.pet_group_id = null;
            if (submitData.team_id === '' || submitData.team_id === undefined) submitData.team_id = null;
            if (submitData.pet_id === '' || submitData.pet_id === undefined) submitData.pet_id = null;

            // Add fields for edit mode according to official API
            if (mode === 'edit') {
                // Only add price for public tasks
                if (taskData && taskData.is_public) {
                    submitData.price = parseFloat(formData.price) || 0;
                }
                submitData.service_status = formData.service_status;
                // Add is_update_related_data (default to true)
                submitData.is_update_related_data = true;
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
                    📅 {mode === 'edit' ? '✏️ Chỉnh sửa Ca làm việc' : '➕ Tạo Ca làm việc mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
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
                            <FormHelperText error sx={{ ml: 2 }}>
                                {errors.day_of_week}
                            </FormHelperText>
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
                            {filteredTeams.map(team => {
                                const taskWorkTypeId = taskData?.work_type_id || taskData?.work_type?.id || null;
                                const teamWorkTypeIds = getTeamWorkTypeIds(team);
                                const matchesWorkType = taskWorkTypeId ? teamWorkTypeIds.includes(taskWorkTypeId) : true;

                                return (
                                    <MenuItem key={team.id} value={team.id} disabled={!matchesWorkType}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                                            <Typography variant="body2" sx={{ color: matchesWorkType ? 'inherit' : 'text.disabled' }}>
                                                {team.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {!matchesWorkType && (
                                                    <Typography variant="caption" color="error">
                                                        Không cùng công việc
                                                    </Typography>
                                                )}
                                                {formData.start_time && formData.end_time && formData.day_of_week && team.__matchesSlot === false && matchesWorkType && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Không khớp ca
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                        {errors.team_id && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                {errors.team_id}
                            </Typography>
                        )}
                        {!errors.team_id && formData.start_time && formData.end_time && filteredTeams.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
                                Không có team nào phù hợp với khung giờ này
                            </Typography>
                        )}
                        {!errors.team_id && taskData && filteredTeams.length > 0 && (() => {
                            const taskWorkTypeId = taskData.work_type_id || taskData.work_type?.id || null;
                            const compatibleTeams = filteredTeams.filter(t => {
                                if (!taskWorkTypeId) return true;
                                return getTeamWorkTypeIds(t).includes(taskWorkTypeId);
                            });
                            if (taskWorkTypeId && compatibleTeams.length === 0) {
                                return (
                                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, ml: 2 }}>
                                        Không có nhóm nào có cùng loại công việc với nhiệm vụ này
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
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

                    {/* Pet */}
                    <FormControl fullWidth>
                        <InputLabel>Thú cưng (Tùy chọn)</InputLabel>
                        <Select
                            value={formData.pet_id}
                            onChange={(e) => handleChange('pet_id', e.target.value)}
                            label="Thú cưng (Tùy chọn)"
                        >
                            <MenuItem value="">
                                <em>Không chọn</em>
                            </MenuItem>
                            {pets.map(pet => (
                                <MenuItem key={pet.id} value={pet.id}>
                                    {pet.name || `Pet #${pet.id}`}
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

                    {/* Specific Date - Show when not recurring or allow override */}
                    {!formData.day_of_week && (
                        <TextField
                            label="Ngày cụ thể"
                            type="date"
                            fullWidth
                            required={!formData.day_of_week}
                            value={formData.specific_date ? formData.specific_date.split('T')[0] : ''}
                            onChange={(e) => {
                                const dateValue = e.target.value;
                                if (dateValue) {
                                    // Convert to ISO string format
                                    const date = new Date(dateValue + 'T00:00:00.000Z');
                                    handleChange('specific_date', date.toISOString());
                                } else {
                                    handleChange('specific_date', '');
                                }
                            }}
                            error={!!errors.specific_date}
                            helperText={errors.specific_date || 'Chọn ngày cụ thể cho ca này (bắt buộc nếu không chọn ngày trong tuần)'}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: new Date().toISOString().split('T')[0]
                            }}
                        />
                    )}

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

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
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

