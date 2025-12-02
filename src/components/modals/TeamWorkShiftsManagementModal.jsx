import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Typography, Stack, Chip, Box, IconButton, Divider, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Schedule, Delete, Add } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/workShiftApi';
import teamApi from '../../api/teamApi';

const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
        return timeStr.substring(0, 5);
    }
    return timeStr;
};

const TeamWorkShiftsManagementModal = ({
    open,
    onClose,
    team,
    allWorkShifts = [],
    onUpdate
}) => {
    const [loading, setLoading] = useState(false);
    const [currentTeamWorkShifts, setCurrentTeamWorkShifts] = useState([]);
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [showAddSection, setShowAddSection] = useState(false);

    // Load current team work shifts when modal opens
    useEffect(() => {
        if (open && team?.id) {
            loadTeamWorkShifts();
        } else {
            setCurrentTeamWorkShifts([]);
            setSelectedToAdd([]);
            setShowAddSection(false);
        }
    }, [open, team?.id]);

    const loadTeamWorkShifts = async () => {
        try {
            setLoading(true);
            const response = await teamApi.getTeamWorkShifts(team.id, { page_size: 999 });
            if (response.success) {
                setCurrentTeamWorkShifts(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load team work shifts:', error);
            setCurrentTeamWorkShifts([]);
        } finally {
            setLoading(false);
        }
    };

    // Get work shift IDs that are already assigned to team
    const assignedShiftIds = useMemo(() => {
        return currentTeamWorkShifts.map(tws => tws.work_shift_id || tws.work_shift?.id).filter(Boolean);
    }, [currentTeamWorkShifts]);

    // Get available work shifts (not yet assigned)
    const availableShifts = useMemo(() => {
        return allWorkShifts.filter(shift => !assignedShiftIds.includes(shift.id));
    }, [allWorkShifts, assignedShiftIds]);

    // Get sorted current work shifts
    const sortedCurrentShifts = useMemo(() => {
        return [...currentTeamWorkShifts].sort((a, b) => {
            const shiftA = a.work_shift || {};
            const shiftB = b.work_shift || {};
            const timeA = shiftA.start_time || '';
            const timeB = shiftB.start_time || '';
            return timeA.localeCompare(timeB);
        });
    }, [currentTeamWorkShifts]);

    const handleDeleteWorkShift = async (teamWorkShift) => {
        try {
            setLoading(true);
            const teamWorkShiftId = teamWorkShift.id;
            if (!teamWorkShiftId) {
                throw new Error('Không tìm thấy ID ca làm việc');
            }

            await teamApi.deleteTeamWorkShift(teamWorkShiftId);
            await loadTeamWorkShifts();

            if (typeof onUpdate === 'function') {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to delete work shift:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const toggleAddShift = (shiftId) => {
        setSelectedToAdd(prev => {
            if (prev.includes(shiftId)) {
                return prev.filter(id => id !== shiftId);
            }
            return [...prev, shiftId];
        });
    };

    const handleSelectAllAdd = () => {
        if (selectedToAdd.length === availableShifts.length) {
            setSelectedToAdd([]);
        } else {
            setSelectedToAdd(availableShifts.map(shift => shift.id));
        }
    };

    const handleAddWorkShifts = async () => {
        if (selectedToAdd.length === 0) return;

        try {
            setLoading(true);
            await teamApi.assignTeamWorkShifts(team.id, {
                work_shift_ids: selectedToAdd
            });

            setSelectedToAdd([]);
            setShowAddSection(false);
            await loadTeamWorkShifts();

            if (typeof onUpdate === 'function') {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to add work shifts:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="lg"
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
                    <Schedule />
                    Chỉnh sửa ca làm việc
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                    Nhóm: <strong>{team?.name || 'Không xác định'}</strong>
                </Typography>

                {loading && currentTeamWorkShifts.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Current Work Shifts Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.PRIMARY[700] }}>
                                Ca làm việc hiện tại ({sortedCurrentShifts.length})
                            </Typography>
                            {sortedCurrentShifts.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center', bgcolor: alpha(COLORS.GRAY[50], 0.5), borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Nhóm này chưa có ca làm việc nào
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}`, borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(COLORS.PRIMARY[50], 0.6) }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Ca làm việc</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Ngày áp dụng</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedCurrentShifts.map((teamWorkShift) => {
                                                const shift = teamWorkShift.work_shift || {};
                                                return (
                                                    <TableRow key={teamWorkShift.id} hover>
                                                        <TableCell>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {shift.name || '--'}
                                                            </Typography>
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
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteWorkShift(teamWorkShift)}
                                                                disabled={loading}
                                                                sx={{
                                                                    color: COLORS.ERROR[600],
                                                                    '&:hover': { bgcolor: alpha(COLORS.ERROR[50], 0.8) }
                                                                }}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>

                        {/* Add Work Shifts Section */}
                        {!showAddSection ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    startIcon={<Add />}
                                    variant="outlined"
                                    onClick={() => setShowAddSection(true)}
                                    disabled={loading || availableShifts.length === 0}
                                    sx={{ minWidth: 180, height: 40, fontWeight: 600 }}
                                >
                                    Thêm ca làm việc
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 3 }}>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.PRIMARY[700] }}>
                                    Thêm ca làm việc mới
                                </Typography>
                                {availableShifts.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(COLORS.INFO[50], 0.5), borderRadius: 2 }}>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Tất cả ca làm việc đã được phân cho nhóm này
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <TableContainer sx={{ border: `1px solid ${COLORS.BORDER.DEFAULT}`, borderRadius: 2, mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: alpha(COLORS.SUCCESS[50], 0.6) }}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                indeterminate={selectedToAdd.length > 0 && selectedToAdd.length < availableShifts.length}
                                                                checked={availableShifts.length > 0 && selectedToAdd.length === availableShifts.length}
                                                                onChange={handleSelectAllAdd}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Ca làm việc</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Ngày áp dụng</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {availableShifts.map((shift) => {
                                                        const isChecked = selectedToAdd.includes(shift.id);
                                                        return (
                                                            <TableRow key={shift.id} hover selected={isChecked}>
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onChange={() => toggleAddShift(shift.id)}
                                                                        sx={{
                                                                            color: COLORS.SUCCESS[500],
                                                                            '&.Mui-checked': { color: COLORS.SUCCESS[600] }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                        {shift.name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
                                                                        size="small"
                                                                        sx={{ fontWeight: 600, bgcolor: alpha(COLORS.SUCCESS[100], 0.5) }}
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
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                Đã chọn <strong>{selectedToAdd.length}</strong> ca làm việc
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    variant="outlined"
                                                    size="medium"
                                                    onClick={() => {
                                                        setShowAddSection(false);
                                                        setSelectedToAdd([]);
                                                    }}
                                                    disabled={loading}
                                                    sx={{ minWidth: 100, height: 40, fontWeight: 600 }}
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="medium"
                                                    onClick={handleAddWorkShifts}
                                                    disabled={loading || selectedToAdd.length === 0}
                                                    sx={{
                                                        bgcolor: COLORS.PRIMARY[500],
                                                        '&:hover': { bgcolor: COLORS.PRIMARY[600] },
                                                        minWidth: 120,
                                                        height: 40,
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {loading ? 'Đang thêm...' : 'Thêm'}
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{ minWidth: 120, height: 44, fontWeight: 600 }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamWorkShiftsManagementModal;

