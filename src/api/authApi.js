// Authentication API - Wrapper for userApi auth functions
// This file provides a clean interface for authentication operations

import userApi from './userApi.js';

// Re-export authentication functions from userApi with additional utilities
export const authApi = {
    // Login function
    async login(credentials) {
        try {
            const response = await userApi.auth.login(credentials);

            // Store additional auth data if needed
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
    },

    // Register function (Customer only)
    async register(userData) {
        try {
            const response = await userApi.auth.register(userData);

            if (response.success) {
                // Auto-login after successful registration
                localStorage.setItem('authToken', `mock-token-${response.user.id}`);
                localStorage.setItem('userRole', response.user.role);
                localStorage.setItem('loginTime', new Date().toISOString());
            }

            return response;
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

    async createBooking(bookingData) {
        return await userApi.customer.createBooking(bookingData);
    },

    async getMyBookings() {
        return await userApi.customer.getMyBookings();
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
