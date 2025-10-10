/**
 * WORK SHIFT API - Mock Implementation
 * 
 * ============================================
 * FIELD MAPPING: FRONTEND ↔ BACKEND
 * ============================================
 * 
 * | Frontend Field | Backend Field | Type   | Required | Description           |
 * |----------------|---------------|--------|----------|-----------------------|
 * | name           | name          | string | ✅ Yes   | Shift name            |
 * | startTime      | start_time    | string | ✅ Yes   | Shift start time      |
 * | endTime        | end_time      | string | ✅ Yes   | Shift end time        |
 * | description    | description   | string | ⚠️ Opt   | Shift description     |
 * 
 * ============================================
 * BACKEND SCHEMA (from Swagger API)
 * ============================================
 * {
 *   "name": "string",
 *   "start_time": "string",
 *   "end_time": "string",
 *   "description": "string"
 * }
 * 
 * @module workshiftApi
 * @lastUpdated 2025-10-10
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'shift') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': ['notification_receive'],
        'working_staff': ['view_schedule', 'update_task_status', 'notification_receive'],
        'sales_staff': ['view_schedule', 'notification_receive'],
        'manager': ['user_management', 'shift_management', 'service_management', 'booking_management', 'analytics_view', 'notification_receive'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock database for work shifts
let MOCK_SHIFTS = [
    {
        id: 'shift-001',
        name: 'Ca sáng',
        start_time: '06:00',
        end_time: '12:00',
        startTime: '06:00',
        endTime: '12:00',
        description: 'Ca làm việc buổi sáng từ 6h đến 12h',
        duration_hours: 6,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-001'
    },
    {
        id: 'shift-002',
        name: 'Ca chiều',
        start_time: '12:00',
        end_time: '18:00',
        startTime: '12:00',
        endTime: '18:00',
        description: 'Ca làm việc buổi chiều từ 12h đến 18h',
        duration_hours: 6,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-001'
    },
    {
        id: 'shift-003',
        name: 'Ca tối',
        start_time: '18:00',
        end_time: '22:00',
        startTime: '18:00',
        endTime: '22:00',
        description: 'Ca làm việc buổi tối từ 18h đến 22h',
        duration_hours: 4,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-001'
    },
    {
        id: 'shift-004',
        name: 'Ca full-time',
        start_time: '08:00',
        end_time: '17:00',
        startTime: '08:00',
        endTime: '17:00',
        description: 'Ca làm việc toàn thời gian từ 8h đến 17h (nghỉ trưa 1 tiếng)',
        duration_hours: 8,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-001'
    },
    {
        id: 'shift-005',
        name: 'Ca đêm',
        start_time: '22:00',
        end_time: '06:00',
        startTime: '22:00',
        endTime: '06:00',
        description: 'Ca làm việc qua đêm từ 22h đến 6h sáng hôm sau',
        duration_hours: 8,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-001'
    }
];

// Mock database for shift-staff assignments
// Staff IDs phải khớp với user IDs từ userApi.js:
// Sales staff: user-003 đến user-016 (14 người)
// Working staff: user-017 đến user-031 (15 người)
let MOCK_SHIFT_ASSIGNMENTS = [
    // Ca sáng (06:00-12:00) - 5 nhân viên
    { id: 'assign-001', shift_id: 'shift-001', staff_id: 'user-003', assigned_date: '2025-10-10' }, // Lê Thị Bán Hàng (sales)
    { id: 'assign-002', shift_id: 'shift-001', staff_id: 'user-004', assigned_date: '2025-10-10' }, // Phạm Văn Kinh Doanh (sales)
    { id: 'assign-003', shift_id: 'shift-001', staff_id: 'user-017', assigned_date: '2025-10-10' }, // Hoàng Thị Chăm Sóc (working)
    { id: 'assign-004', shift_id: 'shift-001', staff_id: 'user-018', assigned_date: '2025-10-10' }, // Vũ Văn Thú Y (working)
    { id: 'assign-005', shift_id: 'shift-001', staff_id: 'user-019', assigned_date: '2025-10-10' }, // Nguyễn Quốc Hùng (working)

    // Ca chiều (12:00-18:00) - 5 nhân viên
    { id: 'assign-006', shift_id: 'shift-002', staff_id: 'user-007', assigned_date: '2025-10-10' }, // Nguyễn Văn Minh (sales)
    { id: 'assign-007', shift_id: 'shift-002', staff_id: 'user-008', assigned_date: '2025-10-10' }, // Trần Thị Thu (sales)
    { id: 'assign-008', shift_id: 'shift-002', staff_id: 'user-020', assigned_date: '2025-10-10' }, // Phạm Thị Mai (working)
    { id: 'assign-009', shift_id: 'shift-002', staff_id: 'user-021', assigned_date: '2025-10-10' }, // Lê Hoàng Đạt (working)
    { id: 'assign-010', shift_id: 'shift-002', staff_id: 'user-022', assigned_date: '2025-10-10' }, // Trần Minh Tâm (working)

    // Ca tối (18:00-22:00) - 5 nhân viên
    { id: 'assign-011', shift_id: 'shift-003', staff_id: 'user-009', assigned_date: '2025-10-10' }, // Lê Minh Khánh (sales)
    { id: 'assign-012', shift_id: 'shift-003', staff_id: 'user-010', assigned_date: '2025-10-10' }, // Phạm Thị Hoa (sales)
    { id: 'assign-013', shift_id: 'shift-003', staff_id: 'user-023', assigned_date: '2025-10-10' }, // Võ Thị Thúy (working)
    { id: 'assign-014', shift_id: 'shift-003', staff_id: 'user-024', assigned_date: '2025-10-10' }, // Hoàng Minh Quân (working)
    { id: 'assign-015', shift_id: 'shift-003', staff_id: 'user-025', assigned_date: '2025-10-10' }, // Bùi Thị Nhi (working)

    // Ca full-time (08:00-17:00) - 5 nhân viên
    { id: 'assign-016', shift_id: 'shift-004', staff_id: 'user-011', assigned_date: '2025-10-10' }, // Võ Thành Long (sales)
    { id: 'assign-017', shift_id: 'shift-004', staff_id: 'user-012', assigned_date: '2025-10-10' }, // Hoàng Thị Lan (sales)
    { id: 'assign-018', shift_id: 'shift-004', staff_id: 'user-026', assigned_date: '2025-10-10' }, // Đặng Trung Hiếu (working)
    { id: 'assign-019', shift_id: 'shift-004', staff_id: 'user-027', assigned_date: '2025-10-10' }, // Nguyễn Thị Anh (working)
    { id: 'assign-020', shift_id: 'shift-004', staff_id: 'user-028', assigned_date: '2025-10-10' }, // Phạm Anh Khoa (working)

    // Ca đêm (22:00-06:00) - 5 nhân viên
    { id: 'assign-021', shift_id: 'shift-005', staff_id: 'user-013', assigned_date: '2025-10-10' }, // Đặng Hoàng Nam (sales)
    { id: 'assign-022', shift_id: 'shift-005', staff_id: 'user-014', assigned_date: '2025-10-10' }, // Bùi Thị Mỹ (sales)
    { id: 'assign-023', shift_id: 'shift-005', staff_id: 'user-029', assigned_date: '2025-10-10' }, // Lê Thị Phương (working)
    { id: 'assign-024', shift_id: 'shift-005', staff_id: 'user-030', assigned_date: '2025-10-10' }, // Trần Văn Bình (working)
    { id: 'assign-025', shift_id: 'shift-005', staff_id: 'user-031', assigned_date: '2025-10-10' }, // Hoàng Thị Yến (working)
];

/**
 * Calculate duration in hours between start_time and end_time
 * @param {string} start_time - Format: "HH:mm"
 * @param {string} end_time - Format: "HH:mm"
 * @returns {number} Duration in hours
 */
const calculateDuration = (start_time, end_time) => {
    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours
    }

    return (endMinutes - startMinutes) / 60;
};

/**
 * Validate time format (HH:mm)
 * @param {string} time 
 * @returns {boolean}
 */
const isValidTimeFormat = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// Work Shift APIs
const workshiftApi = {
    /**
     * Get all work shifts
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    async getAllShifts(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem ca làm việc');
        }

        let shifts = [...MOCK_SHIFTS];

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            shifts = shifts.filter(shift => shift.status === filters.status);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            shifts = shifts.filter(shift =>
                shift.name.toLowerCase().includes(searchTerm) ||
                (shift.description && shift.description.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.minDuration) {
            shifts = shifts.filter(shift => shift.duration_hours >= filters.minDuration);
        }

        if (filters.maxDuration) {
            shifts = shifts.filter(shift => shift.duration_hours <= filters.maxDuration);
        }

        // Sort shifts
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'name_asc':
                    shifts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name_desc':
                    shifts.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'start_time':
                    shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
                    break;
                case 'duration':
                    shifts.sort((a, b) => b.duration_hours - a.duration_hours);
                    break;
                default:
                    break;
            }
        }

        return {
            success: true,
            data: shifts,
            total: shifts.length
        };
    },

    /**
     * Get shift by ID
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async getShiftById(shiftId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem ca làm việc');
        }

        const shift = MOCK_SHIFTS.find(s => s.id === shiftId);

        if (!shift) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        return { success: true, data: shift };
    },

    /**
     * Get active shifts only
     * @returns {Promise<Object>}
     */
    async getActiveShifts() {
        await delay(200);

        const activeShifts = MOCK_SHIFTS.filter(shift => shift.status === 'active');

        return {
            success: true,
            data: activeShifts,
            total: activeShifts.length
        };
    },

    /**
     * Create new work shift (Manager only)
     * @param {Object} shiftData 
     * @returns {Promise<Object>}
     */
    async createShift(shiftData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền tạo ca làm việc');
        }

        // Validate required fields
        if (!shiftData.name || !shiftData.name.trim()) {
            throw new Error('Tên ca làm việc là bắt buộc');
        }

        const startTime = shiftData.start_time || shiftData.startTime;
        const endTime = shiftData.end_time || shiftData.endTime;

        if (!startTime || !endTime) {
            throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
        }

        if (!isValidTimeFormat(startTime)) {
            throw new Error('Thời gian bắt đầu không hợp lệ (định dạng: HH:mm)');
        }

        if (!isValidTimeFormat(endTime)) {
            throw new Error('Thời gian kết thúc không hợp lệ (định dạng: HH:mm)');
        }

        // Check for duplicate shift name
        const existingShift = MOCK_SHIFTS.find(s =>
            s.name.toLowerCase() === shiftData.name.trim().toLowerCase() && s.status === 'active'
        );
        if (existingShift) {
            throw new Error('Tên ca làm việc đã tồn tại');
        }

        const duration = calculateDuration(startTime, endTime);

        if (duration <= 0) {
            throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
        }

        if (duration > 12) {
            throw new Error('Ca làm việc không được vượt quá 12 tiếng');
        }

        const newShift = {
            id: generateId('shift'),
            name: shiftData.name.trim(),
            start_time: startTime,
            end_time: endTime,
            startTime: startTime, // Keep both formats
            endTime: endTime, // Keep both formats
            description: shiftData.description?.trim() || '',
            duration_hours: duration,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        MOCK_SHIFTS.push(newShift);

        return {
            success: true,
            data: newShift,
            message: 'Tạo ca làm việc thành công'
        };
    },

    /**
     * Update work shift (Manager only)
     * @param {string} shiftId 
     * @param {Object} updateData 
     * @returns {Promise<Object>}
     */
    async updateShift(shiftId, updateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền cập nhật ca làm việc');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const currentShift = MOCK_SHIFTS[shiftIndex];
        const updatedFields = {};

        // Validate name if provided
        if (updateData.name !== undefined) {
            if (!updateData.name || !updateData.name.trim()) {
                throw new Error('Tên ca làm việc không được để trống');
            }

            // Check for duplicate name (exclude current shift)
            const duplicateShift = MOCK_SHIFTS.find(s =>
                s.id !== shiftId &&
                s.name.toLowerCase() === updateData.name.trim().toLowerCase() &&
                s.status === 'active'
            );
            if (duplicateShift) {
                throw new Error('Tên ca làm việc đã tồn tại');
            }

            updatedFields.name = updateData.name.trim();
        }

        // Validate and update times
        const startTime = updateData.start_time || updateData.startTime || currentShift.start_time;
        const endTime = updateData.end_time || updateData.endTime || currentShift.end_time;

        if (updateData.start_time !== undefined || updateData.startTime !== undefined) {
            if (!isValidTimeFormat(startTime)) {
                throw new Error('Thời gian bắt đầu không hợp lệ (định dạng: HH:mm)');
            }
            updatedFields.start_time = startTime;
            updatedFields.startTime = startTime;
        }

        if (updateData.end_time !== undefined || updateData.endTime !== undefined) {
            if (!isValidTimeFormat(endTime)) {
                throw new Error('Thời gian kết thúc không hợp lệ (định dạng: HH:mm)');
            }
            updatedFields.end_time = endTime;
            updatedFields.endTime = endTime;
        }

        // Recalculate duration if times changed
        if (updatedFields.start_time || updatedFields.end_time) {
            const duration = calculateDuration(startTime, endTime);

            if (duration <= 0) {
                throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
            }

            if (duration > 12) {
                throw new Error('Ca làm việc không được vượt quá 12 tiếng');
            }

            updatedFields.duration_hours = duration;
        }

        if (updateData.description !== undefined) {
            updatedFields.description = updateData.description?.trim() || '';
        }

        if (updateData.status !== undefined) {
            updatedFields.status = updateData.status;
        }

        MOCK_SHIFTS[shiftIndex] = {
            ...currentShift,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.id
        };

        return {
            success: true,
            data: MOCK_SHIFTS[shiftIndex],
            message: 'Cập nhật ca làm việc thành công'
        };
    },

    /**
     * Delete work shift (Manager only) - Soft delete
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async deleteShift(shiftId) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa ca làm việc');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Soft delete - mark as inactive
        MOCK_SHIFTS[shiftIndex].status = 'inactive';
        MOCK_SHIFTS[shiftIndex].deletedAt = new Date().toISOString();
        MOCK_SHIFTS[shiftIndex].deletedBy = currentUser.id;

        // Or hard delete (uncomment if needed)
        // MOCK_SHIFTS.splice(shiftIndex, 1);

        return {
            success: true,
            message: 'Xóa ca làm việc thành công'
        };
    },

    /**
     * Get statistics for work shifts
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const activeShifts = MOCK_SHIFTS.filter(s => s.status === 'active');
        const inactiveShifts = MOCK_SHIFTS.filter(s => s.status === 'inactive');

        const morningShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 5 && hour < 12;
        });

        const afternoonShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 12 && hour < 18;
        });

        const eveningShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 18 && hour < 24;
        });

        const nightShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 0 && hour < 5 || hour >= 22;
        });

        const fullTimeShifts = activeShifts.filter(s => s.duration_hours >= 8);
        const partTimeShifts = activeShifts.filter(s => s.duration_hours < 8);

        return {
            success: true,
            data: {
                total: MOCK_SHIFTS.length,
                active: activeShifts.length,
                inactive: inactiveShifts.length,
                morning: morningShifts.length,
                afternoon: afternoonShifts.length,
                evening: eveningShifts.length,
                night: nightShifts.length,
                fullTime: fullTimeShifts.length,
                partTime: partTimeShifts.length,
                averageDuration: activeShifts.length > 0
                    ? activeShifts.reduce((sum, s) => sum + s.duration_hours, 0) / activeShifts.length
                    : 0
            }
        };
    },

    /**
     * Check for overlapping shifts
     * @param {string} startTime - Format: "HH:mm"
     * @param {string} endTime - Format: "HH:mm"
     * @param {string} excludeShiftId - Optional shift ID to exclude from check
     * @returns {Promise<Object>}
     */
    async checkOverlap(startTime, endTime, excludeShiftId = null) {
        await delay(200);

        const shifts = MOCK_SHIFTS.filter(s =>
            s.status === 'active' &&
            s.id !== excludeShiftId
        );

        const overlappingShifts = shifts.filter(shift => {
            // Convert times to minutes for comparison
            const [newStartH, newStartM] = startTime.split(':').map(Number);
            const [newEndH, newEndM] = endTime.split(':').map(Number);
            const [existStartH, existStartM] = shift.start_time.split(':').map(Number);
            const [existEndH, existEndM] = shift.end_time.split(':').map(Number);

            const newStart = newStartH * 60 + newStartM;
            let newEnd = newEndH * 60 + newEndM;
            const existStart = existStartH * 60 + existStartM;
            let existEnd = existEndH * 60 + existEndM;

            // Handle overnight shifts
            if (newEnd <= newStart) newEnd += 24 * 60;
            if (existEnd <= existStart) existEnd += 24 * 60;

            // Check for overlap
            return (newStart < existEnd && newEnd > existStart);
        });

        return {
            success: true,
            hasOverlap: overlappingShifts.length > 0,
            overlappingShifts: overlappingShifts
        };
    },

    /**
     * Get staff assigned to a shift
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async getShiftStaff(shiftId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem danh sách nhân viên');
        }

        const assignments = MOCK_SHIFT_ASSIGNMENTS.filter(a => a.shift_id === shiftId);
        const staffIds = assignments.map(a => a.staff_id);

        return {
            success: true,
            data: {
                shift_id: shiftId,
                staff_ids: staffIds,
                total: staffIds.length,
                assignments: assignments
            }
        };
    },

    /**
     * Assign staff to a shift
     * @param {string} shiftId 
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async assignStaffToShift(shiftId, staffId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền phân công nhân viên');
        }

        // Check if shift exists
        const shift = MOCK_SHIFTS.find(s => s.id === shiftId);
        if (!shift) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Check if staff already assigned
        const existingAssignment = MOCK_SHIFT_ASSIGNMENTS.find(
            a => a.shift_id === shiftId && a.staff_id === staffId
        );

        if (existingAssignment) {
            throw new Error('Nhân viên đã được phân vào ca này');
        }

        // Create new assignment
        const newAssignment = {
            id: generateId('assign'),
            shift_id: shiftId,
            staff_id: staffId,
            assigned_date: new Date().toISOString().split('T')[0],
            assigned_by: currentUser.id,
            created_at: new Date().toISOString()
        };

        MOCK_SHIFT_ASSIGNMENTS.push(newAssignment);

        return {
            success: true,
            data: newAssignment,
            message: 'Phân công nhân viên thành công'
        };
    },

    /**
     * Remove staff from a shift
     * @param {string} shiftId 
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async removeStaffFromShift(shiftId, staffId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa phân công nhân viên');
        }

        const assignmentIndex = MOCK_SHIFT_ASSIGNMENTS.findIndex(
            a => a.shift_id === shiftId && a.staff_id === staffId
        );

        if (assignmentIndex === -1) {
            throw new Error('Không tìm thấy phân công này');
        }

        MOCK_SHIFT_ASSIGNMENTS.splice(assignmentIndex, 1);

        return {
            success: true,
            message: 'Xóa phân công nhân viên thành công'
        };
    },

    /**
     * Get all shifts assigned to a staff member
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async getStaffShifts(staffId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem lịch làm việc');
        }

        const assignments = MOCK_SHIFT_ASSIGNMENTS.filter(a => a.staff_id === staffId);
        const shiftIds = assignments.map(a => a.shift_id);
        const shifts = MOCK_SHIFTS.filter(s => shiftIds.includes(s.id) && s.status === 'active');

        return {
            success: true,
            data: {
                staff_id: staffId,
                shifts: shifts,
                total: shifts.length
            }
        };
    }
};

// Export both named and default
export { workshiftApi };
export default workshiftApi;

