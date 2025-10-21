import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider, Checkbox, Chip, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Close, Search, People, Info, Save, Cancel, Person, Star, StarBorder } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const roleLabel = (r) => {
    switch (r) {
        case 'sales_staff': return 'Sale staff';
        case 'working_staff': return 'Working staff';
        default: return r;
    }
};

const roleColor = (r) => {
    switch (r) {
        case 'sales_staff': return { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] };
        case 'working_staff': return { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] };
        default: return { bg: alpha(COLORS.GRAY[200], 0.6), color: COLORS.TEXT.SECONDARY };
    }
};

const TeamMembersModal = ({
    open,
    onClose,
    team,
    currentShift,
    teamMembers,
    originalTeamMembers,
    allStaff,
    searchQuery,
    roleFilter,
    loading,
    onSearchChange,
    onRoleFilterChange,
    onAddMember,
    onRemoveMember,
    onSetLeader,
    onSave
}) => {
    const addedCount = teamMembers.filter(m => !originalTeamMembers.some(om => om.id === m.id)).length;
    const removedCount = originalTeamMembers.filter(om => !teamMembers.some(m => m.id === om.id)).length;
    const hasChanges = addedCount > 0 || removedCount > 0;

    const memberIds = teamMembers.map(m => m.id);
    const leaderId = team?.leader?.id;

    // Get staff IDs already assigned to OTHER teams in the SAME shift
    const staffInOtherTeams = React.useMemo(() => {
        if (!currentShift || !currentShift.team_work_shifts) return new Set();

        const assignedStaffIds = new Set();
        currentShift.team_work_shifts.forEach(t => {
            // Skip the current team
            if (t.id === team?.id) return;

            // Add leader
            if (t.leader?.id) {
                assignedStaffIds.add(t.leader.id);
            }

            // Add members
            if (Array.isArray(t.members)) {
                t.members.forEach(m => assignedStaffIds.add(m.id));
            }
        });

        return assignedStaffIds;
    }, [currentShift, team?.id]);

    // Sort members to always show leader first
    const sortedMembers = [...teamMembers].sort((a, b) => {
        const aIsLeader = a.id === leaderId;
        const bIsLeader = b.id === leaderId;
        if (aIsLeader) return -1;
        if (bIsLeader) return 1;
        return 0;
    });

    const filteredStaff = allStaff.filter(s => {
        const inTeam = memberIds.includes(s.id);
        const isLeader = s.id === leaderId;
        const isManager = s.role === 'manager';
        const inOtherTeam = staffInOtherTeams.has(s.id);

        // Exclude if: already in this team, is leader, is manager, or already in another team
        if (inTeam || isLeader || isManager || inOtherTeam) return false;

        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = roleFilter === 'all' || s.role === roleFilter;

        return matchSearch && matchRole;
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: 700,
                    maxHeight: '90vh',
                    maxWidth: 1400
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: `1px solid ${COLORS.BORDER.MAIN}`, py: 3, px: 3, bgcolor: alpha(COLORS.PRIMARY[50], 0.3) }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <Groups sx={{ fontSize: 36, color: COLORS.PRIMARY[600] }} />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {team?.name || 'Nhóm'}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.75 }}>
                                <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                                    Leader: <strong>{team?.leader?.full_name || 'N/A'}</strong>
                                </Typography>
                                {hasChanges && (
                                    <Chip
                                        label={`${addedCount + removedCount} thay đổi`}
                                        size="small"
                                        color="warning"
                                        sx={{ fontWeight: 700, height: 24, fontSize: '0.8rem' }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} size="medium">
                        <Close sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                <Stack direction="row" sx={{ height: 580 }}>
                    {/* LEFT PANEL: Available Staff */}
                    <Box sx={{ width: '50%', borderRight: `1px solid ${COLORS.BORDER.MAIN}`, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(COLORS.PRIMARY[50], 0.2), borderBottom: `1px solid ${COLORS.BORDER.MAIN}` }}>
                            <Stack spacing={2.5}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <People sx={{ color: COLORS.PRIMARY[600], fontSize: 26 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, fontSize: '1.15rem' }}>
                                        Danh sách nhân viên
                                    </Typography>
                                    <Chip
                                        label={filteredStaff.length}
                                        sx={{ bgcolor: 'white', fontWeight: 700, height: 28, fontSize: '0.9rem', px: 1 }}
                                    />
                                </Stack>

                                <TextField
                                    fullWidth
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ color: COLORS.TEXT.SECONDARY, mr: 1, fontSize: 22 }} />,
                                        sx: { bgcolor: 'white', height: 48 }
                                    }}
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Lọc vai trò</InputLabel>
                                    <Select
                                        value={roleFilter}
                                        onChange={(e) => onRoleFilterChange(e.target.value)}
                                        label="Lọc vai trò"
                                        sx={{ bgcolor: 'white', height: 48 }}
                                    >
                                        <MenuItem value="all">Tất cả</MenuItem>
                                        <MenuItem value="working_staff">Working Staff</MenuItem>
                                        <MenuItem value="sales_staff">Sales Staff</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <List sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1.5 }}>
                            {filteredStaff.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <Info sx={{ fontSize: 56, color: COLORS.TEXT.DISABLED, mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Không có nhân viên khả dụng
                                    </Typography>
                                </Box>
                            ) : (
                                filteredStaff.map((staffMember, index) => (
                                    <React.Fragment key={staffMember.id}>
                                        {index > 0 && <Divider sx={{ my: 0.5 }} />}
                                        <ListItem
                                            button
                                            onClick={() => onAddMember(staffMember)}
                                            sx={{
                                                py: 2,
                                                px: 2.5,
                                                borderRadius: 1.5,
                                                mb: 0.5,
                                                '&:hover': {
                                                    bgcolor: alpha(COLORS.SUCCESS[50], 0.5)
                                                }
                                            }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 0, mr: 2.5 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Checkbox checked={false} sx={{ '& .MuiSvgIcon-root': { fontSize: 22 } }} />
                                                    <Avatar
                                                        src={staffMember.avatar}
                                                        sx={{ width: 48, height: 48 }}
                                                    >
                                                        <Person sx={{ fontSize: 24 }} />
                                                    </Avatar>
                                                </Stack>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                                                        {staffMember.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Chip
                                                        label={roleLabel(staffMember.role)}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.75rem',
                                                            mt: 0.5,
                                                            ...roleColor(staffMember.role)
                                                        }}
                                                    />
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Box>

                    {/* RIGHT PANEL: Current Members */}
                    <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(COLORS.SUCCESS[50], 0.2), borderBottom: `1px solid ${COLORS.BORDER.MAIN}` }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Groups sx={{ color: COLORS.SUCCESS[600], fontSize: 26 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, fontSize: '1.15rem' }}>
                                    Thành viên hiện tại
                                </Typography>
                                <Chip
                                    label={teamMembers.length}
                                    sx={{ bgcolor: 'white', fontWeight: 700, height: 28, fontSize: '0.9rem', px: 1 }}
                                />
                            </Stack>
                        </Box>

                        <List sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1.5 }}>
                            {teamMembers.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <Groups sx={{ fontSize: 64, color: COLORS.GRAY[300], mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700, mb: 1.5 }}>
                                        Chưa có thành viên
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        Click vào nhân viên bên trái để thêm
                                    </Typography>
                                </Box>
                            ) : (
                                sortedMembers.map((member, index) => {
                                    const isNew = !originalTeamMembers.some(om => om.id === member.id);
                                    const isLeader = team?.leader?.id === member.id;

                                    return (
                                        <React.Fragment key={member.id}>
                                            {index > 0 && <Divider sx={{ my: 0.5 }} />}
                                            <ListItem
                                                sx={{
                                                    py: 2,
                                                    px: 2.5,
                                                    borderRadius: 1.5,
                                                    mb: 0.5,
                                                    bgcolor: isNew ? alpha(COLORS.SUCCESS[50], 0.6) : 'transparent',
                                                    borderLeft: isNew ? `5px solid ${COLORS.SUCCESS[500]}` : isLeader ? `5px solid ${COLORS.WARNING[500]}` : '5px solid transparent'
                                                }}
                                            >
                                                <ListItemAvatar sx={{ minWidth: 0, mr: 2.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Checkbox
                                                            checked={true}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isLeader) {
                                                                    onRemoveMember(member.id);
                                                                }
                                                            }}
                                                            disabled={isLeader}
                                                            sx={{ '& .MuiSvgIcon-root': { fontSize: 22 } }}
                                                        />
                                                        <Avatar
                                                            src={member.avatar_url}
                                                            sx={{ width: 48, height: 48 }}
                                                        >
                                                            <Person sx={{ fontSize: 24 }} />
                                                        </Avatar>
                                                    </Stack>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                                                {member.full_name || member.name}
                                                            </Typography>
                                                            {isLeader && (
                                                                <Chip
                                                                    icon={<Star sx={{ fontSize: 16 }} />}
                                                                    label="Leader"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.75rem',
                                                                        bgcolor: COLORS.WARNING[500],
                                                                        color: 'white',
                                                                        fontWeight: 700
                                                                    }}
                                                                />
                                                            )}
                                                            {isNew && (
                                                                <Chip
                                                                    label="Mới"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.75rem',
                                                                        bgcolor: COLORS.SUCCESS[500],
                                                                        color: 'white',
                                                                        fontWeight: 700
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    }
                                                />
                                                {!isLeader && onSetLeader && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onSetLeader(member)}
                                                        sx={{
                                                            ml: 1,
                                                            bgcolor: alpha(COLORS.WARNING[100], 0.5),
                                                            '&:hover': {
                                                                bgcolor: alpha(COLORS.WARNING[200], 0.8)
                                                            }
                                                        }}
                                                    >
                                                        <StarBorder sx={{ fontSize: 20, color: COLORS.WARNING[700] }} />
                                                    </IconButton>
                                                )}
                                            </ListItem>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </List>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 3, bgcolor: alpha(COLORS.GRAY[50], 0.3), gap: 2, borderTop: `1px solid ${COLORS.BORDER.MAIN}` }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                        💡 Click vào nhân viên để thêm/xóa
                    </Typography>
                    {staffInOtherTeams.size > 0 && (
                        <Typography variant="caption" sx={{ color: COLORS.WARNING[700], display: 'block', mt: 0.5 }}>
                            ⚠️ {staffInOtherTeams.size} nhân viên đã được phân vào nhóm khác trong ca này
                        </Typography>
                    )}
                </Box>
                <Button
                    onClick={onClose}
                    startIcon={<Cancel />}
                    disabled={loading}
                    size="large"
                    sx={{ minWidth: 130, height: 44 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    size="large"
                    sx={{
                        bgcolor: COLORS.SUCCESS[500],
                        '&:hover': { bgcolor: COLORS.SUCCESS[600] },
                        minWidth: 150,
                        height: 44,
                        fontWeight: 700
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamMembersModal;

