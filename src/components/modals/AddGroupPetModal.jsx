import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    FormControl, InputLabel, Select, MenuItem, Box, Typography,
    alpha, CircularProgress, Chip, Stack
} from '@mui/material';
import { COLORS } from '../../constants/colors';
import { Groups } from '@mui/icons-material';

const AddGroupPetModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, isLoading = false, species = [], breeds = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        pet_species_id: '',
        pet_breed_id: '',
        description: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Get available breeds for selected species
    const availableBreeds = useMemo(() => {
        if (!formData.pet_species_id) return [];
        return breeds.filter(b => b.species_id === formData.pet_species_id);
    }, [breeds, formData.pet_species_id]);

    // Get species name
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? sp.name : '';
    };

    // Get breed name
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '';
    };

    // Initialize form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    name: String(initialData.name || ''),
                    pet_species_id: String(initialData.pet_species_id || ''),
                    pet_breed_id: String(initialData.pet_breed_id || ''),
                    description: String(initialData.description || '')
                });
            } else {
                setFormData({
                    name: '',
                    pet_species_id: '',
                    pet_breed_id: '',
                    description: ''
                });
            }
            setErrors({});
            setTouched({});
        }
    }, [isOpen, editMode, initialData]);

    // Clear breed_id when species changes
    useEffect(() => {
        if (touched.pet_species_id && formData.pet_breed_id) {
            const currentBreedBelongsToSpecies = availableBreeds.some(b => b.id === formData.pet_breed_id);
            if (!currentBreedBelongsToSpecies) {
                setFormData(prev => ({ ...prev, pet_breed_id: '' }));
            }
        }
    }, [formData.pet_species_id, formData.pet_breed_id, availableBreeds, touched.pet_species_id]);

    // Validation functions
    const validateName = (name) => {
        if (!name || typeof name !== 'string' || !name.trim()) {
            return 'Tên nhóm là bắt buộc';
        }
        if (name.trim().length < 2) {
            return 'Tên nhóm phải có ít nhất 2 ký tự';
        }
        if (name.trim().length > 100) {
            return 'Tên nhóm không được vượt quá 100 ký tự';
        }
        // Check for valid characters (letters, numbers, spaces, Vietnamese characters, special chars)
        const nameRegex = /^[a-zA-ZÀ-ỹ0-9\s\-/]+$/;
        if (!nameRegex.test(name.trim())) {
            return 'Tên nhóm chỉ được chứa chữ cái, số, khoảng trắng, gạch ngang';
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
        if (!formData.pet_species_id) newErrors.pet_species_id = 'Vui lòng chọn loài';

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
                case 'description':
                    error = validateDescription(value || '');
                    break;
                case 'pet_species_id':
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
            case 'description':
                error = validateDescription(formData[field] || '');
                break;
            case 'pet_species_id':
                error = formData[field] ? '' : 'Vui lòng chọn loài';
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = () => {
        // Mark all fields as touched
        const allFields = ['name', 'pet_species_id', 'description'];
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

    const getCharacterCount = (text) => {
        return text ? text.length : 0;
    };


    return (
        <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.WARNING[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.WARNING[800], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups />
                    {editMode ? '✏️ Sửa thông tin nhóm' : '➕ Thêm nhóm mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2}>
                    {/* Name + Species */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tên nhóm"
                            sx={{ flex: 1 }}
                            required
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            error={touched.name && Boolean(errors.name)}
                            disabled={isLoading}
                            placeholder="VD: Khu vực chó cỡ lớn, Phòng mèo VIP, Khu vực chơi chung"
                        />
                        <FormControl sx={{ flex: 1 }} required error={touched.pet_species_id && Boolean(errors.pet_species_id)} disabled={isLoading}>
                            <InputLabel>Loài</InputLabel>
                            <Select
                                label="Loài"
                                value={formData.pet_species_id}
                                onChange={(e) => handleChange('pet_species_id', e.target.value)}
                                onBlur={() => handleBlur('pet_species_id')}
                            >
                                {species.map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>{s.name}</Typography>
                                            <Chip
                                                label={s.name === 'Chó' ? '🐕' : '🐱'}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.75rem',
                                                    background: alpha(COLORS.WARNING[100], 0.5)
                                                }}
                                            />
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Breed + Max Capacity */}
                    <Stack direction="row" spacing={2}>
                        <FormControl
                            sx={{ flex: 1 }}
                            disabled={!formData.pet_species_id || isLoading}
                            error={touched.pet_breed_id && Boolean(errors.pet_breed_id)}
                        >
                            <InputLabel>Giống (Tùy chọn)</InputLabel>
                            <Select
                                label="Giống (Tùy chọn)"
                                value={formData.pet_breed_id}
                                onChange={(e) => handleChange('pet_breed_id', e.target.value)}
                                onBlur={() => handleBlur('pet_breed_id')}
                            >
                                <MenuItem value="">
                                    <em>Tất cả giống</em>
                                </MenuItem>
                                {availableBreeds.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
                        placeholder="VD: Khu vực dành cho chó cỡ lớn trên 20kg, có sân chơi riêng biệt..."
                        disabled={isLoading}
                    />

                    {/* Preview Info */}
                    {formData.name && formData.pet_species_id && (
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
                                                    Tên nhóm:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.name}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Loài:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {getSpeciesName(formData.pet_species_id)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Giống:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.pet_breed_id ? getBreedName(formData.pet_breed_id) : 'Tất cả giống'}
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
                        backgroundColor: COLORS.WARNING[500],
                        fontWeight: 700,
                        '&:hover': { backgroundColor: COLORS.WARNING[600] },
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

export default AddGroupPetModal;

