import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, IconButton, Typography, FormControl, InputLabel, Select, MenuItem, Alert, Chip, OutlinedInput, Switch, FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, alpha } from '@mui/material';
import { Groups, Close, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/workShiftApi';

const TeamFormModal = ({
    open,
    onClose,
    editingTeam,
    formData,
    loading,
    onFormChange,
    onSave,
    allEmployees = [],
    allWorkTypes = [],
    allWorkShifts = []
}) => {
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Sort work shifts by start time
    const sortedWorkShifts = [...allWorkShifts].sort((a, b) => {
        const timeA = a.start_time || '00:00:00';
        const timeB = b.start_time || '00:00:00';
        return timeA.localeCompare(timeB);
    });

    // Handle toggle cell in schedule matrix (for create mode)
    const handleToggleCell = (day, shiftId) => {
        const matrix = formData.scheduleMatrix || {};
        const cellKey = `${day}-${shiftId}`;

        const newMatrix = {
            ...matrix,
            [cellKey]: !matrix[cellKey]
        };

        // Calculate which shifts are selected
        const selectedShiftIds = new Set();
        Object.keys(newMatrix).forEach(key => {
            if (newMatrix[key]) {
                // Extract shift ID by removing the day prefix (first part before first hyphen)
                // Key format: "MONDAY-aa5153ab-b361-40ac-bdfe-119191cdad89"
                const firstHyphenIndex = key.indexOf('-');
                if (firstHyphenIndex > 0) {
                    const shift = key.substring(firstHyphenIndex + 1);
                    selectedShiftIds.add(shift);
                }
            }
        });

        const work_shift_ids = Array.from(selectedShiftIds);

        onFormChange({
            ...formData,
            scheduleMatrix: newMatrix,
            work_shift_ids
        });
    };

    // Validate before saving
    const handleSaveWithValidation = () => {
        if (!formData.name?.trim()) {
            alert('Vui lòng nhập tên nhóm');
            return;
        }
        if (!formData.description?.trim()) {
            alert('Vui lòng nhập mô tả');
            return;
        }
        if (!formData.leader_id) {
            alert('Vui lòng chọn trưởng nhóm');
            return;
        }
        if (!formData.work_type_ids || formData.work_type_ids.length === 0) {
            alert('Vui lòng chọn ít nhất một loại công việc');
            return;
        }
        if (!editingTeam) {
            const hasSelection = formData.scheduleMatrix && Object.values(formData.scheduleMatrix).some(v => v === true);
            if (!hasSelection) {
                alert('Vui lòng chọn ít nhất một ca làm việc và ngày trong tuần cho nhóm');
                return;
            }
        }

        onSave();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    <Groups />
                    {editingTeam ? '✏️ Sửa nhóm' : '➕ Tạo nhóm mới'}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Tên nhóm */}
                    <TextField
                        label="Tên nhóm"
                        fullWidth
                        required
                        value={formData.name || ''}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="VD: Cat Zone Care Team"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Mô tả */}
                    <TextField
                        label="Mô tả"
                        fullWidth
                        required
                        multiline
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                        placeholder="Nhập mô tả về nhóm..."
                    />

                    {/* Trưởng nhóm */}
                    <FormControl fullWidth required>
                        <InputLabel>Trưởng nhóm</InputLabel>
                        <Select
                            value={formData.leader_id || ''}
                            onChange={(e) => onFormChange({ ...formData, leader_id: e.target.value })}
                            label="Trưởng nhóm"
                            sx={{ height: 56 }}
                        >
                            <MenuItem value="">
                                <em>-- Chọn trưởng nhóm --</em>
                            </MenuItem>
                            {allEmployees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Typography>{emp.full_name}</Typography>
                                        <Chip
                                            label={emp.sub_role === 'WORKING_STAFF' ? 'Working Staff' : 'Sale Staff'}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                bgcolor: emp.sub_role === 'WORKING_STAFF' ? alpha(COLORS.INFO[100], 0.8) : alpha(COLORS.WARNING[100], 0.8),
                                                color: emp.sub_role === 'WORKING_STAFF' ? COLORS.INFO[700] : COLORS.WARNING[700]
                                            }}
                                        />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Loại công việc (multi-select) */}
                    <FormControl fullWidth required>
                        <InputLabel>Loại công việc</InputLabel>
                        <Select
                            multiple
                            value={formData.work_type_ids || []}
                            onChange={(e) => onFormChange({ ...formData, work_type_ids: e.target.value })}
                            input={<OutlinedInput label="Loại công việc" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const workType = allWorkTypes.find(wt => wt.id === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={workType?.name || value}
                                                size="small"
                                                sx={{ height: 24 }}
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                            sx={{ minHeight: 56 }}
                        >
                            {allWorkTypes.map(workType => (
                                <MenuItem key={workType.id} value={workType.id}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {workType.name}
                                        </Typography>
                                        {workType.description && (
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {workType.description}
                                            </Typography>
                                        )}
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Lịch làm việc (matrix, chỉ cho create mode) */}
                    {!editingTeam && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Lịch làm việc <span style={{ color: COLORS.ERROR[500] }}>*</span>
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 2 }}>
                                    Chọn các ô để chỉ định ngày và ca làm việc cho nhóm
                                </Typography>
                                <TableContainer component={Paper} sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.3) }}>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Thứ / Ca</TableCell>
                                                {sortedWorkShifts.map(shift => (
                                                    <TableCell key={shift.id} align="center" sx={{ fontWeight: 700, minWidth: 140 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                                            {shift.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.65rem' }}>
                                                            {shift.start_time?.substring(0, 5)}-{shift.end_time?.substring(0, 5)}
                                                        </Typography>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {weekdays.map((day, rowIndex) => (
                                                <TableRow
                                                    key={day}
                                                    sx={{
                                                        '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.3) },
                                                        bgcolor: rowIndex % 2 === 0 ? 'transparent' : alpha(COLORS.BACKGROUND.NEUTRAL, 0.5)
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                        {WEEKDAY_LABELS[day]}
                                                    </TableCell>
                                                    {sortedWorkShifts.map(shift => {
                                                        const scheduleMatrix = formData.scheduleMatrix || {};
                                                        const cellKey = `${day}-${shift.id}`;
                                                        const isSelected = scheduleMatrix[cellKey] || false;

                                                        // Check if this shift is applicable for this day
                                                        // If applicable_days exists and has items, check if day is included
                                                        // If applicable_days is empty or undefined, the shift is NOT available for any day
                                                        const hasApplicableDays = shift.applicable_days && shift.applicable_days.length > 0;
                                                        const isApplicable = hasApplicableDays ? shift.applicable_days.includes(day) : false;

                                                        return (
                                                            <TableCell
                                                                key={cellKey}
                                                                align="center"
                                                                sx={{
                                                                    cursor: isApplicable ? 'pointer' : 'not-allowed',
                                                                    bgcolor: isSelected ? alpha(COLORS.SUCCESS[100], 0.5) :
                                                                        !isApplicable ? alpha(COLORS.GRAY[100], 0.3) : 'transparent',
                                                                    '&:hover': isApplicable ? {
                                                                        bgcolor: isSelected
                                                                            ? alpha(COLORS.SUCCESS[200], 0.6)
                                                                            : alpha(COLORS.PRIMARY[100], 0.3)
                                                                    } : {},
                                                                    p: 0.5,
                                                                    borderRight: `1px solid ${alpha(COLORS.GRAY[200], 0.5)}`
                                                                }}
                                                                onClick={() => isApplicable && handleToggleCell(day, shift.id)}
                                                            >
                                                                {isApplicable ? (
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
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.DISABLED, fontSize: '0.9rem' }}>
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
                            </Box>
                        </>
                    )}

                    {/* Trạng thái (chỉ cho edit mode) */}
                    {editingTeam && (
                        <>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active ?? true}
                                        onChange={(e) => onFormChange({ ...formData, is_active: e.target.checked })}
                                        color="success"
                                    />
                                }
                                label={
                                    <Typography sx={{ fontWeight: 600 }}>
                                        {formData.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                                    </Typography>
                                }
                            />
                        </>
                    )}

                    {/* Info alert for create mode */}
                    {!editingTeam && (
                        <Alert severity="info" icon={<Info />}>
                            <Typography variant="body2">
                                Nhóm mới sẽ được tạo với trạng thái <strong>Hoạt động</strong> mặc định. Chọn các ô trong bảng lịch để chỉ định ngày và ca làm việc.
                            </Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, gap: 2 }}>
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

