import React, { useMemo, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Stack, Button, TextField } from '@mui/material';
import { COLORS } from '../../constants/colors';

const AttendancePage = () => {
    const [keyword, setKeyword] = useState('');
    const today = useMemo(() => new Date().toLocaleDateString('vi-VN'), []);

    return (
        <Box sx={{ py: 3, minHeight: '100vh', background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                         radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                         radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}` }}>
            <Container maxWidth="xl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ERROR[600] }}>Điểm danh</Typography>
                    <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>Hôm nay: <b>{today}</b></Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: 6, border: `1px solid ${COLORS.BORDER.LIGHT}`, backgroundColor: COLORS.BACKGROUND.PAPER }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
                            <TextField fullWidth placeholder="Tìm nhân viên..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                            <Button variant="contained" color="error">Quét QR/Điểm danh</Button>
                        </Stack>
                        <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>
                            Trang điểm danh đang chờ kết nối API. Bạn có thể thêm logic quét QR hoặc cập nhật trạng thái ca làm ở đây.
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default AttendancePage;


