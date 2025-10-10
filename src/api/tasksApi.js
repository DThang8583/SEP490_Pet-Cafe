// Tasks API - Constants, mock data, and data fetching logic

import { AREAS_DATA } from './areasApi';
import { petApi, MOCK_PET_GROUPS } from './petApi';
import { managerApi } from './userApi';
import serviceApi from './serviceApi';

// ========== CONSTANTS ==========

export const INTERNAL_TEMPLATES = [
    { key: 'cleaning', name: 'Dọn dẹp' },
    { key: 'feeding', name: 'Cho pet ăn' },
    { key: 'cashier', name: 'Thu ngân' },
    { key: 'service', name: 'Làm service' },
];

export const SHIFTS = [
    '06:00 - 09:00',
    '09:00 - 12:00',
    '12:00 - 15:00',
    '15:00 - 18:00',
    '18:00 - 21:00',
    '21:00 - 00:00'
];

export const WIZARD_STEPS = ['Loại nhiệm vụ', 'Chọn nhiệm vụ', 'Khung thời gian', 'Ca làm', 'Phân công', 'Xác nhận'];

// ========== API FUNCTIONS ==========

/**
 * Get all tasks from localStorage (same as TasksPage.jsx)
 * @returns {Promise<Object>} { success: boolean, data: Array }
 */
export const getAllTasks = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // Read from localStorage - same key as TasksPage.jsx
        const saved = localStorage.getItem('mgr_tasks_v2');
        if (saved) {
            const tasks = JSON.parse(saved);
            return {
                success: true,
                data: tasks
            };
        }

        // Return empty array if no tasks found
        return {
            success: true,
            data: []
        };
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        return {
            success: false,
            data: [],
            error: error.message
        };
    }
};

// NOTE: All data (services, pets, areas, staff, pet groups) are now fetched from their respective APIs
// - Services: serviceApi.getAllServices()
// - Areas: AREAS_DATA from areasApi
// - Pets: petApi.getPets()
// - Staff: managerApi.getStaff() from userApi
// - Pet Groups: petApi.getPetGroups()
// This ensures data consistency across all manager pages

/**
 * Get all services for task assignment
 * Loads from serviceApi.js with proper field mapping
 * @returns {Promise<Array>} Array of service objects
 */
export const getServicesForTasks = async () => {
    try {
        const response = await serviceApi.getAllServices();
        const services = response?.data || [];

        // Map services to task format
        const mappedServices = services.map(service => ({
            id: service.id,
            name: service.name,
            category: service.category || service.service_type,
            duration: service.duration || service.duration_minutes,
            price: service.price || service.base_price,
            image: service.image || service.image_url,
            description: service.description,
            location: service.location,
            staffRequired: service.staffRequired,
            // Service period - extract from service if available (for events/workshops)
            startDate: service.serviceStartDate || '',
            endDate: service.serviceEndDate || '',
            registrationStartDate: service.registrationStartDate || '',
            registrationEndDate: service.registrationEndDate || ''
            // NOTE: Services no longer use timeSlots - use SHIFTS instead for assignment
        }));

        console.log('[tasksApi] getServicesForTasks() - loaded from serviceApi:', mappedServices.length);
        return mappedServices;
    } catch (error) {
        console.error('[tasksApi] getServicesForTasks() error:', error);
        return [];
    }
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
 * Uses the same API as PetsPage to ensure data consistency
 * @returns {Promise<Array>} Array of pet objects
 */
export const getPetsForTasks = async () => {
    try {
        const response = await petApi.getPets();
        const pets = response?.data || [];
        console.log('[tasksApi] getPetsForTasks() - loaded from petApi:', pets.length);
        return pets;
    } catch (error) {
        console.error('[tasksApi] getPetsForTasks() error:', error);
        return [];
    }
};

/**
 * Get all staff for task assignment
 * Uses managerApi from userApi.js to ensure data consistency
 * @returns {Promise<Array>} Array of staff objects
 */
export const getStaffForTasks = async () => {
    try {
        const response = await managerApi.getStaff();
        const staff = response?.data || [];
        console.log('[tasksApi] getStaffForTasks() - loaded from userApi:', staff.length);
        return staff;
    } catch (error) {
        console.error('[tasksApi] getStaffForTasks() error:', error);
        return [];
    }
};

/**
 * Get pet groups for task assignment
 * Uses MOCK_PET_GROUPS from petApi.js to ensure data consistency
 * @returns {Promise<Array>} Array of pet group objects
 */
export const getPetGroupsForTasks = async () => {
    try {
        const response = await petApi.getPetGroups();
        const groups = response?.data || [];
        console.log('[tasksApi] getPetGroupsForTasks() - loaded from petApi:', groups.length);
        return groups;
    } catch (error) {
        console.error('[tasksApi] getPetGroupsForTasks() error:', error);
        return [];
    }
};

/**
 * Get pet groups map from groups and pets arrays
 * Maps each group to its associated pets based on species_id and breed_id
 * @param {Array} groups - Array of pet group objects from petApi
 * @param {Array} pets - Array of pet objects from petApi
 * @returns {Object} Map of group name to pets
 */
export const getPetGroupsMap = (groups, pets) => {
    const map = {};

    groups.forEach(group => {
        // Filter pets that match this group's criteria
        const matchingPets = pets.filter(pet => {
            // Must match species
            if (pet.species_id !== group.pet_species_id) return false;

            // If group has a specific breed, pet must match it
            if (group.pet_breed_id && group.pet_breed_id !== '') {
                return pet.breed_id === group.pet_breed_id;
            }

            // If group has no specific breed, all pets of that species match
            return true;
        });

        map[group.name] = matchingPets;
    });

    return map;
};

/**
 * Get all tasks data needed for task management
 * @returns {Promise<Object>} Object containing services, areas, pets, staff, groups
 */
export const getAllTasksData = async () => {
    const [services, areas, pets, staff, groups] = await Promise.all([
        getServicesForTasks(),
        getAreasForTasks(),
        getPetsForTasks(),
        getStaffForTasks(),
        getPetGroupsForTasks()
    ]);

    const petGroupsMap = getPetGroupsMap(groups, pets);
    const petGroupNames = Object.keys(petGroupsMap);

    console.log('[tasksApi] getAllTasksData() - Pet Groups:', groups.length, '| Staff:', staff.length);

    return {
        services,
        areas,
        pets,
        staff,
        groups,
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
    shifts: [], // Array of shifts for both internal and service tasks
    // Both internal and service tasks use shiftAssignments now
    // shiftAssignments[shift] = { areaIds, petGroups, staffGroups }
    shiftAssignments: {}
});

