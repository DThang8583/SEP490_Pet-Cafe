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
 * Get all customers from official API
 * @param {Object} params - { page, limit }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllCustomers = async (params = {}) => {
    const {
        page = 0, // API uses 0-based page index
        limit = 10
    } = params;

    try {
        const requestParams = {
            page: page,
            limit: limit,
            _t: Date.now()
        };

        console.log(`[getAllCustomers] Request params:`, requestParams);

        const response = await apiClient.get('/customers', {
            params: requestParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        const responseData = response.data;
        console.log('[getAllCustomers] Response:', responseData);

        // Check if response has the expected structure: { data: [...], pagination: {...} }
        if (responseData?.data && Array.isArray(responseData.data)) {
            // Remove password_hash from account objects for security
            const sanitizedData = responseData.data.map(customer => {
                const sanitizedCustomer = { ...customer };
                if (sanitizedCustomer.account && sanitizedCustomer.account.password_hash) {
                    // Remove password_hash from account object
                    const { password_hash, ...accountWithoutPassword } = sanitizedCustomer.account;
                    sanitizedCustomer.account = accountWithoutPassword;
                }
                return sanitizedCustomer;
            });

            // Use pagination from API response if available, otherwise create one
            const apiPagination = responseData.pagination;
            if (apiPagination && typeof apiPagination === 'object') {
                return {
                    data: sanitizedData,
                    pagination: {
                        total_items_count: apiPagination.total_items_count ?? sanitizedData.length,
                        page_size: apiPagination.page_size ?? limit,
                        total_pages_count: apiPagination.total_pages_count ?? Math.ceil((apiPagination.total_items_count ?? sanitizedData.length) / limit),
                        page_index: apiPagination.page_index ?? page,
                        has_next: apiPagination.has_next ?? false,
                        has_previous: apiPagination.has_previous ?? (page > 0)
                    }
                };
            }

            // Fallback: create pagination from data length
            return {
                data: sanitizedData,
                pagination: createPagination(
                    sanitizedData.length,
                    limit,
                    page
                )
            };
        }

        // Fallback: if response is directly an array
        if (Array.isArray(responseData)) {
            const sanitizedData = responseData.map(customer => {
                const sanitizedCustomer = { ...customer };
                if (sanitizedCustomer.account && sanitizedCustomer.account.password_hash) {
                    const { password_hash, ...accountWithoutPassword } = sanitizedCustomer.account;
                    sanitizedCustomer.account = accountWithoutPassword;
                }
                return sanitizedCustomer;
            });

            return {
                data: sanitizedData,
                pagination: createPagination(sanitizedData.length, limit, page)
            };
        }

        // No data found
        return {
            data: [],
            pagination: createPagination(0, limit, page)
        };
    } catch (error) {
        console.error('Failed to fetch customers from API:', error);
        throw error;
    }
};

/**
 * Get customer by ID from official API
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Customer object
 */
export const getCustomerById = async (customerId) => {
    try {
        const response = await apiClient.get(`/customers/${customerId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy khách hàng');
        }

        // Remove password_hash from account object for security
        const customer = { ...response.data };
        if (customer.account && customer.account.password_hash) {
            const { password_hash, ...accountWithoutPassword } = customer.account;
            customer.account = accountWithoutPassword;
        }

        return customer;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy khách hàng');
        }
        console.error('Failed to fetch customer from API:', error);
        throw error;
    }
};

export default {
    getAllCustomers,
    getCustomerById
};

