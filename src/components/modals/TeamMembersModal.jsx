import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider, Checkbox, Chip, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Groups, Close, Search, People, Info, Save, Cancel, Person, Star } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const roleLabel = (r) => {
    switch (r) {
        case 'SALE_STAFF': return 'Sale Staff';
        case 'WORKING_STAFF': return 'Working Staff';
        default: return r;
    }
};

const roleColor = (r) => {
    switch (r) {
        case 'SALE_STAFF': return { bg: alpha(COLORS.INFO[100], 0.8), color: COLORS.INFO[700] };
        case 'WORKING_STAFF': return { bg: alpha(COLORS.WARNING[100], 0.8), color: COLORS.WARNING[700] };
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
    skillFilter,
    loading,
    onSearchChange,
    onRoleFilterChange,
    onSkillFilterChange,
    onAddMember,
    onRemoveMember,
    onToggleMemberStatus,
    onSave
}) => {
    const addedCount = teamMembers.filter(m => !originalTeamMembers.some(om => om.employee_id === m.employee_id)).length;
    const removedCount = originalTeamMembers.filter(om => !teamMembers.some(m => m.employee_id === om.employee_id)).length;
    const changedStatusCount = teamMembers.filter(m => {
        const original = originalTeamMembers.find(om => om.employee_id === m.employee_id);
        return original && original.is_active !== m.is_active;
    }).length;
    const hasChanges = addedCount > 0 || removedCount > 0 || changedStatusCount > 0;

    const memberEmployeeIds = teamMembers.map(m => m.employee?.id || m.employee_id);
    const leaderId = team?.leader_id;

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

    // Get all unique skills from allStaff
    const allSkills = React.useMemo(() => {
        const skillsSet = new Set();
        allStaff.forEach(s => {
            if (Array.isArray(s.skills)) {
                s.skills.forEach(skill => {
                    if (skill && skill.trim()) {
                        skillsSet.add(skill.trim());
                    }
                });
            }
        });
        return Array.from(skillsSet).sort();
    }, [allStaff]);

    const filteredStaff = allStaff.filter(s => {
        const employeeId = s.id;
        const inTeam = memberEmployeeIds.includes(employeeId);
        const isLeader = employeeId === leaderId;
        const isManager = s.account?.role === 'MANAGER';
        const inOtherTeam = staffInOtherTeams.has(employeeId);

        // Exclude if: already in this team, is leader, is manager, or already in another team
        if (inTeam || isLeader || isManager || inOtherTeam) return false;

        const matchSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = roleFilter === 'all' || s.sub_role === roleFilter;

        // Match skill filter
        const matchSkill = skillFilter === 'all' ||
            (Array.isArray(s.skills) && s.skills.some(skill => skill?.trim() === skillFilter));

        return matchSearch && matchRole && matchSkill;
    });

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
                    minHeight: 700,
                    maxHeight: '90vh',
                    maxWidth: 1400
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
                    👥 Thành viên nhóm: {team?.name || 'Nhóm'}
                </DialogTitle>
            </Box>

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

                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Lọc vai trò</InputLabel>
                                        <Select
                                            value={roleFilter}
                                            onChange={(e) => onRoleFilterChange(e.target.value)}
                                            label="Lọc vai trò"
                                            sx={{ bgcolor: 'white', height: 48 }}
                                        >
                                            <MenuItem value="all">Tất cả</MenuItem>
                                            <MenuItem value="WORKING_STAFF">Working Staff</MenuItem>
                                            <MenuItem value="SALE_STAFF">Sale Staff</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel>Lọc kỹ năng</InputLabel>
                                        <Select
                                            value={skillFilter}
                                            onChange={(e) => onSkillFilterChange(e.target.value)}
                                            label="Lọc kỹ năng"
                                            sx={{ bgcolor: 'white', height: 48 }}
                                        >
                                            <MenuItem value="all">Tất cả</MenuItem>
                                            {allSkills.map(skill => (
                                                <MenuItem key={skill} value={skill}>{skill}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
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
                                                        src={staffMember.avatar_url}
                                                        sx={{ width: 48, height: 48 }}
                                                    >
                                                        <Person sx={{ fontSize: 24 }} />
                                                    </Avatar>
                                                </Stack>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                                                        {staffMember.full_name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            label={roleLabel(staffMember.sub_role)}
                                                            size="small"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.75rem',
                                                                ...roleColor(staffMember.sub_role)
                                                            }}
                                                        />
                                                        {Array.isArray(staffMember.skills) && staffMember.skills.length > 0 && (
                                                            staffMember.skills.map((skill, idx) => (
                                                                skill && skill.trim() && (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={skill.trim()}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 22,
                                                                            fontSize: '0.7rem',
                                                                            bgcolor: alpha(COLORS.PRIMARY[100], 0.6),
                                                                            color: COLORS.PRIMARY[700],
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                )
                                                            ))
                                                        )}
                                                    </Stack>
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
                                teamMembers.map((member, index) => {
                                    const employeeId = member.employee?.id || member.employee_id;
                                    const isNew = !originalTeamMembers.some(om => (om.employee?.id || om.employee_id) === employeeId);
                                    const isLeader = employeeId === leaderId;
                                    const original = originalTeamMembers.find(om => (om.employee?.id || om.employee_id) === employeeId);
                                    const statusChanged = original && original.is_active !== member.is_active;

                                    return (
                                        <React.Fragment key={employeeId}>
                                            {index > 0 && <Divider sx={{ my: 0.5 }} />}
                                            <ListItem
                                                sx={{
                                                    py: 2,
                                                    px: 2.5,
                                                    borderRadius: 1.5,
                                                    mb: 0.5,
                                                    bgcolor: isNew ? alpha(COLORS.SUCCESS[50], 0.6) :
                                                        (member.is_active === false || member.is_active === null) ? alpha(COLORS.GRAY[100], 0.5) : 'transparent',
                                                    borderLeft: isNew ? `5px solid ${COLORS.SUCCESS[500]}` :
                                                        isLeader ? `5px solid ${COLORS.WARNING[500]}` :
                                                            statusChanged ? `5px solid ${COLORS.INFO[500]}` :
                                                                '5px solid transparent',
                                                    opacity: (member.is_active ?? true) ? 1 : 0.6
                                                }}
                                            >
                                                <ListItemAvatar sx={{ minWidth: 0, mr: 2.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        {!isLeader && (
                                                            <Checkbox
                                                                checked={member.is_active ?? true}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    onToggleMemberStatus(employeeId);
                                                                }}
                                                                sx={{ '& .MuiSvgIcon-root': { fontSize: 22 } }}
                                                            />
                                                        )}
                                                        <Avatar
                                                            src={member.employee?.avatar_url || member.avatar_url}
                                                            sx={{ width: 48, height: 48 }}
                                                        >
                                                            <Person sx={{ fontSize: 24 }} />
                                                        </Avatar>
                                                    </Stack>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                                                {member.employee?.full_name || member.full_name}
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
                                                            {(member.is_active === false || member.is_active === null) && (
                                                                <Chip
                                                                    label="Không hoạt động"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.75rem',
                                                                        bgcolor: COLORS.GRAY[400],
                                                                        color: 'white',
                                                                        fontWeight: 700
                                                                    }}
                                                                />
                                                            )}
                                                            {statusChanged && (
                                                                <Chip
                                                                    label="Đã thay đổi"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.75rem',
                                                                        bgcolor: COLORS.INFO[500],
                                                                        color: 'white',
                                                                        fontWeight: 700
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                                                            {Array.isArray(member.employee?.skills) && member.employee.skills.length > 0 && (
                                                                member.employee.skills.map((skill, idx) => (
                                                                    skill && skill.trim() && (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={skill.trim()}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 22,
                                                                                fontSize: '0.7rem',
                                                                                bgcolor: alpha(COLORS.PRIMARY[100], 0.6),
                                                                                color: COLORS.PRIMARY[700],
                                                                                fontWeight: 500
                                                                            }}
                                                                        />
                                                                    )
                                                                ))
                                                            )}
                                                        </Stack>
                                                    }
                                                />
                                                {!isLeader && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onRemoveMember(employeeId)}
                                                        sx={{
                                                            ml: 1,
                                                            bgcolor: alpha(COLORS.ERROR[100], 0.5),
                                                            '&:hover': {
                                                                bgcolor: alpha(COLORS.ERROR[200], 0.8)
                                                            }
                                                        }}
                                                    >
                                                        <Close sx={{ fontSize: 20, color: COLORS.ERROR[700] }} />
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

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}`, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                        💡 Click checkbox để kích hoạt/vô hiệu hóa thành viên
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

