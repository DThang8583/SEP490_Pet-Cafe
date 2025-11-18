import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Chip, Stack, alpha } from '@mui/material';
import { Notes, CheckCircle, PlayArrow, Cancel } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { DAILY_TASK_STATUS } from '../../api/dailyTasksApi';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const DailyTaskNotesModal = ({ open, onClose, onSubmit, dailyTask, newStatus, taskName, slotInfo }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && dailyTask) {
            setNotes(dailyTask.notes || '');
        }
    }, [open, dailyTask]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(notes);
            handleClose();
        } catch (error) {
            console.error('Error submitting notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setNotes('');
            onClose();
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case DAILY_TASK_STATUS.COMPLETED:
                return {
                    icon: <CheckCircle />,
                    label: 'Hoàn thành',
                    color: COLORS.SUCCESS[600]
                };
            case DAILY_TASK_STATUS.IN_PROGRESS:
                return {
                    icon: <PlayArrow />,
                    label: 'Đang thực hiện',
                    color: COLORS.INFO[600]
                };
            case DAILY_TASK_STATUS.CANCELLED:
                return {
                    icon: <Cancel />,
                    label: 'Hủy bỏ',
                    color: COLORS.WARNING[600]
                };
            case DAILY_TASK_STATUS.MISSED:
                return {
                    icon: <Cancel />,
                    label: 'Bỏ lỡ',
                    color: COLORS.ERROR[600]
                };
            case DAILY_TASK_STATUS.SKIPPED:
                return {
                    icon: <Cancel />,
                    label: 'Bỏ qua',
                    color: COLORS.WARNING[500]
                };
            default:
                return null;
        }
    };

    const statusInfo = getStatusInfo(newStatus);

    if (!dailyTask) return null;

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
                    background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.PRIMARY[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notes />
                    📝 Báo cáo tiến độ
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {/* Task Info */}
                <Box sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: alpha(COLORS.GRAY[50], 0.5),
                    border: `1px solid ${COLORS.BORDER.DEFAULT}`
                }}>
                    <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                            Nhiệm vụ
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {taskName}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                            {dailyTask.assigned_date && (
                                <Chip
                                    label={new Date(dailyTask.assigned_date).toLocaleDateString('vi-VN', { weekday: 'long' })}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {slotInfo}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                {/* New Status */}
                {statusInfo && (
                    <Box sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(statusInfo.color, 0.1),
                        border: `2px solid ${alpha(statusInfo.color, 0.3)}`
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            {statusInfo.icon}
                            <Typography variant="body1" fontWeight={600} color={statusInfo.color}>
                                Trạng thái mới: {statusInfo.label}
                            </Typography>
                        </Stack>
                    </Box>
                )}

                {/* Notes Input */}
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Ghi chú (Tùy chọn)"
                    placeholder="Nhập ghi chú về tiến độ, vấn đề gặp phải, hoặc những điều cần lưu ý..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    helperText="Ghi chú sẽ được lưu lại trong lịch sử báo cáo"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'white'
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                py: 2,
                gap: 1.5
            }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        minWidth: 100,
                        bgcolor: statusInfo?.color,
                        '&:hover': {
                            bgcolor: statusInfo?.color,
                            opacity: 0.9
                        }
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Xác nhận'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DailyTaskNotesModal;

