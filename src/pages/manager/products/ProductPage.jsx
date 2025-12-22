import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Stack } from '@mui/material';
import { Restaurant, Category, RestaurantMenu } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';

const ProductPage = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: COLORS.BACKGROUND.NEUTRAL,
            width: '100%'
        }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <RestaurantMenu sx={{ fontSize: 32, color: COLORS.PRIMARY[600] }} />
                        <Typography variant="h4" fontWeight={600}>
                            Quản lý Sản phẩm Menu
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Quản lý sản phẩm thức ăn, đồ uống và danh mục menu
                    </Typography>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                fontSize: '0.95rem'
                            }
                        }}
                    >
                        <Tab
                            label="Sản phẩm"
                            icon={<Restaurant />}
                            iconPosition="start"
                            sx={{ minHeight: 48 }}
                        />
                        <Tab
                            label="Danh mục"
                            icon={<Category />}
                            iconPosition="start"
                            sx={{ minHeight: 48 }}
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {currentTab === 0 && <ProductsTab />}
                {currentTab === 1 && <CategoriesTab />}
            </Box>
        </Box>
    );
};

export default ProductPage;
