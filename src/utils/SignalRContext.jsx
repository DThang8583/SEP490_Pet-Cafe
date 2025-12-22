import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { Snackbar, Alert, Box, Typography } from "@mui/material";
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

// eslint-disable-next-line react/prop-types
const SignalRProvider = ({ children }) => {
    const { user, handleGetCurrent } = useAuth();
    const URL = import.meta.env.VITE_CHAT_HUB_URL || 'https://petcafes.azurewebsites.net/notification-hub';
    console.log(URL);
    const connectionRef = useRef(null);
    const [notification, setNotification] = useState(null);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        if (user && !connectionRef.current) {
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(URL, { withCredentials: false })
                .withAutomaticReconnect()
                .build();

            connectionRef.current = newConnection;

            newConnection.start()
                .then(async () => {
                    console.log('✅ [SignalR] Connection established successfully');
                    console.log('✅ [SignalR] Connection ID:', newConnection.connectionId);

                    // Lấy accountId từ localStorage
                    const accountId = localStorage.getItem('accountId') || user?.id;
                    console.log('✅ [SignalR] Account ID from localStorage:', accountId);

                    // Join user group với accountId
                    await newConnection.invoke('JoinUserGroup', accountId);
                    console.log('✅ [SignalR] Joined user group:', accountId);

                    // Listen for notifications
                    console.log('User:', user);
                    newConnection.on('ReceiveNotification', (notificationData) => {
                        console.log('🔔 [SignalR] ReceiveNotification called');
                        console.log('🔔 [SignalR] notificationData:', JSON.stringify(notificationData, null, 2));

                        // Không cần check accountId vì user đã join đúng group
                        // Backend chỉ gửi notification cho group của user này
                        // Nếu nhận được notification thì chắc chắn là của user này

                        setNotification(notificationData);
                        console.log('✅ [SignalR] Notification set:', notificationData);

                        // Hiển thị toast notification
                        const toastData = {
                            title: notificationData.title || 'Thông báo mới',
                            message: notificationData.message || notificationData.content || '',
                            type: notificationData.notification_type || notificationData.type || 'SYSTEM'
                        };
                        console.log('🎨 [SignalR] Toast data:', toastData);

                        setToastMessage(toastData);
                        setToastOpen(true);
                        console.log('🎨 [SignalR] Toast opened');

                        // Refresh user data if needed
                        if (handleGetCurrent) {
                            handleGetCurrent(() => { });
                        }
                    });
                })
                .catch(error => {
                    console.error("❌ [SignalR] Connection error:", error);
                    console.error("❌ [SignalR] Error details:", {
                        message: error.message,
                        stack: error.stack,
                        url: URL
                    });
                });
        }

        // Cleanup on unmount or user change
        return () => {
            if (connectionRef.current && user) {
                const accountId = localStorage.getItem('accountId') || user?.id;
                connectionRef.current.invoke('LeaveUserGroup', accountId)
                    .then(() => {
                        connectionRef.current?.stop();
                        connectionRef.current = null;
                    })
                    .catch(error => console.error("Leave group error:", error));
            }
        };
    }, [URL, user, handleGetCurrent]);

    const handleCloseToast = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setToastOpen(false);
    };

    // Map notification type to Alert severity
    const getAlertSeverity = (type) => {
        const typeUpper = (type || '').toUpperCase();
        switch (typeUpper) {
            case 'ORDER':
            case 'BOOKING':
                return 'success';
            case 'TASK':
            case 'ASSIGNMENT':
                return 'warning';
            case 'SYSTEM':
                return 'info';
            case 'ERROR':
            case 'ALERT':
                return 'error';
            default:
                return 'info';
        }
    };

    // Map notification type to icon
    const getNotificationIcon = (type) => {
        const typeUpper = (type || '').toUpperCase();
        switch (typeUpper) {
            case 'ORDER':
                return '🛒';
            case 'BOOKING':
                return '📅';
            case 'TASK':
            case 'ASSIGNMENT':
                return '📋';
            case 'SYSTEM':
                return '🔔';
            default:
                return '📢';
        }
    };

    return (
        <SignalRContext.Provider value={{ notification }}>
            {children}
            <Snackbar
                open={toastOpen}
                autoHideDuration={8000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 8 }}
            >
                <Alert
                    onClose={handleCloseToast}
                    severity={getAlertSeverity(toastMessage?.type)}
                    variant="filled"
                    sx={{
                        minWidth: '350px',
                        maxWidth: '450px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        '& .MuiAlert-icon': {
                            fontSize: '28px'
                        }
                    }}
                >
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getNotificationIcon(toastMessage?.type)}</span>
                            {toastMessage?.title}
                        </Typography>
                        {toastMessage?.message && (
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', lineHeight: 1.4, opacity: 0.95 }}>
                                {toastMessage.message}
                            </Typography>
                        )}
                    </Box>
                </Alert>
            </Snackbar>
        </SignalRContext.Provider>
    );
};

export default SignalRProvider;

// eslint-disable-next-line react-refresh/only-export-components
export const useSignalR = () => {
    return useContext(SignalRContext);
};
