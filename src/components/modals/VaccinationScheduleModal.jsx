import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton,
    FormControl, InputLabel, Select, MenuItem, Typography, alpha, RadioGroup, FormControlLabel, Radio, Chip, Box
} from '@mui/material';
import { CalendarToday, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccinationScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    pets = [],
    groups = [],
    vaccineTypes = [],
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        target_type: 'pet', // 'pet' or 'group'
        pet_id: '',
        group_id: '',
        vaccine_type_id: '',
        scheduled_date: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    target_type: initialData.group_id ? 'group' : 'pet',
                    pet_id: initialData.pet_id || '',
                    group_id: initialData.group_id || '',
                    vaccine_type_id: initialData.vaccine_type_id || '',
                    scheduled_date: initialData.scheduled_date ? new Date(initialData.scheduled_date).toISOString().split('T')[0] : '',
                    notes: initialData.notes || ''
                });
            } else {
                setFormData({
                    target_type: 'pet',
                    pet_id: '',
                    group_id: '',
                    vaccine_type_id: '',
                    scheduled_date: '',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData]);

    const validate = () => {
        const newErrors = {};

        if (formData.target_type === 'pet' && !formData.pet_id) {
            newErrors.pet_id = 'Vui lòng chọn thú cưng';
        }

        if (formData.target_type === 'group' && !formData.group_id) {
            newErrors.group_id = 'Vui lòng chọn nhóm thú cưng';
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
            target_type: 'pet',
            pet_id: '',
            group_id: '',
            vaccine_type_id: '',
            scheduled_date: '',
            notes: ''
        });
        setErrors({});
        onClose();
    };

    // Get pet name
    const getPetName = (petId) => {
        const pet = pets.find(p => p.id === petId);
        return pet ? pet.name : '';
    };

    // Get group name
    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : '';
    };

    // Get vaccine type name
    const getVaccineTypeName = (vaccineTypeId) => {
        const vaccineType = vaccineTypes.find(vt => vt.id === vaccineTypeId);
        return vaccineType ? vaccineType.name : '';
    };

    // Get group pet count
    const getGroupPetCount = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.current_count : 0;
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.WARNING[900], 0.3)}`
                }
            }}
        >
            <DialogTitle
                sx={{
                    background: `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[700]} 100%)`,
                    color: '#fff',
                    fontWeight: 800,
                    py: 2.5
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
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
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ p: 3, mt: 2 }}>
                <Stack spacing={3}>
                    {/* Target Type Selection */}
                    {!editMode && (
                        <FormControl>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Đối tượng tiêm
                            </Typography>
                            <RadioGroup
                                value={formData.target_type}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        target_type: e.target.value,
                                        pet_id: '',
                                        group_id: ''
                                    });
                                    setErrors({});
                                }}
                                row
                            >
                                <FormControlLabel
                                    value="pet"
                                    control={<Radio />}
                                    label="Thú cưng đơn lẻ"
                                />
                                <FormControlLabel
                                    value="group"
                                    control={<Radio />}
                                    label="Nhóm thú cưng"
                                />
                            </RadioGroup>
                        </FormControl>
                    )}

                    {/* Pet Selection */}
                    {formData.target_type === 'pet' && (
                        <FormControl fullWidth required error={Boolean(errors.pet_id)}>
                            <InputLabel>Chọn thú cưng</InputLabel>
                            <Select
                                value={formData.pet_id}
                                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                                label="Chọn thú cưng"
                            >
                                {pets.map(pet => (
                                    <MenuItem key={pet.id} value={pet.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>{pet.name}</Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                ({pet.species_id === '3fa85f64-5717-4562-b3fc-2c963f66afa6' ? 'Chó' : 'Mèo'})
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
                    )}

                    {/* Group Selection */}
                    {formData.target_type === 'group' && (
                        <FormControl fullWidth required error={Boolean(errors.group_id)}>
                            <InputLabel>Chọn nhóm thú cưng</InputLabel>
                            <Select
                                value={formData.group_id}
                                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                                label="Chọn nhóm thú cưng"
                            >
                                {groups.map(group => (
                                    <MenuItem key={group.id} value={group.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>{group.name}</Typography>
                                            <Chip
                                                label={`${getGroupPetCount(group.id)} con`}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    background: alpha(COLORS.INFO[100], 0.5)
                                                }}
                                            />
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.group_id && (
                                <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                    {errors.group_id}
                                </Typography>
                            )}
                        </FormControl>
                    )}

                    {/* Vaccine Type Selection */}
                    <FormControl fullWidth required error={Boolean(errors.vaccine_type_id)}>
                        <InputLabel>Loại vaccine</InputLabel>
                        <Select
                            value={formData.vaccine_type_id}
                            onChange={(e) => setFormData({ ...formData, vaccine_type_id: e.target.value })}
                            label="Loại vaccine"
                        >
                            {vaccineTypes.map(vt => (
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
                            ))}
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
                    {(formData.pet_id || formData.group_id) && formData.vaccine_type_id && formData.scheduled_date && (
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
                                    <strong>Đối tượng:</strong> {formData.target_type === 'pet'
                                        ? getPetName(formData.pet_id)
                                        : `${getGroupName(formData.group_id)} (${getGroupPetCount(formData.group_id)} con)`}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Vaccine:</strong> {getVaccineTypeName(formData.vaccine_type_id)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Ngày:</strong> {new Date(formData.scheduled_date).toLocaleDateString('vi-VN', {
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
            </DialogContent>
            <DialogActions sx={{ p: 2.5, background: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
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
                        background: `linear-gradient(135deg, ${COLORS.WARNING[500]} 0%, ${COLORS.WARNING[700]} 100%)`,
                        color: '#fff',
                        fontWeight: 700,
                        px: 3,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[800]} 100%)`
                        }
                    }}
                >
                    {editMode ? 'Cập nhật' : 'Tạo lịch'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VaccinationScheduleModal;

