import { useState, useEffect, useMemo } from 'react';
import { Button, TextField, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Typography, alpha, Box, Chip, Backdrop, Paper } from '@mui/material';
import { CalendarToday, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import * as teamApi from '../../api/teamApi';

const VaccinationScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    pets = [],
    vaccineTypes = [],
    species = [],
    teams = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        species_id: '',
        vaccine_type_id: '',
        pet_id: '',
        scheduled_date: '',
        scheduled_time: '09:00', // Default time 9:00 AM to match backend
        notes: '',
        team_id: '',
        status: 'PENDING' // PENDING, COMPLETED, CANCELLED, IN_PROGRESS
    });

    const [errors, setErrors] = useState({});
    const [teamsWithShifts, setTeamsWithShifts] = useState([]);

    // Load team work shifts when modal opens
    useEffect(() => {
        const loadTeamWorkShifts = async () => {
            if (!isOpen || !teams || teams.length === 0) {
                setTeamsWithShifts([]);
                return;
            }

            try {
                // Filter out teams with status "INACTIVE" (Tạm ngưng)
                const activeTeams = teams.filter(team => {
                    const teamStatus = (team.status || '').toUpperCase();
                    return teamStatus !== 'INACTIVE';
                });

                const enriched = await Promise.allSettled(
                    activeTeams.map(async (team) => {
                        try {
                            const wsRes = await teamApi.getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 });
                            const teamWorkShifts = wsRes.data || [];
                            return {
                                ...team,
                                team_work_shifts: teamWorkShifts
                            };
                        } catch {
                            return { ...team, team_work_shifts: [] };
                        }
                    })
                );

                setTeamsWithShifts(enriched
                    .filter(r => r.status === 'fulfilled')
                    .map(r => r.value)
                );
            } catch (error) {
                console.error('[VaccinationScheduleModal] Error loading team work shifts:', error);
                // Filter out inactive teams even on error
                const activeTeams = teams.filter(team => {
                    const teamStatus = (team.status || '').toUpperCase();
                    return teamStatus !== 'INACTIVE';
                });
                setTeamsWithShifts(activeTeams.map(t => ({ ...t, team_work_shifts: [] })));
            }
        };

        loadTeamWorkShifts();
    }, [isOpen, teams]);

    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                // Get species_id from pet if available
                const pet = pets.find(p => p.id === initialData.pet_id);
                const speciesId = pet ? extractSpeciesId(pet) : '';

                // WORKAROUND: Backend stores time as "fake UTC" representing local Vietnam time
                // Example: "2025-11-28T15:00:00Z" means 15:00 Vietnam time (not UTC)
                // So we extract time directly from the string without timezone conversion
                let dateOnly = '';
                let timeOnly = '09:00'; // Default time

                if (initialData.scheduled_date) {
                    // Extract date and time directly from ISO string without Date conversion
                    // This avoids timezone conversion issues
                    const isoString = initialData.scheduled_date;
                    const match = isoString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);

                    if (match) {
                        dateOnly = match[1]; // YYYY-MM-DD
                        timeOnly = match[2]; // HH:MM

                        console.log('📥 Loading vaccination schedule time:', {
                            rawFromBackend: isoString,
                            extractedDate: dateOnly,
                            extractedTime: timeOnly,
                            note: 'Time is stored as UTC but represents local Vietnam time'
                        });
                    }
                }

                // Load team_id - check multiple possible locations in API response
                // API might return team_id directly, or as team.id, or team_id in team object
                let teamId = '';
                if (initialData.team_id) {
                    teamId = initialData.team_id;
                } else if (initialData.team?.id) {
                    teamId = initialData.team.id;
                } else if (initialData.team_id === null || initialData.team_id === undefined) {
                    // If explicitly null/undefined, keep empty string
                    teamId = '';
                }

                setFormData({
                    species_id: speciesId,
                    vaccine_type_id: initialData.vaccine_type_id || '',
                    pet_id: initialData.pet_id || '',
                    scheduled_date: dateOnly,
                    scheduled_time: timeOnly,
                    notes: initialData.notes || '',
                    team_id: teamId, // Load team_id from initialData
                    status: initialData.status || 'PENDING'
                });

                // Debug: Log to check if team_id is loaded
                console.log('📋 Loading schedule data for edit:', {
                    scheduleId: initialData.id,
                    team_id_direct: initialData.team_id,
                    team_object: initialData.team,
                    team_id_from_team_object: initialData.team?.id,
                    team_id_loaded_to_form: teamId,
                    all_initialData_keys: Object.keys(initialData),
                    full_initialData: initialData
                });
            } else {
                setFormData({
                    species_id: '',
                    vaccine_type_id: '',
                    pet_id: '',
                    scheduled_date: '',
                    scheduled_time: '09:00',
                    notes: '',
                    team_id: '',
                    status: 'PENDING'
                });
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData, pets]);

    const validate = () => {
        const newErrors = {};

        if (!formData.species_id) {
            newErrors.species_id = 'Vui lòng chọn loài';
        }

        if (!formData.vaccine_type_id) {
            newErrors.vaccine_type_id = 'Vui lòng chọn loại vaccine';
        }

        if (!formData.pet_id) {
            newErrors.pet_id = 'Vui lòng chọn thú cưng';
        }

        if (!formData.scheduled_date) {
            newErrors.scheduled_date = 'Vui lòng chọn ngày tiêm';
        }

        if (!formData.scheduled_time) {
            newErrors.scheduled_time = 'Vui lòng chọn giờ tiêm';
        }

        if (!formData.team_id) {
            newErrors.team_id = 'Vui lòng chọn nhóm';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            // WORKAROUND: Backend extracts time from UTC timestamp without timezone conversion
            // So we send local time AS IF it were UTC (with Z suffix)
            // Example: User selects 15:00 Vietnam time → Send "2025-11-28T15:00:00Z"
            // Backend will extract 15:00 and use it directly for daily task
            const scheduledDateTime = formData.scheduled_date && formData.scheduled_time
                ? `${formData.scheduled_date}T${formData.scheduled_time}:00Z`
                : '';

            console.log('📤 Sending vaccination schedule with time:', {
                userInput: {
                    date: formData.scheduled_date,
                    time: formData.scheduled_time
                },
                sentToBackend: scheduledDateTime,
                note: 'Time is sent as UTC but represents local Vietnam time'
            });

            onSubmit({
                ...formData,
                scheduled_date: scheduledDateTime
            });
        }
    };

    const handleClose = () => {
        setFormData({
            species_id: '',
            vaccine_type_id: '',
            pet_id: '',
            scheduled_date: '',
            scheduled_time: '09:00',
            notes: '',
            team_id: '',
            status: 'PENDING'
        });
        setErrors({});
        onClose();
    };

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Helper function to extract species_id from pet object
    const extractSpeciesId = (pet) => {
        // Try multiple sources for species_id
        if (pet.species_id) return pet.species_id;
        if (pet.species?.id) return pet.species.id;
        if (pet.breed?.species_id) return pet.breed.species_id;
        if (pet.breed?.species?.id) return pet.breed.species.id;
        return null;
    };

    // Get species name by ID
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? capitalizeName(sp.name) : '—';
    };

    // Get pet name
    const getPetName = (petId) => {
        const pet = pets.find(p => p.id === petId);
        return pet ? pet.name : '';
    };

    // Get vaccine type name
    const getVaccineTypeName = (vaccineTypeId) => {
        const vaccineType = vaccineTypes.find(vt => vt.id === vaccineTypeId);
        return vaccineType ? vaccineType.name : '';
    };

    // Get available vaccine types for selected species
    const availableVaccineTypes = useMemo(() => {
        if (!formData.species_id) {
            return [];
        }
        return vaccineTypes.filter(vt => {
            const vtSpeciesId = vt.species_id || vt.species?.id;
            return vtSpeciesId === formData.species_id;
        });
    }, [formData.species_id, vaccineTypes]);

    // Get available pets for selected species
    const availablePets = useMemo(() => {
        if (!formData.species_id) {
            return [];
        }

        const filtered = pets.filter(pet => {
            const petSpeciesId = extractSpeciesId(pet);
            return petSpeciesId === formData.species_id;
        });

        return filtered;
    }, [formData.species_id, pets]);

    // Filter teams based on scheduled date and time
    const filteredTeams = useMemo(() => {
        if (!formData.scheduled_date || !formData.scheduled_time || teamsWithShifts.length === 0) {
            return teamsWithShifts.map(team => ({
                ...team,
                __matchesSchedule: false
            }));
        }

        // Get day of week from scheduled_date
        const dateObj = new Date(`${formData.scheduled_date}T00:00:00`);
        const dayOfWeekIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayOfWeekMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayOfWeek = dayOfWeekMap[dayOfWeekIndex];

        // Normalize time to HH:mm:ss format
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

        const scheduledTime = normalizeTime(formData.scheduled_time);

        console.log('[VaccinationScheduleModal] Filtering teams:', {
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            dayOfWeek,
            normalizedTime: scheduledTime
        });

        const withMatchFlag = teamsWithShifts.map(team => {
            const matchesSchedule = team.team_work_shifts?.some(tws => {
                const workShift = tws?.work_shift;
                if (!workShift) return false;

                const shiftStart = normalizeTime(workShift.start_time);
                const shiftEnd = normalizeTime(workShift.end_time);
                const applicableDays = Array.isArray(workShift.applicable_days) ? workShift.applicable_days : [];

                // Check if scheduled time is within shift time range
                const timeMatches = shiftStart && scheduledTime && shiftEnd &&
                    shiftStart <= scheduledTime && shiftEnd >= scheduledTime;

                // Check if day of week matches
                const dayMatches = applicableDays.includes(dayOfWeek);

                const matches = timeMatches && dayMatches;

                if (matches) {
                    console.log('[VaccinationScheduleModal] Team matches schedule:', {
                        teamName: team.name,
                        workShift: workShift.name,
                        shiftTime: `${shiftStart} - ${shiftEnd}`,
                        applicableDays,
                        scheduledDay: dayOfWeek,
                        scheduledTime,
                        matches: true
                    });
                }

                return matches;
            }) ?? false;

            return {
                ...team,
                __matchesSchedule: matchesSchedule
            };
        });

        // Sort: matching teams first
        return withMatchFlag.sort((a, b) => {
            return Number(b.__matchesSchedule) - Number(a.__matchesSchedule);
        });
    }, [formData.scheduled_date, formData.scheduled_time, teamsWithShifts]);


    if (!isOpen) return null;

    return (
        <Backdrop
            open={isOpen}
            onClick={handleClose}
            sx={{
                zIndex: 1300,
                backgroundColor: alpha('#000', 0.5)
            }}
        >
            <Paper
                onClick={(e) => e.stopPropagation()}
                sx={{
                    width: '90%',
                    maxWidth: 600,
                    maxHeight: '90vh',
                    overflow: 'auto',
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                        borderBottom: `3px solid ${COLORS.WARNING[500]}`
                    }}
                >
                    <Box sx={{ fontWeight: 800, color: COLORS.WARNING[700], pb: 1, pt: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday />
                        {editMode ? '✏️ Chỉnh sửa Lịch tiêm' : '➕ Tạo Lịch tiêm mới'}
                    </Box>
                </Box>

                <Box sx={{ pt: 3, pb: 2, px: 3, flex: 1, overflow: 'auto' }}>
                    <Stack spacing={3}>
                        {/* Species Selection */}
                        <FormControl fullWidth required error={Boolean(errors.species_id)}>
                            <InputLabel>Loài</InputLabel>
                            <Select
                                value={formData.species_id}
                                onChange={(e) => {
                                    const newSpeciesId = e.target.value;
                                    // Reset vaccine_type_id and pet_id when species changes
                                    setFormData({
                                        ...formData,
                                        species_id: newSpeciesId,
                                        vaccine_type_id: '',
                                        pet_id: ''
                                    });
                                }}
                                label="Loài"
                            >
                                {species.map(sp => (
                                    <MenuItem key={sp.id} value={sp.id}>
                                        <Typography>{capitalizeName(sp.name)}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.species_id ? (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.species_id}
                                </Typography>
                            ) : (
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5, ml: 1.5 }}>
                                    Có {species.length} loài
                                </Typography>
                            )}
                        </FormControl>

                        {/* Vaccine Type Selection */}
                        <FormControl
                            fullWidth
                            required
                            error={Boolean(errors.vaccine_type_id)}
                            disabled={!formData.species_id}
                        >
                            <InputLabel>Loại vaccine</InputLabel>
                            <Select
                                value={formData.vaccine_type_id}
                                onChange={(e) => setFormData({ ...formData, vaccine_type_id: e.target.value })}
                                label="Loại vaccine"
                                disabled={!formData.species_id}
                            >
                                {availableVaccineTypes.length > 0 ? (
                                    availableVaccineTypes.map(vt => (
                                        <MenuItem key={vt.id} value={vt.id}>
                                            <Stack spacing={0.5}>
                                                <Typography>{vt.name}</Typography>
                                                {vt.description && (
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                        {vt.description.substring(0, 60)}...
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {formData.species_id ? 'Không có vaccine phù hợp với loài này' : 'Vui lòng chọn loài trước'}
                                        </Typography>
                                    </MenuItem>
                                )}
                            </Select>
                            {errors.vaccine_type_id ? (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.vaccine_type_id}
                                </Typography>
                            ) : formData.species_id && (
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5, ml: 1.5 }}>
                                    Tìm thấy {availableVaccineTypes.length} loại vaccine (Tổng: {vaccineTypes.length})
                                </Typography>
                            )}
                        </FormControl>

                        {/* Pet Selection */}
                        <FormControl fullWidth required error={Boolean(errors.pet_id)} disabled={!formData.species_id}>
                            <InputLabel>Thú cưng</InputLabel>
                            <Select
                                value={formData.pet_id}
                                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                                label="Thú cưng"
                                disabled={!formData.species_id}
                            >
                                {availablePets.length > 0 ? (
                                    availablePets.map(pet => (
                                        <MenuItem key={pet.id} value={pet.id}>
                                            <Typography>{pet.name}</Typography>
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {formData.species_id ? 'Không có thú cưng thuộc loài này' : 'Vui lòng chọn loài trước'}
                                        </Typography>
                                    </MenuItem>
                                )}
                            </Select>
                            {errors.pet_id ? (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.pet_id}
                                </Typography>
                            ) : formData.species_id && (
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5, ml: 1.5 }}>
                                    Tìm thấy {availablePets.length} thú cưng (Tổng: {pets.length})
                                </Typography>
                            )}
                        </FormControl>

                        {/* Scheduled Date */}
                        <TextField
                            label="Ngày tiêm dự kiến"
                            type="date"
                            value={formData.scheduled_date}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            error={Boolean(errors.scheduled_date)}
                            helperText={errors.scheduled_date}
                        />

                        {/* Scheduled Time */}
                        <TextField
                            label="Giờ tiêm dự kiến"
                            type="time"
                            value={formData.scheduled_time}
                            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            error={Boolean(errors.scheduled_time)}
                            helperText={errors.scheduled_time || 'Mặc định: 09:00 (9h sáng)'}
                        />

                        {/* Status - Only in Edit Mode */}
                        {editMode && (
                            <FormControl fullWidth>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="PENDING">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label="Đã lên lịch"
                                                size="small"
                                                sx={{
                                                    background: alpha(COLORS.WARNING[100], 0.7),
                                                    color: COLORS.WARNING[800],
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Typography variant="body2">Lịch tiêm chưa thực hiện</Typography>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="IN_PROGRESS">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label="Đang thực hiện"
                                                size="small"
                                                sx={{
                                                    background: alpha(COLORS.INFO[100], 0.7),
                                                    color: COLORS.INFO[800],
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Typography variant="body2">Đang trong quá trình tiêm</Typography>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="COMPLETED">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label="Đã hoàn thành"
                                                size="small"
                                                sx={{
                                                    background: alpha(COLORS.SUCCESS[100], 0.7),
                                                    color: COLORS.SUCCESS[800],
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Typography variant="body2">Đã tiêm xong</Typography>
                                        </Stack>
                                    </MenuItem>
                                    <MenuItem value="CANCELLED">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip
                                                label="Đã hủy"
                                                size="small"
                                                sx={{
                                                    background: alpha(COLORS.ERROR[100], 0.7),
                                                    color: COLORS.ERROR[800],
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Typography variant="body2">Lịch tiêm đã bị hủy</Typography>
                                        </Stack>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {/* Team Selection - Required */}
                        {teams.length > 0 && (
                            <FormControl fullWidth required error={Boolean(errors.team_id)}>
                                <InputLabel>Nhóm</InputLabel>
                                <Select
                                    value={formData.team_id}
                                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                                    label="Nhóm"
                                    disabled={!formData.scheduled_date || !formData.scheduled_time}
                                >
                                    <MenuItem value="">
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            -- Chọn nhóm --
                                        </Typography>
                                    </MenuItem>
                                    {/* Chỉ hiển thị teams khớp ca làm việc */}
                                    {filteredTeams
                                        .filter(team => team.__matchesSchedule)
                                        .map(team => (
                                            <MenuItem key={team.id} value={team.id}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {team.name}
                                                </Typography>
                                            </MenuItem>
                                        ))}
                                </Select>
                                {errors.team_id && (
                                    <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                        {errors.team_id}
                                    </Typography>
                                )}
                                {!errors.team_id && formData.scheduled_date && formData.scheduled_time && (
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5, ml: 1.5 }}>
                                        {(() => {
                                            const dateObj = new Date(`${formData.scheduled_date}T00:00:00`);
                                            const dayOfWeekMap = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                                            const dayName = dayOfWeekMap[dateObj.getDay()];
                                            const matchingCount = filteredTeams.filter(t => t.__matchesSchedule).length;

                                            return matchingCount > 0
                                                ? `✅ ${matchingCount} nhóm có ca làm việc vào ${dayName} lúc ${formData.scheduled_time}`
                                                : `⚠️ Không có nhóm nào có ca làm việc vào ${dayName} lúc ${formData.scheduled_time}`;
                                        })()}
                                    </Typography>
                                )}
                                {!errors.team_id && (!formData.scheduled_date || !formData.scheduled_time) && (
                                    <Typography variant="caption" sx={{ color: COLORS.WARNING[700], mt: 0.5, ml: 1.5 }}>
                                        ⏰ Vui lòng chọn ngày và giờ tiêm trước để xem nhóm phù hợp
                                    </Typography>
                                )}
                            </FormControl>
                        )}

                        {/* Notes */}
                        <TextField
                            label="Ghi chú"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Ghi chú về lịch tiêm..."
                        />

                        {/* Preview Info */}
                        {formData.pet_id && formData.vaccine_type_id && formData.scheduled_date && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: alpha(COLORS.INFO[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: COLORS.INFO[800] }}>
                                    📋 Thông tin lịch tiêm
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2">
                                        <strong>Đối tượng:</strong> {getPetName(formData.pet_id)}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Vaccine:</strong> {getVaccineTypeName(formData.vaccine_type_id)}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Ngày:</strong>{' '}
                                        {formData.scheduled_date ? new Date(`${formData.scheduled_date}T00:00:00`).toLocaleDateString('vi-VN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : '—'}
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Box>

                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2
                    }}
                >
                    <Button
                        onClick={handleClose}
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            fontWeight: 600
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            bgcolor: COLORS.WARNING[500],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: COLORS.WARNING[600]
                            }
                        }}
                    >
                        {editMode ? 'Cập nhật' : 'Tạo lịch'}
                    </Button>
                </Box>
            </Paper>
        </Backdrop>
    );
};

export default VaccinationScheduleModal;