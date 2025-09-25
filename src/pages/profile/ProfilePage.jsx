import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Stack, TextField, Button, IconButton, Chip, alpha } from '@mui/material';
import { Edit, Pets, Upload } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const ProfilePage = () => {
  const [user, setUser] = useState({
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    address: '123 Đường Pet, Quận Cafe',
    avatar: ''
  });

  const [pets, setPets] = useState([
    { id: 'dog-1', name: 'Bông', type: 'Chó', note: 'Thích chạy nhảy' },
    { id: 'cat-1', name: 'Miu', type: 'Mèo', note: 'Ngủ cả ngày' }
  ]);

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUser((u) => ({ ...u, avatar: url }));
  };

  return (
    <Box sx={{ background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.7)}, ${alpha(COLORS.PRIMARY[50], 0.7)})` }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500], mb: 1, fontFamily: '"Comic Sans MS", cursive' }}>Hồ sơ cá nhân</Typography>
          <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY }}>Quản lý thông tin của bạn và thú cưng 🐾</Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left: Avatar & quick actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: `0 16px 36px ${alpha(COLORS.ERROR[200], 0.25)}` }}>
              <CardContent>
                <Stack alignItems="center" spacing={2}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar src={user.avatar} sx={{ width: 140, height: 140, border: `4px solid ${alpha(COLORS.ERROR[200], 0.6)}`, boxShadow: `0 10px 24px ${alpha(COLORS.ERROR[200], 0.3)}` }} />
                    <IconButton component="label" sx={{ position: 'absolute', bottom: 4, right: 4, bgcolor: COLORS.ERROR[500], color: 'white', '&:hover': { bgcolor: COLORS.ERROR[600] } }}>
                      <Upload />
                      <input hidden type="file" accept="image/*" onChange={handleAvatar} />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" sx={{ color: COLORS.ERROR[600], fontWeight: 700 }}>{user.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip icon={<Pets />} label="Thành viên Pet Cafe" color="error" sx={{ color: 'white', fontWeight: 700 }} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Info form & pets */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 4, borderRadius: 4, boxShadow: `0 16px 36px ${alpha(COLORS.ERROR[200], 0.25)}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[500], mb: 2 }}>Thông tin cá nhân</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Họ và tên" name="name" value={user.name} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" name="email" value={user.email} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Số điện thoại" name="phone" value={user.phone} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Địa chỉ" name="address" value={user.address} onChange={handleChange} />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button variant="contained" sx={{ textTransform: 'none', background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]})` }}>Lưu thay đổi</Button>
                  <Button variant="outlined" sx={{ textTransform: 'none', borderColor: COLORS.ERROR[300], color: COLORS.ERROR[600] }}>Hủy</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;
