import React from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Stack, Tooltip, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Delete, Edit, Visibility, Assignment } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import workshiftApi from '../../../api/workshiftApi';

const TaskList = ({ tasks, services, onDeleteTask, onEditTask, onViewTask }) => {
    const [allShifts, setAllShifts] = React.useState([]);
    const now = new Date();

    // Load all shifts to get full shift details
    React.useEffect(() => {
        const loadShifts = async () => {
            try {
                const response = await workshiftApi.getAllShifts();
                setAllShifts(response?.data || []);
            } catch (err) {
                console.error('Error loading shifts:', err);
                setAllShifts([]);
            }
        };
        loadShifts();
    }, []);

    // Get shift details by ID
    const getShiftDetails = (shiftId) => {
        return (allShifts || []).find(s => s.id === shiftId);
    };

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
            <Paper
                elevation={0}
                sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: `2px dashed ${alpha(COLORS.ERROR[300], 0.3)}`,
                    bgcolor: alpha(COLORS.ERROR[50], 0.3)
                }}
            >
                <Stack spacing={2} alignItems="center">
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: alpha(COLORS.ERROR[100], 0.5),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Assignment sx={{ fontSize: 40, color: COLORS.ERROR[400] }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                        Chưa có nhiệm vụ nào
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, maxWidth: 400 }}>
                        Nhấn nút "Tạo nhiệm vụ mới" ở trên để bắt đầu phân công nhiệm vụ cho nhân viên
                    </Typography>
                </Stack>
            </Paper>
        );
    }

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: 3,
                border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                overflow: 'hidden'
            }}
        >
            <Table>
                <TableHead>
                    <TableRow
                        sx={{
                            bgcolor: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.8)} 0%, ${alpha(COLORS.ERROR[100], 0.5)} 100%)`,
                            '& th': {
                                borderBottom: `2px solid ${alpha(COLORS.ERROR[300], 0.5)}`
                            }
                        }}
                    >
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>LOẠI</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>NHIỆM VỤ</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>THỜI GIAN</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>CA LÀM VIỆC</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>PHÂN CÔNG</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5 }}>TRẠNG THÁI</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: COLORS.ERROR[800], py: 2.5, textAlign: 'right' }}>HÀNH ĐỘNG</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map((task, index) => (
                        <TableRow
                            key={task.id}
                            hover
                            sx={{
                                '&:hover': {
                                    bgcolor: alpha(COLORS.ERROR[50], 0.3)
                                },
                                borderLeft: `4px solid ${task.type === 'internal' ? COLORS.PRIMARY[500] : COLORS.SECONDARY[500]}`,
                                '& td': {
                                    py: 2.5,
                                    borderBottom: index === tasks.length - 1 ? 'none' : `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`
                                }
                            }}
                        >
                            <TableCell>
                                <Chip
                                    label={task.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}
                                    size="small"
                                    sx={{
                                        background: task.type === 'internal'
                                            ? `linear-gradient(135deg, ${COLORS.PRIMARY[400]} 0%, ${COLORS.PRIMARY[600]} 100%)`
                                            : `linear-gradient(135deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.SECONDARY[600]} 100%)`,
                                        color: 'white',
                                        fontWeight: 700,
                                        px: 1.5,
                                        boxShadow: `0 2px 4px ${alpha(task.type === 'internal' ? COLORS.PRIMARY[500] : COLORS.SECONDARY[500], 0.3)}`
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                    {task.type === 'internal'
                                        ? (task.internalName || '—')
                                        : (services.find(s => s.id === task.serviceId)?.name || '—')}
                                </Typography>
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
                                        (task.shifts || []).map(shiftId => {
                                            const shiftDetails = getShiftDetails(shiftId);
                                            return (
                                                <Chip
                                                    key={shiftId}
                                                    label={shiftDetails
                                                        ? `${shiftDetails.name} (${shiftDetails.start_time?.substring(0, 5)} - ${shiftDetails.end_time?.substring(0, 5)})`
                                                        : shiftId}
                                                    size="small"
                                                    sx={{
                                                        height: 'auto',
                                                        fontSize: '0.65rem',
                                                        mb: 0.5,
                                                        py: 0.5,
                                                        '& .MuiChip-label': {
                                                            whiteSpace: 'normal',
                                                            wordBreak: 'break-word'
                                                        }
                                                    }}
                                                />
                                            );
                                        })
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
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <Tooltip title="Xem chi tiết" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={() => onViewTask(task)}
                                            sx={{
                                                color: COLORS.INFO[600],
                                                bgcolor: alpha(COLORS.INFO[100], 0.5),
                                                '&:hover': {
                                                    bgcolor: alpha(COLORS.INFO[200], 0.8),
                                                    transform: 'scale(1.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Chỉnh sửa" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={() => onEditTask(task)}
                                            sx={{
                                                color: COLORS.PRIMARY[600],
                                                bgcolor: alpha(COLORS.PRIMARY[100], 0.5),
                                                '&:hover': {
                                                    bgcolor: alpha(COLORS.PRIMARY[200], 0.8),
                                                    transform: 'scale(1.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={() => onDeleteTask(task.id)}
                                            sx={{
                                                color: COLORS.ERROR[600],
                                                bgcolor: alpha(COLORS.ERROR[100], 0.5),
                                                '&:hover': {
                                                    bgcolor: alpha(COLORS.ERROR[200], 0.8),
                                                    transform: 'scale(1.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
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

