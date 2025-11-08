// Note: MOCK_WORK_TYPES removed - use workTypeApi.getWorkTypeById() for API calls
import { getWorkTypeById as getWorkTypeByIdFromAPI } from './workTypeApi';
import { MOCK_WORK_SHIFTS } from './workShiftApi';
import { getEmployeeById as getEmployeeByIdFromAPI, getAllEmployees as getAllEmployeesFromAPI } from './employeeApi';

// Employee cache to avoid multiple API calls
let employeeCache = new Map();
let allEmployeesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get employee from cache or API
const getEmployeeById = async (id) => {
    if (!id) return null;

    // Check cache first
    if (employeeCache.has(id)) {
        return employeeCache.get(id);
    }

    // If we have all employees cache, check there
    if (allEmployeesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        const employee = allEmployeesCache.find(e => e.id === id);
        if (employee) {
            employeeCache.set(id, employee);
            return employee;
        }
    }

    // Fetch from API
    try {
        const employee = await getEmployeeByIdFromAPI(id);
        if (employee) {
            employeeCache.set(id, employee);
            return employee;
        }
    } catch (error) {
        console.error(`Failed to fetch employee ${id}:`, error);
        return null;
    }

    return null;
};

// Load all employees into cache
const loadAllEmployeesToCache = async () => {
    try {
        const response = await getAllEmployeesFromAPI({ page_index: 0, page_size: 1000 });
        if (response && response.data) {
            allEmployeesCache = response.data;
            cacheTimestamp = Date.now();
            // Populate individual cache
            response.data.forEach(emp => {
                employeeCache.set(emp.id, emp);
            });
        }
    } catch (error) {
        console.error('Failed to load employees to cache:', error);
    }
};

// ========== TEAM MOCK DATA (moved from mockData) ==========
const MOCK_TEAMS = [
    {
        id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        name: 'Nhóm Chăm Sóc Khu Vực Mèo',
        description: 'Nhóm chuyên trách quản lý khu vực mèo, đảm bảo vệ sinh chuồng trại, cung cấp thức ăn, nước uống và chăm sóc sức khỏe ban đầu cho các bé mèo.',
        leader_id: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-27T13:01:10.340811+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:01:10.340811+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        name: 'Nhóm Bán Hàng & Đồ Uống',
        description: 'Nhóm quản lý quầy bar và quầy bán lẻ, chịu trách nhiệm pha chế đồ uống, bán hàng, thu ngân và kiểm soát hàng tồn kho cho các mặt hàng tiêu dùng và quà lưu niệm.',
        leader_id: '48a7e46b-8542-4738-9e6c-dfa8e19fbd60',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-27T13:03:17.644603+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:03:17.644603+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        name: 'Nhóm Chăm Sóc Khu Vực Chó',
        description: 'Nhóm chuyên trách quản lý khu vực chó, giám sát an toàn, huấn luyện cơ bản, cho ăn và đảm bảo vệ sinh trong khu vực sinh hoạt của chó. Quản lý tương tác giữa chó và khách hàng.',
        leader_id: '5d789abc-1234-5678-9abc-def123456789',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901',
        name: 'Nhóm Chăm Sóc & Làm Đẹp',
        description: 'Nhóm chuyên nghiệp về chăm sóc và làm đẹp cho thú cưng, bao gồm tắm rửa, cắt tỉa lông, vệ sinh tai, cắt móng và các dịch vụ spa cao cấp.',
        leader_id: '6e890bcd-2345-6789-abcd-ef0123456790',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:15:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:15:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'c3d4e5f6-a7b8-4901-c234-def567890123',
        name: 'Nhóm Phục Vụ VIP',
        description: 'Nhóm chuyên phục vụ khu vực VIP và khách hàng cao cấp, đảm bảo trải nghiệm đặc biệt với dịch vụ tận tâm, chu đáo và riêng tư.',
        leader_id: '7f901cde-3456-789a-bcde-f01234567891',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345',
        name: 'Nhóm Quản Lý Sân Vườn',
        description: 'Nhóm quản lý sân vườn ngoài trời, chăm sóc cây xanh, duy trì vệ sinh khu vực ngoài trời và đảm bảo an toàn cho thú cưng và khách hàng.',
        leader_id: '8g012def-4567-89ab-cdef-012345678902',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:45:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:45:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'e5f6a7b8-c9d0-4123-e456-f78901234567',
        name: 'Nhóm Chăm Sóc Khách Hàng',
        description: 'Nhóm chăm sóc khách hàng, tiếp đón, hướng dẫn và giải đáp thắc mắc. Xử lý booking, thanh toán và đảm bảo sự hài lòng của khách hàng.',
        leader_id: '9h123efg-5678-9abc-def0-123456789013',
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

const MOCK_TEAM_MEMBERS = [
    {
        id: '50a63c58-2691-4208-a451-8ee3eed0b9c8',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        employee_id: '6c899348-3038-45cb-b49e-48a5f498584f',
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:18.491285+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:18.491285+00:00',
        updated_by: null,
        is_deleted: false
    },
    { id: 'tm-cat-2', team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', employee_id: 'emp-ws-1', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:20.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:20.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-cat-3', team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', employee_id: 'emp-ws-2', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:22.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:22.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-sales-1', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', employee_id: '4474a3ef-9bb2-49fd-8904-86ff6b03a40c', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:25.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:25.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-sales-2', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', employee_id: 'emp-sale-1', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:30.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:30.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-sales-3', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', employee_id: 'emp-sale-2', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:32.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:32.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-sales-4', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', employee_id: 'emp-ws-3', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-27T13:05:34.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:05:34.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-dog-1', team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', employee_id: '0i234fgh-6789-abcd-ef01-234567890124', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:05:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:05:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-dog-2', team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', employee_id: '1j345ghi-789a-bcde-f012-345678901235', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:06:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:06:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-groom-1', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', employee_id: '2k456hij-89ab-cdef-0123-456789012346', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:20:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:20:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-groom-2', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', employee_id: '3l567ijk-9abc-def0-1234-567890123457', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:21:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:21:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-vip-1', team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', employee_id: '4m678jkl-abcd-ef01-2345-678901234568', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:35:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:35:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-vip-2', team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', employee_id: 'emp-sale-1', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:36:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:36:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-outdoor-1', team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', employee_id: 'emp-ws-1', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:50:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:50:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-outdoor-2', team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', employee_id: 'emp-ws-2', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T08:51:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:51:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-cs-1', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', employee_id: 'emp-sale-2', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T09:05:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:05:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tm-cs-2', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', employee_id: '6c899348-3038-45cb-b49e-48a5f498584f', is_active: true, team: null, employee: null, daily_schedules: [], created_at: '2025-10-28T09:06:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:06:00.000000+00:00', updated_by: null, is_deleted: false }
];

const MOCK_TEAM_WORK_TYPES = [
    { id: 'twt-1', team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', team: null, work_type: null, created_at: '2025-10-27T13:01:10.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:01:10.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-2', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', team: null, work_type: null, created_at: '2025-10-27T13:03:17.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:03:17.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-3', team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45', team: null, work_type: null, created_at: '2025-10-28T08:00:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:00:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-4', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', team: null, work_type: null, created_at: '2025-10-28T08:15:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:15:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-5', team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', team: null, work_type: null, created_at: '2025-10-28T08:30:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:30:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-6', team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', team: null, work_type: null, created_at: '2025-10-28T08:45:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:45:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'twt-7', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', team: null, work_type: null, created_at: '2025-10-28T09:00:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:00:00.000000+00:00', updated_by: null, is_deleted: false }
];

const MOCK_TEAM_WORK_SHIFTS = [
    { id: 'tws-1', team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', team: null, work_shift: null, created_at: '2025-10-27T13:35:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:35:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-2', team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-27T13:35:05.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:35:05.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-3', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-27T13:35:10.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:35:10.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-4', team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', team: null, work_shift: null, created_at: '2025-10-27T13:35:15.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-27T13:35:15.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-5', team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', team: null, work_shift: null, created_at: '2025-10-28T08:01:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:01:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-6', team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', team: null, work_shift: null, created_at: '2025-10-28T08:02:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:02:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-7', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', team: null, work_shift: null, created_at: '2025-10-28T08:16:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:16:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-8', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-28T08:17:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:17:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-9', team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', team: null, work_shift: null, created_at: '2025-10-28T08:18:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:18:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-10', team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-28T08:31:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:31:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-11', team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', team: null, work_shift: null, created_at: '2025-10-28T08:32:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:32:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-12', team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', team: null, work_shift: null, created_at: '2025-10-28T08:46:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:46:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-13', team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-28T08:47:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T08:47:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-14', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', team: null, work_shift: null, created_at: '2025-10-28T09:01:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:01:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-15', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', team: null, work_shift: null, created_at: '2025-10-28T09:02:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:02:00.000000+00:00', updated_by: null, is_deleted: false },
    { id: 'tws-16', team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', team: null, work_shift: null, created_at: '2025-10-28T09:03:00.000000+00:00', created_by: '00000000-0000-0000-0000-000000000000', updated_at: '2025-10-28T09:03:00.000000+00:00', updated_by: null, is_deleted: false }
];

// Delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock getCurrentUser
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;
    const role = user.role || user.account?.role;
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

// Helper: Get work type by ID
// TODO: This is a sync helper but API is async - needs refactoring
// For now, this will return null - update to use async getWorkTypeByIdFromAPI when needed
const getWorkTypeById = (id) => {
    // Note: MOCK_WORK_TYPES removed - this helper needs to be updated to use API
    // Return null for now - update calling code to use async getWorkTypeByIdFromAPI
    return null;
};

// Helper: Get work shift by ID
const getWorkShiftById = (id) => {
    return MOCK_WORK_SHIFTS.find(ws => ws.id === id && !ws.is_deleted);
};

// Helper: Populate team_work_shifts (for list view)
const populateTeamWorkShifts = (teamId) => {
    const teamWorkShifts = MOCK_TEAM_WORK_SHIFTS.filter(tws => tws.team_id === teamId && !tws.is_deleted);

    return teamWorkShifts.map(tws => {
        const workShift = getWorkShiftById(tws.work_shift_id);
        if (!workShift) return null;

        return {
            team_id: tws.team_id,
            work_shift_id: tws.work_shift_id,
            team: null,
            work_shift: {
                name: workShift.name,
                start_time: workShift.start_time,
                end_time: workShift.end_time,
                description: workShift.description,
                is_active: workShift.is_active,
                applicable_days: workShift.applicable_days,
                team_work_shifts: [null],
                daily_schedules: [],
                id: workShift.id,
                created_at: workShift.created_at,
                created_by: workShift.created_by,
                updated_at: workShift.updated_at,
                updated_by: workShift.updated_by,
                is_deleted: workShift.is_deleted
            },
            id: tws.id,
            created_at: tws.created_at,
            created_by: tws.created_by,
            updated_at: tws.updated_at,
            updated_by: tws.updated_by,
            is_deleted: tws.is_deleted
        };
    }).filter(Boolean);
};

// Helper: Populate leader info (for list view) - async version
const populateLeader = async (team) => {
    if (!team.leader_id) return null;

    const employee = await getEmployeeById(team.leader_id);
    if (!employee) return null;

    return {
        account_id: employee.account_id,
        full_name: employee.full_name,
        avatar_url: employee.avatar_url,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        skills: employee.skills,
        salary: employee.salary,
        sub_role: employee.sub_role,
        account: null,
        team_members: [],
        orders: [],
        daily_schedules: [],
        id: employee.id,
        created_at: employee.created_at,
        created_by: employee.created_by,
        updated_at: employee.updated_at,
        updated_by: employee.updated_by,
        is_deleted: employee.is_deleted
    };
};

// Helper: Populate team_work_types (for list view)
const populateTeamWorkTypes = (teamId) => {
    const teamWorkTypes = MOCK_TEAM_WORK_TYPES.filter(twt => twt.team_id === teamId && !twt.is_deleted);

    return teamWorkTypes.map(twt => {
        const workType = getWorkTypeById(twt.work_type_id);
        if (!workType) return null;

        return {
            team_id: twt.team_id,
            work_type_id: workType.id,
            description: null,
            team: null,
            work_type: {
                name: workType.name,
                description: workType.description,
                is_active: workType.is_active,
                tasks: [],
                area_work_types: [],
                team_work_types: [null],
                id: workType.id,
                created_at: workType.created_at,
                created_by: workType.created_by,
                updated_at: workType.updated_at,
                updated_by: workType.updated_by,
                is_deleted: workType.is_deleted
            },
            id: twt.id,
            created_at: twt.created_at,
            created_by: twt.created_by,
            updated_at: twt.updated_at,
            updated_by: twt.updated_by,
            is_deleted: twt.is_deleted
        };
    }).filter(twt => twt !== null);
};

// Helper: Populate team_members (for detail view and list view) - async version
const populateTeamMembers = async (teamId) => {
    // Filter team members by team_id
    const teamMembers = MOCK_TEAM_MEMBERS.filter(tm => tm.team_id === teamId && !tm.is_deleted);

    // Populate employee data for each member - use Promise.all for parallel fetching
    const populatedMembers = await Promise.all(
        teamMembers.map(async (tm) => {
            const employee = await getEmployeeById(tm.employee_id);

            if (!employee) return null;

            return {
                team_id: tm.team_id,
                employee_id: tm.employee_id,
                is_active: tm.is_active,
                team: null,
                employee: {
                    account_id: employee.account_id,
                    full_name: employee.full_name,
                    avatar_url: employee.avatar_url,
                    email: employee.email,
                    phone: employee.phone,
                    address: employee.address,
                    skills: employee.skills,
                    salary: employee.salary,
                    sub_role: employee.sub_role,
                    account: null,
                    team_members: [null],
                    orders: [],
                    daily_schedules: [],
                    id: employee.id,
                    created_at: employee.created_at,
                    created_by: employee.created_by,
                    updated_at: employee.updated_at,
                    updated_by: employee.updated_by,
                    is_deleted: employee.is_deleted
                },
                daily_schedules: [],
                id: tm.id,
                created_at: tm.created_at,
                created_by: tm.created_by,
                updated_at: tm.updated_at,
                updated_by: tm.updated_by,
                is_deleted: tm.is_deleted
            };
        })
    );

    return populatedMembers.filter(tm => tm !== null); // Remove null entries
};

/**
 * Get all teams
 */
export const getTeams = async () => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Load all employees to cache first for better performance
    await loadAllEmployeesToCache();

    // Populate teams with async employee data
    const teams = await Promise.all(
        MOCK_TEAMS.filter(t => !t.is_deleted).map(async (team) => ({
            ...team,
            leader: await populateLeader(team),
            team_members: await populateTeamMembers(team.id),
            team_work_types: populateTeamWorkTypes(team.id),
            team_work_shifts: populateTeamWorkShifts(team.id)
        }))
    );

    return {
        success: true,
        data: teams,
        pagination: {
            total_items_count: teams.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get team by ID (detail)
 */
export const getTeamById = async (id) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const team = MOCK_TEAMS.find(t => t.id === id && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Load employees to cache if needed
    await loadAllEmployeesToCache();

    return {
        success: true,
        data: {
            ...team,
            leader: await populateLeader(team),
            team_members: await populateTeamMembers(team.id),
            team_work_types: populateTeamWorkTypes(team.id)
        }
    };
};

/**
 * Get work types of a team (returns array of work types directly)
 */
export const getTeamWorkTypes = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Get team_work_types for this team and extract work_type objects
    const teamWorkTypes = populateTeamWorkTypes(teamId);
    const workTypes = teamWorkTypes.map(twt => twt.work_type).filter(wt => wt !== null);

    return {
        success: true,
        data: workTypes
    };
};

/**
 * Get work shifts of a team
 */
export const getTeamWorkShifts = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // For now, return hardcoded based on team
    // In real app, this would filter MOCK_WORK_SHIFTS based on team_work_shifts relationship
    const shifts = MOCK_WORK_SHIFTS.filter(ws => !ws.is_deleted);

    return {
        success: true,
        data: shifts,
        pagination: {
            total_items_count: shifts.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get slots of a team
 */
export const getTeamSlots = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Import MOCK_SLOTS - for now hardcoded
    // In real implementation, this would filter slots by team_id
    const slots = [];

    // Hardcoded slots for Cat Zone Care Team
    if (teamId === '73db584f-89ba-4ac0-ae2e-4c559a907775') {
        slots.push({
            id: '727d444e-6311-4377-86f9-acf24428dafd',
            service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
            task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
            area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
            team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
            pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
            pet_id: null,
            start_time: '07:30:00',
            end_time: '12:00:00',
            max_capacity: 25,
            price: 0,
            day_of_week: 'MONDAY',
            service_status: 'AVAILABLE',
            special_notes: 'Ưu tiên dọn dẹp hộp cát và thay nước, sau đó mới cho ăn bữa sáng.',
            created_at: '2025-10-27T15:51:13.048693+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T16:26:49.809364+00:00',
            updated_by: '00000000-0000-0000-0000-000000000000',
            is_deleted: false
        });

        slots.push({
            id: '63013ef8-066c-4b45-b0e2-603556900ca8',
            service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
            task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
            area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
            team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
            pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
            pet_id: null,
            start_time: '07:30:00',
            end_time: '12:00:00',
            max_capacity: 25,
            price: 0,
            day_of_week: 'TUESDAY',
            service_status: 'UNAVAILABLE',
            special_notes: '28',
            created_at: '2025-10-28T16:26:12.924117+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-28T16:26:12.924117+00:00',
            updated_by: null,
            is_deleted: false
        });
    }

    return {
        success: true,
        data: slots,
        pagination: {
            total_items_count: slots.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get all slots (for all teams)
 */
export const getAllTeamSlots = async () => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Generate slots dynamically from team work shifts
    const slots = [];

    MOCK_TEAM_WORK_SHIFTS.filter(tws => !tws.is_deleted).forEach(tws => {
        const workShift = getWorkShiftById(tws.work_shift_id);
        if (!workShift) return;

        // Create a slot for each applicable day
        if (workShift.applicable_days && workShift.applicable_days.length > 0) {
            workShift.applicable_days.forEach(day => {
                slots.push({
                    id: `slot-${tws.id}-${day}`,
                    team_id: tws.team_id,
                    start_time: workShift.start_time,
                    end_time: workShift.end_time,
                    day_of_week: day,
                    service_status: 'AVAILABLE',
                    special_notes: null,
                    created_at: tws.created_at,
                    is_deleted: false
                });
            });
        }
    });

    return {
        success: true,
        data: slots.filter(s => !s.is_deleted),
        pagination: {
            total_items_count: slots.filter(s => !s.is_deleted).length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create team
 * Official API: { name, description, leader_id, work_type_ids: ["uuid", ...] }
 */
export const createTeam = async (teamData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền tạo nhóm');
    }

    // Validation
    if (!teamData.name) throw new Error('Tên nhóm là bắt buộc');
    if (!teamData.description) throw new Error('Mô tả là bắt buộc');
    if (!teamData.leader_id) throw new Error('Trưởng nhóm là bắt buộc');
    if (!teamData.work_type_ids || teamData.work_type_ids.length === 0) {
        throw new Error('Phải chọn ít nhất một loại công việc');
    }

    // Verify leader exists
    const leader = await getEmployeeById(teamData.leader_id);
    if (!leader) throw new Error('Trưởng nhóm không tồn tại');

    // Verify work types exist
    const invalidWorkTypes = teamData.work_type_ids.filter(wtId => !getWorkTypeById(wtId));
    if (invalidWorkTypes.length > 0) {
        throw new Error('Một số loại công việc không tồn tại');
    }

    const newTeam = {
        id: generateId(),
        name: teamData.name,
        description: teamData.description,
        leader_id: teamData.leader_id,
        is_active: true, // Default active
        status: 'INACTIVE', // Default status
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_TEAMS.push(newTeam);

    // Create team_work_types entries based on work_type_ids
    teamData.work_type_ids.forEach(workTypeId => {
        const newTeamWorkType = {
            id: generateId(),
            team_id: newTeam.id,
            work_type_id: workTypeId,
            team: null,
            work_type: null,
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };
        MOCK_TEAM_WORK_TYPES.push(newTeamWorkType);
    });

    return {
        success: true,
        data: newTeam,
        message: 'Tạo nhóm thành công'
    };
};

/**
 * Update team
 * API: { name, description, leader_id, work_type_ids[], is_active }
 */
export const updateTeam = async (id, teamData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền cập nhật nhóm');
    }

    const teamIndex = MOCK_TEAMS.findIndex(t => t.id === id && !t.is_deleted);
    if (teamIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    const team = MOCK_TEAMS[teamIndex];

    // If leader_id is being updated, verify it exists
    if (teamData.leader_id && teamData.leader_id !== team.leader_id) {
        const leader = await getEmployeeById(teamData.leader_id);
        if (!leader) throw new Error('Trưởng nhóm không tồn tại');
    }

    // If work_type_ids is being updated, verify they exist
    if (teamData.work_type_ids) {
        const invalidWorkTypes = teamData.work_type_ids.filter(wtId => !getWorkTypeById(wtId));
        if (invalidWorkTypes.length > 0) {
            throw new Error('Một số loại công việc không tồn tại');
        }
    }

    const updatedTeam = {
        ...team,
        name: teamData.name !== undefined ? teamData.name : team.name,
        description: teamData.description !== undefined ? teamData.description : team.description,
        leader_id: teamData.leader_id !== undefined ? teamData.leader_id : team.leader_id,
        is_active: teamData.is_active !== undefined ? teamData.is_active : team.is_active,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_TEAMS[teamIndex] = updatedTeam;

    // TODO: Update team_work_types based on work_type_ids
    // This would be done in the backend

    return {
        success: true,
        data: updatedTeam,
        message: 'Cập nhật nhóm thành công'
    };
};

/**
 * Delete team (soft delete)
 */
export const deleteTeam = async (id) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền xóa nhóm');
    }

    const teamIndex = MOCK_TEAMS.findIndex(t => t.id === id && !t.is_deleted);
    if (teamIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Soft delete
    MOCK_TEAMS[teamIndex].is_deleted = true;
    MOCK_TEAMS[teamIndex].updated_at = new Date().toISOString();
    MOCK_TEAMS[teamIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa nhóm thành công'
    };
};

/**
 * Get team members (returns array of team_member objects with employee data)
 * IMPORTANT: Leader must always be included in the team members list
 */
export const getTeamMembers = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Get team to find leader
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Load employees to cache if needed
    await loadAllEmployeesToCache();

    let members = await populateTeamMembers(teamId);

    // IMPORTANT: Add leader to members list if not already there
    if (team.leader_id) {
        const leaderAlreadyInMembers = members.some(m => m.employee_id === team.leader_id);

        if (!leaderAlreadyInMembers) {
            const leader = await getEmployeeById(team.leader_id);
            if (leader) {
                // Create a team_member entry for the leader
                const leaderMember = {
                    team_id: teamId,
                    employee_id: leader.id,
                    is_active: true, // Leader is always active
                    team: null,
                    employee: {
                        account_id: leader.account_id,
                        full_name: leader.full_name,
                        avatar_url: leader.avatar_url,
                        email: leader.email,
                        phone: leader.phone,
                        address: leader.address,
                        skills: leader.skills,
                        salary: leader.salary,
                        sub_role: leader.sub_role,
                        account: null,
                        team_members: [null],
                        orders: [],
                        daily_schedules: [],
                        id: leader.id,
                        created_at: leader.created_at,
                        created_by: leader.created_by,
                        updated_at: leader.updated_at,
                        updated_by: leader.updated_by,
                        is_deleted: leader.is_deleted
                    },
                    daily_schedules: [],
                    id: `leader-member-${teamId}`, // Special ID for leader entry
                    created_at: team.created_at,
                    created_by: team.created_by,
                    updated_at: team.updated_at,
                    updated_by: team.updated_by,
                    is_deleted: false
                };

                // Add leader at the beginning of the list
                members = [leaderMember, ...members];
            }
        }
    }

    return {
        success: true,
        data: members
    };
};

/**
 * Add members to team
 * API: [{ employee_id }]
 */
export const addTeamMembers = async (teamId, members) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền thêm thành viên');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Validate and add members
    const addedMembers = [];
    for (const member of members) {
        if (!member.employee_id) {
            throw new Error('employee_id là bắt buộc');
        }

        // Verify employee exists
        const employee = await getEmployeeById(member.employee_id);
        if (!employee) {
            throw new Error(`Nhân viên ${member.employee_id} không tồn tại`);
        }

        // Check if already a member
        const existingMember = MOCK_TEAM_MEMBERS.find(
            tm => tm.team_id === teamId && tm.employee_id === member.employee_id && !tm.is_deleted
        );
        if (existingMember) {
            throw new Error(`${employee.full_name} đã là thành viên của nhóm`);
        }

        // Create new team member
        const newMember = {
            id: generateId(),
            team_id: teamId,
            employee_id: member.employee_id,
            is_active: true,
            team: null,
            employee: null,
            daily_schedules: [],
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        MOCK_TEAM_MEMBERS.push(newMember);
        addedMembers.push(newMember);
    }

    return {
        success: true,
        data: addedMembers,
        message: `Đã thêm ${addedMembers.length} thành viên vào nhóm`
    };
};

/**
 * Update team members
 * API: [{ employee_id, is_active }]
 */
export const updateTeamMembers = async (teamId, members) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền cập nhật thành viên');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    const updatedMembers = [];
    for (const memberUpdate of members) {
        if (!memberUpdate.employee_id) {
            throw new Error('employee_id là bắt buộc');
        }

        // Find existing team member
        const memberIndex = MOCK_TEAM_MEMBERS.findIndex(
            tm => tm.team_id === teamId && tm.employee_id === memberUpdate.employee_id && !tm.is_deleted
        );

        if (memberIndex === -1) {
            throw new Error(`Nhân viên không thuộc nhóm này`);
        }

        // Update member
        MOCK_TEAM_MEMBERS[memberIndex] = {
            ...MOCK_TEAM_MEMBERS[memberIndex],
            is_active: memberUpdate.is_active !== undefined ? memberUpdate.is_active : MOCK_TEAM_MEMBERS[memberIndex].is_active,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        };

        updatedMembers.push(MOCK_TEAM_MEMBERS[memberIndex]);
    }

    return {
        success: true,
        data: updatedMembers,
        message: 'Cập nhật thành viên thành công'
    };
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (teamId, employeeId) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền xóa thành viên');
    }

    const memberIndex = MOCK_TEAM_MEMBERS.findIndex(
        tm => tm.team_id === teamId && tm.employee_id === employeeId && !tm.is_deleted
    );

    if (memberIndex === -1) {
        throw new Error('Không tìm thấy thành viên trong nhóm');
    }

    // Soft delete
    MOCK_TEAM_MEMBERS[memberIndex].is_deleted = true;
    MOCK_TEAM_MEMBERS[memberIndex].updated_at = new Date().toISOString();
    MOCK_TEAM_MEMBERS[memberIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa thành viên khỏi nhóm thành công'
    };
};

/**
 * Assign work shifts to team
 * Official API: { work_shift_ids: ["uuid", ...] }
 */
export const assignTeamWorkShifts = async (teamId, data) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền phân công ca làm việc');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Match official API structure: work_shift_ids (plural)
    if (!data.work_shift_ids || data.work_shift_ids.length === 0) {
        throw new Error('Phải chọn ít nhất một ca làm việc');
    }

    // Verify all work shifts exist
    const invalidShifts = data.work_shift_ids.filter(wsId => {
        return !MOCK_WORK_SHIFTS.find(ws => ws.id === wsId && !ws.is_deleted);
    });

    if (invalidShifts.length > 0) {
        throw new Error('Một số ca làm việc không tồn tại');
    }

    // Create team_work_shifts entries for each work shift
    const newEntries = [];

    data.work_shift_ids.forEach(workShiftId => {
        // Check if already exists
        const exists = MOCK_TEAM_WORK_SHIFTS.find(
            tws => tws.team_id === teamId &&
                tws.work_shift_id === workShiftId &&
                !tws.is_deleted
        );

        if (!exists) {
            const newEntry = {
                id: generateId(),
                team_id: teamId,
                work_shift_id: workShiftId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false
            };
            MOCK_TEAM_WORK_SHIFTS.push(newEntry);
            newEntries.push(newEntry);
        }
    });

    return {
        success: true,
        data: newEntries,
        message: `Đã phân công ${data.work_shift_ids.length} ca làm việc cho nhóm`
    };
};

export default {
    getTeams,
    getTeamById,
    getTeamWorkTypes,
    getTeamMembers,
    getTeamWorkShifts,
    getTeamSlots,
    getAllTeamSlots,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    updateTeamMembers,
    removeTeamMember,
    assignTeamWorkShifts
};

export { MOCK_TEAMS, MOCK_TEAM_MEMBERS, MOCK_TEAM_WORK_TYPES, MOCK_TEAM_WORK_SHIFTS };

