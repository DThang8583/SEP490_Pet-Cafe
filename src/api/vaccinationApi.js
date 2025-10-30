import axios from 'axios';
import { MOCK_PET_SPECIES } from './mockData';

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

// Helper function to get species data
const getSpeciesById = (speciesId) => {
    return MOCK_PET_SPECIES.find(s => s.id === speciesId) || null;
};

// Mock Vaccine Types database - Match official API structure
let MOCK_VACCINE_TYPES = [
    // DOG VACCINES
    {
        id: '2c4a59db-5c73-4aad-ab0f-7e68bf742234',
        name: 'Vắc-xin 7 Bệnh Tổng hợp',
        description: 'Vắc-xin phòng ngừa các bệnh như Parvo, Care, Viêm gan truyền nhiễm, Ho cũi, Cúm, và 2 chủng Leptospirosis.',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // Chó
        interval_months: 12,
        required_doses: 3,
        is_required: true,
        species: null, // Will be populated by API
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:38:27.809685+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:38:27.809686+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Vắc-xin Dại (Rabies)',
        description: 'Vắc-xin phòng bệnh dại cho chó, bắt buộc tiêm hàng năm theo quy định pháp luật.',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        interval_months: 12,
        required_doses: 2,
        is_required: true,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:37:15.500000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:37:15.500000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        name: 'Vắc-xin DHPPi+L (8 bệnh)',
        description: 'Vắc-xin phòng 8 bệnh cho chó: Carré, Parvo, Viêm gan, Para-influenza, Ho cũi và 3 chủng Leptospirosis.',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        interval_months: 12,
        required_doses: 3,
        is_required: true,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:40:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:40:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7ie29i08-9151-8906-f7jg-6g307j00ejg0',
        name: 'Vắc-xin Viêm gan truyền nhiễm (Hepatitis)',
        description: 'Vắc-xin phòng viêm gan truyền nhiễm cho chó, thường kết hợp trong vắc-xin đa giá.',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        interval_months: 12,
        required_doses: 2,
        is_required: false,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:41:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:41:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        name: 'Vắc-xin Ho cũi chó (Kennel Cough)',
        description: 'Vắc-xin phòng ho cũi chó (Bordetella bronchiseptica), cần thiết cho chó sống tập thể.',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        interval_months: 6,
        required_doses: 1,
        is_required: false,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:42:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:42:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // CAT VACCINES
    {
        id: '818b3688-d142-4d4d-97a5-1339b4b5cf29',
        name: 'Vắc-xin Tổng hợp FPV/FHV/FCV',
        description: 'Phòng ngừa Viêm ruột do Parvovirus (FPV), Viêm mũi khí quản (FHV) và Bệnh Calicivirus (FCV).',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // Mèo
        interval_months: 12,
        required_doses: 3,
        is_required: true,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:39:20.704541+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:39:20.704541+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        name: 'Vắc-xin Dại cho Mèo (Rabies)',
        description: 'Vắc-xin phòng bệnh dại cho mèo, bắt buộc tiêm hàng năm.',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        interval_months: 12,
        required_doses: 2,
        is_required: true,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:37:30.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:37:30.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        name: 'Vắc-xin FVRCP (4 bệnh)',
        description: 'Vắc-xin phòng 4 bệnh cho mèo: Viêm mũi khí quản, Calicivirus, Viêm ruột Parvovirus và Chlamydia.',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        interval_months: 12,
        required_doses: 3,
        is_required: true,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:43:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:43:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '8jf30j19-0262-9017-g8kh-7h418k11fkh1',
        name: 'Vắc-xin Bạch hầu Mèo (FeLV)',
        description: 'Vắc-xin phòng bệnh bạch hầu ở mèo, khuyến nghị cho mèo sống ngoài trời hoặc tiếp xúc mèo khác.',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        interval_months: 12,
        required_doses: 2,
        is_required: false,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:44:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:44:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '0lh52l31-2484-1239-i0mj-9j630m33hkj3',
        name: 'Vắc-xin FIP (Viêm phúc mạc truyền nhiễm)',
        description: 'Vắc-xin phòng viêm phúc mạc truyền nhiễm ở mèo, dùng cho mèo có nguy cơ cao.',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        interval_months: 12,
        required_doses: 2,
        is_required: false,
        species: null,
        vaccination_records: [],
        vaccination_schedules: [],
        created_at: '2025-10-27T06:45:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:45:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Mock Vaccination Schedules database - Using REAL pet IDs and vaccine type IDs
let MOCK_VACCINATION_SCHEDULES = [
    // ============== THÁNG 11/2025 - SẮP TỚI ==============

    // Tuần 1 (1-7/11/2025)
    {
        id: '1a1b1c1d-1111-1111-1111-111111111111',
        pet_id: '72ab5c8f-cec6-42ce-87c7-6f6a55850c6a', // Bella (Poodle)
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Vắc-xin Dại
        scheduled_date: '2025-11-03T09:00:00Z',
        status: 'PENDING',
        completed_date: null,
        notes: 'Tiêm phòng dại định kỳ hàng năm cho Bella',
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '2b2c2d2e-2222-2222-2222-222222222222',
        pet_id: '1bd898d4-dd4a-4101-8e35-7b3fc40159e3', // Milo (Scottish Fold)
        vaccine_type_id: '818b3688-d142-4d4d-97a5-1339b4b5cf29', // Vắc-xin FPV/FHV/FCV
        scheduled_date: '2025-11-05T14:00:00Z',
        notes: 'Tiêm phòng tổng hợp cho Milo - định kỳ hàng năm',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '3c3d3e3f-3333-3333-3333-333333333333',
        pet_id: 'cc33dd44-ee55-ff66-7788-99001122aabb', // Max (Golden Retriever)
        vaccine_type_id: '2c4a59db-5c73-4aad-ab0f-7e68bf742234', // Vắc-xin 7 Bệnh
        scheduled_date: '2025-11-07T10:30:00Z',
        notes: 'Tiêm vắc-xin 7 bệnh tổng hợp cho Max',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },

    // Tuần 2 (8-14/11/2025)
    {
        id: '4d4e4f40-4444-4444-4444-444444444444',
        pet_id: 'aa11bb22-cc33-dd44-ee55-ff6677889900', // Luna (Scottish Fold)
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Vắc-xin Dại cho Mèo
        scheduled_date: '2025-11-10T09:00:00Z',
        notes: 'Tiêm phòng dại cho Luna - mèo cần tiêm định kỳ',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '5e5f5051-5555-5555-5555-555555555555',
        pet_id: 'dd44ee55-ff66-7788-9900-1122aabbccdd', // Charlie (Labrador)
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8', // DHPPi+L (8 bệnh)
        scheduled_date: '2025-11-12T15:00:00Z',
        notes: 'Tiêm vắc-xin 8 bệnh cho Charlie - bảo vệ toàn diện',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },

    // Tuần 3 (15-21/11/2025)
    {
        id: '6f6071-6666-6666-6666-666666666666',
        pet_id: 'bb22cc33-dd44-ee55-ff66-778899001122', // Oliver (Scottish Fold)

        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9', // FVRCP (4 bệnh)
        scheduled_date: '2025-11-17T10:00:00Z',
        notes: 'Tiêm vắc-xin 4 bệnh cho Oliver',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '7g7172-7777-7777-7777-777777777777',
        pet_id: '77889900-1122-3344-5566-778899aabbcc', // Buddy (Golden Retriever)

        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Vắc-xin Dại
        scheduled_date: '2025-11-19T14:30:00Z',
        notes: 'Tiêm phòng dại định kỳ cho Buddy',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '8h8283-8888-8888-8888-888888888888',
        pet_id: '88990011-2233-4455-6677-8899aabbccdd', // Lucy (Labrador)

        vaccine_type_id: '2c4a59db-5c73-4aad-ab0f-7e68bf742234', // Vắc-xin 7 Bệnh
        scheduled_date: '2025-11-24T11:00:00Z',
        notes: 'Tiêm vắc-xin 7 bệnh cho Lucy',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '9i9394-9999-9999-9999-999999999999',
        pet_id: '99001122-3344-5566-7788-99aabbccddee', // Tiny (Chihuahua)
        vaccine_type_id: '9kg41k20-1373-0128-h9li-8i529l22gki2', // Ho cũi chó
        scheduled_date: '2025-11-26T08:30:00Z',
        notes: 'Tiêm vắc-xin ho cũi cho Tiny - định kỳ 6 tháng',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '0j0405-0000-0000-0000-000000000000',
        pet_id: '00112233-4455-6677-8899-aabbccddeeff', // Hachi (Shiba Inu)
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Vắc-xin Dại
        scheduled_date: '2025-11-28T13:00:00Z',
        notes: 'Tiêm phòng dại cho Hachi',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },

    // ============== THÁNG 12/2025 ==============
    {
        id: '1k1516-1111-1111-1111-111111111112',
        pet_id: '11223344-5566-7788-99aa-bbccddeeff00', // Mochi (Shiba Inu)
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8', // DHPPi+L
        scheduled_date: '2025-12-03T10:15:00Z',
        notes: 'Tiêm vắc-xin 8 bệnh cho Mochi',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '2l2627-2222-2222-2222-222222222223',
        pet_id: '22334455-6677-8899-aabb-ccddeeff0011', // Corgito (Corgi)
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Dại
        scheduled_date: '2025-12-05T14:00:00Z',
        notes: 'Tiêm phòng dại định kỳ cho Corgito',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },
    {
        id: '3m3738-3333-3333-3333-333333333334',
        pet_id: '33445566-7788-99aa-bbcc-ddeeff001122', // Ein (Corgi)
        vaccine_type_id: '2c4a59db-5c73-4aad-ab0f-7e68bf742234', // 7 bệnh
        scheduled_date: '2025-12-08T09:30:00Z',
        notes: 'Tiêm vắc-xin 7 bệnh cho Ein',
        status: 'PENDING',
        completed_date: null,
        record_id: null,
        record: null,
        createdAt: '2025-10-30T10:00:00Z'
    },

    // ============== ĐÃ HOÀN THÀNH (COMPLETED) ==============
    {
        id: '9c9304-9999-9999-9999-999999999881',
        pet_id: '72ab5c8f-cec6-42ce-87c7-6f6a55850c6a', // Bella
        vaccine_type_id: '2c4a59db-5c73-4aad-ab0f-7e68bf742234', // 7 bệnh
        scheduled_date: '2025-10-27T08:09:00+00:00',
        status: 'COMPLETED',
        completed_date: '2025-10-27T09:46:08.684208+00:00',
        notes: 'Tiêm nhắc lại vắc-xin hàng năm. Đã hoàn thành, không có phản ứng phụ.',
        record_id: 'vr-011',
        record: null,
        createdAt: '2025-10-20T10:00:00Z'
    },
    {
        id: '0d0415-0000-0000-0000-000000000882',
        pet_id: '1bd898d4-dd4a-4101-8e35-7b3fc40159e3', // Milo
        vaccine_type_id: '818b3688-d142-4d4d-97a5-1339b4b5cf29', // FPV/FHV/FCV
        scheduled_date: '2025-10-25T14:00:00+00:00',
        status: 'COMPLETED',
        completed_date: '2025-10-25T14:30:00+00:00',
        notes: 'Tiêm phòng tổng hợp cho mèo Milo. Hoàn thành tốt, theo dõi sau 24h không có vấn đề gì.',
        record_id: 'vr-012',
        record: null,
        createdAt: '2025-10-18T10:00:00Z'
    },
    {
        id: '1e1526-1111-1111-1111-111111111883',
        pet_id: 'cc33dd44-ee55-ff66-7788-99001122aabb', // Max
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8', // DHPPi+L
        scheduled_date: '2025-10-20T09:30:00Z',
        status: 'COMPLETED',
        completed_date: '2025-10-20T10:15:00Z',
        notes: 'Tiêm vắc-xin 8 bệnh cho Max. Đã tiêm xong, sức khỏe tốt.',
        record_id: 'vr-013',
        record: null,
        createdAt: '2025-10-10T10:00:00Z'
    },
    {
        id: '2f2637-2222-2222-2222-222222222884',
        pet_id: 'dd44ee55-ff66-7788-9900-1122aabbccdd', // Charlie
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // Dại
        scheduled_date: '2025-10-18T11:00:00Z',
        status: 'COMPLETED',
        completed_date: '2025-10-18T11:45:00Z',
        notes: 'Tiêm vắc-xin dại cho Charlie. Hoàn thành, không có biểu hiện bất thường.',
        record_id: 'vr-014',
        record: null,
        createdAt: '2025-10-08T10:00:00Z'
    },
    {
        id: '3g3748-3333-3333-3333-333333333885',
        pet_id: 'aa11bb22-cc33-dd44-ee55-ff6677889900', // Luna
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9', // FVRCP
        scheduled_date: '2025-10-22T08:30:00Z',
        status: 'COMPLETED',
        completed_date: '2025-10-22T09:00:00Z',
        notes: 'Tiêm vắc-xin 4 bệnh cho Luna. Tiêm phòng thành công, phản ứng tốt.',
        record_id: 'vr-015',
        record: null,
        createdAt: '2025-10-12T10:00:00Z'
    },
    {
        id: '4h4859-4444-4444-4444-444444444886',
        pet_id: 'bb22cc33-dd44-ee55-ff66-778899001122', // Oliver
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7', // Dại cho mèo
        scheduled_date: '2025-10-15T13:00:00Z',
        status: 'COMPLETED',
        completed_date: '2025-10-15T13:30:00Z',
        notes: 'Tiêm phòng dại cho Oliver. Hoàn thành tốt.',
        record_id: 'vr-016',
        record: null,
        createdAt: '2025-10-05T10:00:00Z'
    }
];

// Mock Vaccination Records database
// Updated next_due_date to show diverse vaccination statuses
// Assuming current date is around October 9, 2025
let MOCK_VACCINATION_RECORDS = [
    {
        id: 'vr-001',
        pet_id: 'dd44ee55-ff66-7788-9900-1122aabbccdd', // Charlie (Labrador)
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        vaccination_date: '2024-01-15T10:21:43.7742Z',
        next_due_date: '2025-01-15T10:21:43.7742Z', // Quá hạn ~9 tháng (Overdue)
        veterinarian: 'Dr. Nguyễn Văn A',
        clinic_name: 'Phòng khám thú y Sài Gòn',
        batch_number: 'RB2024-001-VN',
        notes: 'Tiêm phòng bệnh dại định kỳ cho Charlie, sức khỏe tốt',
        schedule_id: '1a1b1c1d-1111-1111-1111-111111111111',
        status: 'completed',
        createdAt: '2024-01-15T10:21:43.7742Z'
    },
    {
        id: 'vr-002',
        pet_id: 'dd44ee55-ff66-7788-9900-1122aabbccdd', // Charlie (Labrador)
        vaccine_type_id: '5gc07g86-7939-6784-d5he-4e185h88chc8',
        vaccination_date: '2024-02-10T14:30:00Z',
        next_due_date: '2025-10-09T14:30:00Z', // Đến hạn hôm nay (Due Today)
        veterinarian: 'Dr. Trần Thị B',
        clinic_name: 'Bệnh viện thú y Hà Nội',
        batch_number: 'DH7-2024-055-VN',
        notes: 'Vaccine 7 bệnh cho Charlie, không có phản ứng phụ',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-02-10T14:30:00Z'
    },
    {
        id: 'vr-003',
        pet_id: 'bb22cc33-dd44-ee55-ff66-778899001122', // Oliver (Scottish Fold)
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        vaccination_date: '2024-03-10T09:15:00Z',
        next_due_date: '2025-10-12T09:15:00Z', // Còn 3 ngày (Due in 1-7 days)
        veterinarian: 'Dr. Lê Văn C',
        clinic_name: 'Phòng khám Pet Care',
        batch_number: 'RB-CAT-2024-012',
        notes: 'Tiêm vaccine dại cho mèo Oliver, phản ứng tốt',
        schedule_id: '2b2c2d2e-2222-2222-2222-222222222222',
        status: 'completed',
        createdAt: '2024-03-10T09:15:00Z'
    },
    {
        id: 'vr-004',
        pet_id: 'bb22cc33-dd44-ee55-ff66-778899001122', // Oliver (Scottish Fold)
        vaccine_type_id: '6hd18h97-8040-7895-e6if-5f296i99dif9',
        vaccination_date: '2024-04-20T11:00:00Z',
        next_due_date: '2025-10-15T11:00:00Z', // Còn 6 ngày (Due in 1-7 days)
        veterinarian: 'Dr. Lê Văn C',
        clinic_name: 'Phòng khám Pet Care',
        batch_number: 'FVRCP-2024-088',
        notes: 'Vaccine 4 bệnh cho mèo Oliver, sức khỏe tốt',
        schedule_id: null,
        status: 'completed',
        createdAt: '2024-04-20T11:00:00Z'
    },
    {
        id: 'vr-005',
        pet_id: 'cc33dd44-ee55-ff66-7788-99001122aabb', // Max (Golden Retriever)
        vaccine_type_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        vaccination_date: '2024-02-20T13:45:00Z',
        next_due_date: '2025-10-20T13:45:00Z', // Còn 11 ngày (Due in 8-30 days)
        veterinarian: 'Dr. Phạm Thị D',
        clinic_name: 'Bệnh viện thú y quốc tế',
        batch_number: 'RB2024-045-INT',
        notes: 'Vaccine dại cho chó Golden Retriever Max',
        schedule_id: '3c3d3e3f-3333-3333-3333-333333333333',
        status: 'completed',
        createdAt: '2024-02-20T13:45:00Z'
    },
    {
        id: 'vr-006',
        pet_id: '72ab5c8f-cec6-42ce-87c7-6f6a55850c6a', // Bella (Poodle Toy)
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
        pet_id: '1bd898d4-dd4a-4101-8e35-7b3fc40159e3', // Milo (Scottish Fold)
        vaccine_type_id: '4fb96f75-6828-5673-c4gd-3d074g77bgb7',
        vaccination_date: '2024-10-01T14:00:00Z',
        next_due_date: '2025-11-15T14:00:00Z', // Còn 37 ngày (Due in 31-90 days)
        veterinarian: 'Dr. Hà Văn L',
        clinic_name: 'Phòng khám Kitty Care',
        batch_number: 'RB-CAT-2024-155',
        notes: 'Vaccine dại cho mèo Milo',
        schedule_id: '5e5f5051-5555-5555-5555-555555555555',
        status: 'completed',
        createdAt: '2024-10-01T14:00:00Z'
    },
    {
        id: 'vr-008',
        pet_id: 'aa11bb22-cc33-dd44-ee55-ff6677889900', // Luna (Scottish Fold)
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
        pet_id: '33cc44dd-55ee-66ff-7788-990011223344', // Princess (Pomeranian)
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
        pet_id: '77889900-1122-3344-5566-778899aabbcc', // Buddy (Golden Retriever)
        vaccine_type_id: '9kg41k20-1373-0128-h9li-8i529l22gki2',
        vaccination_date: '2024-07-20T15:00:00Z',
        next_due_date: '2025-10-06T15:00:00Z', // Quá hạn 3 ngày (Overdue)
        veterinarian: 'Dr. Đặng Văn H',
        clinic_name: 'Bệnh viện thú y Rex Care',
        batch_number: 'KC-2024-095',
        notes: 'Vaccine ho cũi chó cho Buddy',
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
    async getVaccineTypes(speciesId = null, page_index = 0, page_size = 10) {
        await delay(200);

        let vaccineTypes = [...MOCK_VACCINE_TYPES];

        if (speciesId) {
            vaccineTypes = vaccineTypes.filter(vt => vt.species_id === speciesId);
        }

        // Populate species object
        vaccineTypes = vaccineTypes.map(vt => ({
            ...vt,
            species: getSpeciesById(vt.species_id)
        }));

        // Pagination
        const total_items_count = vaccineTypes.length;
        const total_pages_count = Math.ceil(total_items_count / page_size);
        const start_index = page_index * page_size;
        const end_index = start_index + page_size;
        const paginatedVaccineTypes = vaccineTypes.slice(start_index, end_index);

        return {
            success: true,
            data: paginatedVaccineTypes,
            pagination: {
                total_items_count,
                page_size,
                total_pages_count,
                page_index,
                has_next: page_index < total_pages_count - 1,
                has_previous: page_index > 0
            }
        };
    },

    // Create vaccine type - Match official API
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
            required_doses: 0, // Auto-set by system
            is_required: vaccineData.is_required || false,
            species: null,
            vaccination_records: [],
            vaccination_schedules: [],
            created_at: new Date().toISOString(),
            created_by: currentUser.id,
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        MOCK_VACCINE_TYPES.push(newVaccineType);

        return { success: true, data: newVaccineType, message: 'Thêm loại vaccine thành công' };
    },

    // Update vaccine type - Match official API
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

        // Apply updates - Match official API structure (no required_doses in edit)
        const allowedFields = ['name', 'description', 'species_id', 'interval_months', 'is_required'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'name' || field === 'description') {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = updates[field]?.trim ? updates[field].trim() : updates[field];
                } else if (field === 'interval_months') {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = parseInt(updates[field]);
                } else {
                    MOCK_VACCINE_TYPES[vaccineTypeIndex][field] = updates[field];
                }
            }
        });

        MOCK_VACCINE_TYPES[vaccineTypeIndex].updated_at = new Date().toISOString();
        MOCK_VACCINE_TYPES[vaccineTypeIndex].updated_by = currentUser.id;

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
    async getVaccinationSchedules(petId = null, petsData = [], page_index = 0, page_size = 10) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem lịch tiêm phòng');
        }

        let schedules = [...MOCK_VACCINATION_SCHEDULES];

        if (petId) {
            schedules = schedules.filter(s => s.pet_id === petId);
        }

        // Populate full vaccine type, pet, and record information
        schedules = schedules.map(schedule => {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === schedule.vaccine_type_id);
            const pet = petsData.find(p => p.id === schedule.pet_id);
            const record = schedule.record_id
                ? MOCK_VACCINATION_RECORDS.find(r => r.id === schedule.record_id)
                : null;

            return {
                ...schedule,
                vaccine_type: vaccineType || null,
                pet: pet || null,
                record: record || null
            };
        });

        // Sort by scheduled date (nearest first)
        schedules.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

        // Pagination
        const total_items_count = schedules.length;
        const total_pages_count = Math.ceil(total_items_count / page_size);
        const start_index = page_index * page_size;
        const end_index = start_index + page_size;
        const paginatedSchedules = schedules.slice(start_index, end_index);

        return {
            success: true,
            data: paginatedSchedules,
            pagination: {
                total_items_count,
                page_size,
                total_pages_count,
                page_index,
                has_next: page_index < total_pages_count - 1,
                has_previous: page_index > 0
            }
        };
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
            status: 'PENDING',
            completed_date: null,
            notes: scheduleData.notes || '',
            record_id: null,
            record: null,
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

        // Validate pet_id if provided
        if (updates.pet_id) {
            // Pet validation would be done here in real API
        }

        // Validate vaccine_type_id if provided
        if (updates.vaccine_type_id) {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === updates.vaccine_type_id);
            if (!vaccineType) {
                throw new Error('Không tìm thấy loại vaccine');
            }
        }

        // Apply updates - match official API structure
        const allowedFields = ['pet_id', 'vaccine_type_id', 'scheduled_date', 'notes', 'status'];
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
                pet: pet ? {
                    id: pet.id,
                    name: pet.name,
                    species: pet.species,
                    avatar: pet.image_url || pet.avatar || pet.avatar_url || null
                } : null,
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
            status: 'COMPLETED',
            createdAt: new Date().toISOString()
        };

        MOCK_VACCINATION_RECORDS.push(newRecord);

        // If this record is linked to a schedule, update schedule status
        if (recordData.schedule_id) {
            const scheduleIndex = MOCK_VACCINATION_SCHEDULES.findIndex(
                s => s.id === recordData.schedule_id
            );
            if (scheduleIndex !== -1) {
                MOCK_VACCINATION_SCHEDULES[scheduleIndex].status = 'COMPLETED';
                MOCK_VACCINATION_SCHEDULES[scheduleIndex].completed_date = recordData.vaccination_date;
                MOCK_VACCINATION_SCHEDULES[scheduleIndex].record_id = newRecord.id;
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
                schedule.status === 'PENDING';
        });

        // Populate with vaccine type and pet information
        upcomingSchedules = upcomingSchedules.map(schedule => {
            const vaccineType = MOCK_VACCINE_TYPES.find(vt => vt.id === schedule.vaccine_type_id);
            const pet = petsData.find(p => p.id === schedule.pet_id);
            return {
                ...schedule,
                vaccine_type: vaccineType,
                pet: pet ? {
                    id: pet.id,
                    name: pet.name,
                    species: pet.species,
                    avatar: pet.image_url || pet.avatar || pet.avatar_url || null
                } : null
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
                return scheduleDate >= today && s.status === 'PENDING';
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

