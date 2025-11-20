import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, Typography, FormControl, InputLabel, Select, MenuItem, Alert, Chip, OutlinedInput, Switch, FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, alpha } from '@mui/material';
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
    // Sort work shifts by start time
    const sortedWorkShifts = [...allWorkShifts].sort((a, b) => {
        const timeA = a.start_time || '00:00:00';
        const timeB = b.start_time || '00:00:00';
        return timeA.localeCompare(timeB);
    });

    const handleToggleWorkShift = (shiftId) => {
        const selected = new Set(formData.work_shift_ids || []);
        if (selected.has(shiftId)) {
            selected.delete(shiftId);
        } else {
            selected.add(shiftId);
        }
        onFormChange({
            ...formData,
            work_shift_ids: Array.from(selected)
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
            return `${timeStr.substring(0, 5)}`;
        }
        return timeStr;
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
            if (!formData.work_shift_ids || formData.work_shift_ids.length === 0) {
                alert('Vui lòng chọn ít nhất một ca làm việc cho nhóm');
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

                    {/* Thêm nhân viên vào nhóm (chỉ cho create mode) */}
                    {!editingTeam && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Thêm nhân viên vào nhóm
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 2 }}>
                                    Chọn các nhân viên để thêm vào nhóm. Trưởng nhóm đã được chọn ở trên sẽ tự động được thêm vào nhóm.
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Nhân viên</InputLabel>
                                    <Select
                                        multiple
                                        value={formData.member_ids || []}
                                        onChange={(e) => onFormChange({ ...formData, member_ids: e.target.value })}
                                        input={<OutlinedInput label="Nhân viên" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((employeeId) => {
                                                    const employee = allEmployees.find(emp => emp.id === employeeId);
                                                    return (
                                                        <Chip
                                                            key={employeeId}
                                                            label={employee?.full_name || employeeId}
                                                            size="small"
                                                            sx={{ height: 24 }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                        sx={{ minHeight: 56 }}
                                    >
                                        {allEmployees
                                            .filter(emp => emp.id !== formData.leader_id) // Exclude leader from member list
                                            .map(employee => (
                                                <MenuItem key={employee.id} value={employee.id}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                                        <Typography>{employee.full_name}</Typography>
                                                        <Chip
                                                            label={employee.sub_role === 'WORKING_STAFF' ? 'Working Staff' : 'Sale Staff'}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                                bgcolor: employee.sub_role === 'WORKING_STAFF' ? alpha(COLORS.INFO[100], 0.8) : alpha(COLORS.WARNING[100], 0.8),
                                                                color: employee.sub_role === 'WORKING_STAFF' ? COLORS.INFO[700] : COLORS.WARNING[700]
                                                            }}
                                                        />
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </>
                    )}

                    {/* Lịch làm việc (chọn work shift có sẵn, chỉ cho create mode) */}
                    {!editingTeam && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Lịch làm việc <span style={{ color: COLORS.ERROR[500] }}>*</span>
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 2 }}>
                                    Chọn các ca làm việc có sẵn. Mỗi ca đã bao gồm thông tin ngày áp dụng theo cấu hình work shift.
                                </Typography>
                                <TableContainer component={Paper} sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.3) }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Ca làm việc</TableCell>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Thời gian</TableCell>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Ngày áp dụng</TableCell>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Mô tả</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>Chọn</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedWorkShifts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: COLORS.TEXT.SECONDARY }}>
                                                        Chưa có ca làm việc nào. Vui lòng tạo work shift trước.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sortedWorkShifts.map((shift) => {
                                                    const isChecked = (formData.work_shift_ids || []).includes(shift.id);
                                                    return (
                                                        <TableRow key={shift.id} hover>
                                                            <TableCell>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {shift.name}
                                                                </Typography>
                                                                {shift.type && (
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                        {shift.type}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
                                                                    size="small"
                                                                    sx={{ fontWeight: 600, bgcolor: alpha(COLORS.PRIMARY[100], 0.5) }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                    {(shift.applicable_days || []).length > 0 ? (
                                                                        shift.applicable_days.map((day) => (
                                                                            <Chip
                                                                                key={`${shift.id}-${day}`}
                                                                                label={WEEKDAY_LABELS[day] || day}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: alpha(COLORS.SECONDARY[100], 0.6),
                                                                                    color: COLORS.SECONDARY[700]
                                                                                }}
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.DISABLED }}>
                                                                            Không xác định ngày
                                                                        </Typography>
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    {shift.description || 'Không có mô tả'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Checkbox
                                                                    checked={isChecked}
                                                                    onChange={() => handleToggleWorkShift(shift.id)}
                                                                    sx={{
                                                                        color: COLORS.PRIMARY[500],
                                                                        '&.Mui-checked': { color: COLORS.PRIMARY[600] }
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
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
                                Nhóm mới sẽ được tạo với trạng thái <strong>Hoạt động</strong> mặc định. Hãy chọn các work shift phù hợp, mỗi work shift đã bao gồm thông tin ngày áp dụng và khung giờ.
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

