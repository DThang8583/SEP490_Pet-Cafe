import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../constants/colors';

const DashboardPage = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: COLORS.BACKGROUND.NEUTRAL
            }}
        >
            <Typography
                variant="h4"
                sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 700 }}
            >
                Đang phát triển
            </Typography>
        </Box>
    );
};

export default DashboardPage;


