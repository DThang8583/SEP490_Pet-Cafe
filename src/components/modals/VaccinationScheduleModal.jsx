import { useState, useEffect, useMemo } from 'react';
import { Button, TextField, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Typography, alpha, Box, Chip, Backdrop, Paper } from '@mui/material';
import { CalendarToday, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccinationScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    pets = [],
    vaccineTypes = [],
    species = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        pet_id: '',
        vaccine_type_id: '',
        scheduled_date: '',
        notes: '',
        status: 'PENDING' // PENDING or COMPLETED
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    pet_id: initialData.pet_id || '',
                    vaccine_type_id: initialData.vaccine_type_id || '',
                    scheduled_date: initialData.scheduled_date ? new Date(initialData.scheduled_date).toISOString().split('T')[0] : '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'PENDING'
                });
            } else {
                setFormData({
                    pet_id: '',
                    vaccine_type_id: '',
                    scheduled_date: '',
                    notes: '',
                    status: 'PENDING'
                });
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData]);

    const validate = () => {
        const newErrors = {};

        if (!formData.pet_id) {
            newErrors.pet_id = 'Vui lòng chọn thú cưng';
        }

        if (!formData.vaccine_type_id) {
            newErrors.vaccine_type_id = 'Vui lòng chọn loại vaccine';
        }

        if (!formData.scheduled_date) {
            newErrors.scheduled_date = 'Vui lòng chọn ngày tiêm';
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
            pet_id: '',
            vaccine_type_id: '',
            scheduled_date: '',
            notes: '',
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

    // Get available vaccine types for selected pet
    const availableVaccineTypes = useMemo(() => {
        if (!formData.pet_id) {
            return vaccineTypes;
        }
        const pet = pets.find(p => p.id === formData.pet_id);
        if (!pet) {
            return vaccineTypes;
        }
        const petSpeciesId = pet.species_id || pet.species?.id;
        if (!petSpeciesId) {
            return vaccineTypes;
        }
        return vaccineTypes.filter(vt => {
            const vtSpeciesId = vt.species_id || vt.species?.id;
            return vtSpeciesId === petSpeciesId;
        });
    }, [formData.pet_id, pets, vaccineTypes]);

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
                    boxShadow: `0 20px 60px ${alpha(COLORS.WARNING[900], 0.3)}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        background: COLORS.WARNING[500],
                        color: '#fff',
                        fontWeight: 800,
                        py: 2.5,
                        px: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <CalendarToday sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                        {editMode ? 'Chỉnh sửa Lịch tiêm' : 'Tạo Lịch tiêm mới'}
                    </Typography>
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            color: '#fff',
                            '&:hover': {
                                background: alpha('#fff', 0.2)
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    <Stack spacing={3}>
                        {/* Pet Selection */}
                        <FormControl fullWidth required error={Boolean(errors.pet_id)}>
                            <InputLabel>Chọn thú cưng</InputLabel>
                            <Select
                                value={formData.pet_id}
                                onChange={(e) => {
                                    const newPetId = e.target.value;
                                    // Reset vaccine_type_id when pet changes to ensure filter works correctly
                                    setFormData({
                                        ...formData,
                                        pet_id: newPetId,
                                        vaccine_type_id: '' // Reset vaccine selection when pet changes
                                    });
                                }}
                                label="Chọn thú cưng"
                            >
                                {pets.map(pet => (
                                    <MenuItem key={pet.id} value={pet.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>{pet.name}</Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                ({getSpeciesName(pet.species_id)})
                                            </Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
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
                            disabled={!formData.pet_id}
                        >
                            <InputLabel>Loại vaccine</InputLabel>
                            <Select
                                value={formData.vaccine_type_id}
                                onChange={(e) => setFormData({ ...formData, vaccine_type_id: e.target.value })}
                                label="Loại vaccine"
                                disabled={!formData.pet_id}
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
                                            {formData.pet_id ? 'Không có vaccine phù hợp với loài thú cưng này' : 'Vui lòng chọn thú cưng trước'}
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
                                                label="Đang chờ"
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
                                </Select>
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
                                        {new Date(formData.scheduled_date).toLocaleDateString('vi-VN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        p: 2.5,
                        background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5),
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        borderTop: `1px solid ${alpha(COLORS.WARNING[200], 0.3)}`
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