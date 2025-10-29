// Areas API - Mock implementation matching official API structure
import { MOCK_AREAS, MOCK_WORK_TYPES } from './mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let areasStore = JSON.parse(JSON.stringify(MOCK_AREAS)); // Deep copy

/**
 * Get all areas with pagination
 * @param {Object} params - { page_index, page_size, search, is_active }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllAreas = async (params = {}) => {
    await delay(300);

    const {
        page_index = 0,
        page_size = 10,
        search = '',
        is_active = null
    } = params;

    // Filter
    let filtered = areasStore.filter(area => !area.is_deleted);

    // Search by name, description, location
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(area =>
            area.name.toLowerCase().includes(searchLower) ||
            area.description.toLowerCase().includes(searchLower) ||
            area.location.toLowerCase().includes(searchLower)
        );
    }

    // Filter by is_active
    if (is_active !== null) {
        filtered = filtered.filter(area => area.is_active === is_active);
    }

    // Pagination
    const total_items_count = filtered.length;
    const total_pages_count = Math.ceil(total_items_count / page_size);
    const start = page_index * page_size;
    const end = start + page_size;
    const paginatedData = filtered.slice(start, end);

    return {
        data: paginatedData,
        pagination: {
            total_items_count,
            page_size,
            total_pages_count,
            page_index,
            has_next: page_index < total_pages_count - 1,
            has_previous: page_index > 0
        }
    };
};

/**
 * Get area by ID
 * @param {string} areaId
 * @returns {Promise<Object>} Area object
 */
export const getAreaById = async (areaId) => {
    await delay(200);

    const area = areasStore.find(a => a.id === areaId && !a.is_deleted);
    if (!area) {
        throw new Error('Không tìm thấy khu vực');
    }

    return JSON.parse(JSON.stringify(area)); // Deep copy
};

/**
 * Get available work types for an area (work types NOT in the area)
 * @param {string} areaId
 * @returns {Promise<Array>} List of available work types
 */
export const getAvailableWorkTypes = async (areaId) => {
    await delay(200);

    const area = areasStore.find(a => a.id === areaId && !a.is_deleted);
    if (!area) {
        throw new Error('Không tìm thấy khu vực');
    }

    // Get work type IDs already assigned to this area
    const assignedWorkTypeIds = area.area_work_types.map(awt => awt.work_type_id);

    // Return work types NOT in this area
    return MOCK_WORK_TYPES.filter(wt =>
        wt.is_active &&
        !wt.is_deleted &&
        !assignedWorkTypeIds.includes(wt.id)
    );
};

/**
 * Create new area
 * @param {Object} areaData - { name, description, location, max_capacity, image_file, image_url, work_type_ids }
 * @returns {Promise<Object>} Created area
 */
export const createArea = async (areaData) => {
    await delay(300);

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

    // Generate ID
    const id = `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate image upload (in real app, backend handles this)
    let imageUrl = areaData.image_url || null;
    if (areaData.image_file) {
        // Mock: Simulate upload by creating a blob URL
        // In real app: backend uploads to storage and returns URL
        imageUrl = URL.createObjectURL(areaData.image_file);
        console.log('Mock: Uploaded image file', areaData.image_file.name, '→', imageUrl);
    }

    const newArea = {
        id,
        name: areaData.name.trim(),
        description: areaData.description.trim(),
        location: areaData.location.trim(),
        max_capacity: parseInt(areaData.max_capacity),
        is_active: true,
        image_url: imageUrl,
        slots: [],
        area_work_types: [],
        created_at: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    // Add work types if provided
    if (areaData.work_type_ids && Array.isArray(areaData.work_type_ids)) {
        for (const workTypeId of areaData.work_type_ids) {
            const workType = MOCK_WORK_TYPES.find(wt => wt.id === workTypeId && !wt.is_deleted);
            if (workType) {
                const areaWorkType = {
                    area_id: id,
                    work_type_id: workTypeId,
                    description: null,
                    area: null,
                    work_type: JSON.parse(JSON.stringify(workType)),
                    id: `awt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    created_at: new Date().toISOString(),
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: new Date().toISOString(),
                    updated_by: null,
                    is_deleted: false
                };
                newArea.area_work_types.push(areaWorkType);
            }
        }
    }

    areasStore.push(newArea);
    return JSON.parse(JSON.stringify(newArea));
};

/**
 * Update area
 * @param {string} areaId
 * @param {Object} areaData - { name, description, location, max_capacity, image_file, image_url, work_type_ids, is_active }
 * @returns {Promise<Object>} Updated area
 */
export const updateArea = async (areaId, areaData) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    // Validation
    if (areaData.name !== undefined && !areaData.name.trim()) {
        throw new Error('Tên khu vực không được rỗng');
    }

    if (areaData.max_capacity !== undefined && areaData.max_capacity < 0) {
        throw new Error('Sức chứa tối đa phải >= 0');
    }

    // Handle image upload
    let imageUrl = areasStore[index].image_url; // Keep existing by default
    if (areaData.image_file) {
        // Mock: Simulate upload by creating a blob URL
        // In real app: backend uploads to storage and returns URL
        imageUrl = URL.createObjectURL(areaData.image_file);
        console.log('Mock: Uploaded image file', areaData.image_file.name, '→', imageUrl);
    } else if (areaData.image_url !== undefined) {
        imageUrl = areaData.image_url;
    }

    // Update basic fields
    areasStore[index] = {
        ...areasStore[index],
        ...(areaData.name && { name: areaData.name.trim() }),
        ...(areaData.description && { description: areaData.description.trim() }),
        ...(areaData.location && { location: areaData.location.trim() }),
        ...(areaData.max_capacity !== undefined && { max_capacity: parseInt(areaData.max_capacity) }),
        ...(areaData.is_active !== undefined && { is_active: areaData.is_active }),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        updated_by: '00000000-0000-0000-0000-000000000000'
    };

    // Update work types if provided
    if (areaData.work_type_ids && Array.isArray(areaData.work_type_ids)) {
        areasStore[index].area_work_types = [];

        for (const workTypeId of areaData.work_type_ids) {
            const workType = MOCK_WORK_TYPES.find(wt => wt.id === workTypeId && !wt.is_deleted);
            if (workType) {
                const areaWorkType = {
                    area_id: areaId,
                    work_type_id: workTypeId,
                    description: null,
                    area: null,
                    work_type: JSON.parse(JSON.stringify(workType)),
                    id: `awt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    created_at: new Date().toISOString(),
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: new Date().toISOString(),
                    updated_by: null,
                    is_deleted: false
                };
                areasStore[index].area_work_types.push(areaWorkType);
            }
        }
    }

    return JSON.parse(JSON.stringify(areasStore[index]));
};

/**
 * Toggle area active status
 * @param {string} areaId
 * @returns {Promise<Object>} Updated area
 */
export const toggleAreaStatus = async (areaId) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    areasStore[index].is_active = !areasStore[index].is_active;
    areasStore[index].updated_at = new Date().toISOString();
    areasStore[index].updated_by = '00000000-0000-0000-0000-000000000000';

    return JSON.parse(JSON.stringify(areasStore[index]));
};

/**
 * Delete area (soft delete)
 * @param {string} areaId
 * @returns {Promise<boolean>}
 */
export const deleteArea = async (areaId) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    areasStore[index].is_deleted = true;
    areasStore[index].updated_at = new Date().toISOString();
    areasStore[index].updated_by = '00000000-0000-0000-0000-000000000000';

    return true;
};

/**
 * Add work type to area
 * @param {string} areaId
 * @param {string} workTypeId
 * @param {string} description - Optional description for this relationship
 * @returns {Promise<Object>} Updated area
 */
export const addWorkTypeToArea = async (areaId, workTypeId, description = null) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    const workType = MOCK_WORK_TYPES.find(wt => wt.id === workTypeId && !wt.is_deleted);
    if (!workType) {
        throw new Error('Không tìm thấy loại công việc');
    }

    // Check if already assigned
    const exists = areasStore[index].area_work_types.some(awt => awt.work_type_id === workTypeId);
    if (exists) {
        throw new Error('Loại công việc này đã được gán cho khu vực');
    }

    // Add new area_work_type
    const newAreaWorkType = {
        area_id: areaId,
        work_type_id: workTypeId,
        description,
        area: null,
        work_type: JSON.parse(JSON.stringify(workType)),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    areasStore[index].area_work_types.push(newAreaWorkType);
    areasStore[index].updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(areasStore[index]));
};

/**
 * Remove work type from area
 * @param {string} areaId
 * @param {string} areaWorkTypeId
 * @returns {Promise<Object>} Updated area
 */
export const removeWorkTypeFromArea = async (areaId, areaWorkTypeId) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    areasStore[index].area_work_types = areasStore[index].area_work_types.filter(
        awt => awt.id !== areaWorkTypeId
    );
    areasStore[index].updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(areasStore[index]));
};

/**
 * Update area work types (bulk update)
 * @param {string} areaId
 * @param {Array<string>} workTypeIds - Array of work type IDs to assign
 * @returns {Promise<Object>} Updated area
 */
export const updateAreaWorkTypes = async (areaId, workTypeIds) => {
    await delay(300);

    const index = areasStore.findIndex(a => a.id === areaId && !a.is_deleted);
    if (index === -1) {
        throw new Error('Không tìm thấy khu vực');
    }

    // Clear existing work types
    areasStore[index].area_work_types = [];

    // Add new work types
    for (const workTypeId of workTypeIds) {
        const workType = MOCK_WORK_TYPES.find(wt => wt.id === workTypeId && !wt.is_deleted);
        if (workType) {
            const newAreaWorkType = {
                area_id: areaId,
                work_type_id: workTypeId,
                description: null,
                area: null,
                work_type: JSON.parse(JSON.stringify(workType)),
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                created_at: new Date().toISOString(),
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: new Date().toISOString(),
                updated_by: null,
                is_deleted: false
            };
            areasStore[index].area_work_types.push(newAreaWorkType);
        }
    }

    areasStore[index].updated_at = new Date().toISOString();
    areasStore[index].updated_by = '00000000-0000-0000-0000-000000000000';

    return JSON.parse(JSON.stringify(areasStore[index]));
};

/**
 * Get statistics
 * @returns {Promise<Object>}
 */
export const getAreasStatistics = async () => {
    await delay(200);

    const activeAreas = areasStore.filter(a => !a.is_deleted);

    return {
        total: activeAreas.length,
        active: activeAreas.filter(a => a.is_active).length,
        inactive: activeAreas.filter(a => !a.is_active).length,
        totalCapacity: activeAreas.reduce((sum, a) => sum + a.max_capacity, 0),
        averageCapacity: activeAreas.length > 0
            ? Math.round(activeAreas.reduce((sum, a) => sum + a.max_capacity, 0) / activeAreas.length)
            : 0
    };
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
