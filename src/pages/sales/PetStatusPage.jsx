import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Card, CardContent, Typography, Stack, TextField, Button, MenuItem, Chip } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://petcafes.azurewebsites.net/api/pet-groups?order_by=%7B%22order_column%22%3A%22string%22%2C%22order_dir%22%3A%22string%22%7D';

const PetStatusPage = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [groupId, setGroupId] = useState(new URLSearchParams(window.location.search).get('groupId') || '');
    const [status, setStatus] = useState('healthy');
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const resp = await fetch(API_URL);
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setGroups(list);
                if (!groupId && list[0]) setGroupId(list[0].id);
            } catch (e) {
                setError(e.message || 'Không thể tải dữ liệu');
            }
        };
        load();
    }, []);

    const selectedGroup = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

    const saveStatus = () => {
        try {
            const key = 'pet_status_updates';
            const savedAll = JSON.parse(localStorage.getItem(key) || '{}');
            savedAll[groupId] = { status, notes, group: selectedGroup };
            localStorage.setItem(key, JSON.stringify(savedAll));
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        } catch (e) {
            alert('Không thể lưu trạng thái');
        }
    };

    return (
        <Box sx={{ py: 3, minHeight: '100vh', backgroundColor: COLORS.BACKGROUND.NEUTRAL }}>
            <Container maxWidth="sm">
                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}` }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Cập nhật trạng thái thú cưng</Typography>
                            {saved && <Chip color="success" label="Đã lưu" size="small" />}
                        </Stack>

                        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

                        <TextField
                            select
                            fullWidth
                            label="Nhóm thú cưng"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            {groups.map(g => (
                                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Trạng thái"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="healthy">Khỏe mạnh</MenuItem>
                            <MenuItem value="sick">Ốm/đang bệnh</MenuItem>
                            <MenuItem value="recovering">Đang hồi phục</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth
                            label="Ghi chú"
                            multiline
                            minRows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Nhập mô tả ngắn về tình trạng, thuốc, khẩu phần..."
                            sx={{ mb: 2 }}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button variant="outlined" color="error" onClick={() => navigate(-1)}>Quay lại</Button>
                            <Button variant="contained" color="error" onClick={saveStatus}>Lưu trạng thái</Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default PetStatusPage;


