import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Avatar, Stack, InputAdornment, Alert, alpha } from '@mui/material';
import { Close, Person, Email, Phone, Home, AttachMoney, PhotoCamera, Visibility, VisibilityOff } from '@mui/icons-material';
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
        role: '',
        avatar_url: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState('');

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
                    role: initialData.role || '',
                    avatar_url: initialData.avatar_url || '',
                    password: '' // Password không load khi edit
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
                    role: '',
                    avatar_url: '',
                    password: ''
                });
                setPreviewAvatar('');
            }
            setErrors({});
        }
    }, [isOpen, editMode, initialData]);

    // Role options - Manager chỉ được thêm nhân viên cấp dưới
    const roleOptions = [
        { value: 'sale_staff', label: 'Nhân viên bán hàng', color: COLORS.INFO[500] },
        { value: 'working_staff', label: 'Nhân viên chăm sóc', color: COLORS.WARNING[500] }
    ];

    // Validation rules - Theo chuẩn doanh nghiệp
    const validate = () => {
        const newErrors = {};

        // 1. Full name - Chuẩn doanh nghiệp
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Họ và tên là bắt buộc';
        } else {
            const nameParts = formData.full_name.trim().split(/\s+/);

            // Phải có ít nhất 2 từ (họ và tên)
            if (nameParts.length < 2) {
                newErrors.full_name = 'Vui lòng nhập đầy đủ họ và tên (ít nhất 2 từ)';
            }
            // Kiểm tra độ dài
            else if (formData.full_name.trim().length < 5 || formData.full_name.trim().length > 50) {
                newErrors.full_name = 'Họ và tên phải từ 5-50 ký tự';
            }
            // Chỉ chứa chữ cái và khoảng trắng (có dấu tiếng Việt)
            else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(formData.full_name)) {
                newErrors.full_name = 'Họ và tên chỉ được chứa chữ cái';
            }
            // Mỗi từ phải viết hoa chữ cái đầu
            else {
                const hasInvalidCapitalization = nameParts.some(part => {
                    return part.length > 0 && part[0] !== part[0].toUpperCase();
                });
                if (hasInvalidCapitalization) {
                    newErrors.full_name = 'Mỗi từ trong họ tên phải viết hoa chữ cái đầu';
                }
            }
        }

        // 2. Email - Chuẩn doanh nghiệp
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
            newErrors.email = 'Email không đúng định dạng';
        } else if (formData.email.length > 100) {
            newErrors.email = 'Email không được vượt quá 100 ký tự';
        } else {
            // Kiểm tra domain email hợp lệ
            const domain = formData.email.split('@')[1];
            const invalidDomains = ['test.com', 'example.com', 'temp.com'];
            if (invalidDomains.includes(domain)) {
                newErrors.email = 'Vui lòng sử dụng email thật, không dùng email test';
            }
        }

        // 3. Phone - Chuẩn Việt Nam
        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại là bắt buộc';
        } else {
            const phoneClean = formData.phone.replace(/[\s.-]/g, '');

            // Kiểm tra format
            if (!/^(0|\+84)[0-9]{9,10}$/.test(phoneClean)) {
                newErrors.phone = 'Số điện thoại không đúng định dạng';
            } else {
                // Kiểm tra đầu số hợp lệ tại Việt Nam
                const validPrefixes = ['03', '05', '07', '08', '09'];
                const prefix = phoneClean.startsWith('0') ? phoneClean.substring(0, 2) : phoneClean.substring(3, 5);

                if (!validPrefixes.includes(prefix)) {
                    newErrors.phone = 'Đầu số điện thoại không hợp lệ (phải là 03, 05, 07, 08, 09)';
                }

                // Kiểm tra độ dài chính xác
                const expectedLength = phoneClean.startsWith('+84') ? 12 : 10;
                if (phoneClean.length !== expectedLength) {
                    newErrors.phone = `Số điện thoại phải có đúng ${expectedLength === 12 ? '12' : '10'} chữ số`;
                }
            }
        }

        // 4. Address - Đầy đủ thông tin
        if (!formData.address.trim()) {
            newErrors.address = 'Địa chỉ là bắt buộc';
        } else if (formData.address.trim().length < 10) {
            newErrors.address = 'Địa chỉ phải đầy đủ: số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố (tối thiểu 20 ký tự)';
        } else if (formData.address.trim().length > 200) {
            newErrors.address = 'Địa chỉ không được vượt quá 200 ký tự';
        }

        // 5. Salary - Theo quy định lương Việt Nam
        if (!formData.salary) {
            newErrors.salary = 'Lương là bắt buộc';
        } else {
            const salaryNum = parseFloat(formData.salary);
        }

        // 6. Role
        if (!formData.role) {
            newErrors.role = 'Vui lòng chọn chức vụ';
        } else if (!['sale_staff', 'working_staff'].includes(formData.role)) {
            newErrors.role = 'Chức vụ không hợp lệ';
        }

        // 7. Password - Bảo mật cao
        if (!editMode) {
            if (!formData.password) {
                newErrors.password = 'Mật khẩu là bắt buộc';
            } else {
                // Độ dài tối thiểu
                if (formData.password.length < 8) {
                    newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
                }
                // Phải có chữ hoa
                else if (!/[A-Z]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa';
                }
                // Phải có chữ thường
                else if (!/[a-z]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ thường';
                }
                // Phải có số
                else if (!/[0-9]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ số';
                }
            }
        } else {
            // Khi edit, nếu có nhập password mới thì validate
            if (formData.password && formData.password.length > 0) {
                if (formData.password.length < 8) {
                    newErrors.password = 'Mật khẩu mới phải có ít nhất 8 ký tự';
                } else if (!/[A-Z]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu mới phải có ít nhất 1 chữ hoa';
                } else if (!/[a-z]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu mới phải có ít nhất 1 chữ thường';
                } else if (!/[0-9]/.test(formData.password)) {
                    newErrors.password = 'Mật khẩu mới phải có ít nhất 1 chữ số';
                }
            }
        }

        // 8. Avatar - Khuyến khích có ảnh đại diện
        if (!editMode && !formData.avatar_url) {
            // Warning nhẹ, không block submit
            console.warn('Khuyến khích upload ảnh đại diện cho nhân viên');
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
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle avatar upload - Theo chuẩn doanh nghiệp
    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 1. Validate file type - Chỉ chấp nhận ảnh chuẩn
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    avatar_url: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP'
                }));
                return;
            }

            // 4. Create preview và validate dimension
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    // Validate kích thước ảnh (min 200x200, max 2000x2000)
                    if (img.width < 200 || img.height < 200) {
                        setErrors(prev => ({
                            ...prev,
                            avatar_url: 'Ảnh phải có kích thước tối thiểu 200x200 pixels'
                        }));
                        return;
                    }
                    if (img.width > 2000 || img.height > 2000) {
                        setErrors(prev => ({
                            ...prev,
                            avatar_url: 'Ảnh không được vượt quá 2000x2000 pixels'
                        }));
                        return;
                    }

                    // Khuyến nghị ảnh vuông hoặc gần vuông
                    const ratio = img.width / img.height;
                    if (ratio < 0.8 || ratio > 1.2) {
                        console.warn('Khuyến nghị sử dụng ảnh vuông (tỷ lệ 1:1) để hiển thị tốt nhất');
                    }

                    // All validations passed
                    setPreviewAvatar(reader.result);
                    setFormData(prev => ({
                        ...prev,
                        avatar_url: reader.result
                    }));

                    // Clear error
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

    // Handle keyboard events
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !isLoading) {
            handleSubmit();
        } else if (event.key === 'Escape' && !isLoading) {
            handleClose();
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            onKeyDown={handleKeyDown}
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
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
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
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: COLORS.TEXT.PRIMARY
                    }}
                >
                    {editMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </Typography>

                <IconButton
                    onClick={handleClose}
                    disabled={isLoading}
                    sx={{
                        color: COLORS.GRAY[600],
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                        }
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
                                    '&:hover': {
                                        backgroundColor: COLORS.PRIMARY[600]
                                    }
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
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {errors.avatar_url}
                        </Alert>
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
                            helperText={errors.full_name || 'VD: Nguyễn Văn An (viết hoa chữ cái đầu)'}
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

                    {/* Phone & Role */}
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

                        <FormControl fullWidth required error={!!errors.role}>
                            <InputLabel>Chức vụ</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                label="Chức vụ"
                                disabled={isLoading}
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
                            {errors.role && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                    {errors.role}
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

                    {/* Salary & Password */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Lương (VNĐ)"
                            fullWidth
                            required
                            value={formatSalary(formData.salary)}
                            onChange={(e) => handleSalaryChange(e.target.value)}
                            error={!!errors.salary}
                            helperText={errors.salary || 'Tối thiểu 4,960,000đ, bội số của 100,000đ'}
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
                            helperText={errors.password || (editMode ? 'Để trống nếu không đổi' : '8+ ký tự, có chữ hoa, chữ thường, số')}
                            disabled={isLoading}
                            placeholder={editMode ? '' : 'Abc123xyz'}
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
                            Nhân viên sẽ nhận email thông báo tài khoản và mật khẩu sau khi được tạo.
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
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                        }
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
                        '&:hover': {
                            backgroundColor: COLORS.PRIMARY[600]
                        }
                    }}
                >
                    {isLoading ? 'Đang xử lý...' : (editMode ? 'Cập nhật' : 'Thêm nhân viên')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddStaffModal;

