import { useState, useEffect, useMemo, useCallback } from 'react';
import * as teamApi from '../../api/teamApi';
import * as petsApi from '../../api/petsApi';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert, Typography, Stack, InputAdornment, FormHelperText, alpha, IconButton } from '@mui/material';
import { Close, CalendarToday } from '@mui/icons-material';
import { WEEKDAYS, WEEKDAY_LABELS } from '../../api/slotApi';
import { formatPrice } from '../../utils/formatPrice';
import { COLORS } from '../../constants/colors';
import AlertModal from '../modals/AlertModal';

const SLOT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    MAINTENANCE: 'MAINTENANCE',
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
    const [alertModal, setAlertModal] = useState({
        open: false,
        type: 'info',
        title: '',
        message: ''
    });

    // Helper function to extract work_type_ids from team (handles both work_type_ids and team_work_types)
    const getTeamWorkTypeIds = useCallback((team) => {
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
    }, []);

    // Helper function to extract work_type_ids from area (handles both work_type_ids and area_work_types)
    const getAreaWorkTypeIds = useCallback((area) => {
        // Try work_type_ids first (if API returns it directly)
        if (area.work_type_ids && Array.isArray(area.work_type_ids)) {
            return area.work_type_ids;
        }
        // Otherwise, extract from area_work_types array
        if (area.area_work_types && Array.isArray(area.area_work_types)) {
            return area.area_work_types
                .map(awt => awt.work_type?.id || awt.work_type_id || awt.id)
                .filter(id => id !== null && id !== undefined);
        }
        return [];
    }, []);

    // Load pets when modal opens
    const loadPets = useCallback(async () => {
        if (!open) return;
        try {
            const response = await petsApi.getAllPets({ page: 0, limit: 1000 });
            setPets(response?.data || []);
        } catch (error) {
            console.warn('Không thể tải danh sách thú cưng:', error);
            setPets([]);
        }
    }, [open]);

    useEffect(() => {
        loadPets();
    }, [loadPets]);

    // Ensure team data is available when modal opens
    const ensureTeams = useCallback(async () => {
        if (!open) return;
        // If parent already passed teams, still enrich with work shifts if missing
        const hasTeams = Array.isArray(teams) && teams.length > 0;
        let baseTeams = hasTeams ? teams : [];

        try {
            if (!hasTeams) {
                const res = await teamApi.getTeams({ page: 0, limit: 1000 });
                baseTeams = res.data || [];
            }

            // Enrich each team with work shifts so we can filter by time range
            // getTeamWorkShifts returns team_work_shift objects with structure:
            // { team_id, work_shift_id, working_days, work_shift, ... }
            const enriched = await Promise.allSettled(
                baseTeams.map(async (team) => {
                    try {
                        const wsRes = await teamApi.getTeamWorkShifts(team.id, { page: 0, limit: 100 });
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
    }, [open, teams]);

    useEffect(() => {
        ensureTeams();
    }, [ensureTeams]);

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
    }, [teams, localTeams, formData.start_time, formData.end_time, formData.day_of_week, taskData, getTeamWorkTypeIds]);

    // Filter areas based on work_type compatibility
    const filteredAreas = useMemo(() => {
        // Get task's work_type_id
        const taskWorkTypeId = taskData?.work_type_id || taskData?.work_type?.id || null;

        // If no work_type requirement, show all areas
        if (!taskWorkTypeId) {
            return areas;
        }

        // Filter areas by work_type compatibility
        return areas.filter(area => {
            const areaWorkTypeIds = getAreaWorkTypeIds(area);
            return areaWorkTypeIds.includes(taskWorkTypeId);
        });
    }, [areas, taskData, getAreaWorkTypeIds]);

    // Helper function to convert HH:mm:ss to HH:mm for time input
    const formatTimeForInput = useCallback((timeStr) => {
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
    }, []);

    // Helper function to convert HH:mm to HH:mm:ss for API
    const formatTimeForAPI = useCallback((timeStr) => {
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
    }, []);

    // Reset form function - defined before useEffect to avoid initialization error
    const resetForm = useCallback(() => {
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
    }, []);

    // Initialize form when modal opens
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                // Edit mode: load existing slot data
                // Convert HH:mm:ss to HH:mm for time input display

                // Log initial data from API for debugging
                console.log('[SlotFormModal] Loading slot data for edit:', {
                    slotId: initialData.id,
                    service_status: initialData.service_status,
                    service_status_type: typeof initialData.service_status,
                    allData: initialData
                });

                // Normalize and validate service_status from API
                let normalizedServiceStatus = SLOT_STATUS.UNAVAILABLE; // Default fallback
                if (initialData.service_status) {
                    const statusValue = String(initialData.service_status).trim().toUpperCase();
                    const validStatuses = [
                        SLOT_STATUS.AVAILABLE,
                        SLOT_STATUS.UNAVAILABLE,
                        SLOT_STATUS.MAINTENANCE,
                        SLOT_STATUS.CANCELLED
                    ];

                    if (validStatuses.includes(statusValue)) {
                        normalizedServiceStatus = statusValue;
                        console.log(`[SlotFormModal] Valid service_status from API: "${initialData.service_status}" -> normalized to "${normalizedServiceStatus}"`);
                    } else {
                        // Log warning if invalid status from API
                        console.warn(`[SlotFormModal] Invalid service_status from API: "${initialData.service_status}". Using default: UNAVAILABLE`);
                    }
                } else {
                    console.log(`[SlotFormModal] No service_status in API data. Using default: UNAVAILABLE`);
                }

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
                    service_status: normalizedServiceStatus
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
    }, [open, mode, taskData, initialData, formatTimeForInput, resetForm]);

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


    const handleChange = useCallback((field, value) => {
        // Special handling for area_id change
        if (field === 'area_id') {
            const selectedArea = filteredAreas.find(a => a.id === value);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                // Auto-fill max_capacity from selected area
                max_capacity: selectedArea ? selectedArea.max_capacity : 0
            }));
        }
        // Special handling for start_time change - auto calculate end_time
        else if (field === 'start_time') {
            const newStartTime = value;
            let calculatedEndTime = formData.end_time; // Keep current end_time as default

            // Auto-calculate end_time based on task's estimated_hours
            if (newStartTime && taskData?.estimated_hours) {
                try {
                    const [hours, minutes] = newStartTime.split(':').map(Number);
                    const startMinutes = hours * 60 + minutes;
                    const durationMinutes = taskData.estimated_hours * 60;
                    const endMinutes = startMinutes + durationMinutes;

                    const endHours = Math.floor(endMinutes / 60) % 24; // Handle overflow past midnight
                    const endMins = endMinutes % 60;

                    calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                } catch (error) {
                    // Silently handle calculation error
                }
            }

            setFormData(prev => ({
                ...prev,
                start_time: newStartTime,
                end_time: calculatedEndTime
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        // Clear error for this field using functional update
        setErrors(prev => {
            if (prev[field]) {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            }
            return prev;
        });
    }, [filteredAreas, formData.end_time, taskData, errors]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        const errorMessages = [];

        if (!formData.task_id) {
            newErrors.task_id = 'Task là bắt buộc';
            errorMessages.push('• Task là bắt buộc');
        }

        if (!formData.day_of_week && !formData.specific_date) {
            newErrors.day_of_week = 'Phải chọn ngày trong tuần hoặc ngày cụ thể';
            newErrors.specific_date = 'Phải chọn ngày trong tuần hoặc ngày cụ thể';
            errorMessages.push('• Phải chọn ngày trong tuần hoặc ngày cụ thể');
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Giờ bắt đầu là bắt buộc';
            errorMessages.push('• Giờ bắt đầu là bắt buộc');
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Giờ kết thúc là bắt buộc';
            errorMessages.push('• Giờ kết thúc là bắt buộc');
        }

        // Validate time range
        if (formData.start_time && formData.end_time) {
            if (formData.start_time >= formData.end_time) {
                newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
                errorMessages.push('• Giờ kết thúc phải sau giờ bắt đầu');
            } else {
                // Calculate actual duration
                const [startH, startM] = formData.start_time.split(':').map(Number);
                const [endH, endM] = formData.end_time.split(':').map(Number);
                const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                const durationHours = durationMinutes / 60;

                // Validate minimum duration (at least 15 minutes)
                if (durationMinutes < 15) {
                    newErrors.end_time = 'Thời gian ca phải ít nhất 15 phút';
                    errorMessages.push('• Thời gian ca phải ít nhất 15 phút');
                }

                // Validate maximum duration (not more than 12 hours)
                if (durationHours > 12) {
                    newErrors.end_time = 'Thời gian ca không được quá 12 giờ';
                    errorMessages.push('• Thời gian ca không được quá 12 giờ');
                }

                // Warning if duration differs significantly from estimated_hours (but don't block)
                // Silently handle - no console logging needed
            }
        }

        // Team và Area là bắt buộc
        if (!formData.team_id) {
            newErrors.team_id = 'Team là bắt buộc';
            errorMessages.push('• Team là bắt buộc');
        }

        if (!formData.area_id) {
            newErrors.area_id = 'Khu vực là bắt buộc';
            errorMessages.push('• Khu vực là bắt buộc');
        }

        if (formData.max_capacity < 0) {
            newErrors.max_capacity = 'Sức chứa không được âm';
            errorMessages.push('• Sức chứa không được âm');
        }

        // Validate max_capacity against area's max_capacity
        if (formData.area_id && formData.max_capacity > 0) {
            const selectedArea = filteredAreas.find(a => a.id === formData.area_id);
            if (selectedArea && formData.max_capacity > selectedArea.max_capacity) {
                newErrors.max_capacity = `Sức chứa không được vượt quá ${selectedArea.max_capacity} (sức chứa của khu vực ${selectedArea.name})`;
                errorMessages.push(`• Sức chứa không được vượt quá ${selectedArea.max_capacity} của khu vực ${selectedArea.name}`);
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
                        errorMessages.push('• Nhóm không cùng chung công việc với nhiệm vụ này');
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
                    errorMessages.push('• Giá không được âm');
                }
            }

            if (!formData.service_status) {
                newErrors.service_status = 'Trạng thái là bắt buộc';
                errorMessages.push('• Trạng thái là bắt buộc');
            }
        }

        setErrors(newErrors);

        // Show AlertModal if there are validation errors
        if (errorMessages.length > 0) {
            setAlertModal({
                open: true,
                type: 'error',
                title: 'Lỗi xác thực',
                message: 'Vui lòng kiểm tra lại các thông tin sau:\n\n' + errorMessages.join('\n')
            });
        }

        return Object.keys(newErrors).length === 0;
    }, [formData, filteredAreas, filteredTeams, taskData, mode, getTeamWorkTypeIds]);

    const handleSubmit = useCallback(async () => {
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

            // Time conversion handled silently

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

                // Validate and set service_status - must be one of the valid values
                // In edit mode, service_status is required and must always be sent
                const validStatuses = [
                    SLOT_STATUS.AVAILABLE,
                    SLOT_STATUS.UNAVAILABLE,
                    SLOT_STATUS.MAINTENANCE,
                    SLOT_STATUS.CANCELLED
                ];

                // Normalize service_status value (uppercase, trim)
                const normalizedStatus = formData.service_status
                    ? String(formData.service_status).trim().toUpperCase()
                    : null;

                if (normalizedStatus && validStatuses.includes(normalizedStatus)) {
                    submitData.service_status = normalizedStatus;
                } else if (normalizedStatus) {
                    // If service_status is provided but invalid, throw error
                    throw new Error(`Trạng thái không hợp lệ: "${formData.service_status}". Giá trị hợp lệ: AVAILABLE, UNAVAILABLE, MAINTENANCE, CANCELLED`);
                } else {
                    // If service_status is not provided or empty, use the value from initialData if available
                    // Otherwise fallback to UNAVAILABLE
                    if (initialData && initialData.service_status) {
                        const initialStatus = String(initialData.service_status).trim().toUpperCase();
                        if (validStatuses.includes(initialStatus)) {
                            submitData.service_status = initialStatus;
                        } else {
                            submitData.service_status = SLOT_STATUS.UNAVAILABLE;
                        }
                    } else {
                        submitData.service_status = SLOT_STATUS.UNAVAILABLE;
                    }
                }

                // Add is_update_related_data (default to true)
                submitData.is_update_related_data = true;
            }

            await onSubmit(submitData);

            // Show success alert
            // AlertModal sẽ tự đóng form modal khi user click "Đã hiểu"
            setAlertModal({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: mode === 'edit' ? 'Cập nhật ca làm việc thành công!' : 'Tạo ca làm việc thành công!'
            });
        } catch (error) {
            // Extract error message từ backend response
            let errorMessage = error.message || 'Có lỗi xảy ra khi lưu ca làm việc. Vui lòng thử lại.';

            // Nếu error có response từ backend, lấy message chi tiết
            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.message) {
                    if (Array.isArray(errorData.message)) {
                        errorMessage = errorData.message.join('\n');
                    } else if (typeof errorData.message === 'string') {
                        errorMessage = errorData.message;
                    }
                } else if (errorData.error) {
                    if (Array.isArray(errorData.error)) {
                        errorMessage = errorData.error.join('\n');
                    } else if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    }
                } else if (errorData.errors && typeof errorData.errors === 'object') {
                    // Extract validation errors
                    const validationErrors = Object.entries(errorData.errors)
                        .map(([field, messages]) => {
                            const msgArray = Array.isArray(messages) ? messages : [messages];
                            return `${field}: ${msgArray.join(', ')}`;
                        })
                        .join('\n');
                    if (validationErrors) {
                        errorMessage = validationErrors;
                    }
                }
            }

            // Show error alert với chi tiết từ backend
            setAlertModal({
                open: true,
                type: 'error',
                title: mode === 'edit' ? 'Lỗi cập nhật ca làm việc' : 'Lỗi tạo ca làm việc',
                message: errorMessage
            });

            // Also set inline error for backward compatibility
            setErrors({
                submit: errorMessage
            });

            // KHÔNG đóng modal khi có lỗi - để user có thể thấy thông báo lỗi
            // Modal sẽ chỉ đóng khi user click "Đã hiểu" trong AlertModal
        } finally {
            setLoading(false);
        }
    }, [validateForm, formData, formatTimeForAPI, mode, taskData, initialData, onSubmit, resetForm, onClose]);

    const handleClose = useCallback(() => {
        if (loading) return;
        resetForm();
        onClose();
    }, [loading, resetForm, onClose]);

    return (
        <>
            <Dialog
                open={open}
                onClose={alertModal.open ? undefined : handleClose}
                maxWidth="md"
                fullWidth
                disableScrollLock
                hideBackdrop={alertModal.open}
                disableEscapeKeyDown={alertModal.open}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                        pointerEvents: alertModal.open ? 'none' : 'auto'
                    }
                }}
            >
                <Box
                    sx={{
                        bgcolor: mode === 'edit' ? COLORS.INFO[50] : COLORS.SUCCESS[50],
                        borderBottom: `3px solid ${mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500]}`
                    }}
                >
                    <DialogTitle sx={{
                        fontWeight: 800,
                        color: mode === 'edit' ? COLORS.INFO[800] : COLORS.SUCCESS[800],
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarToday />
                            <Typography variant="h6" component="span">
                                {mode === 'edit' ? '✏️ Chỉnh sửa Ca làm việc' : '➕ Tạo Ca làm việc mới'}
                            </Typography>
                        </Stack>
                        <IconButton
                            onClick={handleClose}
                            disabled={loading}
                            sx={{
                                color: mode === 'edit' ? COLORS.INFO[800] : COLORS.SUCCESS[800],
                                '&:hover': {
                                    bgcolor: alpha(mode === 'edit' ? COLORS.INFO[100] : COLORS.SUCCESS[100], 0.5)
                                }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </DialogTitle>
                </Box>

                <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                    <Stack spacing={3}>
                        {errors.submit && (
                            <Alert
                                severity="error"
                                onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}
                                sx={{ borderRadius: 2 }}
                            >
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
                                    <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
                                        ⚠️ <strong>{WEEKDAY_LABELS[formData.day_of_week]}</strong> đã qua trong tuần này.
                                        Nhiệm vụ hằng ngày sẽ được tạo cho <strong>tuần sau</strong>,
                                        không tạo cho ngày trong quá khứ.
                                    </Alert>
                                );
                            } else if (selectedIndex === todayIndex) {
                                return (
                                    <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                                        ℹ️ Đây là ngày <strong>hôm nay</strong>.
                                        Nhiệm vụ hằng ngày sẽ được tạo cho tuần này.
                                    </Alert>
                                );
                            } else {
                                return (
                                    <Alert severity="success" sx={{ mt: 1, borderRadius: 2 }}>
                                        ✅ <strong>{WEEKDAY_LABELS[formData.day_of_week]}</strong> chưa tới trong tuần này.
                                        Nhiệm vụ hằng ngày sẽ được tạo cho tuần này.
                                    </Alert>
                                );
                            }
                        })()}

                        {/* Time range */}
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Giờ bắt đầu *"
                                type="time"
                                fullWidth
                                required
                                value={formData.start_time}
                                onChange={(e) => handleChange('start_time', e.target.value)}
                                error={!!errors.start_time}
                                helperText={errors.start_time}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                label="Giờ kết thúc *"
                                type="time"
                                fullWidth
                                required
                                value={formData.end_time}
                                onChange={(e) => handleChange('end_time', e.target.value)}
                                error={!!errors.end_time}
                                helperText={errors.end_time}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Stack>

                        {/* Time calculation info */}
                        {formData.start_time && formData.end_time && taskData?.estimated_hours && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.INFO[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ color: COLORS.INFO[800] }}>
                                    ⏱️ <strong>Thời gian ca:</strong> {formData.start_time} - {formData.end_time}
                                    {(() => {
                                        const [startH, startM] = formData.start_time.split(':').map(Number);
                                        const [endH, endM] = formData.end_time.split(':').map(Number);
                                        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                                        const durationHours = (durationMinutes / 60).toFixed(1);

                                        return ` (${durationHours} giờ)`;
                                    })()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    💡 Nhiệm vụ ước tính: {taskData.estimated_hours} giờ
                                </Typography>
                            </Box>
                        )}

                        {/* Team */}
                        <FormControl fullWidth required error={!!errors.team_id}>
                            <InputLabel>Team</InputLabel>
                            <Select
                                value={formData.team_id}
                                onChange={(e) => handleChange('team_id', e.target.value)}
                                label="Team"
                                disabled={!formData.start_time || !formData.end_time}
                            >
                                <MenuItem value="">
                                    <em>-- Chọn nhóm --</em>
                                </MenuItem>
                                {/* Chỉ hiển thị teams khớp ca và cùng work_type */}
                                {filteredTeams
                                    .filter(team => {
                                        const taskWorkTypeId = taskData?.work_type_id || taskData?.work_type?.id || null;
                                        const teamWorkTypeIds = getTeamWorkTypeIds(team);
                                        const matchesWorkType = taskWorkTypeId ? teamWorkTypeIds.includes(taskWorkTypeId) : true;

                                        // Chỉ hiển thị nếu:
                                        // 1. Cùng work_type (hoặc không có work_type requirement)
                                        // 2. Khớp ca làm việc (nếu đã chọn day_of_week và time)
                                        if (!matchesWorkType) return false;

                                        if (formData.start_time && formData.end_time && formData.day_of_week) {
                                            return team.__matchesSlot === true;
                                        }

                                        // Nếu chưa chọn đủ thông tin, hiển thị tất cả teams cùng work_type
                                        return true;
                                    })
                                    .map(team => (
                                        <MenuItem key={team.id} value={team.id}>
                                            <Typography variant="body2">
                                                {team.name}
                                            </Typography>
                                        </MenuItem>
                                    ))}
                            </Select>
                            {errors.team_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                    {errors.team_id}
                                </Typography>
                            )}
                            {!errors.team_id && formData.start_time && formData.end_time && formData.day_of_week && (() => {
                                const matchingTeams = filteredTeams.filter(team => {
                                    const taskWorkTypeId = taskData?.work_type_id || taskData?.work_type?.id || null;
                                    const teamWorkTypeIds = getTeamWorkTypeIds(team);
                                    const matchesWorkType = taskWorkTypeId ? teamWorkTypeIds.includes(taskWorkTypeId) : true;
                                    return matchesWorkType && team.__matchesSlot === true;
                                });

                                if (matchingTeams.length === 0) {
                                    return (
                                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, ml: 2 }}>
                                            ⚠️ Không có nhóm nào có ca làm việc phù hợp với khung giờ này
                                        </Typography>
                                    );
                                }

                                return (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
                                        ✅ {matchingTeams.length} nhóm có ca làm việc phù hợp
                                    </Typography>
                                );
                            })()}
                            {!errors.team_id && taskData && (!formData.start_time || !formData.end_time || !formData.day_of_week) && (() => {
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
                        <FormControl fullWidth required error={!!errors.area_id}>
                            <InputLabel>Khu vực</InputLabel>
                            <Select
                                value={formData.area_id}
                                onChange={(e) => handleChange('area_id', e.target.value)}
                                label="Khu vực"
                            >
                                <MenuItem value="">
                                    <em>-- Chọn khu vực --</em>
                                </MenuItem>
                                {/* Chỉ hiển thị areas có cùng work_type với task */}
                                {filteredAreas.map(area => (
                                    <MenuItem key={area.id} value={area.id}>
                                        {area.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.area_id && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                    {errors.area_id}
                                </Typography>
                            )}
                            {!errors.area_id && taskData && (() => {
                                const taskWorkTypeId = taskData.work_type_id || taskData.work_type?.id || null;
                                if (taskWorkTypeId && filteredAreas.length === 0) {
                                    return (
                                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, ml: 2 }}>
                                            ⚠️ Không có khu vực nào có cùng loại công việc với nhiệm vụ này
                                        </Typography>
                                    );
                                }
                                if (taskWorkTypeId && filteredAreas.length > 0) {
                                    return (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
                                            ✅ {filteredAreas.length} khu vực có loại công việc phù hợp
                                        </Typography>
                                    );
                                }
                                return null;
                            })()}
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
                                    ? filteredAreas.find(a => a.id === formData.area_id)?.max_capacity
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
                                    ? `Tối đa: ${filteredAreas.find(a => a.id === formData.area_id)?.max_capacity || 0} (giới hạn của khu vực)`
                                    : 'Chọn khu vực trước để xem giới hạn sức chứa')
                            }
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />

                                {formData.price > 0 && (
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha(COLORS.SUCCESS[50], 0.3),
                                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.TEXT.SECONDARY }}>
                                            💰 Khách hàng sẽ thấy
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.SUCCESS[700] }}>
                                            {formatPrice(formData.price)}
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        )}

                        {/* Service Status - Only for Edit Mode */}
                        {mode === 'edit' && (
                            <FormControl fullWidth required error={!!errors.service_status}>
                                <InputLabel>Trạng thái Ca *</InputLabel>
                                <Select
                                    value={formData.service_status}
                                    onChange={(e) => handleChange('service_status', e.target.value)}
                                    label="Trạng thái Ca *"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                >
                                    <MenuItem value={SLOT_STATUS.AVAILABLE}>
                                        <Typography variant="body2">Có sẵn</Typography>
                                    </MenuItem>
                                    <MenuItem value={SLOT_STATUS.UNAVAILABLE}>
                                        <Typography variant="body2">Không khả dụng</Typography>
                                    </MenuItem>
                                    <MenuItem value={SLOT_STATUS.MAINTENANCE}>
                                        <Typography variant="body2">Bảo trì</Typography>
                                    </MenuItem>
                                    <MenuItem value={SLOT_STATUS.CANCELLED}>
                                        <Typography variant="body2">Đã hủy</Typography>
                                    </MenuItem>
                                </Select>
                                {errors.service_status ? (
                                    <FormHelperText error sx={{ ml: 0, mt: 0.5 }}>
                                        {errors.service_status}
                                    </FormHelperText>
                                ) : (
                                    <FormHelperText sx={{ ml: 0, mt: 0.5 }}>
                                        Chọn trạng thái hiện tại của ca làm việc
                                    </FormHelperText>
                                )}
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{
                    px: 3,
                    pt: 2,
                    pb: 2,
                    gap: 1.5,
                    borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`
                }}>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 100,
                            borderColor: alpha(COLORS.BORDER.DEFAULT, 0.5)
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        color={mode === 'edit' ? 'info' : 'success'}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 120,
                            boxShadow: `0 4px 12px ${alpha(mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500], 0.3)}`,
                            '&:hover': {
                                boxShadow: `0 6px 16px ${alpha(mode === 'edit' ? COLORS.INFO[500] : COLORS.SUCCESS[500], 0.4)}`
                            }
                        }}
                    >
                        {loading ? 'Đang xử lý...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo Ca')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert Modal for Success/Error Messages - Render outside Dialog để có z-index cao hơn */}
            <AlertModal
                isOpen={alertModal.open}
                onClose={() => {
                    setAlertModal({ ...alertModal, open: false });
                    // Nếu đóng alert thành công, cũng đóng form modal
                    // Nếu là lỗi, giữ form modal mở để user có thể sửa
                    if (alertModal.type === 'success') {
                        // Delay một chút để AlertModal có thời gian đóng trước
                        setTimeout(() => {
                            handleClose();
                        }, 100);
                    }
                }}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                okText="Đã hiểu"
            />
        </>
    );
};

export default SlotFormModal;

