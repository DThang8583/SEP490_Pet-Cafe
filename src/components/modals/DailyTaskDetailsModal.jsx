import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, alpha, Avatar, Grid, Paper } from '@mui/material';
import { Assignment, CalendarToday, Schedule, Group, Info, AttachMoney, LocationOn, Event, AccessTime } from '@mui/icons-material';
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

    // Get priority display (không dùng emoji để chuyên nghiệp hơn)
    const getPriorityDisplay = (priority) => {
        const priorityConfig = {
            [TASK_PRIORITY.URGENT]: {
                label: 'Khẩn cấp',
                color: COLORS.ERROR[600],
                bgcolor: alpha(COLORS.ERROR[50], 0.5)
            },
            [TASK_PRIORITY.HIGH]: {
                label: 'Cao',
                color: COLORS.WARNING[700],
                bgcolor: alpha(COLORS.WARNING[50], 0.5)
            },
            [TASK_PRIORITY.MEDIUM]: {
                label: 'Trung bình',
                color: COLORS.INFO[600],
                bgcolor: alpha(COLORS.INFO[50], 0.5)
            },
            [TASK_PRIORITY.LOW]: {
                label: 'Thấp',
                color: COLORS.SUCCESS[600],
                bgcolor: alpha(COLORS.SUCCESS[50], 0.5)
            }
        };
        return priorityConfig[priority] || priorityConfig[TASK_PRIORITY.MEDIUM];
    };

    const statusInfo = getStatusDisplay(dailyTask.status);

    // Destructure frequently used fields để JSX gọn hơn
    const slot = dailyTask.slot;
    const templateTask = dailyTask.task;

    // Get data from task template, fallback to daily task
    const taskPriority = templateTask?.priority || dailyTask.priority;
    const priorityInfo = getPriorityDisplay(taskPriority);

    const taskTitle = templateTask?.title || templateTask?.name || dailyTask.title;
    const taskDescription = templateTask?.description || dailyTask.description;

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        color: COLORS.PRIMARY[700],
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    <Assignment />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            Chi tiết nhiệm vụ
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {taskTitle}
                        </Typography>
                    </Box>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Box sx={{ maxWidth: 960, mx: 'auto' }}>
                    <Stack spacing={2.5}>
                        {/* Status & Priority chips */}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
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
                                label={priorityInfo.label}
                                size="small"
                                sx={{
                                    bgcolor: priorityInfo.bgcolor,
                                    color: priorityInfo.color,
                                    fontWeight: 600,
                                    borderRadius: 1.5
                                }}
                            />
                        </Stack>

                        {/* Overview in 2 columns */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.25,
                                borderRadius: 2.5,
                                border: `1px solid ${alpha(COLORS.PRIMARY[100], 0.8)}`,
                                bgcolor: alpha(COLORS.PRIMARY[50], 0.25)
                            }}
                        >
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                            bgcolor: COLORS.BACKGROUND.DEFAULT
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={800}
                                            color={COLORS.PRIMARY[700]}
                                            gutterBottom
                                            sx={{ letterSpacing: 0.3 }}
                                        >
                                            Thông tin nhiệm vụ
                                        </Typography>
                                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Group sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Team</Typography>
                                                    <Typography variant="body1" fontWeight={600}>
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
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {formatDate(dailyTask.assigned_date)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 20 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                                    <Typography variant="body1" fontWeight={600}>
                                                        {(slot?.start_time || dailyTask.start_time)?.substring(0, 5)} - {(slot?.end_time || dailyTask.end_time)?.substring(0, 5)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    {slot && (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                                bgcolor: COLORS.BACKGROUND.DEFAULT
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={800}
                                                color={COLORS.PRIMARY[700]}
                                                gutterBottom
                                                sx={{ letterSpacing: 0.3 }}
                                            >
                                                Ca làm việc
                                            </Typography>
                                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                                        <Typography variant="body1" fontWeight={600}>
                                                            {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                                {slot.day_of_week && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <CalendarToday sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">Ngày trong tuần</Typography>
                                                            <Typography variant="body1" fontWeight={500}>
                                                                {WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                )}
                                                {slot.max_capacity !== undefined && slot.max_capacity !== null && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Group sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">Sức chứa tối đa</Typography>
                                                            <Typography variant="body1" fontWeight={500}>
                                                                {slot.max_capacity} người
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                )}
                                                {slot.price !== undefined && slot.price !== null && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <AttachMoney sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">Giá</Typography>
                                                            <Typography variant="body1" fontWeight={600}>
                                                                {slot.price.toLocaleString('vi-VN')} VNĐ
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                )}
                                                {slot.area && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LocationOn sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">Khu vực</Typography>
                                                            <Typography variant="body1" fontWeight={500}>
                                                                {slot.area.name || slot.area_id || '--'}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Description (gọn, có giới hạn chiều cao) */}
                        {taskDescription && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.25,
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                    maxHeight: 180,
                                    overflow: 'auto',
                                    bgcolor: COLORS.BACKGROUND.DEFAULT
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={800}
                                    color={COLORS.PRIMARY[700]}
                                    gutterBottom
                                    sx={{ letterSpacing: 0.3 }}
                                >
                                    Mô tả nhiệm vụ
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {taskDescription}
                                </Typography>
                            </Paper>
                        )}

                        {/* Nhiệm vụ mẫu & hoàn thành – hiển thị dạng card, không dropdown */}
                        <Grid container spacing={2.5}>
                            {templateTask && (
                                <Grid item xs={12} md={dailyTask.completion_date ? 6 : 12}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.25,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                            bgcolor: COLORS.BACKGROUND.DEFAULT
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={800}
                                            color={COLORS.PRIMARY[700]}
                                            gutterBottom
                                            sx={{ letterSpacing: 0.3 }}
                                        >
                                            Chi tiết nhiệm vụ mẫu
                                        </Typography>
                                        <Stack direction="row" spacing={2}>
                                            {templateTask.image_url && (
                                                <Avatar
                                                    src={templateTask.image_url}
                                                    variant="rounded"
                                                    sx={{ width: 72, height: 72 }}
                                                />
                                            )}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Tên nhiệm vụ</Typography>
                                                <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                                                    {templateTask.title || templateTask.name || '--'}
                                                </Typography>
                                                <Stack spacing={0.75}>
                                                    {templateTask.status && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                            <Chip
                                                                label={templateTask.status === 'ACTIVE' ? 'Hoạt động' : templateTask.status === 'INACTIVE' ? 'Không hoạt động' : templateTask.status}
                                                                size="small"
                                                                color={dailyTask.task.status === 'ACTIVE' ? 'success' : 'default'}
                                                            />
                                                        </Stack>
                                                    )}
                                                    {templateTask.is_public !== undefined && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                Công khai: {templateTask.is_public ? 'Có' : 'Không'}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {templateTask.estimated_hours !== undefined && templateTask.estimated_hours !== null && (
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <AccessTime sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                Thời gian ước tính: {templateTask.estimated_hours} giờ
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            )}

                            {dailyTask.completion_date && (
                                <Grid item xs={12} md={templateTask ? 6 : 12}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.25,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                            bgcolor: COLORS.BACKGROUND.DEFAULT
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={800}
                                            color={COLORS.PRIMARY[700]}
                                            gutterBottom
                                            sx={{ letterSpacing: 0.3 }}
                                        >
                                            Thông tin hoàn thành
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Ngày hoàn thành: {formatDate(dailyTask.completion_date)}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`,
                px: 3,
                py: 2,
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

