import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, Divider, alpha } from '@mui/material';
import { Close as CloseIcon, Assignment, CalendarToday, Schedule, Flag, Group, Notes, Info, Warning } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { DAILY_TASK_STATUS, TASK_PRIORITY } from '../../api/dailyTasksApi';
import { WEEKDAY_LABELS } from '../../api/slotApi';

const DailyTaskDetailsModal = ({ open, onClose, dailyTask }) => {
    if (!dailyTask) return null;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get status display
    const getStatusDisplay = (status) => {
        const statusConfig = {
            [DAILY_TASK_STATUS.SCHEDULED]: {
                label: 'Chưa bắt đầu',
                color: COLORS.GRAY[500],
                bgcolor: alpha(COLORS.GRAY[100], 0.5)
            },
            [DAILY_TASK_STATUS.IN_PROGRESS]: {
                label: 'Đang làm',
                color: COLORS.INFO[600],
                bgcolor: alpha(COLORS.INFO[100], 0.5)
            },
            [DAILY_TASK_STATUS.COMPLETED]: {
                label: 'Hoàn thành',
                color: COLORS.SUCCESS[600],
                bgcolor: alpha(COLORS.SUCCESS[100], 0.5)
            },
            [DAILY_TASK_STATUS.CANCELLED]: {
                label: 'Đã hủy',
                color: COLORS.ERROR[600],
                bgcolor: alpha(COLORS.ERROR[100], 0.5)
            },
            [DAILY_TASK_STATUS.MISSED]: {
                label: 'Bỏ lỡ',
                color: COLORS.WARNING[700],
                bgcolor: alpha(COLORS.WARNING[100], 0.5)
            },
            [DAILY_TASK_STATUS.SKIPPED]: {
                label: 'Bỏ qua',
                color: COLORS.GRAY[600],
                bgcolor: alpha(COLORS.GRAY[100], 0.5)
            }
        };
        return statusConfig[status] || statusConfig[DAILY_TASK_STATUS.SCHEDULED];
    };

    // Get priority display
    const getPriorityDisplay = (priority) => {
        const priorityConfig = {
            [TASK_PRIORITY.URGENT]: {
                label: 'Khẩn cấp',
                icon: '🔴',
                color: COLORS.ERROR[600],
                bgcolor: alpha(COLORS.ERROR[50], 0.5)
            },
            [TASK_PRIORITY.HIGH]: {
                label: 'Cao',
                icon: '🟠',
                color: COLORS.WARNING[700],
                bgcolor: alpha(COLORS.WARNING[50], 0.5)
            },
            [TASK_PRIORITY.MEDIUM]: {
                label: 'Trung bình',
                icon: '🟡',
                color: COLORS.INFO[600],
                bgcolor: alpha(COLORS.INFO[50], 0.5)
            },
            [TASK_PRIORITY.LOW]: {
                label: 'Thấp',
                icon: '🟢',
                color: COLORS.SUCCESS[600],
                bgcolor: alpha(COLORS.SUCCESS[50], 0.5)
            }
        };
        return priorityConfig[priority] || priorityConfig[TASK_PRIORITY.MEDIUM];
    };

    const statusInfo = getStatusDisplay(dailyTask.status);
    const priorityInfo = getPriorityDisplay(dailyTask.priority);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: 24
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: `2px solid ${COLORS.PRIMARY[100]}`,
                pb: 2.5,
                pt: 2.5,
                background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.5)} 0%, ${alpha(COLORS.PRIMARY[100], 0.3)} 100%)`
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: COLORS.PRIMARY[100],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Assignment sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color={COLORS.PRIMARY[700]}>
                                Chi tiết nhiệm vụ
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Thông tin đầy đủ về nhiệm vụ hằng ngày
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 3, px: 4 }}>
                <Stack spacing={3}>
                    {/* Title & Status */}
                    <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            {dailyTask.title}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                            <Chip
                                label={statusInfo.label}
                                size="small"
                                sx={{
                                    bgcolor: statusInfo.bgcolor,
                                    color: statusInfo.color,
                                    fontWeight: 600,
                                    borderRadius: 1.5
                                }}
                            />
                            <Chip
                                label={`${priorityInfo.icon} ${priorityInfo.label}`}
                                size="small"
                                sx={{
                                    bgcolor: priorityInfo.bgcolor,
                                    color: priorityInfo.color,
                                    fontWeight: 600,
                                    borderRadius: 1.5
                                }}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Basic Info */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                            📋 Thông tin cơ bản
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                            <Stack direction="row" spacing={1}>
                                <Group sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Team</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {dailyTask.team?.name || '--'}
                                    </Typography>
                                    {dailyTask.team?.description && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {dailyTask.team.description}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <CalendarToday sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Ngày thực hiện</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {formatDate(dailyTask.assigned_date)}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {dailyTask.start_time?.substring(0, 5)} - {dailyTask.end_time?.substring(0, 5)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Task & Slot Info */}
                    {(dailyTask.task || dailyTask.slot) && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    🔗 Liên kết
                                </Typography>
                                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                    {dailyTask.task && (
                                        <Stack direction="row" spacing={1}>
                                            <Assignment sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Nhiệm vụ gốc</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {dailyTask.task.title || dailyTask.task.name}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}

                                    {dailyTask.slot && (
                                        <Stack direction="row" spacing={1}>
                                            <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Ca làm việc</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {dailyTask.slot.start_time?.substring(0, 5)} - {dailyTask.slot.end_time?.substring(0, 5)}
                                                    {dailyTask.slot.day_of_week && ` (${WEEKDAY_LABELS[dailyTask.slot.day_of_week]})`}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            </Box>
                        </>
                    )}

                    {/* Notes */}
                    <Divider />
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                            📝 Ghi chú
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 1.5 }}>
                            {/* Slot Special Notes */}
                            {dailyTask.slot?.special_notes && (
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(COLORS.WARNING[50], 0.5),
                                    border: `1px solid ${COLORS.WARNING[200]}`
                                }}>
                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                        <Warning sx={{ color: COLORS.WARNING[600], fontSize: 20, mt: 0.2 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight={600} color={COLORS.WARNING[700]}>
                                                Hướng dẫn
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {dailyTask.slot.special_notes}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            )}

                            {/* Daily Task Notes */}
                            {dailyTask.notes ? (
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(COLORS.INFO[50], 0.5),
                                    border: `1px solid ${COLORS.INFO[200]}`
                                }}>
                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                        <Notes sx={{ color: COLORS.INFO[600], fontSize: 20, mt: 0.2 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight={600} color={COLORS.INFO[700]}>
                                                Báo cáo
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {dailyTask.notes}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : (
                                !dailyTask.slot?.special_notes && (
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha(COLORS.GRAY[50], 0.5),
                                        border: `1px dashed ${COLORS.GRAY[300]}`,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Chưa có ghi chú
                                        </Typography>
                                    </Box>
                                )
                            )}
                        </Stack>
                    </Box>

                    {/* Completion Info */}
                    {dailyTask.completion_date && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    ✅ Hoàn thành
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Ngày hoàn thành: {formatDate(dailyTask.completion_date)}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${COLORS.GRAY[200]}`,
                px: 4,
                py: 2.5,
                bgcolor: alpha(COLORS.GRAY[50], 0.5)
            }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ minWidth: 120, height: 44, fontWeight: 600 }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DailyTaskDetailsModal;

