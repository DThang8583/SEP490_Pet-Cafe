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
const DEMO_PRODUCTS = [
    {
        id: '02833aba-63b4-4d96-a098-840e28442e78',
        name: 'Coca Cola',
        category_id: '395401fd-eee8-4b23-a2d9-b71008eb8683',
        description: 'Nước giải khát có gas, dùng lạnh ngon hơn',
        price: 15000,
        cost: 10000,
        stock_quantity: 4958,
        min_stock_level: 5294,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Feaa3cdbe-708c-48e9-8d7c-f75c2d94b678.jpg?alt=media&token=00fe4f99-1e6c-4a4f-b3b3-efe2aa713968',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
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
        cost: 25000,
        stock_quantity: 120,
        min_stock_level: 20,
        image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: false,
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
        cost: 10000,
        stock_quantity: 80,
        min_stock_level: 15,
        image_url: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&auto=format&fit=crop',
        thumbnails: [],
        is_active: true,
        is_for_pets: true,
        category: {
            id: 'petfood',
            name: 'Đồ ăn (Pet)'
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
        //   name, category_id, description, price, cost, stock_quantity,
        //   min_stock_level, image_url, is_for_pets, thumbnails
        // }
        try {
            const response = await http.post('/products', payload);
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Network error';
            throw new Error(message);
        }
    }
};

export default productsApi;

