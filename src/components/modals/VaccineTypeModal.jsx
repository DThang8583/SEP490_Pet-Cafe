import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography, alpha, Box } from '@mui/material';
import { Vaccines, Close } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import AlertModal from './AlertModal';

// Default form state for vaccine type
const INITIAL_FORM_STATE = {
    name: '',
    description: '',
    species_id: '',
    interval_months: '',
    is_required: true,
    required_doses: ''
};

const VaccineTypeModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, species = [], isLoading = false }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [errors, setErrors] = useState({});
    const [alertModal, setAlertModal] = useState({
        open: false,
        type: 'error',
        title: 'Lỗi',
        message: ''
    });

    useEffect(() => {
        if (!isOpen) return;

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
                is_required: initialData.is_required !== undefined ? initialData.is_required : true,
                required_doses: initialData.required_doses || ''
            });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }

        setErrors({});
    }, [isOpen, editMode, initialData]);

    const validate = () => {
        const newErrors = {};
        const errorMessages = [];

        if (!formData.name.trim()) {
            newErrors.name = 'Tên vaccine là bắt buộc';
            errorMessages.push('• Tên vaccine là bắt buộc');
        }

        if (!formData.species_id) {
            newErrors.species_id = 'Loài thú cưng là bắt buộc';
            errorMessages.push('• Loài thú cưng là bắt buộc');
        }

        if (!formData.interval_months || formData.interval_months <= 0) {
            newErrors.interval_months = 'Lịch tiêm kế tiếp phải lớn hơn 0 tháng';
            errorMessages.push('• Lịch tiêm kế tiếp phải lớn hơn 0 tháng');
        }

        if (!formData.required_doses || formData.required_doses <= 0) {
            newErrors.required_doses = 'Số mũi tiêm phải lớn hơn 0';
            errorMessages.push('• Số mũi tiêm phải lớn hơn 0');
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
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(formData);
    };

    const handleClose = () => {
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
        onClose();
    };

    // Helper to update a single field
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                    background: `linear-gradient(135deg, ${alpha(COLORS.SUCCESS[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.SUCCESS[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.SUCCESS[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Vaccines />
                    {editMode ? '✏️ Chỉnh sửa Vaccine Type' : '➕ Thêm Vaccine Type mới'}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    <TextField
                        label="Tên vaccine"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        fullWidth
                        required
                        placeholder="VD: Vaccine 5 trong 1 (DHPPI)"
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Mô tả chi tiết về vaccine..."
                    />
                    <FormControl fullWidth required error={Boolean(errors.species_id)}>
                        <InputLabel>Loài thú cưng</InputLabel>
                        <Select
                            value={formData.species_id}
                            onChange={(e) => updateField('species_id', e.target.value)}
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
                        label="Lịch tiêm kế tiếp (tháng)"
                        value={formData.interval_months}
                        onChange={(e) => updateField('interval_months', e.target.value)}
                        fullWidth
                        required
                        type="number"
                        inputProps={{ min: 1 }}
                        error={Boolean(errors.interval_months)}
                    />
                    <TextField
                        label="Số mũi tiêm tối đa"
                        value={formData.required_doses}
                        onChange={(e) => updateField('required_doses', e.target.value)}
                        fullWidth
                        required
                        type="number"
                        inputProps={{ min: 1 }}
                        error={Boolean(errors.required_doses)}
                        helperText={errors.required_doses || 'Số mũi tiêm tối đa cho mỗi thú cưng (VD: 3)'}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.is_required}
                                onChange={(e) => updateField('is_required', e.target.checked)}
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

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
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

            {/* Alert Modal for Validation Errors */}
            <AlertModal
                isOpen={alertModal.open}
                onClose={() => setAlertModal({ ...alertModal, open: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                okText="Đã hiểu"
            />
        </Dialog>
    );
};

export default VaccineTypeModal;