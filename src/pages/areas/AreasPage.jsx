import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Stack, Button, alpha, Fade, Slide, Grow, Zoom } from '@mui/material';
import { Pets, LocalHotel, Pool, Toys, Spa, LocationOn, Star, AutoAwesome } from '@mui/icons-material';
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
  }
];

const AreasPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Box sx={{ 
      background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.8)}, ${alpha(COLORS.PRIMARY[50], 0.8)})`,
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, ${alpha(COLORS.ERROR[100], 0.15)} 0%, transparent 30%),
          radial-gradient(circle at 80% 80%, ${alpha(COLORS.SECONDARY[100], 0.15)} 0%, transparent 30%)
        `,
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 10, position: 'relative', zIndex: 1 }}>
        <Slide direction="up" in={isVisible} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 'bold', 
                color: COLORS.ERROR[500], 
                mb: 3, 
                fontFamily: '"Comic Sans MS", cursive',
                textShadow: `2px 2px 4px ${alpha(COLORS.ERROR[200], 0.3)}`,
                animation: 'titleGlow 3s ease-in-out infinite',
                '@keyframes titleGlow': {
                  '0%, 100%': {
                    textShadow: `2px 2px 4px ${alpha(COLORS.ERROR[200], 0.3)}`
                  },
                  '50%': {
                    textShadow: `2px 2px 8px ${alpha(COLORS.ERROR[200], 0.5)}, 0 0 20px ${alpha(COLORS.ERROR[100], 0.3)}`
                  }
                }
              }}
            >
              🐾 Khu vực thú cưng
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: COLORS.TEXT.SECONDARY,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.8,
                animation: 'fadeInUp 2s ease-out'
              }}
            >
              Các tầng được thiết kế đặc biệt cho từng loại thú cưng, 
              đảm bảo an toàn và mang lại trải nghiệm tuyệt vời!
            </Typography>
          </Box>
        </Slide>

        <Grid container spacing={6} justifyContent="center">
          {AREAS.map((a, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Grow in timeout={1200 + idx * 400}>
                <Card sx={{
                  height: '100%',
                  borderRadius: 6,
                  background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                  backdropFilter: 'blur(30px)',
                  border: `3px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                  boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[200], 0.25)}`,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[100], 0.1)}, ${alpha(COLORS.SECONDARY[100], 0.1)})`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': { 
                    transform: 'translateY(-15px) scale(1.02)',
                    boxShadow: `0 35px 70px ${alpha(COLORS.ERROR[200], 0.4)}`,
                    border: `3px solid ${alpha(COLORS.ERROR[300], 0.6)}`,
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}>
                <CardContent sx={{ p: 5, position: 'relative', zIndex: 1 }}>
                  <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <Chip 
                      label={a.floor} 
                      sx={{ 
                        backgroundColor: COLORS.ERROR[500], 
                        color: 'white', 
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 2,
                        py: 1,
                        animation: 'chipPulse 2s ease-in-out infinite'
                      }} 
                    />
                    <Box sx={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]})`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white',
                      boxShadow: `0 15px 30px ${alpha(COLORS.ERROR[300], 0.4)}`,
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[300], 0.6)}`
                      }
                    }}>
                      {a.icon}
                    </Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: COLORS.ERROR[500],
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      textShadow: `1px 1px 2px ${alpha(COLORS.ERROR[200], 0.3)}`
                    }}>
                      {a.title}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: COLORS.TEXT.SECONDARY, 
                      textAlign: 'center',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}>
                      {a.desc}
                    </Typography>
                  </Stack>
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {a.features.map((f, i) => (
                      <Stack direction="row" spacing={2} alignItems="center" key={i} sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: alpha(COLORS.SECONDARY[50], 0.6),
                        border: `1px solid ${alpha(COLORS.ERROR[100], 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(COLORS.SECONDARY[100], 0.8),
                          border: `1px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                          transform: 'translateX(5px)'
                        }
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: COLORS.ERROR[500],
                          boxShadow: `0 0 10px ${alpha(COLORS.ERROR[500], 0.5)}`
                        }} />
                        <Typography variant="body2" sx={{ 
                          color: COLORS.TEXT.SECONDARY,
                          fontWeight: 500
                        }}>
                          {f}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ 
                      color: COLORS.TEXT.SECONDARY,
                      fontWeight: 'bold'
                    }}>
                      Giá: <span style={{ color: COLORS.ERROR[600] }}>{a.price}</span>
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<LocationOn />} 
                      sx={{ 
                        background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]})`,
                        borderRadius: 4,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.4)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]})`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 25px ${alpha(COLORS.ERROR[300], 0.5)}`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Đặt vé
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AreasPage;
