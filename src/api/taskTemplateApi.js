const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'task') => {
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
        'customer': [],
        'working_staff': [],
        'sales_staff': [],
        'manager': ['task_management', 'service_management', 'full_access'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// ========== CONSTANTS ==========

export const TASK_TYPES = [
    { key: 'cleaning', name: 'Dọn dẹp', icon: '🧹', color: '#4CAF50' },
    { key: 'feeding', name: 'Cho pet ăn', icon: '🍖', color: '#FF9800' },
    { key: 'cashier', name: 'Thu ngân', icon: '💰', color: '#2196F3' },
    { key: 'service', name: 'Làm service', icon: '✨', color: '#9C27B0' },
];

// ========== MOCK DATABASE ==========

let MOCK_TASK_TEMPLATES = [
    {
        id: 'task-template-001',
        task_type: 'service',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        name: 'Tắm rửa thú cưng cơ bản',
        description: 'Dịch vụ tắm gội với sữa tắm chuyên dụng, sấy khô và chải lông cơ bản cho chó và mèo',
        estimate_duration: 60, // minutes
        created_at: '2024-01-15T10:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-15T10:00:00Z',
        updated_by: null
    },
    {
        id: 'task-template-002',
        task_type: 'service',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        name: 'Grooming cao cấp',
        description: 'Dịch vụ grooming cao cấp bao gồm spa, massage thư giãn, và tạo kiểu lông theo yêu cầu',
        estimate_duration: 120,
        created_at: '2024-01-16T14:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-16T14:00:00Z',
        updated_by: null
    },
    {
        id: 'task-template-003',
        task_type: 'service',
        image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
        name: 'Chăm sóc thú cưng cả ngày',
        description: 'Dịch vụ chăm sóc thú cưng trọn gói trong 8 tiếng với các hoạt động vui chơi và bữa ăn',
        estimate_duration: 480,
        created_at: '2024-01-17T09:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-17T09:00:00Z',
        updated_by: null
    },
    {
        id: 'task-template-004',
        task_type: 'cleaning',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
        name: 'Dọn dẹp khu vực chơi',
        description: 'Vệ sinh và khử trùng khu vực vui chơi của thú cưng, thay đồ dùng và kiểm tra thiết bị',
        estimate_duration: 45,
        created_at: '2024-01-18T08:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-18T08:00:00Z',
        updated_by: null
    },
    {
        id: 'task-template-005',
        task_type: 'feeding',
        image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
        name: 'Cho ăn sáng thú cưng',
        description: 'Chuẩn bị và cho thú cưng ăn sáng theo chế độ dinh dưỡng riêng',
        estimate_duration: 30,
        created_at: '2024-01-19T07:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-19T07:00:00Z',
        updated_by: null
    },
    {
        id: 'task-template-006',
        task_type: 'service',
        image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400',
        name: 'Huấn luyện cơ bản',
        description: 'Huấn luyện các lệnh cơ bản và kỹ năng xã hội cho chó: ngồi, nằm, ở lại, đến',
        estimate_duration: 90,
        created_at: '2024-01-20T10:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-20T10:00:00Z',
        updated_by: null
    }
];

// ========== API FUNCTIONS ==========

const taskTemplateApi = {
    /**
     * Get all task templates
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    async getAllTaskTemplates(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xem danh sách task template');
        }

        let templates = [...MOCK_TASK_TEMPLATES];

        // Apply filters
        if (filters.task_type) {
            templates = templates.filter(t => t.task_type === filters.task_type);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            templates = templates.filter(t =>
                t.name.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by created_at (newest first)
        templates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            success: true,
            data: templates,
            total: templates.length
        };
    },

    /**
     * Get task template by ID
     * @param {string} templateId 
     * @returns {Promise<Object>}
     */
    async getTaskTemplateById(templateId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xem task template');
        }

        const template = MOCK_TASK_TEMPLATES.find(t => t.id === templateId);

        if (!template) {
            throw new Error('Không tìm thấy task template');
        }

        return {
            success: true,
            data: template
        };
    },

    /**
     * Create new task template
     * @param {Object} templateData 
     * @returns {Promise<Object>}
     */
    async createTaskTemplate(templateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền tạo task template');
        }

        // Validation
        if (!templateData.task_type) {
            throw new Error('Task type là bắt buộc');
        }

        // Accept both key and name for task_type
        const validTaskTypes = [...TASK_TYPES.map(t => t.key), ...TASK_TYPES.map(t => t.name)];
        if (!validTaskTypes.includes(templateData.task_type)) {
            throw new Error('Task type không hợp lệ');
        }

        if (!templateData.name || !templateData.name.trim()) {
            throw new Error('Tên task là bắt buộc');
        }

        if (!templateData.description || !templateData.description.trim()) {
            throw new Error('Mô tả task là bắt buộc');
        }

        if (!templateData.estimate_duration || templateData.estimate_duration <= 0) {
            throw new Error('Thời gian ước tính phải lớn hơn 0');
        }

        // Create new template
        const newTemplate = {
            id: generateId('task-template'),
            task_type: templateData.task_type,
            image: templateData.image || '',
            name: templateData.name.trim(),
            description: templateData.description.trim(),
            estimate_duration: parseInt(templateData.estimate_duration),
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
            updated_at: new Date().toISOString(),
            updated_by: null
        };

        MOCK_TASK_TEMPLATES.push(newTemplate);

        return {
            success: true,
            data: newTemplate,
            message: 'Tạo task template thành công'
        };
    },

    /**
     * Update task template
     * @param {string} templateId 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async updateTaskTemplate(templateId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền cập nhật task template');
        }

        const templateIndex = MOCK_TASK_TEMPLATES.findIndex(t => t.id === templateId);

        if (templateIndex === -1) {
            throw new Error('Không tìm thấy task template');
        }

        // Validation
        if (updates.task_type) {
            // Accept both key and name for task_type
            const validTaskTypes = [...TASK_TYPES.map(t => t.key), ...TASK_TYPES.map(t => t.name)];
            if (!validTaskTypes.includes(updates.task_type)) {
                throw new Error('Task type không hợp lệ');
            }
        }

        if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
            throw new Error('Tên task không được để trống');
        }

        if (updates.description !== undefined && (!updates.description || !updates.description.trim())) {
            throw new Error('Mô tả task không được để trống');
        }

        if (updates.estimate_duration !== undefined && updates.estimate_duration <= 0) {
            throw new Error('Thời gian ước tính phải lớn hơn 0');
        }

        // Apply updates
        const updatedTemplate = {
            ...MOCK_TASK_TEMPLATES[templateIndex],
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_TASK_TEMPLATES[templateIndex] = updatedTemplate;

        return {
            success: true,
            data: updatedTemplate,
            message: 'Cập nhật task template thành công'
        };
    },

    /**
     * Delete task template
     * @param {string} templateId 
     * @returns {Promise<Object>}
     */
    async deleteTaskTemplate(templateId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xóa task template');
        }

        const templateIndex = MOCK_TASK_TEMPLATES.findIndex(t => t.id === templateId);

        if (templateIndex === -1) {
            throw new Error('Không tìm thấy task template');
        }

        // TODO: Check if template is being used by any services
        // For now, allow deletion

        MOCK_TASK_TEMPLATES.splice(templateIndex, 1);

        return {
            success: true,
            message: 'Xóa task template thành công'
        };
    },

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const stats = {
            total: MOCK_TASK_TEMPLATES.length,
            by_type: {}
        };

        TASK_TYPES.forEach(type => {
            stats.by_type[type.key] = MOCK_TASK_TEMPLATES.filter(t => t.task_type === type.key).length;
        });

        return {
            success: true,
            data: stats
        };
    }
};

// Export
export { MOCK_TASK_TEMPLATES };
export default taskTemplateApi;

