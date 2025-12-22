import React, { useEffect, useMemo, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem, useTheme, alpha, Container, Stack, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, Tooltip, ListSubheader, useMediaQuery, Badge } from '@mui/material';
import { LocalCafe, Restaurant, ConfirmationNumber, LocationOn, AccountCircle, Menu as MenuIcon, Close, Pets, Schedule, Dashboard, People, Groups, Assignment, DesignServices, Inventory2, Logout, Vaccines, ShoppingCart, ReceiptLong, HealthAndSafety, Person, ChecklistRtl, AssignmentTurnedIn, Description, CheckCircle, Fastfood, TrendingUp, Notifications } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../../api/authApi';
import { notificationApi } from '../../../api/notificationApi';
import { useSignalR } from '../../../utils/SignalRContext';

const Navbar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isSales, setIsSales] = useState(false);
    const [isWorkingStaff, setIsWorkingStaff] = useState(false);
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [collapsed, setCollapsed] = useState(false);
    const [isLeader, setIsLeader] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { notification: signalRNotification } = useSignalR();

    const [notificationsSeen, setNotificationsSeen] = useState(
        localStorage.getItem('notifications_seen') === 'true'
    );
    

    useEffect(() => {
        try {
            const role = authApi.getUserRole?.() || null;
            setIsManager(role === 'manager');
            setIsSales(role === 'sales_staff');
            setIsWorkingStaff(role === 'working_staff');
            const currentUser = authApi.getCurrentUser?.();
            setIsLeader(!!(currentUser?.permissions?.includes('shift_management') || currentUser?.permissions?.includes('team_lead')));
        } catch (_) {
            const storedRole = localStorage.getItem('userRole');
            setIsManager(storedRole === 'manager');
            setIsSales(storedRole === 'sales_staff');
            setIsWorkingStaff(storedRole === 'working_staff');
            try {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                setIsLeader(!!(storedUser?.permissions?.includes('shift_management') || storedUser?.permissions?.includes('team_lead')));
            } catch (error) {
                console.warn('Failed to parse stored user for leader flag', error);
            }
        }
    }, []);

    // Fetch unread notification count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const accountId = localStorage.getItem('accountId');
                if (!accountId) return;

                const response = await notificationApi.getNotifications(1, 100, accountId);
                const notifications = response.data || [];
                const unread = notifications.filter(n => !n.is_read).length;

                console.log('[Navbar] Unread count:', unread);
                setUnreadCount(unread);
            } catch (error) {
                console.error('[Navbar] Failed to fetch unread count:', error);
            }
        };

        fetchUnreadCount();

        // Listen for custom event from NotificationsPage when all notifications are marked as read
        const handleNotificationsRead = () => {
            console.log('[Navbar] Notifications marked as read, re-fetching count from API');
            // Fetch lại từ API thay vì set cứng = 0 để đảm bảo chính xác
            fetchUnreadCount();
        };

        window.addEventListener('notificationsMarkedAsRead', handleNotificationsRead);

        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => {
            window.removeEventListener('notificationsMarkedAsRead', handleNotificationsRead);
            clearInterval(interval);
        };
    }, [location.pathname]);

    // Update unread count when new notification arrives via SignalR
    useEffect(() => {
        if (signalRNotification) {
            console.log('[Navbar] New notification received');
    
            setUnreadCount(prev => prev + 1);
    
            // 🔥 QUAN TRỌNG
            localStorage.setItem('notifications_seen', 'false');
            setNotificationsSeen(false);
        }
    }, [signalRNotification]);

    useEffect(() => {
        if (location.pathname === '/notifications') {
            localStorage.setItem('notifications_seen', 'true');
            setNotificationsSeen(true);
        }
    }, [location.pathname]);
    

    // Keep sidebar width synchronized globally for layouts without changing hook order
    useEffect(() => {
        const hasSidebar = (isManager || isSales || isWorkingStaff);
        const widthPx = hasSidebar && isDesktop && sidebarOpen ? (collapsed ? 88 : 280) : 0;
        document.documentElement.style.setProperty('--sidebar-width', `${widthPx}px`);
        return () => {
            document.documentElement.style.setProperty('--sidebar-width', '0px');
        };
    }, [isManager, isSales, isWorkingStaff, isDesktop, sidebarOpen, collapsed]);

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

    const navItems = useMemo(() => [
        { label: 'Đồ ăn & Đồ uống', path: '/menu', icon: <Restaurant /> },
        { label: 'Đặt lịch dịch vụ', path: '/booking', icon: <Schedule /> },
        { label: 'Danh sách chó mèo', path: '/pets', icon: <Pets /> },
        { label: 'Dịch vụ bán chạy', path: '/popular-services', icon: <TrendingUp /> },
        {
            path: '/notifications',
            icon: (
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                    invisible={unreadCount === 0 || notificationsSeen}
                >
                    <Notifications />
                </Badge>
            )
        },
    ], [unreadCount, notificationsSeen]);    
    

    const isActive = (path) => location.pathname === path;

    const managerItems = useMemo(() => ([
        { label: 'Tổng quan', icon: <Dashboard />, path: '/manager/dashboard' },
        { label: 'Thú cưng', icon: <Pets />, path: '/manager/pets' },
        { label: 'Tiêm phòng', icon: <Vaccines />, path: '/manager/vaccinations' },
        { label: 'Khu vực', icon: <LocationOn />, path: '/manager/areas' },
        { label: 'Nhân viên', icon: <People />, path: '/manager/staff' },
        { label: 'Điểm danh', icon: <ChecklistRtl />, path: '/manager/attendance' },
        { label: 'Ca làm việc', icon: <Schedule />, path: '/manager/work-shifts' },
        { label: 'Nhiệm vụ', icon: <Assignment />, path: '/manager/tasks' },
        { label: 'Dịch vụ', icon: <DesignServices />, path: '/manager/services' },
        { label: 'Sản phẩm', icon: <ShoppingCart />, path: '/manager/products' },
        { label: 'Thông báo', icon: <Notifications />, path: '/manager/notifications' },
        { label: 'Tài khoản', icon: <AccountCircle />, path: '/profile' }
    ]), []);

    const salesItems = useMemo(() => ([
        { label: 'Tổng quan', icon: <Dashboard />, path: '/sales/dashboard' },
        { label: 'Bán hàng', icon: <ShoppingCart />, path: '/sales/sales' },
        { label: 'Bán dịch vụ', icon: <DesignServices />, path: '/sales/services' },
        { label: 'Dịch vụ đã đặt', icon: <CheckCircle />, path: '/sales/service-booking-confirm' },
        { label: 'Tổng số đồ ăn đã bán', icon: <Fastfood />, path: '/sales/product-sales-confirm' },
        { label: 'Lịch & nhóm', icon: <Groups />, path: '/sales/teams' },
        { label: 'Điểm danh', icon: <ChecklistRtl />, path: '/sales/attendance' },
        { label: 'Tài khoản', icon: <AccountCircle />, path: '/profile' }
    ]), []);

    const workingItems = useMemo(() => ([
        { label: 'Tổng quan', icon: <Dashboard />, path: '/staff/dashboard' },
        { label: 'Lịch & nhóm', icon: <Groups />, path: '/staff/teams' },
        { label: 'Nhiệm vụ hằng ngày', icon: <Assignment />, path: '/staff/daily-tasks' },
        { label: 'Điểm danh', icon: <ChecklistRtl />, path: '/staff/attendance' },
        { label: 'Xem Booking', icon: <ReceiptLong />, path: '/staff/bookings' },
        // Đơn xin nghỉ phép đã ngừng sử dụng nên ẩn khỏi menu
    ]), []);

    const leaderItems = useMemo(() => ([
        { label: 'Trung tâm nhiệm vụ', icon: <AssignmentTurnedIn />, path: '/staff/leader/task-center' },
        { label: 'Khách đặt lịch', icon: <ReceiptLong />, path: '/staff/leader/bookings' }
    ]), []);

    const handleLogout = async () => {
        try {
            await authApi.logout?.();
        } catch (_) {
            // ignore silently for mock
        } finally {
            navigate('/login');
        }
    };

    const showSidebar = isManager || isSales || isWorkingStaff;

    const isItemActive = (path) => {
        if (!path) return false;
        if (location.pathname === path) return true;
        return location.pathname.startsWith(`${path}/`);
    };

    if (showSidebar) {
        const drawerWidth = collapsed ? 88 : 280;
        const baseItems = isManager ? managerItems : isSales ? salesItems : workingItems;
        const roleLabel = isManager ? 'Quản lý' : isSales ? 'Nhân viên bán hàng' : 'Nhân viên chăm sóc';
        return (
            <Box sx={{ display: 'flex' }}>
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        background: `linear-gradient(135deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.95)}, ${alpha(COLORS.SECONDARY[50], 0.9)})`,
                        backdropFilter: 'blur(25px)',
                        borderBottom: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                        boxShadow: `0 8px 32px ${alpha(COLORS.ERROR[200], 0.2)}`,
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <IconButton onClick={() => setSidebarOpen((v) => !v)} sx={{ color: COLORS.ERROR[500] }}>
                            <MenuIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => navigate('/')}>
                            <Box
                                component="img"
                                src="/LogoPet.png"
                                alt="Pet Cafe Logo"
                                sx={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'contain' }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.ERROR[500] }}>Pet Cafe Manager</Typography>
                        </Box>
                        <IconButton onClick={handleLogout} sx={{ color: COLORS.ERROR[500] }}>
                            <Logout />
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Drawer
                    variant={isDesktop ? 'permanent' : 'persistent'}
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    ModalProps={{
                        keepMounted: true,
                        disableEnforceFocus: true,
                        disableAutoFocus: true
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            background: `linear-gradient(145deg, ${alpha(COLORS.BACKGROUND.DEFAULT, 0.98)}, ${alpha(COLORS.SECONDARY[50], 0.95)})`,
                            borderRight: `2px solid ${alpha(COLORS.ERROR[200], 0.3)}`,
                            backdropFilter: 'blur(20px)',
                            px: 1
                        }
                    }}
                >
                    <Box
                        sx={{
                            p: collapsed ? 1.5 : 2,
                            display: 'flex',
                            flexDirection: collapsed ? 'column' : 'row',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'space-between',
                            gap: collapsed ? 1.5 : 2.5
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <Box
                                component="img"
                                src="/LogoPet.png"
                                alt="Pet Cafe Logo"
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    objectFit: 'contain',
                                    boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.25)}`
                                }}
                            />
                            {!collapsed && (
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.ERROR[600], lineHeight: 1 }}>Pet Cafe</Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                        {isManager ? 'Manager' : isSales ? 'Sales' : 'Nhân viên'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {isDesktop && (
                            <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="left">
                                <IconButton onClick={() => setCollapsed(v => !v)} sx={{ color: COLORS.ERROR[500] }}>
                                    {collapsed ? <MenuIcon /> : <Close />}
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                    <Divider />
                    <List
                        subheader={!collapsed ? (
                            <ListSubheader component="div" sx={{ background: 'transparent', color: COLORS.TEXT.SECONDARY, fontWeight: 700 }}>
                                {roleLabel}
                            </ListSubheader>
                        ) : null}
                    >
                        {baseItems.map((item) => {
                            const content = (
                                <ListItemButton
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    selected={isItemActive(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        mx: 1,
                                        my: 0.5,
                                        py: 1.1,
                                        position: 'relative',
                                        '&.Mui-selected': {
                                            backgroundColor: alpha(COLORS.ERROR[100], 0.6),
                                            '& .MuiListItemIcon-root, & .MuiListItemText-primary': { color: COLORS.ERROR[700], fontWeight: 700 }
                                        },
                                        '&:hover': { backgroundColor: alpha(COLORS.ERROR[100], 0.4) }
                                    }}
                                >
                                    {isItemActive(item.path) && (
                                        <Box sx={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 4, borderRadius: 2, backgroundColor: COLORS.ERROR[500] }} />
                                    )}
                                    <ListItemIcon sx={{ minWidth: collapsed ? 0 : 44, color: isItemActive(item.path) ? COLORS.ERROR[600] : COLORS.TEXT.SECONDARY, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                                    {!collapsed && (
                                        <ListItemText
                                            primary={
                                                item.path === '/manager/notifications'
                                                    ? `${item.label} (${unreadCount})`
                                                    : item.label
                                            }
                                            primaryTypographyProps={{ fontWeight: 600, sx: { fontSize: '0.95rem' } }}
                                        />
                                    )}
                                </ListItemButton>
                            );
                            return collapsed ? (
                                <Tooltip key={item.path} title={item.label} placement="right">
                                    <Box>{content}</Box>
                                </Tooltip>
                            ) : content;
                        })}
                    </List>
                    {isWorkingStaff && isLeader && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <List
                                subheader={
                                    !collapsed ? (
                                        <ListSubheader component="div" sx={{ background: 'transparent', color: COLORS.TEXT.SECONDARY, fontWeight: 700 }}>
                                            Leader
                                        </ListSubheader>
                                    ) : null
                                }
                            >
                                {leaderItems.map((item) => {
                                    const content = (
                                        <ListItemButton
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            selected={isItemActive(item.path)}
                                            sx={{
                                                borderRadius: 2,
                                                mx: 1,
                                                my: 0.5,
                                                py: 1.1,
                                                position: 'relative',
                                                '&.Mui-selected': {
                                                    backgroundColor: alpha(COLORS.ERROR[100], 0.6),
                                                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': { color: COLORS.ERROR[700], fontWeight: 700 }
                                                },
                                                '&:hover': { backgroundColor: alpha(COLORS.ERROR[100], 0.4) }
                                            }}
                                        >
                                            {isItemActive(item.path) && (
                                                <Box sx={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 4, borderRadius: 2, backgroundColor: COLORS.ERROR[500] }} />
                                            )}
                                            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 44, color: isItemActive(item.path) ? COLORS.ERROR[600] : COLORS.TEXT.SECONDARY, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                                            {!collapsed && (
                                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, sx: { fontSize: '0.95rem' } }} />
                                            )}
                                        </ListItemButton>
                                    );
                                    return collapsed ? (
                                        <Tooltip key={item.path} title={item.label} placement="right">
                                            <Box>{content}</Box>
                                        </Tooltip>
                                    ) : content;
                                })}
                            </List>
                        </>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Divider />
                    <List
                        subheader={!collapsed ? (
                            <ListSubheader component="div" sx={{ background: 'transparent', color: COLORS.TEXT.SECONDARY, fontWeight: 700 }}>
                                Hệ thống
                            </ListSubheader>
                        ) : null}
                    >
                        {collapsed ? (
                            <Tooltip title="Đăng xuất" placement="right">
                                <ListItemButton onClick={handleLogout} sx={{ mx: 1, my: 1, borderRadius: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 0, color: COLORS.ERROR[600], justifyContent: 'center' }}><Logout /></ListItemIcon>
                                </ListItemButton>
                            </Tooltip>
                        ) : (
                            <ListItemButton onClick={handleLogout} sx={{ mx: 1, my: 1, borderRadius: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40, color: COLORS.ERROR[600] }}><Logout /></ListItemIcon>
                                <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontWeight: 700, color: COLORS.ERROR[700] }} />
                            </ListItemButton>
                        )}
                    </List>
                </Drawer>
            </Box>
        );
    }

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
                            component="img"
                            src="/LogoPet.png"
                            alt="Pet Cafe Logo"
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                objectFit: 'contain',
                                mr: 2,
                                boxShadow: `0 8px 20px ${alpha(COLORS.ERROR[300], 0.4)}`,
                                backgroundColor: 'transparent'
                            }}
                        />
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: 800,
                                letterSpacing: 0.3,
                                color: COLORS.ERROR[600]
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
                            onClick={async () => {
                                handleProfileMenuClose();
                                await handleLogout();
                            }}
                            sx={{
                                color: COLORS.ERROR[600],
                                fontWeight: 600,
                                '&:hover': {
                                    backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                }
                            }}
                        >
                            <Logout sx={{ mr: 2 }} />
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
