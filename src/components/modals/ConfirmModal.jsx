import React from 'react';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button, IconButton, CircularProgress, alpha } from '@mui/material';
import { Close, CheckCircle, Warning, Error as ErrorIcon, Info } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

const ConfirmModal = ({
    isOpen = false,
    onClose,
    onConfirm,
    title = "Xác nhận",
    message = "Bạn có chắc chắn muốn thực hiện hành động này?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    type = "info",
    confirmButtonColor,
    isLoading = false,
    children
}) => {
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
                    buttonBg: confirmButtonColor || COLORS.SUCCESS[500],
                    buttonHover: COLORS.SUCCESS[600],
                    gradientStart: COLORS.SUCCESS[500],
                    gradientEnd: COLORS.SUCCESS[600],
                    accent: alpha(COLORS.SUCCESS[100], 0.3)
                };
            case "warning":
                return {
                    iconBg: alpha(COLORS.WARNING[50], 0.8),
                    iconColor: COLORS.WARNING[500],
                    buttonBg: confirmButtonColor || COLORS.WARNING[500],
                    buttonHover: COLORS.WARNING[600],
                    gradientStart: COLORS.WARNING[500],
                    gradientEnd: COLORS.WARNING[600],
                    accent: alpha(COLORS.WARNING[100], 0.3)
                };
            case "error":
                return {
                    iconBg: alpha(COLORS.ERROR[50], 0.8),
                    iconColor: COLORS.ERROR[500],
                    buttonBg: confirmButtonColor || COLORS.ERROR[500],
                    buttonHover: COLORS.ERROR[600],
                    gradientStart: COLORS.ERROR[500],
                    gradientEnd: COLORS.ERROR[600],
                    accent: alpha(COLORS.ERROR[100], 0.3)
                };
            default:
                return {
                    iconBg: alpha(COLORS.PRIMARY[50], 0.8),
                    iconColor: COLORS.PRIMARY[500],
                    buttonBg: confirmButtonColor || COLORS.PRIMARY[500],
                    buttonHover: COLORS.PRIMARY[600],
                    gradientStart: COLORS.PRIMARY[500],
                    gradientEnd: COLORS.PRIMARY[600],
                    accent: alpha(COLORS.PRIMARY[100], 0.3)
                };
        }
    };

    const themeColors = getThemeColors();

    // Handle keyboard events
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !isLoading) {
            onConfirm?.();
        } else if (event.key === 'Escape' && !isLoading) {
            onClose?.();
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={isLoading ? undefined : onClose}
            onKeyDown={handleKeyDown}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 6,
                    boxShadow: `0 25px 50px -12px ${alpha(COLORS.SHADOW.DARK, 0.25)}, 0 0 0 1px ${alpha(COLORS.GRAY[100], 0.5)}`,
                    overflow: 'visible',
                    position: 'relative',
                    m: 2,
                    maxWidth: '28rem'
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
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
                    disabled={isLoading}
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
                        },
                        '&:disabled': {
                            opacity: 0.5
                        }
                    }}
                >
                    <Close />
                </IconButton>
            </Box>

            {/* Message Content */}
            <DialogContent sx={{ px: 4, pb: 3 }}>
                {message && (
                    <Typography
                        variant="body1"
                        sx={{
                            color: COLORS.TEXT.SECONDARY,
                            lineHeight: 1.6,
                            mb: children ? 2 : 0
                        }}
                    >
                        {message}
                    </Typography>
                )}
                {children}
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions
                sx={{
                    px: 4,
                    py: 3,
                    gap: 1.5,
                    borderTop: `1px solid ${COLORS.GRAY[100]}`,
                    backgroundColor: alpha(COLORS.GRAY[50], 0.5)
                }}
            >
                {/* Cancel Button */}
                <Button
                    onClick={onClose}
                    disabled={isLoading}
                    fullWidth
                    sx={{
                        py: 2,
                        px: 3,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: COLORS.GRAY[700],
                        backgroundColor: COLORS.COMMON.WHITE,
                        border: `2px solid ${COLORS.GRAY[200]}`,
                        borderRadius: 4,
                        textTransform: 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: alpha(COLORS.GRAY[50], 0.8),
                            borderColor: COLORS.GRAY[300]
                        },
                        '&:active': {
                            transform: 'scale(0.98)'
                        },
                        '&:disabled': {
                            opacity: 0.5
                        }
                    }}
                >
                    {cancelText}
                </Button>

                {/* Confirm Button */}
                <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    fullWidth
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
                        },
                        '&:disabled': {
                            opacity: 0.5,
                            cursor: 'not-allowed'
                        }
                    }}
                >
                    {isLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress
                                size={20}
                                sx={{
                                    color: COLORS.COMMON.WHITE,
                                    mr: 1
                                }}
                            />
                            Đang xử lý...
                        </Box>
                    ) : (
                        confirmText
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmModal;

