import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Stack, Button, alpha } from '@mui/material';
import { Pets, LocalHotel, Pool, Toys, Spa, LocationOn } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AREAS = [
  {
    floor: 'Tầng 1',
    title: 'Khu vực chó',
    icon: <Pets sx={{ fontSize: 40 }} />,
    desc: 'Không gian rộng rãi dành cho các chú chó hoạt động và vui chơi',
    features: ['Sân chơi rộng 100m²', 'Hồ bơi mini cho chó', 'Khu nghỉ có mái che', 'Dụng cụ vui chơi an toàn'],
    price: '50,000đ/chó/giờ'
  },
  {
    floor: 'Tầng 2',
    title: 'Khu vực mèo',
    icon: <Pets sx={{ fontSize: 40 }} />,
    desc: 'Không gian yên tĩnh và ấm cúng dành cho các chú mèo',
    features: ['Phòng kín với điều hòa', 'Cây leo và kệ cao', 'Khu nghỉ riêng tư', 'Đồ chơi tương tác'],
    price: '40,000đ/mèo/giờ'
  },
  {
    floor: 'Tầng 3',
    title: 'Khu vực chung',
    icon: <Spa sx={{ fontSize: 40 }} />,
    desc: 'Không gian dành cho cả chó và mèo với sự giám sát chặt chẽ',
    features: ['Không gian mở thoáng đãng', 'Sân thượng view đẹp', 'Dịch vụ spa cho thú cưng'],
    price: '60,000đ/thú cưng/giờ'
  }
];

const AreasPage = () => {
  return (
    <Box sx={{ background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.7)}, ${alpha(COLORS.PRIMARY[50], 0.7)})` }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500], mb: 1, fontFamily: '"Comic Sans MS", cursive' }}>Khu vực thú cưng</Typography>
          <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY }}>Các tầng được thiết kế cho từng loại thú cưng, an toàn và thân thiện</Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {AREAS.map((a, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card sx={{
                height: '100%',
                borderRadius: 4,
                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                border: `2px solid ${alpha(COLORS.ERROR[200], 0.25)}`,
                boxShadow: `0 16px 36px ${alpha(COLORS.ERROR[200], 0.25)}`,
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-6px)' }
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Chip label={a.floor} color="error" sx={{ color: 'white', fontWeight: 700 }} />
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      {a.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.ERROR[500] }}>{a.title}</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, textAlign: 'center' }}>{a.desc}</Typography>
                  </Stack>
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {a.features.map((f, i) => (
                      <Stack direction="row" spacing={1} alignItems="center" key={i}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.ERROR[500] }} />
                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>{f}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ color: COLORS.TEXT.SECONDARY }}>Giá: <b style={{ color: COLORS.ERROR[600] }}>{a.price}</b></Typography>
                    <Button variant="outlined" startIcon={<LocationOn />} sx={{ borderColor: COLORS.ERROR[300], color: COLORS.ERROR[600], textTransform: 'none' }}>Đặt vé</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AreasPage;
