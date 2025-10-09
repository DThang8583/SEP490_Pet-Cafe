import React from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Stack, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';

const TaskList = ({ tasks, services, onDeleteTask, onEditTask, onViewTask }) => {
    const now = new Date();

    const parseShift = (shiftStr) => {
        if (!shiftStr) return [null, null];
        const [s, e] = shiftStr.split(' - ');
        const [sh, sm] = (s || '').split(':').map(Number);
        const [eh, em] = (e || '').split(':').map(Number);
        return [sh != null ? { h: sh, m: sm || 0 } : null, eh != null ? { h: eh, m: em || 0 } : null];
    };

    const isTodayWithinShift = (dateStr, shiftStr) => {
        if (!dateStr || !shiftStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        if (!sameDay) return false;
        const [start, end] = parseShift(shiftStr);
        if (!start || !end) return false;
        const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), start.h, start.m).getTime();
        const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), end.h, end.m).getTime();
        const cur = now.getTime();
        return cur >= startMs && cur <= endMs;
    };

    const computeStatus = (task) => {
        // Explicit done when all daily entries completed
        const daily = task.dailyStatuses || [];
        if (daily.length && daily.every(d => d.status === 'done')) return { label: 'Hoàn thành', color: COLORS.SUCCESS[700], bg: alpha(COLORS.SUCCESS[100], 0.8) };

        // In progress if today is within shift of any active day
        if (task.timeframeType === 'day' && isTodayWithinShift(task.date, task.shift)) {
            return { label: 'Đang thực hiện', color: COLORS.WARNING[700], bg: alpha(COLORS.WARNING[100], 0.8) };
        }

        if (daily.length) {
            const todayKey = now.toISOString().slice(0, 10);
            const todayEntry = daily.find(d => d.date === todayKey);
            if (todayEntry && todayEntry.status !== 'done' && isTodayWithinShift(todayEntry.date, task.shift)) {
                return { label: 'Đang thực hiện', color: COLORS.WARNING[700], bg: alpha(COLORS.WARNING[100], 0.8) };
            }
            const allFuture = daily.every(d => new Date(d.date) > now);
            if (allFuture) return { label: 'Chưa tới thời gian', color: COLORS.INFO[700], bg: alpha(COLORS.INFO[100], 0.8) };
        }

        // Default scheduled if date in future
        if (task.timeframeType === 'day') {
            const d = new Date(task.date);
            if (d > now) return { label: 'Chưa tới thời gian', color: COLORS.INFO[700], bg: alpha(COLORS.INFO[100], 0.8) };
        }

        return { label: 'Đang thực hiện', color: COLORS.WARNING[700], bg: alpha(COLORS.WARNING[100], 0.8) };
    };
    if (tasks.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY }}>
                    Chưa có nhiệm vụ nào. Nhấn "Tạo nhiệm vụ mới" để bắt đầu.
                </Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}` }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Nhiệm vụ</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Ca</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Phân công</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Hành động</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map(task => (
                        <TableRow key={task.id} hover>
                            <TableCell>
                                <Chip
                                    label={task.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}
                                    size="small"
                                    sx={{
                                        background: task.type === 'internal'
                                            ? alpha(COLORS.INFO[100], 0.8)
                                            : alpha(COLORS.SUCCESS[100], 0.8),
                                        color: task.type === 'internal' ? COLORS.INFO[700] : COLORS.SUCCESS[700],
                                        fontWeight: 700
                                    }}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                {task.type === 'internal'
                                    ? (task.internalName || '—')
                                    : (services.find(s => s.id === task.serviceId)?.name || '—')}
                            </TableCell>
                            <TableCell>
                                {task.timeframeType === 'day' && (task.date || '—')}
                                {task.timeframeType === 'week' && `Tuần ${task.week || '—'}`}
                                {task.timeframeType === 'month' && (task.month || '—')}
                                {task.timeframeType === 'service_period' && 'Theo dịch vụ'}
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {(task.shifts || []).length > 0 ? (
                                        (task.shifts || []).map(shift => (
                                            <Chip
                                                key={shift}
                                                label={shift}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    mb: 0.5
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="caption">—</Typography>
                                    )}
                                </Stack>
                            </TableCell>
                            <TableCell>
                                {task.type === 'internal' ? (
                                    <Typography variant="caption">
                                        {task.shifts?.length || 0} ca | {Object.values(task.shiftAssignments || {}).reduce((total, shift) => total + (shift.staffGroups?.length || 0), 0)} nhóm NV
                                    </Typography>
                                ) : (
                                    <Typography variant="caption">
                                        {task.selectedTimeSlots?.length || 0} khung giờ
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                {(() => {
                                    const s = computeStatus(task);
                                    return (
                                        <Chip size="small" label={s.label} sx={{ background: s.bg, color: s.color, fontWeight: 700 }} />
                                    );
                                })()}
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Tooltip title="Xem chi tiết">
                                        <IconButton
                                            size="small"
                                            color="info"
                                            onClick={() => onViewTask(task)}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Chỉnh sửa">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => onEditTask(task)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => onDeleteTask(task.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TaskList;

