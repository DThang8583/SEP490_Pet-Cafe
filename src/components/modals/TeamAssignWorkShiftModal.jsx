import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Typography, Stack, Chip, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Schedule } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/workShiftApi';

const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
        return timeStr.substring(0, 5);
    }
    return timeStr;
};

const TeamAssignWorkShiftModal = ({
    open,
    onClose,
    team,
    workShifts = [],
    initialSelected = [],
    loading = false,
    onSubmit
}) => {
    const [selectedIds, setSelectedIds] = useState(initialSelected);

    useEffect(() => {
        if (open) {
            setSelectedIds(initialSelected);
        }
    }, [open, initialSelected]);

    const sortedShifts = useMemo(() => {
        return [...workShifts].sort((a, b) => {
            const timeA = a.start_time || '';
            const timeB = b.start_time || '';
            return timeA.localeCompare(timeB);
        });
    }, [workShifts]);

    const toggleShift = (shiftId) => {
        setSelectedIds(prev => {
            if (prev.includes(shiftId)) {
                return prev.filter(id => id !== shiftId);
            }
            return [...prev, shiftId];
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.length === sortedShifts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedShifts.map(shift => shift.id));
        }
    };

    const handleSave = () => {
        if (typeof onSubmit === 'function') {
            onSubmit(selectedIds);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
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
            <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule fontSize="small" />
                Phân ca làm việc
            </DialogTitle>
            <DialogContent sx={{ pt: 2, pb: 0 }}>
                <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                    Nhóm: <strong>{team?.name || 'Không xác định'}</strong>
                </Typography>
                <TableContainer sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}`, borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[50], 0.6) }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < sortedShifts.length}
                                        checked={sortedShifts.length > 0 && selectedIds.length === sortedShifts.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Ca làm việc</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Ngày áp dụng</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedShifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: COLORS.TEXT.SECONDARY }}>
                                        Chưa có ca làm việc nào. Vui lòng tạo work shift trước.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedShifts.map((shift) => {
                                    const isChecked = selectedIds.includes(shift.id);
                                    return (
                                        <TableRow key={shift.id} hover selected={isChecked}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={() => toggleShift(shift.id)}
                                                    sx={{
                                                        color: COLORS.PRIMARY[500],
                                                        '&.Mui-checked': { color: COLORS.PRIMARY[600] }
                                                    }}
                                                />
                                            </TableCell>
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
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                        Đã chọn <strong>{selectedIds.length}</strong> ca làm việc
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, gap: 2 }}>
                <Button onClick={onClose} variant="outlined" disabled={loading} sx={{ minWidth: 120 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || selectedIds.length === 0}
                    sx={{
                        minWidth: 140,
                        fontWeight: 700,
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] }
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Phân ca'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamAssignWorkShiftModal;


