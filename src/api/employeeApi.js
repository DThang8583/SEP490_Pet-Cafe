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
 * @param {Object} params - { page_index, page_size }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllEmployees = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10
    } = params;

    try {
        const response = await apiClient.get('/employees', {
            params: {
                page_index,
                page_size
            },
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
        console.error('Failed to fetch employees from API:', error);
        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
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
        console.error('Failed to fetch employee from API:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhân viên');
        }
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
 * @param {Object} employeeData - { full_name, phone, address, salary, skills, area_id, email, avatar_url, password, sub_role }
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
        if (employeeData.password !== undefined && employeeData.password?.trim()) {
            requestData.password = employeeData.password.trim();
        }
        if (employeeData.sub_role !== undefined) {
            requestData.sub_role = employeeData.sub_role?.trim() || '';
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
    deleteEmployee,
    getEmployees
};
