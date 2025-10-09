import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Avatar, alpha, CircularProgress, Chip, Stack } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { Pets } from '@mui/icons-material';

const AddPetModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, isLoading = false, breeds = [], species = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        species_id: '',
        breed_id: '',
        age: '',
        weight: '',
        gender: '',
        color: '',
        image_url: '',
        preferences: '',
        special_notes: '',
        arrival_date: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Get available breeds for selected species
    const availableBreeds = useMemo(() => {
        if (!formData.species_id) return [];
        return breeds.filter(b => b.species_id === formData.species_id);
    }, [breeds, formData.species_id]);

    // Get species name
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? sp.name : '';
    };

    // Initialize form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    name: initialData.name || '',
                    species_id: initialData.species_id || '',
                    breed_id: initialData.breed_id || '',
                    age: initialData.age || '',
                    weight: initialData.weight || '',
                    gender: initialData.gender || '',
                    color: initialData.color || '',
                    image_url: initialData.image_url || '',
                    preferences: initialData.preferences || '',
                    special_notes: initialData.special_notes || '',
                    arrival_date: initialData.arrival_date ? initialData.arrival_date.split('T')[0] : ''
                });
            } else {
                setFormData({
                    name: '',
                    species_id: '',
                    breed_id: '',
                    age: '',
                    weight: '',
                    gender: '',
                    color: '',
                    image_url: '',
                    preferences: '',
                    special_notes: '',
                    arrival_date: ''
                });
            }
            setErrors({});
            setTouched({});
        }
    }, [isOpen, editMode, initialData]);

    // Clear breed_id when species changes
    useEffect(() => {
        if (touched.species_id && formData.breed_id) {
            const currentBreedBelongsToSpecies = availableBreeds.some(b => b.id === formData.breed_id);
            if (!currentBreedBelongsToSpecies) {
                setFormData(prev => ({ ...prev, breed_id: '' }));
            }
        }
    }, [formData.species_id, formData.breed_id, availableBreeds, touched.species_id]);

    // Validation functions
    const validateName = (name) => {
        if (!name || !name.trim()) {
            return 'Tên thú cưng là bắt buộc';
        }
        if (name.trim().length < 2) {
            return 'Tên thú cưng phải có ít nhất 2 ký tự';
        }
        if (name.trim().length > 50) {
            return 'Tên thú cưng không được vượt quá 50 ký tự';
        }
        // Check for valid characters (letters, numbers, spaces, Vietnamese characters)
        const nameRegex = /^[a-zA-ZÀ-ỹ0-9\s]+$/;
        if (!nameRegex.test(name.trim())) {
            return 'Tên thú cưng chỉ được chứa chữ cái, số và khoảng trắng';
        }
        return '';
    };

    const validateAge = (age) => {
        if (!age || age === '') {
            return 'Tuổi là bắt buộc';
        }
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum <= 0) {
            return 'Tuổi phải lớn hơn 0';
        }
        if (ageNum > 30) {
            return 'Tuổi không hợp lệ (tối đa 30 tuổi)';
        }
        return '';
    };

    const validateWeight = (weight) => {
        if (!weight || weight === '') {
            return 'Cân nặng là bắt buộc';
        }
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return 'Cân nặng phải lớn hơn 0';
        }
        if (weightNum > 100) {
            return 'Cân nặng không hợp lệ (tối đa 100kg)';
        }
        // Check decimal places (max 2)
        const decimalPart = weight.toString().split('.')[1];
        if (decimalPart && decimalPart.length > 2) {
            return 'Cân nặng chỉ được phép tối đa 2 chữ số thập phân';
        }
        return '';
    };

    const validateColor = (color) => {
        if (!color || !color.trim()) {
            return ''; // Optional field
        }
        if (color.trim().length > 50) {
            return 'Màu sắc không được vượt quá 50 ký tự';
        }
        const colorRegex = /^[a-zA-ZÀ-ỹ0-9\s\-,]+$/;
        if (!colorRegex.test(color.trim())) {
            return 'Màu sắc chỉ được chứa chữ cái, số, khoảng trắng, gạch ngang và dấu phẩy';
        }
        return '';
    };

    const validatePreferences = (preferences) => {
        if (!preferences || !preferences.trim()) {
            return ''; // Optional field
        }
        if (preferences.trim().length > 500) {
            return 'Sở thích & Đặc điểm không được vượt quá 500 ký tự';
        }
        return '';
    };

    const validateSpecialNotes = (notes) => {
        if (!notes || !notes.trim()) {
            return ''; // Optional field
        }
        if (notes.trim().length > 500) {
            return 'Ghi chú đặc biệt không được vượt quá 500 ký tự';
        }
        return '';
    };

    const validateImageUrl = (url) => {
        if (!url || !url.trim()) {
            return ''; // Optional field
        }
        // Basic URL validation
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(url.trim())) {
            return 'URL hình ảnh không hợp lệ (phải bắt đầu bằng http:// hoặc https://)';
        }
        return '';
    };

    const validateArrivalDate = (date) => {
        if (!date) {
            return 'Ngày đến quán là bắt buộc';
        }
        const arrivalDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (arrivalDate > today) {
            return 'Ngày đến quán không thể là ngày trong tương lai';
        }

        // Check if date is too far in the past (e.g., more than 20 years ago)
        const twentyYearsAgo = new Date();
        twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
        if (arrivalDate < twentyYearsAgo) {
            return 'Ngày đến quán không hợp lệ';
        }

        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        newErrors.name = validateName(formData.name);
        if (!formData.species_id) newErrors.species_id = 'Vui lòng chọn loài';
        if (!formData.breed_id) newErrors.breed_id = 'Vui lòng chọn giống';
        newErrors.age = validateAge(formData.age);
        newErrors.weight = validateWeight(formData.weight);
        if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính';

        // Optional fields with validation
        newErrors.color = validateColor(formData.color);
        newErrors.image_url = validateImageUrl(formData.image_url);
        newErrors.arrival_date = validateArrivalDate(formData.arrival_date);
        newErrors.preferences = validatePreferences(formData.preferences);
        newErrors.special_notes = validateSpecialNotes(formData.special_notes);

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
                    error = validateName(value);
                    break;
                case 'age':
                    error = validateAge(value);
                    break;
                case 'weight':
                    error = validateWeight(value);
                    break;
                case 'color':
                    error = validateColor(value);
                    break;
                case 'image_url':
                    error = validateImageUrl(value);
                    break;
                case 'arrival_date':
                    error = validateArrivalDate(value);
                    break;
                case 'preferences':
                    error = validatePreferences(value);
                    break;
                case 'special_notes':
                    error = validateSpecialNotes(value);
                    break;
                case 'species_id':
                    error = value ? '' : 'Vui lòng chọn loài';
                    break;
                case 'breed_id':
                    error = value ? '' : 'Vui lòng chọn giống';
                    break;
                case 'gender':
                    error = value ? '' : 'Vui lòng chọn giới tính';
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
                error = validateName(formData[field]);
                break;
            case 'age':
                error = validateAge(formData[field]);
                break;
            case 'weight':
                error = validateWeight(formData[field]);
                break;
            case 'color':
                error = validateColor(formData[field]);
                break;
            case 'image_url':
                error = validateImageUrl(formData[field]);
                break;
            case 'arrival_date':
                error = validateArrivalDate(formData[field]);
                break;
            case 'preferences':
                error = validatePreferences(formData[field]);
                break;
            case 'special_notes':
                error = validateSpecialNotes(formData[field]);
                break;
            case 'species_id':
                error = formData[field] ? '' : 'Vui lòng chọn loài';
                break;
            case 'breed_id':
                error = formData[field] ? '' : 'Vui lòng chọn giống';
                break;
            case 'gender':
                error = formData[field] ? '' : 'Vui lòng chọn giới tính';
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = () => {
        // Mark all fields as touched
        const allFields = ['name', 'species_id', 'breed_id', 'age', 'weight', 'gender', 'color', 'image_url', 'arrival_date', 'preferences', 'special_notes'];
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

    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '';
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.ERROR[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.ERROR[800], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pets />
                    {editMode ? '✏️ Sửa thông tin thú cưng' : '➕ Thêm thú cưng mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3 }}>
                {/* Info message */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        background: alpha(COLORS.INFO[50], 0.5),
                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                    }}
                >
                    <Typography variant="body2" sx={{ color: COLORS.INFO[800], fontWeight: 600 }}>
                        ℹ️ Vui lòng điền đầy đủ thông tin thú cưng. Các trường có dấu (*) là bắt buộc
                    </Typography>
                </Box>
                <Stack spacing={2}>
                    {/* Row 1 */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tên thú cưng"
                            sx={{ flex: 1 }}
                            required
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            error={touched.name && Boolean(errors.name)}
                            disabled={isLoading}
                        />
                        <FormControl sx={{ flex: 1 }} required error={touched.species_id && Boolean(errors.species_id)} disabled={isLoading}>
                            <InputLabel>Loài</InputLabel>
                            <Select
                                label="Loài"
                                value={formData.species_id}
                                onChange={(e) => handleChange('species_id', e.target.value)}
                                onBlur={() => handleBlur('species_id')}
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
                                                    background: alpha(COLORS.ERROR[100], 0.5)
                                                }}
                                            />
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Row 2 */}
                    <Stack direction="row" spacing={2}>
                        <FormControl sx={{ flex: 1 }} required disabled={!formData.species_id || isLoading} error={touched.breed_id && Boolean(errors.breed_id)}>
                            <InputLabel>Giống</InputLabel>
                            <Select
                                label="Giống"
                                value={formData.breed_id}
                                onChange={(e) => handleChange('breed_id', e.target.value)}
                                onBlur={() => handleBlur('breed_id')}
                            >
                                {availableBreeds.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Tuổi"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            onBlur={() => handleBlur('age')}
                            error={touched.age && Boolean(errors.age)}
                            inputProps={{ min: 0, max: 30, step: 1 }}
                            disabled={isLoading}
                        />
                    </Stack>

                    {/* Row 3 */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Cân nặng (kg)"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleChange('weight', e.target.value)}
                            onBlur={() => handleBlur('weight')}
                            error={touched.weight && Boolean(errors.weight)}
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            disabled={isLoading}
                        />
                        <FormControl sx={{ flex: 1 }} required disabled={isLoading} error={touched.gender && Boolean(errors.gender)}>
                            <InputLabel>Giới tính</InputLabel>
                            <Select
                                label="Giới tính"
                                value={formData.gender}
                                onChange={(e) => handleChange('gender', e.target.value)}
                                onBlur={() => handleBlur('gender')}
                            >
                                <MenuItem value="male">♂ Đực</MenuItem>
                                <MenuItem value="female">♀ Cái</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Row 4 */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Màu sắc"
                            sx={{ flex: 1 }}
                            value={formData.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                            onBlur={() => handleBlur('color')}
                            error={touched.color && Boolean(errors.color)}
                            disabled={isLoading}
                            placeholder="Nhập màu sắc..."
                        />
                        <TextField
                            label="Ngày đến quán"
                            sx={{ flex: 1 }}
                            required
                            type="date"
                            value={formData.arrival_date}
                            onChange={(e) => handleChange('arrival_date', e.target.value)}
                            onBlur={() => handleBlur('arrival_date')}
                            error={touched.arrival_date && Boolean(errors.arrival_date)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                placeholder: 'dd/mm/yyyy',
                                max: new Date().toISOString().split('T')[0]
                            }}
                            disabled={isLoading}
                        />
                    </Stack>

                    {/* Row 5: Image URL */}
                    <Box>
                        <TextField
                            label="URL hình ảnh"
                            fullWidth
                            value={formData.image_url}
                            onChange={(e) => handleChange('image_url', e.target.value)}
                            onBlur={() => handleBlur('image_url')}
                            error={touched.image_url && Boolean(errors.image_url)}
                            placeholder="https://example.com/pet.jpg"
                            disabled={isLoading}
                        />
                        {/* Image Preview - directly below URL field */}
                        {formData.image_url && !errors.image_url && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Avatar
                                    src={formData.image_url}
                                    alt={formData.name || 'Pet'}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        border: `3px solid ${COLORS.ERROR[300]}`,
                                        boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.2)}`
                                    }}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Row 6: Preferences */}
                    <TextField
                        label="Sở thích & Đặc điểm"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.preferences}
                        onChange={(e) => handleChange('preferences', e.target.value)}
                        onBlur={() => handleBlur('preferences')}
                        error={touched.preferences && Boolean(errors.preferences)}
                        placeholder="VD: Thích chơi bóng tennis, thức ăn yêu thích là Royal Canin, dị ứng với gà..."
                        disabled={isLoading}
                    />

                    {/* Row 7: Special Notes */}
                    <TextField
                        label="Ghi chú đặc biệt"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.special_notes}
                        onChange={(e) => handleChange('special_notes', e.target.value)}
                        onBlur={() => handleBlur('special_notes')}
                        error={touched.special_notes && Boolean(errors.special_notes)}
                        placeholder="VD: Thông tin y tế, hành vi đặc biệt, cần chăm sóc đặc biệt..."
                        disabled={isLoading}
                    />

                    {/* Preview Info */}
                    {formData.name && formData.species_id && formData.breed_id && formData.age && formData.weight && (
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
                                                    Tên thú cưng:
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
                                                    {getSpeciesName(formData.species_id)}
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
                                                    {getBreedName(formData.breed_id)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Tuổi:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.age} tuổi
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                    Cân nặng:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                    {formData.weight} kg
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        {formData.gender && (
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1}>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                        Giới tính:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                        {formData.gender === 'male' ? 'Đực' : 'Cái'}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                    {(formData.color || formData.arrival_date) && (
                                        <Stack direction="row" spacing={2}>
                                            {formData.color && (
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" spacing={1}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                            Màu sắc:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                            {formData.color}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            )}
                                            {formData.arrival_date && (
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" spacing={1}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                            Ngày đến quán:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                            {new Date(formData.arrival_date).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    )}
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

export default AddPetModal;

