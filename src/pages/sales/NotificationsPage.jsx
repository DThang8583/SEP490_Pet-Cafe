import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider, Button, Stack, Chip } from "@mui/material";
import { COLORS } from "../../constants/colors";

const SalesNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasNext, setHasNext] = useState(false);

    const loadNotifications = async (pageIndex) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                page: String(pageIndex),
                limit: String(pageSize),
            });

            // Lấy account_id đã lưu lúc login (data.account.id)
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
            console.log("Kết quả notifications:", json); // in ra kết quả toàn bộ

            const data = Array.isArray(json?.data) ? json.data : [];
            setNotifications(data);
            setHasNext(Boolean(json?.pagination?.has_next));
        } catch (e) {
            setError(e.message || "Lỗi tải thông báo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

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
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: COLORS.ERROR[600],
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Trung tâm thông báo
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: COLORS.TEXT.SECONDARY, mt: 0.5 }}
                        >
                            Xem tất cả các cập nhật mới nhất của Pet Cafe.
                        </Typography>
                    </Box>
                    <Chip
                        label={loading ? "Đang tải..." : `Trang ${page}`}
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                    />
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
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

                        {notifications.map((n, index) => (
                            <React.Fragment key={n.id || `${index}`}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 3,
                                        py: 2,
                                        "&:hover": {
                                            backgroundColor: "rgba(244, 67, 54, 0.03)",
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            mr: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: `linear-gradient(135deg, ${COLORS.ERROR[200]}, ${COLORS.SECONDARY[200]})`,
                                            color: "white",
                                            fontWeight: 700,
                                            flexShrink: 0,
                                        }}
                                    >
                                        !
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    mb: 0.5,
                                                    color: COLORS.TEXT.PRIMARY,
                                                }}
                                            >
                                                {n.title || n.message || "Thông báo"}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                sx={{ color: COLORS.TEXT.SECONDARY, whiteSpace: "pre-line" }}
                                            >
                                                {n.created_at ||
                                                    n.createdAt ||
                                                    (typeof n === "string"
                                                        ? n
                                                        : JSON.stringify(n, null, 2))}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {index !== notifications.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Trang trước
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!hasNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Trang tiếp
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
};

export default SalesNotificationsPage;
