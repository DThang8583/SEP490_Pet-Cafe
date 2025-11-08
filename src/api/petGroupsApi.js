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
 * Get all pet groups from official API
 * @param {Object} params - { page_index, page_size, pet_species_id }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllGroups = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        pet_species_id = null
    } = params;

    try {
        const queryParams = {};
        if (pet_species_id) {
            queryParams.pet_species_id = pet_species_id;
        }

        const response = await apiClient.get('/pet-groups', {
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
        console.error('Failed to fetch groups from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get group by ID from official API
 * @param {string} groupId
 * @returns {Promise<Object>} Group object
 */
export const getGroupById = async (groupId) => {
    try {
        const response = await apiClient.get(`/pet-groups/${groupId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy nhóm');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch group from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }
        throw error;
    }
};

/**
 * Create new pet group using official API
 * @param {Object} groupData - { name, description, pet_species_id, pet_breed_id }
 * @returns {Promise<Object>} Created group
 */
export const createGroup = async (groupData) => {
    try {
        const name = groupData.name?.trim();
        const description = groupData.description?.trim() || '';
        const pet_species_id = groupData.pet_species_id;
        const pet_breed_id = groupData.pet_breed_id || null;

        if (!name) {
            throw new Error('Tên nhóm là bắt buộc');
        }
        if (!pet_species_id) {
            throw new Error('Loài là bắt buộc');
        }

        const response = await apiClient.post('/pet-groups', {
            name,
            description,
            pet_species_id,
            pet_breed_id
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo nhóm thành công'
        };
    } catch (error) {
        console.error('Failed to create group:', error);
        throw error;
    }
};

/**
 * Update pet group using official API
 * @param {string} groupId
 * @param {Object} groupData - { name?, description?, pet_species_id?, pet_breed_id? }
 * @returns {Promise<Object>} Updated group
 */
export const updateGroup = async (groupId, groupData) => {
    try {
        const requestData = {};

        if (groupData.name !== undefined) {
            const name = groupData.name.trim();
            if (!name) {
                throw new Error('Tên nhóm không được rỗng');
            }
            requestData.name = name;
        }

        if (groupData.description !== undefined) {
            requestData.description = groupData.description.trim();
        }

        if (groupData.pet_species_id !== undefined) {
            if (!groupData.pet_species_id) {
                throw new Error('Loài là bắt buộc');
            }
            requestData.pet_species_id = groupData.pet_species_id;
        }

        if (groupData.pet_breed_id !== undefined) {
            requestData.pet_breed_id = groupData.pet_breed_id || null;
        }

        const response = await apiClient.put(`/pet-groups/${groupId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật nhóm thành công'
        };
    } catch (error) {
        console.error('Failed to update group:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }
        throw error;
    }
};

/**
 * Delete pet group using official API
 * @param {string} groupId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteGroup = async (groupId) => {
    try {
        await apiClient.delete(`/pet-groups/${groupId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa nhóm thành công'
        };
    } catch (error) {
        console.error('Failed to delete group:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }
        throw error;
    }
};

export default {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup
};