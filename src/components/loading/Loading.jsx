import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { Pets, Coffee } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

// Keyframe animations
const bounce = keyframes`
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
    }
    40%, 43% {
        transform: translate3d(0, -15px, 0);
    }
    70% {
        transform: translate3d(0, -7px, 0);
    }
    90% {
        transform: translate3d(0, -3px, 0);
    }
`;

const pulse = keyframes`
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
`;

const float = keyframes`
    0%, 100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.7;
    }
    50% {
        transform: translateY(-10px) rotate(2deg);
        opacity: 1;
    }
`;

const Loading = ({
    message = 'Đang tải...',
    size = 'medium',
    variant = 'default',
    fullScreen = false
}) => {
    // Size configurations
    const sizeConfig = {
        small: {
            container: { width: 200, height: 150 },
            icon: 40,
            progress: 35,
            text: '0.9rem'
        },
        medium: {
            container: { width: 300, height: 200 },
            icon: 60,
            progress: 50,
            text: '1.1rem'
        },
        large: {
            container: { width: 400, height: 250 },
            icon: 80,
            progress: 65,
            text: '1.3rem'
        }
    };

    const config = sizeConfig[size] || sizeConfig.medium;

    // Loading variants
    const LoadingSpinner = () => (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3
            }}
        >
            {/* Main Loading Circle */}
            <Box sx={{ position: 'relative' }}>
                <CircularProgress
                    size={config.progress}
                    thickness={4}
                    sx={{
                        color: COLORS.ERROR[500],
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round'
                        }
                    }}
                />

                {/* Center Pet Icon */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: `${pulse} 2s ease-in-out infinite`
                    }}
                >
                    <Pets
                        sx={{
                            fontSize: config.icon * 0.6,
                            color: COLORS.SECONDARY[500]
                        }}
                    />
                </Box>
            </Box>

            {/* Loading Text */}
            <Typography
                variant="h6"
                sx={{
                    fontSize: config.text,
                    fontWeight: 600,
                    color: COLORS.TEXT.PRIMARY,
                    textAlign: 'center',
                    animation: `${pulse} 2s ease-in-out infinite 0.5s`
                }}
            >
                {message}
            </Typography>
        </Box>
    );

    const LoadingDots = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3
            }}
        >
            {/* Pet Icon */}
            <Pets
                sx={{
                    fontSize: config.icon,
                    color: COLORS.ERROR[500],
                    animation: `${bounce} 2s ease-in-out infinite`
                }}
            />

            {/* Animated Dots */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {[0, 1, 2].map((index) => (
                    <Box
                        key={index}
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.ERROR[400]} 100%)`,
                            animation: `${bounce} 1.4s ease-in-out infinite`,
                            animationDelay: `${index * 0.16}s`
                        }}
                    />
                ))}
            </Box>

            {/* Loading Text */}
            <Typography
                variant="h6"
                sx={{
                    fontSize: config.text,
                    fontWeight: 600,
                    color: COLORS.TEXT.PRIMARY,
                    textAlign: 'center'
                }}
            >
                {message}
            </Typography>
        </Box>
    );

    const LoadingCafe = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3
            }}
        >
            {/* Coffee Icon */}
            <Coffee
                sx={{
                    fontSize: config.icon,
                    color: COLORS.SECONDARY[500],
                    animation: `${pulse} 2s ease-in-out infinite`
                }}
            />

            {/* Progress Bar */}
            <Box
                sx={{
                    width: config.container.width * 0.7,
                    height: 6,
                    backgroundColor: alpha(COLORS.SECONDARY[200], 0.3),
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, ${COLORS.SECONDARY[400]} 0%, ${COLORS.ERROR[400]} 50%, ${COLORS.SECONDARY[400]} 100%)`,
                        backgroundSize: '200% 100%',
                        animation: `${keyframes`
                            0% { backgroundPosition: 200% 0; }
                            100% { backgroundPosition: -200% 0; }
                        `} 2s ease-in-out infinite`,
                        borderRadius: 3
                    }}
                />
            </Box>

            {/* Loading Text */}
            <Typography
                variant="h6"
                sx={{
                    fontSize: config.text,
                    fontWeight: 600,
                    color: COLORS.TEXT.PRIMARY,
                    textAlign: 'center'
                }}
            >
                {message}
            </Typography>
        </Box>
    );

    const renderLoadingContent = () => {
        switch (variant) {
            case 'dots':
                return <LoadingDots />;
            case 'cafe':
                return <LoadingCafe />;
            default:
                return <LoadingSpinner />;
        }
    };

    const LoadingContainer = ({ children }) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: fullScreen ? '100vw' : config.container.width,
                height: fullScreen ? '100vh' : config.container.height,
                background: fullScreen ? `
                    radial-gradient(circle at 25% 25%, ${alpha(COLORS.SECONDARY[200], 0.4)} 0%, transparent 60%),
                    radial-gradient(circle at 75% 75%, ${alpha(COLORS.WARNING[200], 0.3)} 0%, transparent 60%),
                    linear-gradient(135deg, 
                        ${COLORS.SECONDARY[50]} 0%, 
                        ${alpha(COLORS.WARNING[50], 0.9)} 25%,
                        ${alpha(COLORS.ERROR[50], 0.8)} 50%,
                        ${alpha(COLORS.SECONDARY[100], 0.6)} 100%
                    )
                ` : 'transparent',
                position: fullScreen ? 'fixed' : 'relative',
                top: fullScreen ? 0 : 'auto',
                left: fullScreen ? 0 : 'auto',
                zIndex: fullScreen ? 9999 : 'auto',
                borderRadius: fullScreen ? 0 : 3,
                mx: 'auto'
            }}
        >
            {/* Floating decorative elements for full screen */}
            {fullScreen && (
                <>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '15%',
                            left: '10%',
                            fontSize: 35,
                            opacity: 0.3,
                            animation: `${float} 8s ease-in-out infinite`,
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        🐱
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '20%',
                            right: '12%',
                            fontSize: 30,
                            opacity: 0.3,
                            animation: `${float} 10s ease-in-out infinite 3s`,
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        🐶
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '60%',
                            left: '8%',
                            opacity: 0.3,
                            animation: `${float} 12s ease-in-out infinite 2s`,
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        <Coffee sx={{ fontSize: 35, color: alpha(COLORS.SECONDARY[400], 0.7) }} />
                    </Box>
                </>
            )}

            {/* Main loading content */}
            <Box
                sx={{
                    background: fullScreen ? `
                        linear-gradient(135deg, 
                            ${alpha(COLORS.COMMON.WHITE, 0.95)} 0%, 
                            ${alpha(COLORS.SECONDARY[50], 0.8)} 100%
                        )
                    ` : 'transparent',
                    backdropFilter: fullScreen ? 'blur(10px)' : 'none',
                    borderRadius: fullScreen ? 4 : 0,
                    padding: fullScreen ? { xs: 4, md: 6 } : 0,
                    border: fullScreen ? `1px solid ${alpha(COLORS.SECONDARY[200], 0.3)}` : 'none',
                    boxShadow: fullScreen ? `
                        0 20px 40px ${alpha(COLORS.SECONDARY[400], 0.1)},
                        0 8px 32px ${alpha(COLORS.ERROR[400], 0.08)}
                    ` : 'none',
                    minWidth: { xs: 280, sm: config.container.width },
                    mx: fullScreen ? 2 : 0
                }}
            >
                {children}
            </Box>
        </Box>
    );

    return <LoadingContainer>{renderLoadingContent()}</LoadingContainer>;
};

export default Loading;
