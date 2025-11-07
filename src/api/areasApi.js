// Areas API - Mock implementation matching official API structure
import { MOCK_WORK_TYPES } from './workTypeApi';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== MOCK AREAS ==========
const MOCK_AREAS = [
    {
        id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
        name: 'Dog Zone - Khu Vực Sân Chơi',
        description: 'Khu vực rộng rãi có hàng rào, dành riêng cho chó có kích thước vừa và lớn vui chơi. Có các trò chơi huấn luyện cơ bản và bể nước nhỏ.',
        location: 'Tầng trệt, phía sau quầy bar',
        max_capacity: 20,
        is_active: true,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F4c131330-db62-44db-8099-df710340edf7.webp?alt=media&token=2237c04a-c0d2-40b6-a23e-bf19e7153a06',
        slots: [],
        area_work_types: [
            {
                area_id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
                work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
                description: null,
                area: null,
                work_type: {
                    name: 'Dog Zone Management ',
                    description: 'Chịu trách nhiệm giám sát, huấn luyện cơ bản, cho ăn và đảm bảo vệ sinh, an toàn trong khu vực sinh hoạt của chó. Quản lý tương tác giữa chó và khách hàng, đặc biệt là các giống chó lớn.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [null],
                    team_work_types: [],
                    id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
                    created_at: '2025-10-27T12:28:16.424682+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:28:16.424683+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: '2d0dc8d5-9406-4956-a99a-79d453034836',
                created_at: '2025-10-27T12:36:23.605599+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-27T12:36:23.6056+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-27T12:36:23.6056+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:36:23.605601+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        name: 'Cat Lounge - Tầng Lửng',
        description: 'Khu vực tầng lửng yên tĩnh, được trang bị tháp mèo, đồ chơi và ghế sofa ấm cúng. Nơi mèo nghỉ ngơi và tương tác nhẹ nhàng với khách hàng.',
        location: 'Tầng lửng, phía trên khu F&B',
        max_capacity: 25,
        is_active: true,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F4c131330-db62-44db-8099-df710340edf7.webp?alt=media&token=2237c04a-c0d2-40b6-a23e-bf19e7153a06',
        slots: [],
        area_work_types: [
            {
                area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
                work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                description: null,
                area: null,
                work_type: {
                    name: 'Cat Zone Management ',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của mèo, và đảm bảo tương tác an toàn giữa mèo với khách hàng trong khu vực Cat Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [null],
                    team_work_types: [],
                    id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                    created_at: '2025-10-27T12:31:09.910051+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:09.910051+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'bc0bbba1-6705-40f8-a5db-e38267b095f9',
                created_at: '2025-10-27T12:37:34.296162+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-27T12:37:34.296163+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-27T12:37:34.296163+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:37:34.296163+00:00',
        updated_by: null,
        is_deleted: false
    }
];

let areasStore = JSON.parse(JSON.stringify(MOCK_AREAS)); // Deep copy

/**
 * Get all areas with pagination
 * @param {Object} params - { page_index, page_size, search, is_active, work_type_id }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllAreas = async (params = {}) => {
    await delay(300);

    const {
        page_index = 0,
        page_size = 10,
        search = '',
        is_active = null,
        work_type_id = null
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

    // Filter by work_type_id
    if (work_type_id !== null) {
        filtered = filtered.filter(area =>
            area.area_work_types &&
            area.area_work_types.some(awt => awt.work_type_id === work_type_id)
        );
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

export { MOCK_AREAS };
