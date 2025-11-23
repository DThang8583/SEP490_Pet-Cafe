import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, Typography, alpha, Box } from '@mui/material';
import { Close, CalendarToday } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccinationRecordModal = ({
    open,
    onClose,
    onSubmit,
    dailyTask,
    vaccinationSchedule,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        vaccination_date: '',
        next_due_date: '',
        veterinarian: '',
        clinic_name: '',
        batch_number: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open && dailyTask && vaccinationSchedule) {
            // Set default vaccination_date to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // Calculate next_due_date (default to 1 year from today, can be adjusted)
            const nextDue = new Date(today);
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            const nextDueStr = nextDue.toISOString().split('T')[0];

            setFormData({
                vaccination_date: todayStr,
                next_due_date: nextDueStr,
                veterinarian: '',
                clinic_name: '',
                batch_number: '',
                notes: ''
            });
            setErrors({});
        }
    }, [open, dailyTask, vaccinationSchedule]);

    const validate = () => {
        const newErrors = {};

        if (!formData.vaccination_date) {
            newErrors.vaccination_date = 'Ngày tiêm là bắt buộc';
        }

        if (!formData.next_due_date) {
            newErrors.next_due_date = 'Ngày tiêm tiếp theo là bắt buộc';
        }

        // Validate date order
        if (formData.vaccination_date && formData.next_due_date) {
            const vaccinationDate = new Date(formData.vaccination_date);
            const nextDueDate = new Date(formData.next_due_date);
            if (nextDueDate <= vaccinationDate) {
                newErrors.next_due_date = 'Ngày tiêm tiếp theo phải sau ngày tiêm';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate() && dailyTask && vaccinationSchedule) {
            onSubmit({
                pet_id: vaccinationSchedule.pet_id || vaccinationSchedule.pet?.id,
                vaccine_type_id: vaccinationSchedule.vaccine_type_id || vaccinationSchedule.vaccine_type?.id,
                vaccination_date: formData.vaccination_date,
                next_due_date: formData.next_due_date,
                veterinarian: formData.veterinarian.trim(),
                clinic_name: formData.clinic_name.trim(),
                batch_number: formData.batch_number.trim(),
                notes: formData.notes.trim(),
                schedule_id: vaccinationSchedule.id
            });
        }
    };

    const handleClose = () => {
        setFormData({
            vaccination_date: '',
            next_due_date: '',
            veterinarian: '',
            clinic_name: '',
            batch_number: '',
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
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 12px 40px ${alpha(COLORS.SHADOW.LIGHT, 0.25)}`
                }
            }}
        >
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Tạo Hồ Sơ Tiêm Phòng
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={handleClose}
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            '&:hover': { bgcolor: COLORS.BACKGROUND.NEUTRAL }
                        }}
                    >
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
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
                            Thông tin lịch tiêm:
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thú cưng: {vaccinationSchedule.pet?.name || vaccinationSchedule.pet_id || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Loại vaccine: {vaccinationSchedule.vaccine_type?.name || vaccinationSchedule.vaccine_type_id || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Ngày dự kiến: {vaccinationSchedule.scheduled_date ? new Date(vaccinationSchedule.scheduled_date).toLocaleDateString('vi-VN') : 'N/A'}
                        </Typography>
                    </Box>

                    {/* Vaccination Date */}
                    <TextField
                        label="Ngày tiêm *"
                        type="date"
                        value={formData.vaccination_date}
                        onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
                        fullWidth
                        required
                        error={Boolean(errors.vaccination_date)}
                        helperText={errors.vaccination_date}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: <CalendarToday sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                        }}
                    />

                    {/* Next Due Date */}
                    <TextField
                        label="Ngày tiêm tiếp theo *"
                        type="date"
                        value={formData.next_due_date}
                        onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                        fullWidth
                        required
                        error={Boolean(errors.next_due_date)}
                        helperText={errors.next_due_date}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: <CalendarToday sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                        }}
                    />

                    {/* Veterinarian */}
                    <TextField
                        label="Bác sĩ thú y"
                        value={formData.veterinarian}
                        onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                        fullWidth
                        placeholder="Nhập tên bác sĩ thú y"
                    />

                    {/* Clinic Name */}
                    <TextField
                        label="Tên phòng khám"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        fullWidth
                        placeholder="Nhập tên phòng khám"
                    />

                    {/* Batch Number */}
                    <TextField
                        label="Số lô vaccine"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        fullWidth
                        placeholder="Nhập số lô vaccine"
                    />

                    {/* Notes */}
                    <TextField
                        label="Ghi chú"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ghi chú về việc tiêm phòng..."
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
                    {isLoading ? 'Đang tạo...' : 'Tạo Hồ Sơ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VaccinationRecordModal;
