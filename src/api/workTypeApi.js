import apiClient from '../config/config';

/**
 * Get all work types from official API
 * @returns {Promise<Object>} { success, data }
 */
export const getWorkTypes = async () => {
    try {
        const response = await apiClient.get('/work-types', { timeout: 10000 });

        let data = [];
        if (response.data) {
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data.data)) {
                data = response.data.data;
            } else {
                data = response.data;
            }
    }

    return {
        success: true,
            data
    };
    } catch (error) {
        console.error('Failed to fetch work types from API:', error);
        throw error;
    }
};

/**
 * Get work type by ID from official API
 * @param {string} id - Work type ID
 * @returns {Promise<Object>} { success, data }
 */
export const getWorkTypeById = async (id) => {
    try {
        const response = await apiClient.get(`/work-types/${id}`, { timeout: 10000 });

        if (!response.data) {
        throw new Error('Không tìm thấy loại công việc');
    }

    return {
        success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Failed to fetch work type from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại công việc');
        }
        throw error;
    }
};

/**
 * Create new work type using official API
 * @param {Object} workTypeData - { name: string, description: string }
 * @returns {Promise<Object>} { success, data, message }
 */
export const createWorkType = async (workTypeData) => {
    try {
        const name = workTypeData.name?.trim();
        const description = workTypeData.description?.trim();

        if (!name) {
            throw new Error('Tên loại công việc là bắt buộc');
        }
        if (!description) {
            throw new Error('Mô tả là bắt buộc');
        }

        const response = await apiClient.post('/work-types', {
            name,
            description
        }, { timeout: 10000 });

    return {
        success: true,
            data: response.data,
        message: 'Tạo loại công việc thành công'
    };
    } catch (error) {
        console.error('Failed to create work type:', error);
        throw error;
    }
};

/**
 * Update work type using official API
 * @param {string} id - Work type ID
 * @param {Object} workTypeData - { name?: string, description?: string, is_active?: boolean }
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateWorkType = async (id, workTypeData) => {
    try {
        const requestData = {};
        if (workTypeData.name !== undefined) {
            requestData.name = workTypeData.name.trim();
        }
        if (workTypeData.description !== undefined) {
            requestData.description = workTypeData.description.trim();
        }
        if (workTypeData.is_active !== undefined) {
            requestData.is_active = workTypeData.is_active;
        }

        const response = await apiClient.put(`/work-types/${id}`, requestData, { timeout: 10000 });

    return {
        success: true,
            data: response.data,
        message: 'Cập nhật loại công việc thành công'
    };
    } catch (error) {
        console.error('Failed to update work type:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại công việc');
        }
        throw error;
    }
};

/**
 * Delete work type using official API
 * @param {string} id - Work type ID
 * @returns {Promise<Object>} { success, message }
 */
export const deleteWorkType = async (id) => {
    try {
        await apiClient.delete(`/work-types/${id}`, { timeout: 10000 });

    return {
        success: true,
        message: 'Xóa loại công việc thành công'
    };
    } catch (error) {
        console.error('Failed to delete work type:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại công việc');
        }
        throw error;
    }
};

export default {
    getWorkTypes,
    getWorkTypeById,
    createWorkType,
    updateWorkType,
    deleteWorkType
};
