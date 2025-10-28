import axios from 'axios';

// ========== CONSTANTS ==========

export const SERVICE_STATUS = {
    ENABLED: 'enabled',
    DISABLED: 'disabled'
};

// ========== UTILITY FUNCTIONS ==========

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'service') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': ['view_services'],
        'working_staff': ['view_services'],
        'sales_staff': ['view_services'],
        'manager': ['service_management', 'view_services', 'full_access'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// ========== MOCK DATABASE ==========

let MOCK_SERVICES = [
    {
        id: 'service-001',
        task_id: 'task-template-001',
        task_type: 'service',
        images: [
            'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400'
        ],
        name: 'Tắm rửa thú cưng cơ bản',
        description: 'Dịch vụ tắm gội với sữa tắm chuyên dụng, sấy khô và chải lông cơ bản cho chó và mèo',
        estimate_duration: 60,
        price: 150000,
        status: 'enabled',
        created_at: '2024-01-15T10:30:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-20T14:00:00Z',
        updated_by: 'user-001'
    },
    {
        id: 'service-002',
        task_id: 'task-template-002',
        task_type: 'service',
        images: [
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
            'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
            'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400'
        ],
        name: 'Grooming cao cấp',
        description: 'Dịch vụ grooming cao cấp bao gồm spa, massage thư giãn, và tạo kiểu lông theo yêu cầu',
        estimate_duration: 120,
        price: 350000,
        status: 'enabled',
        created_at: '2024-01-16T14:30:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-16T14:30:00Z',
        updated_by: null
    },
    {
        id: 'service-003',
        task_id: 'task-template-006',
        task_type: 'service',
        images: [
            'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400'
        ],
        name: 'Huấn luyện cơ bản',
        description: 'Huấn luyện các lệnh cơ bản và kỹ năng xã hội cho chó: ngồi, nằm, ở lại, đến',
        estimate_duration: 90,
        price: 250000,
        status: 'disabled',
        created_at: '2024-01-20T10:30:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-20T10:30:00Z',
        updated_by: null
    }
];

// ========== API FUNCTIONS ==========

const serviceApi = {
    /**
     * Get all services (for management)
     * @param {Object} filters 
     * @returns {Promise<Object>}
     */
    async getAllServices(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền xem danh sách dịch vụ');
        }

        let services = [...MOCK_SERVICES];

        // Apply filters
        if (filters.status) {
            services = services.filter(s => s.status === filters.status);
        }

        if (filters.task_type) {
            services = services.filter(s => s.task_type === filters.task_type);
        }

        if (filters.task_id) {
            services = services.filter(s => s.task_id === filters.task_id);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            services = services.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                s.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by created_at (newest first)
        services.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            success: true,
            data: services,
            total: services.length
        };
    },

    /**
     * Get available services (for customers - only enabled)
     * @param {Object} filters 
     * @returns {Promise<Object>}
     */
    async getAvailableServices(filters = {}) {
        await delay(300);

        let services = MOCK_SERVICES.filter(s => s.status === SERVICE_STATUS.ENABLED);

        // Apply filters
        if (filters.task_type) {
            services = services.filter(s => s.task_type === filters.task_type);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            services = services.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                s.description.toLowerCase().includes(searchLower)
            );
        }

        if (filters.min_price !== undefined) {
            services = services.filter(s => s.price >= filters.min_price);
        }

        if (filters.max_price !== undefined) {
            services = services.filter(s => s.price <= filters.max_price);
        }

        // Sort by price (ascending) by default
        services.sort((a, b) => a.price - b.price);

        return {
            success: true,
            data: services,
            total: services.length
        };
    },

    /**
     * Get service by ID
     * @param {string} serviceId 
     * @returns {Promise<Object>}
     */
    async getServiceById(serviceId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'view_services')) {
            throw new Error('Không có quyền xem dịch vụ');
        }

        const service = MOCK_SERVICES.find(s => s.id === serviceId);

        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // If customer, only show enabled services
        if (currentUser && currentUser.role === 'customer' && service.status !== SERVICE_STATUS.ENABLED) {
            throw new Error('Dịch vụ không khả dụng');
        }

        return {
            success: true,
            data: service
        };
    },

    /**
     * Get service by task ID
     * @param {string} taskId 
     * @returns {Promise<Object>}
     */
    async getServiceByTaskId(taskId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền xem dịch vụ');
        }

        const service = MOCK_SERVICES.find(s => s.task_id === taskId);

        if (!service) {
            return {
                success: true,
                data: null,
                message: 'Task này chưa có dịch vụ'
            };
        }

        return {
            success: true,
            data: service
        };
    },

    /**
     * Create service from task
     * @param {Object} serviceData 
     * @returns {Promise<Object>}
     */
    async createService(serviceData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền tạo dịch vụ');
        }

        // ========== VALIDATION ==========

        // 1. Task ID (Required, Unique)
        if (!serviceData.task_id) {
            throw new Error('Task ID là bắt buộc');
        }

        // Check if service already exists for this task (1:1 relationship)
        const existingService = MOCK_SERVICES.find(s => s.task_id === serviceData.task_id);
        if (existingService) {
            throw new Error('Task này đã có dịch vụ. 1 Task chỉ có thể tạo 1 Service.');
        }

        // 2. Task Type (Required)
        if (!serviceData.task_type) {
            throw new Error('Task Type là bắt buộc');
        }

        // 3. Name (Required)
        if (!serviceData.name || !serviceData.name.trim()) {
            throw new Error('Tên dịch vụ là bắt buộc');
        }

        // 4. Description (Required)
        if (!serviceData.description || !serviceData.description.trim()) {
            throw new Error('Mô tả dịch vụ là bắt buộc');
        }

        // 5. Estimate Duration (Required)
        if (!serviceData.estimate_duration || serviceData.estimate_duration <= 0) {
            throw new Error('Thời gian ước tính phải lớn hơn 0');
        }

        // 6. Price (Required)
        if (serviceData.price === undefined || serviceData.price === null || serviceData.price < 0) {
            throw new Error('Giá dịch vụ là bắt buộc và không được âm');
        }

        // ========== CREATE SERVICE ==========

        const newService = {
            id: generateId('service'),
            task_id: serviceData.task_id,
            task_type: serviceData.task_type,
            image: serviceData.image || '',
            name: serviceData.name.trim(),
            description: serviceData.description.trim(),
            estimate_duration: parseInt(serviceData.estimate_duration),
            price: parseFloat(serviceData.price),
            status: SERVICE_STATUS.DISABLED, // Default status
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
            updated_at: new Date().toISOString(),
            updated_by: null
        };

        MOCK_SERVICES.push(newService);

        return {
            success: true,
            data: newService,
            message: 'Tạo dịch vụ thành công. Status mặc định là Disabled.'
        };
    },

    /**
     * Update service
     * @param {string} serviceId 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async updateService(serviceId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền cập nhật dịch vụ');
        }

        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // ========== VALIDATION ==========

        // Cannot change task_id (1:1 relationship)
        if (updates.task_id && updates.task_id !== MOCK_SERVICES[serviceIndex].task_id) {
            throw new Error('Không thể thay đổi Task ID của dịch vụ');
        }

        // Name validation
        if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
            throw new Error('Tên dịch vụ không được để trống');
        }

        // Description validation
        if (updates.description !== undefined && (!updates.description || !updates.description.trim())) {
            throw new Error('Mô tả dịch vụ không được để trống');
        }

        // Duration validation
        if (updates.estimate_duration !== undefined && updates.estimate_duration <= 0) {
            throw new Error('Thời gian ước tính phải lớn hơn 0');
        }

        // Price validation
        if (updates.price !== undefined && updates.price < 0) {
            throw new Error('Giá dịch vụ không được âm');
        }

        // Status validation
        if (updates.status && !Object.values(SERVICE_STATUS).includes(updates.status)) {
            throw new Error('Status không hợp lệ');
        }

        // ========== UPDATE SERVICE ==========

        const updatedService = {
            ...MOCK_SERVICES[serviceIndex],
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_SERVICES[serviceIndex] = updatedService;

        return {
            success: true,
            data: updatedService,
            message: 'Cập nhật dịch vụ thành công'
        };
    },

    /**
     * Toggle service status (enable/disable)
     * @param {string} serviceId 
     * @returns {Promise<Object>}
     */
    async toggleServiceStatus(serviceId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền thay đổi trạng thái dịch vụ');
        }

        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        const currentStatus = MOCK_SERVICES[serviceIndex].status;
        const newStatus = currentStatus === SERVICE_STATUS.ENABLED ? SERVICE_STATUS.DISABLED : SERVICE_STATUS.ENABLED;

        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            status: newStatus,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        return {
            success: true,
            data: MOCK_SERVICES[serviceIndex],
            message: `Dịch vụ đã được ${newStatus === SERVICE_STATUS.ENABLED ? 'kích hoạt' : 'vô hiệu hóa'}`
        };
    },

    /**
     * Delete service
     * @param {string} serviceId 
     * @returns {Promise<Object>}
     */
    async deleteService(serviceId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền xóa dịch vụ');
        }

        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        const service = MOCK_SERVICES[serviceIndex];

        // Prevent deleting enabled services
        if (service.status === SERVICE_STATUS.ENABLED) {
            throw new Error('Không thể xóa dịch vụ đang hoạt động. Vui lòng vô hiệu hóa trước.');
        }

        // TODO: Check if service has active slots/bookings

        MOCK_SERVICES.splice(serviceIndex, 1);

        return {
            success: true,
            message: 'Xóa dịch vụ thành công'
        };
    },

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const stats = {
            total: MOCK_SERVICES.length,
            enabled: MOCK_SERVICES.filter(s => s.status === SERVICE_STATUS.ENABLED).length,
            disabled: MOCK_SERVICES.filter(s => s.status === SERVICE_STATUS.DISABLED).length,
            average_price: MOCK_SERVICES.reduce((sum, s) => sum + s.price, 0) / MOCK_SERVICES.length || 0
        };

        return {
            success: true,
            data: stats
        };
    }
};

// Export
export { MOCK_SERVICES };
export default serviceApi;
