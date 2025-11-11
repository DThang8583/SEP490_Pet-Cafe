import apiClient from '../config/config';
import taskTemplateApi from './taskTemplateApi';

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

// ========== HELPERS ==========

const extractErrorMessage = (error, fallback) => {
    if (error?.response?.data) {
        const { message, error: err, errors } = error.response.data;
        if (Array.isArray(message)) return message.join('. ');
        if (typeof message === 'string') return message;
        if (Array.isArray(err)) return err.join('. ');
        if (typeof err === 'string') return err;
        if (errors && typeof errors === 'object') {
            const combined = Object.values(errors).flat().join('. ');
            if (combined) return combined;
        }
    }
    return error?.message || fallback;
};

// ========== OFFICIAL API ==========

const slotApi = {
    // Because there is no dedicated "list all slots" endpoint, we aggregate via tasks
    async getAllSlots(filters = {}) {
        try {
            const tasksResp = await taskTemplateApi.getAllTaskTemplates({
                page_index: 0,
                page_size: 1000,
                _t: Date.now()
            });
            const tasks = tasksResp?.data || [];
            const allSlots = [];

            for (const t of tasks) {
                try {
                    const resp = await this.getSlotsByTaskId(t.id);
                    if (Array.isArray(resp?.data)) {
                        allSlots.push(...resp.data);
                    }
                } catch (err) {
                    // Log but don't fail entire request if one task fails
                    console.warn(`Failed to load slots for task ${t.id}:`, err.message);
                }
            }

            let slots = allSlots;
            if (filters.task_id) slots = slots.filter(s => s.task_id === filters.task_id);
            if (filters.service_id) slots = slots.filter(s => s.service_id === filters.service_id);
            if (filters.day_of_week) slots = slots.filter(s => s.day_of_week === filters.day_of_week);
            if (filters.service_status) slots = slots.filter(s => s.service_status === filters.service_status);
            if (filters.team_id) slots = slots.filter(s => s.team_id === filters.team_id);

            return {
                success: true,
                data: slots,
                pagination: {
                    total_items_count: slots.length,
                    page_size: slots.length || 0,
                    total_pages_count: 1,
                    page_index: 0,
                    has_next: false,
                    has_previous: false
                }
            };
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tải danh sách slots'));
        }
    },

    async getSlotsByTaskId(taskId) {
        if (!taskId) throw new Error('Task ID là bắt buộc');
        try {
            const response = await apiClient.get(`/tasks/${taskId}/slots`, {
                params: { _t: Date.now() },
                timeout: 10000,
                headers: { 'Cache-Control': 'no-cache' }
            });
            const slots = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data)
                    ? response.data
                    : response.data
                        ? [response.data]
                        : [];
            return { success: true, data: slots, pagination: response.data?.pagination || null };
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tải danh sách slots theo Task'));
        }
    },

    async getSlotById(slotId) {
        if (!slotId) throw new Error('Slot ID là bắt buộc');
        try {
            const response = await apiClient.get(`/slots/${slotId}`, {
                params: { _t: Date.now() },
                timeout: 10000,
                headers: { 'Cache-Control': 'no-cache' }
            });
            return { success: true, data: response.data };
        } catch (error) {
            if (error.response?.status === 404) throw new Error('Không tìm thấy slot');
            throw new Error(extractErrorMessage(error, 'Không thể tải thông tin slot'));
        }
    },

    async createSlot(slotData) {
        if (!slotData?.task_id) throw new Error('Task ID là bắt buộc');
        if (!slotData?.day_of_week && !slotData?.specific_date) throw new Error('Phải có day_of_week hoặc specific_date');
        if (!slotData?.start_time || !slotData?.end_time) throw new Error('Thiếu thời gian bắt đầu/kết thúc');

        // Determine if recurring based on day_of_week presence
        const isRecurring = !!slotData.day_of_week;

        // Calculate specific_date for recurring slots (first occurrence date)
        let specificDate = slotData.specific_date;
        if (isRecurring && !specificDate) {
            // Calculate the next occurrence of the selected day_of_week
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day
            const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const dayIndex = dayNames.indexOf(slotData.day_of_week);
            const currentDay = today.getDay();

            let daysUntilNext = dayIndex - currentDay;
            // If the day has passed this week, schedule for next week
            if (daysUntilNext <= 0) {
                daysUntilNext += 7;
            }

            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + daysUntilNext);
            // Format as local date (YYYY-MM-DD) to avoid timezone shifting
            const y = nextDate.getFullYear();
            const m = String(nextDate.getMonth() + 1).padStart(2, '0');
            const d = String(nextDate.getDate()).padStart(2, '0');
            specificDate = `${y}-${m}-${d}`;
        }

        const payload = {
            task_id: slotData.task_id,
            area_id: slotData.area_id || null,
            pet_group_id: slotData.pet_group_id || null,
            team_id: slotData.team_id || null,
            pet_id: slotData.pet_id || null,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            max_capacity: slotData.max_capacity ?? 0,
            special_notes: slotData.special_notes || null,
            is_recurring: isRecurring,
            day_of_week: isRecurring ? slotData.day_of_week : null,
            specific_date: specificDate || null
        };

        // Add optional fields
        if (slotData.price !== undefined && slotData.price !== null) {
            payload.price = slotData.price;
        }
        if (slotData.service_status) {
            payload.service_status = slotData.service_status;
        }

        try {
            const response = await apiClient.post('/slots', payload, { timeout: 10000 });
            return { success: true, data: response.data, message: 'Tạo slot thành công' };
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tạo slot'));
        }
    },

    async updateSlot(slotId, updates) {
        if (!slotId) throw new Error('Slot ID là bắt buộc');
        try {
            const response = await apiClient.put(`/slots/${slotId}`, { ...updates }, { timeout: 10000 });
            return { success: true, data: response.data, message: 'Cập nhật slot thành công' };
        } catch (error) {
            if (error.response?.status === 404) throw new Error('Không tìm thấy slot');
            throw new Error(extractErrorMessage(error, 'Không thể cập nhật slot'));
        }
    },

    async deleteSlot(slotId) {
        if (!slotId) throw new Error('Slot ID là bắt buộc');
        try {
            await apiClient.delete(`/slots/${slotId}`, { timeout: 10000 });
            return { success: true, message: 'Xóa slot thành công' };
        } catch (error) {
            if (error.response?.status === 404) throw new Error('Không tìm thấy slot');
            throw new Error(extractErrorMessage(error, 'Không thể xóa slot'));
        }
    },

    // Convenience helpers for current UI
    async publishSlot(slotId, { price }) {
        return this.updateSlot(slotId, { service_status: SLOT_STATUS.AVAILABLE, price });
    },
    async unpublishSlot(slotId) {
        return this.updateSlot(slotId, { service_status: SLOT_STATUS.UNAVAILABLE });
    }
};

export default slotApi;
