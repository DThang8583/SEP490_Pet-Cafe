import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, Divider, alpha, Avatar, Grid, Paper } from '@mui/material';
import { Assignment, CalendarToday, Schedule, Group, Notes, Info, Warning, AccessTime, Person, Work, AttachMoney, LocationOn, Pets, Event } from '@mui/icons-material';
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

    // Get data from task template, fallback to daily task
    const taskPriority = dailyTask.task?.priority || dailyTask.priority;
    const priorityInfo = getPriorityDisplay(taskPriority);

    const taskTitle = dailyTask.task?.title || dailyTask.task?.name || dailyTask.title;
    const taskDescription = dailyTask.task?.description || dailyTask.description;

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
                    <Assignment />
                    📋 Chi tiết nhiệm vụ: {taskTitle}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Title & Status */}
                    <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            {taskTitle}
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
                                        {(dailyTask.slot?.start_time || dailyTask.start_time)?.substring(0, 5)} - {(dailyTask.slot?.end_time || dailyTask.end_time)?.substring(0, 5)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Description */}
                    {taskDescription && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    📄 Mô tả
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: alpha(COLORS.GRAY[50], 0.5), borderRadius: 1, mt: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {taskDescription}
                                    </Typography>
                                </Paper>
                            </Box>
                        </>
                    )}

                    {/* Task Details */}
                    {dailyTask.task && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    📋 Chi tiết nhiệm vụ gốc
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1.5 }}>
                                    {dailyTask.task.image_url && (
                                        <Grid item xs={12} md={4}>
                                            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: COLORS.GRAY[50], borderRadius: 1, minHeight: 150 }}>
                                                <Avatar
                                                    src={dailyTask.task.image_url}
                                                    variant="rounded"
                                                    sx={{ width: '100%', height: 150, maxWidth: 200 }}
                                                />
                                            </Paper>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={dailyTask.task.image_url ? 8 : 12}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Assignment sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Tên nhiệm vụ</Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {dailyTask.task.title || dailyTask.task.name || '--'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            {dailyTask.task.status && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Trạng thái nhiệm vụ</Typography>
                                                        <Chip
                                                            label={dailyTask.task.status === 'ACTIVE' ? 'Hoạt động' : dailyTask.task.status === 'INACTIVE' ? 'Không hoạt động' : dailyTask.task.status}
                                                            size="small"
                                                            color={dailyTask.task.status === 'ACTIVE' ? 'success' : 'default'}
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.task.is_public !== undefined && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Công khai</Typography>
                                                        <Chip
                                                            label={dailyTask.task.is_public ? 'Có' : 'Không'}
                                                            size="small"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.task.estimated_hours !== undefined && dailyTask.task.estimated_hours !== null && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <AccessTime sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Thời gian ước tính</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.task.estimated_hours} giờ
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.task.work_type_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Work sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Loại công việc ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.task.work_type_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.task.service_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Dịch vụ ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.task.service_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}

                    {/* Slot Details */}
                    {dailyTask.slot && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    ⏰ Chi tiết ca làm việc
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1.5 }}>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {dailyTask.slot.start_time?.substring(0, 5)} - {dailyTask.slot.end_time?.substring(0, 5)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            {dailyTask.slot.day_of_week && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CalendarToday sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Ngày trong tuần</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {WEEKDAY_LABELS[dailyTask.slot.day_of_week] || dailyTask.slot.day_of_week}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.specific_date && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Event sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Ngày cụ thể</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {formatDate(dailyTask.slot.specific_date)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.max_capacity !== undefined && dailyTask.slot.max_capacity !== null && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Group sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Sức chứa tối đa</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.max_capacity} người
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.price !== undefined && dailyTask.slot.price !== null && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <AttachMoney sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Giá</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.price.toLocaleString('vi-VN')} VNĐ
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.is_recurring !== undefined && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Event sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Lặp lại</Typography>
                                                        <Chip
                                                            label={dailyTask.slot.is_recurring ? 'Có' : 'Không'}
                                                            size="small"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.service_status && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Trạng thái dịch vụ</Typography>
                                                        <Chip
                                                            label={dailyTask.slot.service_status === 'AVAILABLE' ? 'Khả dụng' : dailyTask.slot.service_status === 'UNAVAILABLE' ? 'Không khả dụng' : dailyTask.slot.service_status}
                                                            size="small"
                                                            color={dailyTask.slot.service_status === 'AVAILABLE' ? 'success' : 'default'}
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={1.5}>
                                            {dailyTask.slot.service_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Info sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Dịch vụ ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.service_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.area_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LocationOn sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Khu vực ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.area_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.pet_group_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Pets sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Nhóm thú cưng ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.pet_group_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {dailyTask.slot.pet_id && (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Pets sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Thú cưng ID</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {dailyTask.slot.pet_id}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}

                    {/* Team Details */}
                    {dailyTask.team && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    👥 Chi tiết team
                                </Typography>
                                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                    {dailyTask.team.leader && (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Person sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Leader</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {dailyTask.team.leader.full_name || dailyTask.team.leader.name || '--'}
                                                </Typography>
                                                {dailyTask.team.leader.email && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        {dailyTask.team.leader.email}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    )}
                                    {dailyTask.team.team_members && dailyTask.team.team_members.length > 0 && (
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Group sx={{ color: COLORS.GRAY[500], fontSize: 18, mt: 0.5 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Thành viên ({dailyTask.team.team_members.length})</Typography>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 0.5 }}>
                                                    {dailyTask.team.team_members.slice(0, 5).map((member, idx) => (
                                                        <Chip
                                                            key={member.employee?.id || member.employee_id || idx}
                                                            label={member.employee?.full_name || '--'}
                                                            size="small"
                                                            sx={{ height: 24 }}
                                                        />
                                                    ))}
                                                    {dailyTask.team.team_members.length > 5 && (
                                                        <Chip
                                                            label={`+${dailyTask.team.team_members.length - 5}`}
                                                            size="small"
                                                            sx={{ height: 24 }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    )}
                                    {dailyTask.team.team_work_types && dailyTask.team.team_work_types.length > 0 && (
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Work sx={{ color: COLORS.GRAY[500], fontSize: 18, mt: 0.5 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Loại công việc ({dailyTask.team.team_work_types.length})</Typography>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 0.5 }}>
                                                    {dailyTask.team.team_work_types.map((twt, idx) => (
                                                        <Chip
                                                            key={twt.id || twt.work_type_id || idx}
                                                            label={twt.work_type?.name || '--'}
                                                            size="small"
                                                            sx={{ height: 24 }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    )}
                                    {dailyTask.team.team_work_shifts && dailyTask.team.team_work_shifts.length > 0 && (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Schedule sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Ca làm việc ({dailyTask.team.team_work_shifts.length})</Typography>
                                                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                                    {dailyTask.team.team_work_shifts.length} ca
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

                    {/* Metadata */}
                    {(dailyTask.created_at || dailyTask.updated_at) && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} color={COLORS.PRIMARY[700]} gutterBottom>
                                    📅 Thông tin hệ thống
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1.5 }}>
                                    {dailyTask.created_at && (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <CalendarToday sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(dailyTask.created_at)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}
                                    {dailyTask.updated_at && (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <AccessTime sx={{ color: COLORS.GRAY[500], fontSize: 18 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Ngày cập nhật</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(dailyTask.updated_at)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            </Box>
                        </>
                    )}
                </Stack>
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

