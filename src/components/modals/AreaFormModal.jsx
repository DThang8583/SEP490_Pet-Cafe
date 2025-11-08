import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Stack, IconButton, Alert, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Checkbox, ListItemText, FormControlLabel, Switch, Avatar, Paper } from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, MeetingRoom as RoomIcon, CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AreaFormModal = ({ open, onClose, onSubmit, area, workTypes, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        max_capacity: '',
        image_url: '',
        work_type_ids: [],
        is_active: true
    });

    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState('');

    // Initialize form data when area changes (for edit mode)
    useEffect(() => {
        if (mode === 'edit' && area) {
            setFormData({
                name: area.name || '',
                description: area.description || '',
                location: area.location || '',
                max_capacity: area.max_capacity || '',
                image_url: area.image_url || '',
                work_type_ids: area.area_work_types?.map(awt => awt.work_type_id) || [],
                is_active: area.is_active !== undefined ? area.is_active : true
            });
            setImagePreview(area.image_url || null);
        } else {
            setFormData({
                name: '',
                description: '',
                location: '',
                max_capacity: '',
                image_url: '',
                work_type_ids: [],
                is_active: true
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setErrors({});
        setImageError('');
    }, [area, mode, open]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'is_active' ? checked : value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleWorkTypesChange = (event) => {
        const { value } = event.target;
        setFormData(prev => ({
            ...prev,
            work_type_ids: typeof value === 'string' ? value.split(',') : value
        }));
        // Clear error if exists
        if (errors.work_type_ids) {
            setErrors(prev => ({ ...prev, work_type_ids: '' }));
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImageError('');

            // Validate file type
            if (!file.type.startsWith('image/')) {
            setImageError('Vui lòng chọn file hình ảnh');
                return;
            }

            // Validate file size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setImageError('Kích thước ảnh không được vượt quá 5MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
        reader.onerror = () => {
            setImageError('Không thể đọc file ảnh');
        };
            reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageError('');
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên khu vực là bắt buộc';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Vị trí là bắt buộc';
        }

        if (formData.max_capacity === '' || formData.max_capacity < 0) {
            newErrors.max_capacity = 'Sức chứa phải >= 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const submitData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            location: formData.location.trim(),
            max_capacity: parseInt(formData.max_capacity),
            work_type_ids: formData.work_type_ids
        };

        // Add image_file if user uploaded new image
        if (imageFile) {
            submitData.image_file = imageFile;
        } else if (mode === 'edit' && formData.image_url) {
            submitData.image_url = formData.image_url;
        } else {
            submitData.image_url = null;
        }

        // Add is_active field only for edit mode
        if (mode === 'edit') {
            submitData.is_active = formData.is_active;
        }

        onSubmit(submitData);
    };

    const isEdit = mode === 'edit';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '60vh'
                }
            }}
        >
            {/* Title */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.PRIMARY[50],
                    borderBottom: `1px solid ${COLORS.GRAY[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    {isEdit ? (
                        <EditIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                    ) : (
                        <AddIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                    )}
                    <Box>
                        <Typography variant="h5" fontWeight={600}>
                            {isEdit ? 'Chỉnh sửa Khu vực' : 'Tạo Khu vực mới'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {isEdit ? 'Cập nhật thông tin khu vực' : 'Thêm khu vực mới vào hệ thống'}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stack spacing={2.5}>
                    {/* Info Alert */}
                    <Alert severity="info" icon={<RoomIcon />}>
                        Điền đầy đủ thông tin để {isEdit ? 'cập nhật' : 'tạo'} khu vực
                    </Alert>

                    {/* Row 1: Name */}
                    <TextField
                        fullWidth
                        label="Tên khu vực"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        required
                        size="medium"
                    />

                    {/* Row 2: Description */}
                    <TextField
                        fullWidth
                        label="Mô tả"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        error={!!errors.description}
                        helperText={errors.description}
                        required
                        multiline
                        rows={3}
                        size="medium"
                    />

                    {/* Row 3: Location & Max Capacity */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label="Vị trí"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            error={!!errors.location}
                            helperText={errors.location}
                            required
                            size="medium"
                        />
                        <TextField
                            label="Sức chứa tối đa"
                            name="max_capacity"
                            type="number"
                            value={formData.max_capacity}
                            onChange={handleChange}
                            error={!!errors.max_capacity}
                            helperText={errors.max_capacity}
                            required
                            size="medium"
                            sx={{ minWidth: 200 }}
                            inputProps={{ min: 0 }}
                        />
                    </Stack>

                    {/* Row 4: Image Upload */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                            Hình ảnh khu vực (Tùy chọn)
                        </Typography>
                        {imageError && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                {imageError}
                            </Alert>
                        )}

                        {imagePreview ? (
                            <Paper
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    border: `2px solid ${COLORS.PRIMARY[200]}`,
                                    borderRadius: 2
                                }}
                            >
                                <Avatar
                                    src={imagePreview}
                                    variant="rounded"
                                    sx={{ width: 100, height: 100 }}
                                >
                                    <RoomIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {imageFile ? imageFile.name : 'Hình ảnh hiện tại'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {imageFile ? `${(imageFile.size / 1024).toFixed(2)} KB` : 'Đã tải lên'}
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={handleRemoveImage}
                                    color="error"
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Paper>
                        ) : (
                            <Button
                                component="label"
                                variant="outlined"
                                fullWidth
                                startIcon={<UploadIcon />}
                                sx={{
                                    height: 120,
                                    borderStyle: 'dashed',
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                        bgcolor: COLORS.PRIMARY[50]
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageChange}
                                />
                                <Stack alignItems="center" spacing={0.5}>
                                    <Typography variant="body2" fontWeight={500}>
                                        Click để tải ảnh lên
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        PNG, JPG, WEBP (Max 5MB)
                                    </Typography>
                                </Stack>
                            </Button>
                        )}
                    </Box>

                    {/* Row 5: Work Types */}
                    <FormControl fullWidth size="medium">
                        <InputLabel>Loại công việc (Tùy chọn)</InputLabel>
                        <Select
                            multiple
                            value={formData.work_type_ids}
                            onChange={handleWorkTypesChange}
                            input={<OutlinedInput label="Loại công việc (Tùy chọn)" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value, index) => {
                                        const wt = workTypes.find(w => w.id === value);
                                        return (
                                            <Chip
                                                key={value || `selected-${index}`}
                                                label={wt?.name || value}
                                                size="small"
                                                sx={{ bgcolor: COLORS.PRIMARY[100] }}
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {workTypes.map((workType, index) => (
                                <MenuItem key={workType.id || `worktype-${index}`} value={workType.id}>
                                    <Checkbox checked={formData.work_type_ids.indexOf(workType.id) > -1} />
                                    <ListItemText
                                        primary={workType.name}
                                        secondary={workType.description}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Row 6: Is Active (Edit mode only) */}
                    {isEdit && (
                        <Box
                            sx={{
                                p: 2,
                                border: `1px dashed ${COLORS.GRAY[300]}`,
                                borderRadius: 1,
                                bgcolor: COLORS.GRAY[50]
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        name="is_active"
                                        color="success"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Trạng thái hoạt động
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {formData.is_active ? 'Khu vực đang hoạt động' : 'Khu vực không hoạt động'}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ p: 2.5, bgcolor: COLORS.GRAY[50], borderTop: `1px solid ${COLORS.GRAY[200]}` }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        minWidth: 120,
                        bgcolor: COLORS.PRIMARY[600],
                        '&:hover': { bgcolor: COLORS.PRIMARY[700] }
                    }}
                >
                    {isEdit ? 'Cập nhật' : 'Tạo khu vực'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AreaFormModal;

