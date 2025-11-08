import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Stack, IconButton, alpha } from '@mui/material';
import { Close, Pets } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AddSpeciesModal = ({ open, onClose, onSave, editingSpecies = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (editingSpecies) {
            setFormData({
                name: editingSpecies.name || '',
                description: editingSpecies.description || ''
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
        setErrors({});
        setTouched({});
    }, [editingSpecies, open]);

    // Validation
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || !value.trim()) return 'Tên loài là bắt buộc';
                if (value.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự';
                break;
            default:
                break;
        }
        return '';
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = () => {
        // Validate essential fields
        const newErrors = {
            name: validateField('name', formData.name)
        };

        setErrors(newErrors);
        setTouched({
            name: true
        });

        // Check if there are any errors
        const hasError = Object.values(newErrors).some(error => error !== '' && error !== undefined);

        if (!hasError) {
            const submitData = {
                name: formData.name.trim(),
                description: formData.description.trim()
            };

            onSave(submitData);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.ERROR[500],
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Pets sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {editingSpecies ? 'Sửa loài' : 'Thêm loài mới'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            {editingSpecies ? 'Cập nhật thông tin loài thú cưng' : 'Thêm loài thú cưng mới'}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 4, pb: 2 }}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        label="Tên loài *"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        placeholder="VD: Mèo, Chó"
                    />

                    <TextField
                        fullWidth
                        size="medium"
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        multiline
                        rows={4}
                        placeholder="Mô tả chi tiết về loài thú cưng..."
                    />
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.ERROR[500], 0.02) }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: COLORS.ERROR[500],
                        color: 'white',
                        fontWeight: 700,
                        '&:hover': {
                            bgcolor: COLORS.ERROR[600]
                        }
                    }}
                >
                    {editingSpecies ? 'Cập nhật' : 'Thêm loài'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddSpeciesModal;