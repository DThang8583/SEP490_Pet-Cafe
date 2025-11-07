// Note: Avoid importing slots at module top to prevent circular deps with slotApi

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== MOCK SERVICES DATA ==========
const MOCK_SERVICES = [
    {
        id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
        name: 'Combo Trải Nghiệm Thú Cưng (2 Giờ)',
        description: 'Bao gồm vé vào cổng khu vực thú cưng trong 2 giờ, kèm theo 1 đồ uống tùy chọn từ menu (cà phê/trà) và 1 phần snack nhỏ cho thú cưng.',
        duration_minutes: 120,
        base_price: 80000,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Fae24dee3-563c-4d2b-8d1c-db3d610f3398.jpg?alt=media&token=9f4a73cb-d651-49fe-a0b8-91eebeacc156',
        thumbnails: [
            'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Fae24dee3-563c-4d2b-8d1c-db3d610f3398.jpg?alt=media&token=9f4a73cb-d651-49fe-a0b8-91eebeacc156'
        ],
        is_active: true,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        task: null,
        slots: [],
        order_details: [],
        bookings: [],
        created_at: '2025-10-27T16:05:43.85052+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T16:05:43.85052+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '8f3a2c1b-4e5d-6f7a-8b9c-0d1e2f3a4b5c',
        name: 'Chăm Sóc Mèo Chuyên Nghiệp',
        description: 'Dịch vụ chăm sóc toàn diện cho mèo bao gồm: vệ sinh, cho ăn, chải lông và kiểm tra sức khỏe cơ bản trong 3 giờ.',
        duration_minutes: 180,
        base_price: 120000,
        image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        thumbnails: [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400'
        ],
        is_active: true,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        task: null,
        slots: [],
        order_details: [],
        bookings: [],
        created_at: '2025-10-28T14:14:07.355437+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T14:14:07.355437+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'dbb37550-589f-5993-972g-2bbc1b52cb5c',
        name: 'Huấn Luyện Cơ Bản Cho Chó',
        description: 'Huấn luyện cơ bản (ngồi, đứng, nằm, gọi lại) trong môi trường an toàn, phù hợp khi khách vui chơi cùng thú cưng.',
        duration_minutes: 120,
        base_price: 150000,
        image_url: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?w=400',
        thumbnails: ['https://images.unsplash.com/photo-1507149833265-60c372daea22?w=400'],
        is_active: true,
        task_id: 'b96g6789-g0bd-34f5-c678-648836396222',
        task: null,
        slots: [],
        order_details: [],
        bookings: [],
        created_at: '2025-10-29T10:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T10:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'a12b34c5-d6e7-48f9-a0b1-c2d3e4f5a6b7',
        name: 'Vé Vào Cổng 1 Giờ',
        description: 'Vé vào cổng khu vực thú cưng trong 60 phút kèm 1 chai nước suối.',
        duration_minutes: 60,
        base_price: 50000,
        image_url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400',
        thumbnails: ['https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400'],
        is_active: true,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        task: null,
        slots: [],
        order_details: [],
        bookings: [],
        created_at: '2025-10-27T16:40:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T16:40:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'c23d45e6-f7a8-49b0-b1c2-d3e4f5a6b7c8',
        name: 'Spa & Tắm Gội Thú Cưng',
        description: 'Tắm gội, sấy khô, chải lông, vệ sinh tai và cắt móng cơ bản.',
        duration_minutes: 90,
        base_price: 180000,
        image_url: 'https://images.unsplash.com/photo-1558944351-c37d7c8a4f61?w=400',
        thumbnails: ['https://images.unsplash.com/photo-1558944351-c37d7c8a4f61?w=400'],
        is_active: false,
        task_id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        task: null,
        slots: [],
        order_details: [],
        bookings: [],
        created_at: '2025-10-30T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-30T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

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

        // For each service, populate slots (lazy import to avoid circular deps)
        const { MOCK_SLOTS } = await import('./slotApi');
        const servicesWithSlots = paginatedServices.map(service => ({
            ...service,
            slots: MOCK_SLOTS.filter(slot => slot.service_id === service.id)
        }));

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

        // Populate slots (lazy import)
        const { MOCK_SLOTS } = await import('./slotApi');
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

        // Get slots for this service (lazy import)
        const { MOCK_SLOTS } = await import('./slotApi');
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
export { MOCK_SERVICES };
