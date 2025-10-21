import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Close, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const TeamFormModal = ({
    open,
    onClose,
    editingTeam,
    formData,
    loading,
    onFormChange,
    onSave
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minWidth: 650 } }}>
            <DialogTitle sx={{ bgcolor: COLORS.PRIMARY[500], color: 'white', py: 2.5, px: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Groups sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                        {editingTeam ? 'Sửa nhóm' : 'Tạo nhóm mới'}
                    </Typography>
                    <IconButton onClick={onClose} size="medium" sx={{ color: 'white' }}>
                        <Close sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <TextField
                        label="Tên nhóm"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="VD: Team A, Team sáng"
                        sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />

                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, gap: 2 }}>
                <Button onClick={onClose} variant="outlined" size="large" disabled={loading} sx={{ minWidth: 130, height: 44 }}>
                    Hủy
                </Button>
                <Button
                    onClick={onSave}
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

