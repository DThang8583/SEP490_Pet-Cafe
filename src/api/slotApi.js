import { MOCK_SLOTS as IMPORTED_MOCK_SLOTS } from './mockSlots';
import { MOCK_AREAS, MOCK_TEAMS, MOCK_PET_GROUPS } from './mockData';
import { MOCK_SERVICES } from './mockServices';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

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
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    BOOKED: 'BOOKED',
    CANCELLED: 'CANCELLED'
};

// ========== UTILITY FUNCTIONS ==========

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

// ========== MOCK DATABASE ==========

let MOCK_SLOTS = [...IMPORTED_MOCK_SLOTS];

// ========== API FUNCTIONS ==========

const slotApi = {
    /**
     * Get all slots
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    async getAllSlots(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem danh sách slot');
        }

        let slots = [...MOCK_SLOTS].filter(s => !s.is_deleted);

        // Apply filters
        if (filters.task_id) {
            slots = slots.filter(s => s.task_id === filters.task_id);
        }

        if (filters.service_id) {
            slots = slots.filter(s => s.service_id === filters.service_id);
        }

        if (filters.day_of_week) {
            slots = slots.filter(s => s.day_of_week === filters.day_of_week);
        }

        if (filters.service_status) {
            slots = slots.filter(s => s.service_status === filters.service_status);
        }

        if (filters.team_id) {
            slots = slots.filter(s => s.team_id === filters.team_id);
        }

        // Sort by day of week and start time
        const dayOrder = {
            'MONDAY': 1,
            'TUESDAY': 2,
            'WEDNESDAY': 3,
            'THURSDAY': 4,
            'FRIDAY': 5,
            'SATURDAY': 6,
            'SUNDAY': 7
        };

        slots.sort((a, b) => {
            const dayCompare = dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
            if (dayCompare !== 0) return dayCompare;
            return a.start_time.localeCompare(b.start_time);
        });

        return {
            success: true,
            data: slots,
            pagination: {
                total_items_count: slots.length,
                page_size: 100,
                total_pages_count: 1,
                page_index: 0,
                has_next: false,
                has_previous: false
            }
        };
    },

    /**
     * Get slots by task ID
     * @param {string} taskId 
     * @returns {Promise<Object>}
     */
    async getSlotsByTaskId(taskId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem slot');
        }

        const slots = MOCK_SLOTS.filter(s => s.task_id === taskId && !s.is_deleted);

        return {
            success: true,
            data: slots,
            pagination: {
                total_items_count: slots.length,
                page_size: 10,
                total_pages_count: 1,
                page_index: 0,
                has_next: false,
                has_previous: false
            }
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

        const slot = MOCK_SLOTS.find(s => s.id === slotId && !s.is_deleted);

        if (!slot) {
            throw new Error('Không tìm thấy slot');
        }

        return {
            success: true,
            data: slot
        };
    },

    /**
     * Create new slot
     * @param {Object} slotData 
     * @returns {Promise<Object>}
     */
    async createSlot(slotData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền tạo slot');
        }

        // Validation
        if (!slotData.task_id) {
            throw new Error('Task ID là bắt buộc');
        }

        if (!slotData.day_of_week) {
            throw new Error('Ngày trong tuần là bắt buộc');
        }

        if (!slotData.start_time || !slotData.end_time) {
            throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
        }

        // Helper functions to get nested data
        const getAreaById = (id) => MOCK_AREAS.find(a => a.id === id);
        const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);
        const getPetGroupById = (id) => MOCK_PET_GROUPS.find(pg => pg.id === id);
        const getServiceById = (id) => MOCK_SERVICES.find(s => s.id === id);

        // Debug logging
        console.log('🔍 Creating Slot - slotData:', slotData);
        console.log('🔍 Pet Group ID:', slotData.pet_group_id);
        console.log('🔍 Available Pet Groups:', MOCK_PET_GROUPS.map(pg => ({ id: pg.id, name: pg.name })));

        // Create new slot
        const newSlot = {
            id: generateId(),
            service_id: slotData.service_id || null,
            task_id: slotData.task_id,
            area_id: slotData.area_id || null,
            team_id: slotData.team_id || null,
            pet_group_id: slotData.pet_group_id || null,
            pet_id: slotData.pet_id || null,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            max_capacity: slotData.max_capacity || 0,
            price: slotData.price || 0,
            day_of_week: slotData.day_of_week,
            service_status: slotData.service_status || SLOT_STATUS.AVAILABLE,
            special_notes: slotData.special_notes || null,
            // Populate nested data
            pet_group: slotData.pet_group_id ? getPetGroupById(slotData.pet_group_id) : null,
            service: slotData.service_id ? getServiceById(slotData.service_id) : null,
            pet: null,
            area: slotData.area_id ? getAreaById(slotData.area_id) : null,
            team: slotData.team_id ? getTeamById(slotData.team_id) : null,
            task: null,
            customer_bookings: [],
            order_details: [],
            daily_tasks: [],
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        console.log('✅ Created Slot - pet_group:', newSlot.pet_group);

        MOCK_SLOTS.push(newSlot);

        return {
            success: true,
            data: newSlot,
            message: 'Tạo slot thành công'
        };
    },

    /**
     * Update slot
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

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId && !s.is_deleted);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Helper functions to get nested data
        const getAreaById = (id) => MOCK_AREAS.find(a => a.id === id);
        const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);
        const getPetGroupById = (id) => MOCK_PET_GROUPS.find(pg => pg.id === id);
        const getServiceById = (id) => MOCK_SERVICES.find(s => s.id === id);

        // Store old values for comparison
        const oldSlot = MOCK_SLOTS[slotIndex];
        const oldDayOfWeek = oldSlot.day_of_week;

        // Debug logging
        console.log('🔍 Updating Slot - slotId:', slotId);
        console.log('🔍 Updating Slot - updates:', updates);
        console.log('🔍 Current slot before update:', oldSlot);

        // Apply updates
        const updatedSlot = {
            ...oldSlot,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        };

        // Update nested data if IDs changed
        if (updates.area_id !== undefined) {
            updatedSlot.area = updates.area_id ? getAreaById(updates.area_id) : null;
            console.log('✅ Updated area:', updatedSlot.area);
        }
        if (updates.team_id !== undefined) {
            updatedSlot.team = updates.team_id ? getTeamById(updates.team_id) : null;
            console.log('✅ Updated team:', updatedSlot.team);
        }
        if (updates.pet_group_id !== undefined) {
            updatedSlot.pet_group = updates.pet_group_id ? getPetGroupById(updates.pet_group_id) : null;
            console.log('✅ Updated pet_group:', updatedSlot.pet_group);
        }
        if (updates.service_id !== undefined) {
            updatedSlot.service = updates.service_id ? getServiceById(updates.service_id) : null;
            console.log('✅ Updated service:', updatedSlot.service);
        }

        console.log('✅ Final updatedSlot:', updatedSlot);

        MOCK_SLOTS[slotIndex] = updatedSlot;

        // Check if day_of_week changed - if so, invalidate related daily tasks
        if (updates.day_of_week && updates.day_of_week !== oldDayOfWeek) {
            console.log(`📅 Day of week changed from ${oldDayOfWeek} to ${updates.day_of_week}`);
            console.log(`🗑️ Invalidating scheduled daily tasks for slot ${slotId}...`);

            try {
                // Use dynamic import to avoid circular dependency
                const { invalidateDailyTasksBySlot } = await import('./dailyTasksApi');
                const invalidateResult = await invalidateDailyTasksBySlot(slotId);
                console.log('✅ Invalidate result:', invalidateResult);

                return {
                    success: true,
                    data: updatedSlot,
                    message: `Cập nhật slot thành công. ${invalidateResult.message || ''}`
                };
            } catch (error) {
                console.error('❌ Error invalidating daily tasks:', error);
                // Continue anyway, slot update succeeded
            }
        }

        return {
            success: true,
            data: updatedSlot,
            message: 'Cập nhật slot thành công'
        };
    },

    /**
     * Delete slot (soft delete)
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async deleteSlot(slotId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xóa slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId && !s.is_deleted);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Soft delete
        MOCK_SLOTS[slotIndex].is_deleted = true;
        MOCK_SLOTS[slotIndex].updated_at = new Date().toISOString();
        MOCK_SLOTS[slotIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

        // Also invalidate all scheduled daily tasks for this slot
        console.log(`🗑️ Slot deleted. Invalidating scheduled daily tasks for slot ${slotId}...`);
        try {
            // Use dynamic import to avoid circular dependency
            const { invalidateDailyTasksBySlot } = await import('./dailyTasksApi');
            const invalidateResult = await invalidateDailyTasksBySlot(slotId);
            console.log('✅ Invalidate result:', invalidateResult);

            return {
                success: true,
                message: `Xóa slot thành công. ${invalidateResult.message || ''}`
            };
        } catch (error) {
            console.error('❌ Error invalidating daily tasks:', error);
            // Continue anyway, slot deletion succeeded
            return {
                success: true,
                message: 'Xóa slot thành công'
            };
        }
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

        const activeSlots = MOCK_SLOTS.filter(s => !s.is_deleted);

        const stats = {
            total: activeSlots.length,
            by_status: {
                [SLOT_STATUS.AVAILABLE]: activeSlots.filter(s => s.service_status === SLOT_STATUS.AVAILABLE).length,
                [SLOT_STATUS.UNAVAILABLE]: activeSlots.filter(s => s.service_status === SLOT_STATUS.UNAVAILABLE).length,
                [SLOT_STATUS.BOOKED]: activeSlots.filter(s => s.service_status === SLOT_STATUS.BOOKED).length,
                [SLOT_STATUS.CANCELLED]: activeSlots.filter(s => s.service_status === SLOT_STATUS.CANCELLED).length
            },
            by_day: {}
        };

        WEEKDAYS.forEach(day => {
            stats.by_day[day] = activeSlots.filter(s => s.day_of_week === day).length;
        });

        return {
            success: true,
            data: stats
        };
    }
};

// Export
export { MOCK_SLOTS };
export default slotApi;
