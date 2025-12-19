import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, Typography, FormControl, InputLabel, Select, MenuItem, Alert, Chip, OutlinedInput, Switch, FormControlLabel, alpha } from '@mui/material';
import { Groups, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const TEAM_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Đang vận hành' },
    { value: 'INACTIVE', label: 'Tạm ngưng' }
];

const TeamFormModal = ({
    open,
    onClose,
    editingTeam,
    formData,
    loading,
    onFormChange,
    onSave,
    allEmployees = [],
    allWorkTypes = []
}) => {
    const isManagerRole = (employee) => {
        if (!employee) return false;
        const roleCandidates = [
            employee.role,
            employee.sub_role,
            employee.account?.role,
            employee.account?.sub_role
        ].map((role) => (role || '').toString().toUpperCase());
        return roleCandidates.includes('MANAGER');
    };

    const leaderOptions = React.useMemo(() => {
        if (!Array.isArray(allEmployees)) return [];
        const filtered = allEmployees.filter(emp => !isManagerRole(emp));
        if (editingTeam?.leader_id) {
            const currentLeader = allEmployees.find(emp => emp.id === editingTeam.leader_id);
            if (currentLeader && !filtered.some(emp => emp.id === currentLeader.id)) {
                return [currentLeader, ...filtered];
            }
        }
        return filtered;
    }, [allEmployees, editingTeam?.leader_id]);

    // Validate before saving
    const handleSaveWithValidation = () => {
        if (!formData.name?.trim()) {
            alert('Vui lòng nhập tên nhóm');
            return;
        }
        if (!formData.description?.trim()) {
            alert('Vui lòng nhập mô tả');
            return;
        }
        if (!formData.leader_id) {
            alert('Vui lòng chọn trưởng nhóm');
            return;
        }
        if (!formData.work_type_ids || formData.work_type_ids.length === 0) {
            alert('Vui lòng chọn ít nhất một loại công việc');
            return;
        }

        onSave();
    };

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
                    <Groups />
                    {editingTeam ? '✏️ Sửa nhóm' : '➕ Tạo nhóm mới'}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Stack spacing={3}>
                    {/* Tên nhóm */}
                    <TextField
                        label="Tên nhóm"
                        fullWidth
                        required
                        value={formData.name || ''}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="VD: Cat Zone Care Team"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                    {/* Mô tả */}
                    <TextField
                        label="Mô tả"
                        fullWidth
                        required
                        multiline
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                        placeholder="Nhập mô tả về nhóm..."
                    />

                    {/* Trưởng nhóm */}
                    <FormControl fullWidth required>
                        <InputLabel>Trưởng nhóm</InputLabel>
                        <Select
                            value={formData.leader_id || ''}
                            onChange={(e) => onFormChange({ ...formData, leader_id: e.target.value })}
                            label="Trưởng nhóm"
                            sx={{ height: 56 }}
                        >
                            <MenuItem value="">
                                <em>-- Chọn trưởng nhóm --</em>
                            </MenuItem>
                            {leaderOptions.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Typography>{emp.full_name}</Typography>
                                        <Chip
                                            label={emp.sub_role === 'WORKING_STAFF' ? 'Nhân viên chăm sóc' : 'Nhân viên bán hàng'}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                bgcolor: emp.sub_role === 'WORKING_STAFF' ? alpha(COLORS.INFO[100], 0.8) : alpha(COLORS.WARNING[100], 0.8),
                                                color: emp.sub_role === 'WORKING_STAFF' ? COLORS.INFO[700] : COLORS.WARNING[700]
                                            }}
                                        />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Loại công việc (multi-select) */}
                    <FormControl fullWidth required>
                        <InputLabel>Loại công việc</InputLabel>
                        <Select
                            multiple
                            value={formData.work_type_ids || []}
                            onChange={(e) => onFormChange({ ...formData, work_type_ids: e.target.value })}
                            input={<OutlinedInput label="Loại công việc" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const workType = allWorkTypes.find(wt => wt.id === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={workType?.name || value}
                                                size="small"
                                                sx={{ height: 24 }}
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                            sx={{ minHeight: 56 }}
                        >
                            {allWorkTypes.map(workType => (
                                <MenuItem key={workType.id} value={workType.id}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {workType.name}
                                        </Typography>
                                        {workType.description && (
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {workType.description}
                                            </Typography>
                                        )}
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Trạng thái */}
                    {editingTeam && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active ?? true}
                                    onChange={(e) => onFormChange({ ...formData, is_active: e.target.checked })}
                                    color="success"
                                />
                            }
                            label={
                                <Typography sx={{ fontWeight: 600 }}>
                                    {formData.is_active ? 'Kích hoạt' : 'Ngừng kích hoạt'}
                                </Typography>
                            }
                        />
                    )}
                    <FormControl fullWidth>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={formData.status || 'ACTIVE'}
                            label="Trạng thái"
                            onChange={(e) => onFormChange({ ...formData, status: e.target.value })}
                            sx={{ height: 56 }}
                        >
                            {TEAM_STATUS_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Info alert for create mode */}
                    {!editingTeam && (
                        <Alert severity="info" icon={<Info />}>
                            <Typography variant="body2">
                                Nhóm mới sẽ được tạo với trạng thái <strong>Hoạt động</strong> mặc định.
                            </Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, gap: 2 }}>
                <Button onClick={onClose} variant="outlined" size="large" disabled={loading} sx={{ minWidth: 130, height: 44 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSaveWithValidation}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                        bgcolor: COLORS.PRIMARY[500],
                        '&:hover': { bgcolor: COLORS.PRIMARY[600] },
                        minWidth: 130,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {loading ? 'Đang lưu...' : (editingTeam ? 'Cập nhật' : 'Tạo nhóm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamFormModal;

