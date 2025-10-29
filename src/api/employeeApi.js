import { MOCK_EMPLOYEES } from './mockData';

// Delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock getCurrentUser
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser'); // ✅ FIX: Đổi 'user' thành 'currentUser'
    return user ? JSON.parse(user) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;
    // Check both user.role and user.account.role for compatibility
    const role = user.role || user.account?.role;
    // Case-insensitive check for MANAGER role
    if (role && role.toUpperCase() === 'MANAGER') return true;
    return false;
};

// Generate ID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Get all employees (chỉ WORKING_STAFF và SALE_STAFF, không bao gồm MANAGER)
 */
export const getEmployees = async () => {
    await delay(500);
    const currentUser = getCurrentUser();

    // Debug: Log user info
    console.log('🔍 [Employee API] Current User:', currentUser);
    console.log('🔍 [Employee API] User Role:', currentUser?.role || currentUser?.account?.role);

    if (!checkPermission(currentUser, 'staff_management')) {
        console.error('❌ [Employee API] Permission Denied for user:', currentUser);
        throw new Error('Không có quyền truy cập');
    }

    console.log('✅ [Employee API] Permission Granted');

    // Return employees with account data (for list view)
    const employees = MOCK_EMPLOYEES.map(emp => ({
        ...emp,
        account: emp.account // Include account in list
    }));

    return {
        success: true,
        data: employees,
        pagination: {
            total_items_count: employees.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get employee detail by ID
 */
export const getEmployeeById = async (id) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'staff_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const employee = MOCK_EMPLOYEES.find(emp => emp.id === id);
    if (!employee) {
        throw new Error('Không tìm thấy nhân viên');
    }

    // Return employee with account = null (match API detail structure)
    return {
        success: true,
        data: {
            ...employee,
            account: null // Detail view has account = null
        }
    };
};

/**
 * Create new employee
 */
export const createEmployee = async (employeeData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'staff_management')) {
        throw new Error('Không có quyền tạo nhân viên');
    }

    // Validation
    if (!employeeData.full_name) throw new Error('Họ tên là bắt buộc');
    if (!employeeData.email) throw new Error('Email là bắt buộc');
    if (!employeeData.phone) throw new Error('Số điện thoại là bắt buộc');
    if (!employeeData.sub_role) throw new Error('Loại nhân viên là bắt buộc');
    if (!employeeData.password) throw new Error('Mật khẩu là bắt buộc');

    const newEmployeeId = generateId();
    const newAccountId = generateId();

    const newEmployee = {
        id: newEmployeeId,
        account_id: newAccountId,
        full_name: employeeData.full_name,
        avatar_url: employeeData.avatar_url || '',
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address || '',
        skills: employeeData.skills || [],
        salary: employeeData.salary || 0,
        sub_role: employeeData.sub_role,
        account: {
            username: employeeData.full_name,
            email: employeeData.email,
            password_hash: `$2a$12$${Math.random().toString(36)}`, // Mock hash
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: newAccountId,
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    // Add to mock database
    MOCK_EMPLOYEES.push(newEmployee);

    return {
        success: true,
        data: newEmployee,
        message: 'Tạo nhân viên thành công'
    };
};

/**
 * Update employee
 */
export const updateEmployee = async (id, employeeData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'staff_management')) {
        throw new Error('Không có quyền cập nhật nhân viên');
    }

    const employeeIndex = MOCK_EMPLOYEES.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) {
        throw new Error('Không tìm thấy nhân viên');
    }

    const employee = MOCK_EMPLOYEES[employeeIndex];

    // Update employee data
    const updatedEmployee = {
        ...employee,
        full_name: employeeData.full_name !== undefined ? employeeData.full_name : employee.full_name,
        avatar_url: employeeData.avatar_url !== undefined ? employeeData.avatar_url : employee.avatar_url,
        email: employeeData.email !== undefined ? employeeData.email : employee.email,
        phone: employeeData.phone !== undefined ? employeeData.phone : employee.phone,
        address: employeeData.address !== undefined ? employeeData.address : employee.address,
        skills: employeeData.skills !== undefined ? employeeData.skills : employee.skills,
        salary: employeeData.salary !== undefined ? employeeData.salary : employee.salary,
        sub_role: employeeData.sub_role !== undefined ? employeeData.sub_role : employee.sub_role,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        account: {
            ...employee.account,
            username: employeeData.full_name || employee.full_name,
            email: employeeData.email || employee.email,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        }
    };

    // Update password if provided
    if (employeeData.password) {
        updatedEmployee.account.password_hash = `$2a$12$${Math.random().toString(36)}`; // Mock hash
    }

    MOCK_EMPLOYEES[employeeIndex] = updatedEmployee;

    return {
        success: true,
        data: updatedEmployee,
        message: 'Cập nhật nhân viên thành công'
    };
};

/**
 * Delete employee
 */
export const deleteEmployee = async (id) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'staff_management')) {
        throw new Error('Không có quyền xóa nhân viên');
    }

    const employeeIndex = MOCK_EMPLOYEES.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) {
        throw new Error('Không tìm thấy nhân viên');
    }

    // Soft delete
    MOCK_EMPLOYEES[employeeIndex].is_deleted = true;
    MOCK_EMPLOYEES[employeeIndex].updated_at = new Date().toISOString();
    MOCK_EMPLOYEES[employeeIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa nhân viên thành công'
    };
};

export default {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
};

