import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'shift') => {
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
        'customer': ['notification_receive'],
        'working_staff': ['view_schedule', 'update_task_status', 'notification_receive'],
        'sales_staff': ['view_schedule', 'notification_receive'],
        'manager': ['user_management', 'shift_management', 'service_management', 'booking_management', 'analytics_view', 'notification_receive'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock database for work shifts
let MOCK_SHIFTS = [
    {
        "name": "Ca Sáng",
        "start_time": "08:00:00",
        "end_time": "12:00:00",
        "description": "Ca làm việc buổi sáng dành cho nhân viên dịch vụ chăm sóc thú cưng. Bao gồm các công việc: đón tiếp khách hàng, tư vấn dịch vụ, thực hiện tắm gội, cắt tỉa lông, chăm sóc móng và tai cho thú cưng.",
        "is_active": true,
        "applicable_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
        "schedules": [],
        "tasks": [
            { "id": "task-001", "name": "Chuẩn bị dụng cụ", "description": "Kiểm tra và chuẩn bị đồ tắm, khăn, máy sấy.", "status": "PENDING" },
            { "id": "task-002", "name": "Tắm rửa thú cưng", "description": "Tắm với dầu gội chuyên dụng, sấy khô, chải lông.", "status": "PENDING" }
        ],
        "team_work_shifts": [
            {
                "id": "1b77d4cb-fb6b-4c8e-be18-af8b079e6556",
                "name": "Nhóm chăm sóc cho chó",
                "description": "Nhóm chăm sóc cho chó",
                "is_active": true,
                "working_days": ["MONDAY", "TUESDAY", "SATURDAY"],
                "leader": {
                    "id": "93185191-488d-45ae-b6c5-68a6f8e22bee",
                    "full_name": "Lê Văn C",
                    "avatar_url": "https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F9c80b9cb-22f6-4013-94d3-8b164f1bad07.jpg?alt=media&token=10f52795-d2db-41c9-b0f7-5b336d528f03"
                },
                "work_type": {
                    "name": "Tắm rửa thú cưng",
                    "description": "Dịch vụ tắm rửa bằng dầu gội chuyên dụng, sấy khô và chải lông cho chó mèo."
                },
                "members": [
                    { "id": "user-017", "full_name": "Hoàng Thị Chăm Sóc" },
                    { "id": "user-018", "full_name": "Vũ Văn Thú Y" },
                    { "id": "user-019", "full_name": "Nguyễn Quốc Hùng" }
                ],
                "tasks": []
            },
            {
                "id": "09595226-5185-4712-a3d8-d174be9b99ae",
                "name": "Nhóm bán tại Quầy",
                "description": "Nhân viên tại quầy",
                "is_active": true,
                "working_days": ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
                "leader": {
                    "id": "000cb6f2-7f21-469d-9dc1-7d483b1c5306",
                    "full_name": "Trần Vân AA",
                    "avatar_url": "https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Ff1902bdd-9190-49cb-adc4-02aef350febb.jpg?alt=media&token=3b6f9b39-2dbf-4080-98b8-7ec0637a5744"
                },
                "work_type": {
                    "name": "Nhân viên tại quầy",
                    "description": "Tiếp đón khách, tư vấn, thanh toán"
                },
                "members": [
                    { "id": "user-003", "full_name": "Lê Thị Bán Hàng" },
                    { "id": "user-007", "full_name": "Nguyễn Văn Minh" }
                ],
                "tasks": []
            },
            {
                "id": "team-sang-spa-001",
                "name": "Nhóm Tắm Spa",
                "description": "Chuyên về dịch vụ spa cao cấp cho thú cưng",
                "is_active": true,
                "working_days": ["TUESDAY", "THURSDAY", "SATURDAY"],
                "leader": {
                    "id": "user-020",
                    "full_name": "Phạm Thị Mai",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Spa thú cưng",
                    "description": "Dịch vụ spa cao cấp, massage, chăm sóc da lông"
                },
                "members": [
                    { "id": "user-028", "full_name": "Phạm Anh Khoa" },
                    { "id": "user-021", "full_name": "Lê Hoàng Đạt" },
                    { "id": "user-023", "full_name": "Võ Thị Thúy" }
                ],
                "tasks": []
            },
            {
                "id": "team-sang-tiepdon-001",
                "name": "Nhóm Tiếp đón khách",
                "description": "Đón tiếp và hỗ trợ khách hàng",
                "is_active": true,
                "working_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
                "leader": {
                    "id": "user-008",
                    "full_name": "Trần Thị Thu",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Lễ tân & Tư vấn",
                    "description": "Tiếp đón khách, booking, tư vấn dịch vụ"
                },
                "members": [
                    { "id": "user-009", "full_name": "Lê Minh Khánh" },
                    { "id": "user-015", "full_name": "Ngô Anh Tuấn" }
                ],
                "tasks": []
            },
            {
                "id": "team-sang-vesinh-001",
                "name": "Nhóm Vệ sinh",
                "description": "Vệ sinh và dọn dẹp khu vực",
                "is_active": true,
                "working_days": ["MONDAY", "FRIDAY"],
                "leader": {
                    "id": "user-031",
                    "full_name": "Hoàng Thị Yến",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Vệ sinh & Dọn dẹp",
                    "description": "Dọn dẹp, khử trùng khu vực"
                },
                "members": [
                    { "id": "user-022", "full_name": "Trần Minh Tâm" }
                ],
                "tasks": []
            }
        ],
        "id": "14343ed6-12de-4190-a957-ca5bfdf896d2",
        "created_at": "2025-10-18T19:19:03.194412+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-18T19:19:03.194412+00:00",
        "updated_by": null,
        "is_deleted": false
    },
    {
        "name": "Ca Trưa",
        "start_time": "12:50:00",
        "end_time": "16:00:00",
        "description": "Ca trưa cho nhân viên phục vụ và chăm sóc khách tại quán cà phê mèo: phục vụ đồ uống, hướng dẫn khách chơi với mèo, dọn dẹp khu vực.",
        "is_active": true,
        "applicable_days": ["TUESDAY", "THURSDAY", "SUNDAY"],
        "schedules": [],
        "tasks": [
            { "id": "task-101", "name": "Chuẩn bị quầy", "description": "Vệ sinh khu vực, kiểm tra nguyên liệu", "status": "PENDING" }
        ],
        "team_work_shifts": [
            {
                "id": "33ad42fd-f0c0-452e-81c5-77f14a54b09d",
                "name": "Nhóm Pha chế",
                "description": "Chuyên pha chế đồ uống và thức ăn nhẹ",
                "is_active": true,
                "working_days": ["TUESDAY", "SUNDAY"],
                "leader": {
                    "id": "user-010",
                    "full_name": "Phạm Thị Hoa",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Pha chế & F&B",
                    "description": "Pha chế đồ uống, chuẩn bị món ăn nhẹ"
                },
                "members": [
                    { "id": "user-004", "full_name": "Phạm Văn Kinh Doanh" },
                    { "id": "user-012", "full_name": "Hoàng Thị Lan" }
                ],
                "tasks": []
            },
            {
                "id": "team-trua-chammeο-001",
                "name": "Nhóm Chăm sóc mèo",
                "description": "Chăm sóc và vui chơi với mèo",
                "is_active": true,
                "leader": {
                    "id": "user-029",
                    "full_name": "Lê Thị Phương",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Chăm sóc mèo",
                    "description": "Chăm sóc, cho ăn, vui chơi với mèo"
                },
                "members": [
                    { "id": "user-024", "full_name": "Hoàng Minh Quân" },
                    { "id": "user-027", "full_name": "Nguyễn Thị Anh" },
                    { "id": "user-025", "full_name": "Bùi Thị Nhi" }
                ],
                "tasks": []
            },
            {
                "id": "team-trua-order-001",
                "name": "Nhóm Order",
                "description": "Nhận order và phục vụ khách",
                "is_active": true,
                "leader": {
                    "id": "user-011",
                    "full_name": "Võ Thành Long",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Phục vụ bàn",
                    "description": "Nhận order, phục vụ khách hàng"
                },
                "members": [
                    { "id": "user-016", "full_name": "Dương Khánh Linh" }
                ],
                "tasks": []
            },
            {
                "id": "team-trua-thuy-001",
                "name": "Nhóm Thú y",
                "description": "Kiểm tra sức khỏe thú cưng",
                "is_active": true,
                "leader": {
                    "id": "user-030",
                    "full_name": "Trần Văn Bình",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Thú y",
                    "description": "Kiểm tra sức khỏe, tư vấn chăm sóc"
                },
                "members": [
                    { "id": "user-018", "full_name": "Vũ Văn Thú Y" },
                    { "id": "user-026", "full_name": "Đặng Trung Hiếu" }
                ],
                "tasks": []
            }
        ],
        "id": "7ddf3ce1-fd80-4182-8fbf-0af1ffcdbdbc",
        "created_at": "2025-10-19T07:28:02.574179+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-19T07:28:02.57418+00:00",
        "updated_by": null,
        "is_deleted": false
    },
    {
        "name": "Ca Chiều",
        "start_time": "16:00:00",
        "end_time": "20:00:00",
        "description": "Ca làm việc buổi chiều tập trung vào việc dọn dẹp khu vực chơi, chăm sóc mèo, phục vụ khách và hỗ trợ hoạt động check-out của khách hàng.",
        "is_active": true,
        "applicable_days": ["TUESDAY", "THURSDAY", "SATURDAY"],
        "schedules": [],
        "tasks": [
            { "id": "task-201", "name": "Dọn dẹp cuối ngày", "description": "Vệ sinh khu vực chơi", "status": "PENDING" }
        ],
        "team_work_shifts": [
            {
                "id": "team-chieu-grooming-001",
                "name": "Nhóm Grooming",
                "description": "Cắt tỉa, tạo kiểu lông cho thú cưng",
                "is_active": true,
                "leader": {
                    "id": "user-019",
                    "full_name": "Nguyễn Quốc Hùng",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Grooming & Tạo kiểu",
                    "description": "Cắt tỉa, tạo kiểu lông chuyên nghiệp"
                },
                "members": [
                    { "id": "user-017", "full_name": "Hoàng Thị Chăm Sóc" },
                    { "id": "user-021", "full_name": "Lê Hoàng Đạt" },
                    { "id": "user-023", "full_name": "Võ Thị Thúy" },
                    { "id": "user-028", "full_name": "Phạm Anh Khoa" }
                ],
                "tasks": []
            },
            {
                "id": "team-chieu-checkout-001",
                "name": "Nhóm Check-out",
                "description": "Hỗ trợ khách thanh toán và đón thú cưng",
                "is_active": true,
                "leader": {
                    "id": "user-013",
                    "full_name": "Đặng Hoàng Nam",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Thu ngân & Giao pet",
                    "description": "Thanh toán, giao thú cưng cho khách"
                },
                "members": [
                    { "id": "user-014", "full_name": "Bùi Thị Mỹ" }
                ],
                "tasks": []
            },
            {
                "id": "team-chieu-dondep-001",
                "name": "Nhóm Dọn dẹp",
                "description": "Dọn dẹp và chuẩn bị cho ca tối",
                "is_active": true,
                "leader": {
                    "id": "user-022",
                    "full_name": "Trần Minh Tâm",
                    "avatar_url": ""
                },
                "work_type": {
                    "name": "Vệ sinh cuối ca",
                    "description": "Dọn dẹp, khử trùng, chuẩn bị ca tối"
                },
                "members": [
                    { "id": "user-031", "full_name": "Hoàng Thị Yến" },
                    { "id": "user-025", "full_name": "Bùi Thị Nhi" }
                ],
                "tasks": []
            },
            {
                "id": "team-chieu-cafemeo-001",
                "name": "Nhóm Cafe Mèo",
                "description": "Phục vụ khu vực cafe mèo",
                "is_active": true,
                "leader": {
                    "id": "000cb6f2-7f21-469d-9dc1-7d483b1c5306",
                    "full_name": "Trần Vân AA",
                    "avatar_url": "https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Ff1902bdd-9190-49cb-adc4-02aef350febb.jpg?alt=media&token=3b6f9b39-2dbf-4080-98b8-7ec0637a5744"
                },
                "work_type": {
                    "name": "Cafe & Giải trí",
                    "description": "Phục vụ đồ uống, hỗ trợ khách chơi với mèo"
                },
                "members": [
                    { "id": "user-003", "full_name": "Lê Thị Bán Hàng" },
                    { "id": "user-007", "full_name": "Nguyễn Văn Minh" },
                    { "id": "user-029", "full_name": "Lê Thị Phương" }
                ],
                "tasks": []
            }
        ],
        "id": "12fc7623-a0b5-4cb9-bb77-32bf25558ef2",
        "created_at": "2025-10-19T07:28:43.048729+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-19T07:28:43.04873+00:00",
        "updated_by": null,
        "is_deleted": false
    }
];

// Mock database for shift-staff assignments
// Staff IDs phải khớp với user IDs từ userApi.js:
// Sales staff: user-003 đến user-016 (14 người)
// Working staff: user-017 đến user-031 (15 người)
let MOCK_SHIFT_ASSIGNMENTS = [
    // Ca sáng (06:00-12:00) - 5 nhân viên
    { id: 'assign-001', shift_id: 'shift-001', staff_id: 'user-003', assigned_date: '2025-10-10' }, // Lê Thị Bán Hàng (sales)
    { id: 'assign-002', shift_id: 'shift-001', staff_id: 'user-004', assigned_date: '2025-10-10' }, // Phạm Văn Kinh Doanh (sales)
    { id: 'assign-003', shift_id: 'shift-001', staff_id: 'user-017', assigned_date: '2025-10-10' }, // Hoàng Thị Chăm Sóc (working)
    { id: 'assign-004', shift_id: 'shift-001', staff_id: 'user-018', assigned_date: '2025-10-10' }, // Vũ Văn Thú Y (working)
    { id: 'assign-005', shift_id: 'shift-001', staff_id: 'user-019', assigned_date: '2025-10-10' }, // Nguyễn Quốc Hùng (working)

    // Ca chiều (12:00-18:00) - 5 nhân viên
    { id: 'assign-006', shift_id: 'shift-002', staff_id: 'user-007', assigned_date: '2025-10-10' }, // Nguyễn Văn Minh (sales)
    { id: 'assign-007', shift_id: 'shift-002', staff_id: 'user-008', assigned_date: '2025-10-10' }, // Trần Thị Thu (sales)
    { id: 'assign-008', shift_id: 'shift-002', staff_id: 'user-020', assigned_date: '2025-10-10' }, // Phạm Thị Mai (working)
    { id: 'assign-009', shift_id: 'shift-002', staff_id: 'user-021', assigned_date: '2025-10-10' }, // Lê Hoàng Đạt (working)
    { id: 'assign-010', shift_id: 'shift-002', staff_id: 'user-022', assigned_date: '2025-10-10' }, // Trần Minh Tâm (working)

    // Ca tối (18:00-22:00) - 5 nhân viên
    { id: 'assign-011', shift_id: 'shift-003', staff_id: 'user-009', assigned_date: '2025-10-10' }, // Lê Minh Khánh (sales)
    { id: 'assign-012', shift_id: 'shift-003', staff_id: 'user-010', assigned_date: '2025-10-10' }, // Phạm Thị Hoa (sales)
    { id: 'assign-013', shift_id: 'shift-003', staff_id: 'user-023', assigned_date: '2025-10-10' }, // Võ Thị Thúy (working)
    { id: 'assign-014', shift_id: 'shift-003', staff_id: 'user-024', assigned_date: '2025-10-10' }, // Hoàng Minh Quân (working)
    { id: 'assign-015', shift_id: 'shift-003', staff_id: 'user-025', assigned_date: '2025-10-10' }, // Bùi Thị Nhi (working)

    // Ca full-time (08:00-17:00) - 5 nhân viên
    { id: 'assign-016', shift_id: 'shift-004', staff_id: 'user-011', assigned_date: '2025-10-10' }, // Võ Thành Long (sales)
    { id: 'assign-017', shift_id: 'shift-004', staff_id: 'user-012', assigned_date: '2025-10-10' }, // Hoàng Thị Lan (sales)
    { id: 'assign-018', shift_id: 'shift-004', staff_id: 'user-026', assigned_date: '2025-10-10' }, // Đặng Trung Hiếu (working)
    { id: 'assign-019', shift_id: 'shift-004', staff_id: 'user-027', assigned_date: '2025-10-10' }, // Nguyễn Thị Anh (working)
    { id: 'assign-020', shift_id: 'shift-004', staff_id: 'user-028', assigned_date: '2025-10-10' }, // Phạm Anh Khoa (working)

    // Ca đêm (22:00-06:00) - 5 nhân viên
    { id: 'assign-021', shift_id: 'shift-005', staff_id: 'user-013', assigned_date: '2025-10-10' }, // Đặng Hoàng Nam (sales)
    { id: 'assign-022', shift_id: 'shift-005', staff_id: 'user-014', assigned_date: '2025-10-10' }, // Bùi Thị Mỹ (sales)
    { id: 'assign-023', shift_id: 'shift-005', staff_id: 'user-029', assigned_date: '2025-10-10' }, // Lê Thị Phương (working)
    { id: 'assign-024', shift_id: 'shift-005', staff_id: 'user-030', assigned_date: '2025-10-10' }, // Trần Văn Bình (working)
    { id: 'assign-025', shift_id: 'shift-005', staff_id: 'user-031', assigned_date: '2025-10-10' }, // Hoàng Thị Yến (working)
];

/**
 * Calculate duration in hours between start_time and end_time
 * @param {string} start_time - Format: "HH:mm"
 * @param {string} end_time - Format: "HH:mm"
 * @returns {number} Duration in hours
 */
const calculateDuration = (start_time, end_time) => {
    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours
    }

    return (endMinutes - startMinutes) / 60;
};

/**
 * Validate time format (HH:mm)
 * @param {string} time 
 * @returns {boolean}
 */
const isValidTimeFormat = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// Work Shift APIs
const workshiftApi = {
    /**
     * Get all work shifts
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    async getAllShifts(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem ca làm việc');
        }

        let shifts = [...MOCK_SHIFTS];

        // Apply filters
        if (filters.is_active !== undefined) {
            shifts = shifts.filter(shift => {
                const active = typeof shift.is_active === 'boolean' ? shift.is_active : (shift.status !== 'inactive');
                return active === !!filters.is_active;
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            shifts = shifts.filter(shift =>
                shift.name.toLowerCase().includes(searchTerm) ||
                (shift.description && shift.description.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.minDuration) {
            shifts = shifts.filter(shift => shift.duration_hours >= filters.minDuration);
        }

        if (filters.maxDuration) {
            shifts = shifts.filter(shift => shift.duration_hours <= filters.maxDuration);
        }

        // Sort shifts
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'name_asc':
                    shifts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name_desc':
                    shifts.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'start_time':
                    shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
                    break;
                case 'duration':
                    shifts.sort((a, b) => b.duration_hours - a.duration_hours);
                    break;
                default:
                    break;
            }
        }

        return {
            success: true,
            data: shifts,
            total: shifts.length
        };
    },

    /**
     * Get shift by ID
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async getShiftById(shiftId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem ca làm việc');
        }

        const shift = MOCK_SHIFTS.find(s => s.id === shiftId);

        if (!shift) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        return { success: true, data: shift };
    },

    /**
     * Get active shifts only
     * @returns {Promise<Object>}
     */
    async getActiveShifts() {
        await delay(200);

        const activeShifts = MOCK_SHIFTS.filter(shift => shift.status === 'active');

        return {
            success: true,
            data: activeShifts,
            total: activeShifts.length
        };
    },

    /**
     * Create new work shift (Manager only)
     * @param {Object} shiftData 
     * @returns {Promise<Object>}
     */
    async createShift(shiftData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền tạo ca làm việc');
        }

        // Validate required fields
        if (!shiftData.name || !shiftData.name.trim()) {
            throw new Error('Tên ca làm việc là bắt buộc');
        }

        const startTime = shiftData.start_time || shiftData.startTime;
        const endTime = shiftData.end_time || shiftData.endTime;

        if (!startTime || !endTime) {
            throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
        }

        if (!isValidTimeFormat(startTime)) {
            throw new Error('Thời gian bắt đầu không hợp lệ (định dạng: HH:mm)');
        }

        if (!isValidTimeFormat(endTime)) {
            throw new Error('Thời gian kết thúc không hợp lệ (định dạng: HH:mm)');
        }

        // Check for duplicate shift name
        const existingShift = MOCK_SHIFTS.find(s =>
            s.name.toLowerCase() === shiftData.name.trim().toLowerCase() && s.status === 'active'
        );
        if (existingShift) {
            throw new Error('Tên ca làm việc đã tồn tại');
        }

        const duration = calculateDuration(startTime, endTime);

        if (duration <= 0) {
            throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
        }

        if (duration > 12) {
            throw new Error('Ca làm việc không được vượt quá 12 tiếng');
        }

        const newShift = {
            id: generateId('shift'),
            name: shiftData.name.trim(),
            start_time: startTime,
            end_time: endTime,
            startTime: startTime, // Keep both formats
            endTime: endTime, // Keep both formats
            description: shiftData.description?.trim() || '',
            duration_hours: duration,
            status: shiftData.is_active === false ? 'inactive' : 'active',
            is_active: shiftData.is_active !== undefined ? !!shiftData.is_active : true,
            applicable_days: Array.isArray(shiftData.applicable_days) ? shiftData.applicable_days : [],
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        MOCK_SHIFTS.push(newShift);

        return {
            success: true,
            data: newShift,
            message: 'Tạo ca làm việc thành công'
        };
    },

    /**
     * Update work shift (Manager only)
     * @param {string} shiftId 
     * @param {Object} updateData 
     * @returns {Promise<Object>}
     */
    async updateShift(shiftId, updateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền cập nhật ca làm việc');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const currentShift = MOCK_SHIFTS[shiftIndex];
        const updatedFields = {};

        // Validate name if provided
        if (updateData.name !== undefined) {
            if (!updateData.name || !updateData.name.trim()) {
                throw new Error('Tên ca làm việc không được để trống');
            }

            // Check for duplicate name (exclude current shift)
            const duplicateShift = MOCK_SHIFTS.find(s =>
                s.id !== shiftId &&
                s.name.toLowerCase() === updateData.name.trim().toLowerCase() &&
                s.status === 'active'
            );
            if (duplicateShift) {
                throw new Error('Tên ca làm việc đã tồn tại');
            }

            updatedFields.name = updateData.name.trim();
        }

        // Validate and update times
        const startTime = updateData.start_time || updateData.startTime || currentShift.start_time;
        const endTime = updateData.end_time || updateData.endTime || currentShift.end_time;

        if (updateData.start_time !== undefined || updateData.startTime !== undefined) {
            if (!isValidTimeFormat(startTime)) {
                throw new Error('Thời gian bắt đầu không hợp lệ (định dạng: HH:mm)');
            }
            updatedFields.start_time = startTime;
            updatedFields.startTime = startTime;
        }

        if (updateData.end_time !== undefined || updateData.endTime !== undefined) {
            if (!isValidTimeFormat(endTime)) {
                throw new Error('Thời gian kết thúc không hợp lệ (định dạng: HH:mm)');
            }
            updatedFields.end_time = endTime;
            updatedFields.endTime = endTime;
        }

        // Recalculate duration if times changed
        if (updatedFields.start_time || updatedFields.end_time) {
            const duration = calculateDuration(startTime, endTime);

            if (duration <= 0) {
                throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
            }

            if (duration > 12) {
                throw new Error('Ca làm việc không được vượt quá 12 tiếng');
            }

            updatedFields.duration_hours = duration;
        }

        if (updateData.description !== undefined) {
            updatedFields.description = updateData.description?.trim() || '';
        }
        if (updateData.is_active !== undefined) {
            updatedFields.is_active = !!updateData.is_active;
            updatedFields.status = updateData.is_active ? 'active' : 'inactive';
        }
        if (updateData.applicable_days !== undefined) {
            updatedFields.applicable_days = Array.isArray(updateData.applicable_days) ? updateData.applicable_days : [];
        }

        MOCK_SHIFTS[shiftIndex] = {
            ...currentShift,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.id
        };

        return {
            success: true,
            data: MOCK_SHIFTS[shiftIndex],
            message: 'Cập nhật ca làm việc thành công'
        };
    },

    /**
     * Delete work shift (Manager only) - Soft delete
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async deleteShift(shiftId) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa ca làm việc');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Soft delete - mark as inactive
        MOCK_SHIFTS[shiftIndex].status = 'inactive';
        MOCK_SHIFTS[shiftIndex].deletedAt = new Date().toISOString();
        MOCK_SHIFTS[shiftIndex].deletedBy = currentUser.id;

        // Or hard delete (uncomment if needed)
        // MOCK_SHIFTS.splice(shiftIndex, 1);

        return {
            success: true,
            message: 'Xóa ca làm việc thành công'
        };
    },

    /**
     * Get statistics for work shifts
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const activeShifts = MOCK_SHIFTS.filter(s => s.status === 'active');
        const inactiveShifts = MOCK_SHIFTS.filter(s => s.status === 'inactive');

        const morningShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 5 && hour < 12;
        });

        const afternoonShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 12 && hour < 18;
        });

        const eveningShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 18 && hour < 24;
        });

        const nightShifts = activeShifts.filter(s => {
            const [hour] = s.start_time.split(':').map(Number);
            return hour >= 0 && hour < 5 || hour >= 22;
        });

        const fullTimeShifts = activeShifts.filter(s => s.duration_hours >= 8);
        const partTimeShifts = activeShifts.filter(s => s.duration_hours < 8);

        return {
            success: true,
            data: {
                total: MOCK_SHIFTS.length,
                active: activeShifts.length,
                inactive: inactiveShifts.length,
                morning: morningShifts.length,
                afternoon: afternoonShifts.length,
                evening: eveningShifts.length,
                night: nightShifts.length,
                fullTime: fullTimeShifts.length,
                partTime: partTimeShifts.length,
                averageDuration: activeShifts.length > 0
                    ? activeShifts.reduce((sum, s) => sum + s.duration_hours, 0) / activeShifts.length
                    : 0
            }
        };
    },

    /**
     * Check for overlapping shifts
     * @param {string} startTime - Format: "HH:mm"
     * @param {string} endTime - Format: "HH:mm"
     * @param {string} excludeShiftId - Optional shift ID to exclude from check
     * @returns {Promise<Object>}
     */
    async checkOverlap(startTime, endTime, excludeShiftId = null) {
        await delay(200);

        const shifts = MOCK_SHIFTS.filter(s =>
            s.status === 'active' &&
            s.id !== excludeShiftId
        );

        const overlappingShifts = shifts.filter(shift => {
            // Convert times to minutes for comparison
            const [newStartH, newStartM] = startTime.split(':').map(Number);
            const [newEndH, newEndM] = endTime.split(':').map(Number);
            const [existStartH, existStartM] = shift.start_time.split(':').map(Number);
            const [existEndH, existEndM] = shift.end_time.split(':').map(Number);

            const newStart = newStartH * 60 + newStartM;
            let newEnd = newEndH * 60 + newEndM;
            const existStart = existStartH * 60 + existStartM;
            let existEnd = existEndH * 60 + existEndM;

            // Handle overnight shifts
            if (newEnd <= newStart) newEnd += 24 * 60;
            if (existEnd <= existStart) existEnd += 24 * 60;

            // Check for overlap
            return (newStart < existEnd && newEnd > existStart);
        });

        return {
            success: true,
            hasOverlap: overlappingShifts.length > 0,
            overlappingShifts: overlappingShifts
        };
    },

    /**
     * Get staff assigned to a shift
     * @param {string} shiftId 
     * @returns {Promise<Object>}
     */
    async getShiftStaff(shiftId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem danh sách nhân viên');
        }

        const assignments = MOCK_SHIFT_ASSIGNMENTS.filter(a => a.shift_id === shiftId);
        const staffIds = assignments.map(a => a.staff_id);

        return {
            success: true,
            data: {
                shift_id: shiftId,
                staff_ids: staffIds,
                total: staffIds.length,
                assignments: assignments
            }
        };
    },

    /**
     * Assign staff to a shift
     * @param {string} shiftId 
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async assignStaffToShift(shiftId, staffId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền phân công nhân viên');
        }

        // Check if shift exists
        const shift = MOCK_SHIFTS.find(s => s.id === shiftId);
        if (!shift) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        // Check if staff already assigned
        const existingAssignment = MOCK_SHIFT_ASSIGNMENTS.find(
            a => a.shift_id === shiftId && a.staff_id === staffId
        );

        if (existingAssignment) {
            throw new Error('Nhân viên đã được phân vào ca này');
        }

        // Create new assignment
        const newAssignment = {
            id: generateId('assign'),
            shift_id: shiftId,
            staff_id: staffId,
            assigned_date: new Date().toISOString().split('T')[0],
            assigned_by: currentUser.id,
            created_at: new Date().toISOString()
        };

        MOCK_SHIFT_ASSIGNMENTS.push(newAssignment);

        return {
            success: true,
            data: newAssignment,
            message: 'Phân công nhân viên thành công'
        };
    },

    /**
     * Remove staff from a shift
     * @param {string} shiftId 
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async removeStaffFromShift(shiftId, staffId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa phân công nhân viên');
        }

        const assignmentIndex = MOCK_SHIFT_ASSIGNMENTS.findIndex(
            a => a.shift_id === shiftId && a.staff_id === staffId
        );

        if (assignmentIndex === -1) {
            throw new Error('Không tìm thấy phân công này');
        }

        MOCK_SHIFT_ASSIGNMENTS.splice(assignmentIndex, 1);

        return {
            success: true,
            message: 'Xóa phân công nhân viên thành công'
        };
    },

    /**
     * Get all shifts assigned to a staff member
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async getStaffShifts(staffId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem lịch làm việc');
        }

        const assignments = MOCK_SHIFT_ASSIGNMENTS.filter(a => a.staff_id === staffId);
        const shiftIds = assignments.map(a => a.shift_id);
        const shifts = MOCK_SHIFTS.filter(s => shiftIds.includes(s.id) && s.status === 'active');

        return {
            success: true,
            data: {
                staff_id: staffId,
                shifts: shifts,
                total: shifts.length
            }
        };
    },

    // =============================================
    // TEAM MANAGEMENT APIs
    // =============================================

    /**
     * Create a new team in a shift
     * @param {string} shiftId 
     * @param {Object} teamData 
     * @returns {Promise<Object>}
     */
    async createTeamWorkShift(shiftId, teamData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền tạo nhóm');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const newTeam = {
            id: generateId('team'),
            name: teamData.name || 'Nhóm mới',
            description: teamData.description || '',
            is_active: teamData.is_active !== undefined ? teamData.is_active : true,
            working_days: teamData.working_days || [], // Các ngày cụ thể team làm việc
            leader: teamData.leader || null,
            work_type: teamData.work_type || {},
            members: teamData.members || [],
            tasks: teamData.tasks || [],
            created_at: new Date().toISOString(),
            created_by: currentUser.id
        };

        if (!MOCK_SHIFTS[shiftIndex].team_work_shifts) {
            MOCK_SHIFTS[shiftIndex].team_work_shifts = [];
        }

        MOCK_SHIFTS[shiftIndex].team_work_shifts.push(newTeam);

        return {
            success: true,
            data: newTeam,
            message: 'Tạo nhóm thành công'
        };
    },

    /**
     * Update a team in a shift
     * @param {string} shiftId 
     * @param {string} teamId 
     * @param {Object} teamData 
     * @returns {Promise<Object>}
     */
    async updateTeamWorkShift(shiftId, teamId, teamData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền cập nhật nhóm');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const shift = MOCK_SHIFTS[shiftIndex];
        if (!Array.isArray(shift.team_work_shifts)) {
            throw new Error('Ca làm việc chưa có nhóm nào');
        }

        const teamIndex = shift.team_work_shifts.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            throw new Error('Không tìm thấy nhóm');
        }

        const updatedTeam = {
            ...shift.team_work_shifts[teamIndex],
            ...teamData,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id
        };

        MOCK_SHIFTS[shiftIndex].team_work_shifts[teamIndex] = updatedTeam;

        return {
            success: true,
            data: updatedTeam,
            message: 'Cập nhật nhóm thành công'
        };
    },

    /**
     * Delete a team from a shift
     * @param {string} shiftId 
     * @param {string} teamId 
     * @returns {Promise<Object>}
     */
    async deleteTeamWorkShift(shiftId, teamId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa nhóm');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const shift = MOCK_SHIFTS[shiftIndex];
        if (!Array.isArray(shift.team_work_shifts)) {
            throw new Error('Ca làm việc chưa có nhóm nào');
        }

        const teamIndex = shift.team_work_shifts.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            throw new Error('Không tìm thấy nhóm');
        }

        MOCK_SHIFTS[shiftIndex].team_work_shifts.splice(teamIndex, 1);

        return {
            success: true,
            message: 'Xóa nhóm thành công'
        };
    },

    /**
     * Add a staff member to a team
     * @param {string} shiftId 
     * @param {string} teamId 
     * @param {Object} staffData - { id, full_name, avatar_url }
     * @returns {Promise<Object>}
     */
    async addStaffToTeam(shiftId, teamId, staffData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền thêm nhân viên vào nhóm');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const shift = MOCK_SHIFTS[shiftIndex];
        if (!Array.isArray(shift.team_work_shifts)) {
            throw new Error('Ca làm việc chưa có nhóm nào');
        }

        const teamIndex = shift.team_work_shifts.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            throw new Error('Không tìm thấy nhóm');
        }

        const team = shift.team_work_shifts[teamIndex];
        if (!Array.isArray(team.members)) {
            team.members = [];
        }

        // Check if staff already in team
        const existingMember = team.members.find(m => m.id === staffData.id);
        if (existingMember) {
            throw new Error('Nhân viên đã có trong nhóm');
        }

        // Check if staff is leader of this team - if yes, skip adding (leader is already part of team)
        if (team.leader && team.leader.id === staffData.id) {
            return {
                success: true,
                data: team,
                message: 'Nhân viên đã là leader của nhóm'
            };
        }

        // VALIDATE: Check if staff is already in another team in the SAME shift
        const isInOtherTeam = shift.team_work_shifts.some(t => {
            // Skip current team
            if (t.id === teamId) return false;

            // Check if staff is leader of another team
            if (t.leader && t.leader.id === staffData.id) return true;

            // Check if staff is member of another team
            if (Array.isArray(t.members) && t.members.some(m => m.id === staffData.id)) return true;

            return false;
        });

        if (isInOtherTeam) {
            throw new Error('Nhân viên đã được phân vào nhóm khác trong ca này. Vui lòng xóa khỏi nhóm đó trước.');
        }

        team.members.push({
            id: staffData.id,
            full_name: staffData.full_name || staffData.name,
            avatar_url: staffData.avatar_url
        });

        team.updated_at = new Date().toISOString();
        team.updated_by = currentUser.id;

        return {
            success: true,
            data: team,
            message: 'Thêm nhân viên vào nhóm thành công'
        };
    },

    /**
     * Remove a staff member from a team
     * @param {string} shiftId 
     * @param {string} teamId 
     * @param {string} staffId 
     * @returns {Promise<Object>}
     */
    async removeStaffFromTeam(shiftId, teamId, staffId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền xóa nhân viên khỏi nhóm');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const shift = MOCK_SHIFTS[shiftIndex];
        if (!Array.isArray(shift.team_work_shifts)) {
            throw new Error('Ca làm việc chưa có nhóm nào');
        }

        const teamIndex = shift.team_work_shifts.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            throw new Error('Không tìm thấy nhóm');
        }

        const team = shift.team_work_shifts[teamIndex];
        if (!Array.isArray(team.members)) {
            throw new Error('Nhóm chưa có thành viên nào');
        }

        const memberIndex = team.members.findIndex(m => m.id === staffId);
        if (memberIndex === -1) {
            throw new Error('Không tìm thấy nhân viên trong nhóm');
        }

        team.members.splice(memberIndex, 1);
        team.updated_at = new Date().toISOString();
        team.updated_by = currentUser.id;

        return {
            success: true,
            data: team,
            message: 'Xóa nhân viên khỏi nhóm thành công'
        };
    },

    /**
     * Update team leader
     * @param {string} shiftId 
     * @param {string} teamId 
     * @param {Object} leaderData - { id, full_name, avatar_url }
     * @returns {Promise<Object>}
     */
    async updateTeamLeader(shiftId, teamId, leaderData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management')) {
            throw new Error('Không có quyền cập nhật leader');
        }

        const shiftIndex = MOCK_SHIFTS.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const shift = MOCK_SHIFTS[shiftIndex];
        if (!Array.isArray(shift.team_work_shifts)) {
            throw new Error('Ca làm việc chưa có nhóm nào');
        }

        const teamIndex = shift.team_work_shifts.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
            throw new Error('Không tìm thấy nhóm');
        }

        const team = shift.team_work_shifts[teamIndex];

        // VALIDATE: Check if new leader is in another team in the SAME shift
        const isInOtherTeam = shift.team_work_shifts.some(t => {
            // Skip current team
            if (t.id === teamId) return false;

            // Check if staff is leader of another team
            if (t.leader && t.leader.id === leaderData.id) return true;

            // Check if staff is member of another team
            if (Array.isArray(t.members) && t.members.some(m => m.id === leaderData.id)) return true;

            return false;
        });

        if (isInOtherTeam) {
            throw new Error('Nhân viên đã được phân vào nhóm khác trong ca này. Vui lòng xóa khỏi nhóm đó trước.');
        }

        // If new leader is in members, remove them from members
        if (Array.isArray(team.members)) {
            const memberIndex = team.members.findIndex(m => m.id === leaderData.id);
            if (memberIndex !== -1) {
                team.members.splice(memberIndex, 1);
            }
        }

        team.leader = {
            id: leaderData.id,
            full_name: leaderData.full_name || leaderData.name,
            avatar_url: leaderData.avatar_url
        };

        team.updated_at = new Date().toISOString();
        team.updated_by = currentUser.id;

        return {
            success: true,
            data: team,
            message: 'Cập nhật leader thành công'
        };
    },

    /**
     * Get team members
     * @param {string} shiftId 
     * @param {string} teamId 
     * @returns {Promise<Object>}
     */
    async getTeamMembers(shiftId, teamId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'shift_management') && !checkPermission(currentUser, 'view_schedule')) {
            throw new Error('Không có quyền xem danh sách nhân viên');
        }

        const shift = MOCK_SHIFTS.find(s => s.id === shiftId);
        if (!shift) {
            throw new Error('Không tìm thấy ca làm việc');
        }

        const team = shift.team_work_shifts?.find(t => t.id === teamId);
        if (!team) {
            throw new Error('Không tìm thấy nhóm');
        }

        return {
            success: true,
            data: {
                leader: team.leader || null,
                members: team.members || [],
                total: (team.members || []).length
            }
        };
    }
};

// Export both named and default
export { workshiftApi };
export default workshiftApi;

