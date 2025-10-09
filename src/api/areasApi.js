// Areas API - Mock implementation for managing cafe areas

// Mock areas data
const AREAS_DATA = [
    {
        id: 'area-1',
        name: 'Khu vực chính - Tầng 1',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
        description: 'Không gian rộng rãi và ấm cúng với thiết kế hiện đại, phù hợp cho khách ngồi uống nước và tương tác với thú cưng. Khu vực được trang bị đầy đủ tiện nghi với ghế ngồi thoải mái và không gian chơi cho pets.',
        location: 'Tầng 1, Phía trước quán, Gần cửa chính',
        capacity: 30
    },
    {
        id: 'area-2',
        name: 'Khu VIP - Tầng 2',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
        description: 'Khu vực cao cấp với không gian riêng tư và view đẹp, dành cho khách hàng muốn có trải nghiệm đặc biệt. Được phục vụ riêng với menu đặc biệt và không gian yên tĩnh.',
        location: 'Tầng 2, Phía góc view đẹp, Khu vực biệt lập',
        capacity: 15
    },
    {
        id: 'area-3',
        name: 'Phòng Grooming',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
        description: 'Phòng chuyên dụng cho việc tắm rửa, cắt tỉa lông và chăm sóc vệ sinh cho thú cưng. Được trang bị đầy đủ thiết bị grooming chuyên nghiệp và khu vực sấy khô an toàn.',
        location: 'Tầng 1, Khu vực phía sau, Gần kho đồ dùng',
        capacity: 2
    },
    {
        id: 'area-4',
        name: 'Phòng Spa Pet',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop',
        description: 'Phòng spa cao cấp với dịch vụ massage và chăm sóc thư giãn cho thú cưng. Không gian được thiết kế để tạo cảm giác thư thái với ánh sáng dịu nhẹ và âm nhạc êm ái.',
        location: 'Tầng 2, Khu vực yên tĩnh, Gần khu nghỉ dưỡng',
        capacity: 4
    },
    {
        id: 'area-5',
        name: 'Phòng Training',
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop',
        description: 'Phòng huấn luyện rộng rãi với đầy đủ dụng cụ để dạy kỹ năng và hành vi cho thú cưng. Có gương lớn để quan sát và không gian thoáng đãng cho các hoạt động vận động.',
        location: 'Tầng 2, Phía cuối hành lang, Khu vực rộng',
        capacity: 6
    },
    {
        id: 'area-6',
        name: 'Khu Outdoor Garden',
        image: 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=800&auto=format&fit=crop',
        description: 'Khu vườn ngoài trời xanh mát với sân cỏ tự nhiên và cây xanh. Là nơi lý tưởng cho thú cưng vui chơi và khách hàng thư giãn trong không khí trong lành.',
        location: 'Tầng 1, Sân ngoài trời, Khu vực có mái che',
        capacity: 20
    }
];

// Simulate localStorage
let areasStore = [...AREAS_DATA];

/**
 * Get all areas
 * @returns {Promise<Array>} List of all areas
 */
export const getAllAreas = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...areasStore];
};

/**
 * Get area by ID
 * @param {string} areaId - Area ID
 * @returns {Promise<Object|null>} Area object or null if not found
 */
export const getAreaById = async (areaId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const area = areasStore.find(a => a.id === areaId);
    return area ? { ...area } : null;
};

/**
 * Create new area
 * @param {Object} areaData - New area data
 * @returns {Promise<Object>} Created area
 */
export const createArea = async (areaData) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newArea = {
        id: `area-${Date.now()}`,
        ...areaData,
        createdAt: new Date().toISOString()
    };
    areasStore.push(newArea);
    return { ...newArea };
};

/**
 * Update area
 * @param {string} areaId - Area ID to update
 * @param {Object} areaData - Updated area data
 * @returns {Promise<Object>} Updated area
 */
export const updateArea = async (areaId, areaData) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = areasStore.findIndex(a => a.id === areaId);
    if (index === -1) {
        throw new Error('Area not found');
    }
    areasStore[index] = {
        ...areasStore[index],
        ...areaData,
        updatedAt: new Date().toISOString()
    };
    return { ...areasStore[index] };
};

/**
 * Delete area
 * @param {string} areaId - Area ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteArea = async (areaId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = areasStore.findIndex(a => a.id === areaId);
    if (index === -1) {
        throw new Error('Area not found');
    }
    areasStore.splice(index, 1);
    return true;
};

/**
 * Get areas statistics
 * @returns {Promise<Object>} Statistics object
 */
export const getAreasStatistics = async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
        total: areasStore.length,
        totalCapacity: areasStore.reduce((sum, area) => sum + area.capacity, 0),
        averageCapacity: areasStore.length > 0
            ? Math.round(areasStore.reduce((sum, area) => sum + area.capacity, 0) / areasStore.length)
            : 0
    };
};

// Export areas data for direct access (e.g., for dropdowns)
export { AREAS_DATA };

