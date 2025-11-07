// ========== MOCK EMPLOYEES ==========
// Seed a small in-memory dataset so manager pages are not empty on first load
const MOCK_EMPLOYEES = [
    {
        id: 'emp-001',
        account_id: 'acc-001',
        full_name: 'Nguyễn Văn A',
        avatar_url: '',
        email: 'a.nguyen@example.com',
        phone: '0901000001',
        address: 'Hà Nội',
        skills: ['Giao tiếp', 'Bán hàng'],
        salary: 7000000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'nguyenvana',
            email: 'a.nguyen@example.com',
            password_hash: '$2a$12$seedA',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-001',
            created_at: new Date().toISOString(),
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-002',
        account_id: 'acc-002',
        full_name: 'Trần Thị B',
        avatar_url: '',
        email: 'b.tran@example.com',
        phone: '0901000002',
        address: 'TP. Hồ Chí Minh',
        skills: ['Chăm sóc thú cưng', 'Vệ sinh'],
        salary: 6500000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'tranthib',
            email: 'b.tran@example.com',
            password_hash: '$2a$12$seedB',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-002',
            created_at: new Date().toISOString(),
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-003',
        account_id: 'acc-003',
        full_name: 'Lê Văn C',
        avatar_url: '',
        email: 'c.le@example.com',
        phone: '0901000003',
        address: 'Đà Nẵng',
        skills: ['Pha chế', 'Bán đồ uống'],
        salary: 6000000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'levanc',
            email: 'c.le@example.com',
            password_hash: '$2a$12$seedC',
            role: 'EMPLOYEE',
            is_active: false,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-003',
            created_at: new Date().toISOString(),
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    },
    // ===== Additional seeded employees to satisfy teamApi references =====
    { id: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff', account_id: 'acc-lead-01', full_name: 'Phạm Quang Leader 1', avatar_url: '', email: 'leader1@example.com', phone: '0901000101', address: 'Hà Nội', skills: ['Quản lý nhóm', 'Mèo'], salary: 9000000, sub_role: 'WORKING_STAFF', account: { username: 'lead1', email: 'leader1@example.com', password_hash: '$2a$12$lead1', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-01', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '48a7e46b-8542-4738-9e6c-dfa8e19fbd60', account_id: 'acc-lead-02', full_name: 'Đỗ Minh Leader 2', avatar_url: '', email: 'leader2@example.com', phone: '0901000102', address: 'TP. Hồ Chí Minh', skills: ['Pha chế', 'Bán hàng'], salary: 8800000, sub_role: 'SALE_STAFF', account: { username: 'lead2', email: 'leader2@example.com', password_hash: '$2a$12$lead2', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-02', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '5d789abc-1234-5678-9abc-def123456789', account_id: 'acc-lead-03', full_name: 'Bùi Khánh Leader 3', avatar_url: '', email: 'leader3@example.com', phone: '0901000103', address: 'Đà Nẵng', skills: ['Huấn luyện chó'], salary: 8700000, sub_role: 'WORKING_STAFF', account: { username: 'lead3', email: 'leader3@example.com', password_hash: '$2a$12$lead3', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-03', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '6e890bcd-2345-6789-abcd-ef0123456790', account_id: 'acc-lead-04', full_name: 'Ngô Trâm Leader 4', avatar_url: '', email: 'leader4@example.com', phone: '0901000104', address: 'Cần Thơ', skills: ['Grooming'], salary: 8600000, sub_role: 'WORKING_STAFF', account: { username: 'lead4', email: 'leader4@example.com', password_hash: '$2a$12$lead4', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-04', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '7f901cde-3456-789a-bcde-f01234567891', account_id: 'acc-lead-05', full_name: 'Trịnh Anh Leader 5', avatar_url: '', email: 'leader5@example.com', phone: '0901000105', address: 'Hải Phòng', skills: ['Phục vụ VIP'], salary: 9000000, sub_role: 'SALE_STAFF', account: { username: 'lead5', email: 'leader5@example.com', password_hash: '$2a$12$lead5', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-05', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '8g012def-4567-89ab-cdef-012345678902', account_id: 'acc-lead-06', full_name: 'Phan Việt Leader 6', avatar_url: '', email: 'leader6@example.com', phone: '0901000106', address: 'Huế', skills: ['Sân vườn'], salary: 8200000, sub_role: 'WORKING_STAFF', account: { username: 'lead6', email: 'leader6@example.com', password_hash: '$2a$12$lead6', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-06', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '9h123efg-5678-9abc-def0-123456789013', account_id: 'acc-lead-07', full_name: 'Lưu Hạnh Leader 7', avatar_url: '', email: 'leader7@example.com', phone: '0901000107', address: 'Nha Trang', skills: ['CSKH'], salary: 8300000, sub_role: 'SALE_STAFF', account: { username: 'lead7', email: 'leader7@example.com', password_hash: '$2a$12$lead7', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-lead-07', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    // Referenced team member IDs
    { id: '6c899348-3038-45cb-b49e-48a5f498584f', account_id: 'acc-mem-01', full_name: 'Thành Viên A', avatar_url: '', email: 'membera@example.com', phone: '0901000201', address: 'Hà Nội', skills: ['Mèo'], salary: 6000000, sub_role: 'WORKING_STAFF', account: { username: 'membera', email: 'membera@example.com', password_hash: '$2a$12$mema', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-01', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '4474a3ef-9bb2-49fd-8904-86ff6b03a40c', account_id: 'acc-mem-02', full_name: 'Thành Viên B', avatar_url: '', email: 'memberb@example.com', phone: '0901000202', address: 'Hà Nội', skills: ['Bán hàng'], salary: 6200000, sub_role: 'SALE_STAFF', account: { username: 'memberb', email: 'memberb@example.com', password_hash: '$2a$12$memb', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-02', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '0i234fgh-6789-abcd-ef01-234567890124', account_id: 'acc-mem-03', full_name: 'Thành Viên C', avatar_url: '', email: 'memberc@example.com', phone: '0901000203', address: 'Hà Nội', skills: ['Dắt chó'], salary: 5900000, sub_role: 'WORKING_STAFF', account: { username: 'memberc', email: 'memberc@example.com', password_hash: '$2a$12$memc', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-03', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '1j345ghi-789a-bcde-f012-345678901235', account_id: 'acc-mem-04', full_name: 'Thành Viên D', avatar_url: '', email: 'memberd@example.com', phone: '0901000204', address: 'Hà Nội', skills: ['Chăm sóc chó'], salary: 6000000, sub_role: 'WORKING_STAFF', account: { username: 'memberd', email: 'memberd@example.com', password_hash: '$2a$12$memd', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-04', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '2k456hij-89ab-cdef-0123-456789012346', account_id: 'acc-mem-05', full_name: 'Thành Viên E', avatar_url: '', email: 'membere@example.com', phone: '0901000205', address: 'Hà Nội', skills: ['Grooming'], salary: 6100000, sub_role: 'WORKING_STAFF', account: { username: 'membere', email: 'membere@example.com', password_hash: '$2a$12$meme', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-05', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '3l567ijk-9abc-def0-1234-567890123457', account_id: 'acc-mem-06', full_name: 'Thành Viên F', avatar_url: '', email: 'memberf@example.com', phone: '0901000206', address: 'Hà Nội', skills: ['Spa thú cưng'], salary: 6050000, sub_role: 'WORKING_STAFF', account: { username: 'memberf', email: 'memberf@example.com', password_hash: '$2a$12$memf', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-06', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: '4m678jkl-abcd-ef01-2345-678901234568', account_id: 'acc-mem-07', full_name: 'Thành Viên G', avatar_url: '', email: 'memberg@example.com', phone: '0901000207', address: 'Hà Nội', skills: ['Phục vụ VIP'], salary: 6400000, sub_role: 'SALE_STAFF', account: { username: 'memberg', email: 'memberg@example.com', password_hash: '$2a$12$memg', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-07', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: 'emp-ws-1', account_id: 'acc-mem-08', full_name: 'Working Staff 1', avatar_url: '', email: 'ws1@example.com', phone: '0901000208', address: 'Hà Nội', skills: ['Shift Morning'], salary: 5800000, sub_role: 'WORKING_STAFF', account: { username: 'ws1', email: 'ws1@example.com', password_hash: '$2a$12$ws1', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-08', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: 'emp-ws-2', account_id: 'acc-mem-09', full_name: 'Working Staff 2', avatar_url: '', email: 'ws2@example.com', phone: '0901000209', address: 'Hà Nội', skills: ['Shift Afternoon'], salary: 5850000, sub_role: 'WORKING_STAFF', account: { username: 'ws2', email: 'ws2@example.com', password_hash: '$2a$12$ws2', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-09', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: 'emp-ws-3', account_id: 'acc-mem-10', full_name: 'Working Staff 3', avatar_url: '', email: 'ws3@example.com', phone: '0901000210', address: 'Hà Nội', skills: ['Shift Evening'], salary: 5900000, sub_role: 'WORKING_STAFF', account: { username: 'ws3', email: 'ws3@example.com', password_hash: '$2a$12$ws3', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-10', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: 'emp-sale-1', account_id: 'acc-mem-11', full_name: 'Sale Staff 1', avatar_url: '', email: 'sale1@example.com', phone: '0901000211', address: 'Hà Nội', skills: ['Bán hàng'], salary: 6200000, sub_role: 'SALE_STAFF', account: { username: 'sale1', email: 'sale1@example.com', password_hash: '$2a$12$sale1', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-11', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false },
    { id: 'emp-sale-2', account_id: 'acc-mem-12', full_name: 'Sale Staff 2', avatar_url: '', email: 'sale2@example.com', phone: '0901000212', address: 'Hà Nội', skills: ['CSKH'], salary: 6250000, sub_role: 'SALE_STAFF', account: { username: 'sale2', email: 'sale2@example.com', password_hash: '$2a$12$sale2', role: 'EMPLOYEE', is_active: true, customer: null, employee: null, notifications: [], id: 'acc-mem-12', created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }, team_members: [], orders: [], daily_schedules: [], created_at: new Date().toISOString(), created_by: '00000000-0000-0000-0000-000000000000', updated_at: new Date().toISOString(), updated_by: null, is_deleted: false }
];

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

export { MOCK_EMPLOYEES };

