import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, 
    Menu, MenuItem, useTheme, alpha, Container, Stack
} from '@mui/material';
import {
    LocalCafe, Restaurant, ConfirmationNumber, LocationOn, AccountCircle, 
    Menu as MenuIcon, Close, Pets
} from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const navItems = [
        { label: 'Đồ ăn & Đồ uống', path: '/menu', icon: <Restaurant /> },
        { label: 'Vé', path: '/tickets', icon: <ConfirmationNumber /> },
        { label: 'Khu vực', path: '/areas', icon: <LocationOn /> }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                backdropFilter: 'blur(25px)',
                borderBottom: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                boxShadow: `0 8px 32px ${alpha(COLORS.ERROR[200], 0.2)}`,
            }}
        >
            <Container maxWidth="lg">
                <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                    {/* Logo */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'all 0.3s ease'
                            }
                        }}
                        onClick={() => handleNavigation('/')}
                    >
                        <Box
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${COLORS.ERROR[300]}, ${COLORS.SECONDARY[300]}, ${COLORS.WARNING[300]})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.4)}`,
                            }}
                        >
                            <LocalCafe sx={{ fontSize: 28, color: 'white' }} />
                        </Box>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: 'bold',
                                color: COLORS.ERROR[500],
                                fontFamily: '"Comic Sans MS", cursive',
                                textShadow: `1px 1px 2px ${alpha(COLORS.ERROR[300], 0.3)}`
                            }}
                        >
                            Pet Cafe
                        </Typography>
                    </Box>

                    {/* Desktop Navigation */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                startIcon={item.icon}
                                sx={{
                                    color: isActive(item.path) ? COLORS.ERROR[500] : COLORS.TEXT.SECONDARY,
                                    fontWeight: isActive(item.path) ? 'bold' : 500,
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1,
                                    borderRadius: 3,
                                    backgroundColor: isActive(item.path) 
                                        ? alpha(COLORS.ERROR[100], 0.3) 
                                        : 'transparent',
                                    border: isActive(item.path) 
                                        ? `2px solid ${alpha(COLORS.ERROR[300], 0.5)}` 
                                        : '2px solid transparent',
                                    '&:hover': {
                                        backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                        borderColor: alpha(COLORS.ERROR[300], 0.3),
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[200], 0.2)}`,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    {/* Profile Avatar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            onClick={handleProfileMenuOpen}
                            sx={{
                                p: 0,
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 45,
                                    height: 45,
                                    background: `linear-gradient(135deg, ${COLORS.ERROR[400]}, ${COLORS.SECONDARY[400]})`,
                                    border: `3px solid ${alpha(COLORS.ERROR[200], 0.5)}`,
                                    boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[300], 0.3)}`,
                                }}
                            >
                                <AccountCircle sx={{ fontSize: 30, color: 'white' }} />
                            </Avatar>
                        </IconButton>

                        {/* Mobile Menu Button */}
                        <IconButton
                            sx={{ display: { xs: 'block', md: 'none' }, color: COLORS.ERROR[500] }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <Close /> : <MenuIcon />}
                        </IconButton>
                    </Box>

                    {/* Profile Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                borderRadius: 3,
                                background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                                backdropFilter: 'blur(25px)',
                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                                boxShadow: `0 20px 40px ${alpha(COLORS.ERROR[200], 0.2)}`,
                                minWidth: 200,
                            }
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                handleNavigation('/profile');
                                handleProfileMenuClose();
                            }}
                            sx={{
                                color: COLORS.ERROR[500],
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                }
                            }}
                        >
                            <AccountCircle sx={{ mr: 2 }} />
                            Hồ sơ cá nhân
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleNavigation('/settings');
                                handleProfileMenuClose();
                            }}
                            sx={{
                                color: COLORS.ERROR[500],
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                }
                            }}
                        >
                            <Pets sx={{ mr: 2 }} />
                            Cài đặt
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleNavigation('/login');
                                handleProfileMenuClose();
                            }}
                            sx={{
                                color: COLORS.ERROR[500],
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                }
                            }}
                        >
                            Đăng xuất
                        </MenuItem>
                    </Menu>
                </Toolbar>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <Box
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            py: 2,
                            borderTop: `1px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                        }}
                    >
                        <Stack spacing={1} sx={{ px: 2 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    startIcon={item.icon}
                                    fullWidth
                                    sx={{
                                        color: isActive(item.path) ? COLORS.ERROR[500] : COLORS.TEXT.SECONDARY,
                                        fontWeight: isActive(item.path) ? 'bold' : 500,
                                        textTransform: 'none',
                                        py: 2,
                                        borderRadius: 3,
                                        backgroundColor: isActive(item.path) 
                                            ? alpha(COLORS.ERROR[100], 0.3) 
                                            : 'transparent',
                                        border: isActive(item.path) 
                                            ? `2px solid ${alpha(COLORS.ERROR[300], 0.5)}` 
                                            : '2px solid transparent',
                                        justifyContent: 'flex-start',
                                        '&:hover': {
                                            backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                            borderColor: alpha(COLORS.ERROR[300], 0.3),
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Container>
        </AppBar>
    );
};

export default Navbar;
