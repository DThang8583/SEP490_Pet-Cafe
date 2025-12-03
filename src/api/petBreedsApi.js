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
 * Get all pet breeds from official API
 * @param {Object} params - { page_index, page_size, species_id, page, limit }
 * Supports both old (page_index/page_size) and new (page/limit) styles.
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllBreeds = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        species_id = null,
        // New explicit pagination params used by API (page, limit)
        page,
        limit
    } = params;

    try {
        const queryParams = {};
        if (species_id) {
            queryParams.species_id = species_id;
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

        const response = await apiClient.get('/pet-breeds', {
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
        console.error('Failed to fetch breeds from API:', error);
        return {
            data: [],
            pagination: createPagination(0, limit || page_size, page || page_index)
        };
    }
};

/**
 * Get breed by ID from official API
 * @param {string} breedId
 * @returns {Promise<Object>} Breed object
 */
export const getBreedById = async (breedId) => {
    try {
        const response = await apiClient.get(`/pet-breeds/${breedId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy giống');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch breed from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy giống');
        }
        throw error;
    }
};

/**
 * Create new pet breed using official API
 * @param {Object} breedData - { name, species_id, description, average_weight, average_lifespan }
 * @returns {Promise<Object>} Created breed
 */
export const createBreed = async (breedData) => {
    try {
        const name = breedData.name?.trim();
        const species_id = breedData.species_id;
        const description = breedData.description?.trim() || '';
        const average_weight = parseFloat(breedData.average_weight) || 0;
        const average_lifespan = parseInt(breedData.average_lifespan, 10) || 0;

        if (!name) {
            throw new Error('Tên giống là bắt buộc');
        }
        if (!species_id) {
            throw new Error('Loài là bắt buộc');
        }

        const response = await apiClient.post('/pet-breeds', {
            name,
            species_id,
            description,
            average_weight,
            average_lifespan
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo giống thành công'
        };
    } catch (error) {
        console.error('Failed to create breed:', error);
        throw error;
    }
};

/**
 * Update pet breed using official API
 * @param {string} breedId
 * @param {Object} breedData - { name?, species_id?, description?, average_weight?, average_lifespan? }
 * @returns {Promise<Object>} Updated breed
 */
export const updateBreed = async (breedId, breedData) => {
    try {
        const requestData = {};

        if (breedData.name !== undefined) {
            const name = breedData.name.trim();
            if (!name) {
                throw new Error('Tên giống không được rỗng');
            }
            requestData.name = name;
        }

        if (breedData.species_id !== undefined) {
            if (!breedData.species_id) {
                throw new Error('Loài là bắt buộc');
            }
            requestData.species_id = breedData.species_id;
        }

        if (breedData.description !== undefined) {
            requestData.description = breedData.description.trim();
        }

        if (breedData.average_weight !== undefined) {
            requestData.average_weight = parseFloat(breedData.average_weight) || 0;
        }

        if (breedData.average_lifespan !== undefined) {
            requestData.average_lifespan = parseInt(breedData.average_lifespan, 10) || 0;
        }

        const response = await apiClient.put(`/pet-breeds/${breedId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật giống thành công'
        };
    } catch (error) {
        console.error('Failed to update breed:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy giống');
        }
        throw error;
    }
};

/**
 * Delete pet breed using official API
 * @param {string} breedId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteBreed = async (breedId) => {
    try {
        await apiClient.delete(`/pet-breeds/${breedId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa giống thành công'
        };
    } catch (error) {
        console.error('Failed to delete breed:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy giống');
        }
        throw error;
    }
};

export default {
    getAllBreeds,
    getBreedById,
    createBreed,
    updateBreed,
    deleteBreed
};