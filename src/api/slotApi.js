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
        // Validate required fields
        if (!slotData.task_id) {
            throw new Error('Task ID là bắt buộc');
        }

        // Validate task_id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof slotData.task_id !== 'string' || !uuidRegex.test(slotData.task_id.trim())) {
            throw new Error('Task ID phải là UUID hợp lệ');
        }

        if (!slotData.start_time) {
            throw new Error('Giờ bắt đầu là bắt buộc');
        }
        if (!slotData.end_time) {
            throw new Error('Giờ kết thúc là bắt buộc');
        }
        if (slotData.is_recurring === undefined && !slotData.day_of_week && !slotData.specific_date) {
            throw new Error('Phải có day_of_week hoặc specific_date');
        }

        // Process specific_date: ensure it's ISO datetime string or null
        let processedSpecificDate = null;
        if (slotData.specific_date) {
            if (typeof slotData.specific_date === 'string') {
                // If already in ISO format, use as is
                if (slotData.specific_date.includes('T') && (slotData.specific_date.includes('Z') || slotData.specific_date.includes('+'))) {
                    processedSpecificDate = slotData.specific_date;
                } else if (slotData.specific_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // If just date (YYYY-MM-DD), convert to ISO datetime
                    const date = new Date(slotData.specific_date + 'T00:00:00.000Z');
                    processedSpecificDate = date.toISOString();
                } else {
                    processedSpecificDate = slotData.specific_date;
                }
            }
        }

        // Process is_recurring: use provided value or infer from day_of_week
        const isRecurring = slotData.is_recurring !== undefined
            ? Boolean(slotData.is_recurring)
            : !!slotData.day_of_week;

        // Helper function to ensure UUID fields are null (not empty string) if not provided
        const ensureUUIDOrNull = (value) => {
            // Handle null, undefined, empty string, or whitespace-only string
            if (value === null || value === undefined) return null;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
                // Check if it's a valid UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(trimmed)) {
                    return trimmed;
                }
            }
            // For non-string values, try to convert and validate
            const strValue = String(value).trim();
            if (strValue === '' || strValue === 'null' || strValue === 'undefined') return null;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(strValue)) {
                return strValue;
            }
            return null;
        };

        // Ensure UUID fields are null (not empty string) if not provided
        const payload = {
            task_id: slotData.task_id.trim(), // Required, UUID string (already validated above)
            area_id: ensureUUIDOrNull(slotData.area_id),
            pet_group_id: ensureUUIDOrNull(slotData.pet_group_id),
            team_id: ensureUUIDOrNull(slotData.team_id),
            pet_id: ensureUUIDOrNull(slotData.pet_id),
            start_time: typeof slotData.start_time === 'string' ? slotData.start_time.trim() : String(slotData.start_time), // Required, "HH:mm:ss" format
            end_time: typeof slotData.end_time === 'string' ? slotData.end_time.trim() : String(slotData.end_time), // Required, "HH:mm:ss" format
            max_capacity: typeof slotData.max_capacity === 'number' ? slotData.max_capacity : (parseInt(slotData.max_capacity) || 0), // Required, number >= 0
            special_notes: (slotData.special_notes && typeof slotData.special_notes === 'string' && slotData.special_notes.trim()) ? slotData.special_notes.trim() : null,
            is_recurring: isRecurring, // Required, boolean
            day_of_week: (slotData.day_of_week && typeof slotData.day_of_week === 'string' && slotData.day_of_week.trim()) ? slotData.day_of_week.trim() : null,
            specific_date: processedSpecificDate // Optional, ISO datetime string or null
        };

        // Add optional fields if provided
        if (slotData.price !== undefined && slotData.price !== null) {
            payload.price = slotData.price;
        }
        if (slotData.service_status) {
            payload.service_status = slotData.service_status;
        }

        // Final validation: ensure no empty strings in UUID fields (double check)
        const finalPayload = {
            ...payload,
            area_id: payload.area_id === '' || payload.area_id === undefined ? null : payload.area_id,
            pet_group_id: payload.pet_group_id === '' || payload.pet_group_id === undefined ? null : payload.pet_group_id,
            team_id: payload.team_id === '' || payload.team_id === undefined ? null : payload.team_id,
            pet_id: payload.pet_id === '' || payload.pet_id === undefined ? null : payload.pet_id
        };

        try {
            console.log('[createSlot] Request payload (final):', JSON.stringify(finalPayload, null, 2));
            console.log('[createSlot] Time format check:', {
                start_time: { value: finalPayload.start_time, length: finalPayload.start_time?.length, format: finalPayload.start_time?.match(/^\d{2}:\d{2}:\d{2}$/) ? 'HH:mm:ss' : 'INVALID' },
                end_time: { value: finalPayload.end_time, length: finalPayload.end_time?.length, format: finalPayload.end_time?.match(/^\d{2}:\d{2}:\d{2}$/) ? 'HH:mm:ss' : 'INVALID' }
            });
            console.log('[createSlot] UUID fields check:', {
                area_id: { value: finalPayload.area_id, type: typeof finalPayload.area_id, isNull: finalPayload.area_id === null },
                pet_group_id: { value: finalPayload.pet_group_id, type: typeof finalPayload.pet_group_id, isNull: finalPayload.pet_group_id === null },
                team_id: { value: finalPayload.team_id, type: typeof finalPayload.team_id, isNull: finalPayload.team_id === null },
                pet_id: { value: finalPayload.pet_id, type: typeof finalPayload.pet_id, isNull: finalPayload.pet_id === null }
            });
            console.log('[createSlot] Recurring fields check:', {
                is_recurring: { value: finalPayload.is_recurring, type: typeof finalPayload.is_recurring },
                day_of_week: { value: finalPayload.day_of_week, type: typeof finalPayload.day_of_week, isNull: finalPayload.day_of_week === null },
                specific_date: { value: finalPayload.specific_date, type: typeof finalPayload.specific_date, isNull: finalPayload.specific_date === null, isISO: finalPayload.specific_date?.includes('T') }
            });

            const response = await apiClient.post('/slots', finalPayload, { timeout: 15000 });
            console.log('[createSlot] Response:', response.data);
            return { success: true, data: response.data, message: 'Tạo slot thành công' };
        } catch (error) {
            console.error('[createSlot] ❌ ERROR:', error.message);
            console.error('[createSlot] Error status:', error.response?.status);
            console.error('[createSlot] Error data:', JSON.stringify(error.response?.data, null, 2));
            console.error('[createSlot] Sent payload:', JSON.stringify(finalPayload, null, 2));

            // Enhanced error message with details
            let errorMsg = extractErrorMessage(error, 'Không thể tạo slot');
            if (error.response?.status === 400) {
                console.error('[createSlot] 400 Bad Request - Check the error data above for details');
                if (error.response?.data) {
                    errorMsg = `Dữ liệu không hợp lệ: ${errorMsg}`;
                }
            }
            throw new Error(errorMsg);
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
        // Fetch current slot data first to preserve all fields
        const currentSlot = await this.getSlotById(slotId);
        if (!currentSlot.success) {
            throw new Error('Không tìm thấy slot');
        }

        const slot = currentSlot.data;

        // Build complete update payload with all required fields
        return this.updateSlot(slotId, {
            task_id: slot.task_id,
            area_id: slot.area_id || null,
            pet_group_id: slot.pet_group_id || null,
            team_id: slot.team_id || null,
            pet_id: slot.pet_id || null,
            start_time: slot.start_time,
            end_time: slot.end_time,
            max_capacity: slot.max_capacity ?? 0,
            special_notes: slot.special_notes || null,
            is_recurring: slot.is_recurring !== undefined ? slot.is_recurring : (slot.day_of_week ? true : false),
            specific_date: slot.specific_date || null,
            day_of_week: slot.day_of_week || null,
            price: price !== undefined ? price : (slot.price ?? 0),
            service_status: 'AVAILABLE', // Set to AVAILABLE for publishing
            is_update_related_data: true
        });
    },
    async unpublishSlot(slotId) {
        // Fetch current slot data first to preserve all fields
        const currentSlot = await this.getSlotById(slotId);
        if (!currentSlot.success) {
            throw new Error('Không tìm thấy slot');
        }

        const slot = currentSlot.data;

        // Build complete update payload with all required fields
        return this.updateSlot(slotId, {
            task_id: slot.task_id,
            area_id: slot.area_id || null,
            pet_group_id: slot.pet_group_id || null,
            team_id: slot.team_id || null,
            pet_id: slot.pet_id || null,
            start_time: slot.start_time,
            end_time: slot.end_time,
            max_capacity: slot.max_capacity ?? 0,
            special_notes: slot.special_notes || null,
            is_recurring: slot.is_recurring !== undefined ? slot.is_recurring : (slot.day_of_week ? true : false),
            specific_date: slot.specific_date || null,
            day_of_week: slot.day_of_week || null,
            price: slot.price ?? 0,
            service_status: 'UNAVAILABLE', // Set to UNAVAILABLE for unpublishing
            is_update_related_data: true
        });
    }
};

export default slotApi;
