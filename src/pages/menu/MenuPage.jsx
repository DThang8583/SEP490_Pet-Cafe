import React, { useMemo, useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Stack, Chip, TextField, InputAdornment, alpha, Fade, Slide, Grow, CircularProgress, Alert } from '@mui/material';
import { Search, Pets, LocalCafe, Fastfood, Cake } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const API_URL = 'https://petcafe-htc6dadbayh6h4dz.southeastasia-01.azurewebsites.net/api/product-categories';

const formatPrice = (v) => v.toLocaleString('vi-VN') + 'đ';

// Remove markdown formatting from description
const cleanDescription = (desc) => {
  if (!desc) return 'Không có mô tả';
  return desc
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove headers
    .trim();
};

const MenuPage = () => {
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('authToken');
        const resp = await fetch(API_URL, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json'
          }
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP error! status: ${resp.status}`);
        }
        
        const json = await resp.json();
        const apiCategories = Array.isArray(json?.data) 
          ? json.data.filter(c => c?.is_active && !c?.is_deleted) 
          : [];
        
        // Filter products in each category - chỉ filter is_deleted, không filter is_active
        const processedCategories = apiCategories.map(category => ({
          ...category,
          products: Array.isArray(category.products)
            ? category.products.filter(p => !p?.is_deleted)
            : []
        }));
        
        setCategories(processedCategories);
        
        // Tự động chọn category đầu tiên nếu có và chưa có category nào được chọn
        if (processedCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(processedCategories[0].id);
        }
      } catch (e) {
        console.error('[MenuPage] Error loading categories:', e);
        setError(e.message || 'Không thể tải dữ liệu từ API');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Tự động chọn category đầu tiên khi categories được load và chưa có category nào được chọn
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    if (!query) {
      // Nếu không có query, hiển thị tất cả categories và products
      return categories;
    }
    
    // Nếu có query, filter products nhưng vẫn hiển thị tất cả categories
    return categories.map(category => {
      const filteredProducts = category.products.filter(product => {
        const matchesQuery = 
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase()) ||
          category.name?.toLowerCase().includes(query.toLowerCase());
        return matchesQuery;
      });
      return {
        ...category,
        products: filteredProducts
      };
    });
  }, [query, categories]);

  return (
    <Box sx={{ 
      background: COLORS.BACKGROUND.NEUTRAL || '#fafafa',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Hero Section - Professional & Clean */}
      <Box sx={{ 
        py: { xs: 6, md: 8 }, 
        background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.3)} 0%, ${alpha(COLORS.SECONDARY[50], 0.2)} 100%)`,
        borderBottom: `1px solid ${alpha(COLORS.ERROR[100], 0.3)}`
      }}>
        <Container maxWidth="lg">
          <Stack direction="column" alignItems="center" spacing={3} textAlign="center">
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: COLORS.ERROR[600], 
                mb: 1,
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
            >
              Thực Đơn Pet Cafe
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: COLORS.TEXT.SECONDARY, 
                maxWidth: 700,
                fontWeight: 400,
                lineHeight: 1.7
              }}
            >
              Khám phá bộ sưu tập đồ ăn và thức uống cao cấp dành cho bạn và thú cưng
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Controls Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Search Bar */}
          <Box>
            <TextField
              fullWidth
              placeholder="Tìm kiếm sản phẩm..."
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
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  border: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                  '&:hover': {
                    borderColor: COLORS.ERROR[300],
                  },
                  '&.Mui-focused': {
                    borderColor: COLORS.ERROR[500],
                    boxShadow: `0 0 0 3px ${alpha(COLORS.ERROR[200], 0.1)}`,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputBase-input': {
                  py: 1.5
                }
              }}
            />
          </Box>
            
          {/* Categories */}
          {filteredCategories.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                Danh Mục Sản Phẩm
              </Typography>
              <Grid container spacing={2}>
                {filteredCategories.map((category) => (
                  <Grid key={category.id} sx={{ 
                    width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)', lg: 'calc(20% - 13px)' }
                  }}>
                    <Card
                      onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                      sx={{
                        width: '100%',
                        cursor: 'pointer',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${selectedCategoryId === category.id ? COLORS.ERROR[500] : alpha(COLORS.ERROR[200], 0.2)}`,
                        backgroundColor: selectedCategoryId === category.id ? alpha(COLORS.ERROR[50], 0.5) : 'white',
                        boxShadow: selectedCategoryId === category.id 
                          ? `0 4px 12px ${alpha(COLORS.ERROR[300], 0.25)}`
                          : `0 2px 8px ${alpha(COLORS.ERROR[100], 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 16px ${alpha(COLORS.ERROR[200], 0.3)}`,
                          borderColor: COLORS.ERROR[400],
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', height: 100, position: 'relative', overflow: 'hidden' }}>
                        {category.image_url ? (
                          <CardMedia 
                            component="img" 
                            height="100%" 
                            image={category.image_url} 
                            alt={category.name}
                            sx={{ 
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                        ) : (
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%', 
                            background: `linear-gradient(135deg, ${COLORS.ERROR[100]}, ${COLORS.SECONDARY[100]})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Pets sx={{ fontSize: 40, color: COLORS.ERROR[500], opacity: 0.6 }} />
                          </Box>
                        )}
                      </Box>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: selectedCategoryId === category.id ? 700 : 600,
                            color: selectedCategoryId === category.id ? COLORS.ERROR[700] : COLORS.TEXT.PRIMARY,
                            textAlign: 'center',
                            fontSize: '0.813rem',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {category.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: COLORS.ERROR[500] }} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* Products Grid - Chỉ hiển thị khi có category được chọn */}
        {!loading && !error && selectedCategoryId && (
          <Box>
            {(() => {
              const selectedCategory = filteredCategories.find(c => c.id === selectedCategoryId);
              if (!selectedCategory) return null;
              
              return (
                <Box sx={{ mt: 2 }}>
                  {/* Category Info */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1.5 }}>
                      {selectedCategory.name}
                    </Typography>
                    {selectedCategory.description && (
                      <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, maxWidth: 900, lineHeight: 1.7 }}>
                        {cleanDescription(selectedCategory.description)}
                      </Typography>
                    )}
                  </Box>

                  {/* Products Grid */}
                  {selectedCategory.products && selectedCategory.products.length > 0 ? (
                    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                      {selectedCategory.products.map((product) => (
                      <Grid key={product.id} sx={{ 
                        width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                        display: 'flex', 
                        flexDirection: 'column' 
                      }}>
                        <Card sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: 'white',
                          border: `1px solid ${alpha(COLORS.ERROR[100], 0.15)}`,
                          boxShadow: `0 2px 8px ${alpha(COLORS.ERROR[100], 0.06)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(COLORS.ERROR[200], 0.15)}`,
                            borderColor: alpha(COLORS.ERROR[300], 0.4),
                          }
                        }}>
                            {/* Image Container - Fixed 220px */}
                            <Box sx={{ 
                              position: 'relative', 
                              width: '100%',
                              height: 220,
                              backgroundColor: alpha(COLORS.ERROR[50], 0.2),
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}>
                              <Box
                                component="img"
                                src={product.image_url || (product.thumbnails && product.thumbnails[0]) || ''}
                                alt={product.name}
                                onError={(e) => { 
                                  e.target.onerror = null; 
                                  e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                }}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  transition: 'transform 0.4s ease',
                                  '&:hover': {
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              />
                              {product.is_for_pets && (
                                <Chip 
                                  label="Thú cưng" 
                                  size="small" 
                                  sx={{ 
                                    position: 'absolute',
                                    top: 10,
                                    left: 10,
                                    bgcolor: alpha(COLORS.SECONDARY[600], 0.9), 
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 22,
                                    boxShadow: `0 2px 6px ${alpha(COLORS.SECONDARY[600], 0.3)}`,
                                    '& .MuiChip-label': {
                                      px: 1
                                    }
                                  }} 
                                />
                              )}
                            </Box>

                            {/* Content Area */}
                            <CardContent sx={{ 
                              p: 2.5, 
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              flexGrow: 1,
                              height: '100%'
                            }}>
                              {/* Text Block (Title + Desc) */}
                              <Box>
                                {/* Tên sản phẩm */}
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 600, 
                                  color: COLORS.TEXT.PRIMARY,
                                  fontSize: '1rem',
                                  lineHeight: '1.4',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  height: '54px',
                                  mb: 1.5
                                }}>
                                  {product.name}
                                </Typography>
                                
                                {/* Mô tả */}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: COLORS.TEXT.SECONDARY, 
                                    lineHeight: '1.5',
                                    fontSize: '0.813rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    height: '39px'
                                  }}
                                >
                                  {cleanDescription(product.description)}
                                </Typography>
                              </Box>
                              
                              {/* Footer (Price & Tag) */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                pt: 2,
                                mt: 1.5,
                                borderTop: `1px solid ${alpha(COLORS.ERROR[100], 0.15)}`
                              }}>
                                <Typography variant="h6" sx={{ 
                                  color: COLORS.ERROR[600], 
                                  fontWeight: 700, 
                                  fontSize: '1.125rem'
                                }}>
                                  {formatPrice(product.price || 0)}
                                </Typography>
                                
                                <Chip 
                                  label={product.is_for_pets ? 'Thú cưng' : 'Đồ uống'}
                                  size="small"
                                  sx={{
                                    backgroundColor: product.is_for_pets ? alpha(COLORS.SECONDARY[100], 0.8) : alpha(COLORS.ERROR[100], 0.8),
                                    color: product.is_for_pets ? COLORS.SECONDARY[700] : COLORS.ERROR[700],
                                    fontWeight: 500,
                                    fontSize: '0.688rem',
                                    height: 22
                                  }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY }}>
                      Không có sản phẩm nào trong danh mục này
                    </Typography>
                  </Box>
                )}
                </Box>
              );
            })()}
          </Box>
        )}

        {/* Empty State - Khi chưa chọn category */}
        {!loading && !error && !selectedCategoryId && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Pets sx={{ fontSize: 80, color: alpha(COLORS.ERROR[300], 0.5), mb: 3 }} />
            <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1, fontWeight: 600 }}>
              Chọn một danh mục để xem sản phẩm
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
              Nhấp vào một danh mục ở trên để bắt đầu khám phá
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default MenuPage;
