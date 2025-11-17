import { useState, useEffect, useMemo } from 'react';
import { Button, TextField, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Typography, alpha, Box, Chip, Backdrop, Paper } from '@mui/material';
import { Vaccines, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccinationRecordModal = ({
    isOpen,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    pets = [],
    vaccineTypes = [],
    schedules = [],
    species = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        species_id: '',
        pet_id: '',
        vaccine_type_id: '',
        vaccination_date: '',
        next_due_date: '',
        veterinarian: '',
        clinic_name: '',
        batch_number: '',
        notes: '',
        schedule_id: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                // Get species_id from pet if available
                const pet = pets.find(p => p.id === initialData.pet_id);
                const speciesId = pet?.species_id || pet?.species?.id || '';

                setFormData({
                    species_id: speciesId,
                    pet_id: initialData.pet_id || '',
                    vaccine_type_id: initialData.vaccine_type_id || '',
                    vaccination_date: initialData.vaccination_date ? new Date(initialData.vaccination_date).toISOString().slice(0, 16) : '',
                    next_due_date: initialData.next_due_date ? new Date(initialData.next_due_date).toISOString().slice(0, 16) : '',
                    veterinarian: initialData.veterinarian || '',
                    clinic_name: initialData.clinic_name || '',
                    batch_number: initialData.batch_number || '',
                    notes: initialData.notes || '',
                    schedule_id: initialData.schedule_id || ''
                });
            } else {
                setFormData({
                    species_id: '',
                    pet_id: '',
                    vaccine_type_id: '',
                    vaccination_date: '',
                    next_due_date: '',
                    veterinarian: '',
                    clinic_name: '',
                    batch_number: '',
                    notes: '',
                    schedule_id: ''
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

        if (!formData.pet_id) {
            newErrors.pet_id = 'Vui lòng chọn thú cưng';
        }

        if (!formData.vaccine_type_id) {
            newErrors.vaccine_type_id = 'Vui lòng chọn loại vaccine';
        }

        if (!formData.vaccination_date) {
            newErrors.vaccination_date = 'Vui lòng chọn ngày tiêm';
        }

        if (!formData.next_due_date) {
            newErrors.next_due_date = 'Vui lòng chọn ngày tiêm tiếp theo';
        }

        // Validate dates
        if (formData.vaccination_date && formData.next_due_date) {
            const vaccinationDate = new Date(formData.vaccination_date);
            const nextDueDate = new Date(formData.next_due_date);
            if (nextDueDate <= vaccinationDate) {
                newErrors.next_due_date = 'Ngày tiêm tiếp theo phải sau ngày tiêm';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(formData);
        }
    };

    const handleClose = () => {
        setFormData({
            species_id: '',
            pet_id: '',
            vaccine_type_id: '',
            vaccination_date: '',
            next_due_date: '',
            veterinarian: '',
            clinic_name: '',
            batch_number: '',
            notes: '',
            schedule_id: ''
        });
        setErrors({});
        onClose();
    };

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
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

    // Calculate next due date based on vaccination date and vaccine type
    const handleVaccinationDateChange = (date) => {
        setFormData(prev => {
            const newData = { ...prev, vaccination_date: date };

            // Auto-calculate next_due_date if vaccine_type_id is selected
            if (date && prev.vaccine_type_id) {
                const vaccineType = vaccineTypes.find(vt => vt.id === prev.vaccine_type_id);
                if (vaccineType && vaccineType.interval_months) {
                    const vaccinationDate = new Date(date);
                    const nextDue = new Date(vaccinationDate);
                    nextDue.setMonth(nextDue.getMonth() + vaccineType.interval_months);
                    newData.next_due_date = nextDue.toISOString().slice(0, 16);
                }
            }

            return newData;
        });
    };

    // Calculate next due date when vaccine type changes
    const handleVaccineTypeChange = (vaccineTypeId) => {
        setFormData(prev => {
            const newData = { ...prev, vaccine_type_id: vaccineTypeId };

            // Auto-calculate next_due_date if vaccination_date is selected
            if (prev.vaccination_date && vaccineTypeId) {
                const vaccineType = vaccineTypes.find(vt => vt.id === vaccineTypeId);
                if (vaccineType && vaccineType.interval_months) {
                    const vaccinationDate = new Date(prev.vaccination_date);
                    const nextDue = new Date(vaccinationDate);
                    nextDue.setMonth(nextDue.getMonth() + vaccineType.interval_months);
                    newData.next_due_date = nextDue.toISOString().slice(0, 16);
                }
            }

            return newData;
        });
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
        return pets.filter(pet => {
            const petSpeciesId = pet.species_id || pet.species?.id;
            return petSpeciesId === formData.species_id;
        });
    }, [formData.species_id, pets]);

    // Get available schedules for selected pet
    const availableSchedules = useMemo(() => {
        if (!formData.pet_id) {
            return [];
        }
        return schedules.filter(s => s.pet_id === formData.pet_id);
    }, [formData.pet_id, schedules]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

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
                    width: '95%',
                    maxWidth: 1000,
                    maxHeight: '85vh',
                    overflow: 'auto',
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                        borderBottom: `3px solid ${COLORS.INFO[500]}`
                    }}
                >
                    <Box sx={{ fontWeight: 800, color: COLORS.INFO[700], pb: 1, pt: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Vaccines />
                        {editMode ? '✏️ Chỉnh sửa Hồ sơ tiêm phòng' : '➕ Tạo Hồ sơ tiêm phòng mới'}
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
                                        pet_id: '',
                                        schedule_id: ''
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
                            {errors.species_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.species_id}
                                </Typography>
                            )}
                        </FormControl>

                        {/* Pet Selection */}
                        <FormControl fullWidth required error={Boolean(errors.pet_id)} disabled={!formData.species_id}>
                            <InputLabel>Thú cưng</InputLabel>
                            <Select
                                value={formData.pet_id}
                                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value, schedule_id: '' })}
                                label="Thú cưng"
                                disabled={!formData.species_id}
                            >
                                {availablePets.length > 0 ? (
                                    availablePets.map((pet) => (
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
                            {errors.pet_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.pet_id}
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
                                onChange={(e) => handleVaccineTypeChange(e.target.value)}
                                label="Loại vaccine"
                                disabled={!formData.species_id}
                            >
                                {availableVaccineTypes.length > 0 ? (
                                    availableVaccineTypes.map((vt) => (
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
                            {errors.vaccine_type_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.vaccine_type_id}
                                </Typography>
                            )}
                        </FormControl>

                        {/* Vaccination Date */}
                        <TextField
                            label="Ngày tiêm"
                            type="datetime-local"
                            value={formData.vaccination_date}
                            onChange={(e) => handleVaccinationDateChange(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            error={Boolean(errors.vaccination_date)}
                            helperText={errors.vaccination_date}
                        />

                        {/* Next Due Date */}
                        <TextField
                            label="Ngày tiêm tiếp theo"
                            type="datetime-local"
                            value={formData.next_due_date}
                            onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{
                                shrink: true
                            }}
                            error={Boolean(errors.next_due_date)}
                            helperText={errors.next_due_date}
                        />

                        {/* Veterinarian */}
                        <TextField
                            label="Bác sĩ thú y"
                            value={formData.veterinarian}
                            onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                            fullWidth
                            placeholder="Nhập tên bác sĩ thú y"
                        />

                        {/* Clinic Name */}
                        <TextField
                            label="Tên phòng khám"
                            value={formData.clinic_name}
                            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                            fullWidth
                            placeholder="Nhập tên phòng khám"
                        />

                        {/* Batch Number */}
                        <TextField
                            label="Số lô"
                            value={formData.batch_number}
                            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                            fullWidth
                            placeholder="Nhập số lô vaccine"
                        />

                        {/* Schedule Selection - Optional */}
                        <FormControl fullWidth disabled={!formData.pet_id}>
                            <InputLabel>Lịch tiêm (tùy chọn)</InputLabel>
                            <Select
                                value={formData.schedule_id}
                                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                                label="Lịch tiêm (tùy chọn)"
                                disabled={!formData.pet_id}
                            >
                                <MenuItem value="">
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Không có
                                    </Typography>
                                </MenuItem>
                                {availableSchedules.length > 0 ? (
                                    availableSchedules.map((schedule) => (
                                        <MenuItem key={schedule.id} value={schedule.id}>
                                            <Stack spacing={0.5}>
                                                <Typography>{getVaccineTypeName(schedule.vaccine_type_id)}</Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {formatDate(schedule.scheduled_date)}
                                                </Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {formData.pet_id ? 'Không có lịch tiêm cho thú cưng này' : 'Vui lòng chọn thú cưng trước'}
                                        </Typography>
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        {/* Notes */}
                        <TextField
                            label="Ghi chú"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Ghi chú về hồ sơ tiêm phòng..."
                        />

                        {/* Preview Info */}
                        {formData.pet_id && formData.vaccine_type_id && formData.vaccination_date && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: alpha(COLORS.INFO[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: COLORS.INFO[800] }}>
                                    📋 Thông tin hồ sơ tiêm phòng
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2">
                                        <strong>Loài:</strong> {getSpeciesName(formData.species_id)}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Thú cưng:</strong> {getPetName(formData.pet_id)}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Vaccine:</strong> {getVaccineTypeName(formData.vaccine_type_id)}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Ngày tiêm:</strong> {formatDate(formData.vaccination_date)}
                                    </Typography>
                                    {formData.next_due_date && (
                                        <Typography variant="body2">
                                            <strong>Ngày tiêm tiếp theo:</strong> {formatDate(formData.next_due_date)}
                                        </Typography>
                                    )}
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
                            bgcolor: COLORS.INFO[500],
                            color: '#fff',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': {
                                bgcolor: COLORS.INFO[600]
                            }
                        }}
                    >
                        {editMode ? 'Cập nhật' : 'Tạo hồ sơ'}
                    </Button>
                </Box>
            </Paper>
        </Backdrop>
    );
};

export default VaccinationRecordModal;

