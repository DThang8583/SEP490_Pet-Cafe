import React, { useMemo, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Stack, Chip, TextField, InputAdornment, ToggleButton, ToggleButtonGroup, Button, alpha, IconButton, Tooltip } from '@mui/material';
import { Search, LocalCafe, Fastfood, Cake, Pets, Favorite } from '@mui/icons-material';
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

  const filtered = useMemo(() => {
    return ALL_ITEMS.filter((i) => (type === 'all' || i.type === type) && i.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, type]);

  return (
    <Box sx={{ background: `linear-gradient(135deg, ${alpha(COLORS.SECONDARY[50], 0.7)}, ${alpha(COLORS.PRIMARY[50], 0.7)})`, position: 'relative' }}>
      {/* Subtle paw background */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(circle at 15% 20%, ${alpha(COLORS.ERROR[100], 0.35)} 0 6px, transparent 7px), radial-gradient(circle at 80% 70%, ${alpha(COLORS.INFO[100], 0.3)} 0 5px, transparent 6px)`, backgroundSize: '240px 240px' }} />

      {/* Hero */}
      <Box sx={{ py: 8, position: 'relative' }}>
        <Container maxWidth="lg">
          <Stack direction="column" alignItems="center" spacing={4} textAlign="center">
            <Box sx={{ maxWidth: 900 }}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500], mb: 1, fontFamily: '"Comic Sans MS", cursive' }}>
                Thực đơn Pet Cafe
              </Typography>
              <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 3 }}>
                Đồ uống thơm – món ăn ngon – bánh ngọt đáng yêu. Không gian thân thiện cho bạn và thú cưng 🐾
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Chip icon={<LocalCafe />} label="Đồ uống đặc trưng" sx={{ bgcolor: alpha(COLORS.ERROR[100], 0.6), color: COLORS.ERROR[700], fontWeight: 600 }} />
                <Chip icon={<Fastfood />} label="Đồ ăn nhẹ" sx={{ bgcolor: alpha(COLORS.SECONDARY[100], 0.6), color: COLORS.SECONDARY[700], fontWeight: 600 }} />
                <Chip icon={<Cake />} label="Bánh ngọt tươi" sx={{ bgcolor: alpha(COLORS.INFO[100], 0.6), color: COLORS.INFO[700], fontWeight: 600 }} />
              </Stack>
            </Box>
            <Box sx={{ width: 220, height: 220, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 30px 60px ${alpha(COLORS.ERROR[300], 0.35)}` }}>
              <Pets sx={{ fontSize: 120, color: 'white' }} />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Controls */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: 6 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }} justifyContent="center" alignItems="center">
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

        {/* Grid */}
        <Grid container spacing={3} justifyContent="center">
          {filtered.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card sx={{
                height: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                border: `2px solid ${alpha(COLORS.ERROR[200], 0.25)}`,
                boxShadow: `0 16px 36px ${alpha(COLORS.ERROR[200], 0.25)}`,
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 24px 48px ${alpha(COLORS.ERROR[200], 0.35)}` }
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
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[500] }}>{item.name}</Typography>
                    <Chip label={formatPrice(item.price)} color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 2 }}>{item.desc}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="contained" size="small" sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.ERROR[500]}, ${COLORS.SECONDARY[400]})`,
                      boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.35)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]}, ${COLORS.ERROR[600]}, ${COLORS.ERROR[300]})`,
                        transform: 'translateY(-2px)'
                      }
                    }}>Thêm vào giỏ</Button>
                    <Button variant="outlined" size="small" sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      borderColor: COLORS.ERROR[300],
                      color: COLORS.ERROR[600],
                      '&:hover': {
                        borderColor: COLORS.ERROR[500],
                        backgroundColor: alpha(COLORS.ERROR[100], 0.6)
                      }
                    }}>Chi tiết</Button>
                    <Tooltip title="Yêu thích">
                      <IconButton size="small" sx={{ ml: 'auto', color: COLORS.ERROR[500], '&:hover': { bgcolor: alpha(COLORS.ERROR[500], 0.1) } }}>
                        <Favorite fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

export default MenuPage;
