import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, IconButton, Typography, Checkbox, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Close, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const TeamFormModal = ({
    open,
    onClose,
    editingTeam,
    formData,
    loading,
    onFormChange,
    onSave,
    availableShifts = []
}) => {
    // Helper to display time
    const toHHmm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);

    // Weekday labels
    const weekdays = [
        { key: 'MONDAY', label: 'Thứ Hai' },
        { key: 'TUESDAY', label: 'Thứ Ba' },
        { key: 'WEDNESDAY', label: 'Thứ Tư' },
        { key: 'THURSDAY', label: 'Thứ Năm' },
        { key: 'FRIDAY', label: 'Thứ Sáu' },
        { key: 'SATURDAY', label: 'Thứ Bảy' },
        { key: 'SUNDAY', label: 'Chủ Nhật' }
    ];

    // Group shifts by time range to identify unique "Ca"
    const getUniqueTimeSlots = () => {
        const timeSlots = new Map();
        availableShifts.forEach(shift => {
            const key = `${shift.start_time}-${shift.end_time}`;
            if (!timeSlots.has(key)) {
                timeSlots.set(key, {
                    key,
                    name: shift.name,
                    start_time: shift.start_time,
                    end_time: shift.end_time
                });
            }
        });
        return Array.from(timeSlots.values());
    };

    const timeSlots = getUniqueTimeSlots();

    // Handle cell toggle in schedule matrix
    const handleToggleCell = (weekdayKey, timeSlotKey) => {
        const scheduleMatrix = formData.scheduleMatrix || {};
        const cellKey = `${weekdayKey}-${timeSlotKey}`;

        const newMatrix = {
            ...scheduleMatrix,
            [cellKey]: !scheduleMatrix[cellKey]
        };

        // Calculate selected shifts with their working_days
        const selectedShiftsWithDays = [];
        availableShifts.forEach(shift => {
            const timeKey = `${shift.start_time}-${shift.end_time}`;
            const shiftDays = shift.applicable_days || [];

            // Calculate which days are selected for this shift
            const selectedDays = shiftDays.filter(day => newMatrix[`${day}-${timeKey}`]);

            if (selectedDays.length > 0) {
                selectedShiftsWithDays.push({
                    shiftId: shift.id,
                    shift: shift,
                    working_days: selectedDays
                });
            }
        });

        onFormChange({
            ...formData,
            scheduleMatrix: newMatrix,
            selectedShiftsWithDays
        });
    };

    // Validate before saving
    const handleSaveWithValidation = () => {
        // For new teams: Check if at least 1 shift is selected
        if (!editingTeam) {
            if (!formData.selectedShiftsWithDays || formData.selectedShiftsWithDays.length === 0) {
                alert('⚠️ CẢNH BÁO: Nhóm phải được chỉ định ít nhất 1 ca làm việc!\n\nVui lòng chọn các ô trong ma trận để chỉ định ca làm việc cho nhóm.');
                return;
            }
        }

        // Proceed with save
        onSave();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minWidth: 650 } }}>
            <DialogTitle sx={{ bgcolor: COLORS.PRIMARY[500], color: 'white', py: 2.5, px: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Groups sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                        {editingTeam ? 'Sửa nhóm' : 'Tạo nhóm mới'}
                    </Typography>
                    <IconButton onClick={onClose} size="medium" sx={{ color: 'white' }}>
                        <Close sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <TextField
                        label="Tên nhóm"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="VD: Team A, Team sáng"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {!editingTeam && (
                        <>
                            <TableContainer component={Paper} sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.3) }}>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Ngày / Ca</TableCell>
                                            {timeSlots.map(slot => (
                                                <TableCell key={slot.key} align="center" sx={{ fontWeight: 700, minWidth: 120 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                                        {slot.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.65rem' }}>
                                                        {toHHmm(slot.start_time)}-{toHHmm(slot.end_time)}
                                                    </Typography>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {weekdays.map((weekday, rowIndex) => (
                                            <TableRow
                                                key={weekday.key}
                                                sx={{
                                                    '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.3) },
                                                    bgcolor: rowIndex % 2 === 0 ? 'transparent' : alpha(COLORS.BACKGROUND.NEUTRAL, 0.5)
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {weekday.label}
                                                </TableCell>
                                                {timeSlots.map(timeSlot => {
                                                    const scheduleMatrix = formData.scheduleMatrix || {};
                                                    const cellKey = `${weekday.key}-${timeSlot.key}`;
                                                    const isSelected = scheduleMatrix[cellKey] || false;

                                                    // Check if this combination exists in shifts
                                                    const hasMatchingShift = availableShifts.some(shift =>
                                                        shift.start_time === timeSlot.start_time &&
                                                        shift.end_time === timeSlot.end_time &&
                                                        (shift.applicable_days || []).includes(weekday.key)
                                                    );

                                                    return (
                                                        <TableCell
                                                            key={cellKey}
                                                            align="center"
                                                            sx={{
                                                                cursor: hasMatchingShift ? 'pointer' : 'not-allowed',
                                                                bgcolor: isSelected ? alpha(COLORS.SUCCESS[100], 0.5) : 'transparent',
                                                                '&:hover': hasMatchingShift ? {
                                                                    bgcolor: isSelected
                                                                        ? alpha(COLORS.SUCCESS[200], 0.6)
                                                                        : alpha(COLORS.PRIMARY[100], 0.3)
                                                                } : {},
                                                                p: 0.5
                                                            }}
                                                            onClick={() => hasMatchingShift && handleToggleCell(weekday.key, timeSlot.key)}
                                                        >
                                                            {hasMatchingShift ? (
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    size="small"
                                                                    sx={{
                                                                        color: COLORS.PRIMARY[500],
                                                                        '&.Mui-checked': {
                                                                            color: COLORS.SUCCESS[600]
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.DISABLED }}>
                                                                    —
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, gap: 2 }}>
                <Button onClick={onClose} variant="outlined" size="large" disabled={loading} sx={{ minWidth: 130, height: 44 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSaveWithValidation}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] },
                        minWidth: 130,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {loading ? 'Đang lưu...' : (editingTeam ? 'Cập nhật' : 'Tạo nhóm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamFormModal;

