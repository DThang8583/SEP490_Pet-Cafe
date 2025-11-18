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
 * Get all pets from official API
 * @param {Object} params - { page_index, page_size, species_id, breed_id, group_id, is_active }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllPets = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        species_id = null,
        breed_id = null,
        group_id = null,
        is_active = null
    } = params;

    try {
        const queryParams = {};
        if (species_id) {
            queryParams.species_id = species_id;
        }
        if (breed_id) {
            queryParams.breed_id = breed_id;
        }
        if (group_id) {
            queryParams.group_id = group_id;
        }
        if (is_active !== null) {
            queryParams.is_active = is_active;
        }

        const response = await apiClient.get('/pets', {
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
        console.error('Failed to fetch pets from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get pet by ID from official API
 * @param {string} petId
 * @returns {Promise<Object>} Pet object
 */
export const getPetById = async (petId) => {
    try {
        const response = await apiClient.get(`/pets/${petId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy thú cưng');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch pet from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thú cưng');
        }
        throw error;
    }
};

/**
 * Create new pet using official API
 * @param {Object} petData - { name, age, species_id, breed_id, color, weight, preferences, special_notes, image_url, arrival_date, gender, health_status }
 * @returns {Promise<Object>} Created pet
 */
export const createPet = async (petData) => {
    try {
        const name = petData.name?.trim();
        const age = parseInt(petData.age) || 0;
        const species_id = petData.species_id;
        const breed_id = petData.breed_id || null;
        const color = petData.color?.trim() || '';
        const weight = parseFloat(petData.weight) || 0;
        const preferences = petData.preferences?.trim() || '';
        const special_notes = petData.special_notes?.trim() || '';
        const image_url = petData.image_url?.trim() || '';
        const arrival_date = petData.arrival_date;
        const gender = petData.gender || '';
        const health_status = petData.health_status || 'HEALTHY';

        if (!name) {
            throw new Error('Tên thú cưng là bắt buộc');
        }
        if (!species_id) {
            throw new Error('Loài là bắt buộc');
        }
        if (!gender) {
            throw new Error('Giới tính là bắt buộc');
        }

        const response = await apiClient.post('/pets', {
            name,
            age,
            species_id,
            breed_id,
            color,
            weight,
            preferences,
            special_notes,
            image_url,
            arrival_date,
            gender,
            health_status
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo thú cưng thành công'
        };
    } catch (error) {
        console.error('Failed to create pet:', error);
        throw error;
    }
};

/**
 * Update pet using official API
 * @param {string} petId
 * @param {Object} petData - { name?, age?, species_id?, breed_id?, color?, weight?, preferences?, special_notes?, image_url?, arrival_date?, gender?, health_status?, group_id? }
 * @returns {Promise<Object>} Updated pet
 */
export const updatePet = async (petId, petData) => {
    try {
        const requestData = {};

        if (petData.name !== undefined) {
            const name = petData.name.trim();
            if (!name) {
                throw new Error('Tên thú cưng không được rỗng');
            }
            requestData.name = name;
        }

        if (petData.age !== undefined) {
            requestData.age = parseInt(petData.age) || 0;
        }

        if (petData.species_id !== undefined) {
            if (!petData.species_id) {
                throw new Error('Loài là bắt buộc');
            }
            requestData.species_id = petData.species_id;
        }

        if (petData.breed_id !== undefined) {
            requestData.breed_id = petData.breed_id || null;
        }

        if (petData.color !== undefined) {
            requestData.color = petData.color.trim() || '';
        }

        if (petData.weight !== undefined) {
            requestData.weight = parseFloat(petData.weight) || 0;
        }

        if (petData.preferences !== undefined) {
            requestData.preferences = petData.preferences.trim() || '';
        }

        if (petData.special_notes !== undefined) {
            requestData.special_notes = petData.special_notes.trim() || '';
        }

        if (petData.image_url !== undefined) {
            requestData.image_url = petData.image_url.trim() || '';
        }

        if (petData.arrival_date !== undefined) {
            requestData.arrival_date = petData.arrival_date;
        }

        if (petData.gender !== undefined) {
            if (!petData.gender) {
                throw new Error('Giới tính là bắt buộc');
            }
            requestData.gender = petData.gender;
        }

        if (petData.health_status !== undefined) {
            requestData.health_status = petData.health_status;
        }

        if (petData.group_id !== undefined) {
            requestData.group_id = petData.group_id || null;
        }

        const response = await apiClient.put(`/pets/${petId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật thú cưng thành công'
        };
    } catch (error) {
        console.error('Failed to update pet:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thú cưng');
        }
        throw error;
    }
};

/**
 * Delete pet using official API
 * @param {string} petId
 * @returns {Promise<Object>} { success, message }
 */
export const deletePet = async (petId) => {
    try {
        await apiClient.delete(`/pets/${petId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa thú cưng thành công'
        };
    } catch (error) {
        console.error('Failed to delete pet:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thú cưng');
        }
        throw error;
    }
};

/**
 * Get pet health records from official API
 * @param {string} petId
 * @param {Object} params - { page_index, page_size }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getPetHealthRecords = async (petId, params = {}) => {
    const {
        page_index = 0,
        page_size = 10
    } = params;

    try {
        const response = await apiClient.get(`/pets/${petId}/health-records`, {
            params: {},
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
        console.error('Failed to fetch pet health records from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thú cưng');
        }
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get pet vaccination records from official API
 * @param {string} petId
 * @param {Object} params - { page_index, page_size }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getPetVaccinationRecords = async (petId, params = {}) => {
    const {
        page_index = 0,
        page_size = 10
    } = params;

    try {
        const response = await apiClient.get(`/pets/${petId}/vaccination-records`, {
            params: {},
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
        console.error('Failed to fetch pet vaccination records from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy thú cưng');
        }
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get health status options from API
 * This function should fetch the available health status enum values from the API
 * @returns {Promise<Array>} Array of health status values: ['HEALTHY', 'SICK', 'RECOVERING', 'UNDER_OBSERVATION', 'QUARANTINE']
 */
export const getHealthStatusOptions = async () => {
    try {
        // Try to fetch from API endpoint if available
        // For now, return the values as specified by the user
        // TODO: Replace with actual API call when endpoint is available
        const response = await apiClient.get('/pets/health-status-options', { timeout: 10000 });

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        // Fallback: return the known values if API doesn't return them
        // This should be removed once the API endpoint is confirmed
        return ['HEALTHY', 'SICK', 'RECOVERING', 'UNDER_OBSERVATION', 'QUARANTINE'];
    } catch (error) {
        console.warn('Failed to fetch health status options from API, using default values:', error);
        // Return the known values as fallback
        return ['HEALTHY', 'SICK', 'RECOVERING', 'UNDER_OBSERVATION', 'QUARANTINE'];
    }
};

export default {
    getAllPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
    getPetHealthRecords,
    getPetVaccinationRecords,
    getHealthStatusOptions
};