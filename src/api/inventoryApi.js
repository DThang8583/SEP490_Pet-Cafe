/**
 * Inventory API - Mock implementation for managing raw materials inventory
 * 
 * This manages the raw ingredients/materials that working staff use to prepare
 * food and drinks for customers. This is NOT a product catalog with selling prices.
 * 
 * Categories:
 * - cafe_ingredients: Raw materials for making cafe drinks (milk, coffee beans, syrup, etc.)
 * - pet_food: Raw food items for pets (kibble, pate, treats, etc.)
 * 
 * Focus: Quantity management, stock levels, expiry dates, and suppliers
 */

// Mock restock history data
let MOCK_RESTOCK_HISTORY = [
    {
        id: 'restock-001',
        materialId: 'inv-001',
        materialName: 'Sữa tươi Vinamilk',
        quantityAdded: 50,
        quantityBefore: 20,
        quantityAfter: 70,
        unit: 'lít',
        supplier: 'Vinamilk',
        expiryDate: '2025-11-15',
        restockedAt: '2025-10-05T09:30:00Z'
    },
    {
        id: 'restock-002',
        materialId: 'inv-003',
        materialName: 'Bột kem béo',
        quantityAdded: 15,
        quantityBefore: 5,
        quantityAfter: 20,
        unit: 'kg',
        supplier: 'Anchor',
        expiryDate: '2025-12-10',
        restockedAt: '2025-10-06T14:20:00Z'
    }
];

// Mock usage history data (staff taking materials from warehouse)
let MOCK_USAGE_HISTORY = [
    {
        id: 'usage-001',
        materialId: 'inv-001',
        materialName: 'Sữa tươi Vinamilk',
        quantityTaken: 5,
        unit: 'lít',
        takenById: 'user-017', // Hoàng Thị Chăm Sóc (working_staff)
        takenBy: 'Hoàng Thị Chăm Sóc',
        takenAt: '2025-10-08T08:15:00Z'
    },
    {
        id: 'usage-002',
        materialId: 'inv-002',
        materialName: 'Cà phê Arabica',
        quantityTaken: 2,
        unit: 'kg',
        takenById: 'user-018', // Vũ Văn Thú Y (working_staff)
        takenBy: 'Vũ Văn Thú Y',
        takenAt: '2025-10-08T09:30:00Z'
    },
    {
        id: 'usage-003',
        materialId: 'inv-001',
        materialName: 'Sữa tươi Vinamilk',
        quantityTaken: 3,
        unit: 'lít',
        takenById: 'user-017', // Hoàng Thị Chăm Sóc (working_staff)
        takenBy: 'Hoàng Thị Chăm Sóc',
        takenAt: '2025-10-08T14:20:00Z'
    }
];

// Mock inventory data
let MOCK_INVENTORY = [
    // Cafe ingredients
    {
        id: 'inv-001',
        name: 'Sữa tươi Vinamilk',
        category: 'cafe_ingredients',
        quantity: 50,
        unit: 'lít',
        minStock: 20,
        supplier: 'Vinamilk',
        expiryDate: '2025-11-15',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-002',
        name: 'Cà phê Arabica',
        category: 'cafe_ingredients',
        quantity: 15,
        unit: 'kg',
        minStock: 10,
        supplier: 'Trung Nguyên',
        expiryDate: '2026-01-20',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-003',
        name: 'Bột kem béo',
        category: 'cafe_ingredients',
        quantity: 5,
        unit: 'kg',
        minStock: 8,
        supplier: 'Anchor',
        expiryDate: '2025-12-10',
        status: 'low_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-004',
        name: 'Đường trắng',
        category: 'cafe_ingredients',
        quantity: 30,
        unit: 'kg',
        minStock: 15,
        supplier: 'Biên Hòa',
        expiryDate: '2026-03-01',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-005',
        name: 'Trà xanh Matcha',
        category: 'cafe_ingredients',
        quantity: 3,
        unit: 'kg',
        minStock: 5,
        supplier: 'Nhật Bản',
        expiryDate: '2025-11-30',
        status: 'low_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-006',
        name: 'Chocolate đen',
        category: 'cafe_ingredients',
        quantity: 12,
        unit: 'kg',
        minStock: 8,
        supplier: 'Ferrero',
        expiryDate: '2026-02-15',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-007',
        name: 'Syrup Vanilla',
        category: 'cafe_ingredients',
        quantity: 8,
        unit: 'chai',
        minStock: 10,
        supplier: 'Monin',
        expiryDate: '2025-12-20',
        status: 'low_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-008',
        name: 'Syrup Caramel',
        category: 'cafe_ingredients',
        quantity: 0,
        unit: 'chai',
        minStock: 10,
        supplier: 'Monin',
        expiryDate: '2025-11-25',
        status: 'out_of_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },

    // Pet food
    {
        id: 'inv-009',
        name: 'Hạt Royal Canin cho chó',
        category: 'pet_food',
        quantity: 25,
        unit: 'kg',
        minStock: 15,
        supplier: 'Royal Canin',
        expiryDate: '2026-01-10',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-010',
        name: 'Hạt Whiskas cho mèo',
        category: 'pet_food',
        quantity: 18,
        unit: 'kg',
        minStock: 12,
        supplier: 'Whiskas',
        expiryDate: '2025-12-15',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-011',
        name: 'Pate cho chó vị gà',
        category: 'pet_food',
        quantity: 30,
        unit: 'hộp',
        minStock: 20,
        supplier: 'Pedigree',
        expiryDate: '2025-11-20',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-012',
        name: 'Pate cho mèo vị cá',
        category: 'pet_food',
        quantity: 8,
        unit: 'hộp',
        minStock: 20,
        supplier: 'Whiskas',
        expiryDate: '2025-11-18',
        status: 'low_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-013',
        name: 'Súp thưởng cho chó Inaba',
        category: 'pet_food',
        quantity: 0,
        unit: 'gói',
        minStock: 30,
        supplier: 'Inaba',
        expiryDate: '2025-10-25',
        status: 'out_of_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-014',
        name: 'Snack xương gặm',
        category: 'pet_food',
        quantity: 45,
        unit: 'cái',
        minStock: 30,
        supplier: 'SmartHeart',
        expiryDate: '2026-02-01',
        status: 'in_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    },
    {
        id: 'inv-015',
        name: 'Sữa cho thú cưng',
        category: 'pet_food',
        quantity: 12,
        unit: 'chai',
        minStock: 15,
        supplier: 'Pet Milk',
        expiryDate: '2025-11-05',
        status: 'low_stock',
        lastUpdated: '2025-10-08T10:00:00Z'
    }
];

// Inventory categories
export const INVENTORY_CATEGORIES = [
    {
        id: 'cafe_ingredients',
        name: 'Nguyên liệu Cafe',
        description: 'Nguyên liệu làm đồ ăn, thức uống cho khách hàng',
        icon: 'local_cafe',
        color: '#795548'
    },
    {
        id: 'pet_food',
        name: 'Đồ ăn Pet',
        description: 'Thức ăn và đồ ăn vặt cho thú cưng',
        icon: 'pets',
        color: '#FF9800'
    }
];

// Inventory status
export const INVENTORY_STATUS = {
    in_stock: { label: 'Còn hàng', color: 'success' },
    low_stock: { label: 'Sắp hết', color: 'warning' },
    out_of_stock: { label: 'Hết hàng', color: 'error' }
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
    return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': ['inventory_view'],
        'sales_staff': ['inventory_view', 'inventory_update'],
        'manager': ['inventory_view', 'inventory_create', 'inventory_update', 'inventory_delete'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Update item status based on quantity
const updateItemStatus = (item) => {
    if (item.quantity === 0) {
        return 'out_of_stock';
    } else if (item.quantity <= item.minStock) {
        return 'low_stock';
    }
    return 'in_stock';
};

// Inventory APIs
const inventoryApi = {
    // Get all inventory items
    async getAllItems(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_view')) {
            throw new Error('Không có quyền xem kho hàng');
        }

        let items = [...MOCK_INVENTORY];

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            items = items.filter(item => item.category === filters.category);
        }

        if (filters.status && filters.status !== 'all') {
            items = items.filter(item => item.status === filters.status);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.supplier.toLowerCase().includes(searchTerm)
            );
        }

        // Sort by status (out_of_stock first, then low_stock, then in_stock)
        items.sort((a, b) => {
            const statusPriority = { out_of_stock: 0, low_stock: 1, in_stock: 2 };
            return statusPriority[a.status] - statusPriority[b.status];
        });

        return {
            success: true,
            data: items
        };
    },

    // Get item by ID
    async getItemById(itemId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_view')) {
            throw new Error('Không có quyền xem kho hàng');
        }

        const item = MOCK_INVENTORY.find(i => i.id === itemId);

        if (!item) {
            throw new Error('Không tìm thấy vật phẩm');
        }

        return { success: true, data: item };
    },

    // Create new inventory item
    async createItem(itemData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_create')) {
            throw new Error('Không có quyền thêm vật phẩm');
        }

        // Validate required fields
        if (!itemData.name || !itemData.name.trim()) {
            throw new Error('Tên vật phẩm là bắt buộc');
        }

        if (!itemData.category) {
            throw new Error('Danh mục là bắt buộc');
        }

        if (itemData.quantity === undefined || itemData.quantity < 0) {
            throw new Error('Số lượng không hợp lệ');
        }

        if (!itemData.unit || !itemData.unit.trim()) {
            throw new Error('Đơn vị tính là bắt buộc');
        }

        const status = updateItemStatus({
            quantity: itemData.quantity,
            minStock: itemData.minStock || 10
        });

        const newItem = {
            id: generateId(),
            name: itemData.name.trim(),
            category: itemData.category,
            quantity: parseInt(itemData.quantity),
            unit: itemData.unit.trim(),
            minStock: parseInt(itemData.minStock) || 10,
            supplier: itemData.supplier?.trim() || '',
            expiryDate: itemData.expiryDate || '',
            status: status,
            lastUpdated: new Date().toISOString()
        };

        MOCK_INVENTORY.push(newItem);

        return {
            success: true,
            data: newItem,
            message: 'Thêm vật phẩm thành công'
        };
    },

    // Update inventory item
    async updateItem(itemId, updateData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_update')) {
            throw new Error('Không có quyền cập nhật vật phẩm');
        }

        const itemIndex = MOCK_INVENTORY.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            throw new Error('Không tìm thấy vật phẩm');
        }

        // Validate updates
        if (updateData.name !== undefined && !updateData.name.trim()) {
            throw new Error('Tên vật phẩm không được để trống');
        }

        if (updateData.quantity !== undefined && updateData.quantity < 0) {
            throw new Error('Số lượng không hợp lệ');
        }

        // Apply updates
        const updatedItem = {
            ...MOCK_INVENTORY[itemIndex],
            ...updateData,
            lastUpdated: new Date().toISOString()
        };

        // Update status based on new quantity
        updatedItem.status = updateItemStatus(updatedItem);

        MOCK_INVENTORY[itemIndex] = updatedItem;

        return {
            success: true,
            data: updatedItem,
            message: 'Cập nhật vật phẩm thành công'
        };
    },

    // Delete inventory item
    async deleteItem(itemId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_delete')) {
            throw new Error('Không có quyền xóa vật phẩm');
        }

        const itemIndex = MOCK_INVENTORY.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            throw new Error('Không tìm thấy vật phẩm');
        }

        const deletedItem = MOCK_INVENTORY[itemIndex];
        MOCK_INVENTORY.splice(itemIndex, 1);

        return {
            success: true,
            data: deletedItem,
            message: 'Xóa vật phẩm thành công'
        };
    },

    // Update stock quantity (for quick stock updates)
    async updateStock(itemId, quantity) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_update')) {
            throw new Error('Không có quyền cập nhật tồn kho');
        }

        const itemIndex = MOCK_INVENTORY.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            throw new Error('Không tìm thấy vật phẩm');
        }

        if (quantity < 0) {
            throw new Error('Số lượng không hợp lệ');
        }

        MOCK_INVENTORY[itemIndex].quantity = parseInt(quantity);
        MOCK_INVENTORY[itemIndex].status = updateItemStatus(MOCK_INVENTORY[itemIndex]);
        MOCK_INVENTORY[itemIndex].lastUpdated = new Date().toISOString();

        return {
            success: true,
            data: MOCK_INVENTORY[itemIndex],
            message: 'Cập nhật tồn kho thành công'
        };
    },

    // Get inventory statistics
    async getStatistics() {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_view')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const stats = {
            total: MOCK_INVENTORY.length,
            cafeIngredients: MOCK_INVENTORY.filter(i => i.category === 'cafe_ingredients').length,
            petFood: MOCK_INVENTORY.filter(i => i.category === 'pet_food').length,
            inStock: MOCK_INVENTORY.filter(i => i.status === 'in_stock').length,
            lowStock: MOCK_INVENTORY.filter(i => i.status === 'low_stock').length,
            outOfStock: MOCK_INVENTORY.filter(i => i.status === 'out_of_stock').length
        };

        return { success: true, data: stats };
    },

    // Get restock history
    async getRestockHistory(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_view')) {
            throw new Error('Không có quyền xem lịch sử');
        }

        let history = [...MOCK_RESTOCK_HISTORY];

        // Filter by materialId
        if (filters.materialId) {
            history = history.filter(h => h.materialId === filters.materialId);
        }

        // Filter by date range
        if (filters.startDate) {
            history = history.filter(h => new Date(h.restockedAt) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            history = history.filter(h => new Date(h.restockedAt) <= new Date(filters.endDate));
        }

        // Filter by supplier
        if (filters.supplier) {
            history = history.filter(h => h.supplier.toLowerCase().includes(filters.supplier.toLowerCase()));
        }

        // Sort by date (newest first)
        history.sort((a, b) => new Date(b.restockedAt) - new Date(a.restockedAt));

        return {
            success: true,
            data: history,
            total: history.length
        };
    },

    // Add restock history entry
    async addRestockHistory(historyData) {
        await delay(200);

        const newHistory = {
            id: `restock-${Date.now()}`,
            ...historyData,
            restockedAt: new Date().toISOString()
        };

        MOCK_RESTOCK_HISTORY.unshift(newHistory);

        return {
            success: true,
            data: newHistory
        };
    },

    // Get usage history (staff taking materials)
    async getUsageHistory(filters = {}) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_view')) {
            throw new Error('Không có quyền xem lịch sử');
        }

        let history = [...MOCK_USAGE_HISTORY];

        // Filter by materialId
        if (filters.materialId) {
            history = history.filter(h => h.materialId === filters.materialId);
        }

        // Filter by date range
        if (filters.startDate) {
            history = history.filter(h => new Date(h.takenAt) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            history = history.filter(h => new Date(h.takenAt) <= new Date(filters.endDate));
        }

        // Filter by staff name
        if (filters.takenBy) {
            history = history.filter(h => h.takenBy.toLowerCase().includes(filters.takenBy.toLowerCase()));
        }

        // Sort by date (newest first)
        history.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

        return {
            success: true,
            data: history,
            total: history.length
        };
    },

    // Add usage history entry (staff takes materials)
    async addUsageHistory(usageData) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'inventory_update')) {
            throw new Error('Không có quyền lấy nguyên liệu');
        }

        // Validate material exists and has enough quantity
        const materialIndex = MOCK_INVENTORY.findIndex(i => i.id === usageData.materialId);
        if (materialIndex === -1) {
            throw new Error('Không tìm thấy nguyên liệu');
        }

        const material = MOCK_INVENTORY[materialIndex];
        if (material.quantity < usageData.quantityTaken) {
            throw new Error(`Không đủ số lượng. Chỉ còn ${material.quantity} ${material.unit}`);
        }

        // Create usage record
        const newUsage = {
            id: `usage-${Date.now()}`,
            materialId: usageData.materialId,
            materialName: material.name,
            quantityTaken: usageData.quantityTaken,
            unit: material.unit,
            takenById: currentUser?.id || null,
            takenBy: currentUser?.fullName || currentUser?.name || 'Unknown User',
            takenAt: new Date().toISOString()
        };

        MOCK_USAGE_HISTORY.unshift(newUsage);

        // Deduct from inventory
        MOCK_INVENTORY[materialIndex].quantity -= usageData.quantityTaken;
        MOCK_INVENTORY[materialIndex].status = updateItemStatus(MOCK_INVENTORY[materialIndex]);
        MOCK_INVENTORY[materialIndex].lastUpdated = new Date().toISOString();

        return {
            success: true,
            data: newUsage,
            updatedMaterial: MOCK_INVENTORY[materialIndex]
        };
    }
};

export default inventoryApi;

