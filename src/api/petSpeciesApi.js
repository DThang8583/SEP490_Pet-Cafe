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
 * @param {Object} params - { page_index, page_size, is_active, page, limit }
 * Supports both old (page_index/page_size) and new (page/limit) styles.
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllSpecies = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        is_active = null,
        // New explicit pagination params used by API (page, limit)
        page,
        limit
    } = params;

    try {
        const queryParams = {};
        if (is_active !== null) {
            queryParams.is_active = is_active;
        }

        // Resolve pagination parameters
        const resolvedPage =
            page !== undefined && page !== null
                ? page
                : page_index !== undefined && page_index !== null
                    ? page_index
                    : 0;

        const resolvedLimit =
            limit !== undefined && limit !== null
                ? limit
                : page_size !== undefined && page_size !== null
                    ? page_size
                    : 10;

        // Attach page & limit expected by BE
        queryParams.page = resolvedPage;
        queryParams.limit = resolvedLimit;

        const response = await apiClient.get('/pet-species', {
            params: queryParams,
            timeout: 10000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            const data = responseData.data;
            const apiPagination = responseData.pagination || {};

            // Support both { page, limit } and { page_index, page_size }
            const apiPage =
                apiPagination.page !== undefined
                    ? apiPagination.page
                    : apiPagination.page_index !== undefined
                        ? apiPagination.page_index
                        : resolvedPage;

            const apiPageSize =
                apiPagination.limit !== undefined
                    ? apiPagination.limit
                    : apiPagination.page_size !== undefined
                        ? apiPagination.page_size
                        : resolvedLimit;

            const totalItems =
                apiPagination.total_items_count !== undefined
                    ? apiPagination.total_items_count
                    : data.length;

            const totalPages =
                apiPagination.total_pages_count !== undefined
                    ? apiPagination.total_pages_count
                    : apiPageSize > 0
                        ? Math.ceil(totalItems / apiPageSize)
                        : 0;

            return {
                data,
                pagination: {
                    total_items_count: totalItems,
                    page_size: apiPageSize,
                    total_pages_count: totalPages,
                    page_index: apiPage,
                    has_next:
                        apiPagination.has_next !== undefined
                            ? apiPagination.has_next
                            : apiPage < totalPages - 1,
                    has_previous:
                        apiPagination.has_previous !== undefined
                            ? apiPagination.has_previous
                            : apiPage > 0
                }
            };
        }

        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: createPagination(responseData.length, resolvedLimit, resolvedPage)
            };
        }

        return {
            data: [],
            pagination: createPagination(0, resolvedLimit, resolvedPage)
        };
    } catch (error) {
        console.error('Failed to fetch species from API:', error);
        return {
            data: [],
            pagination: createPagination(0, limit || page_size, page || page_index)
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