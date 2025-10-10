/**
 * Products API - Menu Management for Pet Cafe
 * 
 * Manages cafe menu items (food/drinks for customers and pet snacks)
 * Products are made from inventory materials by staff
 * 
 * Business Rules:
 * - Each product has a recipe (list of required materials)
 * - Product is available ONLY if ALL required materials are in stock
 * - If ANY material is out of stock, product becomes unavailable
 * - Status is auto-calculated based on inventory
 */

import inventoryApi from './inventoryApi';

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
};

const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': ['product_view'],
        'sales_staff': ['product_view', 'product_update'],
        'manager': ['product_view', 'product_create', 'product_update', 'product_delete'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock products data
let MOCK_PRODUCTS = [
    // Customer Food
    {
        id: 'prod-001',
        name: 'Cà phê Espresso',
        category: 'drink_customer',
        description: 'Cà phê espresso đậm đà, rang xay tại chỗ',
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop',
        price: 45000,
        recipe: [
            { materialId: 'inv-002', materialName: 'Cà phê Arabica', quantity: 0.02 } // 20g = 0.02kg
        ],
        status: 'available', // available, out_of_stock, low_stock, disabled
        manuallyDisabled: false,
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },
    {
        id: 'prod-002',
        name: 'Cà phê Latte',
        category: 'drink_customer',
        description: 'Cà phê latte mịn màng với bọt sữa tươi',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop',
        price: 55000,
        recipe: [
            { materialId: 'inv-002', materialName: 'Cà phê Arabica', quantity: 0.02 },
            { materialId: 'inv-001', materialName: 'Sữa tươi Vinamilk', quantity: 0.2 } // 200ml = 0.2L
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },
    {
        id: 'prod-003',
        name: 'Sinh tố dâu',
        category: 'drink_customer',
        description: 'Sinh tố dâu tây tươi mát, bổ dưỡng',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop',
        price: 50000,
        recipe: [
            { materialId: 'inv-001', materialName: 'Sữa tươi Vinamilk', quantity: 0.3 },
            { materialId: 'inv-004', materialName: 'Dâu tây tươi', quantity: 0.15 }
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },
    {
        id: 'prod-004',
        name: 'Bánh mì sandwich',
        category: 'food_customer',
        description: 'Bánh mì sandwich thơm ngon với nhiều nhân',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop',
        price: 65000,
        recipe: [
            { materialId: 'inv-005', materialName: 'Bánh mì tươi', quantity: 2 }
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },
    {
        id: 'prod-005',
        name: 'Salad trộn',
        category: 'food_customer',
        description: 'Salad rau củ tươi ngon, sốt đặc biệt',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
        price: 70000,
        recipe: [
            { materialId: 'inv-006', materialName: 'Rau củ hỗn hợp', quantity: 0.2 }
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },

    // Pet Food (small portions for cats in cafe)
    {
        id: 'prod-006',
        name: 'Pate mèo vị cá hồi',
        category: 'food_pet',
        description: 'Pate dinh dưỡng cho mèo, vị cá hồi thơm ngon',
        image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop',
        price: 25000,
        recipe: [
            { materialId: 'inv-007', materialName: 'Pate mèo', quantity: 0.1 } // 100g
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    },
    {
        id: 'prod-007',
        name: 'Bánh thưởng mèo',
        category: 'food_pet',
        description: 'Bánh snack giòn tan cho mèo, nhiều vitamin',
        image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&auto=format&fit=crop',
        price: 20000,
        recipe: [
            { materialId: 'inv-008', materialName: 'Snack mèo', quantity: 0.05 } // 50g
        ],
        status: 'available',
        createdAt: '2025-10-01T08:00:00Z',
        updatedAt: '2025-10-01T08:00:00Z'
    }
];

// Calculate product availability based on inventory
const calculateProductStatus = async (product) => {
    try {
        // If manually disabled by manager
        if (product.manuallyDisabled) {
            return 'disabled';
        }

        const inventoryResponse = await inventoryApi.getAllItems();
        const inventory = inventoryResponse.data || [];

        let hasOutOfStock = false;
        let hasLowStock = false;

        // Check status of ALL required materials
        for (const ingredient of product.recipe) {
            const material = inventory.find(m => m.id === ingredient.materialId);

            // If material not found or out of stock → mark as out
            if (!material || material.status === 'out_of_stock' || material.quantity < ingredient.quantity) {
                hasOutOfStock = true;
                break; // Stop checking, already out
            }

            // If material is low stock → mark as low
            if (material.status === 'low_stock') {
                hasLowStock = true;
            }
        }

        // Priority: out_of_stock > low_stock > available
        if (hasOutOfStock) {
            return 'out_of_stock';
        }
        if (hasLowStock) {
            return 'low_stock';
        }
        return 'available';
    } catch (error) {
        console.error('Error calculating product status:', error);
        return 'out_of_stock';
    }
};

// Update all products status based on current inventory
const updateAllProductsStatus = async () => {
    for (let i = 0; i < MOCK_PRODUCTS.length; i++) {
        MOCK_PRODUCTS[i].status = await calculateProductStatus(MOCK_PRODUCTS[i]);
    }
};

// Products API
const productsApi = {
    // Get all products
    async getAllProducts(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_view')) {
            throw new Error('Không có quyền xem sản phẩm');
        }

        // Update all products status before returning
        await updateAllProductsStatus();

        let products = [...MOCK_PRODUCTS];

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            products = products.filter(p => p.category === filters.category);
        }

        if (filters.status && filters.status !== 'all') {
            products = products.filter(p => p.status === filters.status);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort by status (unavailable first for attention), then by name
        products.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'unavailable' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        return {
            success: true,
            data: products
        };
    },

    // Get product by ID
    async getProductById(productId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_view')) {
            throw new Error('Không có quyền xem sản phẩm');
        }

        const product = MOCK_PRODUCTS.find(p => p.id === productId);

        if (!product) {
            throw new Error('Không tìm thấy sản phẩm');
        }

        // Update status before returning
        product.status = await calculateProductStatus(product);

        return { success: true, data: product };
    },

    // Create new product
    async createProduct(productData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_create')) {
            throw new Error('Không có quyền tạo sản phẩm');
        }

        // Validate required fields
        if (!productData.name || !productData.name.trim()) {
            throw new Error('Tên sản phẩm là bắt buộc');
        }

        if (!productData.category) {
            throw new Error('Danh mục là bắt buộc');
        }

        if (!productData.price || productData.price <= 0) {
            throw new Error('Giá bán phải lớn hơn 0');
        }

        if (!productData.recipe || productData.recipe.length === 0) {
            throw new Error('Công thức chế biến là bắt buộc');
        }

        const newProduct = {
            id: `prod-${Date.now()}`,
            name: productData.name,
            category: productData.category,
            description: productData.description || '',
            image: productData.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop',
            price: parseFloat(productData.price),
            recipe: productData.recipe,
            status: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Calculate initial status
        newProduct.status = await calculateProductStatus(newProduct);

        MOCK_PRODUCTS.push(newProduct);

        return {
            success: true,
            data: newProduct,
            message: 'Tạo sản phẩm thành công'
        };
    },

    // Update product
    async updateProduct(productId, productData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_update')) {
            throw new Error('Không có quyền cập nhật sản phẩm');
        }

        const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Không tìm thấy sản phẩm');
        }

        // Validate if updating
        if (productData.price && productData.price <= 0) {
            throw new Error('Giá bán phải lớn hơn 0');
        }

        if (productData.recipe && productData.recipe.length === 0) {
            throw new Error('Công thức chế biến không được để trống');
        }

        MOCK_PRODUCTS[productIndex] = {
            ...MOCK_PRODUCTS[productIndex],
            ...productData,
            updatedAt: new Date().toISOString()
        };

        // Recalculate status after update
        MOCK_PRODUCTS[productIndex].status = await calculateProductStatus(MOCK_PRODUCTS[productIndex]);

        return {
            success: true,
            data: MOCK_PRODUCTS[productIndex],
            message: 'Cập nhật sản phẩm thành công'
        };
    },

    // Delete product
    async deleteProduct(productId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_delete')) {
            throw new Error('Không có quyền xóa sản phẩm');
        }

        const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Không tìm thấy sản phẩm');
        }

        MOCK_PRODUCTS.splice(productIndex, 1);

        return {
            success: true,
            message: 'Xóa sản phẩm thành công'
        };
    },

    // Toggle product disabled status
    async toggleProductStatus(productId, disabled) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_update')) {
            throw new Error('Không có quyền cập nhật sản phẩm');
        }

        const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Không tìm thấy sản phẩm');
        }

        MOCK_PRODUCTS[productIndex].manuallyDisabled = disabled;
        MOCK_PRODUCTS[productIndex].updatedAt = new Date().toISOString();

        // Recalculate status
        MOCK_PRODUCTS[productIndex].status = await calculateProductStatus(MOCK_PRODUCTS[productIndex]);

        return {
            success: true,
            data: MOCK_PRODUCTS[productIndex],
            message: disabled ? 'Đã tạm ngừng bán sản phẩm' : 'Đã mở lại bán sản phẩm'
        };
    },

    // Get statistics
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_view')) {
            throw new Error('Không có quyền xem thống kê');
        }

        // Update all products status before calculating stats
        await updateAllProductsStatus();

        const total = MOCK_PRODUCTS.length;
        const available = MOCK_PRODUCTS.filter(p => p.status === 'available').length;
        const outOfStock = MOCK_PRODUCTS.filter(p => p.status === 'out_of_stock').length;
        const lowStock = MOCK_PRODUCTS.filter(p => p.status === 'low_stock').length;
        const disabled = MOCK_PRODUCTS.filter(p => p.status === 'disabled').length;

        const customerFood = MOCK_PRODUCTS.filter(p => p.category === 'food_customer').length;
        const customerDrink = MOCK_PRODUCTS.filter(p => p.category === 'drink_customer').length;
        const petFood = MOCK_PRODUCTS.filter(p => p.category === 'food_pet').length;

        return {
            success: true,
            data: {
                total,
                available,
                outOfStock,
                lowStock,
                disabled,
                customerFood,
                customerDrink,
                petFood
            }
        };
    }
};

export default productsApi;

