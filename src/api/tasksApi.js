import taskTemplateApi, { TASK_TYPES } from './taskTemplateApi';
import slotApi, { WEEKDAYS, WEEKDAY_LABELS, SLOT_STATUS } from './slotApi';
import serviceApi, { SERVICE_STATUS } from './serviceApi';
import * as areasApi from './areasApi';
import petApi from './petApi';
import userApi from './userApi';
import workshiftApi from './workshiftApi';

// ========== HELPER FUNCTIONS ==========

/**
 * Get all data needed for Tasks Management page
 * @returns {Promise<Object>}
 */
export const getAllTasksData = async () => {
    try {
        const [
            tasksResponse,
            slotsResponse,
            servicesResponse,
            areasResponse,
            petGroupsResponse,
            shiftsResponse
        ] = await Promise.all([
            taskTemplateApi.getAllTaskTemplates(),
            slotApi.getAllSlots(),
            serviceApi.getAllServices(),
            areasApi.getAllAreas(),
            petApi.getPetGroups(),
            workshiftApi.getAllShifts()
        ]);

        return {
            tasks: tasksResponse.data || [],
            slots: slotsResponse.data || [],
            services: servicesResponse.data || [],
            areas: areasResponse.data || [],
            petGroups: petGroupsResponse.data || [],
            shifts: shiftsResponse.data || []
        };
    } catch (error) {
        console.error('Error fetching tasks data:', error);
        throw error;
    }
};

/**
 * Get tasks with their slots count
 * @returns {Promise<Array>}
 */
export const getTasksWithSlotsCount = async () => {
    try {
        const tasksResponse = await taskTemplateApi.getAllTaskTemplates();
        const slotsResponse = await slotApi.getAllSlots();

        const tasks = tasksResponse.data || [];
        const slots = slotsResponse.data || [];

        // Count slots for each task
        const tasksWithSlots = tasks.map(task => {
            const taskSlots = slots.filter(slot => slot.task_id === task.id);
            const publicSlots = taskSlots.filter(slot => slot.status === SLOT_STATUS.PUBLIC);

            return {
                ...task,
                total_slots: taskSlots.length,
                public_slots: publicSlots.length,
                internal_slots: taskSlots.length - publicSlots.length
            };
        });

        return tasksWithSlots;
    } catch (error) {
        console.error('Error fetching tasks with slots count:', error);
        throw error;
    }
};

/**
 * Get services with their task info
 * @returns {Promise<Array>}
 */
export const getServicesWithTaskInfo = async () => {
    try {
        const servicesResponse = await serviceApi.getAllServices();
        const tasksResponse = await taskTemplateApi.getAllTaskTemplates();

        const services = servicesResponse.data || [];
        const tasks = tasksResponse.data || [];

        // Add task info to each service
        const servicesWithTaskInfo = services.map(service => {
            const task = tasks.find(t => t.id === service.task_id);

            return {
                ...service,
                task_info: task || null
            };
        });

        return servicesWithTaskInfo;
    } catch (error) {
        console.error('Error fetching services with task info:', error);
        throw error;
    }
};

/**
 * Get slot with full details (task, area, pet group, shift, team)
 * @param {string} slotId 
 * @returns {Promise<Object>}
 */
export const getSlotWithDetails = async (slotId) => {
    try {
        const slotResponse = await slotApi.getSlotById(slotId);
        const slot = slotResponse.data;

        // Fetch related data
        const [taskResponse, areaResponse, petGroupResponse, shiftResponse] = await Promise.all([
            taskTemplateApi.getTaskTemplateById(slot.task_id),
            areasApi.getAreaById(slot.area_id),
            petApi.getPetGroups({ id: slot.pet_group_id }),
            workshiftApi.getShiftById(slot.work_shift_id)
        ]);

        // Find team in shift
        const shift = shiftResponse.data;
        const team = shift.teams?.find(t => t.id === slot.team_id) || null;

        return {
            ...slot,
            task: taskResponse.data,
            area: areaResponse.data,
            pet_group: petGroupResponse.data?.find(pg => pg.id === slot.pet_group_id) || null,
            shift: shift,
            team: team
        };
    } catch (error) {
        console.error('Error fetching slot with details:', error);
        throw error;
    }
};

/**
 * Get available teams from work shift
 * @param {string} workShiftId 
 * @returns {Promise<Array>}
 */
export const getTeamsFromWorkShift = async (workShiftId) => {
    try {
        const shiftResponse = await workshiftApi.getShiftById(workShiftId);
        const shift = shiftResponse.data;

        return shift.teams || [];
    } catch (error) {
        console.error('Error fetching teams from work shift:', error);
        throw error;
    }
};

/**
 * Create initial form data for creating slot
 * @param {string} taskId 
 * @returns {Object}
 */
export const createSlotFormData = (taskId) => {
    return {
        task_id: taskId,
        start_time: '',
        end_time: '',
        applicable_days: [],
        work_shift_id: '',
        team_id: '',
        pet_group_id: '',
        area_id: ''
    };
};

/**
 * Create initial form data for creating service from task
 * @param {Object} task 
 * @returns {Object}
 */
export const createServiceFormData = (task) => {
    return {
        task_id: task.id,
        task_type: task.task_type,
        image: task.image,
        name: task.name,
        description: task.description,
        estimate_duration: task.estimate_duration,
        price: 0
    };
};

/**
 * Create initial form data for publishing slot
 * @param {Object} slot 
 * @returns {Object}
 */
export const createPublishSlotFormData = (slot) => {
    return {
        capacity: slot.capacity || 1,
        price: slot.price || 0,
        description: slot.description || '',
        start_time: slot.start_time,
        end_time: slot.end_time,
        applicable_days: slot.applicable_days
    };
};

/**
 * Validate slot capacity against area capacity
 * @param {number} slotCapacity 
 * @param {string} areaId 
 * @returns {Promise<boolean>}
 */
export const validateSlotCapacity = async (slotCapacity, areaId) => {
    try {
        const areaResponse = await areasApi.getAreaById(areaId);
        const area = areaResponse.data;

        if (slotCapacity > area.capacity) {
            throw new Error(`Capacity vượt quá giới hạn của khu vực (${area.capacity})`);
        }

        return true;
    } catch (error) {
        console.error('Error validating slot capacity:', error);
        throw error;
    }
};

/**
 * Get statistics for dashboard
 * @returns {Promise<Object>}
 */
export const getTasksStatistics = async () => {
    try {
        const [taskStats, slotStats, serviceStats] = await Promise.all([
            taskTemplateApi.getStatistics(),
            slotApi.getStatistics(),
            serviceApi.getStatistics()
        ]);

        return {
            tasks: taskStats.data,
            slots: slotStats.data,
            services: serviceStats.data
        };
    } catch (error) {
        console.error('Error fetching tasks statistics:', error);
        throw error;
    }
};

// ========== EXPORTS ==========

// Export constants
export {
    TASK_TYPES,
    WEEKDAYS,
    WEEKDAY_LABELS,
    SLOT_STATUS,
    SERVICE_STATUS
};

// Export APIs
export {
    taskTemplateApi,
    slotApi,
    serviceApi
};

// Default export
export default {
    getAllTasksData,
    getTasksWithSlotsCount,
    getServicesWithTaskInfo,
    getSlotWithDetails,
    getTeamsFromWorkShift,
    createSlotFormData,
    createServiceFormData,
    createPublishSlotFormData,
    validateSlotCapacity,
    getTasksStatistics
};
