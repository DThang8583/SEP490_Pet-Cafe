import { MOCK_SERVICES } from './mockServices';
import { MOCK_SLOTS } from './mockSlots';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Service API matching official structure
const serviceApi = {
    /**
     * Get all services with pagination
     * @param {Object} params - { page_index, page_size, search, is_active }
     * @returns {Promise<Object>}
     */
    async getAllServices(params = {}) {
        await delay(300);

        const {
            page_index = 0,
            page_size = 10,
            search = '',
            is_active = null
        } = params;

        let services = [...MOCK_SERVICES];

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            services = services.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                s.description.toLowerCase().includes(searchLower)
            );
        }

        // Filter by is_active
        if (is_active !== null) {
            services = services.filter(s => s.is_active === is_active);
        }

        // Filter out deleted
        services = services.filter(s => !s.is_deleted);

        // Calculate pagination
        const total_items_count = services.length;
        const total_pages_count = Math.ceil(total_items_count / page_size);
        const start = page_index * page_size;
        const end = start + page_size;
        const paginatedServices = services.slice(start, end);

        // For each service, populate slots from MOCK_SLOTS
        const servicesWithSlots = paginatedServices.map(service => {
            const serviceSlots = MOCK_SLOTS.filter(slot => slot.service_id === service.id);
            return {
                ...service,
                slots: serviceSlots
            };
        });

        return {
            data: servicesWithSlots,
            pagination: {
                total_items_count,
                page_size,
                total_pages_count,
                page_index,
                has_next: page_index < total_pages_count - 1,
                has_previous: page_index > 0
            }
        };
    },

    /**
     * Get service by ID with detailed information
     * @param {string} serviceId
     * @returns {Promise<Object>}
     */
    async getServiceById(serviceId) {
        await delay(200);

        const service = MOCK_SERVICES.find(s => s.id === serviceId && !s.is_deleted);

        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Populate slots
        const serviceSlots = MOCK_SLOTS.filter(slot => slot.service_id === serviceId);

        return {
            ...service,
            slots: serviceSlots
        };
    },

    /**
     * Get slots of a service
     * @param {string} serviceId
     * @param {Object} params - { page_index, page_size }
     * @returns {Promise<Object>}
     */
    async getSlotsByServiceId(serviceId, params = {}) {
        await delay(200);

        const {
            page_index = 0,
            page_size = 10
        } = params;

        // Check if service exists
        const service = MOCK_SERVICES.find(s => s.id === serviceId && !s.is_deleted);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Get slots for this service
        let slots = MOCK_SLOTS.filter(slot => slot.service_id === serviceId);

        // Calculate pagination
        const total_items_count = slots.length;
        const total_pages_count = Math.ceil(total_items_count / page_size);
        const start = page_index * page_size;
        const end = start + page_size;
        const paginatedSlots = slots.slice(start, end);

        return {
            data: paginatedSlots,
            pagination: {
                total_items_count,
                page_size,
                total_pages_count,
                page_index,
                has_next: page_index < total_pages_count - 1,
                has_previous: page_index > 0
            }
        };
    },

    /**
     * Create a new service
     * @param {Object} serviceData
     * @returns {Promise<Object>}
     */
    async createService(serviceData) {
        await delay(500);

        // Validation
        if (!serviceData.name || !serviceData.name.trim()) {
            throw new Error('Tên dịch vụ là bắt buộc');
        }

        if (!serviceData.description || !serviceData.description.trim()) {
            throw new Error('Mô tả dịch vụ là bắt buộc');
        }

        if (!serviceData.duration_minutes || serviceData.duration_minutes <= 0) {
            throw new Error('Thời lượng phải lớn hơn 0');
        }

        if (serviceData.base_price === undefined || serviceData.base_price < 0) {
            throw new Error('Giá cơ bản không được âm');
        }

        // Check if service already exists for this task (if task_id provided)
        if (serviceData.task_id) {
            const existingService = MOCK_SERVICES.find(
                s => s.task_id === serviceData.task_id && !s.is_deleted
            );
            if (existingService) {
                throw new Error('Task này đã có dịch vụ');
            }
        }

        // Generate ID
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newService = {
            id,
            name: serviceData.name.trim(),
            description: serviceData.description.trim(),
            duration_minutes: serviceData.duration_minutes,
            base_price: serviceData.base_price,
            image_url: serviceData.image_url || null,
            thumbnails: serviceData.thumbnails || [],
            is_active: serviceData.is_active !== undefined ? serviceData.is_active : false,
            task_id: serviceData.task_id || null,
            task: null,
            slots: [],
            order_details: [],
            bookings: [],
            created_at: new Date().toISOString(),
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        MOCK_SERVICES.push(newService);

        return newService;
    },

    /**
     * Update a service
     * @param {string} serviceId
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateService(serviceId, updates) {
        await delay(400);

        const serviceIndex = MOCK_SERVICES.findIndex(
            s => s.id === serviceId && !s.is_deleted
        );

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Validation
        if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
            throw new Error('Tên dịch vụ không được để trống');
        }

        if (updates.description !== undefined && (!updates.description || !updates.description.trim())) {
            throw new Error('Mô tả dịch vụ không được để trống');
        }

        if (updates.duration_minutes !== undefined && updates.duration_minutes <= 0) {
            throw new Error('Thời lượng phải lớn hơn 0');
        }

        if (updates.base_price !== undefined && updates.base_price < 0) {
            throw new Error('Giá cơ bản không được âm');
        }

        // Cannot change task_id if service already linked to a task
        if (updates.task_id && MOCK_SERVICES[serviceIndex].task_id &&
            updates.task_id !== MOCK_SERVICES[serviceIndex].task_id) {
            throw new Error('Không thể thay đổi Task ID của dịch vụ đã liên kết');
        }

        // Update service
        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: '00000000-0000-0000-0000-000000000000'
        };

        return MOCK_SERVICES[serviceIndex];
    },

    /**
     * Toggle service active status
     * @param {string} serviceId
     * @returns {Promise<Object>}
     */
    async toggleServiceStatus(serviceId) {
        await delay(300);

        const serviceIndex = MOCK_SERVICES.findIndex(
            s => s.id === serviceId && !s.is_deleted
        );

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            is_active: !MOCK_SERVICES[serviceIndex].is_active,
            updated_at: new Date().toISOString(),
            updated_by: '00000000-0000-0000-0000-000000000000'
        };

        return MOCK_SERVICES[serviceIndex];
    },

    /**
     * Delete a service (soft delete)
     * @param {string} serviceId
     * @returns {Promise<Object>}
     */
    async deleteService(serviceId) {
        await delay(400);

        const serviceIndex = MOCK_SERVICES.findIndex(
            s => s.id === serviceId && !s.is_deleted
        );

        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Prevent deleting active services
        if (MOCK_SERVICES[serviceIndex].is_active) {
            throw new Error('Không thể xóa dịch vụ đang hoạt động. Vui lòng vô hiệu hóa trước.');
        }

        // Soft delete
        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            is_deleted: true,
            updated_at: new Date().toISOString(),
            updated_by: '00000000-0000-0000-0000-000000000000'
        };

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

        const activeServices = MOCK_SERVICES.filter(s => !s.is_deleted);

        const stats = {
            total: activeServices.length,
            active: activeServices.filter(s => s.is_active).length,
            inactive: activeServices.filter(s => !s.is_active).length,
            average_price: activeServices.length > 0
                ? activeServices.reduce((sum, s) => sum + s.base_price, 0) / activeServices.length
                : 0
        };

        return {
            data: stats
        };
    }
};

export default serviceApi;
