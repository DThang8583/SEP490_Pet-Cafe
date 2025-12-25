import apiClient from '../config/config';

/**
 * Get transactions
 * @param {Object} params - { OrderCode, PaymentMethod, Status, StartDate, EndDate, page, limit }
 * @returns {Promise<Object>} Transactions data with pagination
 */
export const getTransactions = async (params = {}) => {
    try {
        const {
            OrderCode,
            PaymentMethod,
            Status,
            StartDate,
            EndDate,
            page = 1,
            limit = 10
        } = params;

        const queryParams = {};

        if (OrderCode !== undefined && OrderCode !== null) {
            queryParams.OrderCode = OrderCode;
        }
        if (PaymentMethod) {
            queryParams.PaymentMethod = PaymentMethod;
        }
        if (Status) {
            queryParams.Status = Status;
        }
        if (StartDate) {
            queryParams.StartDate = StartDate;
        }
        if (EndDate) {
            queryParams.EndDate = EndDate;
        }
        // Backend expects 0-based page index while frontend uses 1-based pages.
        // Normalize here so callers can continue using 1-based page numbers.
        const normalizedPage = (() => {
            const asNumber = Number(page);
            if (Number.isNaN(asNumber)) return 0;
            return Math.max(0, Math.floor(asNumber) - 1);
        })();
        queryParams.page = normalizedPage;
        queryParams.limit = limit;

        const response = await apiClient.get('/transactions', {
            params: queryParams,
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
        });

        console.log('[getTransactions] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        throw error;
    }
};

export default {
    getTransactions
};
