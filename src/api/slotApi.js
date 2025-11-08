import { MOCK_SERVICES } from './serviceApi';
import { getAreaById as getAreaByIdFromAPI } from './areasApi';
import { MOCK_TEAMS } from './teamApi';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Pet Groups for slotApi (minimal data for mock slots)
const MOCK_PET_GROUPS = [
    {
        id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        name: 'Mèo Cục Cưng Lông Dài',
        description: 'Nhóm các giống mèo có bộ lông dài',
        pet_species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        pet_breed_id: null,
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:31:04.595906+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:31:04.595906+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321',
        name: 'Chó Nhỏ Năng Động',
        description: 'Bao gồm các giống chó nhỏ nhưng có mức năng lượng cao',
        pet_species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        pet_breed_id: null,
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:33:19.495131+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:33:19.495131+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Helper functions for MOCK_SLOTS
const getPetGroupById = (id) => MOCK_PET_GROUPS.find(pg => pg.id === id);
const getServiceById = (id) => MOCK_SERVICES.find(s => s.id === id);
// Note: getAreaById is async from API, so for mock data we return null
// The actual area will be populated when fetching from API
const getAreaById = (id) => null; // Mock data doesn't populate area, will be fetched from API when needed
const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);

const generateId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// ========== CONSTANTS ==========

export const WEEKDAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
];

export const WEEKDAY_LABELS = {
    'MONDAY': 'Thứ Hai',
    'TUESDAY': 'Thứ Ba',
    'WEDNESDAY': 'Thứ Tư',
    'THURSDAY': 'Thứ Năm',
    'FRIDAY': 'Thứ Sáu',
    'SATURDAY': 'Thứ Bảy',
    'SUNDAY': 'Chủ Nhật'
};

export const SLOT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    BOOKED: 'BOOKED',
    CANCELLED: 'CANCELLED'
};

// ========== UTILITY FUNCTIONS ==========

const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': [],
        'sales_staff': [],
        'manager': ['slot_management', 'full_access'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// ========== MOCK DATABASE ==========
// ========== MOCK SLOTS DATA ==========

let MOCK_SLOTS = [
    // Task 1: Hướng dẫn khách chơi với mèo (cfa75dab-16cf-4978-b9fb-e6da47034108)
    {
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
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: getServiceById('caa26439-478e-4892-861f-1aab0a41ba4b'),
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-27T15:51:13.048693+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T16:26:49.809364+00:00',
        updated_by: '00000000-0000-0000-0000-000000000000',
        is_deleted: false
    },
    {
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
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: getServiceById('caa26439-478e-4892-861f-1aab0a41ba4b'),
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T16:26:12.924117+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T16:26:12.924117+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '74124fef-177g-5488-c1f3-714667611ea9',
        service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '13:00:00',
        end_time: '17:00:00',
        max_capacity: 25,
        price: 0,
        day_of_week: 'WEDNESDAY',
        service_status: 'AVAILABLE',
        special_notes: null,
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: getServiceById('caa26439-478e-4892-861f-1aab0a41ba4b'),
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T17:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T17:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 2: Dọn dẹp vệ sinh khu vực mèo (752a0719-64a4-49b7-85ff-b266216667b9)
    {
        id: '85235gfg-288h-6599-d2g4-825778722fb0',
        service_id: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '06:00:00',
        end_time: '07:30:00',
        max_capacity: 12,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Vệ sinh toàn bộ trước khi mở cửa. Kiểm tra và thay tất cả cát vệ sinh.',
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: null,
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-27T06:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '96346hgh-399i-76a0-e3h5-936889833gc1',
        service_id: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '17:30:00',
        end_time: '19:00:00',
        max_capacity: 12,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Vệ sinh tổng thể sau khi đóng cửa. Khử trùng toàn bộ khu vực.',
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: null,
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-27T17:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T17:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 3: Cho mèo ăn sáng (863b1830-75b5-5ac8-96gg-c377327778c0)
    {
        id: 'a7457ihi-40aj-87b1-f4i6-a47990944hd2',
        service_id: null,
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '07:00:00',
        end_time: '07:30:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Cho ăn đúng giờ. Kiểm tra khẩu phần riêng của từng bé.',
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: null,
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-27T07:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T07:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'b8568jhj-51bk-98c2-g5j7-b58aa1055ie3',
        service_id: null,
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '07:00:00',
        end_time: '07:30:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'TUESDAY',
        service_status: 'AVAILABLE',
        special_notes: null,
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: null,
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T07:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 4: Kiểm tra sức khỏe mèo (974c2941-86c6-6bd9-a7hh-d488438889d1)
    {
        id: 'c9679kjk-62cl-09d3-h6k8-c69bb2166jf4',
        service_id: null,
        task_id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        pet_id: null,
        start_time: '09:00:00',
        end_time: '10:00:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Ghi chú tình trạng sức khỏe vào sổ theo dõi.',
        pet_group: getPetGroupById('ca287dab-96a8-4922-86d5-1c2a99cc34ed'),
        service: null,
        pet: null,
        area: getAreaById('0a10e6b3-085d-42f2-b218-8474302d72b4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-27T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 5: Cho chó ăn sáng (123e4567-e89b-12d3-a456-426614174000)
    {
        id: 'd078alml-73dm-10e4-i7l9-d70cc3277kg5',
        service_id: 'dbb37550-589f-5993-972g-2bbc1b52cb5c',
        task_id: '123e4567-e89b-12d3-a456-426614174000',
        area_id: '1b21f7c4-196e-53g3-c329-9585413e83c5',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe',
        pet_id: null,
        start_time: '07:00:00',
        end_time: '07:30:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Kiểm tra tình trạng ăn uống của từng bé. Ghi nhận bé nào không ăn.',
        pet_group: getPetGroupById('db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe'),
        service: getServiceById('dbb37550-589f-5993-972g-2bbc1b52cb5c'),
        pet: null,
        area: getAreaById('1b21f7c4-196e-53g3-c329-9585413e83c5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T07:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 6: Dắt chó đi dạo (a85f5678-f9ac-23e4-b567-537725285111)
    {
        id: 'e189bmnn-84en-21f5-j8m0-e81dd4388lh6',
        service_id: null,
        task_id: 'a85f5678-f9ac-23e4-b567-537725285111',
        area_id: '1b21f7c4-196e-53g3-c329-9585413e83c5',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe',
        pet_id: null,
        start_time: '08:00:00',
        end_time: '09:00:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Đi dạo tại khu vực an toàn. Không để các bé tiếp xúc với chó lạ.',
        pet_group: getPetGroupById('db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe'),
        service: null,
        pet: null,
        area: getAreaById('1b21f7c4-196e-53g3-c329-9585413e83c5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'f290cnoo-95fo-32g6-k9n1-f92ee5499mi7',
        service_id: null,
        task_id: 'a85f5678-f9ac-23e4-b567-537725285111',
        area_id: '1b21f7c4-196e-53g3-c329-9585413e83c5',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe',
        pet_id: null,
        start_time: '16:00:00',
        end_time: '17:00:00',
        max_capacity: 0,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Dạo buổi chiều giúp chó thư giãn sau khi vui chơi với khách.',
        pet_group: getPetGroupById('db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe'),
        service: null,
        pet: null,
        area: getAreaById('1b21f7c4-196e-53g3-c329-9585413e83c5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T16:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T16:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 7: Huấn luyện cơ bản cho chó (b96g6789-g0bd-34f5-c678-648836396222)
    {
        id: 'g3a1dopp-a6gp-43h7-l0o2-ga3ff660anj8',
        service_id: 'dbb37550-589f-5993-972g-2bbc1b52cb5c',
        task_id: 'b96g6789-g0bd-34f5-c678-648836396222',
        area_id: '1b21f7c4-196e-53g3-c329-9585413e83c5',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe',
        pet_id: null,
        start_time: '10:00:00',
        end_time: '12:00:00',
        max_capacity: 15,
        price: 0,
        day_of_week: 'WEDNESDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Huấn luyện kết hợp với thời gian khách vui chơi. Tạo không khí tích cực.',
        pet_group: getPetGroupById('db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe'),
        service: getServiceById('dbb37550-589f-5993-972g-2bbc1b52cb5c'),
        pet: null,
        area: getAreaById('1b21f7c4-196e-53g3-c329-9585413e83c5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-29T10:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T10:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Task 8: Vệ sinh Dog Play Area (c07h7890-h1ce-45g6-d789-759947407333)
    {
        id: 'h4b2epqq-b7hq-54i8-m1p3-hb4gg771bok9',
        service_id: null,
        task_id: 'c07h7890-h1ce-45g6-d789-759947407333',
        area_id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: '66778899-aabb-ccdd-eeff-001122334455',
        pet_id: null,
        start_time: '06:00:00',
        end_time: '07:30:00',
        max_capacity: 15,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Vệ sinh kỹ lưỡng trước khi mở cửa. Kiểm tra đồ chơi hư hỏng.',
        pet_group: getPetGroupById('66778899-aabb-ccdd-eeff-001122334455'),
        service: null,
        pet: null,
        area: getAreaById('1c92f639-a6fa-48c3-b4b7-0a713389df5c'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T06:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T06:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'i5c3fqrr-c8ir-65j9-n2q4-ic5hh882cpl0',
        service_id: null,
        task_id: 'c07h7890-h1ce-45g6-d789-759947407333',
        area_id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        pet_group_id: '66778899-aabb-ccdd-eeff-001122334455',
        pet_id: null,
        start_time: '18:00:00',
        end_time: '19:30:00',
        max_capacity: 15,
        price: 0,
        day_of_week: 'MONDAY',
        service_status: 'AVAILABLE',
        special_notes: 'Vệ sinh tổng thể cuối ngày. Khử trùng toàn bộ khu vực.',
        pet_group: getPetGroupById('66778899-aabb-ccdd-eeff-001122334455'),
        service: null,
        pet: null,
        area: getAreaById('1c92f639-a6fa-48c3-b4b7-0a713389df5c'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        task: null,
        customer_bookings: [],
        order_details: [],
        daily_tasks: [],
        created_at: '2025-10-28T18:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T18:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// ========== API FUNCTIONS ==========

const slotApi = {
    /**
     * Get all slots
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    async getAllSlots(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem danh sách slot');
        }

        let slots = [...MOCK_SLOTS].filter(s => !s.is_deleted);

        // Apply filters
        if (filters.task_id) {
            slots = slots.filter(s => s.task_id === filters.task_id);
        }

        if (filters.service_id) {
            slots = slots.filter(s => s.service_id === filters.service_id);
        }

        if (filters.day_of_week) {
            slots = slots.filter(s => s.day_of_week === filters.day_of_week);
        }

        if (filters.service_status) {
            slots = slots.filter(s => s.service_status === filters.service_status);
        }

        if (filters.team_id) {
            slots = slots.filter(s => s.team_id === filters.team_id);
        }

        // Enforce business rule: recompute availability (include price for public tasks)
        try {
            const { MOCK_TASK_TEMPLATES } = await import('./taskTemplateApi');
            slots = slots.map(s => {
                const task = MOCK_TASK_TEMPLATES.find(t => t.id === s.task_id);
                const isPublic = !!task?.is_public;
                const hasTeam = !!s.team_id;
                const hasArea = !!s.area_id;
                const hasPetGroup = !!s.pet_group_id;
                const hasCapacity = (s.max_capacity || 0) > 0;
                const hasPriceOk = !isPublic || ((s.price || 0) > 0);
                const fullyAssigned = hasTeam && hasArea && hasPetGroup && hasCapacity && hasPriceOk;
                return fullyAssigned ? s : { ...s, service_status: SLOT_STATUS.UNAVAILABLE };
            });
        } catch (e) {
            // Ignore if task templates are unavailable
        }

        // Sort by day of week and start time
        const dayOrder = {
            'MONDAY': 1,
            'TUESDAY': 2,
            'WEDNESDAY': 3,
            'THURSDAY': 4,
            'FRIDAY': 5,
            'SATURDAY': 6,
            'SUNDAY': 7
        };

        slots.sort((a, b) => {
            const dayCompare = dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
            if (dayCompare !== 0) return dayCompare;
            return a.start_time.localeCompare(b.start_time);
        });

        return {
            success: true,
            data: slots,
            pagination: {
                total_items_count: slots.length,
                page_size: 100,
                total_pages_count: 1,
                page_index: 0,
                has_next: false,
                has_previous: false
            }
        };
    },

    /**
     * Get slots by task ID
     * @param {string} taskId 
     * @returns {Promise<Object>}
     */
    async getSlotsByTaskId(taskId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem slot');
        }

        let slots = MOCK_SLOTS.filter(s => s.task_id === taskId && !s.is_deleted);

        // Recompute availability per business rule
        try {
            const { MOCK_TASK_TEMPLATES } = await import('./taskTemplateApi');
            const task = MOCK_TASK_TEMPLATES.find(t => t.id === taskId);
            const isPublic = !!task?.is_public;
            slots = slots.map(s => {
                const hasTeam = !!s.team_id;
                const hasArea = !!s.area_id;
                const hasPetGroup = !!s.pet_group_id;
                const hasCapacity = (s.max_capacity || 0) > 0;
                const hasPriceOk = !isPublic || ((s.price || 0) > 0);
                const fullyAssigned = hasTeam && hasArea && hasPetGroup && hasCapacity && hasPriceOk;
                return fullyAssigned ? s : { ...s, service_status: SLOT_STATUS.UNAVAILABLE };
            });
        } catch { }

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
    },

    /**
     * Get slot by ID
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async getSlotById(slotId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem slot');
        }

        let slot = MOCK_SLOTS.find(s => s.id === slotId && !s.is_deleted);

        if (!slot) {
            throw new Error('Không tìm thấy slot');
        }

        // Recompute availability for single slot
        try {
            const { MOCK_TASK_TEMPLATES } = await import('./taskTemplateApi');
            const task = slot ? MOCK_TASK_TEMPLATES.find(t => t.id === slot.task_id) : null;
            const isPublic = !!task?.is_public;
            if (slot) {
                const hasTeam = !!slot.team_id;
                const hasArea = !!slot.area_id;
                const hasPetGroup = !!slot.pet_group_id;
                const hasCapacity = (slot.max_capacity || 0) > 0;
                const hasPriceOk = !isPublic || ((slot.price || 0) > 0);
                const fullyAssigned = hasTeam && hasArea && hasPetGroup && hasCapacity && hasPriceOk;
                if (!fullyAssigned) slot = { ...slot, service_status: SLOT_STATUS.UNAVAILABLE };
            }
        } catch { }

        return {
            success: true,
            data: slot
        };
    },

    /**
     * Create new slot
     * @param {Object} slotData 
     * @returns {Promise<Object>}
     */
    async createSlot(slotData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền tạo slot');
        }

        // Validation
        if (!slotData.task_id) {
            throw new Error('Task ID là bắt buộc');
        }

        if (!slotData.day_of_week) {
            throw new Error('Ngày trong tuần là bắt buộc');
        }

        if (!slotData.start_time || !slotData.end_time) {
            throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
        }

        // Helper functions to get nested data
        // Note: getAreaById returns null for mock data, area will be fetched from API when needed
        const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);
        const getPetGroupById = (id) => MOCK_PET_GROUPS.find(pg => pg.id === id);
        const getServiceById = (id) => MOCK_SERVICES.find(s => s.id === id);

        // Debug logging
        console.log('🔍 Creating Slot - slotData:', slotData);
        console.log('🔍 Pet Group ID:', slotData.pet_group_id);
        console.log('🔍 Available Pet Groups:', MOCK_PET_GROUPS.map(pg => ({ id: pg.id, name: pg.name })));

        // Determine default availability based on required assignments
        const hasTeam = !!slotData.team_id;
        const hasArea = !!slotData.area_id;
        const hasPetGroup = !!slotData.pet_group_id;
        const hasCapacity = (slotData.max_capacity || 0) > 0;
        // For public tasks, also require price > 0
        let isPublicTask = false;
        try {
            const { MOCK_TASK_TEMPLATES } = await import('./taskTemplateApi');
            const task = MOCK_TASK_TEMPLATES.find(t => t.id === slotData.task_id);
            isPublicTask = !!task?.is_public;
        } catch { }
        const hasPriceOk = !isPublicTask || ((slotData.price || 0) > 0);
        const isFullyAssigned = hasTeam && hasArea && hasPetGroup && hasCapacity && hasPriceOk;

        // Create new slot
        const newSlot = {
            id: generateId(),
            service_id: slotData.service_id || null,
            task_id: slotData.task_id,
            area_id: slotData.area_id || null,
            team_id: slotData.team_id || null,
            pet_group_id: slotData.pet_group_id || null,
            pet_id: slotData.pet_id || null,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            max_capacity: slotData.max_capacity || 0,
            price: slotData.price || 0,
            day_of_week: slotData.day_of_week,
            // Business rule: UNAVAILABLE unless fully assigned. Even if UI passes AVAILABLE, override when incomplete.
            service_status: (() => {
                if (!isFullyAssigned) return SLOT_STATUS.UNAVAILABLE;
                return slotData.service_status || SLOT_STATUS.AVAILABLE;
            })(),
            special_notes: slotData.special_notes || null,
            // Populate nested data
            pet_group: slotData.pet_group_id ? getPetGroupById(slotData.pet_group_id) : null,
            service: slotData.service_id ? getServiceById(slotData.service_id) : null,
            pet: null,
            area: slotData.area_id ? getAreaById(slotData.area_id) : null,
            team: slotData.team_id ? getTeamById(slotData.team_id) : null,
            task: null,
            customer_bookings: [],
            order_details: [],
            daily_tasks: [],
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        console.log('✅ Created Slot - pet_group:', newSlot.pet_group);

        MOCK_SLOTS.push(newSlot);

        return {
            success: true,
            data: newSlot,
            message: 'Tạo slot thành công'
        };
    },

    /**
     * Update slot
     * @param {string} slotId 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async updateSlot(slotId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền cập nhật slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId && !s.is_deleted);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Helper functions to get nested data
        // Note: getAreaById returns null for mock data, area will be fetched from API when needed
        const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);
        const getPetGroupById = (id) => MOCK_PET_GROUPS.find(pg => pg.id === id);
        const getServiceById = (id) => MOCK_SERVICES.find(s => s.id === id);

        // Store old values for comparison
        const oldSlot = MOCK_SLOTS[slotIndex];
        const oldDayOfWeek = oldSlot.day_of_week;

        // Debug logging
        console.log('🔍 Updating Slot - slotId:', slotId);
        console.log('🔍 Updating Slot - updates:', updates);
        console.log('🔍 Current slot before update:', oldSlot);

        // Apply updates
        const updatedSlot = {
            ...oldSlot,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        };

        // Update nested data if IDs changed
        if (updates.area_id !== undefined) {
            updatedSlot.area = updates.area_id ? getAreaById(updates.area_id) : null;
            console.log('✅ Updated area:', updatedSlot.area);
        }
        if (updates.team_id !== undefined) {
            updatedSlot.team = updates.team_id ? getTeamById(updates.team_id) : null;
            console.log('✅ Updated team:', updatedSlot.team);
        }
        if (updates.pet_group_id !== undefined) {
            updatedSlot.pet_group = updates.pet_group_id ? getPetGroupById(updates.pet_group_id) : null;
            console.log('✅ Updated pet_group:', updatedSlot.pet_group);
        }
        if (updates.service_id !== undefined) {
            updatedSlot.service = updates.service_id ? getServiceById(updates.service_id) : null;
            console.log('✅ Updated service:', updatedSlot.service);
        }

        // Always enforce business rule after updates (include price for public tasks)
        {
            const hasTeamU = !!(updates.team_id !== undefined ? updates.team_id : updatedSlot.team_id);
            const hasAreaU = !!(updates.area_id !== undefined ? updates.area_id : updatedSlot.area_id);
            const hasPetGroupU = !!(updates.pet_group_id !== undefined ? updates.pet_group_id : updatedSlot.pet_group_id);
            const hasCapacityU = ((updates.max_capacity !== undefined ? updates.max_capacity : updatedSlot.max_capacity) || 0) > 0;
            let isPublicTask = false;
            try {
                const { MOCK_TASK_TEMPLATES } = await import('./taskTemplateApi');
                const task = MOCK_TASK_TEMPLATES.find(t => t.id === updatedSlot.task_id);
                isPublicTask = !!task?.is_public;
            } catch { }
            const priceValue = (updates.price !== undefined ? updates.price : updatedSlot.price) || 0;
            const hasPriceOk = !isPublicTask || (priceValue > 0);
            const fullyAssigned = hasTeamU && hasAreaU && hasPetGroupU && hasCapacityU && hasPriceOk;
            if (!fullyAssigned) {
                updatedSlot.service_status = SLOT_STATUS.UNAVAILABLE;
            } else {
                // If fully assigned, honor explicit update or keep existing/AVAILABLE
                if (updates.service_status !== undefined) {
                    updatedSlot.service_status = updates.service_status;
                } else if (!updatedSlot.service_status) {
                    updatedSlot.service_status = SLOT_STATUS.AVAILABLE;
                }
            }
        }

        console.log('✅ Final updatedSlot:', updatedSlot);

        MOCK_SLOTS[slotIndex] = updatedSlot;

        // Check if day_of_week changed - if so, invalidate related daily tasks
        if (updates.day_of_week && updates.day_of_week !== oldDayOfWeek) {
            console.log(`📅 Day of week changed from ${oldDayOfWeek} to ${updates.day_of_week}`);
            console.log(`🗑️ Invalidating scheduled daily tasks for slot ${slotId}...`);

            try {
                // Use dynamic import to avoid circular dependency
                const { invalidateDailyTasksBySlot } = await import('./dailyTasksApi');
                const invalidateResult = await invalidateDailyTasksBySlot(slotId);
                console.log('✅ Invalidate result:', invalidateResult);

                return {
                    success: true,
                    data: updatedSlot,
                    message: `Cập nhật slot thành công. ${invalidateResult.message || ''}`
                };
            } catch (error) {
                console.error('❌ Error invalidating daily tasks:', error);
                // Continue anyway, slot update succeeded
            }
        }

        return {
            success: true,
            data: updatedSlot,
            message: 'Cập nhật slot thành công'
        };
    },

    /**
     * Delete slot (soft delete)
     * @param {string} slotId 
     * @returns {Promise<Object>}
     */
    async deleteSlot(slotId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xóa slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId && !s.is_deleted);

        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Soft delete
        MOCK_SLOTS[slotIndex].is_deleted = true;
        MOCK_SLOTS[slotIndex].updated_at = new Date().toISOString();
        MOCK_SLOTS[slotIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

        // Also invalidate all scheduled daily tasks for this slot
        console.log(`🗑️ Slot deleted. Invalidating scheduled daily tasks for slot ${slotId}...`);
        try {
            // Use dynamic import to avoid circular dependency
            const { invalidateDailyTasksBySlot } = await import('./dailyTasksApi');
            const invalidateResult = await invalidateDailyTasksBySlot(slotId);
            console.log('✅ Invalidate result:', invalidateResult);

            return {
                success: true,
                message: `Xóa slot thành công. ${invalidateResult.message || ''}`
            };
        } catch (error) {
            console.error('❌ Error invalidating daily tasks:', error);
            // Continue anyway, slot deletion succeeded
            return {
                success: true,
                message: 'Xóa slot thành công'
            };
        }
    },

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const activeSlots = MOCK_SLOTS.filter(s => !s.is_deleted);

        const stats = {
            total: activeSlots.length,
            by_status: {
                [SLOT_STATUS.AVAILABLE]: activeSlots.filter(s => s.service_status === SLOT_STATUS.AVAILABLE).length,
                [SLOT_STATUS.UNAVAILABLE]: activeSlots.filter(s => s.service_status === SLOT_STATUS.UNAVAILABLE).length,
                [SLOT_STATUS.BOOKED]: activeSlots.filter(s => s.service_status === SLOT_STATUS.BOOKED).length,
                [SLOT_STATUS.CANCELLED]: activeSlots.filter(s => s.service_status === SLOT_STATUS.CANCELLED).length
            },
            by_day: {}
        };

        WEEKDAYS.forEach(day => {
            stats.by_day[day] = activeSlots.filter(s => s.day_of_week === day).length;
        });

        return {
            success: true,
            data: stats
        };
    }
};

// Export
export { MOCK_SLOTS };
export default slotApi;
