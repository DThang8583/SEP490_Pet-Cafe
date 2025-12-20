import apiClient from '../config/config';

// Notification APIs
const notificationApi = {
    // Get user notifications from official API
    async getNotifications(page = 1, limit = 20, accountId = null) {
        try {
            const account_id = accountId || localStorage.getItem('accountId');
            if (!account_id) {
                throw new Error('Không tìm thấy account ID');
        }

            const params = {
                page: page - 1, // API uses 0-based page index
                limit: limit,
                account_id: account_id
            };

            const response = await apiClient.get('/notifications', {
                params,
                timeout: 10000
            });

            const data = response.data?.data || [];
            const pagination = response.data?.pagination || {};

        return {
            success: true,
                data: data,
                pagination: {
                    total_items_count: pagination.total_items_count || 0,
                    page_size: pagination.page_size || limit,
                    total_pages_count: pagination.total_pages_count || 1,
                    page_index: pagination.page_index || (page - 1),
                    has_next: pagination.has_next || false,
                    has_previous: pagination.has_previous || false
                }
            };
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            throw error;
        }
    },

    // Mark all notifications as read for an account
    async markAllAsRead(accountId = null) {
        try {
            console.log('[notificationApi.markAllAsRead] ===== BẮT ĐẦU =====');
            console.log('[notificationApi.markAllAsRead] Parameter accountId:', accountId);
            console.log('[notificationApi.markAllAsRead] localStorage accountId:', localStorage.getItem('accountId'));

            // Get accountId - prioritize passed parameter, then localStorage
            let account_id = accountId;
            if (!account_id) {
                account_id = localStorage.getItem('accountId');
                console.log('[notificationApi.markAllAsRead] Lấy từ localStorage:', account_id);
            }

            // Also try to get from currentUser if available
            if (!account_id) {
                try {
                    const currentUserStr = localStorage.getItem('currentUser');
                    if (currentUserStr) {
                        const currentUser = JSON.parse(currentUserStr);
                        account_id = currentUser.account_id || currentUser.id;
                        console.log('[notificationApi.markAllAsRead] Lấy từ currentUser:', account_id);
                    }
                } catch (e) {
                    console.error('[notificationApi.markAllAsRead] Lỗi parse currentUser:', e);
                }
            }

            if (!account_id) {
                console.error('[notificationApi.markAllAsRead] ❌ KHÔNG TÌM THẤY ACCOUNT ID');
                throw new Error('Không tìm thấy account ID');
        }

            // Ensure account_id is a string
            account_id = String(account_id).trim();

            console.log('[notificationApi.markAllAsRead] ✅ Account ID cuối cùng:', account_id);
            console.log('[notificationApi.markAllAsRead] 📤 Gọi API: PUT /notifications');

            // Request body must match Swagger exactly: { "account_id": "..." }
            const requestBody = {
                account_id: account_id
            };

            console.log('[notificationApi.markAllAsRead] 📦 Request body:');
            console.log(JSON.stringify(requestBody, null, 2));

            const response = await apiClient.put('/notifications', requestBody, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('[notificationApi.markAllAsRead] 📥 Response status:', response.status);
            console.log('[notificationApi.markAllAsRead] 📥 Response data:', response.data);
            console.log('[notificationApi.markAllAsRead] ===== THÀNH CÔNG =====');

            // Check if response indicates success
            if (response.status >= 200 && response.status < 300) {
        return {
            success: true,
                    data: response.data,
                    message: 'Đã đánh dấu tất cả thông báo là đã đọc'
        };
            } else {
                throw new Error(`API returned status ${response.status}`);
            }
        } catch (error) {
            console.error('[notificationApi.markAllAsRead] ===== ❌ LỖI =====');
            console.error('[notificationApi.markAllAsRead] Error message:', error.message);
            console.error('[notificationApi.markAllAsRead] Error response:', error.response?.data);
            console.error('[notificationApi.markAllAsRead] Error status:', error.response?.status);
            console.error('[notificationApi.markAllAsRead] Error URL:', error.config?.url);
            console.error('[notificationApi.markAllAsRead] ===== KẾT THÚC LỖI =====');
            throw error;
        }
    }
};

// Export both named and default
export { notificationApi };
export default notificationApi;
