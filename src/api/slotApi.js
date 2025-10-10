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
 * | team_id          | string   | ✅ Yes   | Staff team UUID                       |
 * | pet_group_id     | string   | ✅ Yes   | Pet group UUID                        |
 * | applicable_days  | string[] | ✅ Yes   | Date range for slot (start → end)    |
 * | start_time       | string   | ✅ Yes   | Slot start time (HH:mm)              |
 * | end_time         | string   | ✅ Yes   | Slot end time (HH:mm)                |
 * | max_capacity     | number   | ✅ Yes   | Max participants per slot            |
 * | price            | number   | ✅ Yes   | Final price (not base_price)         |
 * | special_notes    | string   | ⚠️ Opt   | Special notes for this slot          |
 * 
 * ============================================
 * BACKEND SCHEMA (from Swagger API)
 * ============================================
 * {
 *   "service_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "area_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "team_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "pet_group_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   "applicable_days": ["string"],
 *   "start_time": "string",
 *   "end_time": "string",
 *   "max_capacity": 0,
 *   "price": 0,
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
 * 3. team_id: Required, must exist in staff teams
 * 4. pet_group_id: Required, must exist in pet groups
 * 5. applicable_days: Required, must have at least 1 day
 * 6. start_time: Required, format HH:mm, must < end_time
 * 7. end_time: Required, format HH:mm, must > start_time
 * 8. max_capacity: Required, must be > 0 AND ≤ area.capacity (CRITICAL!)
 * 9. price: Required, must be >= 0
 * 10. Thời lượng slot: (end_time - start_time) PHẢI = service.duration_minutes
 * 
 * @module slotApi
 * @lastUpdated 2025-10-10
 */

import axios from 'axios';
import { AREAS_DATA } from './areasApi';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'slot') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Time utilities
const isValidTimeFormat = (time) => /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/.test(time);

const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const isDateInRange = (date, startDate, endDate) => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
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
// 1. Thời lượng slot (end_time - start_time) PHẢI BẰNG duration_minutes của service
// 2. max_capacity của slot PHẢI ≤ capacity của area
//
// Area capacities (from areasApi.js):
// area-1: 30 | area-2: 15 | area-3: 2 | area-4: 4 | area-5: 6 | area-6: 20
let MOCK_SLOTS = [
    // ==================== SERVICE-001: Tắm và chải lông cơ bản (90 phút) ====================
    {
        id: 'slot-001',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['2025-10-15', '2025-10-20'],
        start_time: '08:00',
        end_time: '09:30', // 90 phút
        max_capacity: 2, // ≤ 2 (area capacity)
        price: 150000,
        special_notes: 'Ca sáng, tắm rửa chuyên nghiệp',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-002',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-001',
        applicable_days: ['2025-10-15', '2025-10-20'],
        start_time: '10:00',
        end_time: '11:30', // 90 phút
        max_capacity: 2, // ≤ 2
        price: 150000,
        special_notes: '',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 2
    },
    {
        id: 'slot-003',
        service_id: 'service-001', // duration: 90 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-001',
        applicable_days: ['2025-10-15', '2025-10-20'],
        start_time: '14:00',
        end_time: '15:30', // 90 phút
        max_capacity: 2, // ≤ 2
        price: 180000, // Giá cao hơn (giờ cao điểm)
        special_notes: 'Giờ cao điểm',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-002: Cắt tỉa lông chuyên nghiệp (120 phút) ====================
    {
        id: 'slot-004',
        service_id: 'service-002', // duration: 120 phút
        area_id: 'area-4', // Phòng Spa Pet (capacity: 4)
        team_id: 'team-002',
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['2025-10-16', '2025-10-22'],
        start_time: '08:00',
        end_time: '10:00', // 120 phút
        max_capacity: 3, // ≤ 4
        price: 300000,
        special_notes: 'Cần đặt trước 2 ngày',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-013',
        service_id: 'service-002', // duration: 120 phút
        area_id: 'area-4', // Phòng Spa Pet (capacity: 4)
        team_id: 'team-002',
        pet_group_id: 'group-002',
        applicable_days: ['2025-10-16', '2025-10-22'],
        start_time: '13:00',
        end_time: '15:00', // 120 phút
        max_capacity: 4, // ≤ 4 (tối đa capacity)
        price: 350000, // Giá cao hơn (ca chiều)
        special_notes: 'Ca chiều cho chó lớn',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-003: Daycare theo ngày (480 phút = 8h) ====================
    {
        id: 'slot-005',
        service_id: 'service-003', // duration: 480 phút
        area_id: 'area-6', // Khu Outdoor Garden (capacity: 20)
        team_id: 'team-003',
        pet_group_id: 'group-001',
        applicable_days: ['2025-10-15', '2025-10-25'],
        start_time: '08:00',
        end_time: '16:00', // 480 phút (8 giờ)
        max_capacity: 20, // ≤ 20 (tối đa capacity)
        price: 200000,
        special_notes: 'Bao gồm 2 bữa ăn và chơi cả ngày',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 12
    },

    // ==================== SERVICE-004: Trải nghiệm huấn luyện (60 phút) ====================
    {
        id: 'slot-006',
        service_id: 'service-004', // duration: 60 phút
        area_id: 'area-5', // Phòng Training (capacity: 6)
        team_id: 'team-004',
        pet_group_id: 'group-003', // Mèo
        applicable_days: ['2025-10-18', '2025-10-20'],
        start_time: '15:00',
        end_time: '16:00', // 60 phút
        max_capacity: 6, // ≤ 6 (tối đa capacity)
        price: 500000,
        special_notes: 'Trải nghiệm huấn luyện cơ bản',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 3
    },
    {
        id: 'slot-014',
        service_id: 'service-004', // duration: 60 phút
        area_id: 'area-5', // Phòng Training (capacity: 6)
        team_id: 'team-004',
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['2025-10-18', '2025-10-20'],
        start_time: '09:00',
        end_time: '10:00', // 60 phút
        max_capacity: 5, // ≤ 6
        price: 500000,
        special_notes: 'Ca sáng cho chó nhỏ',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 4
    },

    // ==================== SERVICE-005: Tắm và vệ sinh nhanh (30 phút) ====================
    {
        id: 'slot-008',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['2025-10-15', '2025-10-22'],
        start_time: '08:00',
        end_time: '08:30', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 80000,
        special_notes: 'Dịch vụ nhanh 30 phút',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-009',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['2025-10-15', '2025-10-22'],
        start_time: '09:00',
        end_time: '09:30', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 100000, // Giá cao hơn cho chó lớn
        special_notes: 'Dành cho chó lớn',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 1
    },
    {
        id: 'slot-010',
        service_id: 'service-005', // duration: 30 phút
        area_id: 'area-3', // Phòng Grooming (capacity: 2)
        team_id: 'team-001',
        pet_group_id: 'group-003', // Mèo
        applicable_days: ['2025-10-15', '2025-10-22'],
        start_time: '13:00',
        end_time: '13:30', // 30 phút
        max_capacity: 2, // ≤ 2
        price: 80000,
        special_notes: 'Ca chiều cho mèo',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 0
    },

    // ==================== SERVICE-006: Tương tác với thú cưng cafe (30 phút) ====================
    {
        id: 'slot-007',
        service_id: 'service-006', // duration: 30 phút
        area_id: 'area-1', // Khu vực chính - Tầng 1 (capacity: 30)
        team_id: 'team-005',
        pet_group_id: 'group-004', // Thỏ
        applicable_days: ['2025-10-15', '2025-10-30'],
        start_time: '09:00',
        end_time: '09:30', // 30 phút
        max_capacity: 30, // ≤ 30 (tối đa capacity)
        price: 100000,
        special_notes: 'Tương tác với thú cưng cafe',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 15
    },
    {
        id: 'slot-015',
        service_id: 'service-006', // duration: 30 phút
        area_id: 'area-1', // Khu vực chính - Tầng 1 (capacity: 30)
        team_id: 'team-005',
        pet_group_id: 'group-004', // Thỏ
        applicable_days: ['2025-10-15', '2025-10-30'],
        start_time: '10:00',
        end_time: '10:30', // 30 phút
        max_capacity: 30, // ≤ 30
        price: 100000,
        special_notes: 'Ca sáng 10h',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 22
    },

    // ==================== SERVICE-007: Workshop chăm sóc thú cưng cơ bản (120 phút) ====================
    {
        id: 'slot-011',
        service_id: 'service-007', // duration: 120 phút
        area_id: 'area-2', // Khu VIP - Tầng 2 (capacity: 15)
        team_id: 'team-005',
        pet_group_id: 'group-001', // Chó nhỏ
        applicable_days: ['2025-10-20', '2025-10-22'],
        start_time: '14:00',
        end_time: '16:00', // 120 phút
        max_capacity: 15, // ≤ 15 (tối đa capacity)
        price: 200000,
        special_notes: 'Workshop cho người mới bắt đầu',
        createdAt: '2025-10-10T08:00:00Z',
        current_bookings: 8
    },
    {
        id: 'slot-012',
        service_id: 'service-007', // duration: 120 phút
        area_id: 'area-2', // Khu VIP - Tầng 2 (capacity: 15)
        team_id: 'team-005',
        pet_group_id: 'group-002', // Chó lớn
        applicable_days: ['2025-10-23', '2025-10-25'],
        start_time: '09:00',
        end_time: '11:00', // 120 phút
        max_capacity: 12, // ≤ 15
        price: 250000, // Giá cao hơn cho chó lớn
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

        // Filter by date
        if (filters.date) {
            slots = slots.filter(slot => {
                const [startDate, endDate] = slot.applicable_days;
                return isDateInRange(filters.date, startDate, endDate);
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

        // Validate time format
        if (!isValidTimeFormat(slotData.start_time)) {
            throw new Error('Giờ bắt đầu không hợp lệ (HH:mm)');
        }
        if (!isValidTimeFormat(slotData.end_time)) {
            throw new Error('Giờ kết thúc không hợp lệ (HH:mm)');
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
            team_id: slotData.team_id,
            pet_group_id: slotData.pet_group_id,
            applicable_days: slotData.applicable_days,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            max_capacity: slotData.max_capacity,
            price: slotData.price,
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

        // Validate time if provided
        if (updateData.start_time && !isValidTimeFormat(updateData.start_time)) {
            throw new Error('Giờ bắt đầu không hợp lệ (HH:mm)');
        }
        if (updateData.end_time && !isValidTimeFormat(updateData.end_time)) {
            throw new Error('Giờ kết thúc không hợp lệ (HH:mm)');
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
            const [startDate, endDate] = slot.applicable_days;
            return isDateInRange(date, startDate, endDate);
        });

        const availableSlots = slots.filter(s => s.current_bookings < s.max_capacity);

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

export default slotApi;

