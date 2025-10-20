import axios from 'axios';

// Resolve API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.__API_BASE_URL__ || '/api';

// Hardcoded demo data matching the official API schema
const DEMO_WORK_TYPES = [
    {
        "name": "Tắm rửa thú cưng",
        "description": "Dịch vụ tắm rửa bằng dầu gội chuyên dụng, sấy khô và chải lông cho chó mèo.",
        "is_active": true,
        "services": [],
        "areas": [],
        "teams": [],
        "id": "b98f869b-5181-4353-9b6b-085c0db0c336",
        "created_at": "2025-10-18T14:11:00.190903+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-18T14:11:00.190904+00:00",
        "updated_by": null,
        "is_deleted": false
    },
    {
        "name": "Khám sức khỏe định kỳ",
        "description": "Kiểm tra tổng quát sức khỏe, cân nặng, da, răng miệng và tiêm phòng cho thú cưng.",
        "is_active": true,
        "services": [],
        "areas": [],
        "teams": [],
        "id": "16c769c7-44e5-4a47-a7b1-2f727799eb1c",
        "created_at": "2025-10-18T14:11:36.096716+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-18T14:11:36.096717+00:00",
        "updated_by": null,
        "is_deleted": false
    },
    {
        "name": "Nhân viên tại quầy",
        "description": "Phụ trách tiếp đón khách hàng, tư vấn dịch vụ, xử lý thanh toán và hỗ trợ đặt lịch cho thú cưng tại quầy.",
        "is_active": true,
        "services": [],
        "areas": [],
        "teams": [],
        "id": "5d824daf-06fd-4498-9885-12cd18e4fb2f",
        "created_at": "2025-10-18T14:13:57.938457+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-18T14:13:57.938457+00:00",
        "updated_by": null,
        "is_deleted": false
    },
    {
        "name": "Dịch Vụ Chăm Sóc Mèo",
        "description": "Dành cho các dịch vụ đặc biệt như cắt móng, chải lông hoặc tắm khô cho mèo (nếu quán có cung cấp).",
        "is_active": true,
        "services": [],
        "areas": [],
        "teams": [],
        "id": "73fbb178-773c-4cdd-a921-3e92dd1bbb00",
        "created_at": "2025-10-19T06:30:42.769541+00:00",
        "created_by": "00000000-0000-0000-0000-000000000000",
        "updated_at": "2025-10-19T06:30:42.769541+00:00",
        "updated_by": null,
        "is_deleted": false
    }
];

/**
 * Get all work types
 * @param {Object} filters - Optional filters
 * @param {boolean} filters.is_active - Filter by active status
 * @param {number} filters.page_index - Page index (0-based)
 * @param {number} filters.page_size - Page size
 * @returns {Promise<Object>} { success: boolean, data: Array, pagination: Object }
 */
const getAllWorkTypes = async (filters = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Always return hardcoded data
    const filteredData = DEMO_WORK_TYPES.filter(wt =>
        filters.is_active === undefined || wt.is_active === filters.is_active
    );

    return {
        success: true,
        data: filteredData,
        pagination: {
            total_items_count: filteredData.length,
            page_size: filters.page_size || 10,
            total_pages_count: 1,
            page_index: filters.page_index || 0,
            has_next: false,
            has_previous: false
        }
    };

    /* Original API call - commented out for now
    try {
        const response = await axios.get(`${API_BASE_URL}/work-types`, {
            params: {
                IsActive: filters.is_active,
                PageIndex: filters.page_index || 0,
                PageSize: filters.page_size || 100
            },
            timeout: 10000
        });

        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {}
        };
    } catch (error) {
        console.error('Error fetching work types:', error);
        // Fallback to demo data
        return {
            success: true,
            data: DEMO_WORK_TYPES.filter(wt => 
                filters.is_active === undefined || wt.is_active === filters.is_active
            ),
            pagination: {
                total_items_count: DEMO_WORK_TYPES.length,
                page_size: 10,
                total_pages_count: 1,
                page_index: 0,
                has_next: false,
                has_previous: false
            }
        };
    }
    */
};

/**
 * Get work type by ID
 * @param {string} id - Work type ID
 * @returns {Promise<Object>} { success: boolean, data: Object }
 */
const getWorkTypeById = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Always return hardcoded data
    const workType = DEMO_WORK_TYPES.find(wt => wt.id === id);
    return {
        success: !!workType,
        data: workType || null
    };
};

/**
 * Create new work type
 * @param {Object} workType - Work type data
 * @returns {Promise<Object>} { success: boolean, data: Object }
 */
const createWorkType = async (workType) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/work-types`, workType, {
            timeout: 10000
        });

        return {
            success: true,
            data: response.data?.data || null
        };
    } catch (error) {
        console.error('Error creating work type:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Không thể tạo loại công việc'
        };
    }
};

/**
 * Update work type
 * @param {string} id - Work type ID
 * @param {Object} workType - Updated work type data
 * @returns {Promise<Object>} { success: boolean, data: Object }
 */
const updateWorkType = async (id, workType) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/work-types/${id}`, workType, {
            timeout: 10000
        });

        return {
            success: true,
            data: response.data?.data || null
        };
    } catch (error) {
        console.error('Error updating work type:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Không thể cập nhật loại công việc'
        };
    }
};

/**
 * Delete work type
 * @param {string} id - Work type ID
 * @returns {Promise<Object>} { success: boolean }
 */
const deleteWorkType = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/work-types/${id}`, {
            timeout: 10000
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting work type:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Không thể xóa loại công việc'
        };
    }
};

const workTypeApi = {
    getAllWorkTypes,
    getWorkTypeById,
    createWorkType,
    updateWorkType,
    deleteWorkType
};

export default workTypeApi;
export { DEMO_WORK_TYPES };

