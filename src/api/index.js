// Centralized API exports for easy management and imports

// Authentication & User Management
export { authApi, customerApi, workingStaffApi, managerApi, authUtils } from './authApi';

// Service Management
export { serviceApi } from './serviceApi';
export { default as serviceApiDefault } from './serviceApi';

// Booking Management
export { bookingApi } from './bookingApi';
export { default as bookingApiDefault } from './bookingApi';

// Notification Management
export { notificationApi } from './notificationApi';
export { default as notificationApiDefault } from './notificationApi';

// Feedback Management
export { feedbackApi } from './feedbackApi';
export { default as feedbackApiDefault } from './feedbackApi';

// Pet Management
export { petApi } from './petApi';
export { default as petApiDefault } from './petApi';

// Re-export from userApi for backward compatibility
export { userApi, generalApi } from './userApi';

// API configuration and utilities
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
};

// Common API utilities
export const apiUtils = {
    // Format error messages for display
    formatErrorMessage: (error) => {
        if (typeof error === 'string') {
            return error;
        }

        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        if (error.message) {
            return error.message;
        }

        return 'Có lỗi xảy ra, vui lòng thử lại';
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        return !!(token && user);
    },

    // Get auth headers for API calls
    getAuthHeaders: () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    // Format currency for display
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    // Format date for API calls
    formatDateForAPI: (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    },

    // Format datetime for API calls
    formatDateTimeForAPI: (date, time) => {
        if (!date || !time) return '';
        return `${date}T${time}:00`;
    },

    // Parse API datetime to local format
    parseAPIDateTime: (dateTimeString) => {
        if (!dateTimeString) return null;

        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString('vi-VN'),
            time: date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
            full: date.toLocaleString('vi-VN')
        };
    }
};

// API response status codes
export const API_STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
};

// Export all for convenience
export default {
    authApi,
    customerApi,
    workingStaffApi,
    managerApi,
    serviceApi,
    bookingApi,
    notificationApi,
    feedbackApi,
    petApi,
    userApi,
    generalApi,
    authUtils,
    apiUtils,
    API_CONFIG,
    API_STATUS
};
