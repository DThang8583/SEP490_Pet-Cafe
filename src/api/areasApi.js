import apiClient from '../config/config';
import { uploadFile } from './fileApi';

/**
 * Get all areas with pagination from official API
 * @param {Object} params - { page_index, page_size, search, is_active, work_type_id }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllAreas = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        search = '',
        is_active = null,
        work_type_id = null,
        // New explicit pagination params (API uses `page` & `limit`)
        page,
        limit
    } = params;

    try {
        // Build query parameters for API
        const queryParams = {};

        // Map pagination: our old API wrapper used page_index/page_size.
        // The official API uses `page` (1-based) and `limit`.
        // Support both styles to avoid breaking existing callers.
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

        // Attach pagination params expected by BE
        queryParams.page = resolvedPage;
        queryParams.limit = resolvedLimit;

        // Map is_active to IsActive (API parameter name)
        if (is_active !== null) {
            queryParams.IsActive = is_active;
        }

        // Map work_type_id to WorkTypeId (API parameter name)
        if (work_type_id) {
            queryParams.WorkTypeId = work_type_id;
        }

        // Use timeout for areas API (30 seconds to handle slow API responses)
        const response = await apiClient.get('/areas', {
            params: queryParams,
            timeout: 30000 // 30 seconds timeout
        });

        // Handle API response structure: { data: [...], pagination: {...} }
        const responseData = response.data;

        if (responseData?.data && Array.isArray(responseData.data)) {
            let resultData = responseData.data;

            // Apply client-side search filter if search term provided
            // (API might not support search, so we filter on client side)
            if (search) {
                const searchLower = search.toLowerCase();
                resultData = resultData.filter(area =>
                    area.name?.toLowerCase().includes(searchLower) ||
                    area.description?.toLowerCase().includes(searchLower) ||
                    area.location?.toLowerCase().includes(searchLower)
                );
            }

            // Map API pagination format to our format.
            // Support both { page, limit } and { page_index, page_size } shapes.
            const apiPagination = responseData.pagination || {};
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
                    : resultData.length;

            const totalPages =
                apiPagination.total_pages_count !== undefined
                    ? apiPagination.total_pages_count
                    : apiPageSize > 0
                        ? Math.ceil(totalItems / apiPageSize)
                        : 1;

            return {
                data: resultData,
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

        // If response is directly an array (unlikely but handle it)
        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: {
                    total_items_count: responseData.length,
                    page_size: page_size,
                    total_pages_count: 1,
                    page_index: page_index,
                    has_next: false,
                    has_previous: false
                }
            };
        }

        // If response structure is different, return as-is
        return responseData;
    } catch (error) {
        console.error('Failed to fetch areas from API:', error);

        // Log error details for debugging
        if (error.code === 'ECONNABORTED') {
            console.warn('API request timed out after 30 seconds');
        } else if (error.message?.includes('canceled') || error.code === 'ERR_CANCELED') {
            console.warn('API request was canceled');
        }

        // Return empty data structure instead of mock data
        return {
            data: [],
            pagination: {
                total_items_count: 0,
                page_size: page_size,
                total_pages_count: 0,
                page_index: page_index,
                has_next: false,
                has_previous: false
            }
        };
    }
};

/**
 * Get area by ID from official API
 * @param {string} areaId
 * @returns {Promise<Object>} Area object
 */
export const getAreaById = async (areaId) => {
    try {
        const response = await apiClient.get(`/areas/${areaId}`, { timeout: 10000 });

        if (response.data) {
            return response.data;
        }

        throw new Error('Không tìm thấy khu vực');
    } catch (error) {
        console.error('Failed to fetch area from API:', error);
        throw error;
    }
};

/**
 * Get available work types for an area (work types NOT in the area) from official API
 * @param {string} areaId
 * @returns {Promise<Array>} List of available work types
 */
export const getAvailableWorkTypes = async (areaId) => {
    try {
        const response = await apiClient.get(`/areas/${areaId}/work-types`, { timeout: 10000 });

        // API returns list of work types not in the area
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        // If response structure is different, return as-is
        return response.data || [];
    } catch (error) {
        console.error('Failed to get available work types from API:', error);
        throw error;
    }
};

/**
 * Create new area using official API
 * @param {Object} areaData - { name, description, location, max_capacity, image_file, image_url, work_type_ids }
 * @returns {Promise<Object>} Created area
 */
export const createArea = async (areaData) => {
    try {
        // Validation
        if (!areaData.name || !areaData.name.trim()) {
            throw new Error('Tên khu vực là bắt buộc');
        }

        if (!areaData.description || !areaData.description.trim()) {
            throw new Error('Mô tả khu vực là bắt buộc');
        }

        if (!areaData.location || !areaData.location.trim()) {
            throw new Error('Vị trí là bắt buộc');
        }

        if (areaData.max_capacity === undefined || areaData.max_capacity < 0) {
            throw new Error('Sức chứa tối đa phải >= 0');
        }

        // Upload image file first if provided
        let imageUrl = areaData.image_url || null;
        if (areaData.image_file) {
            try {
                imageUrl = await uploadFile(areaData.image_file);
            } catch (error) {
                console.error('Failed to upload image:', error);
                throw new Error(`Không thể tải ảnh lên: ${error.message || 'Lỗi không xác định'}`);
            }
        }

        // Prepare request data (always use JSON, not FormData)
        const requestData = {
            name: areaData.name.trim(),
            description: areaData.description.trim(),
            location: areaData.location.trim(),
            max_capacity: parseInt(areaData.max_capacity),
            image_url: imageUrl,
            work_type_ids: areaData.work_type_ids && Array.isArray(areaData.work_type_ids) && areaData.work_type_ids.length > 0
                ? areaData.work_type_ids
                : []
        };

        // Call POST /api/areas endpoint with JSON body
        const response = await apiClient.post('/areas', requestData, { timeout: 30000 });

        return response.data;
    } catch (error) {
        console.error('Failed to create area:', error);
        throw error;
    }
};

/**
 * Update area using official API
 * @param {string} areaId
 * @param {Object} areaData - { name, description, location, max_capacity, image_file, image_url, work_type_ids, is_active }
 * @returns {Promise<Object>} Updated area
 */
export const updateArea = async (areaId, areaData) => {
    try {
        // Validation
        if (areaData.name !== undefined && !areaData.name.trim()) {
            throw new Error('Tên khu vực không được rỗng');
        }

        if (areaData.max_capacity !== undefined && areaData.max_capacity < 0) {
            throw new Error('Sức chứa tối đa phải >= 0');
        }

        // Upload image file first if provided
        let imageUrl = areaData.image_url;
        if (areaData.image_file) {
            try {
                imageUrl = await uploadFile(areaData.image_file);
            } catch (error) {
                console.error('Failed to upload image:', error);
                throw new Error(`Không thể tải ảnh lên: ${error.message || 'Lỗi không xác định'}`);
            }
        }

        // Prepare request data (always use JSON, not FormData)
        const requestData = {};
        if (areaData.name !== undefined) requestData.name = areaData.name.trim();
        if (areaData.description !== undefined) requestData.description = areaData.description.trim();
        if (areaData.location !== undefined) requestData.location = areaData.location.trim();
        if (areaData.max_capacity !== undefined) requestData.max_capacity = parseInt(areaData.max_capacity);
        if (areaData.is_active !== undefined) requestData.is_active = areaData.is_active;
        if (imageUrl !== undefined) requestData.image_url = imageUrl;

        // Handle work_type_ids if provided
        if (areaData.work_type_ids !== undefined) {
            requestData.work_type_ids = Array.isArray(areaData.work_type_ids) && areaData.work_type_ids.length > 0
                ? areaData.work_type_ids
                : [];
        }

        // Call PUT /api/areas/{id} endpoint with JSON body
        const response = await apiClient.put(`/areas/${areaId}`, requestData, { timeout: 30000 });

        // Handle different response structures
        let result = response.data;

        // If response.data has nested data property
        if (result && result.data && typeof result.data === 'object') {
            result = result.data;
        }

        // If result is an object with area data, return it
        if (result && typeof result === 'object') {
            return result;
        }

        // If response structure is different, return response.data or response
        return result || response.data || response;
    } catch (error) {
        console.error('Failed to update area:', error);
        throw error;
    }
};

/**
 * Toggle area active status using official API
 * @param {string} areaId
 * @returns {Promise<Object>} Updated area
 */
export const toggleAreaStatus = async (areaId) => {
    try {
        const currentArea = await getAreaById(areaId);

        // Use updateArea to toggle status with all fields preserved
        const updatedArea = await updateArea(areaId, {
            name: currentArea.name,
            description: currentArea.description,
            location: currentArea.location,
            max_capacity: currentArea.max_capacity,
            image_url: currentArea.image_url,
            is_active: !currentArea.is_active,
            work_type_ids: currentArea.area_work_types?.map(awt => awt.work_type_id) || []
        });

        return updatedArea;
    } catch (error) {
        console.error('Failed to toggle area status:', error);
        throw error;
    }
};

/**
 * Delete area using official API
 * @param {string} areaId
 * @returns {Promise<boolean>}
 */
export const deleteArea = async (areaId) => {
    try {
        await apiClient.delete(`/areas/${areaId}`, { timeout: 10000 });
        return true;
    } catch (error) {
        console.error('Failed to delete area:', error);
        throw error;
    }
};

/**
 * Add work type to area using official API
 * Note: This might need to use updateAreaWorkTypes or a specific endpoint
 * @param {string} areaId
 * @param {string} workTypeId
 * @param {string} description - Optional description for this relationship
 * @returns {Promise<Object>} Updated area
 */
export const addWorkTypeToArea = async (areaId, workTypeId, description = null) => {
    try {
        // Get current area to get existing work types
        const currentArea = await getAreaById(areaId);
        const currentWorkTypeIds = (currentArea.area_work_types || []).map(awt => awt.work_type_id);

        // Check if already assigned
        if (currentWorkTypeIds.includes(workTypeId)) {
            throw new Error('Loại công việc này đã được gán cho khu vực');
        }

        // Add new work type ID to the list
        const updatedWorkTypeIds = [...currentWorkTypeIds, workTypeId];

        // Use updateAreaWorkTypes to update
        return await updateAreaWorkTypes(areaId, updatedWorkTypeIds);
    } catch (error) {
        console.error('Failed to add work type to area:', error);
        throw error;
    }
};

/**
 * Remove work type from area using official API
 * @param {string} areaId
 * @param {string} areaWorkTypeId - The area_work_type ID to remove
 * @returns {Promise<Object>} Updated area
 */
export const removeWorkTypeFromArea = async (areaId, areaWorkTypeId) => {
    try {
        // Get current area to get existing work types
        const currentArea = await getAreaById(areaId);
        const currentWorkTypes = currentArea.area_work_types || [];

        // Find the work type ID from areaWorkTypeId
        const workTypeToRemove = currentWorkTypes.find(awt => awt.id === areaWorkTypeId);
        if (!workTypeToRemove) {
            throw new Error('Không tìm thấy loại công việc cần xóa');
        }

        // Remove the work type ID from the list
        const updatedWorkTypeIds = currentWorkTypes
            .filter(awt => awt.id !== areaWorkTypeId)
            .map(awt => awt.work_type_id);

        // Use updateAreaWorkTypes to update
        return await updateAreaWorkTypes(areaId, updatedWorkTypeIds);
    } catch (error) {
        console.error('Failed to remove work type from area:', error);
        throw error;
    }
};

/**
 * Update area work types (bulk update) using official API
 * @param {string} areaId
 * @param {Array<string>} workTypeIds - Array of work type IDs to assign
 * @returns {Promise<Object>} Updated area
 */
export const updateAreaWorkTypes = async (areaId, workTypeIds) => {
    try {
        const response = await apiClient.put(
            `/areas/${areaId}`,
            { work_type_ids: workTypeIds },
            { timeout: 10000 }
        );

        return response.data;
    } catch (error) {
        console.error('Failed to update area work types:', error);
        throw error;
    }
};

/**
 * Get statistics from official API
 * @returns {Promise<Object>}
 */
export const getAreasStatistics = async () => {
    try {
        const response = await getAllAreas({ page_size: 1000, page_index: 0 });
        const areas = response.data || [];

        const totalCapacity = areas.reduce((sum, a) => {
            const capacity = Number(a.max_capacity) || 0;
            return sum + capacity;
        }, 0);

        return {
            total: areas.length,
            active: areas.filter(a => a.is_active).length,
            inactive: areas.filter(a => !a.is_active).length,
            totalCapacity,
            averageCapacity: areas.length > 0 ? Math.round(totalCapacity / areas.length) : 0
        };
    } catch (error) {
        console.error('Failed to get areas statistics:', error);
        return {
            total: 0,
            active: 0,
            inactive: 0,
            totalCapacity: 0,
            averageCapacity: 0
        };
    }
};

export default {
    getAllAreas,
    getAreaById,
    getAvailableWorkTypes,
    createArea,
    updateArea,
    toggleAreaStatus,
    deleteArea,
    addWorkTypeToArea,
    removeWorkTypeFromArea,
    updateAreaWorkTypes,
    getAreasStatistics
};
