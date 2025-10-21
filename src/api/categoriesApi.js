/**
 * Categories API
 */

import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : (typeof window !== 'undefined' && window.__API_BASE_URL__) || '/api';

const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000
});

// Mock data
let MOCK_CATEGORIES = [
    {
        id: '395401fd-eee8-4b23-a2d9-b71008eb8683',
        name: 'Nước Uống & Thức Uống Giải Khát',
        description: 'Các loại nước uống, trà, cà phê, nước giải khát cho khách hàng',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'cafedrink',
        name: 'Đồ uống (Khách)',
        description: 'Cà phê, trà sữa, nước ép cho khách hàng',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z'
    },
    {
        id: 'foodcustomer',
        name: 'Đồ ăn (Khách)',
        description: 'Các món ăn nhẹ, bánh ngọt cho khách hàng',
        is_active: true,
        created_at: '2024-01-03T00:00:00Z'
    },
    {
        id: 'petfood',
        name: 'Đồ ăn (Pet)',
        description: 'Thức ăn, snack, pate cho thú cưng',
        is_active: true,
        created_at: '2024-01-04T00:00:00Z'
    },
    {
        id: 'cat-001',
        name: 'Đồ chơi mèo',
        description: 'Đồ chơi, cần câu, bóng cho mèo',
        is_active: false,
        created_at: '2024-01-05T00:00:00Z'
    }
];

const categoriesApi = {
    async getAllCategories(filters = {}) {
        try {
            const response = await http.get('/categories', { params: filters });
            const payload = response.data;
            if (!payload || !Array.isArray(payload.data)) {
                console.warn('[categoriesApi] Empty payload, using demo categories');
                return { data: MOCK_CATEGORIES, pagination: { total_items_count: MOCK_CATEGORIES.length } };
            }
            return payload;
        } catch (error) {
            console.warn('[categoriesApi] Falling back to demo categories:', error.message);
            return { data: MOCK_CATEGORIES, pagination: { total_items_count: MOCK_CATEGORIES.length } };
        }
    },

    async createCategory(payload) {
        try {
            const response = await http.post('/categories', payload);
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[categoriesApi] Creating demo category');
            const newCategory = {
                id: `cat-${Date.now()}`,
                name: payload.name,
                description: payload.description || '',
                is_active: true,
                created_at: new Date().toISOString()
            };
            MOCK_CATEGORIES.push(newCategory);
            return {
                success: true,
                message: 'Tạo danh mục thành công',
                data: newCategory
            };
        }
    },

    async updateCategory(categoryId, payload) {
        try {
            const response = await http.put(`/categories/${categoryId}`, payload);
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[categoriesApi] Updating demo category');
            const categoryIndex = MOCK_CATEGORIES.findIndex(c => c.id === categoryId);
            if (categoryIndex === -1) {
                throw new Error('Không tìm thấy danh mục');
            }

            MOCK_CATEGORIES[categoryIndex] = {
                ...MOCK_CATEGORIES[categoryIndex],
                name: payload.name,
                description: payload.description
            };

            return {
                success: true,
                message: 'Cập nhật danh mục thành công',
                data: MOCK_CATEGORIES[categoryIndex]
            };
        }
    },

    async toggleCategoryStatus(categoryId, disable = false) {
        try {
            const response = await http.patch(`/categories/${categoryId}/toggle-status`, { disable });
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[categoriesApi] Toggling demo category status');
            const categoryIndex = MOCK_CATEGORIES.findIndex(c => c.id === categoryId);
            if (categoryIndex === -1) {
                throw new Error('Không tìm thấy danh mục');
            }

            MOCK_CATEGORIES[categoryIndex].is_active = !disable;

            return {
                success: true,
                message: disable ? 'Đã vô hiệu hóa danh mục' : 'Đã kích hoạt danh mục',
                data: MOCK_CATEGORIES[categoryIndex]
            };
        }
    },

    async deleteCategory(categoryId) {
        try {
            const response = await http.delete(`/categories/${categoryId}`);
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[categoriesApi] Deleting demo category');
            const categoryIndex = MOCK_CATEGORIES.findIndex(c => c.id === categoryId);
            if (categoryIndex === -1) {
                throw new Error('Không tìm thấy danh mục');
            }

            MOCK_CATEGORIES.splice(categoryIndex, 1);

            return {
                success: true,
                message: 'Xóa danh mục thành công'
            };
        }
    }
};

export default categoriesApi;

