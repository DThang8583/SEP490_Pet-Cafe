import axios from 'axios';
import { AREAS_DATA } from './areasApi';
import workshiftApi from './workshiftApi';

// ========== CONSTANTS ==========

export const WEEKDAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
];

export const WEEKDAY_LABELS = {
    'MONDAY': 'Thứ Hai',
    'TUESDAY': 'Thứ Ba',
    'WEDNESDAY': 'Thứ Tư',
    'THURSDAY': 'Thứ Năm',
    'FRIDAY': 'Thứ Sáu',
    'SATURDAY': 'Thứ Bảy',
    'SUNDAY': 'Chủ Nhật'
};

export const SLOT_STATUS = {
    DRAFT: 'draft',                // Đang soạn thảo
    INTERNAL_ONLY: 'internal_only', // Chỉ nội bộ (default)
    PUBLIC: 'public'                // Công khai cho khách
};

// ========== UTILITY FUNCTIONS ==========

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'slot') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': [],
        'sales_staff': [],
        'manager': ['slot_management', 'full_access'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Time validation helpers
const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.length === 5) return `${timeStr}:00`; // HH:mm → HH:mm:ss
    return timeStr;
};

const validateTimeRange = (startTime, endTime) => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    if (endMinutes <= startMinutes) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    return true;
};

// ========== MOCK DATABASE ==========

let MOCK_SLOTS = [
    {
        id: 'slot-001',
        task_id: 'task-template-001',
        start_time: '08:00:00',
        end_time: '09:00:00',
        applicable_days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        work_shift_id: 'shift-001',
        team_id: 'team-001',
        pet_group_id: 'group-001',
        area_id: 'area-001',
        status: 'internal_only',
        capacity: null,
        price: null,
        description: null,
        created_at: '2024-01-15T10:30:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-15T10:30:00Z',
        updated_by: null
    },
    {
        id: 'slot-002',
        task_id: 'task-template-001',
        start_time: '14:00:00',
        end_time: '15:00:00',
        applicable_days: ['TUESDAY', 'THURSDAY'],
        work_shift_id: 'shift-002',
        team_id: 'team-002',
        pet_group_id: 'group-001',
        area_id: 'area-002',
        status: 'public',
        capacity: 10,
        price: 150000,
        description: 'Khung giờ chiều phù hợp cho chó cỡ nhỏ và vừa',
        created_at: '2024-01-15T11:00:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-16T09:00:00Z',
        updated_by: 'user-001'
    },
    {
        id: 'slot-003',
        task_id: 'task-template-002',
        start_time: '09:00:00',
        end_time: '11:00:00',
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        work_shift_id: 'shift-001',
        team_id: 'team-003',
        pet_group_id: 'group-002',
        area_id: 'area-003',
        status: 'public',
        capacity: 5,
        price: 350000,
        description: 'Dịch vụ grooming cao cấp với đội ngũ chuyên nghiệp',
        created_at: '2024-01-16T14:30:00Z',
        created_by: 'user-001',
        updated_at: '2024-01-17T10:00:00Z',
        updated_by: 'user-001'
    }
];

// ========== API FUNCTIONS ==========

const slotApi = {
    /**
     * Get all slots with filters
     * @param {Object} filters 
     * @returns {Promise<Object>}
     */
    async getAllSlots(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem danh sách slot');
        }

        let slots = [...MOCK_SLOTS];

        // Apply filters
        if (filters.task_id) {
            slots = slots.filter(s => s.task_id === filters.task_id);
        }

        if (filters.status) {
            slots = slots.filter(s => s.status === filters.status);
        }

        if (filters.area_id) {
            slots = slots.filter(s => s.area_id === filters.area_id);
        }

        if (filters.pet_group_id) {
            slots = slots.filter(s => s.pet_group_id === filters.pet_group_id);
        }

        if (filters.work_shift_id) {
            slots = slots.filter(s => s.work_shift_id === filters.work_shift_id);
        }

        // Sort by created_at (newest first)
        slots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            success: true,
            data: slots,
            total: slots.length
        };
    },

    /**
     * Get slots for customers (only public slots)
     * @param {Object} filters 
     * @returns {Promise<Object>}
     */
    async getPublicSlots(filters = {}) {
        await delay(300);

        let slots = MOCK_SLOTS.filter(s => s.status === SLOT_STATUS.PUBLIC);

        // Apply filters
        if (filters.task_id) {
            slots = slots.filter(s => s.task_id === filters.task_id);
        }

        if (filters.area_id) {
            slots = slots.filter(s => s.area_id === filters.area_id);
        }

        if (filters.pet_group_id) {
            slots = slots.filter(s => s.pet_group_id === filters.pet_group_id);
        }

        if (filters.day) {
            slots = slots.filter(s => s.applicable_days.includes(filters.day));
        }

        return {
            success: true,
            data: slots,
            total: slots.length
        };
    },

    /**
     * Get slot by ID
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async getSlotById(slotId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem slot');
        }

        const slot = MOCK_SLOTS.find(s => s.id === slotId);

        if (!slot) {
            throw new Error('Không tìm thấy slot');
        }

        return {
            success: true,
            data: slot
        };
    },

    /**
     * Create new slot from task
     * @param {Object} slotData 
     * @returns {Promise<Object>}
     */
    async createSlot(slotData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền tạo slot');
        }

        // ========== VALIDATION ==========

        // 1. Task ID (Required)
        if (!slotData.task_id) {
            throw new Error('Task ID là bắt buộc');
        }

        // 2. Time validation
        if (!slotData.start_time || !slotData.end_time) {
            throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
        }

        const formattedStartTime = formatTime(slotData.start_time);
        const formattedEndTime = formatTime(slotData.end_time);
        validateTimeRange(formattedStartTime, formattedEndTime);

        // 3. Applicable Days (Required)
        if (!slotData.applicable_days || slotData.applicable_days.length === 0) {
            throw new Error('Phải chọn ít nhất 1 ngày áp dụng');
        }

        const invalidDays = slotData.applicable_days.filter(day => !WEEKDAYS.includes(day));
        if (invalidDays.length > 0) {
            throw new Error(`Ngày không hợp lệ: ${invalidDays.join(', ')}`);
        }

        // 4. Work Shift ID (Required) - Team MUST come from WorkShift
        if (!slotData.work_shift_id) {
            throw new Error('WorkShift là bắt buộc. Team phải được lấy từ WorkShift.');
        }

        // Get team from work shift
        let teamId = null;
        try {
            const shiftResponse = await workshiftApi.getShiftById(slotData.work_shift_id);
            const shift = shiftResponse.data;

            // If team_id is provided, validate it exists in the shift
            if (slotData.team_id) {
                // Check both team_work_shifts and teams fields
                const shiftTeams = shift.team_work_shifts || shift.teams || [];
                const teamExists = shiftTeams.some(t => t.id === slotData.team_id);
                if (!teamExists) {
                    throw new Error('Team không tồn tại trong WorkShift này');
                }
                teamId = slotData.team_id;
            } else {
                // Auto-select first team if not provided
                const shiftTeams = shift.team_work_shifts || shift.teams || [];
                if (shiftTeams.length > 0) {
                    teamId = shiftTeams[0].id;
                } else {
                    throw new Error('WorkShift này chưa có team nào');
                }
            }
        } catch (error) {
            throw new Error(`Lỗi khi lấy thông tin WorkShift: ${error.message}`);
        }

        // 5. Pet Group ID (Required)
        if (!slotData.pet_group_id) {
            throw new Error('Pet Group là bắt buộc');
        }

        // 6. Area ID (Required)
        if (!slotData.area_id) {
            throw new Error('Area là bắt buộc');
        }

        // Validate area exists
        const area = AREAS_DATA.find(a => a.id === slotData.area_id);
        if (!area) {
            throw new Error('Area không tồn tại');
        }

        // ========== CREATE SLOT ==========

        const newSlot = {
            id: generateId('slot'),
            task_id: slotData.task_id,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            applicable_days: slotData.applicable_days,
            work_shift_id: slotData.work_shift_id,
            team_id: teamId,
            pet_group_id: slotData.pet_group_id,
            area_id: slotData.area_id,
            status: SLOT_STATUS.INTERNAL_ONLY, // Default status
            capacity: null, // Hidden until publish
            price: null,    // Hidden until publish
            description: null, // Hidden until publish
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
            updated_at: new Date().toISOString(),
            updated_by: null
        };

        MOCK_SLOTS.push(newSlot);

        return {
            success: true,
            data: newSlot,
            message: 'Tạo slot thành công'
        };
    },

    /**
     * Update slot (for internal use)
     * @param {string} slotId 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async updateSlot(slotId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền cập nhật slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const currentSlot = MOCK_SLOTS[slotIndex];

        // Prevent updating public slots directly (use publishSlot instead)
        if (currentSlot.status === SLOT_STATUS.PUBLIC && !updates.allowPublicEdit) {
            throw new Error('Không thể cập nhật slot công khai. Vui lòng sử dụng chức năng "Chỉnh sửa slot công khai"');
        }

        // Validation for time
        if (updates.start_time || updates.end_time) {
            const startTime = formatTime(updates.start_time || currentSlot.start_time);
            const endTime = formatTime(updates.end_time || currentSlot.end_time);
            validateTimeRange(startTime, endTime);

            if (updates.start_time) updates.start_time = startTime;
            if (updates.end_time) updates.end_time = endTime;
        }

        // Validation for applicable_days
        if (updates.applicable_days) {
            if (updates.applicable_days.length === 0) {
                throw new Error('Phải chọn ít nhất 1 ngày áp dụng');
            }

            const invalidDays = updates.applicable_days.filter(day => !WEEKDAYS.includes(day));
            if (invalidDays.length > 0) {
                throw new Error(`Ngày không hợp lệ: ${invalidDays.join(', ')}`);
            }
        }

        // Validation for work_shift_id and team_id
        if (updates.work_shift_id) {
            try {
                const shiftResponse = await workshiftApi.getShiftById(updates.work_shift_id);
                const shift = shiftResponse.data;

                // If team_id is provided, validate it
                if (updates.team_id) {
                    // Check both team_work_shifts and teams fields
                    const shiftTeams = shift.team_work_shifts || shift.teams || [];
                    const teamExists = shiftTeams.some(t => t.id === updates.team_id);
                    if (!teamExists) {
                        throw new Error('Team không tồn tại trong WorkShift này');
                    }
                } else {
                    // Auto-update team to first team of new shift
                    const shiftTeams = shift.team_work_shifts || shift.teams || [];
                    if (shiftTeams.length > 0) {
                        updates.team_id = shiftTeams[0].id;
                    } else {
                        throw new Error('WorkShift này chưa có team nào');
                    }
                }
            } catch (error) {
                throw new Error(`Lỗi khi lấy thông tin WorkShift: ${error.message}`);
            }
        }

        // Apply updates
        const updatedSlot = {
            ...currentSlot,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_SLOTS[slotIndex] = updatedSlot;

        return {
            success: true,
            data: updatedSlot,
            message: 'Cập nhật slot thành công'
        };
    },

    /**
     * Publish slot to public (with capacity, price, description)
     * Cho phép edit lại Start/End time, Days, Capacity
     * @param {string} slotId 
     * @param {Object} publicData - { capacity, price, description, start_time?, end_time?, applicable_days? }
     * @returns {Promise<Object>}
     */
    async publishSlot(slotId, publicData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền publish slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const currentSlot = MOCK_SLOTS[slotIndex];

        // ========== VALIDATION ==========

        // 1. Capacity (Required for public)
        if (!publicData.capacity || publicData.capacity <= 0) {
            throw new Error('Capacity phải lớn hơn 0');
        }

        // 2. Validate capacity with Area capacity
        const area = AREAS_DATA.find(a => a.id === currentSlot.area_id);
        if (!area) {
            throw new Error('Area không tồn tại');
        }

        if (publicData.capacity > area.capacity) {
            throw new Error(`Capacity vượt quá giới hạn của khu vực (${area.capacity})`);
        }

        // 3. Price validation (optional but if provided must be valid)
        if (publicData.price !== undefined && publicData.price !== null && publicData.price < 0) {
            throw new Error('Price không được âm');
        }

        // 4. Time validation (if provided)
        let updatedStartTime = currentSlot.start_time;
        let updatedEndTime = currentSlot.end_time;

        if (publicData.start_time || publicData.end_time) {
            updatedStartTime = formatTime(publicData.start_time || currentSlot.start_time);
            updatedEndTime = formatTime(publicData.end_time || currentSlot.end_time);
            validateTimeRange(updatedStartTime, updatedEndTime);
        }

        // 5. Applicable days validation (if provided)
        let updatedDays = currentSlot.applicable_days;

        if (publicData.applicable_days) {
            if (publicData.applicable_days.length === 0) {
                throw new Error('Phải chọn ít nhất 1 ngày áp dụng');
            }

            const invalidDays = publicData.applicable_days.filter(day => !WEEKDAYS.includes(day));
            if (invalidDays.length > 0) {
                throw new Error(`Ngày không hợp lệ: ${invalidDays.join(', ')}`);
            }

            updatedDays = publicData.applicable_days;
        }

        // ========== UPDATE SLOT TO PUBLIC ==========

        const publishedSlot = {
            ...currentSlot,
            status: SLOT_STATUS.PUBLIC,
            capacity: publicData.capacity,
            price: publicData.price || null,
            description: publicData.description || null,
            start_time: updatedStartTime,
            end_time: updatedEndTime,
            applicable_days: updatedDays,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_SLOTS[slotIndex] = publishedSlot;

        return {
            success: true,
            data: publishedSlot,
            message: 'Publish slot thành công'
        };
    },

    /**
     * Unpublish slot (revert to internal_only)
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async unpublishSlot(slotId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền unpublish slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const currentSlot = MOCK_SLOTS[slotIndex];

        if (currentSlot.status !== SLOT_STATUS.PUBLIC) {
            throw new Error('Slot này chưa được publish');
        }

        // TODO: Check if slot has active bookings

        const unpublishedSlot = {
            ...currentSlot,
            status: SLOT_STATUS.INTERNAL_ONLY,
            capacity: null,
            price: null,
            description: null,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_SLOTS[slotIndex] = unpublishedSlot;

        return {
            success: true,
            data: unpublishedSlot,
            message: 'Unpublish slot thành công'
        };
    },

    /**
     * Delete slot
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async deleteSlot(slotId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xóa slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const slot = MOCK_SLOTS[slotIndex];

        // Prevent deleting public slots with bookings
        if (slot.status === SLOT_STATUS.PUBLIC) {
            // TODO: Check if slot has active bookings
            throw new Error('Không thể xóa slot đang công khai. Vui lòng unpublish trước.');
        }

        MOCK_SLOTS.splice(slotIndex, 1);

        return {
            success: true,
            message: 'Xóa slot thành công'
        };
    },

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const stats = {
            total: MOCK_SLOTS.length,
            by_status: {
                draft: MOCK_SLOTS.filter(s => s.status === SLOT_STATUS.DRAFT).length,
                internal_only: MOCK_SLOTS.filter(s => s.status === SLOT_STATUS.INTERNAL_ONLY).length,
                public: MOCK_SLOTS.filter(s => s.status === SLOT_STATUS.PUBLIC).length
            }
        };

        return {
            success: true,
            data: stats
        };
    },

    /**
     * Get slots by task ID
     * @param {string} taskId 
     * @returns {Promise<Object>}
     */
    async getSlotsByTask(taskId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem danh sách slot');
        }

        const slots = MOCK_SLOTS.filter(s => s.task_id === taskId);

        return {
            success: true,
            data: slots,
            total: slots.length
        };
    }
};

// Export
export { MOCK_SLOTS };
export default slotApi;
