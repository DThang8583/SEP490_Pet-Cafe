import apiClient from '../config/config';

/**
 * Get revenue statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Revenue statistics
 */
export const getRevenueStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getRevenueStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/revenue', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getRevenueStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch revenue statistics:', error);
        throw error;
    }
};

/**
 * Get orders statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Orders statistics
 */
export const getOrdersStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getOrdersStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/orders', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getOrdersStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch orders statistics:', error);
        throw error;
    }
};

/**
 * Get products statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Products statistics
 */
export const getProductsStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getProductsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/products', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getProductsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch products statistics:', error);
        throw error;
    }
};

/**
 * Get services statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Services statistics
 */
export const getServicesStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getServicesStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/services', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getServicesStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch services statistics:', error);
        throw error;
    }
};

/**
 * Get slots statistics
 * @param {Object} params - { start_date, end_date }
 * @returns {Promise<Object>} Slots statistics
 */
export const getSlotsStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getSlotsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/slots', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getSlotsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch slots statistics:', error);
        throw error;
    }
};

/**
 * Get feedbacks statistics
 * @returns {Promise<Object>} Feedbacks statistics
 */
export const getFeedbacksStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getFeedbacksStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/feedbacks', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getFeedbacksStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch feedbacks statistics:', error);
        throw error;
    }
};

/**
 * Get pets statistics
 * @returns {Promise<Object>} Pets statistics
 */
export const getPetsStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getPetsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/pets', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getPetsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch pets statistics:', error);
        throw error;
    }
};

/**
 * Get pets health statistics
 * @returns {Promise<Object>} Pets health statistics
 */
export const getPetsHealthStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getPetsHealthStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/pets/health', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getPetsHealthStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch pets health statistics:', error);
        throw error;
    }
};

/**
 * Get pet groups statistics
 * @returns {Promise<Object>} Pet groups statistics
 */
export const getPetGroupsStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getPetGroupsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/pets/groups', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getPetGroupsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch pet groups statistics:', error);
        throw error;
    }
};

/**
 * Get employees statistics
 * @returns {Promise<Object>} Employees statistics
 */
export const getEmployeesStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getEmployeesStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/employees', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getEmployeesStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch employees statistics:', error);
        throw error;
    }
};

/**
 * Get teams statistics
 * @returns {Promise<Object>} Teams statistics
 */
export const getTeamsStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getTeamsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/teams', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getTeamsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch teams statistics:', error);
        throw error;
    }
};

/**
 * Get employees performance statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Employees performance statistics
 */
export const getEmployeesPerformanceStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getEmployeesPerformanceStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/employees/performance', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getEmployeesPerformanceStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch employees performance statistics:', error);
        throw error;
    }
};

/**
 * Get tasks statistics
 * @returns {Promise<Object>} Tasks statistics
 */
export const getTasksStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getTasksStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/tasks', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getTasksStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch tasks statistics:', error);
        throw error;
    }
};

/**
 * Get daily tasks statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Daily tasks statistics
 */
export const getDailyTasksStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getDailyTasksStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/tasks/daily', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getDailyTasksStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch daily tasks statistics:', error);
        throw error;
    }
};

/**
 * Get work shifts statistics
 * @returns {Promise<Object>} Work shifts statistics
 */
export const getWorkShiftsStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getWorkShiftsStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/work-shifts', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getWorkShiftsStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch work shifts statistics:', error);
        throw error;
    }
};

/**
 * Get customers statistics
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise<Object>} Customers statistics
 */
export const getCustomersStatistics = async (params = {}) => {
    try {
        const requestParams = {
            ...params,
            _t: Date.now()
        };

        console.log('[getCustomersStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/customers', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getCustomersStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch customers statistics:', error);
        throw error;
    }
};

/**
 * Get inventory statistics
 * @returns {Promise<Object>} Inventory statistics
 */
export const getInventoryStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getInventoryStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/inventory', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getInventoryStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch inventory statistics:', error);
        throw error;
    }
};

/**
 * Get dashboard overview statistics
 * @returns {Promise<Object>} Dashboard overview statistics
 */
export const getDashboardOverviewStatistics = async () => {
    try {
        const requestParams = {
            _t: Date.now()
        };

        console.log('[getDashboardOverviewStatistics] Request params:', requestParams);

        const response = await apiClient.get('/statistics/dashboard/overview', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getDashboardOverviewStatistics] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch dashboard overview statistics:', error);
        throw error;
    }
};

export default {
    getRevenueStatistics,
    getOrdersStatistics,
    getProductsStatistics,
    getServicesStatistics,
    getSlotsStatistics,
    getFeedbacksStatistics,
    getPetsStatistics,
    getPetsHealthStatistics,
    getPetGroupsStatistics,
    getEmployeesStatistics,
    getTeamsStatistics,
    getEmployeesPerformanceStatistics,
    getTasksStatistics,
    getDailyTasksStatistics,
    getWorkShiftsStatistics,
    getCustomersStatistics,
    getInventoryStatistics,
    getDashboardOverviewStatistics
};

