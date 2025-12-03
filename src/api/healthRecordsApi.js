import apiClient from '../config/config';

/**
 * Create new health record using official API
 * @param {Object} recordData - { pet_id, check_date, weight, temperature, health_status, symptoms, treatment, veterinarian, next_check_date, notes }
 * @returns {Promise<Object>} Created health record
 */
export const createHealthRecord = async (recordData) => {
    try {
        const {
            pet_id,
            check_date,
            weight,
            temperature,
            health_status,
            symptoms,
            treatment,
            veterinarian,
            next_check_date,
            notes
        } = recordData;

        if (!pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }
        if (!check_date) {
            throw new Error('Ngày kiểm tra là bắt buộc');
        }

        const requestData = {
            pet_id,
            check_date: new Date(check_date).toISOString(),
            weight: weight || 0,
            temperature: temperature || 0,
            health_status: health_status?.trim() || '',
            symptoms: symptoms?.trim() || '',
            treatment: treatment?.trim() || '',
            veterinarian: veterinarian?.trim() || '',
            next_check_date: next_check_date ? new Date(next_check_date).toISOString() : null,
            notes: notes?.trim() || ''
        };

        const response = await apiClient.post('/health-records', requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo hồ sơ sức khỏe thành công'
        };
    } catch (error) {
        console.error('Failed to create health record:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo hồ sơ sức khỏe';
        throw new Error(errorMessage);
    }
};

/**
 * Get health record by ID from official API
 * @param {string} recordId
 * @returns {Promise<Object>} Health record object
 */
export const getHealthRecordById = async (recordId) => {
    try {
        const response = await apiClient.get(`/health-records/${recordId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy hồ sơ sức khỏe');
        }

        return response.data;
    } catch (error) {
        console.error('Failed to fetch health record from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy hồ sơ sức khỏe');
        }
        throw error;
    }
};

/**
 * Update health record using official API
 * @param {string} recordId
 * @param {Object} recordData - { pet_id, check_date, weight, temperature, health_status, symptoms, treatment, veterinarian, next_check_date, notes }
 * @returns {Promise<Object>} Updated health record
 */
export const updateHealthRecord = async (recordId, recordData) => {
    try {
        const {
            pet_id,
            check_date,
            weight,
            temperature,
            health_status,
            symptoms,
            treatment,
            veterinarian,
            next_check_date,
            notes
        } = recordData;

        if (!pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }
        if (!check_date) {
            throw new Error('Ngày kiểm tra là bắt buộc');
        }

        const requestData = {
            pet_id,
            check_date: new Date(check_date).toISOString(),
            weight: weight || 0,
            temperature: temperature || 0,
            health_status: health_status?.trim() || '',
            symptoms: symptoms?.trim() || '',
            treatment: treatment?.trim() || '',
            veterinarian: veterinarian?.trim() || '',
            next_check_date: next_check_date ? new Date(next_check_date).toISOString() : null,
            notes: notes?.trim() || ''
        };

        const response = await apiClient.put(`/health-records/${recordId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật hồ sơ sức khỏe thành công'
        };
    } catch (error) {
        console.error('Failed to update health record:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ sức khỏe';
        throw new Error(errorMessage);
    }
};

