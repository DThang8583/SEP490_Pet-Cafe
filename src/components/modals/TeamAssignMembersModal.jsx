import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, InputAdornment, List, ListItem, ListItemAvatar, Avatar, Checkbox, Typography, Chip, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Search, PersonAddAlt1 } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const isManagerRole = (employee) => {
    if (!employee) return false;
    const roles = [
        employee.role,
        employee.sub_role,
        employee.account?.role,
        employee.account?.sub_role
    ].map((r) => (r || '').toString().toUpperCase());
    return roles.includes('MANAGER');
};

const TeamAssignMembersModal = ({
    open,
    onClose,
    team,
    employees = [],
    excludedIds = [],
    loading = false,
    submitting = false,
    onSubmit
}) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [skillFilter, setSkillFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);

    const leaderId = team?.leader_id;

    useEffect(() => {
        if (open) {
            setSearch('');
            setRoleFilter('all');
            setSkillFilter('all');
            setSelectedIds([]);
        }
    }, [open]);

    const allSkills = useMemo(() => {
        const setSkills = new Set();
        employees.forEach(emp => {
            if (Array.isArray(emp.skills)) {
                emp.skills.forEach(skill => {
                    if (skill && skill.trim()) {
                        setSkills.add(skill.trim());
                    }
                });
            }
        });
        return Array.from(setSkills).sort((a, b) => a.localeCompare(b));
    }, [employees]);

    const eligibleEmployees = useMemo(() => {
        const excludeSet = new Set([...(excludedIds || []), leaderId].filter(Boolean));
        return employees
            .filter((emp) => {
                if (!emp?.id) return false;
                if (excludeSet.has(emp.id)) return false;
                if (isManagerRole(emp)) return false;
                if (emp.is_active === false) return false;
                return true;
            })
            .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }, [employees, excludedIds, leaderId]);

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return eligibleEmployees.filter((emp) => {
            const matchSearch = !keyword ||
                (emp.full_name || '').toLowerCase().includes(keyword) ||
                (emp.email || '').toLowerCase().includes(keyword) ||
                (emp.phone || '').toLowerCase().includes(keyword);
            const matchRole = roleFilter === 'all' || emp.sub_role === roleFilter;
            const matchSkill = skillFilter === 'all' ||
                (Array.isArray(emp.skills) && emp.skills.some(skill => skill?.trim() === skillFilter));
            return matchSearch && matchRole && matchSkill;
        });
    }, [eligibleEmployees, search, roleFilter, skillFilter]);

    const toggleSelection = (employeeId) => {
        setSelectedIds((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleSubmit = () => {
        if (typeof onSubmit === 'function') {
            onSubmit(selectedIds);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={submitting ? undefined : onClose}
            maxWidth="md"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 50px ${alpha(COLORS.SHADOW.DARK, 0.25)}`
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: COLORS.SUCCESS[700], display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddAlt1 />
                Thêm thành viên vào nhóm
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                    Nhóm: <strong>{team?.name || 'Không xác định'}</strong>
                </Typography>
                <Stack spacing={2.5}>
                    <TextField
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm nhân viên..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: COLORS.TEXT.SECONDARY }} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2 }
                        }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel>Lọc theo vai trò</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Lọc theo vai trò"
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <MenuItem value="all">Tất cả vai trò</MenuItem>
                                <MenuItem value="WORKING_STAFF">Nhân viên chăm sóc</MenuItem>
                                <MenuItem value="SALE_STAFF">Nhân viên bán hàng</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Lọc theo kỹ năng</InputLabel>
                            <Select
                                value={skillFilter}
                                label="Lọc theo kỹ năng"
                                onChange={(e) => setSkillFilter(e.target.value)}
                            >
                                <MenuItem value="all">Tất cả kỹ năng</MenuItem>
                                {allSkills.map(skill => (
                                    <MenuItem key={skill} value={skill}>{skill}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
                <Box sx={{ mt: 2, maxHeight: 420, overflowY: 'auto', border: `1px solid ${COLORS.BORDER.DEFAULT}`, borderRadius: 2 }}>
                    {loading ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Đang tải danh sách thành viên...
                            </Typography>
                        </Box>
                    ) : filteredEmployees.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Không có nhân viên phù hợp
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {filteredEmployees.map((emp) => {
                                const isChecked = selectedIds.includes(emp.id);
                                return (
                                    <ListItem
                                        key={emp.id}
                                        divider
                                        sx={{
                                            py: 1.5,
                                            px: 2,
                                            bgcolor: isChecked ? alpha(COLORS.SUCCESS[50], 0.5) : 'transparent',
                                            '&:hover': { bgcolor: alpha(COLORS.PRIMARY[50], 0.4) }
                                        }}
                                        secondaryAction={
                                            <Checkbox
                                                edge="end"
                                                checked={isChecked}
                                                onChange={() => toggleSelection(emp.id)}
                                                sx={{
                                                    color: COLORS.PRIMARY[500],
                                                    '&.Mui-checked': { color: COLORS.PRIMARY[600] }
                                                }}
                                            />
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={emp.avatar_url} alt={emp.full_name}>
                                                {(emp.full_name || 'U')[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <Stack spacing={0.4}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {emp.full_name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {emp.email || 'Chưa có email'}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                                {emp.sub_role && (
                                                    <Chip
                                                        label={emp.sub_role === 'WORKING_STAFF' ? 'Nhân viên chăm sóc' : (emp.sub_role === 'SALE_STAFF' ? 'Nhân viên bán hàng' : (emp.sub_role === 'MANAGER' ? 'Quản lý' : emp.sub_role))}
                                                        size="small"
                                                        sx={{ bgcolor: alpha(COLORS.PRIMARY[100], 0.7), fontWeight: 600 }}
                                                    />
                                                )}
                                                {emp.phone && (
                                                    <Chip
                                                        label={emp.phone}
                                                        size="small"
                                                        sx={{ bgcolor: alpha(COLORS.SECONDARY[100], 0.7), fontWeight: 600 }}
                                                    />
                                                )}
                                                {Array.isArray(emp.skills) && emp.skills.length > 0 && emp.skills.map((skill, idx) => (
                                                    skill && skill.trim() && (
                                                        <Chip
                                                            key={`${emp.id}-skill-${idx}`}
                                                            label={skill.trim()}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(COLORS.SUCCESS[100], 0.8),
                                                                color: COLORS.SUCCESS[700],
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    )
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: COLORS.TEXT.SECONDARY }}>
                    Đã chọn <strong>{selectedIds.length}</strong> nhân viên
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}` }}>
                <Button onClick={onClose} disabled={submitting} sx={{ minWidth: 120 }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || selectedIds.length === 0}
                    sx={{
                        minWidth: 160,
                        fontWeight: 700,
                        bgcolor: COLORS.SUCCESS[500],
                        '&:hover': { bgcolor: COLORS.SUCCESS[600] }
                    }}
                >
                    {submitting ? 'Đang thêm...' : 'Thêm thành viên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeamAssignMembersModal;


