import apiClient from '../config/config';

/**
 * Create pagination object
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Page size
 * @param {number} pageIndex - Page index
 * @returns {Object} Pagination object
 */
const createPagination = (totalItems, pageSize, pageIndex) => ({
    total_items_count: totalItems,
    page_size: pageSize,
    total_pages_count: Math.ceil(totalItems / pageSize) || 0,
    page_index: pageIndex,
    has_next: (pageIndex + 1) * pageSize < totalItems,
    has_previous: pageIndex > 0
});

/**
 * Get all daily schedules from official API
 * @param {Object} params - { page_index, page_size, TeamId, FromDate, ToDate, Status }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getDailySchedules = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        TeamId = null,
        FromDate = null,
        ToDate = null,
        Status = null
    } = params;

    try {
        // Validate TeamId is required
        if (!TeamId) {
            throw new Error('TeamId is required to fetch daily schedules');
        }

        // API uses 'page' (0-based) and 'limit' according to Swagger documentation
        const queryParams = {
            page: page_index, // API uses 'page' (0-based), not 'page_index'
            limit: page_size, // API uses 'limit' instead of 'page_size'
            _t: Date.now() // Cache busting
        };

        if (FromDate) {
            queryParams.FromDate = FromDate;
        }
        if (ToDate) {
            queryParams.ToDate = ToDate;
        }
        if (Status) {
            queryParams.Status = Status;
        }

        const apiUrl = `/teams/${TeamId}/daily-schedules`;
        console.log('[dailyScheduleApi] URL:', apiUrl);
        console.log('[dailyScheduleApi] Params:', queryParams);
        console.log('[dailyScheduleApi] Full URL:', apiUrl + '?' + new URLSearchParams(queryParams).toString());

        // API endpoint: /teams/{teamId}/daily-schedules
        const response = await apiClient.get(apiUrl, {
            params: queryParams,
            timeout: 10000,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        console.log('[dailyScheduleApi] Status:', response.status, 'Data length:', response.data?.data?.length);

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                success: true,
                data: responseData.data,
                pagination: responseData.pagination || createPagination(
                    responseData.data.length,
                    page_size,
                    page_index
                )
            };
        }

        if (Array.isArray(responseData)) {
            return {
                success: true,
                data: responseData,
                pagination: createPagination(responseData.length, page_size, page_index)
            };
        }

        return {
            success: true,
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    } catch (error) {
        console.error('Failed to fetch daily schedules from API:', error);
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Không thể tải danh sách điểm danh';
        throw new Error(errorMessage);
    }
};

const dailyScheduleApi = {
    getDailySchedules
};

export default dailyScheduleApi;

