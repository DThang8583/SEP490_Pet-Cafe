import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography, alpha } from '@mui/material';
import { Vaccines, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccineTypeModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, species = [], isLoading = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        species_id: '',
        interval_months: '',
        is_required: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                // Safeguard: ensure species_id is a string, not an object
                let speciesId = initialData.species_id || '';
                if (typeof speciesId === 'object' && speciesId.id) {
                    speciesId = speciesId.id;
                }

                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    species_id: String(speciesId),
                    interval_months: initialData.interval_months || '',
                    is_required: initialData.is_required !== undefined ? initialData.is_required : true
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    species_id: '',
                    interval_months: '',
                    is_required: true
                });
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData]);

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên vaccine là bắt buộc';
        }

        if (!formData.species_id) {
            newErrors.species_id = 'Loài thú cưng là bắt buộc';
        }

        if (!formData.interval_months || formData.interval_months <= 0) {
            newErrors.interval_months = 'Chu kỳ tiêm lại phải lớn hơn 0';
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
            name: '',
            description: '',
            species_id: '',
            interval_months: '',
            is_required: true
        });
        setErrors({});
        onClose();
    };

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.PRIMARY[900], 0.3)}`
                }
            }}
        >
            <DialogTitle
                sx={{
                    background: COLORS.PRIMARY[500],
                    color: '#fff',
                    fontWeight: 800,
                    py: 2.5
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Vaccines sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                        {editMode ? 'Chỉnh sửa Vaccine Type' : 'Thêm Vaccine Type mới'}
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
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        label="Tên vaccine"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                        placeholder="VD: Vaccine 5 trong 1 (DHPPI)"
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Mô tả chi tiết về vaccine..."
                    />
                    <FormControl fullWidth required error={Boolean(errors.species_id)}>
                        <InputLabel>Loài thú cưng</InputLabel>
                        <Select
                            value={formData.species_id}
                            onChange={(e) => setFormData({ ...formData, species_id: e.target.value })}
                            label="Loài thú cưng"
                        >
                            {Array.isArray(species) && species
                                .filter(s => s.is_active === true)
                                .map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {capitalizeName(s.name) || '—'}
                                    </MenuItem>
                                ))}
                        </Select>
                        {errors.species_id && (
                            <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.5 }}>
                                {errors.species_id}
                            </Typography>
                        )}
                    </FormControl>
                    <TextField
                        label="Chu kỳ tiêm lại (tháng)"
                        value={formData.interval_months}
                        onChange={(e) => setFormData({ ...formData, interval_months: e.target.value })}
                        fullWidth
                        required
                        type="number"
                        inputProps={{ min: 1 }}
                        error={Boolean(errors.interval_months)}
                        helperText={errors.interval_months}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.is_required}
                                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: COLORS.ERROR[600]
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: COLORS.ERROR[600]
                                    }
                                }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Vaccine bắt buộc
                            </Typography>
                        }
                    />
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
                        bgcolor: COLORS.PRIMARY[500],
                        color: '#fff',
                        fontWeight: 700,
                        px: 3,
                        '&:hover': {
                            bgcolor: COLORS.PRIMARY[600]
                        }
                    }}
                >
                    {editMode ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VaccineTypeModal;