import { MOCK_WORK_SHIFTS } from './mockData';

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

// Weekday labels
export const WEEKDAY_LABELS = {
    MONDAY: 'Thứ 2',
    TUESDAY: 'Thứ 3',
    WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5',
    FRIDAY: 'Thứ 6',
    SATURDAY: 'Thứ 7',
    SUNDAY: 'Chủ nhật'
};

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Get all work shifts
 */
export const getWorkShifts = async () => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_shift_management')) {
        throw new Error('Không có quyền truy cập');
    }

    return {
        success: true,
        data: MOCK_WORK_SHIFTS.filter(ws => !ws.is_deleted),
        pagination: {
            total_items_count: MOCK_WORK_SHIFTS.filter(ws => !ws.is_deleted).length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get work shift by ID
 */
export const getWorkShiftById = async (id) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_shift_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const workShift = MOCK_WORK_SHIFTS.find(ws => ws.id === id && !ws.is_deleted);
    if (!workShift) {
        throw new Error('Không tìm thấy ca làm việc');
    }

    return {
        success: true,
        data: workShift
    };
};

/**
 * Create work shift
 * API: { name, start_time, end_time, description, applicable_days[] }
 */
export const createWorkShift = async (shiftData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_shift_management')) {
        throw new Error('Không có quyền tạo ca làm việc');
    }

    // Validation
    if (!shiftData.name) throw new Error('Tên ca làm việc là bắt buộc');
    if (!shiftData.start_time) throw new Error('Giờ bắt đầu là bắt buộc');
    if (!shiftData.end_time) throw new Error('Giờ kết thúc là bắt buộc');
    if (!shiftData.description) throw new Error('Mô tả là bắt buộc');
    if (!shiftData.applicable_days || shiftData.applicable_days.length === 0) {
        throw new Error('Phải chọn ít nhất một ngày áp dụng');
    }

    const newWorkShift = {
        id: generateId(),
        name: shiftData.name,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        description: shiftData.description,
        is_active: true, // Default active when created
        applicable_days: shiftData.applicable_days,
        team_work_shifts: [],
        daily_schedules: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_WORK_SHIFTS.push(newWorkShift);

    return {
        success: true,
        data: newWorkShift,
        message: 'Tạo ca làm việc thành công'
    };
};

/**
 * Update work shift
 * API: { name, start_time, end_time, description, applicable_days[], is_active }
 */
export const updateWorkShift = async (id, shiftData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_shift_management')) {
        throw new Error('Không có quyền cập nhật ca làm việc');
    }

    const shiftIndex = MOCK_WORK_SHIFTS.findIndex(ws => ws.id === id && !ws.is_deleted);
    if (shiftIndex === -1) {
        throw new Error('Không tìm thấy ca làm việc');
    }

    const workShift = MOCK_WORK_SHIFTS[shiftIndex];

    // Update work shift data
    const updatedWorkShift = {
        ...workShift,
        name: shiftData.name !== undefined ? shiftData.name : workShift.name,
        start_time: shiftData.start_time !== undefined ? shiftData.start_time : workShift.start_time,
        end_time: shiftData.end_time !== undefined ? shiftData.end_time : workShift.end_time,
        description: shiftData.description !== undefined ? shiftData.description : workShift.description,
        applicable_days: shiftData.applicable_days !== undefined ? shiftData.applicable_days : workShift.applicable_days,
        is_active: shiftData.is_active !== undefined ? shiftData.is_active : workShift.is_active,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_WORK_SHIFTS[shiftIndex] = updatedWorkShift;

    return {
        success: true,
        data: updatedWorkShift,
        message: 'Cập nhật ca làm việc thành công'
    };
};

/**
 * Delete work shift (soft delete)
 */
export const deleteWorkShift = async (id) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'work_shift_management')) {
        throw new Error('Không có quyền xóa ca làm việc');
    }

    const shiftIndex = MOCK_WORK_SHIFTS.findIndex(ws => ws.id === id && !ws.is_deleted);
    if (shiftIndex === -1) {
        throw new Error('Không tìm thấy ca làm việc');
    }

    // Soft delete
    MOCK_WORK_SHIFTS[shiftIndex].is_deleted = true;
    MOCK_WORK_SHIFTS[shiftIndex].updated_at = new Date().toISOString();
    MOCK_WORK_SHIFTS[shiftIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa ca làm việc thành công'
    };
};

export default {
    getWorkShifts,
    getWorkShiftById,
    createWorkShift,
    updateWorkShift,
    deleteWorkShift
};
