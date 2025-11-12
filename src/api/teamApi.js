// Note: MOCK_WORK_TYPES removed - use workTypeApi.getWorkTypeById() for API calls
import apiClient from '../config/config';
import { getWorkTypeById as getWorkTypeByIdFromAPI } from './workTypeApi';
import { getWorkShiftById as getWorkShiftByIdFromAPI, getWorkShifts as getWorkShiftsFromAPI } from './workShiftApi';
import { getEmployeeById as getEmployeeByIdFromAPI, getAllEmployees as getAllEmployeesFromAPI } from './employeeApi';

// Employee cache to avoid multiple API calls
let employeeCache = new Map();
let allEmployeesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get employee from cache or API
const getEmployeeById = async (id) => {
    if (!id) return null;

    // Check cache first
    if (employeeCache.has(id)) {
        return employeeCache.get(id);
    }

    // If we have all employees cache, check there
    if (allEmployeesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        const employee = allEmployeesCache.find(e => e.id === id);
        if (employee) {
            employeeCache.set(id, employee);
            return employee;
        }
    }

    // Fetch from API
    try {
        const employee = await getEmployeeByIdFromAPI(id);
        if (employee) {
            employeeCache.set(id, employee);
            return employee;
        }
    } catch (error) {
        // Silently handle 404 or not found errors - employee might not exist
        if (error.response?.status === 404 || error.message?.includes('Không tìm thấy')) {
            return null;
        }
        return null;
    }

    return null;
};

// Load all employees into cache
const loadAllEmployeesToCache = async () => {
    try {
        const response = await getAllEmployeesFromAPI({ page_index: 0, page_size: 1000 });
        if (response && response.data) {
            allEmployeesCache = response.data;
            cacheTimestamp = Date.now();
            // Populate individual cache
            response.data.forEach(emp => {
                employeeCache.set(emp.id, emp);
            });
        }
    } catch (error) {
        // Silently fail - cache is optional
    }
};


// Helper: Get work shift by ID (with caching)
let workShiftCache = new Map();
let workShiftCacheTimestamp = null;
const WORK_SHIFT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getWorkShiftById = async (id) => {
    if (!id) return null;

    // Check cache first
    if (workShiftCache.has(id) && Date.now() - workShiftCacheTimestamp < WORK_SHIFT_CACHE_DURATION) {
        return workShiftCache.get(id);
    }

    // Fetch from API
    try {
        const response = await getWorkShiftByIdFromAPI(id);
        if (response && response.success && response.data) {
            const workShift = response.data;
            workShiftCache.set(id, workShift);
            workShiftCacheTimestamp = Date.now();
            return workShift;
        }
    } catch (error) {
        return null;
    }

    return null;
};


/**
 * Get all teams
 * Official API: GET /api/teams
 * Response: { data: [...], pagination: {...} }
 */
export const getTeams = async (params = {}) => {
    try {
        const {
            page_index = 0,
            page_size = 10,
            page = undefined,
            limit = undefined,
            is_active = undefined,
            working_day = undefined,
            start_working_time = undefined,
            end_working_time = undefined,
            work_type_id = undefined
        } = params;

        // Convert page_index to page (0-based) if page is not provided
        const actualPage = page !== undefined ? page : page_index;
        const actualLimit = limit !== undefined ? limit : page_size;

        const requestParams = {
            page: actualPage,
            limit: actualLimit,
            _t: Date.now()
        };

        // Add optional filters
        if (is_active !== undefined) {
            requestParams.is_active = is_active;
        }
        if (working_day !== undefined) {
            requestParams.working_day = working_day;
        }
        if (start_working_time !== undefined) {
            requestParams.start_working_time = start_working_time;
        }
        if (end_working_time !== undefined) {
            requestParams.end_working_time = end_working_time;
        }
        if (work_type_id !== undefined) {
            requestParams.work_type_id = work_type_id;
        }

        const response = await apiClient.get('/teams', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        // API returns data directly with pagination
        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                total_items_count: 0,
                page_size: actualLimit,
                total_pages_count: 0,
                page_index: actualPage,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy danh sách nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get team by ID (detail)
 * Official API: GET /api/teams/{id}
 */
export const getTeamById = async (id) => {
    try {
        if (!id) {
            throw new Error('ID nhóm là bắt buộc');
        }

        const response = await apiClient.get(`/teams/${id}`, { timeout: 10000 });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get work types NOT assigned to a team
 * Official API: GET /api/teams/{id}/work-types
 * Returns: Array of work types that are NOT in the team
 */
export const getTeamWorkTypes = async (teamId) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        const response = await apiClient.get(`/teams/${teamId}/work-types`, { timeout: 10000 });

        // API returns array of work types directly
        return {
            success: true,
            data: Array.isArray(response.data) ? response.data : []
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get work shifts of a team
 * Official API: GET /api/teams/{id}/work-shifts
 * Parameters: id, page, limit
 * Response: { data: [...], pagination: {...} }
 */
export const getTeamWorkShifts = async (teamId, params = {}) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        const {
            page_index = 0,
            page_size = 10,
            page = undefined,
            limit = undefined,
            id = undefined
        } = params;

        // Convert page_index to page (0-based) if page is not provided
        const actualPage = page !== undefined ? page : page_index;
        const actualLimit = limit !== undefined ? limit : page_size;

        const requestParams = {
            page: actualPage,
            limit: actualLimit
        };

        // Add optional id parameter if provided
        if (id !== undefined) {
            requestParams.id = id;
        }

        const response = await apiClient.get(`/teams/${teamId}/work-shifts`, {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        // Return full team_work_shifts data including working_days
        // API response structure: { team_id, work_shift_id, working_days, work_shift, ... }
        const teamWorkShifts = response.data?.data || [];

        return {
            success: true,
            data: teamWorkShifts, // Return full team_work_shift objects with working_days
            pagination: response.data?.pagination || {
                total_items_count: teamWorkShifts.length,
                page_size: actualLimit,
                total_pages_count: 1,
                page_index: actualPage,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get slots of a team
 * Official API: GET /api/teams/{id}/slots
 * Parameters: id, day_of_week, start_time, end_time, is_recurring, specific_date, page, limit
 * Response: { data: [...], pagination: {...} }
 */
export const getTeamSlots = async (teamId, params = {}) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        const {
            page_index = 0,
            page_size = 10,
            page = undefined,
            limit = undefined,
            id = undefined,
            day_of_week = undefined,
            start_time = undefined,
            end_time = undefined,
            is_recurring = undefined,
            specific_date = undefined
        } = params;

        // Convert page_index to page (0-based) if page is not provided
        const actualPage = page !== undefined ? page : page_index;
        const actualLimit = limit !== undefined ? limit : page_size;

        const requestParams = {
            page: actualPage,
            limit: actualLimit
        };

        // Add optional filter parameters
        if (id !== undefined) {
            requestParams.id = id;
        }
        if (day_of_week !== undefined) {
            requestParams.day_of_week = day_of_week;
        }
        if (start_time !== undefined) {
            requestParams.start_time = start_time;
        }
        if (end_time !== undefined) {
            requestParams.end_time = end_time;
        }
        if (is_recurring !== undefined) {
            requestParams.is_recurring = is_recurring;
        }
        if (specific_date !== undefined) {
            requestParams.specific_date = specific_date;
        }

        const response = await apiClient.get(`/teams/${teamId}/slots`, {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                total_items_count: 0,
                page_size: actualLimit,
                total_pages_count: 0,
                page_index: actualPage,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get all slots (for all teams)
 * TODO: This function still uses mock data - needs to be updated to use official API
 * Should fetch slots from all teams using getTeamSlots for each team
 */
export const getAllTeamSlots = async () => {
    try {
        // Get all teams first
        const teamsResponse = await getTeams({ page_index: 0, page_size: 1000 });
        if (!teamsResponse.success || !teamsResponse.data) {
            return {
                success: true,
                data: [],
                pagination: {
                    total_items_count: 0,
                    page_size: 10,
                    total_pages_count: 0,
                    page_index: 0,
                    has_next: false,
                    has_previous: false
                }
            };
        }

        // Fetch slots for each team
        const allSlots = [];
        for (const team of teamsResponse.data) {
            try {
                const slotsResponse = await getTeamSlots(team.id, { page_index: 0, page_size: 1000 });
                if (slotsResponse.success && slotsResponse.data) {
                    allSlots.push(...slotsResponse.data);
                }
            } catch (error) {
                // Silently skip teams that fail
            }
        }

        return {
            success: true,
            data: allSlots,
            pagination: {
                total_items_count: allSlots.length,
                page_size: 10,
                total_pages_count: Math.ceil(allSlots.length / 10),
                page_index: 0,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        return {
            success: false,
            data: [],
            pagination: {
                total_items_count: 0,
                page_size: 10,
                total_pages_count: 0,
                page_index: 0,
                has_next: false,
                has_previous: false
            },
            message: error.message || 'Không thể tải danh sách slots'
        };
    }
};

/**
 * Create team
 * Official API: POST /api/teams
 * Request: { name, description, leader_id, work_type_ids: ["uuid", ...] }
 */
export const createTeam = async (teamData) => {
    try {
        // Validation
        if (!teamData.name?.trim()) {
            throw new Error('Tên nhóm là bắt buộc');
        }
        if (!teamData.description?.trim()) {
            throw new Error('Mô tả là bắt buộc');
        }
        if (!teamData.leader_id) {
            throw new Error('Trưởng nhóm là bắt buộc');
        }
        if (!teamData.work_type_ids || !Array.isArray(teamData.work_type_ids) || teamData.work_type_ids.length === 0) {
            throw new Error('Phải chọn ít nhất một loại công việc');
        }

        // Prepare request data according to API spec
        const requestData = {
            name: teamData.name.trim(),
            description: teamData.description.trim(),
            leader_id: teamData.leader_id,
            work_type_ids: teamData.work_type_ids
        };

        const response = await apiClient.post('/teams', requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Tạo nhóm thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Update team
 * Official API: PUT /api/teams/{id}
 * Request: { name, description, leader_id, work_type_ids[], is_active, status }
 */
export const updateTeam = async (id, teamData) => {
    try {
        if (!id) {
            throw new Error('ID nhóm là bắt buộc');
        }

        // Prepare request data according to API spec
        const requestData = {
            name: teamData.name?.trim() || '',
            description: teamData.description?.trim() || '',
            leader_id: teamData.leader_id || '',
            work_type_ids: Array.isArray(teamData.work_type_ids) ? teamData.work_type_ids : [],
            is_active: teamData.is_active !== undefined ? teamData.is_active : true,
            status: teamData.status || 'INACTIVE'
        };

        // Validate required fields
        if (!requestData.name) {
            throw new Error('Tên nhóm là bắt buộc');
        }
        if (!requestData.description) {
            throw new Error('Mô tả là bắt buộc');
        }
        if (!requestData.leader_id) {
            throw new Error('Trưởng nhóm là bắt buộc');
        }
        if (requestData.work_type_ids.length === 0) {
            throw new Error('Phải chọn ít nhất một loại công việc');
        }

        const response = await apiClient.put(`/teams/${id}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật nhóm thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Delete team
 * Official API: DELETE /api/teams/{id}
 */
export const deleteTeam = async (id) => {
    try {
        if (!id) {
            throw new Error('ID nhóm là bắt buộc');
        }

        await apiClient.delete(`/teams/${id}`, { timeout: 10000 });

        return {
            success: true,
            message: 'Xóa nhóm thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Get team members (returns array of team_member objects with employee data)
 * Official API: GET /api/teams/{id}/members
 * Response: Array of team_member objects with employee data
 */
export const getTeamMembers = async (teamId) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        const response = await apiClient.get(`/teams/${teamId}/members`, { timeout: 10000 });

        // API returns array of team_member objects directly
        return {
            success: true,
            data: Array.isArray(response.data) ? response.data : []
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Add members to team
 * Official API: POST /api/teams/{id}/members
 * Request: [{ employee_id }]
 */
export const addTeamMembers = async (teamId, members) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        if (!Array.isArray(members) || members.length === 0) {
            throw new Error('Phải chọn ít nhất một thành viên');
        }

        // Validate and prepare request data
        const requestData = members.map(member => {
            if (!member.employee_id) {
                throw new Error('employee_id là bắt buộc');
            }
            return {
                employee_id: member.employee_id
            };
        });

        const response = await apiClient.post(`/teams/${teamId}/members`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: Array.isArray(response.data) ? response.data : [],
            message: `Đã thêm ${requestData.length} thành viên vào nhóm`
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

/**
 * Update team members
 * Official API (assumed): PUT /api/teams/{id}/members
 * Request body: [{ employee_id, is_active }]
 */
export const updateTeamMembers = async (teamId, members) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }
        if (!Array.isArray(members) || members.length === 0) {
            throw new Error('Danh sách thành viên cập nhật không hợp lệ');
        }
        const payload = members.map(m => {
            if (!m.employee_id) throw new Error('employee_id là bắt buộc');
            return {
                employee_id: m.employee_id,
                is_active: m.is_active
            };
        });
        const response = await apiClient.put(`/teams/${teamId}/members`, payload, { timeout: 10000 });
        return {
            success: true,
            data: Array.isArray(response.data) ? response.data : [],
            message: 'Cập nhật thành viên thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }
        throw error;
    }
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (teamId, employeeId) => {
    try {
        if (!teamId || !employeeId) {
            throw new Error('ID nhóm và ID nhân viên là bắt buộc');
        }
        await apiClient.delete(`/teams/${teamId}/members/${employeeId}`, { timeout: 10000 });
        return {
            success: true,
            message: 'Xóa thành viên khỏi nhóm thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm hoặc thành viên');
        }
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }
        throw error;
    }
};

/**
 * Assign work shifts to team
 * Official API: POST /api/teams/{id}/work-shifts
 * Request: { work_shift_ids: ["uuid", ...] }
 */
export const assignTeamWorkShifts = async (teamId, data) => {
    try {
        if (!teamId) {
            throw new Error('ID nhóm là bắt buộc');
        }

        if (!data.work_shift_ids || !Array.isArray(data.work_shift_ids) || data.work_shift_ids.length === 0) {
            throw new Error('Phải chọn ít nhất một ca làm việc');
        }

        // Prepare request data according to API spec
        const requestData = {
            work_shift_ids: data.work_shift_ids
        };

        const response = await apiClient.post(`/teams/${teamId}/work-shifts`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data || [],
            message: `Đã phân công ${data.work_shift_ids.length} ca làm việc cho nhóm`
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhóm');
        }

        // Extract error message from response
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                const errorMsg = Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error;
                throw new Error(errorMsg);
            }
        }

        throw error;
    }
};

export default {
    getTeams,
    getTeamById,
    getTeamWorkTypes,
    getTeamMembers,
    getTeamWorkShifts,
    getTeamSlots,
    getAllTeamSlots,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    updateTeamMembers,
    removeTeamMember,
    assignTeamWorkShifts
};

// No mock exports. Use official APIs only.

