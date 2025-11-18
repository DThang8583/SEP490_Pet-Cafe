// API for Daily Tasks Management
// Quản lý tiến độ hoàn thành nhiệm vụ theo ngày

import apiClient from '../config/config';

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

/**
 * Get all daily tasks from official API
 * @param {Object} params - { page_index, page_size, TeamId, FromDate, ToDate, Status }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getDailyTasksFromAPI = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        TeamId = null,
        FromDate = null,
        ToDate = null,
        Status = null
    } = params;

    try {
        // API uses 'page' (0-based) and 'limit' according to Swagger documentation
        const queryParams = {
            page: page_index, // API uses 'page' (0-based), not 'page_index'
            limit: page_size, // API uses 'limit' instead of 'page_size'
            _t: Date.now() // Cache busting
        };

        if (TeamId) {
            queryParams.TeamId = TeamId;
        }
        if (FromDate) {
            queryParams.FromDate = FromDate;
        }
        if (ToDate) {
            queryParams.ToDate = ToDate;
        }
        if (Status) {
            queryParams.Status = Status;
        }

        // Add timestamp to prevent caching
        console.log('📡 Calling daily-tasks API with params:', queryParams);

        const response = await apiClient.get('/daily-tasks', {
            params: queryParams,
            timeout: 10000,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        console.log('📥 Daily-tasks API response:', {
            status: response.status,
            dataLength: response.data?.data?.length,
            hasData: !!response.data?.data,
            pagination: response.data?.pagination,
            fullResponse: response.data
        });

        const responseData = response.data;

        // Handle response with data array
        if (responseData?.data && Array.isArray(responseData.data)) {
            console.log('✅ Found data array in response.data.data, length:', responseData.data.length);
            return {
                success: true,
                data: responseData.data,
                pagination: responseData.pagination || {
                    total_items_count: responseData.data.length,
                    page_size: page_size,
                    total_pages_count: Math.ceil((responseData.pagination?.total_items_count || responseData.data.length) / page_size) || 0,
                    page_index: page_index,
                    has_next: responseData.pagination?.has_next || false,
                    has_previous: responseData.pagination?.has_previous || false
                }
            };
        }

        // Handle direct array response
        if (Array.isArray(responseData)) {
            console.log('✅ Found direct array response, length:', responseData.length);
            return {
                success: true,
                data: responseData,
                pagination: {
                    total_items_count: responseData.length,
                    page_size: page_size,
                    total_pages_count: Math.ceil(responseData.length / page_size) || 0,
                    page_index: page_index,
                    has_next: false,
                    has_previous: false
                }
            };
        }

        // No data found
        console.warn('⚠️ No data found in response. Response structure:', {
            hasData: !!responseData?.data,
            isArray: Array.isArray(responseData),
            responseData: responseData
        });

        return {
            success: true,
            data: [],
            pagination: responseData?.pagination || {
                total_items_count: 0,
                page_size: page_size,
                total_pages_count: 0,
                page_index: page_index,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        console.error('Failed to fetch daily tasks from API:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể tải danh sách nhiệm vụ hằng ngày';
        throw new Error(errorMessage);
    }
};

/**
 * Create a daily task (POST)
 * @param {Object} taskData - { team_id, task_id, slot_id, status, assigned_date, start_time, end_time, title, priority, description, notes }
 * @returns {Promise<Object>} { success, data, message }
 */
export const createDailyTask = async (taskData) => {
    try {
        const response = await apiClient.post('/daily-tasks', taskData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data,
            message: 'Tạo nhiệm vụ hằng ngày thành công'
        };
    } catch (error) {
        console.error('Failed to create daily task:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể tạo nhiệm vụ hằng ngày';
        throw new Error(errorMessage);
    }
};

/**
 * Update a daily task (PUT)
 * @param {string} dailyTaskId - Daily task ID
 * @param {Object} updateData - { team_id, task_id, slot_id, status, assigned_date, start_time, end_time, title, priority, description, notes }
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateDailyTask = async (dailyTaskId, updateData) => {
    try {
        const response = await apiClient.put(`/daily-tasks/${dailyTaskId}`, updateData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return {
                success: true,
            data: response.data,
            message: 'Cập nhật nhiệm vụ hằng ngày thành công'
        };
    } catch (error) {
        console.error('Failed to update daily task:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể cập nhật nhiệm vụ hằng ngày';
        throw new Error(errorMessage);
    }
};

/**
 * Update daily task status (PUT with status only)
 * @param {string} dailyTaskId - Daily task ID
 * @param {Object} updateData - { status, notes, updated_by }
 * @returns {Promise<Object>} { success, data, message }
 */
export const updateDailyTaskStatus = async (dailyTaskId, updateData) => {
    try {
        // First, get the current daily task to preserve other fields
        const currentTaskResponse = await getDailyTasksFromAPI({
            page_index: 0,
            page_size: 1000
        });

        const currentTask = currentTaskResponse.data.find(dt => dt.id === dailyTaskId);

        if (!currentTask) {
            throw new Error('Không tìm thấy daily task');
        }

        // Prepare update data with all required fields
        const fullUpdateData = {
            team_id: currentTask.team_id,
            task_id: currentTask.task_id,
            slot_id: currentTask.slot_id,
            status: updateData.status || currentTask.status,
            assigned_date: currentTask.assigned_date,
            start_time: currentTask.start_time,
            end_time: currentTask.end_time,
            title: currentTask.title,
            priority: currentTask.priority,
            description: currentTask.description,
            notes: updateData.notes !== undefined ? updateData.notes : currentTask.notes
        };

        // If status is COMPLETED, set completion_date
        if (updateData.status === DAILY_TASK_STATUS.COMPLETED && !currentTask.completion_date) {
            // Note: API might handle this automatically, but we include it if needed
        }

        return await updateDailyTask(dailyTaskId, fullUpdateData);
    } catch (error) {
        console.error('Failed to update daily task status:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể cập nhật trạng thái nhiệm vụ';
        throw new Error(errorMessage);
    }
};

/**
 * Delete a daily task (DELETE)
 * @param {string} dailyTaskId - Daily task ID
 * @returns {Promise<Object>} { success, message }
 */
export const deleteDailyTask = async (dailyTaskId) => {
    try {
        await apiClient.delete(`/daily-tasks/${dailyTaskId}`, {
            timeout: 10000
        });

        return {
                success: true,
            message: 'Xóa nhiệm vụ hằng ngày thành công'
        };
    } catch (error) {
        console.error('Failed to delete daily task:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể xóa nhiệm vụ hằng ngày';
        throw new Error(errorMessage);
    }
};

/**
 * Get statistics for a date range (calculated from API data)
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {string} teamId - Optional team ID filter
 * @param {string} status - Optional status filter
 * @returns {Promise<Object>} { success, data }
 */
export const getDailyTasksStatistics = async (startDate, endDate, teamId = null, status = null) => {
    try {
        // Format dates for API (YYYY-MM-DD)
        const formatDateForAPI = (date) => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const fromDate = formatDateForAPI(startDate);
        const toDate = formatDateForAPI(endDate);

        // Get all tasks in range
        const response = await getDailyTasksFromAPI({
            page_index: 0,
            page_size: 1000,
            FromDate: fromDate,
            ToDate: toDate,
            TeamId: teamId,
            Status: status
        });

        const tasksInRange = response.data || [];

            const total = tasksInRange.length;
            const scheduled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SCHEDULED).length;
            const in_progress = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.IN_PROGRESS).length;
            const completed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.COMPLETED).length;
            const cancelled = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.CANCELLED).length;
            const missed = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.MISSED).length;
            const skipped = tasksInRange.filter(dt => dt.status === DAILY_TASK_STATUS.SKIPPED).length;

            const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
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
        };
    } catch (error) {
        console.error('Failed to get daily tasks statistics:', error);
        throw error;
    }
};

// Legacy function names for backward compatibility (redirect to API functions)
export const getAllDailyTasks = getDailyTasksFromAPI;

export const getDailyTasksForDateRange = async (startDate, endDate, taskTemplates = [], slots = [], teamId = null, status = null) => {
    // Format dates for API (YYYY-MM-DD)
    const formatDateForAPI = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fromDate = formatDateForAPI(startDate);
    const toDate = formatDateForAPI(endDate);

    return await getDailyTasksFromAPI({
        page_index: 0,
        page_size: 1000,
        FromDate: fromDate,
        ToDate: toDate,
        TeamId: teamId,
        Status: status
    });
};

export const getDailyTasksForCurrentWeek = async (taskTemplates = [], slots = []) => {
    const today = new Date();
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return getDailyTasksForDateRange(weekStart, weekEnd, taskTemplates, slots);
};

export const createManualDailyTask = createDailyTask;

export default {
    getDailyTasksFromAPI,
    getAllDailyTasks,
    getDailyTasksForDateRange,
    getDailyTasksForCurrentWeek,
    createDailyTask,
    createManualDailyTask,
    updateDailyTask,
    updateDailyTaskStatus,
    deleteDailyTask,
    getDailyTasksStatistics,
    DAILY_TASK_STATUS,
    TASK_PRIORITY,
    DAY_OF_WEEK_MAP
};
