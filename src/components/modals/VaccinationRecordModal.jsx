import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, Typography, alpha, Box } from '@mui/material';
import { Close, CalendarToday, Vaccines } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const VaccinationRecordModal = ({
    open,
    onClose,
    onSubmit,
    dailyTask,
    vaccinationSchedule,
    vaccinationRecord = null, // For edit mode
    isEditMode = false, // New prop to indicate edit mode
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        vaccination_date: '',
        next_due_date: '',
        name: '',
        veterinarian: '',
        clinic_name: '',
        batch_number: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open && dailyTask && vaccinationSchedule) {
            if (vaccinationRecord && isEditMode) {
                // Edit mode: load existing vaccination record data
                const vaccinationDate = vaccinationRecord.vaccination_date ? new Date(vaccinationRecord.vaccination_date).toISOString().split('T')[0] : '';
                const nextDueDate = vaccinationRecord.next_due_date ? new Date(vaccinationRecord.next_due_date).toISOString().split('T')[0] : '';

                setFormData({
                    vaccination_date: vaccinationDate,
                    next_due_date: nextDueDate,
                    name: vaccinationRecord.name || '',
                    veterinarian: vaccinationRecord.veterinarian || '',
                    clinic_name: vaccinationRecord.clinic_name || '',
                    batch_number: vaccinationRecord.batch_number || '',
                    notes: vaccinationRecord.notes || ''
                });
            } else {
                // Create mode: Set default vaccination_date from scheduled_date
                // WORKAROUND: Backend stores time as "fake UTC" representing local Vietnam time
                // So we extract date directly from the string without timezone conversion
                let defaultVaccinationDate = '';
                if (vaccinationSchedule.scheduled_date) {
                    const isoString = vaccinationSchedule.scheduled_date;
                    const match = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
                    if (match) {
                        defaultVaccinationDate = match[1]; // YYYY-MM-DD
                    }
                }

                // If no scheduled_date, fallback to today
                if (!defaultVaccinationDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    defaultVaccinationDate = today.toISOString().split('T')[0];
                }

                // Set empty next_due_date - user must input manually
                setFormData({
                    vaccination_date: defaultVaccinationDate,
                    next_due_date: '',
                    name: '',
                    veterinarian: '',
                    clinic_name: '',
                    batch_number: '',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [open, dailyTask, vaccinationSchedule, vaccinationRecord, isEditMode]);


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

    const handleSubmit = (e) => {
        e?.preventDefault(); // Prevent default form submission
        if (validate() && dailyTask && vaccinationSchedule) {
            onSubmit({
                pet_id: vaccinationSchedule.pet_id || vaccinationSchedule.pet?.id,
                vaccination_date: formData.vaccination_date,
                next_due_date: formData.next_due_date,
                name: formData.name.trim(),
                veterinarian: formData.veterinarian.trim(),
                clinic_name: formData.clinic_name.trim(),
                batch_number: formData.batch_number.trim(),
                notes: formData.notes.trim(),
                schedule_id: vaccinationSchedule.id
            });
        }
    };

    const handleClose = () => {
        if (isLoading) return; // Prevent closing while loading
        setFormData({
            vaccination_date: '',
            next_due_date: '',
            name: '',
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
                    bgcolor: COLORS.SUCCESS[50],
                    borderBottom: `3px solid ${COLORS.SUCCESS[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.SUCCESS[800], pb: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Vaccines />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {isEditMode ? '✏️ Chỉnh Sửa Hồ Sơ Tiêm Phòng' : '➕ Tạo Hồ Sơ Tiêm Phòng'}
                        </Typography>
                    </Stack>
                    <IconButton
                        size="small"
                        onClick={handleClose}
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            '&:hover': { bgcolor: alpha(COLORS.SUCCESS[100], 0.5) }
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
                            Thông tin lịch tiêm:
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Thú cưng: {vaccinationSchedule.pet?.name || vaccinationSchedule.pet_id || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Ngày dự kiến: {(() => {
                                if (!vaccinationSchedule.scheduled_date) return 'N/A';
                                // Extract date directly from ISO string to avoid timezone conversion
                                const match = vaccinationSchedule.scheduled_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                if (match) {
                                    const [, year, month, day] = match;
                                    return `${day}/${month}/${year}`;
                                }
                                return 'N/A';
                            })()}
                        </Typography>
                    </Box>

                    {/* Vaccination Date */}
                    <TextField
                        label="Ngày tiêm *"
                        type="date"
                        value={formData.vaccination_date}
                        onChange={(e) => {
                            const newVaccinationDate = e.target.value;
                            setFormData({ ...formData, vaccination_date: newVaccinationDate });
                        }}
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

                    {/* Name */}
                    <TextField
                        label="Tên vaccine *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                        placeholder="Nhập tên vaccine"
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

                    {/* Batch Number (Tên vaccine) */}
                    <TextField
                        label="Tên vaccine"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        fullWidth
                        placeholder="Nhập tên vaccine"
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
                    type="button"
                    onClick={handleSubmit}
                    variant="contained"
                    color="success"
                    disabled={isLoading}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 120,
                        boxShadow: `0 4px 12px ${alpha(COLORS.SUCCESS[500], 0.3)}`,
                        '&:hover': {
                            boxShadow: `0 6px 16px ${alpha(COLORS.SUCCESS[500], 0.4)}`
                        }
                    }}
                >
                    {isLoading ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : (isEditMode ? 'Cập Nhật' : 'Tạo Hồ Sơ')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VaccinationRecordModal;
