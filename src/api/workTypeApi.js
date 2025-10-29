import { MOCK_WORK_TYPES } from './mockData';

// Delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock getCurrentUser
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;
    const role = user.role || user.account?.role;
    if (role && role.toUpperCase() === 'MANAGER') return true;
    return false;
};

// Generate ID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Get all work types
 */
export const getWorkTypes = async () => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_type_management')) {
        throw new Error('Không có quyền truy cập');
    }

    return {
        success: true,
        data: MOCK_WORK_TYPES
    };
};

/**
 * Get work type by ID (detail)
 */
export const getWorkTypeById = async (id) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_type_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const workType = MOCK_WORK_TYPES.find(wt => wt.id === id);
    if (!workType) {
        throw new Error('Không tìm thấy loại công việc');
    }

    return {
        success: true,
        data: workType
    };
};

/**
 * Create new work type
 * API: { name: string, description: string }
 */
export const createWorkType = async (workTypeData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_type_management')) {
        throw new Error('Không có quyền tạo loại công việc');
    }

    // Validation
    if (!workTypeData.name) throw new Error('Tên loại công việc là bắt buộc');
    if (!workTypeData.description) throw new Error('Mô tả là bắt buộc');

    const newWorkType = {
        id: generateId(),
        name: workTypeData.name,
        description: workTypeData.description,
        is_active: true, // Default active when created
        tasks: [],
        area_work_types: [],
        team_work_types: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    // Add to mock database
    MOCK_WORK_TYPES.push(newWorkType);

    return {
        success: true,
        data: newWorkType,
        message: 'Tạo loại công việc thành công'
    };
};

/**
 * Update work type
 * API: { name: string, description: string, is_active: boolean }
 */
export const updateWorkType = async (id, workTypeData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_type_management')) {
        throw new Error('Không có quyền cập nhật loại công việc');
    }

    const workTypeIndex = MOCK_WORK_TYPES.findIndex(wt => wt.id === id);
    if (workTypeIndex === -1) {
        throw new Error('Không tìm thấy loại công việc');
    }

    const workType = MOCK_WORK_TYPES[workTypeIndex];

    // Update work type data
    const updatedWorkType = {
        ...workType,
        name: workTypeData.name !== undefined ? workTypeData.name : workType.name,
        description: workTypeData.description !== undefined ? workTypeData.description : workType.description,
        is_active: workTypeData.is_active !== undefined ? workTypeData.is_active : workType.is_active,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_WORK_TYPES[workTypeIndex] = updatedWorkType;

    return {
        success: true,
        data: updatedWorkType,
        message: 'Cập nhật loại công việc thành công'
    };
};

/**
 * Delete work type (soft delete)
 */
export const deleteWorkType = async (id) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_type_management')) {
        throw new Error('Không có quyền xóa loại công việc');
    }

    const workTypeIndex = MOCK_WORK_TYPES.findIndex(wt => wt.id === id);
    if (workTypeIndex === -1) {
        throw new Error('Không tìm thấy loại công việc');
    }

    // Soft delete
    MOCK_WORK_TYPES[workTypeIndex].is_deleted = true;
    MOCK_WORK_TYPES[workTypeIndex].updated_at = new Date().toISOString();
    MOCK_WORK_TYPES[workTypeIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa loại công việc thành công'
    };
};

export default {
    getWorkTypes,
    getWorkTypeById,
    createWorkType,
    updateWorkType,
    deleteWorkType
};
