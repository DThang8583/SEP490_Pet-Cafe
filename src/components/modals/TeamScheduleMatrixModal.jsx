import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, IconButton, Typography, Checkbox, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Schedule, Close, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const TeamScheduleMatrixModal = ({
    open,
    onClose,
    team,
    allShifts = [],
    currentShiftId,
    loading,
    onSave
}) => {
    const [scheduleMatrix, setScheduleMatrix] = useState({});

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
        allShifts.forEach(shift => {
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
    const toHHmm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);

    // Initialize schedule matrix from team's current working_days in each shift
    useEffect(() => {
        if (open && team) {
            const matrix = {};

            // Find all shifts that have this team and use their applicable_days from API
            // API chính thức chỉ có applicable_days, không có working_days
            allShifts.forEach(shift => {
                const teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];
                const teamInShift = teams.find(t => t.name === team?.name);

                if (teamInShift) {
                    const timeKey = `${shift.start_time}-${shift.end_time}`;
                    // Use applicable_days from shift (API chính thức)
                    const workingDays = Array.isArray(shift.applicable_days) ? shift.applicable_days : [];

                    workingDays.forEach(day => {
                        const cellKey = `${day}-${timeKey}`;
                        matrix[cellKey] = true;
                    });
                }
            });

            setScheduleMatrix(matrix);
        }
    }, [open, team, allShifts]);

    const handleToggleCell = (weekday, timeSlot) => {
        const cellKey = `${weekday}-${timeSlot.key}`;
        setScheduleMatrix(prev => ({
            ...prev,
            [cellKey]: !prev[cellKey]
        }));
    };

    const handleSave = () => {
        // New logic: Calculate working_days for each shift based on selected cells
        const shiftsToAddMap = {};
        const shiftsToRemoveMap = {};
        const shiftsToUpdateMap = {};

        // Group selected cells by shift (by time slot)
        const shiftWorkingDaysMap = new Map(); // shiftId -> {shift, selectedDays[]}

        allShifts.forEach(shift => {
            const timeKey = `${shift.start_time}-${shift.end_time}`;
            const shiftDays = shift.applicable_days || [];

            // Calculate which days are selected for this shift
            const selectedDays = shiftDays.filter(day => {
                const cellKey = `${day}-${timeKey}`;
                return scheduleMatrix[cellKey] === true;
            });

            shiftWorkingDaysMap.set(shift.id, { shift, selectedDays });
        });

        // Determine ADD/UPDATE/REMOVE for each shift
        let teamWillBeInShifts = [];
        shiftWorkingDaysMap.forEach(({ shift, selectedDays }) => {
            const teams = Array.isArray(shift.team_work_shifts) ? shift.team_work_shifts : [];
            const currentTeam = teams.find(t => t.name === team?.name);
            const currentlyHasTeam = !!currentTeam;

            if (selectedDays.length > 0) {
                // Team should be in this shift with selectedDays
                teamWillBeInShifts.push(shift);

                if (!currentlyHasTeam) {
                    // ADD: Team not in shift → add with selectedDays
                    // Note: API POST /api/teams/{id}/work-shifts chỉ nhận work_shift_ids, không nhận working_days
                    shiftsToAddMap[shift.id] = { shift, working_days: selectedDays };
                } else {
                    // UPDATE: Team already in shift → update working_days
                    // Note: API hiện tại không hỗ trợ update working_days, chỉ có thể add/remove work_shift_ids
                    const currentWorkingDays = Array.isArray(shift.applicable_days) ? shift.applicable_days : [];
                    const hasChanged =
                        selectedDays.length !== currentWorkingDays.length ||
                        !selectedDays.every(d => currentWorkingDays.includes(d));

                    if (hasChanged) {
                        shiftsToUpdateMap[shift.id] = { shift, working_days: selectedDays };
                    }
                }
            } else {
                // selectedDays.length === 0 → Team should NOT be in this shift
                if (currentlyHasTeam) {
                    // REMOVE: Team in shift but no days selected
                    shiftsToRemoveMap[shift.id] = shift;
                }
            }
        });

        const shiftsToAdd = Object.values(shiftsToAddMap);
        const shiftsToRemove = Object.values(shiftsToRemoveMap);
        const shiftsToUpdate = Object.values(shiftsToUpdateMap);

        // Validate: Team must be in at least 1 shift after changes
        if (teamWillBeInShifts.length === 0) {
            alert(`⚠️ CẢNH BÁO: Nhóm "${team?.name}" phải làm việc ít nhất 1 ca!\n\nVui lòng chọn ít nhất 1 ô trong bảng.`);
            return;
        }

        // Check if there are any changes
        if (shiftsToAdd.length === 0 && shiftsToRemove.length === 0 && shiftsToUpdate.length === 0) {
            alert('ℹ️ Không có thay đổi nào.');
            return;
        }

        onSave(team, shiftsToAdd, shiftsToRemove, shiftsToUpdate);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ bgcolor: COLORS.INFO[600], color: 'white', py: 2.5, px: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Schedule sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Lịch làm việc của nhóm
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Nhóm: {team?.name}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="medium" sx={{ color: 'white' }}>
                        <Close sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    <TableContainer component={Paper} sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}` }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.3) }}>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Ngày / Ca</TableCell>
                                    {timeSlots.map(slot => (
                                        <TableCell key={slot.key} align="center" sx={{ fontWeight: 700, minWidth: 140 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {slot.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {toHHmm(slot.start_time)} - {toHHmm(slot.end_time)}
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
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {weekday.label}
                                        </TableCell>
                                        {timeSlots.map(timeSlot => {
                                            const cellKey = `${weekday.key}-${timeSlot.key}`;
                                            const isSelected = scheduleMatrix[cellKey] || false;

                                            // Check if this combination exists in shifts
                                            const hasMatchingShift = allShifts.some(shift =>
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
                                                        } : {}
                                                    }}
                                                    onClick={() => hasMatchingShift && handleToggleCell(weekday.key, timeSlot)}
                                                >
                                                    {hasMatchingShift ? (
                                                        <Checkbox
                                                            checked={isSelected}
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
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="large"
                    disabled={loading}
                    sx={{ minWidth: 130, height: 44 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                        bgcolor: COLORS.INFO[600],
                        '&:hover': { bgcolor: COLORS.INFO[700] },
                        minWidth: 130,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamScheduleMatrixModal;

