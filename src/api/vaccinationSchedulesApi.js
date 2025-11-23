import apiClient from '../config/config';

/**
 * Create pagination object
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Page size
 * @param {number} pageIndex - Page index
 * @returns {Object} Pagination object
 */
const createPagination = (totalItems, pageSize, pageIndex) => ({
    total_items_count: totalItems,
    page_size: pageSize,
    total_pages_count: Math.ceil(totalItems / pageSize) || 0,
    page_index: pageIndex,
    has_next: (pageIndex + 1) * pageSize < totalItems,
    has_previous: pageIndex > 0
});

/**
 * Get all vaccination schedules from official API
 * @param {Object} params - { page_index, page_size, PetId, VaccineType, FromDate, ToDate, Status }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllVaccinationSchedules = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        PetId = null,
        VaccineType = null,
        FromDate = null,
        ToDate = null,
        Status = null
    } = params;

    try {
        const queryParams = {
            page: page_index,
            limit: page_size
        };

        if (PetId) {
            queryParams.PetId = PetId;
        }
        if (VaccineType) {
            queryParams.VaccineType = VaccineType;
        }
        if (FromDate) {
            queryParams.FromDate = FromDate;
        }
        if (ToDate) {
            queryParams.ToDate = ToDate;
        }
        if (Status) {
            queryParams.Status = Status;
        }

        const response = await apiClient.get('/vaccination-schedules', {
            params: queryParams,
            timeout: 10000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || createPagination(
                    responseData.data.length,
                    page_size,
                    page_index
                )
            };
        }

        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: createPagination(responseData.length, page_size, page_index)
            };
        }

        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    } catch (error) {
        console.error('Failed to fetch vaccination schedules from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get vaccination schedule by ID from official API
 * @param {string} scheduleId
 * @returns {Promise<Object>} Vaccination schedule object
 */
export const getVaccinationScheduleById = async (scheduleId) => {
    try {
        const response = await apiClient.get(`/vaccination-schedules/${scheduleId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy lịch tiêm');
        }

        // Debug: Log API response structure
        console.log('📡 API Response for schedule:', {
            scheduleId,
            responseData: response.data,
            has_team_id: !!response.data.team_id,
            has_team_object: !!response.data.team,
            team_id_value: response.data.team_id,
            team_object: response.data.team
        });

        return response.data;
    } catch (error) {
        console.error('Failed to fetch vaccination schedule from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy lịch tiêm');
        }
        throw error;
    }
};

/**
 * Create new vaccination schedule using official API
 * @param {Object} scheduleData - { pet_id, vaccine_type_id, scheduled_date, notes, team_id }
 * @returns {Promise<Object>} Created vaccination schedule
 */
export const createVaccinationSchedule = async (scheduleData) => {
    try {
        const { pet_id, vaccine_type_id, scheduled_date, notes, team_id } = scheduleData;

        if (!pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }
        if (!vaccine_type_id) {
            throw new Error('Loại vaccine là bắt buộc');
        }
        if (!scheduled_date) {
            throw new Error('Ngày tiêm dự kiến là bắt buộc');
        }
        if (!team_id) {
            throw new Error('Nhóm là bắt buộc');
        }

        const requestData = {
            pet_id,
            vaccine_type_id,
            scheduled_date,
            notes: notes?.trim() || '',
            team_id
        };

        const response = await apiClient.post('/vaccination-schedules', requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo lịch tiêm thành công'
        };
    } catch (error) {
        console.error('Failed to create vaccination schedule:', error);
        throw error;
    }
};

/**
 * Update vaccination schedule using official API
 * @param {string} scheduleId
 * @param {Object} scheduleData - { pet_id?, vaccine_type_id?, scheduled_date?, notes?, status?, team_id? }
 * @returns {Promise<Object>} Updated vaccination schedule
 */
export const updateVaccinationSchedule = async (scheduleId, scheduleData) => {
    try {
        const requestData = {};

        if (scheduleData.pet_id !== undefined) {
            if (!scheduleData.pet_id) {
                throw new Error('Thú cưng là bắt buộc');
            }
            requestData.pet_id = scheduleData.pet_id;
        }

        if (scheduleData.vaccine_type_id !== undefined) {
            if (!scheduleData.vaccine_type_id) {
                throw new Error('Loại vaccine là bắt buộc');
            }
            requestData.vaccine_type_id = scheduleData.vaccine_type_id;
        }

        if (scheduleData.scheduled_date !== undefined) {
            if (!scheduleData.scheduled_date) {
                throw new Error('Ngày tiêm dự kiến là bắt buộc');
            }
            requestData.scheduled_date = scheduleData.scheduled_date;
        }

        if (scheduleData.notes !== undefined) {
            requestData.notes = scheduleData.notes.trim() || '';
        }

        if (scheduleData.status !== undefined) {
            requestData.status = scheduleData.status;
        }

        if (scheduleData.team_id !== undefined) {
            // team_id is required for creating daily task, but can be null for update
            requestData.team_id = scheduleData.team_id || null;
        }

        const response = await apiClient.put(`/vaccination-schedules/${scheduleId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật lịch tiêm thành công'
        };
    } catch (error) {
        console.error('Failed to update vaccination schedule:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy lịch tiêm');
        }
        throw error;
    }
};

/**
 * Delete vaccination schedule using official API
 * @param {string} scheduleId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteVaccinationSchedule = async (scheduleId) => {
    try {
        await apiClient.delete(`/vaccination-schedules/${scheduleId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa lịch tiêm thành công'
        };
    } catch (error) {
        console.error('Failed to delete vaccination schedule:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy lịch tiêm');
        }
        throw error;
    }
};

export default {
    getAllVaccinationSchedules,
    getVaccinationScheduleById,
    createVaccinationSchedule,
    updateVaccinationSchedule,
    deleteVaccinationSchedule
};