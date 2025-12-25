import { useMemo, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Paper, Tooltip, Alert, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { WEEKDAY_LABELS } from '../../api/slotApi';

// Constants moved outside component for better performance
const WEEKDAY_ORDER = {
    'MONDAY': 0,
    'TUESDAY': 1,
    'WEDNESDAY': 2,
    'THURSDAY': 3,
    'FRIDAY': 4,
    'SATURDAY': 5,
    'SUNDAY': 6
};

const SlotDetailsModal = ({
    open,
    onClose,
    taskData,
    slots = [],
    onCreateSlot,
    onEditSlot,
    onDeleteSlot,
    onRefresh,
    showCreateAction = false,
    showActionsColumn = true
}) => {
    // Memoize filtered and sorted slots
    const taskSlots = useMemo(() => {
        if (!open || !taskData || !slots || !Array.isArray(slots)) return [];

        // Filter slots for this task
        const filtered = slots.filter(slot => slot.task_id === taskData.id);

        // Sort by weekday order (Monday first) and then by start_time
        return [...filtered].sort((a, b) => {
            const dayA = a.day_of_week || 'MONDAY';
            const dayB = b.day_of_week || 'MONDAY';
            const orderA = WEEKDAY_ORDER[dayA] ?? 999;
            const orderB = WEEKDAY_ORDER[dayB] ?? 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
    }, [open, taskData, slots]);

    // Memoize stats calculation
    const stats = useMemo(() => {
        const total = taskSlots.length;
        let available = 0;
        let unavailable = 0;
        let maintenance = 0;
        let cancelled = 0;

        // Single pass through slots for better performance
        for (const slot of taskSlots) {
            const status = slot.service_status;
            if (status === 'AVAILABLE') available++;
            else if (status === 'UNAVAILABLE') unavailable++;
            else if (status === 'MAINTENANCE') maintenance++;
            else if (status === 'CANCELLED') cancelled++;
        }

        return { total, available, unavailable, maintenance, cancelled };
    }, [taskSlots]);

    // Determine if any slot has a specific_date to decide showing the column
    const hasSpecificDate = useMemo(() => {
        return taskSlots.some(s => !!s.specific_date);
    }, [taskSlots]);

    // Helper to format ISO date -> dd/mm/yyyy
    const formatSpecificDate = useCallback((iso) => {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return iso;
        }
    }, []);

    // Memoize status map
    const statusMap = useMemo(() => ({
        'AVAILABLE': { label: 'Có sẵn', color: COLORS.SUCCESS[700], bg: COLORS.SUCCESS[50] },
        'UNAVAILABLE': { label: 'Không khả dụng', color: COLORS.WARNING[700], bg: COLORS.WARNING[50] },
        'MAINTENANCE': { label: 'Bảo trì', color: COLORS.INFO[700], bg: COLORS.INFO[50] },
        'CANCELLED': { label: 'Đã hủy', color: COLORS.ERROR[700], bg: COLORS.ERROR[50] }
    }), []);

    // Memoize status chip component
    const getStatusChip = useCallback((status) => {
        const config = statusMap[status] || statusMap['AVAILABLE'];
        return (
            <Chip
                label={config.label}
                size="small"
                sx={{
                    bgcolor: alpha(config.bg, 0.8),
                    color: config.color,
                    fontWeight: 600
                }}
            />
        );
    }, [statusMap]);

    // Memoize handlers
    const handleCreateSlot = useCallback(() => {
        onCreateSlot(taskData);
        onClose();
    }, [onCreateSlot, taskData, onClose]);

    const handleEditSlot = useCallback((slot) => {
        onEditSlot(slot);
    }, [onEditSlot]);

    const handleDeleteSlot = useCallback((slotId) => {
        onDeleteSlot(slotId);
    }, [onDeleteSlot]);

    // Memoize price formatter (format number then append ' VNĐ' to avoid currency symbol '₫')
    const formatPrice = useCallback((price) => {
        try {
            const num = Number(price) || 0;
            const formatted = new Intl.NumberFormat('vi-VN', {
                maximumFractionDigits: 0
            }).format(num);
            return `${formatted} VNĐ`;
        } catch (e) {
            return `${price} VNĐ`;
        }
    }, []);

    if (!taskData) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    maxHeight: '90vh'
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
                    <InfoIcon />
                    📅 Chi tiết ca làm việc: {taskData.title || taskData.name}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {/* Statistics */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.PRIMARY[50], 0.5),
                        border: `1px solid ${COLORS.PRIMARY[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.PRIMARY[700]}>
                            {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tổng Ca
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.SUCCESS[50], 0.5),
                        border: `1px solid ${COLORS.SUCCESS[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.SUCCESS[700]}>
                            {stats.available}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Có sẵn
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.WARNING[50], 0.5),
                        border: `1px solid ${COLORS.WARNING[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.WARNING[700]}>
                            {stats.unavailable}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Không khả dụng
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        p: 2,
                        flex: 1,
                        bgcolor: alpha(COLORS.INFO[50], 0.5),
                        border: `1px solid ${COLORS.INFO[200]}`
                    }}>
                        <Typography variant="h4" fontWeight={700} color={COLORS.INFO[700]}>
                            {stats.maintenance}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Bảo trì
                        </Typography>
                    </Paper>
                </Stack>

                {/* Action Buttons */}
                {showCreateAction && (
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateSlot}
                            sx={{
                                bgcolor: COLORS.SUCCESS[600],
                                '&:hover': {
                                    bgcolor: COLORS.SUCCESS[700]
                                },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                        >
                            Tạo Ca mới
                        </Button>
                    </Stack>
                )}

                {/* Slots Table */}
                {taskSlots.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Chưa có slot nào cho task này. Hãy tạo slot đầu tiên!
                        </Typography>
                    </Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: alpha(COLORS.GRAY[100], 0.5) }}>
                            <TableRow>
                                <TableCell width="3%">STT</TableCell>
                                <TableCell width="8%">Ngày</TableCell>
                                {hasSpecificDate && <TableCell width="10%">Ngày cụ thể</TableCell>}
                                <TableCell width="10%">Thời gian</TableCell>
                                <TableCell width="12%">Team</TableCell>
                                <TableCell width="12%">Khu vực</TableCell>
                                <TableCell width="12%">Nhóm Pet</TableCell>
                                <TableCell width="12%">Thú cưng</TableCell>
                                <TableCell width="10%" align="center">Sức chứa</TableCell>
                                {taskData.is_public && <TableCell width="10%" align="right">Giá</TableCell>}
                                <TableCell width="10%" align="center">Trạng thái</TableCell>
                                <TableCell width="8%" align="center">Ghi chú</TableCell>
                                {showActionsColumn && (
                                    <TableCell width="8%" align="center">Thao tác</TableCell>
                                )}
                            </TableRow>
                            </TableHead>
                            <TableBody>
                                {taskSlots.map((slot, index) => (
                                    <TableRow key={slot.id} hover>
                                        <TableCell>{index + 1}</TableCell>

                                        {/* Ngày */}
                                        <TableCell>
                                            <Chip
                                                label={WEEKDAY_LABELS[slot.day_of_week] || slot.day_of_week}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        </TableCell>

                                        {/* Thời gian */}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {slot.start_time} - {slot.end_time}
                                            </Typography>
                                        </TableCell>

                                        {/* Ngày cụ thể (nếu có) */}
                                        {hasSpecificDate && (
                                            <TableCell>
                                                {slot.specific_date ? (
                                                    <Typography variant="body2">{formatSpecificDate(slot.specific_date)}</Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Team */}
                                        <TableCell>
                                            {slot.team ? (
                                                <Tooltip title={slot.team.description || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.team.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Khu vực */}
                                        <TableCell>
                                            {slot.area ? (
                                                <Tooltip title={`${slot.area.location || ''}`}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.area.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Pet Group */}
                                        <TableCell>
                                            {slot.pet_group ? (
                                                <Tooltip title={slot.pet_group.description || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.pet_group.name}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Pet (specific pet assigned) */}
                                        <TableCell>
                                            {slot.pet ? (
                                                <Tooltip title={slot.pet.breed || slot.pet.description || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {slot.pet.name || slot.pet.full_name || slot.pet.display_name || slot.pet.id}
                                                    </Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Sức chứa */}
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={500}>
                                                {slot.max_capacity || 0}
                                            </Typography>
                                        </TableCell>

                                        {/* Giá - Chỉ hiển thị nếu là nhiệm vụ công khai */}
                                        {taskData.is_public && (
                                            <TableCell align="right">
                                                {slot.price && slot.price > 0 ? (
                                                    <Typography variant="body2" fontWeight={500} color={COLORS.SUCCESS[700]}>
                                                        {formatPrice(slot.price)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Trạng thái */}
                                        <TableCell align="center">
                                            {getStatusChip(slot.service_status)}
                                        </TableCell>

                                        {/* Ghi chú */}
                                        <TableCell align="center">
                                            {slot.special_notes ? (
                                                <Tooltip title={slot.special_notes}>
                                                    <IconButton size="small" color="info">
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Thao tác */}
                                        {showActionsColumn && (
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Sửa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditSlot(slot)}
                                                            sx={{
                                                                color: COLORS.PRIMARY[500],
                                                                '&:hover': {
                                                                    bgcolor: alpha(COLORS.PRIMARY[50], 0.5)
                                                                }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            sx={{
                                                                color: COLORS.ERROR[500],
                                                                '&:hover': {
                                                                    bgcolor: alpha(COLORS.ERROR[50], 0.5)
                                                                }
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 100
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SlotDetailsModal;
