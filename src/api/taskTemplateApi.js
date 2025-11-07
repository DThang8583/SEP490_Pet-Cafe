// Note: MOCK_WORK_TYPES removed - use workTypeApi.getWorkTypeById() for API calls
import { getWorkTypeById as getWorkTypeByIdFromAPI } from './workTypeApi';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
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

export const TASK_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
};

export const TASK_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
};

export const TASK_TYPES = [
    { key: 'cleaning', name: 'Dọn dẹp', icon: '🧹', color: '#4CAF50' },
    { key: 'feeding', name: 'Cho pet ăn', icon: '🍖', color: '#FF9800' },
    { key: 'cashier', name: 'Thu ngân', icon: '💰', color: '#2196F3' },
    { key: 'service', name: 'Làm service', icon: '✨', color: '#9C27B0' },
];

// ========== MOCK DATABASE ==========

// Helper: Get work type by ID
// TODO: This is a sync helper but API is async - needs refactoring
// For now, this will return null - update to use async getWorkTypeByIdFromAPI when needed
const getWorkTypeById = (id) => {
    // Note: MOCK_WORK_TYPES removed - this helper needs to be updated to use API
    // Return null for now - update calling code to use async getWorkTypeByIdFromAPI
    return null;
};

let MOCK_TASK_TEMPLATES = [
    {
        id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        title: 'hướng dẫn khách chơi với  mèo',
        image_url: null,
        description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa ,  tiếp  đón  và phục vụ khách  trong khu vực',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.ACTIVE,
        is_public: true, // Công khai - đã có service
        is_recurring: true,
        estimated_hours: 1,
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
        service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
        work_type: getWorkTypeById('7e7477a6-f481-4df6-b3fd-626944475fb5'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-27T13:43:29.800464+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T16:05:43.850522+00:00',
        updated_by: '00000000-0000-0000-0000-000000000000',
        is_deleted: false
    },
    {
        id: '752a0719-64a4-49b7-85ff-b266216667b9',
        title: 'dọn  dẹp vệ sinh khu  vực mèo',
        image_url: null,
        description: 'dọn  dẹp vệ sinh khu  vực mèo',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.ACTIVE,
        is_public: true, // Công khai - đã có service
        is_recurring: true,
        estimated_hours: 1,
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
        service_id: null,
        work_type: getWorkTypeById('7e7477a6-f481-4df6-b3fd-626944475fb5'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-28T14:14:07.355437+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T14:14:07.355437+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        title: 'Cho mèo ăn sáng',
        image_url: null,
        description: 'Chuẩn bị và phân phối thức ăn sáng cho mèo theo khẩu phần riêng của từng bé',
        priority: TASK_PRIORITY.URGENT,
        status: TASK_STATUS.ACTIVE,
        is_public: true, // Công khai - chưa có service
        is_recurring: true,
        estimated_hours: 0.5,
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
        service_id: null,
        work_type: getWorkTypeById('7e7477a6-f481-4df6-b3fd-626944475fb5'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-27T07:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T07:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        title: 'Kiểm tra sức khỏe mèo định kỳ',
        image_url: null,
        description: 'Kiểm tra thân nhiệt, hành vi, mắt, tai, và tình trạng ăn uống của từng bé mèo hàng ngày',
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.ACTIVE,
        is_public: true, // Công khai - chưa có service
        is_recurring: true,
        estimated_hours: 1,
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
        service_id: null,
        work_type: getWorkTypeById('7e7477a6-f481-4df6-b3fd-626944475fb5'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-27T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Cho chó ăn sáng',
        image_url: null,
        description: 'Chuẩn bị và cho chó ăn sáng theo khẩu phần, đảm bảo dinh dưỡng đầy đủ',
        priority: TASK_PRIORITY.URGENT,
        status: TASK_STATUS.ACTIVE,
        is_public: false,
        is_recurring: true,
        estimated_hours: 0.5,
        work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
        service_id: 'dbb37550-589f-5993-972g-2bbc1b52cb5c',
        work_type: getWorkTypeById('b0c8a471-3b55-4038-9642-b598c072ea45'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-28T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'a85f5678-f9ac-23e4-b567-537725285111',
        title: 'Dắt chó đi dạo',
        image_url: null,
        description: 'Dắt chó đi dạo trong khu vực an toàn, tập thể dục và vận động buổi sáng',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.ACTIVE,
        is_public: false,
        is_recurring: true,
        estimated_hours: 1,
        work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
        service_id: null,
        work_type: getWorkTypeById('b0c8a471-3b55-4038-9642-b598c072ea45'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-28T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'b96g6789-g0bd-34f5-c678-648836396222',
        title: 'Huấn luyện cơ bản cho chó',
        image_url: null,
        description: 'Huấn luyện các lệnh cơ bản: ngồi, nằm, ở lại, đến cho chó trong thời gian vui chơi với khách',
        priority: TASK_PRIORITY.LOW,
        status: TASK_STATUS.ACTIVE,
        is_public: false,
        is_recurring: true,
        estimated_hours: 2,
        work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
        service_id: 'dbb37550-589f-5993-972g-2bbc1b52cb5c',
        work_type: getWorkTypeById('b0c8a471-3b55-4038-9642-b598c072ea45'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-28T10:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T10:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'c07h7890-h1ce-45g6-d789-759947407333',
        title: 'Vệ sinh Dog Play Area',
        image_url: null,
        description: 'Dọn dẹp khu vực chơi của chó, khử trùng thiết bị, kiểm tra và sửa chữa đồ chơi hư hỏng',
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.ACTIVE,
        is_public: false,
        is_recurring: true,
        estimated_hours: 1.5,
        work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
        service_id: null,
        work_type: getWorkTypeById('b0c8a471-3b55-4038-9642-b598c072ea45'),
        service: null,
        slots: [],
        daily_tasks: [],
        created_at: '2025-10-28T14:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T14:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
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

        let templates = [...MOCK_TASK_TEMPLATES].filter(t => !t.is_deleted);

        // Apply filters
        if (filters.status) {
            templates = templates.filter(t => t.status === filters.status);
        }

        if (filters.priority) {
            templates = templates.filter(t => t.priority === filters.priority);
        }

        if (filters.work_type_id) {
            templates = templates.filter(t => t.work_type_id === filters.work_type_id);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            templates = templates.filter(t =>
                t.title.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by created_at (newest first)
        templates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            success: true,
            data: templates,
            pagination: {
                total_items_count: templates.length,
                page_size: 100,
                total_pages_count: 1,
                page_index: 0,
                has_next: false,
                has_previous: false
            }
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

        const template = MOCK_TASK_TEMPLATES.find(t => t.id === templateId && !t.is_deleted);

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
        if (!templateData.title || !templateData.title.trim()) {
            throw new Error('Tên nhiệm vụ là bắt buộc');
        }

        if (!templateData.description || !templateData.description.trim()) {
            throw new Error('Mô tả nhiệm vụ là bắt buộc');
        }

        if (!templateData.work_type_id) {
            throw new Error('Loại công việc là bắt buộc');
        }

        // Get work type
        const workType = MOCK_WORK_TYPES.find(wt => wt.id === templateData.work_type_id);

        // Create new template
        const newTemplate = {
            id: generateId(),
            title: templateData.title.trim(),
            image_url: templateData.image_url || null,
            description: templateData.description.trim(),
            priority: templateData.priority || TASK_PRIORITY.MEDIUM,
            status: templateData.status || TASK_STATUS.ACTIVE,
            is_public: templateData.is_public || false,
            is_recurring: templateData.is_recurring || false,
            estimated_hours: templateData.estimated_hours || 1,
            work_type_id: templateData.work_type_id,
            service_id: templateData.service_id || null,
            work_type: workType || null,
            service: null,
            slots: [],
            daily_tasks: [],
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        MOCK_TASK_TEMPLATES.push(newTemplate);

        return {
            success: true,
            data: newTemplate,
            message: 'Tạo nhiệm vụ thành công'
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

        const templateIndex = MOCK_TASK_TEMPLATES.findIndex(t => t.id === templateId && !t.is_deleted);

        if (templateIndex === -1) {
            throw new Error('Không tìm thấy task template');
        }

        // Validation
        if (updates.title !== undefined && (!updates.title || !updates.title.trim())) {
            throw new Error('Tên nhiệm vụ không được để trống');
        }

        if (updates.description !== undefined && (!updates.description || !updates.description.trim())) {
            throw new Error('Mô tả nhiệm vụ không được để trống');
        }

        // Get work type if changed
        let workType = MOCK_TASK_TEMPLATES[templateIndex].work_type;
        if (updates.work_type_id) {
            workType = MOCK_WORK_TYPES.find(wt => wt.id === updates.work_type_id) || workType;
        }

        // Apply updates
        const updatedTemplate = {
            ...MOCK_TASK_TEMPLATES[templateIndex],
            ...updates,
            work_type: workType,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        };

        MOCK_TASK_TEMPLATES[templateIndex] = updatedTemplate;

        return {
            success: true,
            data: updatedTemplate,
            message: 'Cập nhật nhiệm vụ thành công'
        };
    },

    /**
     * Delete task template (soft delete)
     * @param {string} templateId 
     * @returns {Promise<Object>}
     */
    async deleteTaskTemplate(templateId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xóa task template');
        }

        const templateIndex = MOCK_TASK_TEMPLATES.findIndex(t => t.id === templateId && !t.is_deleted);

        if (templateIndex === -1) {
            throw new Error('Không tìm thấy task template');
        }

        // Soft delete
        MOCK_TASK_TEMPLATES[templateIndex].is_deleted = true;
        MOCK_TASK_TEMPLATES[templateIndex].updated_at = new Date().toISOString();
        MOCK_TASK_TEMPLATES[templateIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

        return {
            success: true,
            message: 'Xóa nhiệm vụ thành công'
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

        const activeTemplates = MOCK_TASK_TEMPLATES.filter(t => !t.is_deleted && t.status === TASK_STATUS.ACTIVE);

        const stats = {
            total: activeTemplates.length,
            by_priority: {
                [TASK_PRIORITY.URGENT]: activeTemplates.filter(t => t.priority === TASK_PRIORITY.URGENT).length,
                [TASK_PRIORITY.HIGH]: activeTemplates.filter(t => t.priority === TASK_PRIORITY.HIGH).length,
                [TASK_PRIORITY.MEDIUM]: activeTemplates.filter(t => t.priority === TASK_PRIORITY.MEDIUM).length,
                [TASK_PRIORITY.LOW]: activeTemplates.filter(t => t.priority === TASK_PRIORITY.LOW).length
            },
            by_status: {
                [TASK_STATUS.ACTIVE]: MOCK_TASK_TEMPLATES.filter(t => !t.is_deleted && t.status === TASK_STATUS.ACTIVE).length,
                [TASK_STATUS.INACTIVE]: MOCK_TASK_TEMPLATES.filter(t => !t.is_deleted && t.status === TASK_STATUS.INACTIVE).length
            }
        };

        return {
            success: true,
            data: stats
        };
    },

    /**
     * Get work types
     * @returns {Promise<Object>}
     * Note: This should use workTypeApi.getWorkTypes() instead
     */
    async getWorkTypes() {
        await delay(200);

        // TODO: Use workTypeApi.getWorkTypes() instead of mock data
        // For now, return empty array
        return {
            success: true,
            data: []
        };
    }
};

// Export
export { MOCK_TASK_TEMPLATES };
export default taskTemplateApi;
