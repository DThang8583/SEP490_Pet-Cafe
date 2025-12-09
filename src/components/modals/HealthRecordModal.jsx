import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, Typography, alpha, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Close, CalendarToday, LocalHospital } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const HealthRecordModal = ({
    open,
    onClose,
    onSubmit,
    dailyTask,
    vaccinationSchedule,
    healthRecord = null,
    isEditMode = false,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        check_date: '',
        weight: '',
        temperature: '',
        health_status: '',
        symptoms: '',
        treatment: '',
        veterinarian: '',
        next_check_date: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open && dailyTask && vaccinationSchedule) {
            if (isEditMode && healthRecord) {
                // Edit mode: load existing health record data
                const checkDate = healthRecord.check_date ? new Date(healthRecord.check_date).toISOString().split('T')[0] : '';
                const nextCheckDate = healthRecord.next_check_date ? new Date(healthRecord.next_check_date).toISOString().split('T')[0] : '';

                setFormData({
                    check_date: checkDate,
                    weight: healthRecord.weight?.toString() || '',
                    temperature: healthRecord.temperature?.toString() || '',
                    health_status: healthRecord.health_status || '',
                    symptoms: healthRecord.symptoms || '',
                    treatment: healthRecord.treatment || '',
                    veterinarian: healthRecord.veterinarian || '',
                    next_check_date: nextCheckDate,
                    notes: healthRecord.notes || ''
                });
            } else {
                // Create mode: Set default check_date to today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString().split('T')[0];

                setFormData({
                    check_date: todayStr,
                    weight: '',
                    temperature: '',
                    health_status: '',
                    symptoms: '',
                    treatment: '',
                    veterinarian: '',
                    next_check_date: '',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [open, dailyTask, vaccinationSchedule, healthRecord, isEditMode]);

    const validate = () => {
        const newErrors = {};

        if (!formData.check_date) {
            newErrors.check_date = 'Ngày kiểm tra là bắt buộc';
        }

        if (!formData.health_status) {
            newErrors.health_status = 'Tình trạng sức khỏe là bắt buộc';
        }

        // Validate weight if provided
        if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) < 0)) {
            newErrors.weight = 'Cân nặng phải là số dương';
        }

        // Validate temperature if provided
        if (formData.temperature && (isNaN(formData.temperature) || parseFloat(formData.temperature) < 0)) {
            newErrors.temperature = 'Nhiệt độ phải là số dương';
        }

        // Validate date order
        if (formData.check_date && formData.next_check_date) {
            const checkDate = new Date(formData.check_date);
            const nextCheckDate = new Date(formData.next_check_date);
            if (nextCheckDate <= checkDate) {
                newErrors.next_check_date = 'Ngày kiểm tra tiếp theo phải sau ngày kiểm tra';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (validate() && dailyTask && vaccinationSchedule) {
            onSubmit({
                pet_id: vaccinationSchedule.pet_id || vaccinationSchedule.pet?.id,
                check_date: formData.check_date,
                weight: formData.weight ? parseFloat(formData.weight) : 0,
                temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
                health_status: formData.health_status || '',
                symptoms: formData.symptoms.trim(),
                treatment: formData.treatment.trim(),
                veterinarian: formData.veterinarian.trim(),
                next_check_date: formData.next_check_date || null,
                notes: formData.notes.trim()
            });
        }
    };

    const handleClose = () => {
        // Don't close modal if loading
        if (isLoading) return;

        setFormData({
            check_date: '',
            weight: '',
            temperature: '',
            health_status: '',
            symptoms: '',
            treatment: '',
            veterinarian: '',
            next_check_date: '',
            notes: ''
        });
        setErrors({});
        onClose();
    };

    if (!dailyTask || !vaccinationSchedule) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
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
                    bgcolor: COLORS.INFO[50],
                    borderBottom: `3px solid ${COLORS.INFO[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.INFO[800], pb: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <LocalHospital />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {isEditMode ? '✏️ Chỉnh Sửa Hồ Sơ Sức Khỏe' : '➕ Tạo Hồ Sơ Sức Khỏe'}
                        </Typography>
                    </Stack>
                    <IconButton
                        size="small"
                        onClick={handleClose}
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            '&:hover': { bgcolor: alpha(COLORS.INFO[100], 0.5) }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Info Box */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(COLORS.INFO[50], 0.3),
                            border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Thông tin thú cưng:
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thú cưng: {vaccinationSchedule.pet?.name || vaccinationSchedule.pet_id || 'N/A'}
                        </Typography>
                    </Box>

                    {/* Check Date */}
                    <TextField
                        label="Ngày kiểm tra *"
                        type="date"
                        value={formData.check_date}
                        onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
                        fullWidth
                        required
                        error={Boolean(errors.check_date)}
                        helperText={errors.check_date}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: <CalendarToday sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                        }}
                    />

                    {/* Next Check Date */}
                    <TextField
                        label="Ngày kiểm tra tiếp theo"
                        type="date"
                        value={formData.next_check_date}
                        onChange={(e) => setFormData({ ...formData, next_check_date: e.target.value })}
                        fullWidth
                        error={Boolean(errors.next_check_date)}
                        helperText={errors.next_check_date}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: <CalendarToday sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                        }}
                    />

                    {/* Weight */}
                    <TextField
                        label="Cân nặng (kg)"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        fullWidth
                        placeholder="Nhập cân nặng"
                        error={Boolean(errors.weight)}
                        helperText={errors.weight}
                        inputProps={{ min: 0, step: 0.1 }}
                    />

                    {/* Temperature */}
                    <TextField
                        label="Nhiệt độ (°C)"
                        type="number"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        fullWidth
                        placeholder="Nhập nhiệt độ"
                        error={Boolean(errors.temperature)}
                        helperText={errors.temperature}
                        inputProps={{ min: 0, step: 0.1 }}
                    />

                    {/* Health Status */}
                    <FormControl fullWidth required>
                        <InputLabel>Tình trạng sức khỏe *</InputLabel>
                        <Select
                            value={formData.health_status}
                            onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                            label="Tình trạng sức khỏe *"
                            error={Boolean(errors.health_status)}
                        >
                            <MenuItem value="HEALTHY">Khỏe mạnh</MenuItem>
                            <MenuItem value="SICK">Ốm</MenuItem>
                            <MenuItem value="RECOVERING">Đang hồi phục</MenuItem>
                            <MenuItem value="UNDER_OBSERVATION">Đang theo dõi</MenuItem>
                            <MenuItem value="QUARANTINE">Cách ly</MenuItem>
                        </Select>
                        {errors.health_status && (
                            <Typography variant="caption" sx={{ color: COLORS.ERROR[600], mt: 0.5, ml: 1.75 }}>
                                {errors.health_status}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Symptoms */}
                    <TextField
                        label="Triệu chứng"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Mô tả các triệu chứng (nếu có)..."
                    />

                    {/* Treatment */}
                    <TextField
                        label="Điều trị"
                        value={formData.treatment}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Mô tả phương pháp điều trị (nếu có)..."
                    />

                    {/* Veterinarian */}
                    <TextField
                        label="Bác sĩ thú y"
                        value={formData.veterinarian}
                        onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                        fullWidth
                        placeholder="Nhập tên bác sĩ thú y"
                    />

                    {/* Notes */}
                    <TextField
                        label="Ghi chú"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ghi chú về tình trạng sức khỏe..."
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 100,
                        borderColor: alpha(COLORS.BORDER.DEFAULT, 0.5)
                    }}
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 120,
                        boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`,
                        '&:hover': {
                            boxShadow: `0 6px 16px ${alpha(COLORS.PRIMARY[500], 0.4)}`
                        }
                    }}
                >
                    {isLoading ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : (isEditMode ? 'Cập Nhật' : 'Tạo Hồ Sơ')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HealthRecordModal;

