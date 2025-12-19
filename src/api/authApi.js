// Authentication API - Wrapper for userApi auth functions
// This file provides a clean interface for authentication operations

import userApi from './userApi.js';

// External Auth API endpoint
const OFFICIAL_AUTH_URL = 'https://petcafes.azurewebsites.net/api/auths';

// Decode JWT token to get claims
const decodeJWT = (token) => {
    try {
        if (!token) return null;

        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decode payload (base64url)
        const payload = parts[1];
        // Replace URL-safe base64 characters
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        const decoded = JSON.parse(atob(padded));
        return decoded;
    } catch (error) {
        console.error('[authApi.decodeJWT] Error decoding token:', error);
        return null;
    }
};

// Get nameid (customer_id) from access token
const getNameIdFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (decoded) {
        // nameid can be in different claim names
        return decoded.nameid || decoded.nameId || decoded.sub || decoded.user_id || decoded.id;
    }
    return null;
};

const mapExternalRole = (account) => {
    const upperRole = (account?.role || '').toUpperCase();
    const subRole = (account?.employee?.sub_role || '').toUpperCase();
    // Map backend roles to frontend roles
    if (upperRole === 'MANAGER' || subRole === 'MANAGER') return 'manager';
    if (upperRole === 'EMPLOYEE' && subRole === 'SALE_STAFF') return 'sales_staff';
    if (upperRole === 'EMPLOYEE') return 'working_staff';
    if (upperRole === 'CUSTOMER') return 'customer';
    return 'customer';
};

const mapExternalAccountToUser = (account, nameIdFromToken = null) => {
    const role = mapExternalRole(account);

    // For customer role, use customer.id if available, otherwise fallback to account.id
    // For employee/manager roles, use employee.id or account.id
    let userId;
    let customerId;

    if (role === 'customer') {
        // Priority: nameid from token > customer.id > customer_id > account.id
        customerId = nameIdFromToken || account?.customer?.id || account?.customer_id || account?.id;
        userId = customerId || account?.id || account?.email;
    } else {
        userId = account?.employee?.id || account?.employee?.account_id || account?.id || account?.email;
    }

    console.log('[authApi.mapExternalAccountToUser] Account:', account);
    console.log('[authApi.mapExternalAccountToUser] Role:', role);
    console.log('[authApi.mapExternalAccountToUser] nameid from token:', nameIdFromToken);
    console.log('[authApi.mapExternalAccountToUser] User ID:', userId);
    console.log('[authApi.mapExternalAccountToUser] Customer ID:', customerId);

    const base = {
        id: userId,
        customer_id: customerId, // Store customer_id separately for customer role
        email: account?.email,
        name: account?.employee?.full_name || account?.customer?.full_name || account?.username || account?.email?.split('@')[0] || 'Người dùng',
        role,
        avatar: account?.employee?.avatar_url || account?.customer?.avatar_url || '',
        phone: account?.employee?.phone || account?.customer?.phone || '',
        address: account?.employee?.address || account?.customer?.address || ''
    };
    // Minimal permissions based on role to work with existing checks
    const permissionsByRole = {
        manager: ['staff_management', 'pet_management', 'service_management', 'report_access', 'revenue_tracking', 'full_access'],
        sales_staff: ['product_sales', 'invoice_management', 'customer_support', 'payment_processing'],
        working_staff: ['task_management', 'pet_status_update', 'service_execution', 'booking_management'],
        customer: ['service_booking', 'product_purchase', 'feedback_submission', 'notification_receive']
    };
    return { ...base, permissions: permissionsByRole[role] || [] };
};

// Common processor for external login responses (email/password & Google)
const processExternalLoginResponse = (data) => {
    if (!data?.access_token || !data?.account) {
        throw new Error('Phản hồi không hợp lệ');
    }

    console.log('[authApi.processExternalLoginResponse] Account from API:', data.account);
    console.log('[authApi.processExternalLoginResponse] Access token received');

    // Get nameid (customer_id) from access token
    const nameIdFromToken = getNameIdFromToken(data.access_token);
    console.log('[authApi.processExternalLoginResponse] nameid from token:', nameIdFromToken);

    // Merge nameid into account if it's a customer
    let accountWithCustomer = data.account;
    if (data.account?.role === 'CUSTOMER' && nameIdFromToken) {
        accountWithCustomer = {
            ...data.account,
            customer_id: nameIdFromToken,
            id: nameIdFromToken // Use nameid as id for customer
        };
        console.log('[authApi.processExternalLoginResponse] Account with nameid from token:', accountWithCustomer);
    }

    const user = mapExternalAccountToUser(accountWithCustomer, nameIdFromToken);
    console.log('[authApi.processExternalLoginResponse] Mapped user:', user);

    // Persist tokens and user/session info
    localStorage.setItem('authToken', data.access_token);
    if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('loginTime', new Date().toISOString());
    // Also persist currentUser for existing userApi-based getters
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Store backend account id for APIs that need it
    try {
        if (data.account?.id) {
            localStorage.setItem('accountId', data.account.id);
        }
    } catch (_) {
        // ignore storage errors
    }

    return {
        success: true,
        user,
        token: data.access_token,
        message: 'Đăng nhập thành công'
    };
};

// Re-export authentication functions from userApi with additional utilities
export const authApi = {
    // Login function
    async login(credentials) {
        // Try official backend first
        try {
            const resp = await fetch(OFFICIAL_AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!resp.ok) {
                throw new Error('Đăng nhập thất bại');
            }
            const data = await resp.json();
            return processExternalLoginResponse(data);
        } catch (e) {
            // Fallback to local mock auth
            try {
                const response = await userApi.auth.login(credentials);
                if (response.success) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userRole', response.user.role);
                    localStorage.setItem('loginTime', new Date().toISOString());
                }
                return response;
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }
    },

    // Register function (Customer only)
    async register(userData) {
        try {
            // Call official API endpoint
            const response = await fetch('https://petcafes.azurewebsites.net/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: userData.fullName,
                    email: userData.email,
                    password: userData.password,
                    re_password: userData.re_password || userData.confirmPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData?.detail || errorData?.message || 'Đăng ký thất bại';
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Return success response
            return {
                success: true,
                user: {
                    id: data?.id || data?.customer_id,
                    email: userData.email,
                    name: userData.fullName,
                    role: 'customer'
                },
                message: 'Đăng ký thành công'
            };
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // Logout function
    async logout() {
        try {
            const response = await userApi.auth.logout();

            // Clear all auth-related data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('loginTime');
            localStorage.removeItem('currentUser');

            return response;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser() {
        return userApi.auth.getCurrentUser();
    },

    // Check if user is authenticated
    isAuthenticated() {
        const user = this.getCurrentUser();
        const token = localStorage.getItem('authToken');
        return !!(user && token);
    },

    // Get user role
    getUserRole() {
        const user = this.getCurrentUser();
        return user?.role || localStorage.getItem('userRole') || null;
    },

    // Check if user has specific role
    hasRole(role) {
        const userRole = this.getUserRole();
        return userRole === role;
    },

    // Check if user has permission
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;

        return user.permissions.includes(permission) || user.permissions.includes('full_access');
    },

    // Get login time
    getLoginTime() {
        return localStorage.getItem('loginTime');
    },

    // Get session duration in minutes
    getSessionDuration() {
        const loginTime = this.getLoginTime();
        if (!loginTime) return 0;

        const now = new Date();
        const login = new Date(loginTime);
        return Math.floor((now - login) / (1000 * 60)); // in minutes
    },

    // Check if session is expired (optional - for future use)
    isSessionExpired(maxMinutes = 480) { // 8 hours default
        return this.getSessionDuration() > maxMinutes;
    },

    // Quick login for development/demo purposes
    async quickLogin(role = 'customer') {
        const demoUsers = {
            manager: {
                email: 'admin@petcafe.com',
                password: 'admin123'
            },
            sales_staff: {
                email: 'alice@petcafe.com',
                password: 'sales123'
            },
            working_staff: {
                email: 'charlie@petcafe.com',
                password: 'staff123'
            },
            customer: {
                email: 'eva@gmail.com',
                password: 'customer123'
            }
        };

        const credentials = demoUsers[role];
        if (!credentials) {
            throw new Error(`Invalid demo role: ${role}`);
        }

        return await this.login(credentials);
    },

    // Login with Google OAuth credential
    async loginWithGoogle(googleCredential) {
        try {
            // Loại bỏ dấu *** nếu có ở đầu token
            let cleanToken = googleCredential;
            if (cleanToken && typeof cleanToken === 'string') {
                // Loại bỏ *** ở đầu nếu có
                cleanToken = cleanToken.replace(/^\*{3,}/, '');
            }
            
            // Đảm bảo accessToken được gửi đúng vào field access_token
            const requestBody = { access_token: cleanToken };
            
            console.log('[authApi.loginWithGoogle] Calling API:', `${OFFICIAL_AUTH_URL}/google`);
            console.log('[authApi.loginWithGoogle] Original token length:', googleCredential?.length || 0);
            console.log('[authApi.loginWithGoogle] Clean token length:', cleanToken?.length || 0);
            console.log('[authApi.loginWithGoogle] Request body (masked):', { 
                access_token: cleanToken ? cleanToken.substring(0, 20) + '...' : 'null' 
            });
            
            const resp = await fetch(`${OFFICIAL_AUTH_URL}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Backend yêu cầu access_token theo swagger
                body: JSON.stringify(requestBody)
            });

            console.log('[authApi.loginWithGoogle] Response status:', resp.status);

            let data = {};
            try {
                data = await resp.json();
            } catch (_) {
                data = {};
            }
            console.log('[authApi.loginWithGoogle] raw response body:', data);

            if (!resp.ok) {
                const msg = data?.message || data?.detail || 'Đăng nhập Google thất bại';
                throw new Error(msg);
            }

            return processExternalLoginResponse(data);
        } catch (error) {
            console.error('[authApi.loginWithGoogle] error:', error);
            throw error;
        }
    },

    // Get all available demo users (for development)
    getDemoUsers() {
        return [
            {
                role: 'manager',
                email: 'admin@petcafe.com',
                name: 'Nguyễn Thị Quản Lý',
                description: 'Full access to all features'
            },
            {
                role: 'manager',
                email: 'manager@petcafe.com',
                name: 'Trần Văn Giám Đốc',
                description: 'Manager with full permissions'
            },
            {
                role: 'sales_staff',
                email: 'alice@petcafe.com',
                name: 'Lê Thị Bán Hàng',
                description: 'Product sales and customer support'
            },
            {
                role: 'sales_staff',
                email: 'bob@petcafe.com',
                name: 'Phạm Văn Kinh Doanh',
                description: 'Sales and invoice management'
            },
            {
                role: 'working_staff',
                email: 'charlie@petcafe.com',
                name: 'Hoàng Thị Chăm Sóc',
                description: 'Pet care and task management'
            },
            {
                role: 'working_staff',
                email: 'diana@petcafe.com',
                name: 'Vũ Văn Thú Y',
                description: 'Pet care specialist'
            },
            {
                role: 'customer',
                email: 'eva@gmail.com',
                name: 'Nguyễn Thị Lan Anh',
                description: 'VIP customer with pets'
            },
            {
                role: 'customer',
                email: 'frank@yahoo.com',
                name: 'Trần Văn Hùng',
                description: 'Gold member customer'
            }
        ];
    },

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate password strength
    validatePassword(password) {
        const errors = [];

        if (password.length < 6) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        }

        if (!/[a-zA-Z]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 số');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Get user permissions based on role
    getPermissionsByRole(role) {
        const permissionMap = {
            manager: [
                'staff_management',
                'pet_management',
                'service_management',
                'report_access',
                'revenue_tracking',
                'full_access'
            ],
            sales_staff: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            working_staff: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            customer: [
                'service_booking',
                'product_purchase',
                'feedback_submission',
                'notification_receive'
            ]
        };

        return permissionMap[role] || [];
    }
};

// Profile and general user operations
export const profileApi = {
    // Get user profile
    async getProfile() {
        return await userApi.general.getProfile();
    },

    // Update user profile
    async updateProfile(profileData) {
        return await userApi.general.updateProfile(profileData);
    },

    // Change password
    async changePassword(passwordData) {
        return await userApi.general.changePassword(passwordData);
    }
};

// Role-specific API collections
export const managerApi = {
    // Staff Management
    async getStaff() {
        return await userApi.manager.getStaff();
    },

    async createStaff(staffData) {
        return await userApi.manager.createStaff(staffData);
    },

    async updateStaff(staffId, updateData) {
        return await userApi.manager.updateStaff(staffId, updateData);
    },

    // Pet Management
    async getAllPets() {
        return await userApi.manager.getAllPets();
    },

    // Service Management
    async getServices() {
        return await userApi.manager.getServices();
    },

    async createService(serviceData) {
        return await userApi.manager.createService(serviceData);
    },

    // Reports and Analytics
    async getReports() {
        return await userApi.manager.getReports();
    },

    async getRevenue(period = 'monthly') {
        return await userApi.manager.getRevenue(period);
    }
};

export const salesApi = {
    // Product Sales
    async getProducts() {
        return await userApi.sales.getProducts();
    },
    // Services for sale
    async getServices() {
        return await userApi.manager.getServices();
    },

    async createOrder(orderData) {
        return await userApi.sales.createOrder(orderData);
    },

    // Invoice Management
    async getInvoices() {
        return await userApi.sales.getInvoices();
    },

    // Customer Support
    async getCustomers() {
        return await userApi.sales.getCustomers();
    }
};

export const workingStaffApi = {
    // Task Management
    async getTasks() {
        return await userApi.workingStaff.getTasks();
    },

    async updateTaskStatus(taskId, status) {
        return await userApi.workingStaff.updateTaskStatus(taskId, status);
    },

    // Pet Care
    async updatePetStatus(petId, statusData) {
        return await userApi.workingStaff.updatePetStatus(petId, statusData);
    },

    // Service Execution
    async getAssignedServices() {
        return await userApi.workingStaff.getAssignedServices();
    }
};

export const customerApi = {
    // Service Booking
    async getAvailableServices() {
        return await userApi.customer.getAvailableServices();
    },

    async checkAvailability(serviceId, date) {
        return await userApi.customer.checkAvailability(serviceId, date);
    },

    async createBooking(bookingData) {
        return await userApi.customer.createBooking(bookingData);
    },

    async getMyBookings() {
        return await userApi.customer.getMyBookings();
    },

    async getBookingHistory(filters = {}) {
        return await userApi.customer.getBookingHistory(filters);
    },

    async cancelBooking(bookingId, reason) {
        return await userApi.customer.cancelBooking(bookingId, reason);
    },

    async rescheduleBooking(bookingId, newDateTime) {
        return await userApi.customer.rescheduleBooking(bookingId, newDateTime);
    },

    // Product Purchase
    async purchaseProducts(purchaseData) {
        return await userApi.customer.purchaseProducts(purchaseData);
    },

    // Pet Management
    async getMyPets() {
        return await userApi.customer.getMyPets();
    },

    async addPet(petData) {
        return await userApi.customer.addPet(petData);
    },

    // Feedback and Notifications
    async submitFeedback(feedbackData) {
        return await userApi.customer.submitFeedback(feedbackData);
    },

    async getNotifications() {
        return await userApi.customer.getNotifications();
    },

    async markNotificationRead(notificationId) {
        return await userApi.customer.markNotificationRead(notificationId);
    },

    async markAllNotificationsRead() {
        return await userApi.customer.markAllNotificationsRead();
    }
};

// Utility functions for common operations
export const authUtils = {
    // Get user display name
    getUserDisplayName(user) {
        if (!user) return 'Khách';

        switch (user.role) {
            case 'manager':
                return `Quản lý ${user.name}`;
            case 'sales_staff':
                return `NV Bán hàng ${user.name}`;
            case 'working_staff':
                return `NV Chăm sóc ${user.name}`;
            case 'customer':
                return user.name;
            default:
                return user.name || user.email;
        }
    },

    // Get user avatar or default
    getUserAvatar(user) {
        if (user?.avatar) return user.avatar;

        // Return default avatar based on role
        const defaultAvatars = {
            manager: '👨‍💼',
            sales_staff: '👩‍💻',
            working_staff: '👨‍⚕️',
            customer: '🙋‍♀️'
        };

        return defaultAvatars[user?.role] || '👤';
    },

    // Format user role for display
    formatUserRole(role) {
        const roleNames = {
            manager: 'Quản lý',
            sales_staff: 'Nhân viên bán hàng',
            working_staff: 'Nhân viên chăm sóc',
            customer: 'Khách hàng'
        };

        return roleNames[role] || role;
    },

    // Check if user can access feature
    canAccessFeature(user, feature) {
        if (!user) return false;

        const featurePermissions = {
            dashboard: ['manager', 'sales_staff', 'working_staff'],
            staff_management: ['manager'],
            reports: ['manager'],
            revenue: ['manager'],
            sales: ['manager', 'sales_staff'],
            tasks: ['manager', 'working_staff'],
            pet_care: ['manager', 'working_staff'],
            booking: ['customer'],
            profile: ['manager', 'sales_staff', 'working_staff', 'customer']
        };

        const allowedRoles = featurePermissions[feature] || [];
        return allowedRoles.includes(user.role);
    }
};

// Export default auth API
export default authApi;
