import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Avatar, Stack, InputAdornment, Alert, alpha, Chip } from '@mui/material';
import { Close, Person, Email, Phone, Home, AttachMoney, PhotoCamera, Visibility, VisibilityOff, WorkOutline } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AddStaffModal = ({
    isOpen = false,
    onClose,
    onSubmit,
    editMode = false,
    initialData = null,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        salary: '',
        sub_role: '',
        skills: [],
        avatar_url: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [skillInput, setSkillInput] = useState('');

    // Load initial data when editing
    useEffect(() => {
        if (isOpen) {
            if (editMode && initialData) {
                setFormData({
                    full_name: initialData.full_name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    salary: initialData.salary || '',
                    sub_role: initialData.sub_role || '',
                    skills: initialData.skills || [],
                    avatar_url: initialData.avatar_url || '',
                    password: ''
                });
                setPreviewAvatar(initialData.avatar_url || '');
                setSkillInput(initialData.skills ? initialData.skills.join(', ') : '');
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
                    avatar_url: '',
                    password: ''
                });
                setPreviewAvatar('');
                setSkillInput('');
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData]);

    // Role options
    const roleOptions = [
        { value: 'SALE_STAFF', label: 'Nhân viên bán hàng', color: COLORS.INFO[500] },
        { value: 'WORKING_STAFF', label: 'Nhân viên chăm sóc', color: COLORS.WARNING[500] }
    ];

    // Validation
    const validate = () => {
        const newErrors = {};

        // Full name
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Họ và tên là bắt buộc';
        } else if (formData.full_name.trim().length < 5) {
            newErrors.full_name = 'Họ và tên phải có ít nhất 5 ký tự';
        }

        // Email
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
            newErrors.email = 'Email không đúng định dạng';
        }

        // Phone
        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại là bắt buộc';
        } else {
            const phoneClean = formData.phone.replace(/[\s.-]/g, '');
            if (!/^(0|\+84)[0-9]{9,10}$/.test(phoneClean)) {
                newErrors.phone = 'Số điện thoại không đúng định dạng';
            }
        }

        // Address
        if (!formData.address.trim()) {
            newErrors.address = 'Địa chỉ là bắt buộc';
        } else if (formData.address.trim().length < 10) {
            newErrors.address = 'Địa chỉ phải đầy đủ (tối thiểu 10 ký tự)';
        }

        // Salary
        if (!formData.salary) {
            newErrors.salary = 'Lương là bắt buộc';
        } else {
            const salaryNum = parseFloat(formData.salary);
            if (salaryNum < 0) {
                newErrors.salary = 'Lương phải lớn hơn 0';
            }
        }

        // Sub Role
        if (!formData.sub_role) {
            newErrors.sub_role = 'Vui lòng chọn chức vụ';
        } else if (!['SALE_STAFF', 'WORKING_STAFF'].includes(formData.sub_role)) {
            newErrors.sub_role = 'Chức vụ không hợp lệ';
        }

        // Password
        if (!editMode) {
            if (!formData.password) {
                newErrors.password = 'Mật khẩu là bắt buộc';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
        } else {
            if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
                newErrors.password = 'Mật khẩu mới phải có ít nhất 6 ký tự';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle skills input
    const handleSkillsChange = (value) => {
        setSkillInput(value);
        const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
        handleChange('skills', skillsArray);
    };

    // Handle avatar upload
    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    avatar_url: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP'
                }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    setPreviewAvatar(reader.result);
                    setFormData(prev => ({
                        ...prev,
                        avatar_url: reader.result
                    }));
                    setErrors(prev => ({
                        ...prev,
                        avatar_url: ''
                    }));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Format salary display
    const formatSalary = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    // Parse salary input
    const handleSalaryChange = (value) => {
        const numericValue = value.replace(/[^\d]/g, '');
        handleChange('salary', numericValue);
    };

    // Handle submit
    const handleSubmit = () => {
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
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: `0 25px 50px -12px ${alpha(COLORS.SHADOW.DARK, 0.25)}`,
                    overflow: 'visible',
                    position: 'relative',
                    m: 2
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)'
                }
            }}
        >
            {/* Gradient Top Bar */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${COLORS.PRIMARY[500]}, ${COLORS.PRIMARY[600]})`
                }}
            />

            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 3,
                    borderBottom: `1px solid ${COLORS.GRAY[200]}`
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                    {editMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </Typography>

                <IconButton
                    onClick={handleClose}
                    disabled={isLoading}
                    sx={{
                        color: COLORS.GRAY[600],
                        '&:hover': { backgroundColor: alpha(COLORS.GRAY[100], 0.8) }
                    }}
                >
                    <Close />
                </IconButton>
            </Box>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Avatar Upload */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={previewAvatar}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: `4px solid ${COLORS.PRIMARY[100]}`,
                                    boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.2)}`
                                }}
                            >
                                <Person sx={{ fontSize: 60, color: COLORS.GRAY[400] }} />
                            </Avatar>
                            <IconButton
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: COLORS.PRIMARY[500],
                                    color: COLORS.COMMON.WHITE,
                                    width: 40,
                                    height: 40,
                                    '&:hover': { backgroundColor: COLORS.PRIMARY[600] }
                                }}
                            >
                                <PhotoCamera sx={{ fontSize: 20 }} />
                                <input
                                    hidden
                                    accept="image/*"
                                    type="file"
                                    onChange={handleAvatarChange}
                                    disabled={isLoading}
                                />
                            </IconButton>
                        </Box>
                    </Box>
                    {errors.avatar_url && (
                        <Alert severity="error" sx={{ mt: 1 }}>{errors.avatar_url}</Alert>
                    )}

                    {/* Full Name & Email */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Họ và tên"
                            fullWidth
                            required
                            value={formData.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            error={!!errors.full_name}
                            helperText={errors.full_name || 'VD: Nguyễn Văn An'}
                            disabled={isLoading}
                            placeholder="Nguyễn Văn An"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: COLORS.GRAY[400] }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            label="Email"
                            fullWidth
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email || 'Email công ty hoặc cá nhân'}
                            disabled={isLoading}
                            placeholder="nhanvien@company.com"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: COLORS.GRAY[400] }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>

                    {/* Phone & Sub Role */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Số điện thoại"
                            fullWidth
                            required
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            error={!!errors.phone}
                            helperText={errors.phone || '10 chữ số, bắt đầu bằng 03/05/07/08/09'}
                            disabled={isLoading}
                            placeholder="0901234567"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Phone sx={{ color: COLORS.GRAY[400] }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <FormControl fullWidth required error={!!errors.sub_role}>
                            <InputLabel>Chức vụ</InputLabel>
                            <Select
                                value={formData.sub_role}
                                onChange={(e) => handleChange('sub_role', e.target.value)}
                                label="Chức vụ"
                                disabled={isLoading}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <WorkOutline sx={{ color: COLORS.GRAY[400] }} />
                                    </InputAdornment>
                                }
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
                            {errors.sub_role && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                    {errors.sub_role}
                                </Typography>
                            )}
                        </FormControl>
                    </Stack>

                    {/* Address */}
                    <TextField
                        label="Địa chỉ"
                        fullWidth
                        required
                        multiline
                        rows={2}
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        error={!!errors.address}
                        helperText={errors.address || 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố'}
                        disabled={isLoading}
                        placeholder="123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                    <Home sx={{ color: COLORS.GRAY[400] }} />
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Skills */}
                    <TextField
                        label="Kỹ năng"
                        fullWidth
                        multiline
                        rows={2}
                        value={skillInput}
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        helperText="Nhập các kỹ năng, cách nhau bằng dấu phẩy"
                        disabled={isLoading}
                        placeholder="Pha chế cà phê, Chăm sóc mèo, Giao tiếp tốt"
                    />
                    {formData.skills.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {formData.skills.map((skill, index) => (
                                <Chip
                                    key={index}
                                    label={skill}
                                    size="small"
                                    sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.5) }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Salary & Password */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Lương (VNĐ)"
                            fullWidth
                            required
                            value={formatSalary(formData.salary)}
                            onChange={(e) => handleSalaryChange(e.target.value)}
                            error={!!errors.salary}
                            helperText={errors.salary || 'Lương cơ bản'}
                            disabled={isLoading}
                            placeholder="5,000,000"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AttachMoney sx={{ color: COLORS.GRAY[400] }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            label={editMode ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}
                            fullWidth
                            required={!editMode}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            error={!!errors.password}
                            helperText={errors.password || (editMode ? 'Để trống nếu không đổi' : 'Tối thiểu 6 ký tự')}
                            disabled={isLoading}
                            placeholder={editMode ? '' : '******'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>

                    {/* Info Alert */}
                    {!editMode && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Nhân viên sẽ nhận thông báo tài khoản và mật khẩu sau khi được tạo.
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    gap: 1.5,
                    borderTop: `1px solid ${COLORS.GRAY[200]}`,
                    backgroundColor: alpha(COLORS.GRAY[50], 0.5)
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={isLoading}
                    sx={{
                        px: 3,
                        py: 1,
                        color: COLORS.GRAY[700],
                        '&:hover': { backgroundColor: alpha(COLORS.GRAY[100], 0.8) }
                    }}
                >
                    Hủy
                </Button>

                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant="contained"
                    sx={{
                        px: 4,
                        py: 1,
                        backgroundColor: COLORS.PRIMARY[500],
                        '&:hover': { backgroundColor: COLORS.PRIMARY[600] }
                    }}
                >
                    {isLoading ? 'Đang xử lý...' : (editMode ? 'Cập nhật' : 'Thêm nhân viên')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddStaffModal;
