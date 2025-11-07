import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, IconButton, Divider, Alert, Checkbox, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Close as CloseIcon, Assignment as AssignmentIcon, Check as CheckIcon } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AreaWorkTypesModal = ({ open, onClose, area, allWorkTypes, onSave }) => {
    const [selectedWorkTypes, setSelectedWorkTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && area?.area_work_types) {
            const currentWorkTypeIds = area.area_work_types.map(awt => awt.work_type?.id).filter(Boolean);
            setSelectedWorkTypes(currentWorkTypeIds);
        } else if (!open) {
            setSelectedWorkTypes([]);
        }
    }, [area, open]);

    const handleToggleWorkType = (workTypeId) => {
        setSelectedWorkTypes(prev =>
            prev.includes(workTypeId)
                ? prev.filter(id => id !== workTypeId)
                : [...prev, workTypeId]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(area.id, selectedWorkTypes);
            onClose();
        } catch (error) {
            console.error('Error saving work types:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!area) return null;

    const currentWorkTypes = area.area_work_types || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '60vh'
                }
            }}
        >
            {/* Title */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.PRIMARY[50],
                    borderBottom: `1px solid ${COLORS.GRAY[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <AssignmentIcon sx={{ color: COLORS.PRIMARY[600], fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={600}>
                            Quản lý Work Types
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {area.name}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Info Alert */}
                    <Alert severity="info" icon={<AssignmentIcon />}>
                        Chọn các loại công việc (Work Types) có thể thực hiện trong khu vực này
                    </Alert>

                    {/* Current Work Types */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Work Types hiện tại ({currentWorkTypes.length})
                        </Typography>
                        {currentWorkTypes.length === 0 ? (
                            <Paper sx={{ p: 2, bgcolor: COLORS.GRAY[50] }}>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Chưa có work type nào được gán
                                </Typography>
                            </Paper>
                        ) : (
                            <List sx={{ bgcolor: COLORS.GRAY[50], borderRadius: 1 }}>
                                {currentWorkTypes.map((awt, index) => (
                                    <ListItem
                                        key={awt.work_type?.id || awt.id || `awt-${index}`}
                                        sx={{
                                            borderBottom: index < currentWorkTypes.length - 1
                                                ? `1px solid ${COLORS.GRAY[200]}`
                                                : 'none',
                                            '&:last-child': {
                                                borderBottom: 'none'
                                            }
                                        }}
                                    >
                                        <ListItemIcon>
                                            <CheckIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" fontWeight={500}>
                                                    {awt.work_type.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    {awt.work_type.description}
                                                </Typography>
                                            }
                                        />
                                        <Chip
                                            label={awt.work_type.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                            size="small"
                                            color={awt.work_type.is_active ? 'success' : 'default'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>

                    <Divider />

                    {/* All Work Types Selection */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Tất cả Work Types ({allWorkTypes.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Chọn/bỏ chọn để thêm hoặc xóa work types
                        </Typography>
                        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto', mt: 1 }}>
                            <Stack spacing={1}>
                                {allWorkTypes.map((workType, index) => {
                                    const isSelected = selectedWorkTypes.includes(workType.id);
                                    return (
                                        <Paper
                                            key={workType.id || `worktype-${index}`}
                                            sx={{
                                                p: 1.5,
                                                border: `2px solid ${isSelected ? COLORS.PRIMARY[500] : COLORS.GRAY[200]}`,
                                                bgcolor: isSelected ? COLORS.PRIMARY[50] : 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: isSelected ? COLORS.PRIMARY[100] : COLORS.GRAY[50],
                                                    borderColor: isSelected ? COLORS.PRIMARY[600] : COLORS.GRAY[300]
                                                }
                                            }}
                                            onClick={() => handleToggleWorkType(workType.id)}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleToggleWorkType(workType.id)}
                                                    size="small"
                                                />
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {workType.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {workType.description}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={workType.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                    size="small"
                                                    color={workType.is_active ? 'success' : 'default'}
                                                />
                                            </Stack>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Box>
                </Stack>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ p: 2.5, bgcolor: COLORS.GRAY[50], borderTop: `1px solid ${COLORS.GRAY[200]}` }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{ minWidth: 100 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        minWidth: 120,
                        bgcolor: COLORS.PRIMARY[600],
                        '&:hover': { bgcolor: COLORS.PRIMARY[700] }
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AreaWorkTypesModal;

