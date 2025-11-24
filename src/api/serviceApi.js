import apiClient from '../config/config.jsx';

// Service API using official API endpoints
const serviceApi = {
    /**
     * Get all services with pagination and filters
     * @param {Object} params - { task_id, start_time, end_time, pet_species_ids, pet_breed_ids, area_ids, max_price, min_price, is_active, page, limit }
     * @returns {Promise<Object>} { data, pagination }
     */
    async getAllServices(params = {}) {
        try {
            const {
                task_id,
                start_time,
                end_time,
                pet_species_ids,
                pet_breed_ids,
                area_ids,
                max_price,
                min_price,
                is_active,
                page = 0,
                limit = 10
            } = params;

            const queryParams = {
                page,
                limit
            };

            // Add optional filters
            if (task_id) queryParams.task_id = task_id;
            if (start_time) queryParams.start_time = start_time;
            if (end_time) queryParams.end_time = end_time;
            if (pet_species_ids && Array.isArray(pet_species_ids) && pet_species_ids.length > 0) {
                queryParams.pet_species_ids = pet_species_ids.join(',');
            }
            if (pet_breed_ids && Array.isArray(pet_breed_ids) && pet_breed_ids.length > 0) {
                queryParams.pet_breed_ids = pet_breed_ids.join(',');
            }
            if (area_ids && Array.isArray(area_ids) && area_ids.length > 0) {
                queryParams.area_ids = area_ids.join(',');
            }
            if (max_price !== undefined && max_price !== null) queryParams.max_price = max_price;
            if (min_price !== undefined && min_price !== null) queryParams.min_price = min_price;
            if (is_active !== undefined && is_active !== null) queryParams.is_active = is_active;

            console.log('[getAllServices] Request params:', queryParams);

            const response = await apiClient.get('/services', {
                params: queryParams,
                timeout: 30000
            });

            console.log('[getAllServices] Response:', response.data);

            // Transform pagination from API format to expected format
            const pagination = response.data.pagination || {};
            return {
                data: response.data.data || [],
                pagination: {
                    total_items_count: pagination.total_items_count || 0,
                    page_size: pagination.page_size || limit,
                    total_pages_count: pagination.total_pages_count || 0,
                    page_index: pagination.page_index !== undefined ? pagination.page_index : page,
                    has_next: pagination.has_next || false,
                    has_previous: pagination.has_previous || false
                }
            };
        } catch (error) {
            console.error('[getAllServices] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể tải danh sách dịch vụ');
        }
    },

    /**
     * Get service by ID with detailed information
     * @param {string} serviceId
     * @returns {Promise<Object>}
     */
    async getServiceById(serviceId) {
        try {
            console.log('[getServiceById] Request serviceId:', serviceId);

            const response = await apiClient.get(`/services/${serviceId}`, {
                timeout: 30000
            });

            console.log('[getServiceById] Response:', response.data);

            return response.data;
        } catch (error) {
            console.error('[getServiceById] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không tìm thấy dịch vụ');
        }
    },

    /**
     * Get slots of a service
     * @param {string} serviceId
     * @param {Object} params - { page, limit }
     * @returns {Promise<Object>} { data, pagination }
     */
    async getSlotsByServiceId(serviceId, params = {}) {
        try {
            const {
                page = 0,
                limit = 10
            } = params;

            console.log('[getSlotsByServiceId] Request serviceId:', serviceId, 'params:', { page, limit });

            const response = await apiClient.get(`/services/${serviceId}/slots`, {
                params: { page, limit },
                timeout: 30000
            });

            console.log('[getSlotsByServiceId] Response:', response.data);

            // Transform pagination from API format to expected format
            const pagination = response.data.pagination || {};
            return {
                data: response.data.data || [],
                pagination: {
                    total_items_count: pagination.total_items_count || 0,
                    page_size: pagination.page_size || limit,
                    total_pages_count: pagination.total_pages_count || 0,
                    page_index: pagination.page_index !== undefined ? pagination.page_index : page,
                    has_next: pagination.has_next || false,
                    has_previous: pagination.has_previous || false
                }
            };
        } catch (error) {
            console.error('[getSlotsByServiceId] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể tải danh sách ca');
        }
    },

    /**
     * Create a new service
     * @param {Object} serviceData - { name, description, duration_minutes, base_price, image_url, thumbnails, task_id }
     * @returns {Promise<Object>}
     */
    async createService(serviceData) {
        try {
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

            if (serviceData.base_price === undefined || serviceData.base_price === null || serviceData.base_price <= 0) {
                throw new Error('Giá cơ bản phải lớn hơn 0');
            }

            // Ensure base_price is a number
            const basePrice = typeof serviceData.base_price === 'number'
                ? serviceData.base_price
                : parseFloat(serviceData.base_price);

            // Ensure duration_minutes is a number
            const durationMinutes = typeof serviceData.duration_minutes === 'number'
                ? serviceData.duration_minutes
                : parseInt(serviceData.duration_minutes);

            // Process image_url - must be string or null
            let imageUrl = null;
            if (serviceData.image_url && typeof serviceData.image_url === 'string' && serviceData.image_url.trim()) {
                imageUrl = serviceData.image_url.trim();
            }

            // Process thumbnails - must be array of strings
            let thumbnailsArray = [];
            if (serviceData.thumbnails && Array.isArray(serviceData.thumbnails)) {
                thumbnailsArray = serviceData.thumbnails
                    .filter(url => url && typeof url === 'string' && url.trim())
                    .map(url => url.trim());
            }

            // Process task_id - must be valid UUID string
            if (!serviceData.task_id || typeof serviceData.task_id !== 'string') {
                throw new Error('Task ID là bắt buộc và phải là UUID hợp lệ');
            }

            const payload = {
                name: serviceData.name.trim(),
                description: serviceData.description.trim(),
                duration_minutes: durationMinutes,
                base_price: basePrice,
                image_url: imageUrl,
                thumbnails: thumbnailsArray,
                task_id: serviceData.task_id
            };

            console.log('[createService] Request payload:', payload);

            const response = await apiClient.post('/services', payload, {
                timeout: 30000
            });

            console.log('[createService] Response:', response.data);

            return response.data;
        } catch (error) {
            console.error('[createService] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể tạo dịch vụ');
        }
    },

    /**
     * Update a service
     * @param {string} serviceId
     * @param {Object} updates - { name, description, duration_minutes, base_price, image_url, thumbnails, task_id, is_active }
     * @returns {Promise<Object>}
     */
    async updateService(serviceId, updates) {
        try {
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

            const payload = {};
            if (updates.name !== undefined) payload.name = updates.name.trim();
            if (updates.description !== undefined) payload.description = updates.description.trim();
            if (updates.duration_minutes !== undefined) payload.duration_minutes = updates.duration_minutes;
            if (updates.base_price !== undefined) payload.base_price = updates.base_price;
            if (updates.image_url !== undefined) payload.image_url = updates.image_url;
            if (updates.thumbnails !== undefined) payload.thumbnails = updates.thumbnails;
            if (updates.task_id !== undefined) payload.task_id = updates.task_id;
            if (updates.is_active !== undefined) payload.is_active = updates.is_active;

            console.log('[updateService] Request serviceId:', serviceId, 'payload:', payload);

            const response = await apiClient.put(`/services/${serviceId}`, payload, {
                timeout: 30000
            });

            console.log('[updateService] Response:', response.data);

            return response.data;
        } catch (error) {
            console.error('[updateService] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể cập nhật dịch vụ');
        }
    },

    /**
     * Delete a service
     * @param {string} serviceId
     * @returns {Promise<Object>}
     */
    async deleteService(serviceId) {
        try {
            console.log('[deleteService] Request serviceId:', serviceId);

            const response = await apiClient.delete(`/services/${serviceId}`, {
                timeout: 30000
            });

            console.log('[deleteService] Response:', response.data);

            return {
                success: true,
                message: 'Xóa dịch vụ thành công'
            };
        } catch (error) {
            console.error('[deleteService] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể xóa dịch vụ');
        }
    },

    /**
     * Get feedbacks of a service
     * @param {string} serviceId
     * @param {Object} params - { page, limit }
     * @returns {Promise<Object>} { data, pagination }
     */
    async getFeedbacksByServiceId(serviceId, params = {}) {
        try {
            const {
                page = 0,
                limit = 10
            } = params;

            console.log('[getFeedbacksByServiceId] Request serviceId:', serviceId, 'params:', { page, limit });

            const response = await apiClient.get(`/services/${serviceId}/feedbacks`, {
                params: { page, limit },
                timeout: 30000
            });

            console.log('[getFeedbacksByServiceId] Response:', response.data);

            // Transform pagination from API format to expected format
            const pagination = response.data.pagination || {};
            return {
                data: response.data.data || [],
                pagination: {
                    total_items_count: pagination.total_items_count || 0,
                    page_size: pagination.page_size || limit,
                    total_pages_count: pagination.total_pages_count || 0,
                    page_index: pagination.page_index !== undefined ? pagination.page_index : page,
                    has_next: pagination.has_next || false,
                    has_previous: pagination.has_previous || false
                }
            };
        } catch (error) {
            console.error('[getFeedbacksByServiceId] Error:', error);
            throw new Error(error.response?.data?.error || error.message || 'Không thể tải danh sách phản hồi');
        }
    }
};

export default serviceApi;
