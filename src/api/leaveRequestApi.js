import apiClient from '../config/config';

/**
 * Create leave request
 * Official API: POST /api/leave-requests
 * Request: { employee_id, replacement_employee_id, leave_date, reason, leave_type }
 */
export const createLeaveRequest = async (leaveRequestData) => {
    try {
        if (!leaveRequestData.employee_id) {
            throw new Error('ID nhân viên là bắt buộc');
        }
        if (!leaveRequestData.leave_date) {
            throw new Error('Ngày nghỉ là bắt buộc');
        }
        if (!leaveRequestData.reason?.trim()) {
            throw new Error('Lý do nghỉ là bắt buộc');
        }
        if (!leaveRequestData.leave_type) {
            throw new Error('Loại nghỉ phép là bắt buộc');
        }

        const requestData = {
            employee_id: leaveRequestData.employee_id,
            replacement_employee_id: leaveRequestData.replacement_employee_id || null,
            leave_date: leaveRequestData.leave_date,
            reason: leaveRequestData.reason.trim(),
            leave_type: leaveRequestData.leave_type
        };

        const response = await apiClient.post('/leave-requests', requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Gửi đơn xin nghỉ phép thành công'
        };
    } catch (error) {
        console.error('Error creating leave request:', error);

        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                throw new Error(Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error);
            }
        }

        throw error;
    }
};

/**
 * Get leave requests
 * Official API: GET /api/leave-requests
 */
export const getLeaveRequests = async (params = {}) => {
    try {
        const { employee_id, page = 1, limit = 10 } = params;
        const queryParams = new URLSearchParams();

        if (employee_id) queryParams.append('employee_id', employee_id);
        queryParams.append('page', page);
        queryParams.append('limit', limit);

        const response = await apiClient.get(`/leave-requests?${queryParams.toString()}`, { timeout: 10000 });

        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                total_items_count: 0,
                page_size: limit,
                total_pages_count: 0,
                page_index: page - 1,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        throw error;
    }
};

