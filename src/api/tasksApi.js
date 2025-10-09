// Tasks API - Constants, mock data, and data fetching logic

import { AREAS_DATA } from './areasApi';

// ========== CONSTANTS ==========

export const INTERNAL_TEMPLATES = [
    { key: 'cleaning', name: 'Dọn dẹp' },
    { key: 'feeding', name: 'Cho pet ăn' },
    { key: 'cashier', name: 'Thu ngân' },
    { key: 'service', name: 'Làm service' },
];

export const SHIFTS = ['Sáng', 'Chiều', 'Tối', 'Khung giờ tùy chỉnh'];

export const WIZARD_STEPS = ['Loại nhiệm vụ', 'Chọn nhiệm vụ', 'Khung thời gian', 'Ca làm', 'Phân công', 'Xác nhận'];

// ========== MOCK DATA ==========

// Mock services data (should be replaced with real API call)
const MOCK_SERVICES = [
    {
        id: 'service-1',
        name: 'Huấn luyện cơ bản',
        timeSlots: ['08:00 - 09:00', '14:00 - 15:00'],
        startDate: '',
        endDate: ''
    },
    {
        id: 'service-2',
        name: 'Spa thư giãn',
        timeSlots: ['09:00 - 10:30', '13:00 - 14:30', '15:00 - 16:30'],
        startDate: '',
        endDate: ''
    },
    {
        id: 'service-3',
        name: 'Grooming chuyên nghiệp',
        timeSlots: ['08:00 - 10:00', '13:00 - 15:00'],
        startDate: '',
        endDate: ''
    },
    {
        id: 'service-4',
        name: 'Khóa huấn luyện mùa hè',
        timeSlots: ['07:00 - 08:30', '17:00 - 18:30'],
        startDate: '2025-06-01',
        endDate: '2025-08-31'
    }
];

// Mock pets data (should be replaced with real API call)
const MOCK_PETS = [
    { id: 'pet-1', name: 'Golden 1', species: 'dog', breed: 'Golden Retriever', groupName: 'Chó Golden' },
    { id: 'pet-2', name: 'Golden 2', species: 'dog', breed: 'Golden Retriever', groupName: 'Chó Golden' },
    { id: 'pet-3', name: 'Husky 1', species: 'dog', breed: 'Husky', groupName: 'Chó Husky' },
    { id: 'pet-4', name: 'Mèo 1', species: 'cat', breed: 'Mèo Ba Tư', groupName: 'Mèo Ba Tư' },
    { id: 'pet-5', name: 'Mèo 2', species: 'cat', breed: 'Mèo Ba Tư', groupName: 'Mèo Ba Tư' },
];

// Mock staff data (should be replaced with real API call)
const MOCK_STAFF = [
    { id: 'u-001', full_name: 'Nguyễn Văn An', role: 'sale_staff', status: 'active' },
    { id: 'u-002', full_name: 'Trần Thị Bình', role: 'sale_staff', status: 'active' },
    { id: 'u-003', full_name: 'Lê Văn Chi', role: 'working_staff', status: 'active' },
    { id: 'u-004', full_name: 'Phạm Thị Dung', role: 'working_staff', status: 'active' },
    { id: 'u-005', full_name: 'Hoàng Văn Minh', role: 'working_staff', status: 'active' },
];

// ========== API FUNCTIONS ==========

/**
 * Get all services for task assignment
 * @returns {Promise<Array>} Array of service objects
 */
export const getServicesForTasks = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_SERVICES), 100);
    });
};

/**
 * Get all areas for task assignment
 * @returns {Promise<Array>} Array of area objects
 */
export const getAreasForTasks = async () => {
    // Use areas from areasApi
    return new Promise((resolve) => {
        setTimeout(() => resolve(AREAS_DATA), 100);
    });
};

/**
 * Get all pets for task assignment
 * @returns {Promise<Array>} Array of pet objects
 */
export const getPetsForTasks = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_PETS), 100);
    });
};

/**
 * Get all staff for task assignment
 * @returns {Promise<Array>} Array of staff objects
 */
export const getStaffForTasks = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_STAFF), 100);
    });
};

/**
 * Get pet groups map from pets array
 * @param {Array} pets - Array of pet objects
 * @returns {Object} Map of group name to pets
 */
export const getPetGroupsMap = (pets) => {
    const map = {};
    pets.forEach(pet => {
        const groupName = pet.groupName || 'Chưa phân nhóm';
        if (!map[groupName]) map[groupName] = [];
        map[groupName].push(pet);
    });
    return map;
};

/**
 * Get all tasks data needed for task management
 * @returns {Promise<Object>} Object containing services, areas, pets, staff
 */
export const getAllTasksData = async () => {
    const [services, areas, pets, staff] = await Promise.all([
        getServicesForTasks(),
        getAreasForTasks(),
        getPetsForTasks(),
        getStaffForTasks()
    ]);

    const petGroupsMap = getPetGroupsMap(pets);
    const petGroupNames = Object.keys(petGroupsMap);

    return {
        services,
        areas,
        pets,
        staff,
        petGroupsMap,
        petGroupNames
    };
};

// ========== FORM UTILITIES ==========

/**
 * Create initial form data for task wizard
 * @returns {Object} Initial form state
 */
export const createInitialFormData = () => ({
    type: 'internal',
    internalName: '',
    serviceId: '',
    timeframeType: 'day',
    date: new Date().toISOString().slice(0, 10),
    week: '',
    month: new Date().toISOString().slice(0, 7),
    servicePeriodStart: '',
    servicePeriodEnd: '',
    shift: 'Sáng',
    customShiftStart: '',
    customShiftEnd: '',
    internalAssignment: {
        areaIds: [],
        petGroups: [],
        staffGroups: []
    },
    selectedTimeSlots: [],
    timeSlotAssignments: {}
});

