import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': ['notification_receive'],
        'working_staff': ['notification_receive'],
        'manager': ['notification_receive', 'notification_send', 'notification_management'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock notifications database
let MOCK_NOTIFICATIONS = [
    {
        id: 'notif-001',
        userId: 'user-005',
        type: 'booking_assigned',
        title: 'Lịch hẹn mới được giao',
        message: 'Bạn có lịch hẹn grooming cho Bông vào 25/01 lúc 09:00',
        bookingId: 'booking-001',
        read: false,
        priority: 'high',
        createdAt: '2024-01-20T11:00:00'
    },
    {
        id: 'notif-002',
        userId: 'user-007',
        type: 'booking_confirmed',
        title: 'Lịch hẹn được xác nhận',
        message: 'Lịch hẹn grooming cho Bông đã được xác nhận',
        bookingId: 'booking-001',
        read: false,
        priority: 'medium',
        createdAt: '2024-01-20T11:00:00'
    },
    {
        id: 'notif-003',
        userId: 'user-007',
        type: 'service_completed',
        title: 'Dịch vụ hoàn thành',
        message: 'Dịch vụ tắm nhanh cho Miu đã hoàn thành. Hãy đánh giá dịch vụ!',
        bookingId: 'booking-003',
        read: false,
        priority: 'medium',
        createdAt: '2024-01-27T11:30:00'
    },
    {
        id: 'notif-004',
        userId: 'user-007',
        type: 'promotion',
        title: 'Khuyến mãi đặc biệt',
        message: 'Giảm 20% cho dịch vụ grooming trong tháng này! Đặt lịch ngay để không bỏ lỡ.',
        read: true,
        priority: 'low',
        expiresAt: '2024-02-01T00:00:00',
        createdAt: '2024-01-15T09:00:00'
    },
    {
        id: 'notif-005',
        userId: 'user-005',
        type: 'schedule_reminder',
        title: 'Nhắc nhở lịch làm việc',
        message: 'Bạn có ca làm việc từ 8:00 - 17:00 hôm nay',
        read: true,
        priority: 'medium',
        createdAt: '2024-01-25T07:00:00'
    }
];

// Notification types configuration
const NOTIFICATION_TYPES = {
    // Customer notifications
    booking_received: {
        title: 'Đã nhận yêu cầu đặt lịch',
        icon: 'schedule',
        color: '#2196F3',
        priority: 'medium'
    },
    booking_confirmed: {
        title: 'Lịch hẹn được xác nhận',
        icon: 'check_circle',
        color: '#4CAF50',
        priority: 'high'
    },
    booking_cancelled: {
        title: 'Lịch hẹn bị hủy',
        icon: 'cancel',
        color: '#F44336',
        priority: 'high'
    },
    booking_rescheduled: {
        title: 'Lịch hẹn được đổi giờ',
        icon: 'update',
        color: '#FF9800',
        priority: 'high'
    },
    service_reminder: {
        title: 'Nhắc nhở lịch hẹn',
        icon: 'notification_important',
        color: '#FF9800',
        priority: 'high'
    },
    service_completed: {
        title: 'Dịch vụ hoàn thành',
        icon: 'task_alt',
        color: '#4CAF50',
        priority: 'medium'
    },
    payment_success: {
        title: 'Thanh toán thành công',
        icon: 'payment',
        color: '#4CAF50',
        priority: 'medium'
    },
    promotion: {
        title: 'Khuyến mãi',
        icon: 'local_offer',
        color: '#E91E63',
        priority: 'low'
    },

    // Staff notifications
    booking_assigned: {
        title: 'Lịch hẹn mới được giao',
        icon: 'assignment',
        color: '#2196F3',
        priority: 'high'
    },
    schedule_updated: {
        title: 'Lịch làm việc cập nhật',
        icon: 'calendar_today',
        color: '#FF9800',
        priority: 'medium'
    },
    schedule_reminder: {
        title: 'Nhắc nhở lịch làm việc',
        icon: 'access_time',
        color: '#607D8B',
        priority: 'low'
    },

    // Management notifications
    feedback_received: {
        title: 'Phản hồi mới từ khách hàng',
        icon: 'feedback',
        color: '#9C27B0',
        priority: 'medium'
    },
    booking_pending_approval: {
        title: 'Lịch hẹn chờ phê duyệt',
        icon: 'pending',
        color: '#FF9800',
        priority: 'high'
    }
};

// Notification APIs
const notificationApi = {
    // Get user notifications
    async getNotifications(page = 1, limit = 20, filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền xem thông báo');
        }

        let notifications = MOCK_NOTIFICATIONS.filter(notif => notif.userId === currentUser.id);

        // Apply filters
        if (filters.type && filters.type !== 'all') {
            notifications = notifications.filter(notif => notif.type === filters.type);
        }

        if (filters.read !== undefined) {
            notifications = notifications.filter(notif => notif.read === filters.read);
        }

        if (filters.priority && filters.priority !== 'all') {
            notifications = notifications.filter(notif => notif.priority === filters.priority);
        }

        if (filters.dateFrom) {
            notifications = notifications.filter(notif =>
                new Date(notif.createdAt) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            notifications = notifications.filter(notif =>
                new Date(notif.createdAt) <= new Date(filters.dateTo)
            );
        }

        // Sort by creation date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Add type configuration
        const enrichedNotifications = notifications.map(notif => ({
            ...notif,
            typeConfig: NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.booking_confirmed
        }));

        // Pagination
        const total = enrichedNotifications.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedNotifications = enrichedNotifications.slice(startIndex, startIndex + limit);

        return {
            success: true,
            data: {
                notifications: paginatedNotifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                },
                unreadCount: enrichedNotifications.filter(n => !n.read).length
            }
        };
    },

    // Get unread notification count
    async getUnreadCount() {
        await delay(150);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền xem thông báo');
        }

        const unreadCount = MOCK_NOTIFICATIONS.filter(notif =>
            notif.userId === currentUser.id && !notif.read
        ).length;

        return { success: true, data: { unreadCount } };
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền cập nhật thông báo');
        }

        const notificationIndex = MOCK_NOTIFICATIONS.findIndex(n =>
            n.id === notificationId && n.userId === currentUser.id
        );

        if (notificationIndex === -1) {
            throw new Error('Không tìm thấy thông báo');
        }

        MOCK_NOTIFICATIONS[notificationIndex].read = true;
        MOCK_NOTIFICATIONS[notificationIndex].readAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_NOTIFICATIONS[notificationIndex],
            message: 'Đã đánh dấu đã đọc'
        };
    },

    // Mark all notifications as read
    async markAllAsRead() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền cập nhật thông báo');
        }

        const updatedCount = MOCK_NOTIFICATIONS
            .filter(n => n.userId === currentUser.id && !n.read)
            .length;

        MOCK_NOTIFICATIONS
            .filter(n => n.userId === currentUser.id && !n.read)
            .forEach(notification => {
                notification.read = true;
                notification.readAt = new Date().toISOString();
            });

        return {
            success: true,
            data: { updatedCount },
            message: `Đã đánh dấu ${updatedCount} thông báo đã đọc`
        };
    },

    // Delete notification
    async deleteNotification(notificationId) {
        await delay(250);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền xóa thông báo');
        }

        const notificationIndex = MOCK_NOTIFICATIONS.findIndex(n =>
            n.id === notificationId && n.userId === currentUser.id
        );

        if (notificationIndex === -1) {
            throw new Error('Không tìm thấy thông báo');
        }

        const deletedNotification = MOCK_NOTIFICATIONS[notificationIndex];
        MOCK_NOTIFICATIONS.splice(notificationIndex, 1);

        return {
            success: true,
            data: deletedNotification,
            message: 'Xóa thông báo thành công'
        };
    },

    // Create notification (for system use)
    async createNotification(notificationData) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_send')) {
            throw new Error('Không có quyền tạo thông báo');
        }

        const typeConfig = NOTIFICATION_TYPES[notificationData.type];
        if (!typeConfig) {
            throw new Error('Loại thông báo không hợp lệ');
        }

        const newNotification = {
            id: generateId('notif'),
            userId: notificationData.userId,
            type: notificationData.type,
            title: notificationData.title || typeConfig.title,
            message: notificationData.message,
            bookingId: notificationData.bookingId,
            feedbackId: notificationData.feedbackId,
            data: notificationData.data, // Additional data
            read: false,
            priority: notificationData.priority || typeConfig.priority,
            expiresAt: notificationData.expiresAt,
            createdAt: new Date().toISOString()
        };

        MOCK_NOTIFICATIONS.push(newNotification);

        return {
            success: true,
            data: newNotification,
            message: 'Tạo thông báo thành công'
        };
    },

    // Send bulk notifications
    async sendBulkNotifications(userIds, notificationData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_send')) {
            throw new Error('Không có quyền gửi thông báo');
        }

        const typeConfig = NOTIFICATION_TYPES[notificationData.type];
        if (!typeConfig) {
            throw new Error('Loại thông báo không hợp lệ');
        }

        const newNotifications = userIds.map(userId => ({
            id: generateId('notif'),
            userId: userId,
            type: notificationData.type,
            title: notificationData.title || typeConfig.title,
            message: notificationData.message,
            data: notificationData.data,
            read: false,
            priority: notificationData.priority || typeConfig.priority,
            expiresAt: notificationData.expiresAt,
            createdAt: new Date().toISOString()
        }));

        MOCK_NOTIFICATIONS.push(...newNotifications);

        return {
            success: true,
            data: {
                sent: newNotifications.length,
                notifications: newNotifications
            },
            message: `Gửi thành công ${newNotifications.length} thông báo`
        };
    },

    // Get notification statistics
    async getNotificationStats(timeRange = 'week') {
        await delay(250);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_management')) {
            throw new Error('Không có quyền xem thống kê thông báo');
        }

        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const notificationsInRange = MOCK_NOTIFICATIONS.filter(notif =>
            new Date(notif.createdAt) >= startDate
        );

        const stats = {
            total: notificationsInRange.length,
            read: notificationsInRange.filter(n => n.read).length,
            unread: notificationsInRange.filter(n => !n.read).length,
            byType: {},
            byPriority: {
                high: notificationsInRange.filter(n => n.priority === 'high').length,
                medium: notificationsInRange.filter(n => n.priority === 'medium').length,
                low: notificationsInRange.filter(n => n.priority === 'low').length
            },
            readRate: 0
        };

        // Calculate read rate
        if (stats.total > 0) {
            stats.readRate = Math.round((stats.read / stats.total) * 100);
        }

        // Group by type
        notificationsInRange.forEach(notif => {
            if (!stats.byType[notif.type]) {
                stats.byType[notif.type] = 0;
            }
            stats.byType[notif.type]++;
        });

        return { success: true, data: stats };
    },

    // Send booking notification
    async sendBookingNotification(type, bookingId, userId, customMessage = '') {
        await delay(300);

        if (!NOTIFICATION_TYPES[type]) {
            throw new Error('Loại thông báo không hợp lệ');
        }

        const typeConfig = NOTIFICATION_TYPES[type];
        let message = customMessage;

        // Generate default message if not provided
        if (!message) {
            switch (type) {
                case 'booking_confirmed':
                    message = 'Lịch hẹn của bạn đã được xác nhận';
                    break;
                case 'booking_cancelled':
                    message = 'Lịch hẹn đã bị hủy';
                    break;
                case 'service_reminder':
                    message = 'Nhắc nhở: Bạn có lịch hẹn sắp tới';
                    break;
                case 'service_completed':
                    message = 'Dịch vụ đã hoàn thành. Hãy đánh giá dịch vụ!';
                    break;
                default:
                    message = 'Bạn có thông báo mới về lịch hẹn';
            }
        }

        const notification = {
            id: generateId('notif'),
            userId: userId,
            type: type,
            title: typeConfig.title,
            message: message,
            bookingId: bookingId,
            read: false,
            priority: typeConfig.priority,
            createdAt: new Date().toISOString()
        };

        MOCK_NOTIFICATIONS.push(notification);

        return {
            success: true,
            data: notification,
            message: 'Gửi thông báo thành công'
        };
    },

    // Send promotional notification
    async sendPromotionalNotification(userIds, title, message, expiresAt = null) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_send')) {
            throw new Error('Không có quyền gửi thông báo khuyến mãi');
        }

        const notifications = userIds.map(userId => ({
            id: generateId('notif'),
            userId: userId,
            type: 'promotion',
            title: title,
            message: message,
            read: false,
            priority: 'low',
            expiresAt: expiresAt,
            createdAt: new Date().toISOString()
        }));

        MOCK_NOTIFICATIONS.push(...notifications);

        return {
            success: true,
            data: {
                sent: notifications.length,
                notifications
            },
            message: `Gửi thành công khuyến mãi tới ${notifications.length} khách hàng`
        };
    },

    // Schedule reminder notifications
    async scheduleReminder(bookingId, reminderTime) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_send')) {
            throw new Error('Không có quyền lên lịch thông báo');
        }

        // In a real implementation, this would schedule a notification
        // For now, we'll create a placeholder
        const notification = {
            id: generateId('reminder'),
            bookingId: bookingId,
            type: 'service_reminder',
            scheduledFor: reminderTime,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        return {
            success: true,
            data: notification,
            message: 'Lên lịch nhắc nhở thành công'
        };
    },

    // Get notification types
    async getNotificationTypes() {
        await delay(100);

        return {
            success: true,
            data: NOTIFICATION_TYPES
        };
    }
};

// Export both named and default
export { notificationApi };
export default notificationApi;
