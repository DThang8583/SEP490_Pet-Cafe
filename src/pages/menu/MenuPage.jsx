import React, { useMemo, useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Stack, Chip, TextField, InputAdornment, ToggleButton, ToggleButtonGroup, alpha, Fade, Slide, Grow } from '@mui/material';
import { Search, LocalCafe, Fastfood, Cake, Pets } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const FALLBACK_BY_TYPE = {
  drink: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?q=80&w=800&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
  dessert: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop'
};

const ALL_ITEMS = [
  { id: 'drink-1', type: 'drink', name: 'Cà phê đen', price: 25000, img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop', desc: 'Đậm vị, thơm nồng', tags: ['signature'] },
  { id: 'drink-2', type: 'drink', name: 'Latte', price: 40000, img: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800&auto=format&fit=crop', desc: 'Sữa mịn, nhẹ nhàng', tags: ['best seller'] },
  { id: 'drink-3', type: 'drink', name: 'Trà sữa trân châu', price: 30000, img: 'https://images.unsplash.com/photo-1546177461-88b118a8b8a9?q=80&w=800&auto=format&fit=crop', desc: 'Ngọt dịu, topping vui' },
  { id: 'food-1', type: 'food', name: 'Sandwich gà nướng', price: 55000, img: 'https://images.unsplash.com/photo-1604908554027-4445d59e3c77?q=80&w=800&auto=format&fit=crop', desc: 'No lâu, giàu đạm', tags: ['protein'] },
  { id: 'food-2', type: 'food', name: 'Salad rau củ', price: 40000, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop', desc: 'Thanh mát, nhiều chất xơ', tags: ['healthy'] },
  { id: 'dessert-1', type: 'dessert', name: 'Tiramisu', price: 45000, img: 'https://images.unsplash.com/photo-1612208695882-3e95f9792f1d?q=80&w=800&auto=format&fit=crop', desc: 'Mềm mịn, thơm cacao', tags: ['sweet'] },
  { id: 'dessert-2', type: 'dessert', name: 'Bánh tart trái cây', price: 50000, img: 'https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=800&auto=format&fit=crop', desc: 'Chua ngọt hài hòa' },
];

const formatPrice = (v) => v.toLocaleString('vi-VN') + 'đ';

const MenuPage = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const filtered = useMemo(() => {
    return ALL_ITEMS.filter((i) => (type === 'all' || i.type === type) && i.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, type]);

  return (
    <Box sx={{ background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.7)}, ${alpha(COLORS.PRIMARY[50], 0.7)})`, position: 'relative' }}>
      {/* Subtle paw background */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(circle at 15% 20%, ${alpha(COLORS.ERROR[100], 0.35)} 0 6px, transparent 7px), radial-gradient(circle at 80% 70%, ${alpha(COLORS.INFO[100], 0.3)} 0 5px, transparent 6px)`, backgroundSize: '240px 240px' }} />

      {/* Hero */}
      <Box sx={{ py: 10, position: 'relative' }}>
        <Container maxWidth="lg">
          <Slide direction="up" in={isVisible} timeout={1000}>
            <Stack direction="column" alignItems="center" spacing={5} textAlign="center">
              <Box sx={{ maxWidth: 900 }}>
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
                  🍽️ Thực đơn Pet Cafe
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: COLORS.TEXT.SECONDARY, 
                    mb: 4,
                    lineHeight: 1.8,
                    animation: 'fadeInUp 2s ease-out'
                  }}
                >
                  Đồ uống thơm – món ăn ngon – bánh ngọt đáng yêu. 
                  Không gian thân thiện cho bạn và thú cưng 🐾
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                  <Chip 
                    icon={<LocalCafe />} 
                    label="Đồ uống đặc trưng" 
                    sx={{ 
                      bgcolor: alpha(COLORS.ERROR[100], 0.7), 
                      color: COLORS.ERROR[700], 
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 2,
                      py: 1,
                      animation: 'chipFloat 2s ease-in-out infinite'
                    }} 
                  />
                  <Chip 
                    icon={<Fastfood />} 
                    label="Đồ ăn nhẹ" 
                    sx={{ 
                      bgcolor: alpha(COLORS.SECONDARY[100], 0.7), 
                      color: COLORS.SECONDARY[700], 
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 2,
                      py: 1,
                      animation: 'chipFloat 2s ease-in-out infinite 0.5s'
                    }} 
                  />
                  <Chip 
                    icon={<Cake />} 
                    label="Bánh ngọt tươi" 
                    sx={{ 
                      bgcolor: alpha(COLORS.INFO[100], 0.7), 
                      color: COLORS.INFO[700], 
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 2,
                      py: 1,
                      animation: 'chipFloat 2s ease-in-out infinite 1s'
                    }} 
                  />
                </Stack>
              </Box>
              <Box sx={{ 
                width: 250, 
                height: 250, 
                borderRadius: '50%', 
                background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: `0 40px 80px ${alpha(COLORS.ERROR[300], 0.4)}`,
                animation: 'float 6s ease-in-out infinite',
                '&:hover': {
                  transform: 'scale(1.05) rotate(5deg)',
                  transition: 'all 0.4s ease'
                }
              }}>
                <Pets sx={{ fontSize: 140, color: 'white', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
              </Box>
            </Stack>
          </Slide>
        </Container>
      </Box>

      {/* Controls */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: 8 }}>
        <Fade in timeout={1500}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 6 }} justifyContent="center" alignItems="center">
          <TextField
            placeholder="Tìm món..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: COLORS.ERROR[500] }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 720,
              width: '100%',
              mx: 'auto',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(COLORS.SECONDARY[50], 0.8),
                border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                '&:hover': {
                  backgroundColor: alpha(COLORS.SECONDARY[50], 0.9),
                  borderColor: COLORS.ERROR[300],
                  boxShadow: `0 8px 25px ${alpha(COLORS.ERROR[200], 0.2)}`
                },
                '&.Mui-focused': {
                  backgroundColor: COLORS.SECONDARY[50],
                  boxShadow: `0 8px 25px ${alpha(COLORS.ERROR[200], 0.3)}`,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: COLORS.ERROR[500] },
              transition: 'all 0.3s ease'
            }}
          />
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v) => v && setType(v)}
            sx={{
              bgcolor: COLORS.BACKGROUND.DEFAULT,
              borderRadius: 3,
              px: 1,
              boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[200], 0.25)}`,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                border: 'none',
                borderRadius: 2,
                mx: 0.5,
                color: COLORS.TEXT.SECONDARY,
                '&.Mui-selected': {
                  color: COLORS.ERROR[600],
                  backgroundColor: alpha(COLORS.ERROR[100], 0.6)
                },
                '&:hover': {
                  backgroundColor: alpha(COLORS.ERROR[100], 0.4)
                }
              }
            }}
          >
            <ToggleButton value="all">Tất cả</ToggleButton>
            <ToggleButton value="drink"><LocalCafe sx={{ mr: 1 }} />Đồ uống</ToggleButton>
            <ToggleButton value="food"><Fastfood sx={{ mr: 1 }} />Đồ ăn</ToggleButton>
            <ToggleButton value="dessert"><Cake sx={{ mr: 1 }} />Bánh ngọt</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        </Fade>

        {/* Grid */}
        <Grid container spacing={4} justifyContent="center">
          {filtered.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.id} sx={{ display: 'flex', height: 500 }}>
              <Grow in timeout={1200 + index * 200}>
                <Card sx={{
                  width: '100%',
                  height: '100%', // Use full height of Grid item
                  minHeight: 500, // Minimum height to ensure consistency
                  maxHeight: 500, // Maximum height to prevent overflow
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                  backdropFilter: 'blur(30px)',
                  border: `3px solid ${alpha(COLORS.ERROR[200], 0.4)}`,
                  boxShadow: `0 25px 50px ${alpha(COLORS.ERROR[200], 0.25)}`,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
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
                <Box sx={{ position: 'relative' }}>
                  <CardMedia component="img" height="180" image={item.img} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_BY_TYPE[item.type] || FALLBACK_BY_TYPE.default; }} />
                  {item.tags?.length ? (
                    <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 12, left: 12 }}>
                      {item.tags.map((t) => (
                        <Chip key={t} label={t} size="small" sx={{ bgcolor: alpha(COLORS.ERROR[500], 0.9), color: 'white', fontWeight: 700, textTransform: 'capitalize' }} />
                      ))}
                    </Stack>
                  ) : null}
                </Box>
                <CardContent sx={{ 
                  p: 3, 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 300, // Fixed height for content area
                  flex: 1,
                  minHeight: 300,
                  maxHeight: 300
                }}>
                  {/* Header with name and price - fixed height */}
                  <Box sx={{ 
                    height: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: COLORS.ERROR[500],
                        fontSize: '1.1rem',
                        textShadow: `1px 1px 2px ${alpha(COLORS.ERROR[200], 0.3)}`,
                        lineHeight: 1.2,
                        flex: 1,
                        mr: 1
                      }}>
                        {item.name}
                      </Typography>
                      <Chip 
                        label={formatPrice(item.price)} 
                        sx={{ 
                          backgroundColor: COLORS.ERROR[500],
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          px: 2,
                          py: 0.5,
                          boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[500], 0.3)}`,
                          animation: 'priceGlow 2s ease-in-out infinite',
                          flexShrink: 0
                        }} 
                      />
                    </Stack>
                  </Box>
                  
                  {/* Description - fixed height */}
                  <Box sx={{ 
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    flex: 1
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: COLORS.TEXT.SECONDARY, 
                        lineHeight: 1.4,
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        width: '100%',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                  
                  {/* Type indicator - fixed height at bottom */}
                  <Box sx={{ 
                    height: 40,
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Chip 
                      label={item.type === 'drink' ? 'Đồ uống' : item.type === 'food' ? 'Đồ ăn' : 'Bánh ngọt'}
                      sx={{
                        backgroundColor: item.type === 'drink' ? COLORS.ERROR[100] : item.type === 'food' ? COLORS.SECONDARY[100] : COLORS.INFO[100],
                        color: item.type === 'drink' ? COLORS.ERROR[700] : item.type === 'food' ? COLORS.SECONDARY[700] : COLORS.INFO[700],
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        px: 2,
                        py: 0.5
                      }}
                    />
                  </Box>
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

export default MenuPage;
