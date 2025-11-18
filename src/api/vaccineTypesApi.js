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
 * Get all vaccine types from official API
 * @param {Object} params - { page_index, page_size, species_id }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllVaccineTypes = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        species_id = null
    } = params;

    try {
        const queryParams = {};
        if (species_id) {
            queryParams.species_id = species_id;
        }

        const response = await apiClient.get('/vaccine-types', {
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
        console.error('Failed to fetch vaccine types from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get vaccine type by ID from official API
 * @param {string} vaccineTypeId
 * @returns {Promise<Object>} Vaccine type object
 */
export const getVaccineTypeById = async (vaccineTypeId) => {
    try {
        const response = await apiClient.get(`/vaccine-types/${vaccineTypeId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy loại vaccine');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch vaccine type from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại vaccine');
        }
        throw error;
    }
};

/**
 * Create new vaccine type using official API
 * @param {Object} vaccineData - { name, description, species_id, interval_months, is_required }
 * @returns {Promise<Object>} Created vaccine type
 */
export const createVaccineType = async (vaccineData) => {
    try {
        const { name, description, species_id, interval_months, is_required } = vaccineData;
        const trimmedName = name?.trim();
        const trimmedDescription = description?.trim() || '';
        const parsedInterval = parseInt(interval_months) || 0;
        const required = is_required !== undefined ? is_required : true;

        if (!trimmedName) {
            throw new Error('Tên vaccine là bắt buộc');
        }
        if (!species_id) {
            throw new Error('Loài thú cưng là bắt buộc');
        }
        if (parsedInterval <= 0) {
            throw new Error('Chu kỳ tiêm lại phải lớn hơn 0');
        }

        const response = await apiClient.post('/vaccine-types', {
            name: trimmedName,
            description: trimmedDescription,
            species_id,
            interval_months: parsedInterval,
            is_required: required
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo loại vaccine thành công'
        };
    } catch (error) {
        console.error('Failed to create vaccine type:', error);
        throw error;
    }
};

/**
 * Update vaccine type using official API
 * @param {string} vaccineTypeId
 * @param {Object} vaccineData - { name?, description?, species_id?, interval_months?, is_required? }
 * @returns {Promise<Object>} Updated vaccine type
 */
export const updateVaccineType = async (vaccineTypeId, vaccineData) => {
    try {
        const requestData = {};

        if (vaccineData.name !== undefined) {
            const name = vaccineData.name.trim();
            if (!name) {
                throw new Error('Tên vaccine không được rỗng');
            }
            requestData.name = name;
        }

        if (vaccineData.description !== undefined) {
            requestData.description = vaccineData.description.trim() || '';
        }

        if (vaccineData.species_id !== undefined) {
            if (!vaccineData.species_id) {
                throw new Error('Loài thú cưng là bắt buộc');
            }
            requestData.species_id = vaccineData.species_id;
        }

        if (vaccineData.interval_months !== undefined) {
            const interval_months = parseInt(vaccineData.interval_months) || 0;
            if (interval_months <= 0) {
                throw new Error('Chu kỳ tiêm lại phải lớn hơn 0');
            }
            requestData.interval_months = interval_months;
        }

        if (vaccineData.is_required !== undefined) {
            requestData.is_required = vaccineData.is_required;
        }

        const response = await apiClient.put(`/vaccine-types/${vaccineTypeId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật loại vaccine thành công'
        };
    } catch (error) {
        console.error('Failed to update vaccine type:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại vaccine');
        }
        throw error;
    }
};

/**
 * Delete vaccine type using official API
 * @param {string} vaccineTypeId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteVaccineType = async (vaccineTypeId) => {
    try {
        await apiClient.delete(`/vaccine-types/${vaccineTypeId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa loại vaccine thành công'
        };
    } catch (error) {
        console.error('Failed to delete vaccine type:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy loại vaccine');
        }
        throw error;
    }
};

export default {
    getAllVaccineTypes,
    getVaccineTypeById,
    createVaccineType,
    updateVaccineType,
    deleteVaccineType
};