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
        // Build payload exactly as per official API specification
        // No extra validation or auto-calculation - let backend handle it
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
            is_recurring: slotData.is_recurring !== undefined ? slotData.is_recurring : !!slotData.day_of_week,
            specific_date: slotData.specific_date || null,
            day_of_week: slotData.day_of_week || null
        };

        // Add optional fields if provided
        if (slotData.price !== undefined && slotData.price !== null) {
            payload.price = slotData.price;
        }
        if (slotData.service_status) {
            payload.service_status = slotData.service_status;
        }

        try {
            console.log('[createSlot] Request payload:', payload);
            const response = await apiClient.post('/slots', payload, { timeout: 10000 });
            console.log('[createSlot] Response:', response.data);
            return { success: true, data: response.data, message: 'Tạo slot thành công' };
        } catch (error) {
            console.error('[createSlot] Error:', error);
            throw new Error(extractErrorMessage(error, 'Không thể tạo slot'));
        }
    },

    async updateSlot(slotId, updates) {
        if (!slotId) throw new Error('Slot ID là bắt buộc');

        // Build payload according to official API PUT specification
        // All fields from the API spec should be included
        const payload = {
            task_id: updates.task_id,
            area_id: updates.area_id || null,
            pet_group_id: updates.pet_group_id || null,
            team_id: updates.team_id || null,
            pet_id: updates.pet_id || null,
            start_time: updates.start_time,
            end_time: updates.end_time,
            max_capacity: updates.max_capacity ?? 0,
            special_notes: updates.special_notes || null,
            is_recurring: updates.is_recurring !== undefined ? updates.is_recurring : (updates.day_of_week ? true : false),
            specific_date: updates.specific_date || null,
            day_of_week: updates.day_of_week || null,
            price: updates.price ?? 0,
            service_status: updates.service_status || null,
            is_update_related_data: updates.is_update_related_data !== undefined ? updates.is_update_related_data : true
        };

        try {
            console.log('[updateSlot] Request slotId:', slotId, 'payload:', payload);
            const response = await apiClient.put(`/slots/${slotId}`, payload, { timeout: 10000 });
            console.log('[updateSlot] Response:', response.data);
            return { success: true, data: response.data, message: 'Cập nhật slot thành công' };
        } catch (error) {
            console.error('[updateSlot] Error:', error);
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
