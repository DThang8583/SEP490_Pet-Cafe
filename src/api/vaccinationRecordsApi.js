import apiClient from '../config/config';

/**
 * Get all vaccination records from official API
 * @param {Object} params - { page_index, page_size, PetId }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllVaccinationRecords = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        PetId = null
    } = params;

    try {
        const queryParams = {
            page: page_index,
            limit: page_size
        };

        if (PetId) {
            queryParams.PetId = PetId;
        }

        const response = await apiClient.get('/vaccination-records', {
            params: queryParams,
            timeout: 10000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || {
                    total_items_count: responseData.data.length,
                    page_size,
                    total_pages_count: 1,
                    page_index,
                    has_next: false,
                    has_previous: false
                }
            };
        }

        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: {
                    total_items_count: responseData.length,
                    page_size,
                    total_pages_count: Math.ceil(responseData.length / page_size),
                    page_index,
                    has_next: (page_index + 1) * page_size < responseData.length,
                    has_previous: page_index > 0
                }
            };
        }

        return {
            data: [],
            pagination: {
                total_items_count: 0,
                page_size,
                total_pages_count: 0,
                page_index,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        console.error('Failed to fetch vaccination records from API:', error);
        return {
            data: [],
            pagination: {
                total_items_count: 0,
                page_size,
                total_pages_count: 0,
                page_index,
                has_next: false,
                has_previous: false
            }
        };
    }
};

/**
 * Get vaccination record by ID from official API
 * @param {string} recordId
 * @returns {Promise<Object>} Vaccination record object
 */
export const getVaccinationRecordById = async (recordId) => {
    try {
        const response = await apiClient.get(`/vaccination-records/${recordId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch vaccination record from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }
        throw error;
    }
};

/**
 * Create new vaccination record using official API
 * @param {Object} recordData - { pet_id, vaccine_type_id, vaccination_date, next_due_date, veterinarian, clinic_name, batch_number, notes, schedule_id }
 * @returns {Promise<Object>} Created vaccination record
 */
export const createVaccinationRecord = async (recordData) => {
    try {
        const {
            pet_id,
            vaccine_type_id,
            vaccination_date,
            next_due_date,
            veterinarian,
            clinic_name,
            batch_number,
            notes,
            schedule_id
        } = recordData;

        if (!pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }
        if (!vaccine_type_id) {
            throw new Error('Loại vaccine là bắt buộc');
        }
        if (!vaccination_date) {
            throw new Error('Ngày tiêm là bắt buộc');
        }
        if (!next_due_date) {
            throw new Error('Ngày tiêm tiếp theo là bắt buộc');
        }

        const requestData = {
            pet_id,
            vaccine_type_id,
            vaccination_date: new Date(vaccination_date).toISOString(),
            next_due_date: new Date(next_due_date).toISOString(),
            veterinarian: veterinarian?.trim() || '',
            clinic_name: clinic_name?.trim() || '',
            batch_number: batch_number?.trim() || '',
            notes: notes?.trim() || ''
        };

        // Add schedule_id if provided
        if (schedule_id) {
            requestData.schedule_id = schedule_id;
        }

        const response = await apiClient.post('/vaccination-records', requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo hồ sơ tiêm phòng thành công'
        };
    } catch (error) {
        console.error('Failed to create vaccination record:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo hồ sơ tiêm phòng';
        throw new Error(errorMessage);
    }
};

/**
 * Update vaccination record using official API
 * @param {string} recordId
 * @param {Object} recordData - { pet_id?, vaccine_type_id?, vaccination_date?, next_due_date?, veterinarian?, clinic_name?, batch_number?, notes?, schedule_id? }
 * @returns {Promise<Object>} Updated vaccination record
 */
export const updateVaccinationRecord = async (recordId, recordData) => {
    try {
        const requestData = {};

        if (recordData.pet_id !== undefined) {
            if (!recordData.pet_id) {
                throw new Error('Thú cưng là bắt buộc');
            }
            requestData.pet_id = recordData.pet_id;
        }

        if (recordData.vaccine_type_id !== undefined) {
            if (!recordData.vaccine_type_id) {
                throw new Error('Loại vaccine là bắt buộc');
            }
            requestData.vaccine_type_id = recordData.vaccine_type_id;
        }

        if (recordData.vaccination_date !== undefined) {
            if (!recordData.vaccination_date) {
                throw new Error('Ngày tiêm là bắt buộc');
            }
            requestData.vaccination_date = new Date(recordData.vaccination_date).toISOString();
        }

        if (recordData.next_due_date !== undefined) {
            if (!recordData.next_due_date) {
                throw new Error('Ngày tiêm tiếp theo là bắt buộc');
            }
            requestData.next_due_date = new Date(recordData.next_due_date).toISOString();
        }

        if (recordData.veterinarian !== undefined) {
            requestData.veterinarian = recordData.veterinarian?.trim() || '';
        }

        if (recordData.clinic_name !== undefined) {
            requestData.clinic_name = recordData.clinic_name?.trim() || '';
        }

        if (recordData.batch_number !== undefined) {
            requestData.batch_number = recordData.batch_number?.trim() || '';
        }

        if (recordData.notes !== undefined) {
            requestData.notes = recordData.notes?.trim() || '';
        }

        if (recordData.schedule_id !== undefined) {
            requestData.schedule_id = recordData.schedule_id || null;
        }

        const response = await apiClient.put(`/vaccination-records/${recordId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật hồ sơ tiêm phòng thành công'
        };
    } catch (error) {
        console.error('Failed to update vaccination record:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }
        const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ tiêm phòng';
        throw new Error(errorMessage);
    }
};

/**
 * Delete vaccination record using official API
 * @param {string} recordId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteVaccinationRecord = async (recordId) => {
    try {
        await apiClient.delete(`/vaccination-records/${recordId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa hồ sơ tiêm phòng thành công'
        };
    } catch (error) {
        console.error('Failed to delete vaccination record:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }
        throw error;
    }
};

export default {
    getAllVaccinationRecords,
    getVaccinationRecordById,
    createVaccinationRecord,
    updateVaccinationRecord,
    deleteVaccinationRecord
};

