import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography, Paper, Avatar, IconButton, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { People, Close, Delete, Add, EventBusy } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const roleLabel = (r) => {
    switch (r) {
        case 'sales_staff': return 'Nhân viên bán hàng';
        case 'working_staff': return 'Nhân viên chăm sóc';
        default: return r;
    }
};

const StaffAssignmentModal = ({
    open,
    onClose,
    shift,
    shiftStaff,
    availableStaff,
    pendingAssignments,
    pendingRemovals,
    loading,
    onAssign,
    onRemove
}) => {
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
                    minHeight: 600,
                    maxWidth: 1200
                }
            }}
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.INFO[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.INFO[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.INFO[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People />
                    👥 Phân công nhân viên: {shift?.name} ({shift?.start_time} - {shift?.end_time})
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6">Đang tải...</Typography>
                    </Box>
                ) : (
                    <Stack direction="row" spacing={4} sx={{ height: '100%', minHeight: 480 }}>
                        {/* Assigned Staff - Left Panel */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, fontSize: '1.15rem' }}>
                                Nhân viên đã phân công ({shiftStaff.length})
                            </Typography>
                            {shiftStaff.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6, bgcolor: COLORS.BACKGROUND.NEUTRAL, borderRadius: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Chưa có nhân viên nào
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', pr: 1.5 }}>
                                    {shiftStaff.map((s) => {
                                        const isPending = pendingAssignments.includes(s.id);
                                        return (
                                            <Paper
                                                key={s.id}
                                                sx={{
                                                    p: 2.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2.5,
                                                    border: isPending ? `2px solid ${COLORS.SUCCESS[500]}` : `1px solid ${COLORS.BORDER.MAIN}`,
                                                    bgcolor: isPending ? alpha(COLORS.SUCCESS[50], 0.5) : 'white',
                                                    borderRadius: 1.5
                                                }}
                                            >
                                                <Avatar src={s.avatar_url} alt={s.full_name} sx={{ width: 48, height: 48 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>{s.full_name}</Typography>
                                                        {isPending && (
                                                            <Chip
                                                                label="Mới"
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: COLORS.SUCCESS[500],
                                                                    color: 'white',
                                                                    height: 22,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.75, fontSize: '0.9rem' }}>
                                                        {roleLabel(s.role)}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="medium"
                                                    color="error"
                                                    onClick={() => onRemove(s.id)}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    <Delete sx={{ fontSize: 20 }} />
                                                </IconButton>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>

                        {/* Available Staff - Right Panel */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, fontSize: '1.15rem' }}>
                                Nhân viên khả dụng
                            </Typography>
                            {availableStaff.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6, bgcolor: COLORS.BACKGROUND.NEUTRAL, borderRadius: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Không còn nhân viên khả dụng
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', pr: 1.5 }}>
                                    {availableStaff.map((s) => (
                                        <Paper
                                            key={s.id}
                                            sx={{
                                                p: 2.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2.5,
                                                opacity: s.hasConflict ? 0.6 : 1,
                                                border: s.hasConflict ? `2px dashed ${COLORS.WARNING[500]}` : `1px solid ${COLORS.BORDER.MAIN}`,
                                                borderRadius: 1.5
                                            }}
                                        >
                                            <Avatar src={s.avatar_url} alt={s.full_name} sx={{ width: 48, height: 48 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>{s.full_name}</Typography>
                                                    {s.hasConflict && (
                                                        <Chip
                                                            label="Trùng ca"
                                                            size="small"
                                                            icon={<EventBusy sx={{ fontSize: 14 }} />}
                                                            sx={{
                                                                bgcolor: alpha(COLORS.WARNING[100], 0.8),
                                                                color: COLORS.WARNING[800],
                                                                height: 22,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.75, fontSize: '0.9rem' }}>
                                                    {roleLabel(s.role)}
                                                </Typography>
                                                {s.conflictShift && (
                                                    <Typography variant="caption" sx={{ color: COLORS.WARNING[700], fontWeight: 600, mt: 0.5, display: 'block' }}>
                                                        "{s.conflictShift.name}" ({s.conflictShift.start_time}-{s.conflictShift.end_time})
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Button
                                                size="medium"
                                                variant="contained"
                                                startIcon={<Add />}
                                                onClick={() => onAssign(s.id)}
                                                disabled={s.hasConflict}
                                                sx={{
                                                    bgcolor: s.hasConflict ? COLORS.GRAY[400] : COLORS.INFO[500],
                                                    color: 'white',
                                                    px: 2.5,
                                                    height: 40,
                                                    minWidth: 100,
                                                    '&:hover': s.hasConflict ? {} : {
                                                        bgcolor: COLORS.INFO[600]
                                                    }
                                                }}
                                            >
                                                Thêm
                                            </Button>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Box>
                    {(pendingAssignments.length > 0 || pendingRemovals.length > 0) && (
                        <Typography variant="body1" sx={{ color: COLORS.WARNING[700], fontWeight: 700 }}>
                            {pendingAssignments.length > 0 && `+${pendingAssignments.length} thêm`}
                            {pendingAssignments.length > 0 && pendingRemovals.length > 0 && ' | '}
                            {pendingRemovals.length > 0 && `-${pendingRemovals.length} xóa`}
                        </Typography>
                    )}
                </Box>
                <Button
                    onClick={onClose}
                    variant="contained"
                    size="large"
                    sx={{
                        bgcolor: (pendingAssignments.length > 0 || pendingRemovals.length > 0)
                            ? COLORS.SUCCESS[500]
                            : COLORS.PRIMARY[500],
                        '&:hover': {
                            bgcolor: (pendingAssignments.length > 0 || pendingRemovals.length > 0)
                                ? COLORS.SUCCESS[600]
                                : COLORS.PRIMARY[600]
                        },
                        minWidth: 150,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {(pendingAssignments.length > 0 || pendingRemovals.length > 0) ? 'Lưu thay đổi' : 'Đóng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StaffAssignmentModal;

