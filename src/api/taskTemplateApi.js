import apiClient from '../config/config';
import workTypeApi from './workTypeApi';

let TASK_CACHE = [];

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

export const TASK_TYPES = [
    { key: 'cleaning', name: 'Dọn dẹp', icon: '🧹', color: '#4CAF50' },
    { key: 'feeding', name: 'Cho pet ăn', icon: '🍖', color: '#FF9800' },
    { key: 'cashier', name: 'Thu ngân', icon: '💰', color: '#2196F3' },
    { key: 'service', name: 'Làm service', icon: '✨', color: '#9C27B0' },
];

const buildPagination = (pagination, totalItems, pageSize, pageIndex) => {
    if (pagination) {
        return {
            total_items_count: pagination.total_items_count ?? totalItems,
            page_size: pagination.page_size ?? pageSize,
            total_pages_count: pagination.total_pages_count ?? (Math.ceil((pagination.total_items_count ?? totalItems) / (pagination.page_size ?? pageSize)) || 0),
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

const taskTemplateApi = {
    async getAllTaskTemplates(filters = {}) {
        try {
            const {
                page_index = 0,
                page_size = 100,
                work_type_id,
                status,
                priority,
                is_public,
                search
            } = filters;

            const params = {
                page_index,
                page_size,
                _t: Date.now()
            };

            if (work_type_id) {
                params.work_type_id = work_type_id;
            }
            if (status) {
                params.status = status;
            }
            if (priority) {
                params.priority = priority;
            }
            if (is_public !== undefined && is_public !== 'all') {
                params.is_public = is_public;
            }
            if (search) {
                params.search = search;
            }

            const response = await apiClient.get('/tasks', {
                params,
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

            TASK_CACHE.splice(0, TASK_CACHE.length, ...normalizedTasks);

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
    },

    async getTaskTemplateById(templateId) {
        if (!templateId) {
            throw new Error('ID nhiệm vụ là bắt buộc');
        }

        try {
            const response = await apiClient.get(`/tasks/${templateId}`, {
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
    },

    async createTaskTemplate(templateData) {
        try {
            const payload = {
                title: templateData.title?.trim(),
                description: templateData.description?.trim(),
                priority: templateData.priority || TASK_PRIORITY.MEDIUM,
                status: templateData.status || TASK_STATUS.ACTIVE,
                estimated_hours: normalizeEstimatedHours(templateData.estimated_hours),
                is_public: templateData.is_public ?? false,
                work_type_id: templateData.work_type_id,
                service_id: templateData.service_id || null,
                image_url: templateData.image_url || null
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

            const createdTask = normalizeTask(response.data);
            TASK_CACHE.push(createdTask);

            return {
                success: true,
                data: createdTask,
                message: 'Tạo nhiệm vụ thành công'
            };
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tạo nhiệm vụ'));
        }
    },

    async updateTaskTemplate(templateId, updates) {
        if (!templateId) {
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

            if (updates.priority !== undefined) {
                payload.priority = updates.priority;
            }

            if (updates.status !== undefined) {
                payload.status = updates.status;
            }

            if (updates.estimated_hours !== undefined) {
                payload.estimated_hours = normalizeEstimatedHours(updates.estimated_hours);
            }

            if (updates.is_public !== undefined) {
                payload.is_public = updates.is_public;
            }

            if (updates.work_type_id !== undefined) {
                payload.work_type_id = updates.work_type_id;
            }

            if (updates.service_id !== undefined) {
                payload.service_id = updates.service_id || null;
            }

            if (updates.image_url !== undefined) {
                payload.image_url = updates.image_url || null;
            }

            const response = await apiClient.put(`/tasks/${templateId}`, payload, {
                timeout: 10000
            });

            const updatedTask = normalizeTask(response.data);
            const cacheIndex = TASK_CACHE.findIndex(task => task.id === updatedTask?.id);
            if (cacheIndex !== -1) {
                TASK_CACHE[cacheIndex] = updatedTask;
            }

            return {
                success: true,
                data: updatedTask,
                message: 'Cập nhật nhiệm vụ thành công'
            };
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Không tìm thấy nhiệm vụ');
            }
            throw new Error(extractErrorMessage(error, 'Không thể cập nhật nhiệm vụ'));
        }
    },

    async deleteTaskTemplate(templateId) {
        if (!templateId) {
            throw new Error('ID nhiệm vụ là bắt buộc');
        }

        try {
            await apiClient.delete(`/tasks/${templateId}`, {
                timeout: 10000
            });

            const cacheIndex = TASK_CACHE.findIndex(task => task.id === templateId);
            if (cacheIndex !== -1) {
                TASK_CACHE.splice(cacheIndex, 1);
            }

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
    },

    async getStatistics() {
        try {
            const response = await this.getAllTaskTemplates({
                page_index: 0,
                page_size: 1000
            });

            const tasks = response.data || [];

            const stats = {
                total: tasks.length,
                by_priority: {
                    [TASK_PRIORITY.URGENT]: tasks.filter(t => t.priority === TASK_PRIORITY.URGENT).length,
                    [TASK_PRIORITY.HIGH]: tasks.filter(t => t.priority === TASK_PRIORITY.HIGH).length,
                    [TASK_PRIORITY.MEDIUM]: tasks.filter(t => t.priority === TASK_PRIORITY.MEDIUM).length,
                    [TASK_PRIORITY.LOW]: tasks.filter(t => t.priority === TASK_PRIORITY.LOW).length
                },
                by_status: {
                    [TASK_STATUS.ACTIVE]: tasks.filter(t => t.status === TASK_STATUS.ACTIVE).length,
                    [TASK_STATUS.INACTIVE]: tasks.filter(t => t.status === TASK_STATUS.INACTIVE).length
                },
                public_tasks: tasks.filter(t => t.is_public).length
            };

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tải thống kê nhiệm vụ'));
        }
    },

    async getWorkTypes() {
        try {
            const response = await workTypeApi.getWorkTypes();
            return response;
        } catch (error) {
            throw new Error(extractErrorMessage(error, 'Không thể tải danh sách loại công việc'));
        }
    }
};

export const MOCK_TASK_TEMPLATES = TASK_CACHE;

export default taskTemplateApi;
