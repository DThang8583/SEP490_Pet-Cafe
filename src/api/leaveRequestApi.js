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
        const {
            employee_id,
            employeeId,
            EmployeeId,
            page,
            limit,
            status,
            Status,
            leave_type,
            LeaveType,
            fromDate,
            FromDate,
            toDate,
            ToDate
        } = params;
        const queryParams = new URLSearchParams();

        // Support multiple possible param namings used by backend/clients.
        // Append both snake_case and PascalCase for compatibility when provided.
        const empValue = employee_id || employeeId || EmployeeId;
        if (empValue) {
            // append both forms; some server variants expect PascalCase only
            queryParams.append('EmployeeId', empValue);
            queryParams.append('employee_id', empValue);
        }

        // Optional filters
        const statusValue = status || Status;
        if (statusValue) queryParams.append('Status', statusValue);

        const leaveTypeValue = leave_type || LeaveType;
        if (leaveTypeValue) queryParams.append('LeaveType', leaveTypeValue);

        const fromValue = fromDate || FromDate;
        if (fromValue) queryParams.append('FromDate', fromValue);

        const toValue = toDate || ToDate;
        if (toValue) queryParams.append('ToDate', toValue);

        // Always send pagination params with sensible defaults so server receives explicit paging info.
        // Server expects 0-based page index.
        const pageValue = (page !== undefined && page !== null) ? page : 0;
        const limitValue = (limit !== undefined && limit !== null) ? limit : 10;
        queryParams.append('page', String(pageValue));
        queryParams.append('limit', String(limitValue));

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

/**
 * Update a leave request (approve/reject or add review notes)
 * Official API: PATCH /api/leave-requests/{id}
 */
export const updateLeaveRequest = async (id, payload = {}) => {
    try {
        if (!id) throw new Error('Missing leave request id');
        // Use PATCH to update partial fields (status, review_notes)
        const response = await apiClient.patch(`/leave-requests/${id}`, payload, { timeout: 10000 });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error updating leave request:', error);
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
 * Approve a leave request using dedicated approve endpoint
 * Official API: PUT /api/leave-requests/{id}/approve
 */
export const approveLeaveRequest = async (id, payload = {}) => {
    try {
        if (!id) throw new Error('Missing leave request id');
        const response = await apiClient.put(`/leave-requests/${id}/approve`, payload, { timeout: 10000 });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error approving leave request:', error);
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
 * Reject a leave request using dedicated reject endpoint
 * Official API: PUT /api/leave-requests/{id}/reject
 */
export const rejectLeaveRequest = async (id, payload = {}) => {
    try {
        if (!id) throw new Error('Missing leave request id');
        const response = await apiClient.put(`/leave-requests/${id}/reject`, payload, { timeout: 10000 });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error rejecting leave request:', error);
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
 * Cancel a leave request using dedicated cancel endpoint
 * Official API: PUT /api/leave-requests/{id}/cancel
 */
export const cancelLeaveRequest = async (id, payload = {}) => {
    try {
        if (!id) throw new Error('Missing leave request id');
        const response = await apiClient.put(`/leave-requests/${id}/cancel`, payload, { timeout: 10000 });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error cancelling leave request:', error);
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

