import React from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Delete } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';

const TaskList = ({ tasks, services, onDeleteTask }) => {
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
                                    ? task.internalName
                                    : services.find(s => s.id === task.serviceId)?.name}
                            </TableCell>
                            <TableCell>
                                {task.timeframeType === 'day' && task.date}
                                {task.timeframeType === 'week' && `Tuần ${task.week}`}
                                {task.timeframeType === 'month' && task.month}
                                {task.timeframeType === 'service_period' && 'Theo dịch vụ'}
                            </TableCell>
                            <TableCell>{task.shift}</TableCell>
                            <TableCell>
                                {task.type === 'internal' ? (
                                    <Typography variant="caption">
                                        {task.internalAssignment.staffGroups.length} nhóm NV
                                    </Typography>
                                ) : (
                                    <Typography variant="caption">
                                        {task.selectedTimeSlots.length} khung giờ
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDeleteTask(task.id)}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TaskList;

