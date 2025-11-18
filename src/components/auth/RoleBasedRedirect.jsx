import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authApi } from '../../api/authApi';
import { COLORS } from '../../constants/colors';

const RoleBasedRedirect = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const checkUserRole = () => {
            try {
                const role = authApi.getUserRole();
                setUserRole(role);
            } catch (error) {
                console.error('Error getting user role:', error);
                setUserRole(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserRole();
    }, []);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${COLORS.BACKGROUND.NEUTRAL} 0%, ${COLORS.PRIMARY[50]} 100%)`
                }}
            >
                <CircularProgress
                    size={60}
                    sx={{
                        color: COLORS.ERROR[500],
                        mb: 2
                    }}
                />
                <Typography
                    variant="h6"
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        fontWeight: 500
                    }}
                >
                    Đang kiểm tra quyền truy cập...
                </Typography>
            </Box>
        );
    }

    // Redirect based on user role
    if (userRole === 'manager') {
        return <Navigate to="/manager/dashboard" replace />;
    } else if (userRole === 'sales_staff') {
        return <Navigate to="/sales/dashboard" replace />;
    } else if (userRole === 'working_staff') {
        return <Navigate to="/staff/dashboard" replace />;
    } else if (userRole === 'customer' || !userRole) {
        // For customers or unauthenticated users, show HomePage
        return <Navigate to="/home" replace />;
    }

    // Default fallback
    return <Navigate to="/home" replace />;
};

export default RoleBasedRedirect;
