import apiClient from '../config/config';

// Weekday constants
export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const WEEKDAY_LABELS = {
    MONDAY: 'Thứ 2',
    TUESDAY: 'Thứ 3',
    WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5',
    FRIDAY: 'Thứ 6',
    SATURDAY: 'Thứ 7',
    SUNDAY: 'Chủ nhật'
};

/**
 * Create pagination object
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Page size
 * @param {number} pageIndex - Page index
 * @returns {Object} Pagination object
 */
const createPagination = (totalItems, pageSize, pageIndex) => ({
    total_items_count: totalItems,
    page_size: pageSize,
    total_pages_count: Math.ceil(totalItems / pageSize) || 0,
    page_index: pageIndex,
    has_next: (pageIndex + 1) * pageSize < totalItems,
    has_previous: pageIndex > 0
});

/**
 * Get all work shifts from official API
 * @param {Object} params - { page_index, page_size }
 * @returns {Promise<Object>} { success, data, pagination }
 */
export const getWorkShifts = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10
    } = params;

    try {
        const response = await apiClient.get('/work-shifts', {
            params: {
                page: page_index, // API uses 'page' (0-based), not 'page_index'
                limit: page_size, // API uses 'limit' instead of 'page_size'
                _t: Date.now()
            },
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                success: true,
                data: responseData.data,
                pagination: responseData.pagination || createPagination(
                    responseData.data.length,
                    page_size,
                    page_index
                )
            };
        }

        if (Array.isArray(responseData)) {
            return {
                success: true,
                data: responseData,
                pagination: createPagination(responseData.length, page_size, page_index)
            };
        }

        return {
            success: true,
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    } catch (error) {
        return {
            success: false,
            data: [],
            pagination: createPagination(0, page_size, page_index),
            message: error.response?.data?.message || error.message || 'Không thể tải danh sách ca làm việc'
        };
    }
};

/**
 * Get work shift by ID from official API
 * @param {string} id - Work shift ID
 * @returns {Promise<Object>} { success, data }
 */
export const getWorkShiftById = async (id) => {
    try {
        const response = await apiClient.get(`/work-shifts/${id}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy ca làm việc');
        }
        throw error;
    }
};

/**
 * Create new work shift
 * @param {Object} shiftData - { name, start_time, end_time, description, applicable_days[] }
 * @returns {Promise<Object>} { success, data, message }
 */
export const createWorkShift = async (shiftData) => {
    try {
        // Validation
        if (!shiftData.name?.trim()) {
            throw new Error('Tên ca làm việc là bắt buộc');
        }
        if (!shiftData.start_time?.trim()) {
            throw new Error('Giờ bắt đầu là bắt buộc');
        }
        if (!shiftData.end_time?.trim()) {
            throw new Error('Giờ kết thúc là bắt buộc');
        }
        if (shiftData.start_time >= shiftData.end_time) {
            throw new Error('Giờ kết thúc phải sau giờ bắt đầu');
        }
        if (!shiftData.applicable_days || !Array.isArray(shiftData.applicable_days) || shiftData.applicable_days.length === 0) {
            throw new Error('Vui lòng chọn ít nhất một ngày áp dụng');
        }

        const response = await apiClient.post('/work-shifts', {
            name: shiftData.name.trim(),
            start_time: shiftData.start_time.trim(),
            end_time: shiftData.end_time.trim(),
            description: shiftData.description?.trim() || '',
            applicable_days: shiftData.applicable_days
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo ca làm việc thành công'
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Update work shift
 * @param {string} id - Work shift ID
 * @param {Object} shiftData - { name, start_time, end_time, description, applicable_days[] }
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateWorkShift = async (id, shiftData) => {
    try {
        // Validation
        if (shiftData.name !== undefined && !shiftData.name?.trim()) {
            throw new Error('Tên ca làm việc không được rỗng');
        }
        if (shiftData.start_time && shiftData.end_time && shiftData.start_time >= shiftData.end_time) {
            throw new Error('Giờ kết thúc phải sau giờ bắt đầu');
        }
        if (shiftData.applicable_days && (!Array.isArray(shiftData.applicable_days) || shiftData.applicable_days.length === 0)) {
            throw new Error('Vui lòng chọn ít nhất một ngày áp dụng');
        }

        // API requires all fields for PUT request
        const requestData = {
            name: shiftData.name?.trim() || '',
            start_time: shiftData.start_time?.trim() || '',
            end_time: shiftData.end_time?.trim() || '',
            description: shiftData.description?.trim() || '',
            applicable_days: Array.isArray(shiftData.applicable_days) ? shiftData.applicable_days : []
        };

        // Validate required fields
        if (!requestData.name) {
            throw new Error('Tên ca làm việc là bắt buộc');
        }
        if (!requestData.start_time) {
            throw new Error('Giờ bắt đầu là bắt buộc');
        }
        if (!requestData.end_time) {
            throw new Error('Giờ kết thúc là bắt buộc');
        }
        if (requestData.applicable_days.length === 0) {
            throw new Error('Vui lòng chọn ít nhất một ngày áp dụng');
        }

        const response = await apiClient.put(`/work-shifts/${id}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật ca làm việc thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Delete work shift
 * @param {string} id - Work shift ID (UUID)
 * @returns {Promise<Object>} { success, message }
 */
export const deleteWorkShift = async (id) => {
    try {
        if (!id) {
            throw new Error('ID ca làm việc là bắt buộc');
        }

        await apiClient.delete(`/work-shifts/${id}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa ca làm việc thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

export default {
    getWorkShifts,
    getWorkShiftById,
    createWorkShift,
    updateWorkShift,
    deleteWorkShift,
    WEEKDAYS,
    WEEKDAY_LABELS
};
