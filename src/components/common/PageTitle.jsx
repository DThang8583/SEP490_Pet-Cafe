import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../constants/colors';

const PageTitle = ({ title, subtitle, center = true, sx = {} }) => {
    return (
        <Box sx={{ textAlign: center ? 'center' : 'left', mb: 2, ...sx }}>
            {subtitle && (
                <Typography variant="subtitle2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic', mb: 1 }}>
                    {subtitle}
                </Typography>
            )}
            <Typography
                variant="h3"
                sx={{
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    color: COLORS.TEXT.PRIMARY,
                    fontFamily: 'Times, serif',
                    fontSize: { xs: '2rem', md: '3rem' }
                }}
            >
                {title}
            </Typography>
        </Box>
    );
};

export default PageTitle;


