import apiClient from '../config/config';

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
 * Get all pet species from official API
 * @param {Object} params - { page_index, page_size, is_active }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllSpecies = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        is_active = null
    } = params;

    try {
        const queryParams = {};
        if (is_active !== null) {
            queryParams.is_active = is_active;
        }

        const response = await apiClient.get('/pet-species', {
            params: queryParams,
            timeout: 10000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
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
                data: responseData,
                pagination: createPagination(responseData.length, page_size, page_index)
            };
        }

        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    } catch (error) {
        console.error('Failed to fetch species from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get species by ID from official API
 * @param {string} speciesId
 * @returns {Promise<Object>} Species object
 */
export const getSpeciesById = async (speciesId) => {
    try {
        const response = await apiClient.get(`/pet-species/${speciesId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy loài');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch species from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loài');
        }
        throw error;
    }
};

/**
 * Create new pet species using official API
 * @param {Object} speciesData - { name, description }
 * @returns {Promise<Object>} Created species
 */
export const createSpecies = async (speciesData) => {
    try {
        const name = speciesData.name?.trim();
        const description = speciesData.description?.trim() || '';

        if (!name) {
            throw new Error('Tên loài là bắt buộc');
        }

        const response = await apiClient.post('/pet-species', {
            name,
            description
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo loài thành công'
        };
    } catch (error) {
        console.error('Failed to create species:', error);
        throw error;
    }
};

/**
 * Update pet species using official API
 * @param {string} speciesId
 * @param {Object} speciesData - { name?, description?, is_active? }
 * @returns {Promise<Object>} Updated species
 */
export const updateSpecies = async (speciesId, speciesData) => {
    try {
        const requestData = {};

        if (speciesData.name !== undefined) {
            const name = speciesData.name.trim();
            if (!name) {
                throw new Error('Tên loài không được rỗng');
            }
            requestData.name = name;
        }

        if (speciesData.description !== undefined) {
            requestData.description = speciesData.description.trim();
        }

        if (speciesData.is_active !== undefined) {
            requestData.is_active = speciesData.is_active;
        }

        const response = await apiClient.put(`/pet-species/${speciesId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật loài thành công'
        };
    } catch (error) {
        console.error('Failed to update species:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loài');
        }
        throw error;
    }
};

/**
 * Delete pet species using official API
 * @param {string} speciesId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteSpecies = async (speciesId) => {
    try {
        await apiClient.delete(`/pet-species/${speciesId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa loài thành công'
        };
    } catch (error) {
        console.error('Failed to delete species:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loài');
        }
        throw error;
    }
};

/**
 * Toggle species active status using official API
 * @param {string} speciesId
 * @param {boolean} disable - Optional: if true, disable; if false, enable. If not provided, toggles current status
 * @returns {Promise<Object>} Updated species
 */
export const toggleSpeciesStatus = async (speciesId, disable = null) => {
    try {
        const currentSpecies = await getSpeciesById(speciesId);

        const newStatus = disable !== null ? !disable : !currentSpecies.is_active;

        const updatedSpecies = await updateSpecies(speciesId, {
            name: currentSpecies.name,
            description: currentSpecies.description,
            is_active: newStatus
        });

        return updatedSpecies;
    } catch (error) {
        console.error('Failed to toggle species status:', error);
        throw error;
    }
};

export default {
    getAllSpecies,
    getSpeciesById,
    createSpecies,
    updateSpecies,
    deleteSpecies,
    toggleSpeciesStatus
};