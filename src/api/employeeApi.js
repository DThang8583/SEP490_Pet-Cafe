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
 * Get all employees from official API
 * @param {Object} params - { page_index, page_size, page (optional alias for page_index) }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllEmployees = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 999,
        page = undefined // Optional: support 'page' as alias for page_index (1-based)
    } = params;

    // Use page_index if provided, otherwise use page (convert from 1-based to 0-based)
    const actualPageIndex = page_index !== undefined && page_index !== null
        ? page_index
        : (page !== undefined && page !== null ? page - 1 : 0);

    try {
        // API uses 'page' (0-based) and 'limit' according to Swagger documentation
        const params = {
            page: actualPageIndex, // API uses 'page' (0-based), not 'page_index'
            limit: page_size, // API uses 'limit' instead of 'page_size'
            _t: Date.now()
        };

        console.log(`[getAllEmployees] Request params:`, params);

        const response = await apiClient.get('/employees', {
            params,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        const responseData = response.data;
        console.log(responseData);
        // Check if response has the expected structure: { data: [...], pagination: {...} }
        if (responseData?.data && Array.isArray(responseData.data)) {
            // Use pagination from API response if available, otherwise create one
            const apiPagination = responseData.pagination;
            if (apiPagination && typeof apiPagination === 'object') {
                return {
                    data: responseData.data,
                    pagination: {
                        total_items_count: apiPagination.total_items_count ?? responseData.data.length,
                        page_size: apiPagination.page_size ?? page_size,
                        total_pages_count: apiPagination.total_pages_count ?? Math.ceil((apiPagination.total_items_count ?? responseData.data.length) / page_size),
                        page_index: apiPagination.page_index ?? actualPageIndex,
                        has_next: apiPagination.has_next ?? false,
                        has_previous: apiPagination.has_previous ?? (actualPageIndex > 0)
                    }
                };
            }

            // Fallback: create pagination from data length
            return {
                data: responseData.data,
                pagination: createPagination(
                    responseData.data.length,
                    page_size,
                    actualPageIndex
                )
            };
        }

        // Fallback: if response is directly an array
        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: createPagination(responseData.length, page_size, actualPageIndex)
            };
        }

        // No data found
        return {
            data: [],
            pagination: createPagination(0, page_size, actualPageIndex)
        };
    } catch (error) {
        console.error('Failed to fetch employees from API:', error);

        // Re-throw error so calling code can handle it appropriately
        // Some callers might want to show error messages, others might want to use empty data
        throw error;
    }
};

/**
 * Get employee by ID from official API
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} Employee object
 */
export const getEmployeeById = async (employeeId) => {
    try {
        const response = await apiClient.get(`/employees/${employeeId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy nhân viên');
        }

        return response.data;
    } catch (error) {
        // Don't log 404 errors as they are expected in some cases
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhân viên');
        }
        // Only log non-404 errors
        console.error('Failed to fetch employee from API:', error);
        throw error;
    }
};

/**
 * Create new employee
 * @param {Object} employeeData - { full_name, phone, address, salary, skills, area_id, email, avatar_url, password, sub_role }
 * @returns {Promise<Object>} { success, data, message }
 */
export const createEmployee = async (employeeData) => {
    try {
        const response = await apiClient.post('/employees', {
            full_name: employeeData.full_name?.trim() || '',
            phone: employeeData.phone?.trim() || '',
            address: employeeData.address?.trim() || '',
            salary: parseInt(employeeData.salary) || 0,
            skills: Array.isArray(employeeData.skills) ? employeeData.skills : [],
            area_id: employeeData.area_id || null,
            email: employeeData.email?.trim() || '',
            avatar_url: employeeData.avatar_url?.trim() || '',
            password: employeeData.password?.trim() || '',
            sub_role: employeeData.sub_role?.trim() || ''
        }, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo nhân viên thành công'
        };
    } catch (error) {
        console.error('Failed to create employee:', error);
        throw error;
    }
};

/**
 * Update employee
 * @param {string} employeeId - Employee ID
 * @param {Object} employeeData - { full_name, phone, address, salary, skills, area_id, email, avatar_url, password, sub_role, is_active }
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateEmployee = async (employeeId, employeeData) => {
    try {
        const requestData = {};

        if (employeeData.full_name !== undefined) {
            requestData.full_name = employeeData.full_name?.trim() || '';
        }
        if (employeeData.phone !== undefined) {
            requestData.phone = employeeData.phone?.trim() || '';
        }
        if (employeeData.address !== undefined) {
            requestData.address = employeeData.address?.trim() || '';
        }
        if (employeeData.salary !== undefined) {
            requestData.salary = parseInt(employeeData.salary) || 0;
        }
        if (employeeData.skills !== undefined) {
            requestData.skills = Array.isArray(employeeData.skills) ? employeeData.skills : [];
        }
        if (employeeData.area_id !== undefined) {
            requestData.area_id = employeeData.area_id || null;
        }
        if (employeeData.email !== undefined) {
            requestData.email = employeeData.email?.trim() || '';
        }
        if (employeeData.avatar_url !== undefined) {
            requestData.avatar_url = employeeData.avatar_url?.trim() || '';
        }
        if (employeeData.sub_role !== undefined) {
            requestData.sub_role = employeeData.sub_role?.trim() || '';
        }
        if (employeeData.is_active !== undefined) {
            requestData.is_active = Boolean(employeeData.is_active);
        }

        // API requires password field to be present and valid
        // If password is not provided, we cannot update (API will reject empty/invalid password)
        // Caller must provide password when updating, or use a separate endpoint for status-only updates
        if (employeeData.password !== undefined && employeeData.password !== null && employeeData.password !== '') {
            requestData.password = employeeData.password.trim();
        } else {
            // If password is not provided, throw an error to inform caller
            // This prevents silent failures when password is required
            throw new Error('Password is required for employee update. Please provide a valid password or use updateEmployeeStatus for status-only updates.');
        }

        const response = await apiClient.put(`/employees/${employeeId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật nhân viên thành công'
        };
    } catch (error) {
        console.error('Failed to update employee:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhân viên');
        }
        throw error;
    }
};

/**
 * Update only employee status (is_active) without requiring password
 * This is a convenience function for toggling employee status
 * @param {string} employeeId - Employee ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateEmployeeStatus = async (employeeId, isActive) => {
    try {
        // Try PATCH method first (if API supports it)
        try {
            const response = await apiClient.patch(`/employees/${employeeId}/status`, {
                is_active: Boolean(isActive)
            }, { timeout: 10000 });

            return {
                success: true,
                data: response.data,
                message: 'Cập nhật trạng thái nhân viên thành công'
            };
        } catch (patchError) {
            // If PATCH endpoint doesn't exist, fall back to full update
            // But this requires getting current employee data and password
            console.warn('PATCH endpoint not available, falling back to PUT');
            throw patchError;
        }
    } catch (error) {
        // If status-only endpoint doesn't exist, we need to use full update
        // This requires all fields including password
        throw new Error('API không hỗ trợ cập nhật trạng thái riêng. Vui lòng sử dụng chức năng chỉnh sửa để cập nhật.');
    }
};

/**
 * Delete employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} { success, message }
 */
export const deleteEmployee = async (employeeId) => {
    try {
        await apiClient.delete(`/employees/${employeeId}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa nhân viên thành công'
        };
    } catch (error) {
        console.error('Failed to delete employee:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhân viên');
        }
        throw error;
    }
};

// Legacy function for backward compatibility
export const getEmployees = async () => {
    const response = await getAllEmployees({ page_index: 0, page_size: 1000 });
    return {
        success: true,
        data: response.data,
        pagination: response.pagination
    };
};

export default {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    getEmployees
};
