import React, { useEffect, useState } from "react";
import { 
    Box, Container, Typography, Paper, List, ListItem, ListItemText, 
    Divider, Button, Stack, Chip, Avatar, alpha, CircularProgress, Alert
} from "@mui/material";
import { Notifications, CheckCircle, Schedule, Error as ErrorIcon, Info } from "@mui/icons-material";
import { COLORS } from "../../constants/colors";
useEffect(() => {
    // Khi vào trang thông báo → reset badge navbar
    const event = new Event('notificationsMarkedAsRead');
    window.dispatchEvent(event);
}, []);
const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasNext, setHasNext] = useState(false);
    const [totalItems, setTotalItems] = useState(0);


    // API
    const loadNotifications = async (pageIndex) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                page: String(pageIndex - 1), // API sử dụng 0-based index
                limit: String(pageSize),
            });

            // Lấy account_id đã lưu lúc login
            const accountId = localStorage.getItem("accountId");
            if (accountId) {
                params.append("account_id", accountId);
            }

            const token = localStorage.getItem("authToken");

            const resp = await fetch(
                `https://petcafes.azurewebsites.net/api/notifications?${params.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                }
            );

            if (!resp.ok) {
                throw new Error("Không thể tải thông báo");
            }

            const json = await resp.json();
            console.log("[NotificationsPage] API Response:", json);

            const data = Array.isArray(json?.data) ? json.data : [];
            setNotifications(data);
            setHasNext(Boolean(json?.pagination?.has_next));
            setTotalItems(json?.pagination?.total_items_count || 0);
        } catch (e) {
            console.error("[NotificationsPage] Error:", e);
            setError(e.message || "Lỗi tải thông báo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toUpperCase()) {
            case "HIGH":
                return COLORS.ERROR[500];
            case "NORMAL":
                return COLORS.INFO[500];
            case "LOW":
                return COLORS.GRAY[500];
            default:
                return COLORS.INFO[500];
        }
    };

    const getNotificationIcon = (type) => {
        switch (type?.toUpperCase()) {
            case "BOOKING":
                return <Schedule />;
            case "ORDER":
                return <CheckCircle />;
            case "ERROR":
                return <ErrorIcon />;
            default:
                return <Info />;
        }
    };

    return (
        <Box
            sx={{
                py: { xs: 2, md: 3 },
                minHeight: "100vh",
                background: `radial-gradient(1200px 400px at -10% -10%, rgba(255, 235, 238, 0.9), transparent 60%),
                             radial-gradient(900px 300px at 110% 10%, rgba(255, 248, 220, 0.7), transparent 60%),
                             radial-gradient(900px 400px at 50% 110%, rgba(232, 245, 233, 0.6), transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`,
            }}
        >
            <Container maxWidth="md" sx={{ position: "relative" }}>
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 3,
                        flexWrap: "wrap",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: COLORS.ERROR[600],
                                letterSpacing: "-0.03em",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Notifications sx={{ fontSize: 32 }} />
                            Trung tâm thông báo
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}
                        >
                            Xem tất cả các cập nhật mới nhất của Pet Cafe.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={loading ? "Đang tải..." : `Trang ${page}`}
                            color="error"
                            variant="outlined"
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                        {totalItems > 0 && (
                            <Chip
                                label={`${totalItems} thông báo`}
                                color="info"
                                variant="outlined"
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                            />
                        )}
                    </Stack>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && notifications.length === 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress color="error" />
                    </Box>
                )}

                <Paper
                    sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: 6,
                        background: "rgba(255,255,255,0.95)",
                        border: `1px solid ${COLORS.ERROR[50]}`,
                    }}
                >
                    <List>
                        {notifications.length === 0 && !loading && (
                            <ListItem sx={{ py: 4, flexDirection: "column", textAlign: "center" }}>
                                <Notifications sx={{ fontSize: 64, color: COLORS.GRAY[300], mb: 2 }} />
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        mb: 1,
                                        color: COLORS.TEXT.PRIMARY,
                                    }}
                                >
                                    Hiện chưa có thông báo nào
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: COLORS.TEXT.SECONDARY }}
                                >
                                    Các thông báo mới sẽ xuất hiện tại đây khi có hoạt động mới.
                                </Typography>
                            </ListItem>
                        )}

                        {notifications.map((notification, index) => (
                            <React.Fragment key={notification.id || `${index}`}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 3,
                                        py: 2.5,
                                        backgroundColor: notification.is_read 
                                            ? "transparent" 
                                            : alpha(COLORS.ERROR[50], 0.3),
                                        "&:hover": {
                                            backgroundColor: alpha(COLORS.ERROR[100], 0.2),
                                        },
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            mr: 2,
                                            background: `linear-gradient(135deg, ${getPriorityColor(notification.priority)}, ${COLORS.SECONDARY[400]})`,
                                            color: "white",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {getNotificationIcon(notification.notification_type)}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: COLORS.TEXT.PRIMARY,
                                                        flex: 1,
                                                    }}
                                                >
                                                    {notification.title || "Thông báo"}
                                                </Typography>
                                                {!notification.is_read && (
                                                    <Chip
                                                        label="Mới"
                                                        size="small"
                                                        color="error"
                                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                                    />
                                                )}
                                                {notification.priority && (
                                                    <Chip
                                                        label={notification.priority}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: "0.7rem",
                                                            backgroundColor: getPriorityColor(notification.priority),
                                                            color: "white",
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: COLORS.TEXT.SECONDARY,
                                                        mb: 1,
                                                        whiteSpace: "pre-line",
                                                    }}
                                                >
                                                    {notification.message || "Không có nội dung"}
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {notification.notification_type && (
                                                        <Chip
                                                            icon={getNotificationIcon(notification.notification_type)}
                                                            label={notification.notification_type}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: "0.7rem" }}
                                                        />
                                                    )}
                                                    {notification.sent_date && (
                                                        <Chip
                                                            icon={<Schedule sx={{ fontSize: 14 }} />}
                                                            label={formatDate(notification.sent_date)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: "0.7rem" }}
                                                        />
                                                    )}
                                                    {notification.reference_id && (
                                                        <Chip
                                                            label={`ID: ${notification.reference_id.substring(0, 8)}...`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: "0.7rem" }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index !== notifications.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Trang trước
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!hasNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Trang tiếp
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
};

export default NotificationsPage;
