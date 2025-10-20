import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Chip, Box, Divider, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ExpandMore } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import workshiftApi from '../../../api/workshiftApi';
import slotApi from '../../../api/slotApi';

const formatDate = (d) => new Date(d).toISOString().slice(0, 10);

// Helper: Lấy tuần từ date string
const getWeekDates = (weekString) => {
    // weekString format: "2025-W42" (year-week)
    const [year, week] = weekString.split('-W').map(Number);
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const firstDayOfWeek = new Date(firstDayOfYear);
    firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysOffset - firstDayOfYear.getDay() + 1); // Monday

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        dates.push(formatDate(date));
    }
    return dates;
};

// Helper: Lấy tất cả ngày trong tháng
const getMonthDates = (monthString) => {
    // monthString format: "2025-10" (year-month)
    const [year, month] = monthString.split('-').map(Number);
    const dates = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        dates.push(formatDate(date));
    }
    return dates;
};

// Helper: Lấy tất cả ngày giữa 2 ngày
const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);
    while (current <= end) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

const generateDailyRange = (task, selectedService) => {
    if (task.timeframeType === 'day') {
        return [task.date];
    } else if (task.timeframeType === 'week') {
        return getWeekDates(task.week);
    } else if (task.timeframeType === 'month') {
        return getMonthDates(task.month);
    } else if (task.timeframeType === 'service_period') {
        const startDate = selectedService?.startDate || task.servicePeriodStart;
        const endDate = selectedService?.endDate || task.servicePeriodEnd;
        if (startDate && endDate) {
            return getDatesBetween(startDate, endDate);
        }
    }

    // Fallback
    return [formatDate(Date.now())];
};

const TaskDetailsModal = ({ open, onClose, task, services, areas, staff, petGroupsMap }) => {
    const [allShifts, setAllShifts] = React.useState([]);
    const [allSlots, setAllSlots] = React.useState([]);

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
        if (open && task) {
            loadShifts();
        }
    }, [open, task]);

    // Load all slots for service tasks
    React.useEffect(() => {
        const loadSlots = async () => {
            if (open && task?.type === 'service' && task?.serviceId) {
                try {
                    const response = await slotApi.getSlotsByService(task.serviceId);
                    setAllSlots(response?.data || []);
                } catch (err) {
                    console.error('Error loading slots:', err);
                    setAllSlots([]);
                }
            }
        };
        loadSlots();
    }, [open, task?.type, task?.serviceId]);

    // Get shift details by ID
    const getShiftDetails = (shiftId) => {
        return (allShifts || []).find(s => s.id === shiftId);
    };

    // Get slot details by ID
    const getSlotDetails = (slotId) => {
        return (allSlots || []).find(s => s.id === slotId);
    };

    const selectedService = services?.find(s => s.id === task?.serviceId);

    const dates = React.useMemo(() => task ? generateDailyRange(task, selectedService) : [], [task, selectedService]);
    const statusesMap = React.useMemo(() => {
        const map = {};
        (task?.dailyStatuses || []).forEach(d => { map[d.date] = d.status; });
        dates.forEach(d => { if (!map[d]) map[d] = 'pending'; });
        return map;
    }, [task, dates]);

    if (!task) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, color: COLORS.ERROR[600] }}>Chi tiết nhiệm vụ</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Thông tin cơ bản */}
                    <Paper sx={{ p: 2, backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: COLORS.ERROR[600] }}>
                            Thông tin chung
                        </Typography>
                        <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 120, color: COLORS.TEXT.SECONDARY }}>
                                    Loại:
                                </Typography>
                                <Chip
                                    label={task.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}
                                    size="small"
                                    sx={{
                                        background: task.type === 'internal' ? alpha(COLORS.INFO[100], 0.8) : alpha(COLORS.SUCCESS[100], 0.8),
                                        color: task.type === 'internal' ? COLORS.INFO[700] : COLORS.SUCCESS[700],
                                        fontWeight: 700
                                    }}
                                />
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 120, color: COLORS.TEXT.SECONDARY }}>
                                    Nhiệm vụ:
                                </Typography>
                                <Typography variant="body2">
                                    {task.type === 'internal' ? (task.internalName || '—') : (selectedService?.name || '—')}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 120, color: COLORS.TEXT.SECONDARY }}>
                                    Thời gian:
                                </Typography>
                                <Typography variant="body2">
                                    {(() => {
                                        if (task.timeframeType === 'day') {
                                            // Format: DD/MM/YYYY
                                            const date = new Date(task.date);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${day}/${month}/${year}`;
                                        }

                                        if (task.timeframeType === 'week') {
                                            // Format: DD/MM/YYYY - DD/MM/YYYY
                                            const weekDates = getWeekDates(task.week);
                                            const startDate = new Date(weekDates[0]);
                                            const endDate = new Date(weekDates[weekDates.length - 1]);

                                            const startDay = String(startDate.getDate()).padStart(2, '0');
                                            const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                                            const startYear = startDate.getFullYear();

                                            const endDay = String(endDate.getDate()).padStart(2, '0');
                                            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                                            const endYear = endDate.getFullYear();

                                            return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
                                        }

                                        if (task.timeframeType === 'month') {
                                            // Format: MM/YYYY
                                            const [year, month] = task.month.split('-');
                                            return `${month}/${year}`;
                                        }

                                        if (task.timeframeType === 'service_period') {
                                            // Format: DD/MM/YYYY - DD/MM/YYYY
                                            const startDate = new Date(selectedService?.startDate || task.servicePeriodStart);
                                            const endDate = new Date(selectedService?.endDate || task.servicePeriodEnd);

                                            const startDay = String(startDate.getDate()).padStart(2, '0');
                                            const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                                            const startYear = startDate.getFullYear();

                                            const endDay = String(endDate.getDate()).padStart(2, '0');
                                            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                                            const endYear = endDate.getFullYear();

                                            return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
                                        }

                                        return '—';
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 120, color: COLORS.TEXT.SECONDARY }}>
                                    {task.type === 'internal' ? 'Ca làm:' : 'Khung giờ:'}
                                </Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {task.type === 'internal' ? (
                                        // Internal tasks: show shifts
                                        (task.shifts || []).length > 0 ? (
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
                                                            background: alpha(COLORS.PRIMARY[100], 0.7),
                                                            color: COLORS.PRIMARY[700],
                                                            fontWeight: 600,
                                                            mb: 0.5,
                                                            height: 'auto',
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
                                            <Typography variant="body2">—</Typography>
                                        )
                                    ) : (
                                        // Service tasks: show slots
                                        (task.selectedTimeSlots || []).length > 0 ? (
                                            (task.selectedTimeSlots || []).map(slotId => {
                                                const slotDetails = getSlotDetails(slotId);
                                                return (
                                                    <Chip
                                                        key={slotId}
                                                        label={slotDetails
                                                            ? `${slotDetails.start_time?.substring(0, 5)} - ${slotDetails.end_time?.substring(0, 5)}`
                                                            : slotId}
                                                        size="small"
                                                        sx={{
                                                            background: alpha(COLORS.PRIMARY[100], 0.7),
                                                            color: COLORS.PRIMARY[700],
                                                            fontWeight: 600,
                                                            mb: 0.5,
                                                            height: 'auto',
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
                                            <Typography variant="body2">—</Typography>
                                        )
                                    )}
                                </Stack>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Phân công chi tiết */}
                    <Paper sx={{ p: 2, backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5) }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: COLORS.ERROR[600] }}>
                            Phân công chi tiết
                        </Typography>
                        {task.type === 'internal' ? (
                            (task.shifts || []).length > 1 ? (
                                <Stack spacing={2}>
                                    {(task.shifts || []).map(shiftId => {
                                        const assignment = task.shiftAssignments?.[shiftId];
                                        const shiftDetails = getShiftDetails(shiftId);
                                        return (
                                            <Accordion key={shiftId} defaultExpanded={false}>
                                                <AccordionSummary
                                                    expandIcon={<ExpandMore />}
                                                    sx={{
                                                        backgroundColor: alpha(COLORS.PRIMARY[50], 0.5),
                                                        '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[100], 0.5) }
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                                        🕐 Ca làm: {shiftDetails
                                                            ? `${shiftDetails.name} (${shiftDetails.start_time?.substring(0, 5)} - ${shiftDetails.end_time?.substring(0, 5)})`
                                                            : shiftId}
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ pt: 2 }}>
                                                    <Stack spacing={2}>
                                                        {/* Khu vực */}
                                                        <Box>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                📍 Khu vực ({assignment?.areaIds?.length || 0})
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                {(assignment?.areaIds || []).map(areaId => {
                                                                    const area = areas?.find(a => a.id === areaId);
                                                                    return (
                                                                        <Chip
                                                                            key={areaId}
                                                                            label={area?.name || areaId}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 20,
                                                                                fontSize: '0.65rem',
                                                                                mb: 0.5,
                                                                                background: alpha(COLORS.PRIMARY[100], 0.6),
                                                                                color: COLORS.PRIMARY[700]
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Box>

                                                        {/* Nhóm pet */}
                                                        <Box>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                🐾 Nhóm pet ({assignment?.petGroups?.length || 0})
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                {(assignment?.petGroups || []).map((pg, idx) => (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={`${pg.groupName} (${pg.count} con)`}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.65rem',
                                                                            mb: 0.5,
                                                                            background: alpha(COLORS.SECONDARY[100], 0.6),
                                                                            color: COLORS.SECONDARY[700]
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                        </Box>

                                                        {/* Nhóm nhân viên */}
                                                        <Box>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                👥 Nhóm nhân viên ({assignment?.staffGroups?.length || 0})
                                                            </Typography>
                                                            <Stack spacing={1}>
                                                                {(assignment?.staffGroups || []).map((sg, idx) => {
                                                                    const leader = staff?.find(s => s.id === sg.leaderId);
                                                                    return (
                                                                        <Box key={idx} sx={{
                                                                            p: 1,
                                                                            borderRadius: 1,
                                                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                                            backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.3)
                                                                        }}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                                {sg.name}
                                                                            </Typography>
                                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', fontSize: '0.65rem' }}>
                                                                                Leader: {leader?.full_name || '—'}
                                                                            </Typography>
                                                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                                                                {[...(sg.staffIds || [])].sort((a, b) => {
                                                                                    if (a === sg.leaderId) return -1;
                                                                                    if (b === sg.leaderId) return 1;
                                                                                    return 0;
                                                                                }).map(staffId => {
                                                                                    const member = staff?.find(s => s.id === staffId);
                                                                                    const isLeader = staffId === sg.leaderId;
                                                                                    return member ? (
                                                                                        <Chip
                                                                                            key={staffId}
                                                                                            label={member.full_name}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                height: 18,
                                                                                                fontSize: '0.65rem',
                                                                                                backgroundColor: isLeader
                                                                                                    ? alpha(COLORS.ERROR[100], 0.5)
                                                                                                    : alpha(COLORS.INFO[100], 0.5),
                                                                                                color: isLeader
                                                                                                    ? COLORS.ERROR[700]
                                                                                                    : COLORS.INFO[700]
                                                                                            }}
                                                                                        />
                                                                                    ) : null;
                                                                                })}
                                                                            </Stack>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </AccordionDetails>
                                            </Accordion>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                // Single shift - display without accordion
                                (task.shifts || []).length === 1 && (() => {
                                    const shift = task.shifts[0];
                                    const assignment = task.shiftAssignments?.[shift];
                                    return (
                                        <Stack spacing={2}>
                                            {/* Khu vực */}
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                    📍 Khu vực ({assignment?.areaIds?.length || 0})
                                                </Typography>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {(assignment?.areaIds || []).map(areaId => {
                                                        const area = areas?.find(a => a.id === areaId);
                                                        return (
                                                            <Chip
                                                                key={areaId}
                                                                label={area?.name || areaId}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    mb: 0.5,
                                                                    background: alpha(COLORS.PRIMARY[100], 0.6),
                                                                    color: COLORS.PRIMARY[700]
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>

                                            {/* Nhóm pet */}
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                    🐾 Nhóm pet ({assignment?.petGroups?.length || 0})
                                                </Typography>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {(assignment?.petGroups || []).map((pg, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={`${pg.groupName} (${pg.count} con)`}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.65rem',
                                                                mb: 0.5,
                                                                background: alpha(COLORS.SECONDARY[100], 0.6),
                                                                color: COLORS.SECONDARY[700]
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>

                                            {/* Nhóm nhân viên */}
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                    👥 Nhóm nhân viên ({assignment?.staffGroups?.length || 0})
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {(assignment?.staffGroups || []).map((sg, idx) => {
                                                        const leader = staff?.find(s => s.id === sg.leaderId);
                                                        return (
                                                            <Box key={idx} sx={{
                                                                p: 1,
                                                                borderRadius: 1,
                                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.3)
                                                            }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                    {sg.name}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', fontSize: '0.65rem' }}>
                                                                    Leader: {leader?.full_name || '—'}
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                                                    {[...(sg.staffIds || [])].sort((a, b) => {
                                                                        if (a === sg.leaderId) return -1;
                                                                        if (b === sg.leaderId) return 1;
                                                                        return 0;
                                                                    }).map(staffId => {
                                                                        const member = staff?.find(s => s.id === staffId);
                                                                        const isLeader = staffId === sg.leaderId;
                                                                        return member ? (
                                                                            <Chip
                                                                                key={staffId}
                                                                                label={member.full_name}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 18,
                                                                                    fontSize: '0.65rem',
                                                                                    backgroundColor: isLeader
                                                                                        ? alpha(COLORS.ERROR[100], 0.5)
                                                                                        : alpha(COLORS.INFO[100], 0.5),
                                                                                    color: isLeader
                                                                                        ? COLORS.ERROR[700]
                                                                                        : COLORS.INFO[700]
                                                                                }}
                                                                            />
                                                                        ) : null;
                                                                    })}
                                                                </Stack>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    );
                                })()
                            )
                        ) : (
                            <Stack spacing={2}>
                                {(task.selectedTimeSlots || []).map((ts, tsIdx) => {
                                    const assignment = task.timeSlotAssignments?.[ts];
                                    const slotDetails = getSlotDetails(ts);
                                    return (
                                        <Accordion key={tsIdx} defaultExpanded={tsIdx === 0}>
                                            <AccordionSummary expandIcon={<ExpandMore />} sx={{
                                                backgroundColor: alpha(COLORS.PRIMARY[50], 0.5),
                                                '&:hover': { backgroundColor: alpha(COLORS.PRIMARY[100], 0.5) }
                                            }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                                    ⏰ Khung giờ: {slotDetails
                                                        ? `${slotDetails.start_time?.substring(0, 5)} - ${slotDetails.end_time?.substring(0, 5)}`
                                                        : String(ts)}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 2 }}>
                                                <Stack spacing={3}>
                                                    {/* Phân công */}
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1.5 }}>
                                                            Phân công
                                                        </Typography>
                                                        <Stack spacing={2}>
                                                            {/* Khu vực */}
                                                            <Box>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                    📍 Khu vực ({assignment?.areaIds?.length || 0})
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                    {(assignment?.areaIds || []).map(areaId => {
                                                                        const area = areas?.find(a => a.id === areaId);
                                                                        return (
                                                                            <Chip
                                                                                key={areaId}
                                                                                label={area?.name || areaId}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 20,
                                                                                    fontSize: '0.65rem',
                                                                                    mb: 0.5,
                                                                                    background: alpha(COLORS.PRIMARY[100], 0.6),
                                                                                    color: COLORS.PRIMARY[700]
                                                                                }}
                                                                            />
                                                                        );
                                                                    })}
                                                                </Stack>
                                                            </Box>

                                                            {/* Nhóm pet */}
                                                            <Box>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                    🐾 Nhóm pet ({assignment?.petGroups?.length || 0})
                                                                </Typography>
                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                    {(assignment?.petGroups || []).map((pg, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={`${pg.groupName} (${pg.count} con)`}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 20,
                                                                                fontSize: '0.65rem',
                                                                                mb: 0.5,
                                                                                background: alpha(COLORS.SECONDARY[100], 0.6),
                                                                                color: COLORS.SECONDARY[700]
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </Box>

                                                            {/* Nhóm nhân viên */}
                                                            <Box>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY, mb: 0.5, display: 'block' }}>
                                                                    👥 Nhóm nhân viên ({assignment?.staffGroups?.length || 0})
                                                                </Typography>
                                                                <Stack spacing={1}>
                                                                    {(assignment?.staffGroups || []).map((sg, idx) => {
                                                                        const leader = staff?.find(s => s.id === sg.leaderId);
                                                                        return (
                                                                            <Box key={idx} sx={{
                                                                                p: 1,
                                                                                borderRadius: 1,
                                                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`,
                                                                                backgroundColor: alpha(COLORS.BACKGROUND.DEFAULT, 0.3)
                                                                            }}>
                                                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                                    {sg.name}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', fontSize: '0.65rem' }}>
                                                                                    Leader: {leader?.full_name || '—'}
                                                                                </Typography>
                                                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                                                                    {[...(sg.staffIds || [])].sort((a, b) => {
                                                                                        if (a === sg.leaderId) return -1;
                                                                                        if (b === sg.leaderId) return 1;
                                                                                        return 0;
                                                                                    }).map(staffId => {
                                                                                        const member = staff?.find(s => s.id === staffId);
                                                                                        const isLeader = staffId === sg.leaderId;
                                                                                        return member ? (
                                                                                            <Chip
                                                                                                key={staffId}
                                                                                                label={member.full_name}
                                                                                                size="small"
                                                                                                sx={{
                                                                                                    height: 18,
                                                                                                    fontSize: '0.65rem',
                                                                                                    backgroundColor: isLeader
                                                                                                        ? alpha(COLORS.ERROR[100], 0.5)
                                                                                                        : alpha(COLORS.INFO[100], 0.5),
                                                                                                    color: isLeader
                                                                                                        ? COLORS.ERROR[700]
                                                                                                        : COLORS.INFO[700]
                                                                                                }}
                                                                                            />
                                                                                        ) : null;
                                                                                    })}
                                                                                </Stack>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Stack>
                                                            </Box>
                                                        </Stack>
                                                    </Box>

                                                    <Divider />

                                                    {/* Trạng thái theo ngày */}
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1.5 }}>
                                                            📅 Trạng thái theo ngày ({dates.length} ngày)
                                                        </Typography>
                                                        <Stack spacing={1}>
                                                            {dates.map((d, idx) => {
                                                                const dateObj = new Date(d);
                                                                const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                                                const dayName = dayNames[dateObj.getDay()];
                                                                const isCompleted = statusesMap[d] === 'done';

                                                                return (
                                                                    <Stack key={d} direction="row" alignItems="center" spacing={2} sx={{
                                                                        p: 1,
                                                                        borderRadius: 1,
                                                                        border: `1px solid ${alpha(isCompleted ? COLORS.SUCCESS[200] : COLORS.WARNING[200], 0.5)}`,
                                                                        backgroundColor: isCompleted
                                                                            ? alpha(COLORS.SUCCESS[50], 0.3)
                                                                            : COLORS.BACKGROUND.DEFAULT
                                                                    }}>
                                                                        <Box sx={{ minWidth: 35, textAlign: 'center' }}>
                                                                            <Typography variant="caption" sx={{
                                                                                fontWeight: 700,
                                                                                color: COLORS.TEXT.SECONDARY,
                                                                                display: 'block',
                                                                                fontSize: '0.65rem'
                                                                            }}>
                                                                                Ngày {idx + 1}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Box sx={{ flex: 1 }}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                                {dayName}, {d}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Chip
                                                                            size="small"
                                                                            label={isCompleted ? '✓ Hoàn thành' : 'Chưa hoàn thành'}
                                                                            sx={{
                                                                                background: isCompleted
                                                                                    ? alpha(COLORS.SUCCESS[100], 0.8)
                                                                                    : alpha(COLORS.WARNING[100], 0.6),
                                                                                color: isCompleted
                                                                                    ? COLORS.SUCCESS[700]
                                                                                    : COLORS.WARNING[700],
                                                                                fontWeight: 700,
                                                                                height: 20,
                                                                                fontSize: '0.65rem',
                                                                                minWidth: 120
                                                                            }}
                                                                        />
                                                                    </Stack>
                                                                );
                                                            })}
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })}
                                {(!task.selectedTimeSlots || task.selectedTimeSlots.length === 0) && (
                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                        Chưa chọn khung giờ nào
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Paper>

                    {/* Trạng thái theo ngày - Only for single shift internal tasks */}
                    {(task.type === 'internal' && (task.shifts || []).length === 1) && (
                        <Paper sx={{ p: 2, backgroundColor: alpha(COLORS.WARNING[50], 0.3) }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: COLORS.ERROR[600] }}>
                                📅 Trạng thái theo ngày ({dates.length} ngày)
                            </Typography>
                            <Stack spacing={1}>
                                {dates.map((d, idx) => {
                                    const dateObj = new Date(d);
                                    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                    const dayName = dayNames[dateObj.getDay()];

                                    // For single shift internal task, use shift_date format
                                    const statusKey = task.type === 'internal' && task.shifts?.length === 1
                                        ? `${task.shifts[0]}_${d}`
                                        : d;
                                    const isCompleted = statusesMap[statusKey] === 'done';

                                    return (
                                        <Stack key={d} direction="row" alignItems="center" spacing={2} sx={{
                                            p: 1.5,
                                            borderRadius: 1,
                                            border: `1px solid ${alpha(isCompleted ? COLORS.SUCCESS[200] : COLORS.WARNING[200], 0.5)}`,
                                            backgroundColor: isCompleted
                                                ? alpha(COLORS.SUCCESS[50], 0.3)
                                                : COLORS.BACKGROUND.DEFAULT
                                        }}>
                                            <Box sx={{ minWidth: 40, textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 700,
                                                    color: COLORS.TEXT.SECONDARY,
                                                    display: 'block'
                                                }}>
                                                    Ngày {idx + 1}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {dayName}, {d}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={isCompleted ? '✓ Hoàn thành' : 'Chưa hoàn thành'}
                                                sx={{
                                                    background: isCompleted
                                                        ? alpha(COLORS.SUCCESS[100], 0.8)
                                                        : alpha(COLORS.WARNING[100], 0.6),
                                                    color: isCompleted
                                                        ? COLORS.SUCCESS[700]
                                                        : COLORS.WARNING[700],
                                                    fontWeight: 700,
                                                    minWidth: 140
                                                }}
                                            />
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDetailsModal;


