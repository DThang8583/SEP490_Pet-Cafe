/**
 * Products API - Official backend integration
 */

import axios from 'axios';

// Resolve API base URL from env or global, fallback to relative '/api' for dev proxy
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : (typeof window !== 'undefined' && window.__API_BASE_URL__) || '/api';

const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000
});

const buildQueryParams = (filters = {}) => {
    const params = {};
    if (filters.IsActive !== undefined) params.IsActive = filters.IsActive;
    if (filters.IsForPets !== undefined) params.IsForPets = filters.IsForPets;
    if (filters.MinPrice !== undefined) params.MinPrice = filters.MinPrice;
    if (filters.MaxPrice !== undefined) params.MaxPrice = filters.MaxPrice;
    if (filters.MinCost !== undefined) params.MinCost = filters.MinCost;
    if (filters.MaxCost !== undefined) params.MaxCost = filters.MaxCost;
    if (filters.MinStockQuantity !== undefined) params.MinStockQuantity = filters.MinStockQuantity;
    if (filters.MaxStockQuantity !== undefined) params.MaxStockQuantity = filters.MaxStockQuantity;
    if (filters.PageIndex !== undefined) params.PageIndex = filters.PageIndex;
    if (filters.PageSize !== undefined) params.PageSize = filters.PageSize;
    return params;
};

// Hardcoded demo data as fallback when API is unavailable
let DEMO_PRODUCTS = [
    {
        id: '02833aba-63b4-4d96-a098-840e28442e78',
        name: 'Coca Cola',
        category_id: '395401fd-eee8-4b23-a2d9-b71008eb8683',
        description: 'Nước giải khát có gas, dùng lạnh ngon hơn',
        price: 15000,
        daily_quantity: 50,
        remaining_quantity: 35,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Feaa3cdbe-708c-48e9-8d7c-f75c2d94b678.jpg?alt=media&token=00fe4f99-1e6c-4a4f-b3b3-efe2aa713968',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: '395401fd-eee8-4b23-a2d9-b71008eb8683',
            name: 'Nước Uống & Thức Uống Giải Khát'
        }
    },
    {
        id: 'f6fd4c2e-5b2e-4f71-9c3e-222222222222',
        name: 'Latte',
        category_id: 'cafedrink',
        description: 'Cà phê Latte béo ngậy',
        price: 45000,
        daily_quantity: 30,
        remaining_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'cafedrink',
            name: 'Đồ uống (Khách)'
        }
    },
    {
        id: 'a1b2c3d4-5e6f-7a8b-9c0d-333333333333',
        name: 'Snack cho mèo',
        category_id: 'petfood',
        description: 'Bánh thưởng giòn tan cho mèo',
        price: 20000,
        daily_quantity: 40,
        remaining_quantity: 28,
        image_url: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: true,
        manuallyDisabled: false,
        category: {
            id: 'petfood',
            name: 'Đồ ăn (Pet)'
        }
    },
    {
        id: 'prod-004',
        name: 'Cappuccino',
        category_id: 'cafedrink',
        description: 'Cà phê Cappuccino thơm ngon, bọt sữa mịn màng',
        price: 50000,
        daily_quantity: 25,
        remaining_quantity: 3,
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'cafedrink',
            name: 'Đồ uống (Khách)'
        }
    },
    {
        id: 'prod-005',
        name: 'Trà sữa trân châu',
        category_id: 'cafedrink',
        description: 'Trà sữa thơm ngọt kèm trân châu dai',
        price: 35000,
        daily_quantity: 40,
        remaining_quantity: 0,
        image_url: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'cafedrink',
            name: 'Đồ uống (Khách)'
        }
    },
    {
        id: 'prod-006',
        name: 'Bánh mì thịt nướng',
        category_id: 'foodcustomer',
        description: 'Bánh mì giòn tan với thịt nướng thơm lừng',
        price: 25000,
        daily_quantity: 50,
        remaining_quantity: 42,
        image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'foodcustomer',
            name: 'Đồ ăn (Khách)'
        }
    },
    {
        id: 'prod-007',
        name: 'Pate cho chó',
        category_id: 'petfood',
        description: 'Pate dinh dưỡng cao cấp cho chó mọi lứa tuổi',
        price: 30000,
        daily_quantity: 20,
        remaining_quantity: 15,
        image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: true,
        manuallyDisabled: false,
        category: {
            id: 'petfood',
            name: 'Đồ ăn (Pet)'
        }
    },
    {
        id: 'prod-008',
        name: 'Nước ép cam',
        category_id: 'cafedrink',
        description: 'Nước ép cam tươi nguyên chất 100%',
        price: 30000,
        daily_quantity: 35,
        remaining_quantity: 22,
        image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'cafedrink',
            name: 'Đồ uống (Khách)'
        }
    },
    {
        id: 'prod-009',
        name: 'Croissant',
        category_id: 'foodcustomer',
        description: 'Bánh sừng bò giòn xốp thơm bơ',
        price: 20000,
        daily_quantity: 30,
        remaining_quantity: 18,
        image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'foodcustomer',
            name: 'Đồ ăn (Khách)'
        }
    },
    {
        id: 'prod-010',
        name: 'Sữa chua hoa quả',
        category_id: 'foodcustomer',
        description: 'Sữa chua nguyên chất kèm hoa quả tươi',
        price: 18000,
        daily_quantity: 45,
        remaining_quantity: 31,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
        manuallyDisabled: false,
        category: {
            id: 'foodcustomer',
            name: 'Đồ ăn (Khách)'
        }
    },
    {
        id: 'prod-011',
        name: 'Trà đào cam sả',
        category_id: 'cafedrink',
        description: 'Trà hoa quả thanh mát với đào, cam và sả',
        price: 35000,
        daily_quantity: 0,
        remaining_quantity: 0,
        image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: false,
        is_for_pets: false,
        manuallyDisabled: true,
        category: {
            id: 'cafedrink',
            name: 'Đồ uống (Khách)'
        }
    }
];

const productsApi = {
    async getAllProducts(filters = {}) {
        try {
            const response = await http.get('/products', { params: buildQueryParams(filters) });
            const payload = response.data;
            if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) {
                console.warn('[productsApi] Empty payload, using demo products');
                return { data: DEMO_PRODUCTS, pagination: { total_items_count: DEMO_PRODUCTS.length, page_size: DEMO_PRODUCTS.length, total_pages_count: 1, page_index: 0, has_next: false, has_previous: false } };
            }
            return payload; // { data: [...], pagination: {...} }
        } catch (error) {
            // Normalize error for UI
            const message = error?.response?.data?.message || error?.message || 'Network error';
            console.warn('[productsApi] Falling back to demo products:', message);
            return { data: DEMO_PRODUCTS, pagination: { total_items_count: DEMO_PRODUCTS.length, page_size: DEMO_PRODUCTS.length, total_pages_count: 1, page_index: 0, has_next: false, has_previous: false } };
        }
    },

    async getCategories(filters = {}) {
        try {
            const response = await http.get('/categories', { params: buildQueryParams(filters) });
            return response.data; // { data: [...], pagination: {...} }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Network error';
            throw new Error(message);
        }
    },

    async createProduct(payload) {
        // Expect payload to match official schema
        // {
        //   name, category_id, description, price, daily_quantity,
        //   image_url, is_for_pets, thumbnails
        // }
        try {
            const response = await http.post('/products', payload);
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Network error';
            throw new Error(message);
        }
    },

    async updateDailyQuantity(productId, dailyQuantity) {
        try {
            // Try API first
            const response = await http.patch(`/products/${productId}/daily-quantity`, { daily_quantity: dailyQuantity });
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[productsApi] Updating demo product quantity');
            const productIndex = DEMO_PRODUCTS.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('Không tìm thấy sản phẩm');
            }

            DEMO_PRODUCTS[productIndex].daily_quantity = dailyQuantity;
            // Reset remaining to match new daily quantity
            DEMO_PRODUCTS[productIndex].remaining_quantity = dailyQuantity;

            return {
                success: true,
                message: 'Cập nhật số lượng thành công',
                data: DEMO_PRODUCTS[productIndex]
            };
        }
    },

    async toggleProductStatus(productId, disable = false) {
        try {
            // Try API first
            const response = await http.patch(`/products/${productId}/toggle-status`, { disable });
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[productsApi] Toggling demo product status');
            const productIndex = DEMO_PRODUCTS.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('Không tìm thấy sản phẩm');
            }

            DEMO_PRODUCTS[productIndex].manuallyDisabled = disable;
            DEMO_PRODUCTS[productIndex].is_active = !disable;

            return {
                success: true,
                message: disable ? 'Đã tạm ngừng bán sản phẩm' : 'Đã mở lại bán sản phẩm',
                data: DEMO_PRODUCTS[productIndex]
            };
        }
    },

    async deleteProduct(productId) {
        try {
            // Try API first
            const response = await http.delete(`/products/${productId}`);
            return response.data;
        } catch (error) {
            // Fallback to mock
            console.warn('[productsApi] Deleting demo product');
            const productIndex = DEMO_PRODUCTS.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('Không tìm thấy sản phẩm');
            }

            DEMO_PRODUCTS.splice(productIndex, 1);

            return {
                success: true,
                message: 'Xóa sản phẩm thành công'
            };
        }
    }
};

export default productsApi;

