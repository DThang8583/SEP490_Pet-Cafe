import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography, Avatar, alpha, CircularProgress, Stack, IconButton, FormHelperText } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { Pets, CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { uploadFile } from '../../api/fileApi';
import { getHealthStatusOptions } from '../../api/petsApi';

const AddPetModal = ({ isOpen, onClose, onSubmit, editMode = false, initialData = null, isLoading = false, breeds = [], species = [], groups = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        species_id: '',
        breed_id: '',
        group_id: '',
        age: '',
        weight: '',
        gender: '',
        color: '',
        image: '',
        preferences: '',
        special_notes: '',
        arrival_date: '',
        health_status: 'HEALTHY'
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [healthStatusOptions, setHealthStatusOptions] = useState([]);

    // Get available breeds for selected species
    const availableBreeds = useMemo(() => {
        if (!formData.species_id) return [];
        return breeds.filter(b => b.species_id === formData.species_id);
    }, [breeds, formData.species_id]);

    // Get available groups for selected species and breed
    const availableGroups = useMemo(() => {
        if (!formData.species_id) return [];
        // Manager can assign pet to any group with matching species, regardless of breed
        return groups.filter(g => g.pet_species_id === formData.species_id);
    }, [groups, formData.species_id]);

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

    // Get health status label in Vietnamese
    const getHealthStatusLabel = (status) => {
        const labels = {
            'HEALTHY': 'Khỏe mạnh',
            'SICK': 'Ốm',
            'RECOVERING': 'Đang hồi phục',
            'UNDER_OBSERVATION': 'Đang theo dõi',
            'QUARANTINE': 'Cách ly'
        };
        return labels[status] || status;
    };

    // Load health status options from API
    useEffect(() => {
        const loadHealthStatusOptions = async () => {
            try {
                const options = await getHealthStatusOptions();
                setHealthStatusOptions(options);
            } catch (error) {
                console.error('Failed to load health status options:', error);
                // Fallback to default values
                setHealthStatusOptions(['HEALTHY', 'SICK', 'RECOVERING', 'UNDER_OBSERVATION', 'QUARANTINE']);
            }
        };

        if (isOpen) {
            loadHealthStatusOptions();
        }
    }, [isOpen]);

    // Initialize form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    name: String(initialData.name || ''),
                    species_id: String(initialData.species_id || ''),
                    breed_id: String(initialData.breed_id || ''),
                    group_id: String(initialData.group_id || ''),
                    age: String(initialData.age || ''),
                    weight: String(initialData.weight || ''),
                    gender: String(initialData.gender || ''),
                    color: String(initialData.color || ''),
                    image: String(initialData.image || initialData.image_url || ''),
                    preferences: String(initialData.preferences || ''),
                    special_notes: String(initialData.special_notes || ''),
                    arrival_date: initialData.arrival_date ? initialData.arrival_date.split('T')[0] : '',
                    health_status: String(initialData.health_status || 'HEALTHY')
                });
                setImagePreview(initialData.image || initialData.image_url || null);
                setImageFile(null);
            } else {
                setFormData({
                    name: '',
                    species_id: '',
                    breed_id: '',
                    group_id: '',
                    age: '',
                    weight: '',
                    gender: '',
                    color: '',
                    image: '',
                    preferences: '',
                    special_notes: '',
                    arrival_date: '',
                    health_status: 'HEALTHY'
                });
                setImagePreview(null);
                setImageFile(null);
            }
            setErrors({});
            setTouched({});
        }
    }, [isOpen, editMode, initialData]);

    // Clear breed_id and group_id when species changes
    useEffect(() => {
        if (touched.species_id && formData.breed_id) {
            const currentBreedBelongsToSpecies = availableBreeds.some(b => b.id === formData.breed_id);
            if (!currentBreedBelongsToSpecies) {
                setFormData(prev => ({ ...prev, breed_id: '', group_id: '' }));
            }
        }
    }, [formData.species_id, formData.breed_id, availableBreeds, touched.species_id]);

    // Clear group_id when it's no longer valid (e.g., species changed)
    useEffect(() => {
        if ((touched.breed_id || touched.species_id) && formData.group_id) {
            const currentGroupStillValid = availableGroups.some(g => g.id === formData.group_id);
            if (!currentGroupStillValid) {
                setFormData(prev => ({ ...prev, group_id: '' }));
            }
        }
    }, [formData.breed_id, formData.group_id, availableGroups, touched.breed_id, touched.species_id]);

    // Validation functions
    const validateName = (name) => {
        if (!name || typeof name !== 'string' || !name.trim()) {
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
        if (!color || typeof color !== 'string' || !color.trim()) {
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
        if (!preferences || typeof preferences !== 'string' || !preferences.trim()) {
            return ''; // Optional field
        }
        if (preferences.trim().length > 500) {
            return 'Sở thích & Đặc điểm không được vượt quá 500 ký tự';
        }
        return '';
    };

    const validateSpecialNotes = (notes) => {
        if (!notes || typeof notes !== 'string' || !notes.trim()) {
            return ''; // Optional field
        }
        if (notes.trim().length > 500) {
            return 'Ghi chú đặc biệt không được vượt quá 500 ký tự';
        }
        return '';
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                image: 'Chỉ chấp nhận file PNG, JPG, WEBP'
            }));
            event.target.value = '';
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({
                ...prev,
                image: 'Kích thước file không được vượt quá 5MB'
            }));
            event.target.value = '';
            return;
        }

        // Clear any previous errors
        setErrors(prev => ({
            ...prev,
            image: ''
        }));

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload file to server
        setIsUploadingImage(true);
        setImageFile(file);
        try {
            const imageUrl = await uploadFile(file);
            handleChange('image', imageUrl);
            setErrors(prev => ({
                ...prev,
                image: ''
            }));
        } catch (error) {
            console.error('Failed to upload image:', error);
            setErrors(prev => ({
                ...prev,
                image: error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
            }));
            setImagePreview(null);
            setImageFile(null);
            handleChange('image', '');
        } finally {
            setIsUploadingImage(false);
            event.target.value = '';
        }
    };

    // Handle remove image
    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        handleChange('image', '');
        // Clear error
        setErrors(prev => ({
            ...prev,
            image: ''
        }));
    };

    const validateArrivalDate = (date) => {
        if (!date) {
            return 'Ngày đến quán là bắt buộc';
        }
        const arrivalDate = new Date(date);
        arrivalDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (arrivalDate > today) {
            return 'Ngày đến quán không thể là ngày trong tương lai';
        }

        // Check if date is too far in the past (e.g., more than 20 years ago)
        const twentyYearsAgo = new Date();
        twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
        twentyYearsAgo.setHours(0, 0, 0, 0);
        if (arrivalDate < twentyYearsAgo) {
            return 'Ngày đến quán không hợp lệ';
        }

        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        newErrors.name = validateName(formData.name || '');
        if (!formData.species_id) newErrors.species_id = 'Vui lòng chọn loài';
        if (!formData.breed_id) newErrors.breed_id = 'Vui lòng chọn giống';
        newErrors.age = validateAge(formData.age || '');
        newErrors.weight = validateWeight(formData.weight || '');
        if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính';
        if (!formData.health_status) newErrors.health_status = 'Vui lòng chọn tình trạng sức khỏe';

        // Optional fields with validation
        newErrors.color = validateColor(formData.color || '');
        newErrors.arrival_date = validateArrivalDate(formData.arrival_date || '');
        newErrors.preferences = validatePreferences(formData.preferences || '');
        newErrors.special_notes = validateSpecialNotes(formData.special_notes || '');

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
                case 'age':
                    error = validateAge(value || '');
                    break;
                case 'weight':
                    error = validateWeight(value || '');
                    break;
                case 'color':
                    error = validateColor(value || '');
                    break;
                case 'arrival_date':
                    error = validateArrivalDate(value || '');
                    break;
                case 'preferences':
                    error = validatePreferences(value || '');
                    break;
                case 'special_notes':
                    error = validateSpecialNotes(value || '');
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
                case 'health_status':
                    error = value ? '' : 'Vui lòng chọn tình trạng sức khỏe';
                    break;
                case 'image':
                    // No validation for image field
                    error = '';
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
            case 'age':
                error = validateAge(formData[field] || '');
                break;
            case 'weight':
                error = validateWeight(formData[field] || '');
                break;
            case 'color':
                error = validateColor(formData[field] || '');
                break;
            case 'arrival_date':
                error = validateArrivalDate(formData[field] || '');
                break;
            case 'preferences':
                error = validatePreferences(formData[field] || '');
                break;
            case 'special_notes':
                error = validateSpecialNotes(formData[field] || '');
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
            case 'health_status':
                error = formData[field] ? '' : 'Vui lòng chọn tình trạng sức khỏe';
                break;
            case 'image':
                // No validation for image field
                error = '';
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = () => {
        // Mark all fields as touched (except image and group_id - optional fields)
        const allFields = ['name', 'species_id', 'breed_id', 'age', 'weight', 'gender', 'health_status', 'color', 'arrival_date', 'preferences', 'special_notes'];
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

    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '';
    };

    const getGroupName = (groupId) => {
        const gr = groups.find(g => g.id === groupId);
        return gr ? gr.name : '';
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
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            disabled={isLoading}
                        />
                        <FormControl sx={{ flex: 1 }} required error={touched.species_id && Boolean(errors.species_id)} disabled={isLoading}>
                            <InputLabel>Loài</InputLabel>
                            <Select
                                label="Loài"
                                value={formData.species_id || ''}
                                onChange={(e) => handleChange('species_id', e.target.value)}
                                onBlur={() => handleBlur('species_id')}
                            >
                                {species.filter(s => s.is_active === true).map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {capitalizeName(s.name)}
                                    </MenuItem>
                                ))}
                            </Select>
                            {touched.species_id && errors.species_id && (
                                <FormHelperText>{errors.species_id}</FormHelperText>
                            )}
                        </FormControl>
                    </Stack>

                    {/* Row 2 */}
                    <Stack direction="row" spacing={2}>
                        <FormControl sx={{ flex: 1 }} required disabled={!formData.species_id || isLoading} error={touched.breed_id && Boolean(errors.breed_id)}>
                            <InputLabel>Giống</InputLabel>
                            <Select
                                label="Giống"
                                value={formData.breed_id || ''}
                                onChange={(e) => handleChange('breed_id', e.target.value)}
                                onBlur={() => handleBlur('breed_id')}
                            >
                                {availableBreeds.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                ))}
                            </Select>
                            {touched.breed_id && errors.breed_id && (
                                <FormHelperText>{errors.breed_id}</FormHelperText>
                            )}
                        </FormControl>
                        {/* Only show Group field in Edit mode (API: group_id is only in edit) */}
                        {editMode && (
                            <FormControl sx={{ flex: 1 }} disabled={!formData.species_id || isLoading} error={touched.group_id && Boolean(errors.group_id)}>
                                <InputLabel shrink>Nhóm thú cưng (Tùy chọn)</InputLabel>
                                <Select
                                    label="Nhóm thú cưng (Tùy chọn)"
                                    value={formData.group_id || ''}
                                    onChange={(e) => handleChange('group_id', e.target.value)}
                                    onBlur={() => handleBlur('group_id')}
                                    displayEmpty
                                    notched
                                    renderValue={(selected) => {
                                        if (!selected) {
                                            return <em>Không chọn nhóm</em>;
                                        }
                                        const group = availableGroups.find(g => g.id === selected);
                                        return group ? group.name : '';
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Không chọn nhóm</em>
                                    </MenuItem>
                                    {availableGroups.map(g => (
                                        <MenuItem key={g.id} value={g.id}>
                                            <Typography>{g.name}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Stack>

                    {/* Row 3 */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Tuổi"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.age || ''}
                            onChange={(e) => handleChange('age', e.target.value)}
                            onBlur={() => handleBlur('age')}
                            error={touched.age && Boolean(errors.age)}
                            helperText={touched.age && errors.age}
                            inputProps={{ min: 0, max: 30, step: 1 }}
                            disabled={isLoading}
                        />
                        <TextField
                            label="Cân nặng (kg)"
                            sx={{ flex: 1 }}
                            required
                            type="number"
                            value={formData.weight || ''}
                            onChange={(e) => handleChange('weight', e.target.value)}
                            onBlur={() => handleBlur('weight')}
                            error={touched.weight && Boolean(errors.weight)}
                            helperText={touched.weight && errors.weight}
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            disabled={isLoading}
                        />
                    </Stack>

                    {/* Row 4 */}
                    <Stack direction="row" spacing={2}>
                        <FormControl sx={{ flex: 1 }} required disabled={isLoading} error={touched.gender && Boolean(errors.gender)}>
                            <InputLabel>Giới tính</InputLabel>
                            <Select
                                label="Giới tính"
                                value={formData.gender || ''}
                                onChange={(e) => handleChange('gender', e.target.value)}
                                onBlur={() => handleBlur('gender')}
                            >
                                <MenuItem value="Male">Đực</MenuItem>
                                <MenuItem value="Female">Cái</MenuItem>
                            </Select>
                            {touched.gender && errors.gender && (
                                <FormHelperText>{errors.gender}</FormHelperText>
                            )}
                        </FormControl>
                        <FormControl sx={{ flex: 1 }} required disabled={isLoading} error={touched.health_status && Boolean(errors.health_status)}>
                            <InputLabel>Tình trạng sức khỏe</InputLabel>
                            <Select
                                label="Tình trạng sức khỏe"
                                value={formData.health_status || 'HEALTHY'}
                                onChange={(e) => handleChange('health_status', e.target.value)}
                                onBlur={() => handleBlur('health_status')}
                            >
                                {healthStatusOptions.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {getHealthStatusLabel(status)}
                                    </MenuItem>
                                ))}
                            </Select>
                            {touched.health_status && errors.health_status && (
                                <FormHelperText>{errors.health_status}</FormHelperText>
                            )}
                        </FormControl>
                    </Stack>

                    {/* Row 5 */}
                    <TextField
                        label="Màu sắc"
                        fullWidth
                        value={formData.color || ''}
                        onChange={(e) => handleChange('color', e.target.value)}
                        onBlur={() => handleBlur('color')}
                        error={touched.color && Boolean(errors.color)}
                        helperText={touched.color && errors.color}
                        disabled={isLoading}
                        placeholder="Nhập màu sắc..."
                    />

                    {/* Row 6 */}
                    <TextField
                        label="Ngày đến quán"
                        fullWidth
                        required
                        type="date"
                        value={formData.arrival_date || ''}
                        onChange={(e) => handleChange('arrival_date', e.target.value)}
                        onBlur={() => handleBlur('arrival_date')}
                        error={touched.arrival_date && Boolean(errors.arrival_date)}
                        helperText={touched.arrival_date && errors.arrival_date}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                            placeholder: 'dd/mm/yyyy',
                            max: new Date().toISOString().split('T')[0]
                        }}
                        disabled={isLoading}
                    />

                    {/* Row 7: Image Upload */}
                    <Box>
                        <Typography variant="body2" fontWeight={500} gutterBottom>
                            Hình ảnh (Tùy chọn)
                        </Typography>

                        {/* Preview */}
                        {(imagePreview || formData.image) && (
                            <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={imagePreview || formData.image}
                                    variant="rounded"
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: `3px solid ${COLORS.ERROR[300]}`,
                                        boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.2)}`
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={handleRemoveImage}
                                    disabled={isLoading || isUploadingImage}
                                    sx={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'error.dark'
                                        }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        {/* Upload Area */}
                        <Box
                            component="label"
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 4,
                                border: `2px dashed ${COLORS.INFO[300]}`,
                                borderRadius: 2,
                                bgcolor: alpha(COLORS.INFO[50], 0.3),
                                cursor: isLoading || isUploadingImage ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: COLORS.INFO[500],
                                    bgcolor: alpha(COLORS.INFO[50], 0.5)
                                },
                                opacity: isLoading || isUploadingImage ? 0.6 : 1
                            }}
                        >
                            <input
                                type="file"
                                hidden
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleImageUpload}
                                disabled={isLoading || isUploadingImage}
                            />
                            {isUploadingImage ? (
                                <>
                                    <CircularProgress size={40} sx={{ color: COLORS.INFO[500], mb: 2 }} />
                                    <Typography variant="body2" sx={{ color: COLORS.INFO[700], fontWeight: 600 }}>
                                        Đang tải ảnh lên...
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <CloudUploadIcon sx={{ fontSize: 48, color: COLORS.INFO[500], mb: 2 }} />
                                    <Typography variant="body1" sx={{ color: COLORS.INFO[700], fontWeight: 700, mb: 1 }}>
                                        CLICK ĐỂ TẢI ẢNH LÊN
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        PNG, JPG, WEBP (MAX 5MB)
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {errors.image && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                {errors.image}
                            </Typography>
                        )}
                    </Box>

                    {/* Row 8: Preferences */}
                    <TextField
                        label="Sở thích & Đặc điểm"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.preferences || ''}
                        onChange={(e) => handleChange('preferences', e.target.value)}
                        onBlur={() => handleBlur('preferences')}
                        error={touched.preferences && Boolean(errors.preferences)}
                        helperText={touched.preferences && errors.preferences}
                        placeholder="VD: Thích chơi bóng tennis, thức ăn yêu thích là Royal Canin, dị ứng với gà..."
                        disabled={isLoading}
                    />

                    {/* Row 9: Special Notes */}
                    <TextField
                        label="Ghi chú đặc biệt"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.special_notes || ''}
                        onChange={(e) => handleChange('special_notes', e.target.value)}
                        onBlur={() => handleBlur('special_notes')}
                        error={touched.special_notes && Boolean(errors.special_notes)}
                        helperText={touched.special_notes && errors.special_notes}
                        placeholder="VD: Thông tin y tế, hành vi đặc biệt, cần chăm sóc đặc biệt..."
                        disabled={isLoading}
                    />

                    {/* Preview Info */}
                    {formData.name && formData.species_id && formData.breed_id && formData.age && formData.weight && formData.gender && formData.health_status && (
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
                                                        {formData.gender === 'Male' ? 'Đực' : 'Cái'}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        {formData.health_status && (
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1}>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                        Tình trạng sức khỏe:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                        {getHealthStatusLabel(formData.health_status)}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                    {(formData.group_id || formData.color || formData.arrival_date) && (
                                        <Stack direction="row" spacing={2}>
                                            {formData.group_id && (
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" spacing={1}>
                                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, minWidth: '100px' }}>
                                                            Nhóm:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                                            {getGroupName(formData.group_id)}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            )}
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
                                        </Stack>
                                    )}
                                    {formData.arrival_date && (
                                        <Stack direction="row" spacing={2}>
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