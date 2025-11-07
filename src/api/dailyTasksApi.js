// API for Daily Tasks Management
// Quản lý tiến độ hoàn thành nhiệm vụ theo ngày

import { generateId } from '../utils/generateId';
import { MOCK_TEAMS } from './teamApi';
import { MOCK_SLOTS } from './slotApi';
import { MOCK_TASK_TEMPLATES } from './taskTemplateApi';

/**
 * Daily Task Status (matching backend API)
 */
export const DAILY_TASK_STATUS = {
    SCHEDULED: 'SCHEDULED',      // Chưa bắt đầu
    IN_PROGRESS: 'IN_PROGRESS',  // Đang làm
    COMPLETED: 'COMPLETED',      // Hoàn thành
    CANCELLED: 'CANCELLED',      // Đã hủy
    MISSED: 'MISSED',            // Bỏ lỡ (quá hạn không làm)
    SKIPPED: 'SKIPPED'           // Bỏ qua (có ý định)
};

/**
 * Priority levels
 */
export const TASK_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
};

/**
 * Day of week mapping
 */
export const DAY_OF_WEEK_MAP = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
};

// Helper functions
const getSlotById = (id) => MOCK_SLOTS.find(s => s.id === id);
const getTeamById = (id) => MOCK_TEAMS.find(t => t.id === id);
const getTaskById = (id) => MOCK_TASK_TEMPLATES.find(t => t.id === id);

/**
 * Mock Daily Tasks Database
 */
const MOCK_DAILY_TASKS_INITIAL = [
    // CURRENT WEEK (27/10 - 2/11/2025)

    // ========== MONDAY 27/10/2025 (Thứ Hai) ==========
    // 1. Dọn dẹp vệ sinh khu vực chó (buổi sáng) - COMPLETED
    {
        id: 'dt-mon-027-001',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Dọn dẹp vệ sinh khu vực chó (buổi sáng)',
        description: 'Vệ sinh toàn bộ khu vực chó, thu dọn chất thải, lau chùi sàn nhà và đồ chơi',
        priority: 'HIGH',
        status: 'COMPLETED',
        assigned_date: '2025-10-27T00:00:00+00:00',
        start_time: '06:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-27T07:20:00+00:00',
        task_id: 'c07h7890-h1ce-45g6-d789-759947407333',
        slot_id: '85235gfg-288h-6599-d2g4-825778722fb0',
        notes: 'Vệ sinh sạch sẽ trước giờ mở cửa.',
        task: getTaskById('c07h7890-h1ce-45g6-d789-759947407333'),
        slot: getSlotById('85235gfg-288h-6599-d2g4-825778722fb0'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-27T05:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T07:20:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 2. Cho chó ăn sáng - COMPLETED
    {
        id: 'dt-mon-027-002',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Cho chó ăn sáng',
        description: 'Chuẩn bị và phân phối thức ăn sáng cho chó theo khẩu phần riêng',
        priority: 'URGENT',
        status: 'COMPLETED',
        assigned_date: '2025-10-27T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-27T07:25:00+00:00',
        task_id: '123e4567-e89b-12d3-a456-426614174000',
        slot_id: 'a7457ihi-40aj-87b1-f4i6-a47990944hd2',
        notes: 'Tất cả các bé đều ăn ngon.',
        task: getTaskById('123e4567-e89b-12d3-a456-426614174000'),
        slot: getSlotById('a7457ihi-40aj-87b1-f4i6-a47990944hd2'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-27T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T07:25:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },

    // ========== TUESDAY 28/10/2025 (Thứ Ba) ==========
    // 3. Cho mèo ăn sáng (Task: 863b1830) - COMPLETED
    {
        id: 'dt-mon-001',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Cho mèo ăn sáng',
        description: 'Chuẩn bị và phân phối thức ăn sáng cho mèo theo khẩu phần riêng của từng bé',
        priority: 'URGENT',
        status: 'COMPLETED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-28T07:25:00+00:00',
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        slot_id: 'a7457ihi-40aj-87b1-f4i6-a47990944hd2',
        notes: 'Hoàn thành đúng giờ. Tất cả các bé đều ăn ngon.',
        task: getTaskById('863b1830-75b5-5ac8-96gg-c377327778c0'),
        slot: getSlotById('a7457ihi-40aj-87b1-f4i6-a47990944hd2'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-28T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:25:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 2. Dọn dẹp vệ sinh khu vực mèo (sáng) - COMPLETED
    {
        id: 'dt-mon-002',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Dọn dẹp vệ sinh khu vực mèo (buổi sáng)',
        description: 'Vệ sinh toàn bộ khu vực mèo, thay cát vệ sinh, lau chùi tháp mèo và đồ chơi',
        priority: 'HIGH',
        status: 'COMPLETED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '06:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-28T07:20:00+00:00',
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        slot_id: '85235gfg-288h-6599-d2g4-825778722fb0',
        notes: 'Vệ sinh kỹ lưỡng trước giờ mở cửa. Đã thay toàn bộ cát vệ sinh.',
        task: getTaskById('752a0719-64a4-49b7-85ff-b266216667b9'),
        slot: getSlotById('85235gfg-288h-6599-d2g4-825778722fb0'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-28T05:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:20:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 3. Hướng dẫn khách chơi với mèo - IN_PROGRESS
    {
        id: 'dt-mon-003',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Hướng dẫn khách chơi với mèo',
        description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa, tiếp đón và phục vụ khách trong khu vực',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '07:30:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        slot_id: '727d444e-6311-4377-86f9-acf24428dafd',
        notes: 'Hiện đang phục vụ 8 khách. Các bé mèo hoạt động tốt.',
        task: getTaskById('cfa75dab-16cf-4978-b9fb-e6da47034108'),
        slot: getSlotById('727d444e-6311-4377-86f9-acf24428dafd'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-28T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:30:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 4. Kiểm tra sức khỏe mèo - SCHEDULED
    {
        id: 'dt-mon-004',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Kiểm tra sức khỏe mèo định kỳ',
        description: 'Kiểm tra thân nhiệt, hành vi, mắt, tai, và tình trạng ăn uống của từng bé mèo hàng ngày',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '10:00:00',
        completion_date: null,
        task_id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        slot_id: 'c9679kjk-62cl-09d3-h6k8-c69bb2166jf4',
        notes: null,
        task: getTaskById('974c2941-86c6-6bd9-a7hh-d488438889d1'),
        slot: getSlotById('c9679kjk-62cl-09d3-h6k8-c69bb2166jf4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-28T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 5. Dọn dẹp vệ sinh (chiều) - SCHEDULED
    {
        id: 'dt-mon-005',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Dọn dẹp vệ sinh khu vực mèo (buổi tối)',
        description: 'Vệ sinh toàn bộ khu vực mèo, thay cát vệ sinh, lau chùi tháp mèo và đồ chơi',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '17:30:00',
        end_time: '19:00:00',
        completion_date: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        slot_id: '96346hgh-399i-76a0-e3h5-936889833gc1',
        notes: null,
        task: getTaskById('752a0719-64a4-49b7-85ff-b266216667b9'),
        slot: getSlotById('96346hgh-399i-76a0-e3h5-936889833gc1'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-28T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // DOG ZONE - MONDAY
    // 6. Cho chó ăn sáng - COMPLETED
    {
        id: 'dt-mon-006',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Cho chó ăn sáng',
        description: 'Chuẩn bị và cho chó ăn sáng theo khẩu phần, đảm bảo dinh dưỡng đầy đủ',
        priority: 'URGENT',
        status: 'COMPLETED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-28T07:28:00+00:00',
        task_id: '123e4567-e89b-12d3-a456-426614174000',
        slot_id: 'd078alml-73dm-10e4-i7l9-d70cc3277kg5',
        notes: 'Tất cả các bé đã ăn xong. Một bé Golden Retriever ăn chậm hơn bình thường, cần theo dõi.',
        task: getTaskById('123e4567-e89b-12d3-a456-426614174000'),
        slot: getSlotById('d078alml-73dm-10e4-i7l9-d70cc3277kg5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-28T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:28:00+00:00',
        updated_by: '9ddc0c75-0bd6-58bc-9e99-32fc42e815gg',
        is_deleted: false
    },
    // 7. Dắt chó đi dạo (sáng) - COMPLETED
    {
        id: 'dt-mon-007',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Dắt chó đi dạo (buổi sáng)',
        description: 'Dắt chó đi dạo trong khu vực an toàn, tập thể dục và vận động buổi sáng',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '08:00:00',
        end_time: '09:00:00',
        completion_date: '2025-10-28T09:00:00+00:00',
        task_id: 'a85f5678-f9ac-23e4-b567-537725285111',
        slot_id: 'e189bmnn-84en-21f5-j8m0-e81dd4388lh6',
        notes: 'Dạo hoàn tất. Các bé rất vui vẻ và năng động.',
        task: getTaskById('a85f5678-f9ac-23e4-b567-537725285111'),
        slot: getSlotById('e189bmnn-84en-21f5-j8m0-e81dd4388lh6'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-28T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:00:00+00:00',
        updated_by: '9ddc0c75-0bd6-58bc-9e99-32fc42e815gg',
        is_deleted: false
    },
    // 8. Vệ sinh Dog Play Area (sáng) - COMPLETED
    {
        id: 'dt-mon-008',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Vệ sinh Dog Play Area (buổi sáng)',
        description: 'Dọn dẹp khu vực chơi của chó, khử trùng thiết bị, kiểm tra và sửa chữa đồ chơi hư hỏng',
        priority: 'HIGH',
        status: 'COMPLETED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '06:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-28T07:25:00+00:00',
        task_id: 'c07h7890-h1ce-45g6-d789-759947407333',
        slot_id: 'h4b2epqq-b7hq-54i8-m1p3-hb4gg771bok9',
        notes: 'Vệ sinh hoàn tất. Phát hiện 1 đồ chơi hư, đã thay thế.',
        task: getTaskById('c07h7890-h1ce-45g6-d789-759947407333'),
        slot: getSlotById('h4b2epqq-b7hq-54i8-m1p3-hb4gg771bok9'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-28T05:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:25:00+00:00',
        updated_by: '9ddc0c75-0bd6-58bc-9e99-32fc42e815gg',
        is_deleted: false
    },
    // 9. Dắt chó đi dạo (chiều) - SCHEDULED
    {
        id: 'dt-mon-009',
        team_id: '84ec695g-9acb-5bd1-bf3f-5d670b918886',
        title: 'Dắt chó đi dạo (buổi chiều)',
        description: 'Dắt chó đi dạo trong khu vực an toàn, tập thể dục và vận động buổi sáng',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '16:00:00',
        end_time: '17:00:00',
        completion_date: null,
        task_id: 'a85f5678-f9ac-23e4-b567-537725285111',
        slot_id: 'f290cnoo-95fo-32g6-k9n1-f92ee5499mi7',
        notes: null,
        task: getTaskById('a85f5678-f9ac-23e4-b567-537725285111'),
        slot: getSlotById('f290cnoo-95fo-32g6-k9n1-f92ee5499mi7'),
        team: getTeamById('84ec695g-9acb-5bd1-bf3f-5d670b918886'),
        created_at: '2025-10-28T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 10. Vệ sinh Dog Play Area (tối) - SCHEDULED
    {
        id: 'dt-mon-010',
        team_id: '84ec695g-9acb-5bd1-bf3f-5d670b918886',
        title: 'Vệ sinh Dog Play Area (buổi tối)',
        description: 'Dọn dẹp khu vực chơi của chó, khử trùng thiết bị, kiểm tra và sửa chữa đồ chơi hư hỏng',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '18:00:00',
        end_time: '19:30:00',
        completion_date: null,
        task_id: 'c07h7890-h1ce-45g6-d789-759947407333',
        slot_id: 'i5c3fqrr-c8ir-65j9-n2q4-ic5hh882cpl0',
        notes: null,
        task: getTaskById('c07h7890-h1ce-45g6-d789-759947407333'),
        slot: getSlotById('i5c3fqrr-c8ir-65j9-n2q4-ic5hh882cpl0'),
        team: getTeamById('84ec695g-9acb-5bd1-bf3f-5d670b918886'),
        created_at: '2025-10-28T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ========== WEDNESDAY 29/10/2025 (Thứ Tư) ==========
    // 11. Cho mèo ăn sáng - COMPLETED
    {
        id: 'dt-tue-001',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Cho mèo ăn sáng',
        description: 'Chuẩn bị và phân phối thức ăn sáng cho mèo theo khẩu phần riêng của từng bé',
        priority: 'URGENT',
        status: 'COMPLETED',
        assigned_date: '2025-10-29T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-29T07:22:00+00:00',
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        slot_id: 'b8568jhj-51bk-98c2-g5j7-b58aa1055ie3',
        notes: 'Hoàn thành sớm. Mèo Scottish Fold đã ăn hết phần.',
        task: getTaskById('863b1830-75b5-5ac8-96gg-c377327778c0'),
        slot: getSlotById('b8568jhj-51bk-98c2-g5j7-b58aa1055ie3'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-29T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T07:22:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 12. Hướng dẫn khách chơi với mèo - IN_PROGRESS
    {
        id: 'dt-tue-002',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Hướng dẫn khách chơi với mèo',
        description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa, tiếp đón và phục vụ khách trong khu vực',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assigned_date: '2025-10-29T00:00:00+00:00',
        start_time: '07:30:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        slot_id: '63013ef8-066c-4b45-b0e2-603556900ca8',
        notes: 'Ca đang diễn ra tốt. Có 5 khách đang tương tác với mèo.',
        task: getTaskById('cfa75dab-16cf-4978-b9fb-e6da47034108'),
        slot: getSlotById('63013ef8-066c-4b45-b0e2-603556900ca8'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-29T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T08:45:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },

    // ========== THURSDAY 30/10/2025 (Thứ Năm - HÔM NAY) ==========
    // 13. Hướng dẫn khách chơi với mèo - CANCELLED
    {
        id: 'dt-wed-001',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Hướng dẫn khách chơi với mèo',
        description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa, tiếp đón và phục vụ khách trong khu vực',
        priority: 'MEDIUM',
        status: 'CANCELLED',
        assigned_date: '2025-10-30T00:00:00+00:00',
        start_time: '13:00:00',
        end_time: '17:00:00',
        completion_date: null,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        slot_id: '74124fef-177g-5488-c1f3-714667611ea9',
        notes: 'Hủy do sự cố mất điện. Đã thông báo khách hàng và hoàn tiền.',
        task: getTaskById('cfa75dab-16cf-4978-b9fb-e6da47034108'),
        slot: getSlotById('74124fef-177g-5488-c1f3-714667611ea9'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-30T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-30T12:30:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 14. Huấn luyện cơ bản cho chó - SCHEDULED
    {
        id: 'dt-wed-002',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Huấn luyện cơ bản cho chó',
        description: 'Huấn luyện các lệnh cơ bản: ngồi, nằm, ở lại, đến cho chó trong thời gian vui chơi với khách',
        priority: 'LOW',
        status: 'SCHEDULED',
        assigned_date: '2025-10-30T00:00:00+00:00',
        start_time: '10:00:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'b96g6789-g0bd-34f5-c678-648836396222',
        slot_id: 'g3a1dopp-a6gp-43h7-l0o2-ga3ff660anj8',
        notes: null,
        task: getTaskById('b96g6789-g0bd-34f5-c678-648836396222'),
        slot: getSlotById('g3a1dopp-a6gp-43h7-l0o2-ga3ff660anj8'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-30T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-30T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ========== FRIDAY 31/10/2025 (Thứ Sáu) ==========
    // 15. Tắm và chải lông cho chó - SCHEDULED
    {
        id: 'dt-fri-001',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Tắm và chải lông cho chó',
        description: 'Tắm rửa và chải lông cho các bé chó theo lịch định kỳ, sử dụng sản phẩm chuyên dụng',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-10-31T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'a74f2830-65a5-59c8-87gg-c388427779d1',
        slot_id: 'd8568jhj-51bk-9701-e3h5-d36889833hc2',
        notes: null,
        task: getTaskById('a74f2830-65a5-59c8-87gg-c388427779d1'),
        slot: getSlotById('d8568jhj-51bk-9701-e3h5-d36889833hc2'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-31T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-31T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 16. Kiểm tra và chăm sóc cây cảnh - SCHEDULED
    {
        id: 'dt-fri-002',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Kiểm tra và chăm sóc cây cảnh',
        description: 'Tưới nước, bón phân và kiểm tra tình trạng cây cối trong khu vực outdoor',
        priority: 'LOW',
        status: 'SCHEDULED',
        assigned_date: '2025-10-31T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '08:00:00',
        completion_date: null,
        task_id: 'b85g3941-76b6-69da-b8ii-e599539990e2',
        slot_id: 'e9679klk-72dm-1812-i7l9-e47aa3277kg5',
        notes: null,
        task: getTaskById('b85g3941-76b6-69da-b8ii-e599539990e2'),
        slot: getSlotById('e9679klk-72dm-1812-i7l9-e47aa3277kg5'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-31T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-31T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 17. Chuẩn bị thức ăn cho thú cưng (cuối tuần) - SCHEDULED
    {
        id: 'dt-fri-003',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Chuẩn bị thức ăn cho thú cưng (cuối tuần)',
        description: 'Chuẩn bị khẩu phần ăn cho cả tuần sau, kiểm tra tồn kho thực phẩm',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-10-31T00:00:00+00:00',
        start_time: '16:00:00',
        end_time: '18:00:00',
        completion_date: null,
        task_id: 'c96h4052-87c7-79eb-c9jj-f600640001f3',
        slot_id: 'f0780mlm-83en-2923-j8m0-f58bb4388lh6',
        notes: null,
        task: getTaskById('c96h4052-87c7-79eb-c9jj-f600640001f3'),
        slot: getSlotById('f0780mlm-83en-2923-j8m0-f58bb4388lh6'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-10-31T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-31T06:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ========== SATURDAY 01/11/2025 (Thứ Bảy) ==========
    // 18. Vệ sinh tổng thể toàn bộ khu vực - SCHEDULED
    {
        id: 'dt-sat-001',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Vệ sinh tổng thể toàn bộ khu vực',
        description: 'Dọn dẹp vệ sinh tổng thể tất cả các khu vực trong pet cafe, bao gồm khu chó, mèo, outdoor',
        priority: 'URGENT',
        status: 'SCHEDULED',
        assigned_date: '2025-11-01T00:00:00+00:00',
        start_time: '06:00:00',
        end_time: '09:00:00',
        completion_date: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        slot_id: '85235gfg-288h-6599-d2g4-825778722fb0',
        notes: null,
        task: getTaskById('752a0719-64a4-49b7-85ff-b266216667b9'),
        slot: getSlotById('85235gfg-288h-6599-d2g4-825778722fb0'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-11-01T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-01T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 19. Kiểm tra sức khỏe tổng quát cho thú cưng - SCHEDULED
    {
        id: 'dt-sat-002',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Kiểm tra sức khỏe tổng quát cho thú cưng',
        description: 'Kiểm tra sức khỏe định kỳ cuối tuần cho tất cả thú cưng, ghi nhận các dấu hiệu bất thường',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-11-01T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '11:00:00',
        completion_date: null,
        task_id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        slot_id: 'c9679kjk-62cl-09d3-h6k8-c69bb2166jf4',
        notes: null,
        task: getTaskById('974c2941-86c6-6bd9-a7hh-d488438889d1'),
        slot: getSlotById('c9679kjk-62cl-09d3-h6k8-c69bb2166jf4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-11-01T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-01T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 20. Hướng dẫn khách chơi với thú cưng (cuối tuần) - SCHEDULED
    {
        id: 'dt-sat-003',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        title: 'Hướng dẫn khách chơi với thú cưng (cuối tuần)',
        description: 'Tiếp đón và hướng dẫn khách tương tác với thú cưng trong ngày cuối tuần đông khách',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-11-01T00:00:00+00:00',
        start_time: '10:00:00',
        end_time: '18:00:00',
        completion_date: null,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        slot_id: '727d444e-6311-4377-86f9-acf24428dafd',
        notes: null,
        task: getTaskById('cfa75dab-16cf-4978-b9fb-e6da47034108'),
        slot: getSlotById('727d444e-6311-4377-86f9-acf24428dafd'),
        team: getTeamById('4d55bbb0-a1c1-4c03-98bf-c587f0713512'),
        created_at: '2025-11-01T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-01T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ========== SUNDAY 02/11/2025 (Chủ Nhật) ==========
    // 21. Cho mèo và chó ăn sáng - SCHEDULED
    {
        id: 'dt-sun-001',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Cho mèo và chó ăn sáng',
        description: 'Chuẩn bị và phân phối thức ăn sáng chủ nhật cho tất cả thú cưng',
        priority: 'URGENT',
        status: 'SCHEDULED',
        assigned_date: '2025-11-02T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '08:00:00',
        completion_date: null,
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        slot_id: 'a7457ihi-40aj-87b1-f4i6-a47990944hd2',
        notes: null,
        task: getTaskById('863b1830-75b5-5ac8-96gg-c377327778c0'),
        slot: getSlotById('a7457ihi-40aj-87b1-f4i6-a47990944hd2'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-11-02T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-02T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 22. Tổ chức sự kiện chủ nhật vui vẻ - SCHEDULED
    {
        id: 'dt-sun-002',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        title: 'Tổ chức sự kiện chủ nhật vui vẻ',
        description: 'Tổ chức các hoạt động vui chơi, tương tác đặc biệt cho khách và thú cưng vào chủ nhật',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-11-02T00:00:00+00:00',
        start_time: '10:00:00',
        end_time: '16:00:00',
        completion_date: null,
        task_id: 'dfa86ebc-27dg-5089-c0gc-g7eb58145219',
        slot_id: '838e555f-7422-5488-97g0-bdg35539ebge',
        notes: null,
        task: getTaskById('dfa86ebc-27dg-5089-c0gc-g7eb58145219'),
        slot: getSlotById('838e555f-7422-5488-97g0-bdg35539ebge'),
        team: getTeamById('4d55bbb0-a1c1-4c03-98bf-c587f0713512'),
        created_at: '2025-11-02T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-02T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // 23. Vệ sinh và chuẩn bị cho tuần mới - SCHEDULED
    {
        id: 'dt-sun-003',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        title: 'Vệ sinh và chuẩn bị cho tuần mới',
        description: 'Dọn dẹp tổng kết cuối tuần, chuẩn bị vật dụng và lên kế hoạch cho tuần tiếp theo',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assigned_date: '2025-11-02T00:00:00+00:00',
        start_time: '17:00:00',
        end_time: '19:00:00',
        completion_date: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        slot_id: '85235gfg-288h-6599-d2g4-825778722fb0',
        notes: null,
        task: getTaskById('752a0719-64a4-49b7-85ff-b266216667b9'),
        slot: getSlotById('85235gfg-288h-6599-d2g4-825778722fb0'),
        team: getTeamById('a1b2c3d4-e5f6-4789-a012-bcdef3456789'),
        created_at: '2025-11-02T05:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-02T05:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ========== PREVIOUS WEEK DATA (for history) - Week of 21/10/2025 ==========
    // 15. Cho mèo ăn sáng (tuần trước) - COMPLETED
    {
        id: 'dt-prev-mon-001',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Cho mèo ăn sáng',
        description: 'Chuẩn bị và phân phối thức ăn sáng cho mèo theo khẩu phần riêng của từng bé',
        priority: 'URGENT',
        status: 'COMPLETED',
        assigned_date: '2025-10-21T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '07:30:00',
        completion_date: '2025-10-21T07:27:00+00:00',
        task_id: '863b1830-75b5-5ac8-96gg-c377327778c0',
        slot_id: 'a7457ihi-40aj-87b1-f4i6-a47990944hd2',
        notes: 'Hoàn thành tốt. Tuần trước rất suôn sẻ.',
        task: getTaskById('863b1830-75b5-5ac8-96gg-c377327778c0'),
        slot: getSlotById('a7457ihi-40aj-87b1-f4i6-a47990944hd2'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-21T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-21T07:27:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 16. Kiểm tra sức khỏe mèo (tuần trước) - MISSED
    {
        id: 'dt-prev-mon-002',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Kiểm tra sức khỏe mèo định kỳ',
        description: 'Kiểm tra thân nhiệt, hành vi, mắt, tai, và tình trạng ăn uống của từng bé mèo hàng ngày',
        priority: 'HIGH',
        status: 'MISSED',
        assigned_date: '2025-10-22T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '10:00:00',
        completion_date: null,
        task_id: '974c2941-86c6-6bd9-a7hh-d488438889d1',
        slot_id: 'c9679kjk-62cl-09d3-h6k8-c69bb2166jf4',
        notes: 'Nhân viên đột ngột nghỉ ốm. Không có người thay thế kịp thời.',
        task: getTaskById('974c2941-86c6-6bd9-a7hh-d488438889d1'),
        slot: getSlotById('c9679kjk-62cl-09d3-h6k8-c69bb2166jf4'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-22T06:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-22T11:00:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    },
    // 17. Dọn dẹp vệ sinh (tuần trước) - SKIPPED
    {
        id: 'dt-prev-wed-001',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Dọn dẹp vệ sinh khu vực mèo (buổi sáng)',
        description: 'Vệ sinh toàn bộ khu vực mèo, thay cát vệ sinh, lau chùi tháp mèo và đồ chơi',
        priority: 'HIGH',
        status: 'SKIPPED',
        assigned_date: '2025-10-23T00:00:00+00:00',
        start_time: '06:00:00',
        end_time: '07:30:00',
        completion_date: null,
        task_id: '752a0719-64a4-49b7-85ff-b266216667b9',
        slot_id: '85235gfg-288h-6599-d2g4-825778722fb0',
        notes: 'Bỏ qua vì vừa vệ sinh tổng thể hôm trước. Khu vực còn sạch sẽ.',
        task: getTaskById('752a0719-64a4-49b7-85ff-b266216667b9'),
        slot: getSlotById('85235gfg-288h-6599-d2g4-825778722fb0'),
        team: getTeamById('73db584f-89ba-4ac0-ae2e-4c559a907775'),
        created_at: '2025-10-23T05:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-23T06:00:00+00:00',
        updated_by: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_deleted: false
    }
];

let MOCK_DAILY_TASKS = [...MOCK_DAILY_TASKS_INITIAL];

// Keep old data as backup reference (commented out)
/*
let OLD_MOCK_DAILY_TASKS = [
    // Week 1 - Monday
    {
        id: 'dt-001',
        team_id: 'team-001',
        title: 'Chăm sóc thú cưng buổi sáng',
        description: 'Cho ăn, vệ sinh, kiểm tra sức khỏe các bé mèo',
        priority: 'HIGH',
        status: 'COMPLETED',
        assigned_date: '2025-10-27T00:00:00+00:00',
        start_time: '07:30:00',
        end_time: '12:00:00',
        completion_date: '2025-10-27T11:30:00+00:00',
        task_id: 'task-001',
        slot_id: 'slot-001',
        notes: 'Đã hoàn thành đầy đủ. Tất cả các bé đều khỏe mạnh.',
        task: { id: 'task-001', name: 'Chăm sóc thú cưng buổi sáng', status: 'ACTIVE' },
        slot: { id: 'slot-001', start_time: '07:30:00', end_time: '12:00:00', day_of_week: 'MONDAY', special_notes: 'Ưu tiên kiểm tra sức khỏe các bé mèo già trước' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-27T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T11:30:00+00:00',
        updated_by: 'user-001',
        is_deleted: false
    },
    {
        id: 'dt-002',
        team_id: 'team-001',
        title: 'Dọn dẹp khu vực chơi',
        description: 'Vệ sinh và sắp xếp lại đồ chơi, đồ dùng',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        assigned_date: '2025-10-27T00:00:00+00:00',
        start_time: '13:00:00',
        end_time: '15:00:00',
        completion_date: '2025-10-27T14:45:00+00:00',
        task_id: 'task-002',
        slot_id: 'slot-002',
        notes: 'Hoàn thành đúng giờ',
        task: { id: 'task-002', name: 'Dọn dẹp khu vực chơi', status: 'ACTIVE' },
        slot: { id: 'slot-002', start_time: '13:00:00', end_time: '15:00:00', day_of_week: 'MONDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-27T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T14:45:00+00:00',
        updated_by: 'user-001',
        is_deleted: false
    },
    // Tuesday
    {
        id: 'dt-003',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        title: 'Hướng dẫn khách chơi với mèo',
        description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa, tiếp đón và phục vụ khách trong khu vực',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '07:30:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
        slot_id: '727d444e-6311-4377-86f9-acf24428dafd',
        notes: 'Đang phục vụ khách',
        task: {
            id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
            title: 'Hướng dẫn khách chơi với mèo',
            image_url: null,
            description: 'Quan sát hành vi, kiểm tra mắt/mũi, dọn dẹp và bổ sung cát vệ sinh cho tất cả các hộp cát trong khu vực mèo trước khi mở cửa, tiếp đón và phục vụ khách trong khu vực',
            priority: 'MEDIUM',
            status: 'ACTIVE',
            is_public: false,
            is_recurring: true,
            estimated_hours: 1,
            work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
            service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
            work_type: null,
            service: null,
            slots: [],
            daily_tasks: [null],
            created_at: '2025-10-27T13:43:29.800464+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T16:05:43.850522+00:00',
            updated_by: '00000000-0000-0000-0000-000000000000',
            is_deleted: false
        },
        slot: {
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
            day_of_week: 'TUESDAY',
            service_status: 'AVAILABLE',
            special_notes: 'Ưu tiên dọn dẹp hộp cát và thay nước, sau đó mới cho ăn bữa sáng.',
            pet_group: null,
            service: null,
            pet: null,
            area: null,
            team: null,
            task: null,
            customer_bookings: [],
            order_details: [],
            daily_tasks: [null],
            created_at: '2025-10-27T15:51:13.048693+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T16:26:49.809364+00:00',
            updated_by: '00000000-0000-0000-0000-000000000000',
            is_deleted: false
        },
        team: {
            id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
            name: 'Cat Zone Care Team',
            description: 'Nhóm chuyên trách quản lý khu vực mèo, đảm bảo vệ sinh chuồng trại, cung cấp thức ăn, nước uống và chăm sóc sức khỏe ban đầu cho các bé mèo.',
            leader_id: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
            is_active: true,
            status: 'ACTIVE',
            leader: null,
            team_members: [],
            bookings: [],
            slots: [],
            daily_tasks: [null],
            team_work_shifts: [],
            team_work_types: [],
            created_at: '2025-10-27T13:01:10.340811+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T13:01:10.340811+00:00',
            updated_by: null,
            is_deleted: false
        },
        created_at: '2025-10-28T16:02:09.542304+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T16:02:09.542307+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'dt-004',
        team_id: 'team-002',
        title: 'Cho ăn thú cưng',
        description: 'Chuẩn bị và phục vụ bữa ăn cho thú cưng',
        priority: 'URGENT',
        status: 'SCHEDULED',
        assigned_date: '2025-10-28T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '08:00:00',
        completion_date: null,
        task_id: 'task-004',
        slot_id: 'slot-004',
        notes: null,
        task: { id: 'task-004', name: 'Cho ăn thú cưng', status: 'ACTIVE' },
        slot: { id: 'slot-004', start_time: '07:00:00', end_time: '08:00:00', day_of_week: 'TUESDAY' },
        team: { id: 'team-002', name: 'Dog Zone Care Team' },
        created_at: '2025-10-28T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Wednesday
    {
        id: 'dt-005',
        team_id: 'team-001',
        title: 'Grooming cao cấp',
        description: 'Dịch vụ grooming cao cấp bao gồm spa, massage',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-10-29T00:00:00+00:00',
        start_time: '10:00:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'task-005',
        slot_id: 'slot-005',
        notes: null,
        task: { id: 'task-005', name: 'Grooming cao cấp', status: 'ACTIVE' },
        slot: { id: 'slot-005', start_time: '10:00:00', end_time: '12:00:00', day_of_week: 'WEDNESDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-29T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Thursday
    {
        id: 'dt-006',
        team_id: 'team-001',
        title: 'Kiểm tra sức khỏe định kỳ',
        description: 'Kiểm tra sức khỏe tổng quát cho thú cưng',
        priority: 'HIGH',
        status: 'SKIPPED',
        assigned_date: '2025-10-30T00:00:00+00:00',
        start_time: '14:00:00',
        end_time: '16:00:00',
        completion_date: null,
        task_id: 'task-006',
        slot_id: 'slot-006',
        notes: 'Bác sĩ thú y nghỉ phép',
        task: { id: 'task-006', name: 'Kiểm tra sức khỏe định kỳ', status: 'ACTIVE' },
        slot: { id: 'slot-006', start_time: '14:00:00', end_time: '16:00:00', day_of_week: 'THURSDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-30T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-30T14:00:00+00:00',
        updated_by: 'user-001',
        is_deleted: false
    },
    // Friday
    {
        id: 'dt-007',
        team_id: 'team-002',
        title: 'Dạy huấn luyện cơ bản',
        description: 'Huấn luyện các kỹ năng cơ bản cho thú cưng',
        priority: 'MEDIUM',
        status: 'CANCELLED',
        assigned_date: '2025-10-31T00:00:00+00:00',
        start_time: '15:00:00',
        end_time: '17:00:00',
        completion_date: null,
        task_id: 'task-007',
        slot_id: 'slot-007',
        notes: 'Khách hàng hủy lịch',
        task: { id: 'task-007', name: 'Dạy huấn luyện cơ bản', status: 'ACTIVE' },
        slot: { id: 'slot-007', start_time: '15:00:00', end_time: '17:00:00', day_of_week: 'FRIDAY' },
        team: { id: 'team-002', name: 'Dog Zone Care Team' },
        created_at: '2025-10-31T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-31T14:30:00+00:00',
        updated_by: 'user-002',
        is_deleted: false
    },
    {
        id: 'dt-008',
        team_id: 'team-001',
        title: 'Tắm rửa thú cưng',
        description: 'Dịch vụ tắm gội với sữa tắm chuyên dụng',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-10-31T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '11:00:00',
        completion_date: null,
        task_id: 'task-008',
        slot_id: 'slot-008',
        notes: null,
        task: { id: 'task-008', name: 'Tắm rửa thú cưng', status: 'ACTIVE' },
        slot: { id: 'slot-008', start_time: '09:00:00', end_time: '11:00:00', day_of_week: 'FRIDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-31T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-31T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Saturday
    {
        id: 'dt-009',
        team_id: 'team-001',
        title: 'Chăm sóc thú cưng cuối tuần',
        description: 'Chăm sóc đặc biệt vào cuối tuần',
        priority: 'LOW',
        status: 'SCHEDULED',
        assigned_date: '2025-11-01T00:00:00+00:00',
        start_time: '08:00:00',
        end_time: '12:00:00',
        completion_date: null,
        task_id: 'task-009',
        slot_id: 'slot-009',
        notes: null,
        task: { id: 'task-009', name: 'Chăm sóc thú cưng cuối tuần', status: 'ACTIVE' },
        slot: { id: 'slot-009', start_time: '08:00:00', end_time: '12:00:00', day_of_week: 'SATURDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-11-01T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-01T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Sunday
    {
        id: 'dt-010',
        team_id: 'team-002',
        title: 'Vệ sinh tổng thể khu vực',
        description: 'Vệ sinh toàn bộ khu vực chăm sóc thú cưng',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        assigned_date: '2025-11-02T00:00:00+00:00',
        start_time: '07:00:00',
        end_time: '09:00:00',
        completion_date: null,
        task_id: 'task-010',
        slot_id: 'slot-010',
        notes: null,
        task: { id: 'task-010', name: 'Vệ sinh tổng thể khu vực', status: 'ACTIVE' },
        slot: { id: 'slot-010', start_time: '07:00:00', end_time: '09:00:00', day_of_week: 'SUNDAY' },
        team: { id: 'team-002', name: 'Dog Zone Care Team' },
        created_at: '2025-11-02T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-11-02T07:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Previous week data - for history
    {
        id: 'dt-011',
        team_id: 'team-001',
        title: 'Chăm sóc thú cưng buổi sáng',
        description: 'Cho ăn, vệ sinh, kiểm tra sức khỏe',
        priority: 'HIGH',
        status: 'COMPLETED',
        assigned_date: '2025-10-20T00:00:00+00:00',
        start_time: '07:30:00',
        end_time: '12:00:00',
        completion_date: '2025-10-20T11:45:00+00:00',
        task_id: 'task-001',
        slot_id: 'slot-001',
        notes: 'Tuần trước - hoàn thành tốt',
        task: { id: 'task-001', name: 'Chăm sóc thú cưng buổi sáng', status: 'ACTIVE' },
        slot: { id: 'slot-001', start_time: '07:30:00', end_time: '12:00:00', day_of_week: 'MONDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-20T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-20T11:45:00+00:00',
        updated_by: 'user-001',
        is_deleted: false
    },
    {
        id: 'dt-012',
        team_id: 'team-001',
        title: 'Hướng dẫn khách chơi với mèo',
        description: 'Tiếp đón và phục vụ khách',
        priority: 'HIGH',
        status: 'MISSED',
        assigned_date: '2025-10-22T00:00:00+00:00',
        start_time: '09:00:00',
        end_time: '17:00:00',
        completion_date: null,
        task_id: 'task-003',
        slot_id: 'slot-003',
        notes: 'Nhân viên nghỉ đột xuất, không có người thay thế',
        task: { id: 'task-003', name: 'Hướng dẫn khách chơi với mèo', status: 'ACTIVE' },
        slot: { id: 'slot-003', start_time: '09:00:00', end_time: '17:00:00', day_of_week: 'WEDNESDAY' },
        team: { id: 'team-001', name: 'Cat Zone Care Team' },
        created_at: '2025-10-22T07:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-22T18:00:00+00:00',
        updated_by: 'user-001',
        is_deleted: false
    }
];
*/

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get date range for a week (Monday to Sunday)
 */
const getWeekDateRange = (startDate) => {
    const dates = [];
    const start = new Date(startDate);

    // Adjust to Monday if not already
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
    start.setDate(start.getDate() + diff);

    // Generate 7 days (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(formatDate(date));
    }

    return dates;
};

/**
 * Get all daily tasks with pagination
 */
export const getAllDailyTasks = async (params = {}) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const {
                page_index = 0,
                page_size = 10,
                status = null,
                team_id = null,
                task_id = null,
                start_date = null,
                end_date = null
            } = params;

            // Start with non-deleted tasks
            let filtered = MOCK_DAILY_TASKS.filter(dt => !dt.is_deleted);

            // Apply filters
            if (status) {
                filtered = filtered.filter(dt => dt.status === status);
            }
            if (team_id) {
                filtered = filtered.filter(dt => dt.team_id === team_id);
            }
            if (task_id) {
                filtered = filtered.filter(dt => dt.task_id === task_id);
            }
            if (start_date) {
                filtered = filtered.filter(dt => dt.assigned_date >= start_date);
            }
            if (end_date) {
                filtered = filtered.filter(dt => dt.assigned_date <= end_date);
            }

            // Sort by assigned_date (newest first)
            filtered.sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));

            // Pagination
            const total_items_count = filtered.length;
            const total_pages_count = Math.ceil(total_items_count / page_size);
            const start_index = page_index * page_size;
            const end_index = start_index + page_size;
            const data = filtered.slice(start_index, end_index);

            resolve({
                success: true,
                data,
                pagination: {
                    total_items_count,
                    page_size,
                    total_pages_count,
                    page_index,
                    has_next: page_index < total_pages_count - 1,
                    has_previous: page_index > 0
                }
            });
        }, 300);
    });
};

/**
 * Get daily tasks for a specific date range (e.g., a week)
 * @param {string} startDate - Start date (FromDate)
 * @param {string} endDate - End date (ToDate)
 * @param {Array} taskTemplates - Task templates for auto-generation
 * @param {Array} slots - Slots for auto-generation
 * @param {string} teamId - Optional: Filter by team ID (TeamId)
 * @param {string} status - Optional: Filter by status (Status)
 */
export const getDailyTasksForDateRange = async (startDate, endDate, taskTemplates = [], slots = [], teamId = null, status = null) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const start = formatDate(new Date(startDate));
            const end = formatDate(new Date(endDate));

            // Get existing tasks in range (exclude deleted)
            let tasksInRange = MOCK_DAILY_TASKS.filter(dt => {
                const inDateRange = dt.assigned_date >= start && dt.assigned_date <= end && !dt.is_deleted;
                const matchesTeam = !teamId || dt.team_id === teamId;
                const matchesStatus = !status || dt.status === status;

                return inDateRange && matchesTeam && matchesStatus;
            });

            // Auto-generate tasks if needed
            const dates = [];
            const currentDate = new Date(start);
            const lastDate = new Date(end);

            while (currentDate <= lastDate) {
                dates.push(formatDate(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Get today's date at midnight for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = formatDate(today);

            // For each date, generate tasks from slots
            dates.forEach(date => {
                // Skip dates in the past
                if (date < todayStr) {
                    console.log(`⏭️ Skipping past date: ${date}`);
                    return;
                }

                const dateObj = new Date(date);
                const dayOfWeekName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dateObj.getDay()];

                // Find slots for this day of week
                const slotsForDay = slots.filter(slot =>
                    slot.day_of_week === dayOfWeekName &&
                    !slot.is_deleted
                );

                slotsForDay.forEach(slot => {
                    // Find the task template
                    const taskTemplate = taskTemplates.find(t => t.id === slot.task_id && !t.is_deleted);

                    if (taskTemplate && taskTemplate.status === 'ACTIVE') {
                        // Check if task already exists in MOCK_DAILY_TASKS (not deleted)
                        const existing = MOCK_DAILY_TASKS.find(dt =>
                            !dt.is_deleted &&
                            dt.assigned_date === `${date}T00:00:00+00:00` &&
                            dt.slot_id === slot.id &&
                            dt.task_id === taskTemplate.id
                        );

                        if (!existing) {
                            // Create new daily task
                            const newTask = {
                                id: generateId(),
                                team_id: slot.team_id || 'default-team-id',
                                title: taskTemplate.name || taskTemplate.title,
                                description: taskTemplate.description || '',
                                priority: taskTemplate.priority || TASK_PRIORITY.MEDIUM,
                                status: DAILY_TASK_STATUS.SCHEDULED,
                                assigned_date: `${date}T00:00:00+00:00`,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                completion_date: null,
                                task_id: taskTemplate.id,
                                slot_id: slot.id,
                                notes: null,
                                task: taskTemplate,
                                slot: slot,
                                team: slot.team || MOCK_TEAMS.find(t => t.id === slot.team_id) || null,
                                created_at: new Date().toISOString(),
                                created_by: '00000000-0000-0000-0000-000000000000',
                                updated_at: new Date().toISOString(),
                                updated_by: null,
                                is_deleted: false
                            };

                            MOCK_DAILY_TASKS.push(newTask);
                            tasksInRange.push(newTask);
                        }
                    }
                });
            });

            // Re-filter with all parameters (exclude deleted)
            tasksInRange = MOCK_DAILY_TASKS.filter(dt => {
                const inDateRange = dt.assigned_date >= start && dt.assigned_date <= end && !dt.is_deleted;
                const matchesTeam = !teamId || dt.team_id === teamId;
                const matchesStatus = !status || dt.status === status;

                return inDateRange && matchesTeam && matchesStatus;
            }).sort((a, b) => new Date(a.assigned_date) - new Date(b.assigned_date));

            resolve({
                success: true,
                data: tasksInRange
            });
        }, 300);
    });
};

/**
 * Get daily tasks for current week
 */
export const getDailyTasksForCurrentWeek = async (taskTemplates = [], slots = []) => {
    const today = new Date();
    const dates = getWeekDateRange(today);
    return getDailyTasksForDateRange(dates[0], dates[6], taskTemplates, slots);
};

/**
 * Update daily task status
 */
export const updateDailyTaskStatus = async (dailyTaskId, updateData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = MOCK_DAILY_TASKS.findIndex(dt => dt.id === dailyTaskId);

            if (index === -1) {
                reject(new Error('Không tìm thấy daily task'));
                return;
            }

            // Validate status
            if (updateData.status && !Object.values(DAILY_TASK_STATUS).includes(updateData.status)) {
                reject(new Error('Trạng thái không hợp lệ'));
                return;
            }

            // Update
            const currentTask = MOCK_DAILY_TASKS[index];
            MOCK_DAILY_TASKS[index] = {
                ...currentTask,
                status: updateData.status || currentTask.status,
                notes: updateData.notes !== undefined ? updateData.notes : currentTask.notes,
                completion_date: updateData.status === DAILY_TASK_STATUS.COMPLETED
                    ? new Date().toISOString()
                    : currentTask.completion_date,
                updated_at: new Date().toISOString(),
                updated_by: updateData.updated_by || '00000000-0000-0000-0000-000000000000'
            };

            resolve({
                success: true,
                data: MOCK_DAILY_TASKS[index],
                message: 'Cập nhật trạng thái thành công'
            });
        }, 300);
    });
};

/**
 * Get statistics for a date range
 */
export const getDailyTasksStatistics = async (startDate, endDate) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const start = formatDate(new Date(startDate));
            const end = formatDate(new Date(endDate));

            const tasksInRange = MOCK_DAILY_TASKS.filter(dt =>
                dt.assigned_date >= start && dt.assigned_date <= end && !dt.is_deleted
            );

            const total = tasksInRange.length;
            const scheduled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SCHEDULED).length;
            const in_progress = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.IN_PROGRESS).length;
            const completed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.COMPLETED).length;
            const cancelled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.CANCELLED).length;
            const missed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.MISSED).length;
            const skipped = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SKIPPED).length;

            const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            resolve({
                success: true,
                data: {
                    total,
                    scheduled,
                    in_progress,
                    completed,
                    cancelled,
                    missed,
                    skipped,
                    completion_rate
                }
            });
        }, 200);
    });
};

/**
 * Get weekly summary by task
 */
export const getWeeklySummaryByTask = async (startDate, endDate) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const start = formatDate(new Date(startDate));
            const end = formatDate(new Date(endDate));

            const tasksInRange = MOCK_DAILY_TASKS.filter(dt =>
                dt.assigned_date >= start && dt.assigned_date <= end && !dt.is_deleted
            );

            // Group by task_id
            const grouped = tasksInRange.reduce((acc, dt) => {
                if (!acc[dt.task_id]) {
                    acc[dt.task_id] = {
                        task_id: dt.task_id,
                        task_title: dt.title,
                        total: 0,
                        scheduled: 0,
                        in_progress: 0,
                        completed: 0,
                        cancelled: 0,
                        missed: 0,
                        skipped: 0,
                        completion_rate: 0
                    };
                }

                acc[dt.task_id].total++;
                const statusKey = dt.status.toLowerCase();
                if (acc[dt.task_id][statusKey] !== undefined) {
                    acc[dt.task_id][statusKey]++;
                }

                return acc;
            }, {});

            // Calculate completion rate for each task
            Object.values(grouped).forEach(task => {
                task.completion_rate = task.total > 0
                    ? Math.round((task.completed / task.total) * 100)
                    : 0;
            });

            resolve({
                success: true,
                data: Object.values(grouped)
            });
        }, 300);
    });
};

/**
 * Create a daily task manually (Manager creates ad-hoc task)
 */
export const createManualDailyTask = async (taskData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Validate required fields
            if (!taskData.team_id) {
                reject(new Error('Team ID là bắt buộc'));
                return;
            }
            if (!taskData.title || taskData.title.trim() === '') {
                reject(new Error('Tên nhiệm vụ là bắt buộc'));
                return;
            }
            if (!taskData.assigned_date) {
                reject(new Error('Ngày thực hiện là bắt buộc'));
                return;
            }

            // Create new daily task
            const newTask = {
                id: generateId(),
                team_id: taskData.team_id,
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || TASK_PRIORITY.MEDIUM,
                status: taskData.status || DAILY_TASK_STATUS.SCHEDULED,
                assigned_date: taskData.assigned_date.includes('T')
                    ? taskData.assigned_date
                    : `${taskData.assigned_date}T00:00:00+00:00`,
                start_time: taskData.start_time ? `${taskData.start_time}:00` : '08:00:00',
                end_time: taskData.end_time ? `${taskData.end_time}:00` : '17:00:00',
                completion_date: taskData.status === DAILY_TASK_STATUS.COMPLETED
                    ? new Date().toISOString()
                    : null,
                task_id: taskData.task_id || null,
                slot_id: taskData.slot_id || null,
                notes: null,
                task: taskData.task_id ? {
                    id: taskData.task_id,
                    name: taskData.title,
                    status: 'ACTIVE'
                } : null,
                slot: taskData.slot_id ? {
                    id: taskData.slot_id,
                    start_time: taskData.start_time ? `${taskData.start_time}:00` : '08:00:00',
                    end_time: taskData.end_time ? `${taskData.end_time}:00` : '17:00:00',
                    day_of_week: new Date(taskData.assigned_date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
                    special_notes: null
                } : null,
                team: MOCK_TEAMS.find(t => t.id === taskData.team_id) || null,
                created_at: new Date().toISOString(),
                created_by: taskData.created_by || '00000000-0000-0000-0000-000000000000',
                updated_at: new Date().toISOString(),
                updated_by: null,
                is_deleted: false
            };

            // Add to mock database
            MOCK_DAILY_TASKS.push(newTask);

            resolve({
                success: true,
                data: newTask,
                message: 'Tạo nhiệm vụ hằng ngày thành công'
            });
        }, 500);
    });
};

/**
 * Delete a daily task
 */
export const deleteDailyTask = async (dailyTaskId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = MOCK_DAILY_TASKS.findIndex(dt => dt.id === dailyTaskId);

            if (index === -1) {
                reject(new Error('Không tìm thấy daily task'));
                return;
            }

            // Soft delete
            MOCK_DAILY_TASKS[index].is_deleted = true;
            MOCK_DAILY_TASKS[index].updated_at = new Date().toISOString();

            resolve({
                success: true,
                message: 'Xóa daily task thành công'
            });
        }, 300);
    });
};

/**
 * Invalidate (soft delete) all scheduled daily tasks for a specific slot
 * This should be called when slot's day_of_week changes
 * @param {string} slotId - The slot ID
 * @returns {Promise<Object>}
 */
export const invalidateDailyTasksBySlot = async (slotId) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const tasksToInvalidate = MOCK_DAILY_TASKS.filter(dt =>
                dt.slot_id === slotId &&
                dt.status === DAILY_TASK_STATUS.SCHEDULED &&
                !dt.is_deleted
            );

            let invalidatedCount = 0;

            tasksToInvalidate.forEach(task => {
                const index = MOCK_DAILY_TASKS.findIndex(dt => dt.id === task.id);
                if (index !== -1) {
                    MOCK_DAILY_TASKS[index].is_deleted = true;
                    MOCK_DAILY_TASKS[index].updated_at = new Date().toISOString();
                    invalidatedCount++;
                }
            });

            console.log(`🗑️ Invalidated ${invalidatedCount} scheduled daily tasks for slot ${slotId}`);

            resolve({
                success: true,
                invalidatedCount,
                message: `Đã xóa ${invalidatedCount} nhiệm vụ đã lên lịch do thay đổi ngày làm việc`
            });
        }, 100);
    });
};

/**
 * Remove duplicate daily tasks (keep oldest one)
 * Duplicates are defined as: same date, same slot_id, same task_id
 */
export const removeDuplicateDailyTasks = () => {
    const seen = new Map();
    const toDelete = [];

    MOCK_DAILY_TASKS.forEach(dt => {
        if (dt.is_deleted) return; // Skip already deleted

        const key = `${dt.assigned_date}_${dt.slot_id}_${dt.task_id}`;

        if (seen.has(key)) {
            // This is a duplicate - mark for deletion (keep the first one we saw)
            toDelete.push(dt.id);
        } else {
            seen.set(key, dt.id);
        }
    });

    // Mark duplicates as deleted
    toDelete.forEach(id => {
        const index = MOCK_DAILY_TASKS.findIndex(dt => dt.id === id);
        if (index !== -1) {
            MOCK_DAILY_TASKS[index].is_deleted = true;
            MOCK_DAILY_TASKS[index].updated_at = new Date().toISOString();
        }
    });

    console.log(`🧹 Cleaned up ${toDelete.length} duplicate daily tasks`);

    return {
        success: true,
        removedCount: toDelete.length,
        message: `Đã xóa ${toDelete.length} nhiệm vụ trùng lặp`
    };
};

/**
 * Remove past scheduled daily tasks
 * Only remove tasks with status SCHEDULED and assigned_date < today
 */
export const removePastScheduledTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    let removedCount = 0;

    MOCK_DAILY_TASKS.forEach(dt => {
        if (dt.is_deleted) return; // Skip already deleted

        // Only remove SCHEDULED tasks in the past
        if (dt.status === DAILY_TASK_STATUS.SCHEDULED && dt.assigned_date < `${todayStr}T00:00:00+00:00`) {
            const index = MOCK_DAILY_TASKS.findIndex(task => task.id === dt.id);
            if (index !== -1) {
                MOCK_DAILY_TASKS[index].is_deleted = true;
                MOCK_DAILY_TASKS[index].updated_at = new Date().toISOString();
                removedCount++;
            }
        }
    });

    console.log(`🗑️ Removed ${removedCount} past scheduled tasks`);

    return {
        success: true,
        removedCount,
        message: `Đã xóa ${removedCount} nhiệm vụ đã lên lịch trong quá khứ`
    };
};

/**
 * Reset mock data (for testing)
 */
export const resetMockDailyTasks = () => {
    MOCK_DAILY_TASKS = [];
};

export default {
    getAllDailyTasks,
    getDailyTasksForDateRange,
    getDailyTasksForCurrentWeek,
    updateDailyTaskStatus,
    getDailyTasksStatistics,
    getWeeklySummaryByTask,
    createManualDailyTask,
    deleteDailyTask,
    invalidateDailyTasksBySlot,
    removeDuplicateDailyTasks,
    removePastScheduledTasks,
    resetMockDailyTasks,
    DAILY_TASK_STATUS,
    TASK_PRIORITY,
    DAY_OF_WEEK_MAP
};
