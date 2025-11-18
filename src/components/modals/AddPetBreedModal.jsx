import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography, alpha, CircularProgress, Stack } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { Category } from '@mui/icons-material';

const AddPetBreedModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, isLoading = false, species = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        species_id: '',
        description: '',
        average_weight: '',
        average_lifespan: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Helper function to capitalize first letter
    const capitalizeName = (name) => {
        if (!name) return name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Get species name
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? capitalizeName(sp.name) : '';
    };

    // Initialize form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    name: String(initialData.name || ''),
                    species_id: String(initialData.species_id || ''),
                    description: String(initialData.description || ''),
                    average_weight: String(initialData.average_weight || ''),
                    average_lifespan: String(initialData.average_lifespan || '')
                });
            } else {
                setFormData({
                    name: '',
                    species_id: '',
                    description: '',
                    average_weight: '',
                    average_lifespan: ''
                });
            }
            setErrors({});
            setTouched({});
        }
    }, [isOpen, editMode, initialData]);

    // Validation functions
    const validateName = (name) => {
        if (!name || typeof name !== 'string' || !name.trim()) {
            return 'Tên giống là bắt buộc';
        }
        if (name.trim().length < 2) {
            return 'Tên giống phải có ít nhất 2 ký tự';
        }
        if (name.trim().length > 100) {
            return 'Tên giống không được vượt quá 100 ký tự';
        }
        // Check for valid characters (letters, spaces, hyphens, Vietnamese characters)
        const nameRegex = /^[a-zA-ZÀ-ỹ\s\-']+$/;
        if (!nameRegex.test(name.trim())) {
            return 'Tên giống chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang';
        }
        return '';
    };

    const validateAverageWeight = (weight) => {
        if (!weight || weight === '') {
            return 'Cân nặng trung bình là bắt buộc';
        }
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return 'Cân nặng trung bình phải lớn hơn 0';
        }
        if (weightNum > 100) {
            return 'Cân nặng trung bình không hợp lệ (tối đa 100kg)';
        }
        if (weightNum < 0.1) {
            return 'Cân nặng trung bình phải ít nhất 0.1kg';
        }
        // Check decimal places (max 2)
        const decimalPart = weight.toString().split('.')[1];
        if (decimalPart && decimalPart.length > 2) {
            return 'Cân nặng chỉ được phép tối đa 2 chữ số thập phân';
        }
        return '';
    };

    const validateAverageLifespan = (lifespan) => {
        if (!lifespan || lifespan === '') {
            return 'Tuổi thọ trung bình là bắt buộc';
        }
        const lifespanNum = parseInt(lifespan);
        if (isNaN(lifespanNum) || lifespanNum <= 0) {
            return 'Tuổi thọ trung bình phải lớn hơn 0';
        }
        if (lifespanNum > 30) {
            return 'Tuổi thọ trung bình không hợp lệ (tối đa 30 năm)';
        }
        if (lifespanNum < 1) {
            return 'Tuổi thọ trung bình phải ít nhất 1 năm';
        }
        return '';
    };

    const validateDescription = (description) => {
        if (!description || typeof description !== 'string' || !description.trim()) {
            return ''; // Optional field
        }
        if (description.trim().length > 500) {
            return 'Mô tả không được vượt quá 500 ký tự';
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        newErrors.name = validateName(formData.name || '');
        if (!formData.species_id) newErrors.species_id = 'Vui lòng chọn loài';
        newErrors.average_weight = validateAverageWeight(formData.average_weight || '');
        newErrors.average_lifespan = validateAverageLifespan(formData.average_lifespan || '');

        // Optional fields with validation
        newErrors.description = validateDescription(formData.description || '');

        // Remove empty errors
        Object.keys(newErrors).forEach(key => {
            if (!newErrors[key]) delete newErrors[key];
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Mark field as touched
        if (!touched[field]) {
            setTouched(prev => ({ ...prev, [field]: true }));
        }

        // Validate on change if already touched
        if (touched[field]) {
            let error = '';
            switch (field) {
                case 'name':
                    error = validateName(value || '');
                    break;
                case 'average_weight':
                    error = validateAverageWeight(value || '');
                    break;
                case 'average_lifespan':
                    error = validateAverageLifespan(value || '');
                    break;
                case 'description':
                    error = validateDescription(value || '');
                    break;
                case 'species_id':
                    error = value ? '' : 'Vui lòng chọn loài';
                    break;
                default:
                    break;
            }
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate on blur
        let error = '';
        switch (field) {
            case 'name':
                error = validateName(formData[field] || '');
                break;
            case 'average_weight':
                error = validateAverageWeight(formData[field] || '');
                break;
            case 'average_lifespan':
                error = validateAverageLifespan(formData[field] || '');
                break;
            case 'description':
                error = validateDescription(formData[field] || '');
                break;
            case 'species_id':
                error = formData[field] ? '' : 'Vui lòng chọn loài';
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = () => {
        // Mark all fields as touched
        const allFields = ['name', 'species_id', 'average_weight', 'average_lifespan', 'description'];
        const newTouched = {};
        allFields.forEach(field => {
            newTouched[field] = true;
        });
        setTouched(newTouched);

        // Validate form
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
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
                    background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.ERROR[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.ERROR[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category />
                    {editMode ? '✏️ Sửa thông tin giống' : '➕ Thêm giống mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={2}>
                    {/* Name + Species */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tên giống"
                            sx={{ flex: 1 }}
                            required
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            error={touched.name && Boolean(errors.name)}
                            disabled={isLoading}
                            placeholder="VD: Golden Retriever, British Shorthair, Persian"
                        />
                        <FormControl sx={{ flex: 1 }} required error={touched.species_id && Boolean(errors.species_id)} disabled={isLoading}>
                            <InputLabel>Loài</InputLabel>
                            <Select
                                label="Loài"
                                value={formData.species_id}
                                onChange={(e) => handleChange('species_id', e.target.value)}
                                onBlur={() => handleBlur('species_id')}
                            >
                                {species.filter(s => s.is_active === true).map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {capitalizeName(s.name)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Average Weight + Average Lifespan */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Cân nặng trung bình (kg)"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.average_weight}
                            onChange={(e) => handleChange('average_weight', e.target.value)}
                            onBlur={() => handleBlur('average_weight')}
                            error={touched.average_weight && Boolean(errors.average_weight)}
                            inputProps={{ min: 0.1, max: 100, step: 0.1 }}
                            disabled={isLoading}
                            placeholder="0.1 - 100"
                        />
                        <TextField
                            label="Tuổi thọ trung bình (năm)"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.average_lifespan}
                            onChange={(e) => handleChange('average_lifespan', e.target.value)}
                            onBlur={() => handleBlur('average_lifespan')}
                            error={touched.average_lifespan && Boolean(errors.average_lifespan)}
                            inputProps={{ min: 1, max: 30, step: 1 }}
                            disabled={isLoading}
                            placeholder="1 - 30"
                        />
                    </Stack>

                    {/* Description */}
                    <TextField
                        label="Mô tả"
                        fullWidth
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        onBlur={() => handleBlur('description')}
                        error={touched.description && Boolean(errors.description)}
                        placeholder="VD: Giống chó thân thiện, thông minh, dễ huấn luyện, lông vàng dài..."
                        disabled={isLoading}
                    />

                    {/* Preview Info */}
                    {formData.name && formData.species_id && formData.average_weight && formData.average_lifespan && (
                        <Box>
                            <Box
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.SUCCESS[50], 0.3),
                                    border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700], mb: 2 }}>
                                    📋 Xem trước thông tin
                                </Typography>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Giống:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.name}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '120px' }}>
                                                    Loài:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {getSpeciesName(formData.species_id)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Cân nặng TB:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.average_weight} kg
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '120px' }}>
                                                    Tuổi thọ TB:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.average_lifespan} năm
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={handleClose} disabled={isLoading} sx={{ fontWeight: 600 }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    sx={{
                        backgroundColor: COLORS.ERROR[500],
                        fontWeight: 700,
                        '&:hover': { backgroundColor: COLORS.ERROR[600] },
                        minWidth: 120
                    }}
                >
                    {isLoading ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1, color: COLORS.COMMON.WHITE }} />
                            Đang lưu...
                        </>
                    ) : (
                        editMode ? 'Cập nhật' : 'Thêm mới'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPetBreedModal;