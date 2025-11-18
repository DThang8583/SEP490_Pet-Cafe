import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Restaurant, Category } from '@mui/icons-material';
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
                <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.WARNING[600], mb: 2 }}>
                    Quản lý Sản phẩm Menu
                </Typography>

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
