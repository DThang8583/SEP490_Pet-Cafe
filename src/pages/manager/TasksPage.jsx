import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, Chip, Toolbar, TextField, Select, MenuItem, InputLabel, FormControl, Button, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { alpha } from '@mui/material/styles';
import { Edit, Delete } from '@mui/icons-material';

const DEFAULT_TEMPLATES = [
    { key: 'cleaning', name: 'Dọn dẹp' },
    { key: 'feeding', name: 'Cho thú cưng ăn' },
    { key: 'cashier', name: 'Thu ngân' },
    { key: 'service', name: 'Làm service' },
];

const TasksPage = () => {
    const [timeframe, setTimeframe] = useState('day');
    const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
    const [weekStr, setWeekStr] = useState('');
    const [monthStr, setMonthStr] = useState(() => new Date().toISOString().slice(0, 7));
    const [shift, setShift] = useState('Sáng');
    const [shifts, setShifts] = useState(['Sáng', 'Chiều', 'Tối']);
    const [group, setGroup] = useState('Tất cả');
    const [query, setQuery] = useState('');

    // groups derived from StaffPage persisted data
    const [groups, setGroups] = useState([]);

    // tasks state [{id, name, group, shift, timeframeKey, assignedAt, done}]
    const [tasks, setTasks] = useState([]);

    // dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editMode, setEditMode] = useState('add');
    const [form, setForm] = useState({ id: '', name: '', group: '', shift: 'Sáng' });
    const [errors, setErrors] = useState({});

    // timeframe key for indexing
    const tfKey = useMemo(() => {
        if (timeframe === 'day') return `D:${dateStr}`;
        if (timeframe === 'week') return `W:${weekStr || 'current'}`;
        return `M:${monthStr}`;
    }, [timeframe, dateStr, weekStr, monthStr]);

    useEffect(() => {
        // load from localStorage
        const raw = localStorage.getItem('mgr_tasks');
        if (raw) {
            try { setTasks(JSON.parse(raw)); } catch { }
        }

        // load shift/group data persisted by StaffPage
        const shiftRaw = localStorage.getItem('mgr_shift_data');
        if (shiftRaw) {
            try {
                const parsed = JSON.parse(shiftRaw);
                if (parsed?.shifts?.length) {
                    setShifts(parsed.shifts);
                    if (!parsed.shifts.includes(shift)) {
                        setShift(parsed.shifts[0]);
                    }
                }
                const assignIds = parsed.shiftAssign?.[shift] || [];
                const groupsForShift = new Set();
                assignIds.forEach(id => {
                    const s = parsed.staff?.find(x => x.id === id);
                    if (s?.group) groupsForShift.add(s.group);
                });
                setGroups(Array.from(groupsForShift));
            } catch { }
        }
    }, []);

    // refresh groups on shift change
    useEffect(() => {
        const shiftRaw = localStorage.getItem('mgr_shift_data');
        if (!shiftRaw) { setGroups([]); return; }
        try {
            const parsed = JSON.parse(shiftRaw);
            const assignIds = parsed.shiftAssign?.[shift] || [];
            const groupsForShift = new Set();
            assignIds.forEach(id => {
                const s = parsed.staff?.find(x => x.id === id);
                if (s?.group) groupsForShift.add(s.group);
            });
            setGroups(Array.from(groupsForShift));
        } catch { setGroups([]); }
    }, [shift]);

    useEffect(() => {
        localStorage.setItem('mgr_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const filtered = useMemo(() => {
        return tasks.filter(t => t.timeframeKey === tfKey)
            .filter(t => (shift ? t.shift === shift : true))
            .filter(t => (group !== 'Tất cả' ? t.group === group : true))
            .filter(t => (query ? t.name.toLowerCase().includes(query.toLowerCase()) : true));
    }, [tasks, tfKey, shift, group, query]);

    const groupedByGroup = useMemo(() => {
        return filtered.reduce((acc, t) => {
            const k = t.group || 'Chưa phân nhóm';
            if (!acc[k]) acc[k] = [];
            acc[k].push(t);
            return acc;
        }, {});
    }, [filtered]);

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Quản lý nhiệm vụ</Typography>
                    <Chip label={`Khung thời gian: ${timeframe === 'day' ? 'Ngày' : timeframe === 'week' ? 'Tuần' : 'Tháng'}`} size="small" sx={{ background: alpha(COLORS.SECONDARY[100], 0.7), color: COLORS.SECONDARY[800], fontWeight: 700 }} />
                </Stack>

                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Khung thời gian</InputLabel>
                        <Select label="Khung thời gian" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                            <MenuItem value="day">Theo ngày</MenuItem>
                            <MenuItem value="week">Theo tuần</MenuItem>
                            <MenuItem value="month">Theo tháng</MenuItem>
                        </Select>
                    </FormControl>

                    {timeframe === 'day' && (
                        <TextField size="small" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
                    )}
                    {timeframe === 'week' && (
                        <TextField size="small" type="week" value={weekStr} onChange={(e) => setWeekStr(e.target.value)} />
                    )}
                    {timeframe === 'month' && (
                        <TextField size="small" type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} />
                    )}

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Ca làm</InputLabel>
                        <Select label="Ca làm" value={shift} onChange={(e) => setShift(e.target.value)}>
                            {shifts.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Nhóm</InputLabel>
                        <Select label="Nhóm" value={group} onChange={(e) => setGroup(e.target.value)}>
                            <MenuItem value="Tất cả">Tất cả</MenuItem>
                            {groups.map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                        </Select>
                    </FormControl>

                    <TextField size="small" placeholder="Tìm nhiệm vụ..." value={query} onChange={(e) => setQuery(e.target.value)} sx={{ minWidth: 220 }} />

                    <Box sx={{ flexGrow: 1 }} />
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Thêm nhanh từ mẫu</InputLabel>
                        <Select label="Thêm nhanh từ mẫu" value="" onChange={(e) => {
                            const name = DEFAULT_TEMPLATES.find(t => t.key === e.target.value)?.name || '';
                            if (!name) return;
                            setTasks(prev => ([...prev, { id: `t-${Math.random().toString(36).slice(2, 7)}`, name, group: group === 'Tất cả' ? 'Chưa phân nhóm' : group, shift, timeframeKey: tfKey, assignedAt: Date.now(), done: false }]));
                        }} renderValue={() => ''}>
                            {DEFAULT_TEMPLATES.map(t => (<MenuItem key={t.key} value={t.key}>{t.name}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={() => { setEditMode('add'); setForm({ id: '', name: '', group: (group === 'Tất cả' ? '' : group), shift }); setErrors({}); setEditOpen(true); }} sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}>Thêm nhiệm vụ</Button>
                </Toolbar>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(groupedByGroup).map(([gName, list]) => (
                        <Paper key={gName} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}`, background: alpha(COLORS.SECONDARY[50], 0.2) }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1, gap: 1.5 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.SECONDARY }}>{gName}</Typography>
                                    <Chip size="small" label={`${list.length} nhiệm vụ`} />
                                </Stack>
                            </Stack>
                            <Stack spacing={1}>
                                {list.map(item => (
                                    <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ p: 1.5, borderRadius: 2, background: alpha(COLORS.SUCCESS[50], 0.3), border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.2)}`, gap: { xs: 1, sm: 2 } }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                            <Chip size="small" label={item.shift} />
                                            <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" color="primary" onClick={() => { setEditMode('edit'); setForm({ id: item.id, name: item.name, group: item.group, shift: item.shift }); setErrors({}); setEditOpen(true); }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setTasks(prev => prev.filter(x => x.id !== item.id))}><Delete fontSize="small" /></IconButton>
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>
                    ))}
                    {Object.keys(groupedByGroup).length === 0 && (
                        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}` }}>
                            <Typography>Chưa có nhiệm vụ nào trong phạm vi lọc.</Typography>
                        </Paper>
                    )}
                </Box>

                {/* Add/Edit Task Dialog */}
                <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>{editMode === 'add' ? 'Thêm nhiệm vụ' : 'Sửa nhiệm vụ'}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField label="Tên nhiệm vụ" value={form.name} error={!!errors.name} helperText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                            <FormControl fullWidth>
                                <InputLabel>Nhóm</InputLabel>
                                <Select label="Nhóm" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                                    <MenuItem value="">Chưa phân nhóm</MenuItem>
                                    {groups.map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Ca làm</InputLabel>
                                <Select label="Ca làm" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                                    {shifts.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditOpen(false)}>Hủy</Button>
                        <Button variant="contained" onClick={() => {
                            const errs = {};
                            if (!form.name?.trim()) errs.name = 'Bắt buộc';
                            setErrors(errs);
                            if (Object.keys(errs).length) return;
                            if (editMode === 'add') {
                                setTasks(prev => ([...prev, { id: `t-${Math.random().toString(36).slice(2, 7)}`, name: form.name, group: form.group, shift: form.shift, timeframeKey: tfKey, assignedAt: Date.now(), done: false }]));
                            } else {
                                setTasks(prev => prev.map(t => t.id === form.id ? { ...t, name: form.name, group: form.group, shift: form.shift } : t));
                            }
                            setEditOpen(false);
                        }}>Lưu</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default TasksPage;


