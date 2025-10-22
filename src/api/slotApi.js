/**
 * SLOT API - Service Slot Management
 * 
 * ============================================
 * OFFICIAL API FIELDS
 * ============================================
 * 
 * | Field Name       | Type     | Required | Description                           |
 * |------------------|----------|----------|---------------------------------------|
 * | service_id       | string   | ✅ Yes   | Service UUID                          |
 * | area_id          | string   | ✅ Yes   | Area UUID                             |
 * | pet_group_id     | string   | ✅ Yes   | Pet group UUID                        |
 * | applicable_days  | string[] | ✅ Yes   | Days of week (MONDAY, TUESDAY, etc.)  |
 * | start_time       | string   | ✅ Yes   | Slot start time (HH:mm:ss)           |
 * | end_time         | string   | ✅ Yes   | Slot end time (HH:mm:ss)             |
 * | max_capacity     | number   | ✅ Yes   | Max participants per slot            |
 * | price            | number   | ✅ Yes   | Final price (not base_price)         |
 * | status           | string   | ✅ Yes   | AVAILABLE, FULL, CANCELLED           |
 * | is_active        | boolean  | ✅ Yes   | Whether slot is active               |
 * | special_notes    | string   | ⚠️ Opt   | Special notes for this slot          |
 * 
 * ============================================
 * BACKEND SCHEMA (from Swagger API)
 * ============================================
 * {
 *   "service_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "area_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "pet_group_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "applicable_days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
 *   "start_time": "08:00:00",
 *   "end_time": "10:00:00",
 *   "max_capacity": 30,
 *   "price": 120000,
 *   "status": "AVAILABLE",
 *   "is_active": true,
 *   "special_notes": "string"
 * }
 * 
 * ============================================
 * KEY CONCEPTS
 * ============================================
 * 
 * 1. Service vs Slot:
 *    - Service: Thông tin cơ bản (name, description, base_price)
 *    - Slot: Lịch trình cụ thể (ngày, giờ, giá thực tế)
 * 
 * 2. Price Difference:
 *    - base_price (Service API): Giá gốc/khởi điểm
 *    - price (Slot API): Giá cuối cùng khách phải trả
 * 
 * 3. One Service → Many Slots:
 *    - 1 dịch vụ diễn ra nhiều ngày
 *    - Mỗi ngày có nhiều ca (slots)
 *    - Mỗi slot có giá và capacity riêng
 * 
 * ============================================
 * VALIDATION RULES
 * ============================================
 * 1. service_id: Required, must exist in services
 * 2. area_id: Required, must exist in areas
 * 3. pet_group_id: Required, must exist in pet groups
 * 4. applicable_days: Required, array of weekday strings (MONDAY-SUNDAY)
 * 5. start_time: Required, format HH:mm:ss, must < end_time
 * 6. end_time: Required, format HH:mm:ss, must > start_time
 * 7. max_capacity: Required, must be > 0 AND ≤ area.capacity (CRITICAL!)
 * 8. price: Required, must be >= 0
 * 9. status: Required, must be AVAILABLE, FULL, or CANCELLED
 * 10. is_active: Required, boolean
 * 
 * @module slotApi
 * @lastUpdated 2025-10-22
 */

import axios from 'axios';
import { AREAS_DATA } from './areasApi';

// Constants
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
    FULL: 'FULL',
    CANCELLED: 'CANCELLED'
};

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'slot') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Time utilities
const isValidTimeFormat = (time) => /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/.test(time);

const timeToMinutes = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1];
    return hours * 60 + minutes;
};

// Convert time HH:mm to HH:mm:ss
const normalizeTime = (time) => {
    if (!time) return '';
    // If already HH:mm:ss format, return as is
    if (time.split(':').length === 3) return time;
    // If HH:mm format, append :00
    if (time.split(':').length === 2) return `${time}:00`;
    return time;
};

// Check if a given date falls on any of the applicable weekdays
const dateMatchesWeekdays = (date, weekdays) => {
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekdayMap = {
        0: 'SUNDAY',
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY'
    };
    return weekdays.includes(weekdayMap[dayOfWeek]);
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
        'customer': ['view_slots', 'book_slots'],
        'working_staff': ['view_slots'],
        'sales_staff': ['view_slots'],
        'manager': ['slot_management', 'view_slots', 'book_slots'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock database for slots
// IMPORTANT RULES:
// 1. applicable_days: Array of weekdays (MONDAY, TUESDAY, etc.)
// 2. start_time/end_time: Format HH:mm:ss
// 3. max_capacity của slot PHẢI ≤ capacity của area
// 4. status: AVAILABLE, FULL, CANCELLED
// 5. is_active: boolean
//
// Area capacities (from areasApi.js):
// area-1: 30 | area-2: 15 | area-3: 2 | area-4: 4 | area-5: 6 | area-6: 20
let MOCK_SLOTS = [
    // ==================== SERVICE-001: Tắm và chải lông cơ bản (90 phút) ====================
    {
        id: 'slot-001',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        start_time: '08:00:00',
        end_time: '09:30:00', // 90 phút
        max_capacity: 2, // ≤ 2 (area capacity)
        price: 150000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Ca sáng, tắm rửa chuyên nghiệp',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-002',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-001',
        applicable_days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        start_time: '10:00:00',
        end_time: '11:30:00', // 90 phút
        max_capacity: 2, // ≤ 2
        price: 150000,
        status: 'FULL',
        is_active: true,
        special_notes: '',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 2
    },
    {
        id: 'slot-003',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-001',
        applicable_days: ['TUESDAY', 'THURSDAY'],
        start_time: '14:00:00',
        end_time: '15:30:00', // 90 phút
        max_capacity: 2, // ≤ 2
        price: 180000, // Giá cao hơn (giờ cao điểm)
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Giờ cao điểm',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-002: Cắt tỉa lông chuyên nghiệp (120 phút) ====================
    {
        id: 'slot-004',
        service_id: 'service-002', // duration: 120 phút
        area_id: 'area-4', // Phòng Spa Pet (capacity: 4)
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
        start_time: '08:00:00',
        end_time: '10:00:00', // 120 phút
        max_capacity: 3, // ≤ 4
        price: 300000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Cần đặt trước 2 ngày',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-013',
        service_id: 'service-002', // duration: 120 phút
        area_id: 'area-4', // Phòng Spa Pet (capacity: 4)
        pet_group_id: 'group-002',
        applicable_days: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
        start_time: '13:00:00',
        end_time: '15:00:00', // 120 phút
        max_capacity: 4, // ≤ 4 (tối đa capacity)
        price: 350000, // Giá cao hơn (ca chiều)
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Ca chiều cho chó lớn',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-003: Daycare theo ngày (480 phút = 8h) ====================
    {
        id: 'slot-005',
        service_id: 'service-003', // duration: 480 phút
        area_id: 'area-6', // Khu Outdoor Garden (capacity: 20)
        pet_group_id: 'group-001',
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        start_time: '08:00:00',
        end_time: '16:00:00', // 480 phút (8 giờ)
        max_capacity: 20, // ≤ 20 (tối đa capacity)
        price: 200000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Bao gồm 2 bữa ăn và chơi cả ngày',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 12
    },

    // ==================== SERVICE-004: Trải nghiệm huấn luyện (60 phút) ====================
    {
        id: 'slot-006',
        service_id: 'service-004', // duration: 60 phút
        area_id: 'area-5', // Phòng Training (capacity: 6)
        pet_group_id: 'group-003', // Mèo
        applicable_days: ['WEDNESDAY', 'FRIDAY'],
        start_time: '15:00:00',
        end_time: '16:00:00', // 60 phút
        max_capacity: 6, // ≤ 6 (tối đa capacity)
        price: 500000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Trải nghiệm huấn luyện cơ bản',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 3
    },
    {
        id: 'slot-014',
        service_id: 'service-004', // duration: 60 phút
        area_id: 'area-5', // Phòng Training (capacity: 6)
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['WEDNESDAY', 'FRIDAY'],
        start_time: '09:00:00',
        end_time: '10:00:00', // 60 phút
        max_capacity: 5, // ≤ 6
        price: 500000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Ca sáng cho chó nhỏ',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 4
    },

    // ==================== SERVICE-005: Tắm và vệ sinh nhanh (30 phút) ====================
    {
        id: 'slot-008',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY'],
        start_time: '08:00:00',
        end_time: '08:30:00', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 80000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Dịch vụ nhanh 30 phút',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-009',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY'],
        start_time: '09:00:00',
        end_time: '09:30:00', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 100000, // Giá cao hơn cho chó lớn
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Dành cho chó lớn',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-010',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        pet_group_id: 'group-003', // Mèo
        applicable_days: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
        start_time: '13:00:00',
        end_time: '13:30:00', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 80000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Ca chiều cho mèo',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-006: Tương tác với thú cưng cafe (30 phút) ====================
    {
        id: 'slot-007',
        service_id: 'service-006', // duration: 30 phút
        area_id: 'area-1', // Khu vực chính - Tầng 1 (capacity: 30)
        pet_group_id: 'group-004', // Thỏ
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        start_time: '09:00:00',
        end_time: '09:30:00', // 30 phút
        max_capacity: 30, // ≤ 30 (tối đa capacity)
        price: 100000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Tương tác với thú cưng cafe',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 15
    },
    {
        id: 'slot-015',
        service_id: 'service-006', // duration: 30 phút
        area_id: 'area-1', // Khu vực chính - Tầng 1 (capacity: 30)
        pet_group_id: 'group-004', // Thỏ
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        start_time: '10:00:00',
        end_time: '10:30:00', // 30 phút
        max_capacity: 30, // ≤ 30
        price: 100000,
        status: 'FULL',
        is_active: true,
        special_notes: 'Ca sáng 10h',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 22
    },

    // ==================== SERVICE-007: Workshop chăm sóc thú cưng cơ bản (120 phút) ====================
    {
        id: 'slot-011',
        service_id: 'service-007', // duration: 120 phút
        area_id: 'area-2', // Khu VIP - Tầng 2 (capacity: 15)
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['SATURDAY', 'SUNDAY'],
        start_time: '14:00:00',
        end_time: '16:00:00', // 120 phút
        max_capacity: 15, // ≤ 15 (tối đa capacity)
        price: 200000,
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Workshop cho người mới bắt đầu',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 8
    },
    {
        id: 'slot-012',
        service_id: 'service-007', // duration: 120 phút
        area_id: 'area-2', // Khu VIP - Tầng 2 (capacity: 15)
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['SATURDAY', 'SUNDAY'],
        start_time: '09:00:00',
        end_time: '11:00:00', // 120 phút
        max_capacity: 12, // ≤ 15
        price: 250000, // Giá cao hơn cho chó lớn
        status: 'AVAILABLE',
        is_active: true,
        special_notes: 'Chuyên sâu cho chó lớn',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 5
    }
];

// Slot APIs
const slotApi = {
    // Get all slots (with filters)
    async getAllSlots(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'view_slots')) {
            throw new Error('Không có quyền xem slots');
        }

        let slots = [...MOCK_SLOTS];

        // Filter by service
        if (filters.service_id) {
            slots = slots.filter(slot => slot.service_id === filters.service_id);
        }

        // Filter by area
        if (filters.area_id) {
            slots = slots.filter(slot => slot.area_id === filters.area_id);
        }

        // Filter by team
        if (filters.team_id) {
            slots = slots.filter(slot => slot.team_id === filters.team_id);
        }

        // Filter by pet group
        if (filters.pet_group_id) {
            slots = slots.filter(slot => slot.pet_group_id === filters.pet_group_id);
        }

        // Filter by date (check if date's weekday matches slot's applicable_days)
        if (filters.date) {
            slots = slots.filter(slot => {
                return dateMatchesWeekdays(filters.date, slot.applicable_days);
            });
        }

        // Filter by availability
        if (filters.available_only) {
            slots = slots.filter(slot => slot.current_bookings < slot.max_capacity);
        }

        // Filter by price range
        if (filters.min_price) {
            slots = slots.filter(slot => slot.price >= filters.min_price);
        }
        if (filters.max_price) {
            slots = slots.filter(slot => slot.price <= filters.max_price);
        }

        // Sort
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    slots.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    slots.sort((a, b) => b.price - a.price);
                    break;
                case 'time':
                    slots.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
                    break;
                case 'capacity':
                    slots.sort((a, b) => b.max_capacity - a.max_capacity);
                    break;
                default:
                    break;
            }
        }

        return {
            success: true,
            data: slots,
            total: slots.length
        };
    },

    // Get slot by ID
    async getSlotById(slotId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'view_slots')) {
            throw new Error('Không có quyền xem slot');
        }

        const slot = MOCK_SLOTS.find(s => s.id === slotId);
        if (!slot) {
            throw new Error('Không tìm thấy slot');
        }

        return { success: true, data: slot };
    },

    // Get slots by service ID
    async getSlotsByService(serviceId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'view_slots')) {
            throw new Error('Không có quyền xem slots');
        }

        const slots = MOCK_SLOTS.filter(s => s.service_id === serviceId);

        return {
            success: true,
            data: slots,
            total: slots.length
        };
    },

    // Create new slot
    async createSlot(slotData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền tạo slot');
        }

        // Validate required fields
        const requiredFields = [
            'service_id', 'area_id', 'team_id', 'pet_group_id',
            'applicable_days', 'start_time', 'end_time', 'max_capacity', 'price'
        ];

        for (const field of requiredFields) {
            if (!slotData[field]) {
                throw new Error(`Thiếu thông tin: ${field}`);
            }
        }

        // Normalize time format (HH:mm -> HH:mm:ss)
        slotData.start_time = normalizeTime(slotData.start_time);
        slotData.end_time = normalizeTime(slotData.end_time);

        // Validate time format
        if (!isValidTimeFormat(slotData.start_time)) {
            throw new Error('Giờ bắt đầu không hợp lệ (HH:mm:ss)');
        }
        if (!isValidTimeFormat(slotData.end_time)) {
            throw new Error('Giờ kết thúc không hợp lệ (HH:mm:ss)');
        }

        // Validate time range
        if (timeToMinutes(slotData.start_time) >= timeToMinutes(slotData.end_time)) {
            throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
        }

        // Validate capacity
        if (slotData.max_capacity <= 0) {
            throw new Error('Sức chứa phải lớn hơn 0');
        }

        // Validate price
        if (slotData.price < 0) {
            throw new Error('Giá không hợp lệ');
        }

        // Validate applicable_days
        if (!Array.isArray(slotData.applicable_days) || slotData.applicable_days.length < 1) {
            throw new Error('Phải có ít nhất 1 ngày áp dụng');
        }

        // Validate weekdays format
        const invalidWeekdays = slotData.applicable_days.filter(day => !WEEKDAYS.includes(day));
        if (invalidWeekdays.length > 0) {
            throw new Error(`Ngày không hợp lệ: ${invalidWeekdays.join(', ')}. Phải là MONDAY, TUESDAY, etc.`);
        }

        // Validate max_capacity against area capacity
        const area = AREAS_DATA.find(a => a.id === slotData.area_id);
        if (!area) {
            throw new Error(`Không tìm thấy khu vực: ${slotData.area_id}`);
        }
        if (slotData.max_capacity > area.capacity) {
            throw new Error(`Sức chứa slot (${slotData.max_capacity}) vượt quá sức chứa khu vực "${area.name}" (${area.capacity})`);
        }

        // Create new slot
        const newSlot = {
            id: generateId('slot'),
            service_id: slotData.service_id,
            area_id: slotData.area_id,
            pet_group_id: slotData.pet_group_id,
            applicable_days: slotData.applicable_days,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            max_capacity: slotData.max_capacity,
            price: slotData.price,
            status: slotData.status || SLOT_STATUS.AVAILABLE,
            is_active: slotData.is_active !== undefined ? slotData.is_active : true,
            special_notes: slotData.special_notes || '',
            current_bookings: 0,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };

        MOCK_SLOTS.push(newSlot);

        return {
            success: true,
            data: newSlot,
            message: 'Tạo slot thành công'
        };
    },

    // Update slot
    async updateSlot(slotId, updateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền cập nhật slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);
        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Normalize and validate time if provided
        if (updateData.start_time) {
            updateData.start_time = normalizeTime(updateData.start_time);
            if (!isValidTimeFormat(updateData.start_time)) {
                throw new Error('Giờ bắt đầu không hợp lệ (HH:mm:ss)');
            }
        }
        if (updateData.end_time) {
            updateData.end_time = normalizeTime(updateData.end_time);
            if (!isValidTimeFormat(updateData.end_time)) {
                throw new Error('Giờ kết thúc không hợp lệ (HH:mm:ss)');
            }
        }

        // Validate time range if both provided
        if (updateData.start_time && updateData.end_time) {
            if (timeToMinutes(updateData.start_time) >= timeToMinutes(updateData.end_time)) {
                throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
            }
        }

        // Validate capacity if provided
        if (updateData.max_capacity !== undefined && updateData.max_capacity <= 0) {
            throw new Error('Sức chứa phải lớn hơn 0');
        }

        // Validate max_capacity against area capacity if max_capacity or area_id is being updated
        if (updateData.max_capacity !== undefined || updateData.area_id) {
            const areaId = updateData.area_id || MOCK_SLOTS[slotIndex].area_id;
            const maxCapacity = updateData.max_capacity !== undefined
                ? updateData.max_capacity
                : MOCK_SLOTS[slotIndex].max_capacity;

            const area = AREAS_DATA.find(a => a.id === areaId);
            if (!area) {
                throw new Error(`Không tìm thấy khu vực: ${areaId}`);
            }
            if (maxCapacity > area.capacity) {
                throw new Error(`Sức chứa slot (${maxCapacity}) vượt quá sức chứa khu vực "${area.name}" (${area.capacity})`);
            }
        }

        // Validate price if provided
        if (updateData.price !== undefined && updateData.price < 0) {
            throw new Error('Giá không hợp lệ');
        }

        // Update slot
        MOCK_SLOTS[slotIndex] = {
            ...MOCK_SLOTS[slotIndex],
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.id
        };

        return {
            success: true,
            data: MOCK_SLOTS[slotIndex],
            message: 'Cập nhật slot thành công'
        };
    },

    // Delete slot
    async deleteSlot(slotId) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xóa slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);
        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        // Check if slot has bookings
        if (MOCK_SLOTS[slotIndex].current_bookings > 0) {
            throw new Error('Không thể xóa slot đã có người đặt');
        }

        // Hard delete
        MOCK_SLOTS.splice(slotIndex, 1);

        return {
            success: true,
            message: 'Xóa slot thành công'
        };
    },

    // Book a slot (increase current_bookings)
    async bookSlot(slotId, numberOfPeople = 1) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'book_slots')) {
            throw new Error('Không có quyền đặt slot');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);
        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const slot = MOCK_SLOTS[slotIndex];

        // Check capacity
        if (slot.current_bookings + numberOfPeople > slot.max_capacity) {
            throw new Error(`Slot đã đầy! Chỉ còn ${slot.max_capacity - slot.current_bookings} chỗ`);
        }

        // Update bookings
        MOCK_SLOTS[slotIndex].current_bookings += numberOfPeople;

        return {
            success: true,
            data: MOCK_SLOTS[slotIndex],
            message: `Đặt slot thành công cho ${numberOfPeople} người`
        };
    },

    // Cancel booking (decrease current_bookings)
    async cancelBooking(slotId, numberOfPeople = 1) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'book_slots')) {
            throw new Error('Không có quyền hủy booking');
        }

        const slotIndex = MOCK_SLOTS.findIndex(s => s.id === slotId);
        if (slotIndex === -1) {
            throw new Error('Không tìm thấy slot');
        }

        const slot = MOCK_SLOTS[slotIndex];

        // Validate cancellation
        if (slot.current_bookings - numberOfPeople < 0) {
            throw new Error('Số lượng hủy không hợp lệ');
        }

        // Update bookings
        MOCK_SLOTS[slotIndex].current_bookings -= numberOfPeople;

        return {
            success: true,
            data: MOCK_SLOTS[slotIndex],
            message: `Hủy booking thành công cho ${numberOfPeople} người`
        };
    },

    // Get statistics
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'slot_management')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const total = MOCK_SLOTS.length;
        const available = MOCK_SLOTS.filter(s => s.current_bookings < s.max_capacity).length;
        const full = total - available;
        const totalCapacity = MOCK_SLOTS.reduce((sum, s) => sum + s.max_capacity, 0);
        const totalBookings = MOCK_SLOTS.reduce((sum, s) => sum + s.current_bookings, 0);
        const occupancyRate = totalCapacity > 0 ? ((totalBookings / totalCapacity) * 100).toFixed(1) : 0;

        // Price statistics
        const prices = MOCK_SLOTS.map(s => s.price);
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        // Revenue projection
        const projectedRevenue = MOCK_SLOTS.reduce((sum, s) => sum + (s.price * s.max_capacity), 0);
        const currentRevenue = MOCK_SLOTS.reduce((sum, s) => sum + (s.price * s.current_bookings), 0);

        return {
            success: true,
            data: {
                total,
                available,
                full,
                totalCapacity,
                totalBookings,
                occupancyRate: parseFloat(occupancyRate),
                avgPrice,
                minPrice,
                maxPrice,
                projectedRevenue,
                currentRevenue
            }
        };
    },

    // Check slot availability for a specific date
    async checkAvailability(serviceId, date) {
        await delay(200);

        const slots = MOCK_SLOTS.filter(slot => {
            if (slot.service_id !== serviceId) return false;
            return dateMatchesWeekdays(date, slot.applicable_days);
        });

        const availableSlots = slots.filter(s => s.current_bookings < s.max_capacity && s.is_active);

        return {
            success: true,
            data: {
                date,
                totalSlots: slots.length,
                availableSlots: availableSlots.length,
                slots: availableSlots
            }
        };
    }
};

// Export utilities for use in other modules
export { normalizeTime, dateMatchesWeekdays };

export default slotApi;

