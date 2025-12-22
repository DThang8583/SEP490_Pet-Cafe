import React from 'react';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button, IconButton, alpha } from '@mui/material';
import { Close, CheckCircle, Warning, Error as ErrorIcon, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const AlertModal = ({
    isOpen = false,
    open = false, // Support both "open" and "isOpen" for backward compatibility
    onClose,
    title = "Thông báo",
    message = "",
    type = "info",
    okText = "OK"
}) => {
    // Use either "open" or "isOpen" prop
    const modalOpen = open || isOpen;
    // Get icon based on type
    const getIcon = () => {
        const iconProps = {
            sx: {
                fontSize: 32,
                color: getThemeColors().iconColor
            }
        };

        switch (type) {
            case "success":
                return <CheckCircle {...iconProps} />;
            case "warning":
                return <Warning {...iconProps} />;
            case "error":
                return <ErrorIcon {...iconProps} />;
            default:
                return <Info {...iconProps} />;
        }
    };

    // Get theme colors based on type
    const getThemeColors = () => {
        switch (type) {
            case "success":
                return {
                    iconBg: alpha(COLORS.SUCCESS[50], 0.8),
                    iconColor: COLORS.SUCCESS[500],
                    buttonBg: COLORS.SUCCESS[500],
                    buttonHover: COLORS.SUCCESS[600],
                    gradientStart: COLORS.SUCCESS[500],
                    gradientEnd: COLORS.SUCCESS[600]
                };
            case "warning":
                return {
                    iconBg: alpha(COLORS.WARNING[50], 0.8),
                    iconColor: COLORS.WARNING[500],
                    buttonBg: COLORS.WARNING[500],
                    buttonHover: COLORS.WARNING[600],
                    gradientStart: COLORS.WARNING[500],
                    gradientEnd: COLORS.WARNING[600]
                };
            case "error":
                return {
                    iconBg: alpha(COLORS.ERROR[50], 0.8),
                    iconColor: COLORS.ERROR[500],
                    buttonBg: COLORS.ERROR[500],
                    buttonHover: COLORS.ERROR[600],
                    gradientStart: COLORS.ERROR[500],
                    gradientEnd: COLORS.ERROR[600]
                };
            default:
                return {
                    iconBg: alpha(COLORS.PRIMARY[50], 0.8),
                    iconColor: COLORS.PRIMARY[500],
                    buttonBg: COLORS.PRIMARY[500],
                    buttonHover: COLORS.PRIMARY[600],
                    gradientStart: COLORS.PRIMARY[500],
                    gradientEnd: COLORS.PRIMARY[600]
                };
        }
    };

    const themeColors = getThemeColors();

    // Handle keyboard events
    const handleKeyDown = (event, reason) => {
        if (reason === 'escapeKeyDown' || event?.key === 'Enter' || event?.key === 'Escape') {
            onClose?.();
        }
    };

    return (
        <Dialog
            open={modalOpen}
            onClose={(event, reason) => handleKeyDown(event, reason)}
            maxWidth="sm"
            fullWidth
            sx={{
                zIndex: 1400 // Đảm bảo AlertModal hiển thị trên các Dialog khác (MUI Dialog mặc định là 1300)
            }}
            PaperProps={{
                sx: {
                    borderRadius: 6,
                    boxShadow: `0 25px 50px -12px ${alpha(COLORS.SHADOW.DARK, 0.25)}, 0 0 0 1px ${alpha(COLORS.GRAY[100], 0.5)}`,
                    overflow: 'visible',
                    position: 'relative',
                    m: 2,
                    maxWidth: '28rem',
                    pointerEvents: 'auto',
                    zIndex: 1401 // Đảm bảo Paper có z-index cao hơn backdrop
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 1399 // Backdrop phải thấp hơn Dialog một chút
                }
            }}
        >
            {/* Gradient Top Bar */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${themeColors.gradientStart}, ${themeColors.gradientEnd})`
                }}
            />

            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 4,
                    pb: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Icon Container */}
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 4,
                            backgroundColor: themeColors.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                        }}
                    >
                        {getIcon()}
                    </Box>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: COLORS.TEXT.PRIMARY
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        width: 40,
                        height: 40,
                        color: COLORS.GRAY[600],
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[100], 0.8)
                        },
                        '&:active': {
                            transform: 'scale(0.95)'
                        }
                    }}
                >
                    <Close />
                </IconButton>
            </Box>

            {/* Message Content */}
            <DialogContent sx={{ px: 4, pb: 3 }}>
                <Typography
                    variant="body1"
                    component="div"
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line'
                    }}
                >
                    {message}
                </Typography>
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions
                sx={{
                    px: 4,
                    py: 3,
                    borderTop: `1px solid ${COLORS.GRAY[100]}`,
                    backgroundColor: alpha(COLORS.GRAY[50], 0.5)
                }}
            >
                <Button
                    onClick={onClose}
                    fullWidth
                    autoFocus
                    sx={{
                        py: 2,
                        px: 3,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: COLORS.COMMON.WHITE,
                        backgroundColor: themeColors.buttonBg,
                        borderRadius: 4,
                        textTransform: 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: themeColors.buttonHover,
                            opacity: 0.9
                        },
                        '&:active': {
                            transform: 'scale(0.98)'
                        },
                        '&:focus': {
                            outline: 'none',
                            boxShadow: `0 0 0 4px ${alpha(themeColors.buttonBg, 0.2)}`
                        }
                    }}
                >
                    {okText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertModal;

