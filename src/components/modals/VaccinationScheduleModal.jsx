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
    teams = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        species_id: '',
        vaccine_type_id: '',
        pet_id: '',
        scheduled_date: '',
        notes: '',
        team_id: '',
        status: 'PENDING' // PENDING, COMPLETED, CANCELLED, IN_PROGRESS
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
                    vaccine_type_id: initialData.vaccine_type_id || '',
                    pet_id: initialData.pet_id || '',
                    scheduled_date: initialData.scheduled_date ? new Date(initialData.scheduled_date).toISOString().split('T')[0] : '',
                    notes: initialData.notes || '',
                    team_id: initialData.team_id || '',
                    status: initialData.status || 'PENDING'
                });
            } else {
                setFormData({
                    species_id: '',
                    vaccine_type_id: '',
                    pet_id: '',
                    scheduled_date: '',
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
            vaccine_type_id: '',
            pet_id: '',
            scheduled_date: '',
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
        return pets.filter(pet => {
            const petSpeciesId = pet.species_id || pet.species?.id;
            return petSpeciesId === formData.species_id;
        });
    }, [formData.species_id, pets]);

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
                            {errors.species_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.species_id}
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
                            {errors.vaccine_type_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.vaccine_type_id}
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
                            {errors.pet_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.pet_id}
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

                        {/* Team Selection - Optional */}
                        {teams.length > 0 && (
                            <FormControl fullWidth>
                                <InputLabel>Nhóm (tùy chọn)</InputLabel>
                                <Select
                                    value={formData.team_id}
                                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                                    label="Nhóm (tùy chọn)"
                                >
                                    <MenuItem value="">
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Không chọn
                                        </Typography>
                                    </MenuItem>
                                    {teams.map(team => (
                                        <MenuItem key={team.id} value={team.id}>
                                            <Typography>{team.name}</Typography>
                                        </MenuItem>
                                    ))}
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