import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': ['pet_view_all', 'pet_management'],
        'manager': ['pet_view_all', 'pet_management'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock Vaccine Types database
let MOCK_VACCINE_TYPES = [
    {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Vaccine Dại (Rabies)',
        description: 'Vaccine phòng bệnh dại cho chó mèo, tiêm hàng năm',
        species_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Chó
        interval_months: 12,
        required_doses: 0,
        is_required: true,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        name: 'Vaccine Dại (Rabies)',
        description: 'Vaccine phòng bệnh dại cho mèo, tiêm hàng năm',
        species_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Mèo
        interval_months: 12,
        required_doses: 0,
        is_required: true,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        name: 'Vaccine 7 bệnh (DHPPi+L)',
        description: 'Vaccine phòng 7 bệnh cho chó: Carré, Parvo, Hepatitis, Para-influenza, Leptospirosis',
        species_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Chó
        interval_months: 12,
        required_doses: 0,
        is_required: true,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        name: 'Vaccine 4 bệnh (FVRCP)',
        description: 'Vaccine phòng 4 bệnh cho mèo: Viêm mũi khí quản, Calici, Phân trắng (Panleukopenia)',
        species_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Mèo
        interval_months: 12,
        required_doses: 0,
        is_required: true,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '7ie29i08-9151-8906-f7jg-6g307j00ejg0',
        name: 'Vaccine Viêm gan truyền nhiễm (Hepatitis)',
        description: 'Vaccine phòng viêm gan truyền nhiễm cho chó',
        species_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Chó
        interval_months: 12,
        required_doses: 0,
        is_required: false,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '8jf30j19-0262-9017-g8kh-7h418k11fkh1',
        name: 'Vaccine Bạch hầu mèo (FeLV)',
        description: 'Vaccine phòng bệnh bạch hầu ở mèo',
        species_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Mèo
        interval_months: 12,
        required_doses: 0,
        is_required: false,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        name: 'Vaccine Ho cũi chó (Kennel Cough)',
        description: 'Vaccine phòng ho cũi chó (Bordetella)',
        species_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Chó
        interval_months: 6,
        required_doses: 0,
        is_required: false,
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '0lh52l31-2484-1239-i0mj-9j630m33hkj3',
        name: 'Vaccine FIP (Peritonitis)',
        description: 'Vaccine phòng viêm phúc mạc truyền nhiễm ở mèo',
        species_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Mèo
        interval_months: 12,
        required_doses: 0,
        is_required: false,
        createdAt: '2023-01-01T10:00:00Z'
    }
];

// Mock Vaccination Schedules database
let MOCK_VACCINATION_SCHEDULES = [
    // Tháng 10/2025 - Tuần 2
    {
        id: '1a1b1c1d-1111-1111-1111-111111111111',
        pet_id: 'pet-001',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-10-10T09:00:00Z',
        notes: 'Lịch tiêm Vaccine Dại định kỳ hàng năm cho Bella',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '2b2c2d2e-2222-2222-2222-222222222222',
        pet_id: 'pet-002',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        scheduled_date: '2025-10-12T14:00:00Z',
        notes: 'Lịch tiêm Vaccine Dại cho mèo Miu',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '3c3d3e3f-3333-3333-3333-333333333333',
        pet_id: 'pet-003',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-10-14T10:30:00Z',
        notes: 'Vaccine 7 bệnh định kỳ cho chó Max',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '4d4e4f40-4444-4444-4444-444444444444',
        pet_id: 'pet-013',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-10-15T09:00:00Z',
        notes: 'Tiêm phòng Dại cho chó Bella (Golden Retriever)',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '5e5f5051-5555-5555-5555-555555555555',
        pet_id: 'pet-034',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        scheduled_date: '2025-10-16T15:00:00Z',
        notes: 'Vaccine 4 bệnh cho mèo Kitty',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 10/2025 - Tuần 3
    {
        id: '6f6061-6666-6666-6666-666666666666',
        pet_id: 'pet-015',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-10-18T11:00:00Z',
        notes: 'Vaccine 7 bệnh cho Luna',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '7g7172-7777-7777-7777-777777777777',
        pet_id: 'pet-021',
        vaccine_type_id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        scheduled_date: '2025-10-20T08:30:00Z',
        notes: 'Vaccine Ho cũi chó cho Rex (nhắc lại sau 6 tháng)',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '8h8283-8888-8888-8888-888888888888',
        pet_id: 'pet-036',
        vaccine_type_id: '8jf30j19-0262-9017-g8kh-7h418k11fkh1',
        scheduled_date: '2025-10-22T13:45:00Z',
        notes: 'Vaccine Bạch hầu mèo (FeLV) cho Princess',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '9i9394-9999-9999-9999-999999999999',
        pet_id: 'pet-004',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        scheduled_date: '2025-10-23T10:00:00Z',
        notes: 'Vaccine Dại định kỳ cho mèo Luna',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '0j0405-0000-0000-0000-000000000000',
        pet_id: 'pet-019',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-10-25T14:30:00Z',
        notes: 'Vaccine Dại cho chó Buddy',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 10/2025 - Tuần 4
    {
        id: '1k1516-1111-1111-1111-111111111112',
        pet_id: 'pet-027',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        scheduled_date: '2025-10-27T09:15:00Z',
        notes: 'Vaccine 4 bệnh cho mèo Simba',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '2l2627-2222-2222-2222-222222222223',
        pet_id: 'pet-012',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-10-28T11:30:00Z',
        notes: 'Vaccine 7 bệnh cho chó Rocky',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '3m3738-3333-3333-3333-333333333334',
        pet_id: 'pet-038',
        vaccine_type_id: '0lh52l31-2484-1239-i0mj-9j630m33hkj3',
        scheduled_date: '2025-10-30T15:00:00Z',
        notes: 'Vaccine FIP cho mèo Nala',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 11/2025 - Tuần 1
    {
        id: '4n4849-4444-4444-4444-444444444445',
        pet_id: 'pet-005',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-11-03T10:00:00Z',
        notes: 'Vaccine Dại cho chó Charlie',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '5o5960-5555-5555-5555-555555555556',
        pet_id: 'pet-024',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        scheduled_date: '2025-11-05T13:30:00Z',
        notes: 'Vaccine Dại cho mèo Chloe',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '6p6071-6666-6666-6666-666666666667',
        pet_id: 'pet-009',
        vaccine_type_id: '7ie29i08-9151-8906-f7jg-6g307j00ejg0',
        scheduled_date: '2025-11-06T09:45:00Z',
        notes: 'Vaccine Viêm gan truyền nhiễm cho chó Cooper',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '7q7182-7777-7777-7777-777777777778',
        pet_id: 'pet-031',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        scheduled_date: '2025-11-08T14:15:00Z',
        notes: 'Vaccine 4 bệnh cho mèo Mochi',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 11/2025 - Tuần 2
    {
        id: '8r8293-8888-8888-8888-888888888889',
        pet_id: 'pet-016',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-11-10T10:30:00Z',
        notes: 'Vaccine 7 bệnh cho chó Duke',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '9s9304-9999-9999-9999-999999999990',
        pet_id: 'pet-022',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-11-12T11:00:00Z',
        notes: 'Vaccine Dại cho chó Bailey',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '0t0415-0000-0000-0000-000000000001',
        pet_id: 'pet-035',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        scheduled_date: '2025-11-14T15:45:00Z',
        notes: 'Vaccine Dại cho mèo Oreo',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 11/2025 - Tuần 3
    {
        id: '1u1526-1111-1111-1111-111111111113',
        pet_id: 'pet-007',
        vaccine_type_id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        scheduled_date: '2025-11-17T08:30:00Z',
        notes: 'Vaccine Ho cũi chó cho Daisy',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '2v2637-2222-2222-2222-222222222224',
        pet_id: 'pet-029',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        scheduled_date: '2025-11-19T13:00:00Z',
        notes: 'Vaccine 4 bệnh cho mèo Tiger',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '3w3748-3333-3333-3333-333333333335',
        pet_id: 'pet-011',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-11-21T10:15:00Z',
        notes: 'Vaccine 7 bệnh cho chó Sadie',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '4x4859-4444-4444-4444-444444444446',
        pet_id: 'pet-040',
        vaccine_type_id: '8jf30j19-0262-9017-g8kh-7h418k11fkh1',
        scheduled_date: '2025-11-23T14:30:00Z',
        notes: 'Vaccine Bạch hầu mèo (FeLV) cho Shadow',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    // Tháng 11/2025 - Tuần 4
    {
        id: '5y5960-5555-5555-5555-555555555557',
        pet_id: 'pet-018',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        scheduled_date: '2025-11-25T09:00:00Z',
        notes: 'Vaccine Dại cho chó Molly',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '6z6071-6666-6666-6666-666666666668',
        pet_id: 'pet-033',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        scheduled_date: '2025-11-27T11:30:00Z',
        notes: 'Vaccine Dại cho mèo Mittens',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '7a7182-7777-7777-7777-777777777779',
        pet_id: 'pet-014',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        scheduled_date: '2025-11-28T15:00:00Z',
        notes: 'Vaccine 7 bệnh cho chó Tucker',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    },
    {
        id: '8b8293-8888-8888-8888-888888888880',
        pet_id: 'pet-025',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        scheduled_date: '2025-11-30T10:45:00Z',
        notes: 'Vaccine 4 bệnh cho mèo Jasper',
        status: 'scheduled',
        createdAt: '2024-10-09T10:00:00Z'
    }
];

// Mock Vaccination Records database
// Updated next_due_date to show diverse vaccination statuses
// Assuming current date is around October 9, 2025
let MOCK_VACCINATION_RECORDS = [
    {
        id: 'vr-001',
        pet_id: 'pet-001',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        vaccination_date: '2024-01-15T10:21:43.7742Z',
        next_due_date: '2025-01-15T10:21:43.7742Z', // Quá hạn ~9 tháng (Overdue)
        veterinarian: 'Dr. Nguyễn Văn A',
        clinic_name: 'Phòng khám thú y Sài Gòn',
        batch_number: 'RB2024-001-VN',
        notes: 'Tiêm phòng bệnh dại định kỳ, sức khỏe tốt',
        schedule_id: '1a1b1c1d-1111-1111-1111-111111111111',
        status: 'completed',
        createdAt: '2024-01-15T10:21:43.7742Z'
    },
    {
        id: 'vr-002',
        pet_id: 'pet-001',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        vaccination_date: '2024-02-10T14:30:00Z',
        next_due_date: '2025-10-09T14:30:00Z', // Đến hạn hôm nay (Due Today)
        veterinarian: 'Dr. Trần Thị B',
        clinic_name: 'Bệnh viện thú y Hà Nội',
        batch_number: 'DH7-2024-055-VN',
        notes: 'Vaccine 7 bệnh, không có phản ứng phụ',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-02-10T14:30:00Z'
    },
    {
        id: 'vr-003',
        pet_id: 'pet-002',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        vaccination_date: '2024-03-10T09:15:00Z',
        next_due_date: '2025-10-12T09:15:00Z', // Còn 3 ngày (Due in 1-7 days)
        veterinarian: 'Dr. Lê Văn C',
        clinic_name: 'Phòng khám Pet Care',
        batch_number: 'RB-CAT-2024-012',
        notes: 'Tiêm vaccine dại cho mèo, phản ứng tốt',
        schedule_id: '2b2c2d2e-2222-2222-2222-222222222222',
        status: 'completed',
        createdAt: '2024-03-10T09:15:00Z'
    },
    {
        id: 'vr-004',
        pet_id: 'pet-002',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        vaccination_date: '2024-04-20T11:00:00Z',
        next_due_date: '2025-10-15T11:00:00Z', // Còn 6 ngày (Due in 1-7 days)
        veterinarian: 'Dr. Lê Văn C',
        clinic_name: 'Phòng khám Pet Care',
        batch_number: 'FVRCP-2024-088',
        notes: 'Vaccine 4 bệnh cho mèo, sức khỏe tốt',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-04-20T11:00:00Z'
    },
    {
        id: 'vr-005',
        pet_id: 'pet-003',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        vaccination_date: '2024-02-20T13:45:00Z',
        next_due_date: '2025-10-20T13:45:00Z', // Còn 11 ngày (Due in 8-30 days)
        veterinarian: 'Dr. Phạm Thị D',
        clinic_name: 'Bệnh viện thú y quốc tế',
        batch_number: 'RB2024-045-INT',
        notes: 'Vaccine dại cho chó Husky Max',
        schedule_id: '3c3d3e3f-3333-3333-3333-333333333333',
        status: 'completed',
        createdAt: '2024-02-20T13:45:00Z'
    },
    {
        id: 'vr-006',
        pet_id: 'pet-013',
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        vaccination_date: '2024-05-10T10:00:00Z',
        next_due_date: '2025-11-05T10:00:00Z', // Còn 27 ngày (Due in 8-30 days)
        veterinarian: 'Dr. Hoàng Văn E',
        clinic_name: 'Phòng khám Pet Health',
        batch_number: 'RB2024-120-VN',
        notes: 'Tiêm phòng dại cho Bella',
        schedule_id: '4d4e4f40-4444-4444-4444-444444444444',
        status: 'completed',
        createdAt: '2024-05-10T10:00:00Z'
    },
    {
        id: 'vr-007',
        pet_id: 'pet-034',
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        vaccination_date: '2024-10-01T14:00:00Z',
        next_due_date: '2025-11-15T14:00:00Z', // Còn 37 ngày (Due in 31-90 days)
        veterinarian: 'Dr. Hà Văn L',
        clinic_name: 'Phòng khám Kitty Care',
        batch_number: 'RB-CAT-2024-155',
        notes: 'Vaccine dại cho mèo Kitty',
        schedule_id: '5e5f5051-5555-5555-5555-555555555555',
        status: 'completed',
        createdAt: '2024-10-01T14:00:00Z'
    },
    {
        id: 'vr-008',
        pet_id: 'pet-015',
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        vaccination_date: '2024-08-15T09:30:00Z',
        next_due_date: '2025-12-10T09:30:00Z', // Còn 62 ngày (Due in 31-90 days)
        veterinarian: 'Dr. Mai Thị F',
        clinic_name: 'Bệnh viện thú y Đà Nẵng',
        batch_number: 'DH7-2024-188',
        notes: 'Vaccine 7 bệnh cho Luna',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-08-15T09:30:00Z'
    },
    {
        id: 'vr-009',
        pet_id: 'pet-036',
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        vaccination_date: '2024-09-05T11:15:00Z',
        next_due_date: '2026-01-15T11:15:00Z', // Còn 98 ngày (Còn thời gian > 90 days)
        veterinarian: 'Dr. Ngô Thị Q',
        clinic_name: 'Phòng khám Cat Clinic',
        batch_number: 'FVRCP-2024-200',
        notes: 'Vaccine 4 bệnh cho Princess',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-09-05T11:15:00Z'
    },
    {
        id: 'vr-010',
        pet_id: 'pet-021',
        vaccine_type_id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        vaccination_date: '2024-07-20T15:00:00Z',
        next_due_date: '2025-10-06T15:00:00Z', // Quá hạn 3 ngày (Overdue)
        veterinarian: 'Dr. Đặng Văn H',
        clinic_name: 'Bệnh viện thú y Rex Care',
        batch_number: 'KC-2024-095',
        notes: 'Vaccine ho cũi chó cho Rex',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-07-20T15:00:00Z'
    }
];

// Helper function to get pets data (will be imported from petApi)
// For now, we'll use a simple reference - this will be replaced with import
const getPetsData = () => {
    // This is a placeholder - in real usage, this would import from petApi
    // For now, we'll return empty array and let the calling code handle it
    return [];
};

// Vaccination APIs
const vaccinationApi = {
    // ==================== VACCINE TYPES APIs ====================

    // Get all vaccine types
    async getVaccineTypes(speciesId = null) {
        await delay(200);

        let vaccineTypes = [...MOCK_VACCINE_TYPES];

        if (speciesId) {
            vaccineTypes = vaccineTypes.filter(vt => vt.species_id === speciesId);
        }

        return { success: true, data: vaccineTypes };
    },

    // Create vaccine type
    async createVaccineType(vaccineData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền thêm loại vaccine');
        }

        // Validate required fields
        if (!vaccineData.name || !vaccineData.name.trim()) {
            throw new Error('Tên vaccine là bắt buộc');
        }

        if (!vaccineData.species_id) {
            throw new Error('Loài thú cưng là bắt buộc');
        }

        if (!vaccineData.interval_months || vaccineData.interval_months < 1) {
            throw new Error('Khoảng thời gian tiêm lại không hợp lệ');
        }

        const newVaccineType = {
            id: generateId('vt'),
            name: vaccineData.name.trim(),
            description: vaccineData.description || '',
            species_id: vaccineData.species_id,
            interval_months: parseInt(vaccineData.interval_months),
            required_doses: parseInt(vaccineData.required_doses) || 0,
            is_required: vaccineData.is_required || false,
            createdAt: new Date().toISOString()
        };

        MOCK_VACCINE_TYPES.push(newVaccineType);

        return { success: true, data: newVaccineType, message: 'Thêm loại vaccine thành công' };
    },

    // Update vaccine type
    async updateVaccineType(vaccineTypeId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật loại vaccine');
        }

        const vaccineTypeIndex = MOCK_VACCINE_TYPES.findIndex(vt => vt.id === vaccineTypeId);

        if (vaccineTypeIndex === -1) {
            throw new Error('Không tìm thấy loại vaccine');
        }

        // Validate
        if (updates.name && !updates.name.trim()) {
            throw new Error('Tên vaccine không được để trống');
        }

        if (updates.interval_months && updates.interval_months < 1) {
            throw new Error('Khoảng thời gian tiêm lại không hợp lệ');
        }

        // Apply updates
        const allowedFields = ['name', 'description', 'species_id', 'interval_months', 'required_doses', 'is_required'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'name' || field === 'description') {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = updates[field]?.trim ? updates[field].trim() : updates[field];
                } else if (field === 'interval_months' || field === 'required_doses') {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = parseInt(updates[field]);
                } else {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = updates[field];
                }
            }
        });

        MOCK_VACCINE_TYPES[vaccineTypeIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_VACCINE_TYPES[vaccineTypeIndex],
            message: 'Cập nhật loại vaccine thành công'
        };
    },

    // Delete vaccine type
    async deleteVaccineType(vaccineTypeId) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền xóa loại vaccine');
        }

        const vaccineTypeIndex = MOCK_VACCINE_TYPES.findIndex(vt => vt.id === vaccineTypeId);

        if (vaccineTypeIndex === -1) {
            throw new Error('Không tìm thấy loại vaccine');
        }

        // Check if this vaccine type is being used in any vaccination records
        const isUsedInRecords = MOCK_VACCINATION_RECORDS.some(r => r.vaccine_type_id === vaccineTypeId);
        const isUsedInSchedules = MOCK_VACCINATION_SCHEDULES.some(s => s.vaccine_type_id === vaccineTypeId);

        if (isUsedInRecords || isUsedInSchedules) {
            throw new Error('Không thể xóa loại vaccine này vì đang được sử dụng trong hồ sơ hoặc lịch tiêm');
        }

        const deletedVaccineType = MOCK_VACCINE_TYPES[vaccineTypeIndex];
        MOCK_VACCINE_TYPES.splice(vaccineTypeIndex, 1);

        return {
            success: true,
            data: deletedVaccineType,
            message: 'Xóa loại vaccine thành công'
        };
    },

    // ==================== VACCINATION SCHEDULES APIs ====================

    // Get vaccination schedules
    async getVaccinationSchedules(petId = null, petsData = []) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem lịch tiêm phòng');
        }

        let schedules = [...MOCK_VACCINATION_SCHEDULES];

        if (petId) {
            schedules = schedules.filter(s => s.pet_id === petId);
        }

        // Populate vaccine type information
        schedules = schedules.map(schedule => {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === schedule.vaccine_type_id);
            const pet = petsData.find(p => p.id === schedule.pet_id);
            return {
                ...schedule,
                vaccine_type: vaccineType,
                pet: pet ? { id: pet.id, name: pet.name, species: pet.species } : null
            };
        });

        // Sort by scheduled date (nearest first)
        schedules.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

        return { success: true, data: schedules };
    },

    // Create vaccination schedule
    async createVaccinationSchedule(scheduleData, petsData = []) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền tạo lịch tiêm phòng');
        }

        // Validate required fields
        if (!scheduleData.pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }

        if (!scheduleData.vaccine_type_id) {
            throw new Error('Loại vaccine là bắt buộc');
        }

        if (!scheduleData.scheduled_date) {
            throw new Error('Ngày tiêm dự kiến là bắt buộc');
        }

        // Check if pet exists
        const pet = petsData.find(p => p.id === scheduleData.pet_id);
        if (!pet) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // Check if vaccine type exists
        const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === scheduleData.vaccine_type_id);
        if (!vaccineType) {
            throw new Error('Không tìm thấy loại vaccine');
        }

        const newSchedule = {
            id: generateId('vs'),
            pet_id: scheduleData.pet_id,
            vaccine_type_id: scheduleData.vaccine_type_id,
            scheduled_date: scheduleData.scheduled_date,
            notes: scheduleData.notes || '',
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        MOCK_VACCINATION_SCHEDULES.push(newSchedule);

        return { success: true, data: newSchedule, message: 'Tạo lịch tiêm phòng thành công' };
    },

    // Update vaccination schedule
    async updateVaccinationSchedule(scheduleId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật lịch tiêm phòng');
        }

        const scheduleIndex = MOCK_VACCINATION_SCHEDULES.findIndex(s => s.id === scheduleId);

        if (scheduleIndex === -1) {
            throw new Error('Không tìm thấy lịch tiêm phòng');
        }

        // Apply updates
        const allowedFields = ['scheduled_date', 'notes', 'status'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                MOCK_VACCINATION_SCHEDULES[scheduleIndex][field] = updates[field];
            }
        });

        MOCK_VACCINATION_SCHEDULES[scheduleIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_VACCINATION_SCHEDULES[scheduleIndex],
            message: 'Cập nhật lịch tiêm phòng thành công'
        };
    },

    // Delete vaccination schedule
    async deleteVaccinationSchedule(scheduleId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền xóa lịch tiêm phòng');
        }

        const scheduleIndex = MOCK_VACCINATION_SCHEDULES.findIndex(s => s.id === scheduleId);

        if (scheduleIndex === -1) {
            throw new Error('Không tìm thấy lịch tiêm phòng');
        }

        const deletedSchedule = MOCK_VACCINATION_SCHEDULES[scheduleIndex];
        MOCK_VACCINATION_SCHEDULES.splice(scheduleIndex, 1);

        return {
            success: true,
            data: deletedSchedule,
            message: 'Xóa lịch tiêm phòng thành công'
        };
    },

    // ==================== VACCINATION RECORDS APIs ====================

    // Get vaccination records
    async getVaccinationRecords(petId = null, petsData = []) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem hồ sơ tiêm phòng');
        }

        let records = [...MOCK_VACCINATION_RECORDS];

        if (petId) {
            records = records.filter(r => r.pet_id === petId);
        }

        // Populate vaccine type and pet information
        records = records.map(record => {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === record.vaccine_type_id);
            const pet = petsData.find(p => p.id === record.pet_id);
            const schedule = record.schedule_id
                ? MOCK_VACCINATION_SCHEDULES.find(s => s.id === record.schedule_id)
                : null;

            return {
                ...record,
                vaccine_type: vaccineType,
                pet: pet ? { id: pet.id, name: pet.name, species: pet.species } : null,
                schedule: schedule
            };
        });

        // Sort by vaccination date (newest first)
        records.sort((a, b) => new Date(b.vaccination_date) - new Date(a.vaccination_date));

        return { success: true, data: records };
    },

    // Create vaccination record
    async createVaccinationRecord(recordData, petsData = []) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền tạo hồ sơ tiêm phòng');
        }

        // Validate required fields
        if (!recordData.pet_id) {
            throw new Error('Thú cưng là bắt buộc');
        }

        if (!recordData.vaccine_type_id) {
            throw new Error('Loại vaccine là bắt buộc');
        }

        if (!recordData.vaccination_date) {
            throw new Error('Ngày tiêm là bắt buộc');
        }

        if (!recordData.next_due_date) {
            throw new Error('Ngày tiêm tiếp theo là bắt buộc');
        }

        // Validate dates logic
        const vaccinationDate = new Date(recordData.vaccination_date);
        const nextDueDate = new Date(recordData.next_due_date);
        const today = new Date();

        if (vaccinationDate > today) {
            throw new Error('Ngày tiêm không được là ngày trong tương lai');
        }

        if (nextDueDate <= vaccinationDate) {
            throw new Error('Ngày tiêm lại phải sau ngày tiêm');
        }

        // Check minimum interval (at least 7 days)
        const daysDiff = Math.floor((nextDueDate - vaccinationDate) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
            throw new Error('Ngày tiêm lại phải cách ngày tiêm ít nhất 7 ngày');
        }

        // Check if pet exists
        const pet = petsData.find(p => p.id === recordData.pet_id);
        if (!pet) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // Check if vaccine type exists
        const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === recordData.vaccine_type_id);
        if (!vaccineType) {
            throw new Error('Không tìm thấy loại vaccine');
        }

        const newRecord = {
            id: generateId('vr'),
            pet_id: recordData.pet_id,
            vaccine_type_id: recordData.vaccine_type_id,
            vaccination_date: recordData.vaccination_date,
            next_due_date: recordData.next_due_date,
            veterinarian: recordData.veterinarian || '',
            clinic_name: recordData.clinic_name || '',
            batch_number: recordData.batch_number || '',
            notes: recordData.notes || '',
            schedule_id: recordData.schedule_id || null,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        MOCK_VACCINATION_RECORDS.push(newRecord);

        // If this record is linked to a schedule, update schedule status
        if (recordData.schedule_id) {
            const scheduleIndex = MOCK_VACCINATION_SCHEDULES.findIndex(
                s => s.id === recordData.schedule_id
            );
            if (scheduleIndex !== -1) {
                MOCK_VACCINATION_SCHEDULES[scheduleIndex].status = 'completed';
            }
        }

        return { success: true, data: newRecord, message: 'Tạo hồ sơ tiêm phòng thành công' };
    },

    // Update vaccination record
    async updateVaccinationRecord(recordId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật hồ sơ tiêm phòng');
        }

        const recordIndex = MOCK_VACCINATION_RECORDS.findIndex(r => r.id === recordId);

        if (recordIndex === -1) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }

        // Apply updates
        const allowedFields = [
            'vaccination_date', 'next_due_date', 'veterinarian',
            'clinic_name', 'batch_number', 'notes', 'status'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                MOCK_VACCINATION_RECORDS[recordIndex][field] = updates[field];
            }
        });

        MOCK_VACCINATION_RECORDS[recordIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_VACCINATION_RECORDS[recordIndex],
            message: 'Cập nhật hồ sơ tiêm phòng thành công'
        };
    },

    // Delete vaccination record
    async deleteVaccinationRecord(recordId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền xóa hồ sơ tiêm phòng');
        }

        const recordIndex = MOCK_VACCINATION_RECORDS.findIndex(r => r.id === recordId);

        if (recordIndex === -1) {
            throw new Error('Không tìm thấy hồ sơ tiêm phòng');
        }

        const deletedRecord = MOCK_VACCINATION_RECORDS[recordIndex];
        MOCK_VACCINATION_RECORDS.splice(recordIndex, 1);

        return {
            success: true,
            data: deletedRecord,
            message: 'Xóa hồ sơ tiêm phòng thành công'
        };
    },

    // ==================== VACCINATION ANALYTICS ====================

    // Get upcoming vaccinations (schedules due soon)
    async getUpcomingVaccinations(daysAhead = 30, petsData = []) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem lịch tiêm phòng');
        }

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        let upcomingSchedules = MOCK_VACCINATION_SCHEDULES.filter(schedule => {
            const scheduleDate = new Date(schedule.scheduled_date);
            return scheduleDate >= today &&
                scheduleDate <= futureDate &&
                schedule.status === 'scheduled';
        });

        // Populate with vaccine type and pet information
        upcomingSchedules = upcomingSchedules.map(schedule => {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === schedule.vaccine_type_id);
            const pet = petsData.find(p => p.id === schedule.pet_id);
            return {
                ...schedule,
                vaccine_type: vaccineType,
                pet: pet ? { id: pet.id, name: pet.name, species: pet.species, avatar: pet.avatar } : null
            };
        });

        // Sort by scheduled date (nearest first)
        upcomingSchedules.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

        return { success: true, data: upcomingSchedules };
    },

    // Get overdue vaccinations (based on next_due_date in records)
    async getOverdueVaccinations(petsData = []) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem thông tin tiêm phòng');
        }

        const today = new Date();

        // Get all pets and their latest vaccination records
        const petsWithOverdueVaccinations = [];

        petsData.forEach(pet => {
            const petRecords = MOCK_VACCINATION_RECORDS.filter(r => r.pet_id === pet.id);

            // Group by vaccine type
            const vaccineTypeMap = {};
            petRecords.forEach(record => {
                if (!vaccineTypeMap[record.vaccine_type_id] ||
                    new Date(record.vaccination_date) > new Date(vaccineTypeMap[record.vaccine_type_id].vaccination_date)) {
                    vaccineTypeMap[record.vaccine_type_id] = record;
                }
            });

            // Check for overdue vaccinations
            Object.values(vaccineTypeMap).forEach(latestRecord => {
                const nextDueDate = new Date(latestRecord.next_due_date);
                if (nextDueDate < today) {
                    const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === latestRecord.vaccine_type_id);
                    petsWithOverdueVaccinations.push({
                        pet: { id: pet.id, name: pet.name, species: pet.species, avatar: pet.avatar },
                        vaccine_type: vaccineType,
                        last_vaccination_date: latestRecord.vaccination_date,
                        next_due_date: latestRecord.next_due_date,
                        days_overdue: Math.floor((today - nextDueDate) / (1000 * 60 * 60 * 24))
                    });
                }
            });
        });

        // Sort by days overdue (most overdue first)
        petsWithOverdueVaccinations.sort((a, b) => b.days_overdue - a.days_overdue);

        return { success: true, data: petsWithOverdueVaccinations };
    },

    // Get vaccination statistics
    async getVaccinationStats() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const stats = {
            total_vaccine_types: MOCK_VACCINE_TYPES.length,
            total_schedules: MOCK_VACCINATION_SCHEDULES.length,
            upcoming_schedules: MOCK_VACCINATION_SCHEDULES.filter(s => {
                const scheduleDate = new Date(s.scheduled_date);
                return scheduleDate >= today && s.status === 'scheduled';
            }).length,
            total_records: MOCK_VACCINATION_RECORDS.length,
            recent_vaccinations: MOCK_VACCINATION_RECORDS.filter(r => {
                const vaccinationDate = new Date(r.vaccination_date);
                return vaccinationDate >= thirtyDaysAgo;
            }).length,
            completed_this_month: MOCK_VACCINATION_RECORDS.filter(r => {
                const vaccinationDate = new Date(r.vaccination_date);
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return vaccinationDate >= startOfMonth && vaccinationDate <= today;
            }).length
        };

        return { success: true, data: stats };
    }
};

// Export both named and default
export {
    vaccinationApi,
    MOCK_VACCINE_TYPES,
    MOCK_VACCINATION_SCHEDULES,
    MOCK_VACCINATION_RECORDS
};
export default vaccinationApi;

