import apiClient from '../config/config';

export const TASK_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
};

export const TASK_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
};

const buildPagination = (pagination, totalItems, pageSize, pageIndex) => {
    if (pagination) {
        const computedTotalPages = Math.ceil(
            (pagination.total_items_count ?? totalItems) /
            (pagination.page_size ?? pageSize)
        );

        return {
            total_items_count: pagination.total_items_count ?? totalItems,
            page_size: pagination.page_size ?? pageSize,
            total_pages_count: (pagination.total_pages_count ?? computedTotalPages) || 0,
            page_index: pagination.page_index ?? pageIndex,
            has_next: pagination.has_next ?? ((pagination.page_index ?? pageIndex) + 1 < ((pagination.total_pages_count ?? 0))),
            has_previous: pagination.has_previous ?? ((pagination.page_index ?? pageIndex) > 0)
        };
    }

    return {
        total_items_count: totalItems,
        page_size: pageSize,
        total_pages_count: Math.ceil(totalItems / pageSize) || 0,
        page_index: pageIndex,
        has_next: (pageIndex + 1) * pageSize < totalItems,
        has_previous: pageIndex > 0
    };
};

const normalizeTask = (task) => {
    if (!task) return null;
    return {
        ...task,
        image_url: task.image_url || null,
        service: task.service || null,
        work_type: task.work_type || null,
        estimated_hours: typeof task.estimated_hours === 'number'
            ? task.estimated_hours
            : Number(task.estimated_hours) || 0
    };
};

const normalizeEstimatedHours = (value) => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const extractErrorMessage = (error, defaultMessage) => {
    if (error.response?.data) {
        const { message, error: errorMsg, errors } = error.response.data;
        if (Array.isArray(message)) {
            return message.join('. ');
        }
        if (typeof message === 'string') {
            return message;
        }
        if (Array.isArray(errorMsg)) {
            return errorMsg.join('. ');
        }
        if (typeof errorMsg === 'string') {
            return errorMsg;
        }
        if (errors && typeof errors === 'object') {
            const combined = Object.values(errors).flat().join('. ');
            if (combined) return combined;
        }
    }
    return error.message || defaultMessage;
};

export const getTasks = async (params = {}) => {
    try {
        const {
            page_index = 0,
            page_size = 10,
            work_type_id,
            status,
            priority,
            is_public,
            search
        } = params;

        const queryParams = {
            page_index,
            page_size,
            _t: Date.now()
        };

        if (work_type_id) queryParams.work_type_id = work_type_id;
        if (status) queryParams.status = status;
        if (priority) queryParams.priority = priority;
        if (is_public !== undefined && is_public !== 'all') queryParams.is_public = is_public;
        if (search) queryParams.search = search;

        const response = await apiClient.get('/tasks', {
            params: queryParams,
            timeout: 10000,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        let tasks = [];
        let pagination = null;

        if (Array.isArray(response.data)) {
            tasks = response.data;
        } else if (response.data?.data) {
            tasks = response.data.data;
            pagination = response.data.pagination || null;
        } else if (response.data) {
            tasks = [response.data];
        }

        const normalizedTasks = tasks.map(normalizeTask);
        const finalPagination = buildPagination(
            pagination,
            normalizedTasks.length,
            page_size,
            page_index
        );

        return {
            success: true,
            data: normalizedTasks,
            pagination: finalPagination
        };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Không thể tải danh sách nhiệm vụ'));
    }
};

export const getTaskById = async (taskId) => {
    if (!taskId) {
        throw new Error('ID nhiệm vụ là bắt buộc');
    }

    try {
        const response = await apiClient.get(`/tasks/${taskId}`, {
            params: { _t: Date.now() },
            timeout: 10000
        });

        return {
            success: true,
            data: normalizeTask(response.data)
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhiệm vụ');
        }
        throw new Error(extractErrorMessage(error, 'Không thể tải thông tin nhiệm vụ'));
    }
};

export const createTask = async (taskData) => {
    try {
        const payload = {
            title: taskData.title?.trim(),
            description: taskData.description?.trim(),
            priority: taskData.priority || TASK_PRIORITY.MEDIUM,
            status: taskData.status || TASK_STATUS.ACTIVE,
            estimated_hours: normalizeEstimatedHours(taskData.estimated_hours),
            is_public: taskData.is_public ?? false,
            work_type_id: taskData.work_type_id,
            service_id: taskData.service_id || null,
            image_url: taskData.image_url || null
        };

        if (!payload.title) {
            throw new Error('Tên nhiệm vụ là bắt buộc');
        }

        if (!payload.description) {
            throw new Error('Mô tả nhiệm vụ là bắt buộc');
        }

        if (!payload.work_type_id) {
            throw new Error('Loại công việc là bắt buộc');
        }

        const response = await apiClient.post('/tasks', payload, {
            timeout: 10000
        });

        return {
            success: true,
            data: normalizeTask(response.data),
            message: 'Tạo nhiệm vụ thành công'
        };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Không thể tạo nhiệm vụ'));
    }
};

export const updateTask = async (taskId, updates) => {
    if (!taskId) {
        throw new Error('ID nhiệm vụ là bắt buộc');
    }

    try {
        const payload = {};

        if (updates.title !== undefined) {
            const trimmed = updates.title?.trim();
            if (!trimmed) {
                throw new Error('Tên nhiệm vụ không được để trống');
            }
            payload.title = trimmed;
        }

        if (updates.description !== undefined) {
            const trimmed = updates.description?.trim();
            if (!trimmed) {
                throw new Error('Mô tả nhiệm vụ không được để trống');
            }
            payload.description = trimmed;
        }

        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.estimated_hours !== undefined) payload.estimated_hours = normalizeEstimatedHours(updates.estimated_hours);
        if (updates.is_public !== undefined) payload.is_public = updates.is_public;
        if (updates.work_type_id !== undefined) payload.work_type_id = updates.work_type_id;
        if (updates.service_id !== undefined) payload.service_id = updates.service_id || null;
        if (updates.image_url !== undefined) payload.image_url = updates.image_url || null;

        const response = await apiClient.put(`/tasks/${taskId}`, payload, {
            timeout: 10000
        });

        return {
            success: true,
            data: normalizeTask(response.data),
            message: 'Cập nhật nhiệm vụ thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhiệm vụ');
        }
        throw new Error(extractErrorMessage(error, 'Không thể cập nhật nhiệm vụ'));
    }
};

export const deleteTask = async (taskId) => {
    if (!taskId) {
        throw new Error('ID nhiệm vụ là bắt buộc');
    }

    try {
        await apiClient.delete(`/tasks/${taskId}`, {
            timeout: 10000
        });

        return {
            success: true,
            message: 'Xóa nhiệm vụ thành công'
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhiệm vụ');
        }
        throw new Error(extractErrorMessage(error, 'Không thể xóa nhiệm vụ'));
    }
};

export const getTaskSlots = async (taskId, params = {}) => {
    if (!taskId) {
        throw new Error('ID nhiệm vụ là bắt buộc');
    }

    try {
        const {
            page_index = 0,
            page_size = 10
        } = params;

        const response = await apiClient.get(`/tasks/${taskId}/slots`, {
            params: {
                page_index,
                page_size,
                _t: Date.now()
            },
            timeout: 10000,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        let slots = [];
        let pagination = null;

        if (Array.isArray(response.data)) {
            slots = response.data;
        } else if (response.data?.data) {
            slots = response.data.data;
            pagination = response.data.pagination || null;
        } else if (response.data) {
            slots = [response.data];
        }

        const finalPagination = buildPagination(
            pagination,
            slots.length,
            page_size,
            page_index
        );

        return {
            success: true,
            data: slots,
            pagination: finalPagination
        };
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy nhiệm vụ');
        }
        throw new Error(extractErrorMessage(error, 'Không thể tải danh sách ca của nhiệm vụ'));
    }
};

export default {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTaskSlots
};
