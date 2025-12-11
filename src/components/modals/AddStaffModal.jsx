import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Avatar, Stack, InputAdornment, Alert, alpha, Chip, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { Close, Person, Email, Phone, Home, PhotoCamera, Visibility, VisibilityOff, WorkOutline } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import * as areasApi from '../../api/areasApi';
import { uploadFile } from '../../api/fileApi';

const AddStaffModal = ({
    isOpen = false,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    isLoading = false,
    apiErrors = null
}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        salary: '',
        sub_role: '',
        skills: [],
        area_id: '',
        avatar_url: '',
        password: '',
        is_active: true // Default to active when creating new employee
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [areas, setAreas] = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(false);

    // Fixed list of skills
    const skillOptions = [
        'Thu ngân',
        'Pha chế',
        'Phục vụ',
        'Chăm sóc thú cưng',
        'Vệ sinh khu vực',
        'Huấn luyện thú cưng',
        'Theo dõi sức khỏe thú cưng'
    ];

    // Load areas when modal opens
    useEffect(() => {
        if (isOpen) {
            const loadAreas = async () => {
                try {
                    setLoadingAreas(true);
                    const response = await areasApi.getAllAreas({ page_index: 0, page_size: 1000, is_active: true });
                    setAreas(response.data || []);
                } catch (error) {
                    console.error('Error loading areas:', error);
                    setAreas([]);
                } finally {
                    setLoadingAreas(false);
                }
            };
            loadAreas();
        }
    }, [isOpen]);

    // Load initial data when editing
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                // Use is_active from root level (as per API), fallback to account.is_active if not available
                const isActive = initialData.is_active !== undefined ? initialData.is_active : initialData.account?.is_active;
                setFormData({
                    full_name: initialData.full_name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    salary: initialData.salary || '',
                    sub_role: initialData.sub_role || '',
                    skills: initialData.skills || [],
                    area_id: initialData.area_id || '',
                    avatar_url: initialData.avatar_url || '',
                    password: '',
                    is_active: isActive !== undefined ? Boolean(isActive) : true
                });
                setPreviewAvatar(initialData.avatar_url || '');
            } else {
                // Reset form khi thêm mới
                setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    address: '',
                    salary: '',
                    sub_role: '',
                    skills: [],
                    area_id: '',
                    avatar_url: '',
                    password: '',
                    is_active: true // Default to active when creating new employee
                });
                setPreviewAvatar('');
            }
            setErrors({});
            setTouched({});
        }
    }, [isOpen, editMode, initialData]);

    // Handle API errors - display them under fields
    useEffect(() => {
        if (apiErrors && Object.keys(apiErrors).length > 0) {
            // Merge API errors into errors state
            setErrors(prev => ({ ...prev, ...apiErrors }));

            // Mark all fields with errors as touched so errors are displayed
            const newTouched = {};
            Object.keys(apiErrors).forEach(field => {
                if (apiErrors[field]) {
                    newTouched[field] = true;
                }
            });
            setTouched(prev => ({ ...prev, ...newTouched }));
        }
    }, [apiErrors]);

    // Role options
    const roleOptions = [
        { value: 'SALE_STAFF', label: 'Nhân viên bán hàng', color: COLORS.INFO[500] },
        { value: 'WORKING_STAFF', label: 'Nhân viên chăm sóc', color: COLORS.WARNING[500] }
    ];

    // Validate single field
    const validateField = (field, value) => {
        let error = '';

        switch (field) {
            case 'full_name':
                if (!value || !value.trim()) {
                    error = 'Họ và tên là bắt buộc';
                } else if (value.trim().length < 5) {
                    error = 'Họ và tên phải có ít nhất 5 ký tự';
                }
                break;
            case 'email':
                if (!value || !value.trim()) {
                    error = 'Email là bắt buộc';
                } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value)) {
                    error = 'Email không đúng định dạng';
                }
                break;
            case 'phone':
                if (!value || !value.trim()) {
                    error = 'Số điện thoại là bắt buộc';
                } else {
                    const phoneClean = value.replace(/[\s.-]/g, '');
                    if (!/^(0|\+84)[0-9]{9,10}$/.test(phoneClean)) {
                        error = 'Số điện thoại không đúng định dạng';
                    }
                }
                break;
            case 'address':
                if (!value || !value.trim()) {
                    error = 'Địa chỉ là bắt buộc';
                } else if (value.trim().length < 10) {
                    error = 'Địa chỉ phải đầy đủ (tối thiểu 10 ký tự)';
                }
                break;
            case 'salary':
                if (!value || value === '' || value === '0') {
                    error = 'Lương là bắt buộc';
                } else {
                    const salaryNum = parseInt(value, 10);
                    if (isNaN(salaryNum) || salaryNum <= 0) {
                        error = 'Lương phải lớn hơn 0';
                    } else if (salaryNum > 10000000000) {
                        error = 'Lương không hợp lệ (vượt quá 10 tỷ VNĐ)';
                    }
                }
                break;
            case 'sub_role':
                if (!value) {
                    error = 'Vui lòng chọn chức vụ';
                } else if (!['SALE_STAFF', 'WORKING_STAFF'].includes(value)) {
                    error = 'Chức vụ không hợp lệ';
                }
                break;
            case 'password':
                if (!editMode) {
                    if (!value) {
                        error = 'Mật khẩu là bắt buộc';
                    } else if (value.length < 6) {
                        error = 'Mật khẩu phải có ít nhất 6 ký tự';
                    }
                } else {
                    if (value && value.length > 0 && value.length < 6) {
                        error = 'Mật khẩu mới phải có ít nhất 6 ký tự';
                    }
                }
                break;
            case 'avatar_url':
                // Avatar validation is handled in handleAvatarChange
                break;
            default:
                break;
        }

        return error;
    };

    // Full validation (for submit)
    const validate = () => {
        const newErrors = {};

        newErrors.full_name = validateField('full_name', formData.full_name);
        newErrors.email = validateField('email', formData.email);
        newErrors.phone = validateField('phone', formData.phone);
        newErrors.address = validateField('address', formData.address);
        newErrors.salary = validateField('salary', formData.salary);
        newErrors.sub_role = validateField('sub_role', formData.sub_role);

        // Password validation: only required when creating new employee
        // When editing, password is optional (only required if user wants to change password)
        // If only is_active is changed, password is not required
        if (!editMode) {
            // Creating new employee: password is required
            newErrors.password = validateField('password', formData.password);
        } else {
            // Editing employee: password is optional
            // Only validate if password is provided (user wants to change password)
            if (formData.password && formData.password.length > 0) {
                newErrors.password = validateField('password', formData.password);
            }
        }

        // Remove empty errors
        Object.keys(newErrors).forEach(key => {
            if (!newErrors[key]) delete newErrors[key];
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing (both validation and API errors)
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Validate field if it has been touched
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }
    };

    // Handle blur - mark field as touched and validate
    const handleBlur = (field) => {
        // Mark as touched
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));

        // Validate immediately with current value
        const value = formData[field];
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    // Handle skills change (multi-select)
    const handleSkillsChange = (event) => {
        const value = event.target.value;
        // On autofill we get a stringified value
        const skillsArray = typeof value === 'string' ? value.split(',') : value;
        handleChange('skills', skillsArray);
    };

    // Handle avatar upload
    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Clear previous errors
        setErrors(prev => ({
            ...prev,
            avatar_url: ''
        }));

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                avatar_url: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP'
            }));
            return;
        }

        // Validate file size (5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setErrors(prev => ({
                ...prev,
                avatar_url: 'Kích thước ảnh không được vượt quá 5MB'
            }));
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewAvatar(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload file to server
        try {
            setUploadingAvatar(true);
            const imageUrl = await uploadFile(file);

            setFormData(prev => ({
                ...prev,
                avatar_url: imageUrl
            }));

            setPreviewAvatar(imageUrl);
            setErrors(prev => ({
                ...prev,
                avatar_url: ''
            }));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setErrors(prev => ({
                ...prev,
                avatar_url: error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
            }));
            setPreviewAvatar('');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Format salary for display (preview only)
    const formatSalaryDisplay = (value) => {
        if (!value) return '';
        const cleanValue = String(value).replace(/[^\d]/g, '');
        if (!cleanValue) return '';
        return new Intl.NumberFormat('vi-VN').format(cleanValue);
    };

    // Handle salary input - only allow digits
    const handleSalaryChange = (value) => {
        // Only keep digits
        const numericValue = value.replace(/[^\d]/g, '');
        handleChange('salary', numericValue);
    };

    // Handle submit
    const handleSubmit = () => {
        // Mark all fields as touched
        const allFields = ['full_name', 'email', 'phone', 'address', 'salary', 'sub_role', 'password'];
        const newTouched = {};
        allFields.forEach(field => {
            newTouched[field] = true;
        });
        setTouched(newTouched);

        // Validate all fields
        if (validate()) {
            onSubmit(formData);
        }
    };

    // Handle close
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
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    {editMode ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Avatar Upload */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={previewAvatar}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    border: `3px solid ${COLORS.PRIMARY[200]}`,
                                    boxShadow: `0 2px 8px ${alpha(COLORS.PRIMARY[500], 0.15)}`
                                }}
                            >
                                {uploadingAvatar ? (
                                    <CircularProgress size={40} sx={{ color: COLORS.PRIMARY[500] }} />
                                ) : (
                                    <Person sx={{ fontSize: 50, color: COLORS.GRAY[400] }} />
                                )}
                            </Avatar>
                            <IconButton
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: COLORS.PRIMARY[500],
                                    color: 'white',
                                    width: 36,
                                    height: 36,
                                    '&:hover': { backgroundColor: COLORS.PRIMARY[600] }
                                }}
                                disabled={isLoading || uploadingAvatar}
                            >
                                {uploadingAvatar ? (
                                    <CircularProgress size={18} sx={{ color: 'white' }} />
                                ) : (
                                    <PhotoCamera sx={{ fontSize: 18 }} />
                                )}
                                <input
                                    hidden
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    type="file"
                                    onChange={handleAvatarChange}
                                    disabled={isLoading || uploadingAvatar}
                                />
                            </IconButton>
                        </Box>
                    </Box>
                    {errors.avatar_url && (
                        <Alert severity="error">{errors.avatar_url}</Alert>
                    )}

                    {/* Full Name */}
                    <TextField
                        label="Họ và tên"
                        fullWidth
                        required
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        onBlur={() => handleBlur('full_name')}
                        error={touched.full_name && !!errors.full_name}
                        helperText={touched.full_name && errors.full_name ? errors.full_name : undefined}
                        disabled={isLoading}
                        placeholder="Nguyễn Văn An"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Email */}
                    <TextField
                        label="Email"
                        fullWidth
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        error={touched.email && !!errors.email}
                        helperText={touched.email && errors.email ? errors.email : undefined}
                        disabled={isLoading}
                        placeholder="nhanvien@company.com"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Phone */}
                    <TextField
                        label="Số điện thoại"
                        fullWidth
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        error={touched.phone && !!errors.phone}
                        helperText={touched.phone && errors.phone ? errors.phone : undefined}
                        disabled={isLoading}
                        placeholder="0901234567"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Sub Role */}
                    <FormControl fullWidth required error={touched.sub_role && !!errors.sub_role}>
                        <InputLabel>Chức vụ</InputLabel>
                        <Select
                            value={formData.sub_role}
                            onChange={(e) => handleChange('sub_role', e.target.value)}
                            onBlur={() => handleBlur('sub_role')}
                            label="Chức vụ"
                            disabled={isLoading}
                            sx={{ height: 56 }}
                        >
                            {roleOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: option.color
                                            }}
                                        />
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                        {touched.sub_role && errors.sub_role && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {errors.sub_role}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Area */}
                    <FormControl fullWidth>
                        <InputLabel>Khu vực</InputLabel>
                        <Select
                            value={formData.area_id}
                            onChange={(e) => handleChange('area_id', e.target.value)}
                            label="Khu vực"
                            disabled={isLoading || loadingAreas}
                            sx={{ height: 56 }}
                        >
                            <MenuItem value="">
                                <em>Không chọn</em>
                            </MenuItem>
                            {areas.map((area) => (
                                <MenuItem key={area.id} value={area.id}>
                                    {area.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Address */}
                    <TextField
                        label="Địa chỉ"
                        fullWidth
                        required
                        multiline
                        rows={2}
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        onBlur={() => handleBlur('address')}
                        error={touched.address && !!errors.address}
                        helperText={touched.address && errors.address ? errors.address : undefined}
                        disabled={isLoading}
                        placeholder="123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM"
                    />

                    {/* Skills - Multi-select */}
                    <FormControl fullWidth>
                        <InputLabel>Kỹ năng</InputLabel>
                        <Select
                            multiple
                            value={formData.skills}
                            onChange={handleSkillsChange}
                            label="Kỹ năng"
                            disabled={isLoading}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip
                                            key={value}
                                            label={value}
                                            size="small"
                                            sx={{ height: 24 }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{ minHeight: 56 }}
                        >
                            {skillOptions.map((skill) => (
                                <MenuItem key={skill} value={skill}>
                                    {skill}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Salary */}
                    <TextField
                        label="Lương (VNĐ)"
                        fullWidth
                        required
                        value={formData.salary}
                        onChange={(e) => handleSalaryChange(e.target.value)}
                        onBlur={() => handleBlur('salary')}
                        error={touched.salary && !!errors.salary}
                        helperText={
                            touched.salary && errors.salary
                                ? errors.salary
                                : formData.salary
                                    ? `Lương cơ bản: ${formatSalaryDisplay(formData.salary)} VNĐ`
                                    : ''
                        }
                        disabled={isLoading}
                        placeholder="5000000"
                        inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Password */}
                    <TextField
                        label={editMode ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}
                        fullWidth
                        required={!editMode}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        error={touched.password && !!errors.password}
                        helperText={touched.password && errors.password ? errors.password : undefined}
                        disabled={isLoading}
                        placeholder={editMode ? '' : '******'}
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        edge="end"
                                        disabled={isLoading}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Active Status Switch - Chỉ hiển thị khi chỉnh sửa nhân viên */}
                    {editMode && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                    disabled={isLoading}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: COLORS.SUCCESS[600],
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: COLORS.SUCCESS[600],
                                        },
                                    }}
                                />
                            }
                            label={
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Trạng thái hoạt động
                                </Typography>
                            }
                            sx={{
                                mt: 1,
                                mb: 1,
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                bgcolor: formData.is_active ? alpha(COLORS.SUCCESS[500], 0.1) : alpha(COLORS.ERROR[500], 0.1),
                                border: `1px solid ${formData.is_active ? COLORS.SUCCESS[200] : COLORS.ERROR[200]}`,
                                '&:hover': {
                                    bgcolor: formData.is_active ? alpha(COLORS.SUCCESS[500], 0.15) : alpha(COLORS.ERROR[500], 0.15),
                                }
                            }}
                        />
                    )}

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button onClick={handleClose} disabled={isLoading}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant="contained"
                    sx={{ backgroundColor: COLORS.PRIMARY[500], '&:hover': { backgroundColor: COLORS.PRIMARY[600] } }}
                >
                    {isLoading ? 'Đang xử lý...' : (editMode ? 'Cập nhật' : 'Thêm nhân viên')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddStaffModal;
