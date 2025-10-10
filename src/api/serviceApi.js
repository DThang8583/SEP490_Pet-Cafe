/**
 * SERVICE API - Data Mapping & Mock Implementation
 * 
 * ============================================
 * OFFICIAL API FIELDS
 * ============================================
 * 
 * | Field Name       | Type     | Required | Description                    |
 * |------------------|----------|----------|--------------------------------|
 * | name             | string   | ✅ Yes   | Service name                   |
 * | description      | string   | ⚠️ Opt   | Service description            |
 * | duration_minutes | number   | ✅ Yes   | Service duration in minutes    |
 * | base_price       | number   | ✅ Yes   | Base price in VND              |
 * | service_type     | string   | ✅ Yes   | Service type/category          |
 * | requires_area    | boolean  | ⚠️ Opt   | Whether service requires area  |
 * | image_url        | string   | ⚠️ Opt   | Main image URL                 |
 * | thumbnails       | string[] | ⚠️ Opt   | Array of thumbnail URLs        |
 * 
 * ============================================
 * BACKEND SCHEMA (from Swagger API)
 * ============================================
 * {
 *   "name": "string",
 *   "description": "string",
 *   "duration_minutes": 0,
 *   "base_price": 0,
 *   "service_type": "string",
 *   "requires_area": true,
 *   "image_url": "string",
 *   "thumbnails": ["string"]
 * }
 * 
 * ============================================
 * DATA SCHEMA (Matches Official API)
 * ============================================
 * {
 *   id: "string",                  // Auto-generated
 *   name: "string",
 *   description: "string",
 *   duration_minutes: 90,
 *   base_price: 150000,
 *   service_type: "Chăm sóc & Làm đẹp",
 *   requires_area: true,
 *   image_url: "url",
 *   thumbnails: []
 * }
 * 
 * ============================================
 * TRANSFORMER FUNCTIONS
 * ============================================
 * 
 * transformToBackendFormat(serviceData)
 * - Validates and normalizes service data to official API format
 * 
 * Example:
 *   const serviceData = {
 *     name: "Tắm và chải lông",
 *     description: "Dịch vụ tắm cơ bản",
 *     duration_minutes: 90,
 *     base_price: 150000,
 *     service_type: "Chăm sóc & Làm đẹp",
 *     requires_area: true,
 *     image_url: "https://example.com/image.jpg"
 *   };
 * 
 *   const apiFormat = transformToBackendFormat(serviceData);
 *   // Result: Official API format (8 fields only)
 * 
 * transformFromBackendFormat(backendService)
 * - Returns backend API response as-is (no transformation needed)
 * 
 * ============================================
 * SERVICE TYPES (must match backend enum)
 * ============================================
 * - Chăm sóc & Làm đẹp (Grooming & Beauty)
 * - Huấn luyện (Training)
 * - Giữ thú cưng (Daycare)
 * - Dịch vụ Cafe (Cafe Service)
 * 
 * ============================================
 * VALIDATION RULES (Backend API)
 * ============================================
 * 1. name: Required, non-empty string
 * 2. duration_minutes: Required, must be > 0
 * 3. base_price: Required, must be >= 0
 * 4. service_type: Required, must be one of SERVICE_TYPES
 * 
 * Note: start_date, end_date, max_capacity are FRONTEND-ONLY fields for UI display
 * 
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 * 
 * // Creating a Service
 * const createService = async (formData) => {
 *   try {
 *     const serviceData = {
 *       name: formData.name,
 *       description: formData.description,
 *       duration_minutes: formData.duration_minutes,
 *       base_price: formData.base_price,
 *       service_type: formData.service_type,
 *       requires_area: formData.requires_area,
 *       image_url: formData.image_url,
 *       thumbnails: formData.thumbnails || []
 *     };
 * 
 *     const response = await serviceApi.createService(serviceData);
 *     console.log(response.data);
 *   } catch (error) {
 *     console.error('Error creating service:', error.message);
 *   }
 * };
 * 
 * // Updating a Service
 * const updateService = async (serviceId, updates) => {
 *   try {
 *     const updateData = {
 *       name: updates.name,
 *       duration_minutes: updates.duration_minutes,
 *       base_price: updates.base_price,
 *       service_type: updates.service_type
 *     };
 * 
 *     const response = await serviceApi.updateService(serviceId, updateData);
 *     console.log(response.data);
 *   } catch (error) {
 *     console.error('Error updating service:', error.message);
 *   }
 * };
 * 
 * ============================================
 * TROUBLESHOOTING
 * ============================================
 * 
 * 1. "Giá dịch vụ không hợp lệ"
 *    → Check that `price` or `base_price` is >= 0
 * 
 * 2. "Thời gian dịch vụ phải lớn hơn 0"
 *    → Check that `duration` or `duration_minutes` is > 0
 * 
 * 3. "Loại dịch vụ là bắt buộc"
 *    → Ensure `category` or `service_type` is provided and matches SERVICE_TYPES
 * 
 * 4. Field not updating
 *    → Make sure you're using the correct field name (either frontend or backend convention)
 *    → The transformer will handle the conversion automatically
 * 
 * @module serviceApi
 * @lastUpdated 2025-10-10
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Transform frontend service data to backend API format
const transformToBackendFormat = (frontendService) => {
    return {
        name: frontendService.name,
        description: frontendService.description || '',
        duration_minutes: frontendService.duration_minutes || 0,
        base_price: frontendService.base_price || 0,
        service_type: frontendService.service_type || 'Chăm sóc & Làm đẹp',
        requires_area: frontendService.requires_area !== undefined ? frontendService.requires_area : false,
        image_url: frontendService.image_url || '',
        thumbnails: frontendService.thumbnails || []
    };
};

// Transform backend API response to frontend format (returns as-is since they match)
const transformFromBackendFormat = (backendService) => {
    return backendService;
};

// Mock database for services (matching official API)
const MOCK_SERVICES = [
    {
        id: 'service-001',
        name: 'Tắm và chải lông cơ bản',
        description: 'Tắm sạch và chải lông mượt mà cho thú cưng của bạn',
        duration_minutes: 90,
        base_price: 150000,
        service_type: 'Chăm sóc & Làm đẹp',
        requires_area: true,
        image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-002',
        name: 'Cắt tỉa lông chuyên nghiệp',
        description: 'Cắt tỉa lông chuyên nghiệp theo kiểu dáng và giống thú cưng',
        duration_minutes: 120,
        base_price: 300000,
        service_type: 'Chăm sóc & Làm đẹp',
        requires_area: true,
        image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-003',
        name: 'Daycare theo ngày',
        description: 'Chăm sóc thú cưng cả ngày với hoạt động vui chơi',
        duration_minutes: 480,
        base_price: 200000,
        service_type: 'Giữ thú cưng',
        requires_area: true,
        image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-004',
        name: 'Trải nghiệm huấn luyện thú cưng',
        description: 'Trải nghiệm huấn luyện cùng thú cưng được đào tạo của quán, học cách giao tiếp và hiểu thú cưng',
        duration_minutes: 60,
        base_price: 500000,
        service_type: 'Huấn luyện',
        requires_area: false,
        image_url: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-005',
        name: 'Tắm và vệ sinh nhanh',
        description: 'Dịch vụ tắm và vệ sinh nhanh cho thú cưng',
        duration_minutes: 30,
        base_price: 80000,
        service_type: 'Chăm sóc & Làm đẹp',
        requires_area: true,
        image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-006',
        name: 'Tương tác với thú cưng cafe',
        description: 'Trải nghiệm tương tác và chơi đùa với các thú cưng đáng yêu của cafe',
        duration_minutes: 30,
        base_price: 100000,
        service_type: 'Dịch vụ Cafe',
        requires_area: false,
        image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    },
    {
        id: 'service-007',
        name: 'Workshop chăm sóc thú cưng cơ bản',
        description: 'Học các kỹ thuật chăm sóc thú cưng cơ bản từ các chuyên gia',
        duration_minutes: 120,
        base_price: 200000,
        service_type: 'Dịch vụ Cafe',
        requires_area: false,
        image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
        thumbnails: []
    }
];

// Service categories
const SERVICE_CATEGORIES = [
    {
        id: 'Chăm sóc & Làm đẹp',
        name: 'Chăm sóc & Làm đẹp',
        description: 'Dịch vụ tắm gội, cắt tỉa lông và chăm sóc ngoại hình',
        icon: 'spa',
        color: '#4CAF50'
    },
    {
        id: 'Huấn luyện',
        name: 'Huấn luyện',
        description: 'Dịch vụ huấn luyện và giáo dục thú cưng',
        icon: 'school',
        color: '#2196F3'
    },
    {
        id: 'Giữ thú cưng',
        name: 'Giữ thú cưng',
        description: 'Dịch vụ giữ và chăm sóc thú cưng theo giờ/ngày',
        icon: 'home',
        color: '#FF9800'
    },
    {
        id: 'Dịch vụ Cafe',
        name: 'Dịch vụ Cafe',
        description: 'Trải nghiệm tương tác và hoạt động cùng thú cưng tại cafe',
        icon: 'local_cafe',
        color: '#795548'
    }
];

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': ['service_booking', 'feedback_submission', 'notification_receive'],
        'working_staff': ['view_schedule', 'update_task_status', 'notification_receive'],
        'manager': ['user_management', 'service_management', 'booking_management', 'analytics_view', 'notification_receive'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Service APIs
const serviceApi = {
    // Get all available services (public access - no auth required)
    async getAvailableServices(filters = {}) {
        await delay(300);

        let services = [...MOCK_SERVICES];

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            services = services.filter(service => service.service_type === filters.category);
        }

        if (filters.priceMin) {
            services = services.filter(service => service.base_price >= filters.priceMin);
        }

        if (filters.priceMax) {
            services = services.filter(service => service.base_price <= filters.priceMax);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            services = services.filter(service =>
                service.name.toLowerCase().includes(searchTerm) ||
                service.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort services
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    services.sort((a, b) => a.base_price - b.base_price);
                    break;
                case 'price_desc':
                    services.sort((a, b) => b.base_price - a.base_price);
                    break;
                case 'duration':
                    services.sort((a, b) => a.duration_minutes - b.duration_minutes);
                    break;
                default:
                    // Keep original order
                    break;
            }
        }

        return {
            success: true,
            data: services,
            total: services.length,
            categories: SERVICE_CATEGORIES
        };
    },

    // Get service by ID
    async getServiceById(serviceId) {
        await delay(200);

        const service = MOCK_SERVICES.find(s => s.id === serviceId);

        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        return { success: true, data: service };
    },

    // Get service categories
    async getServiceCategories() {
        await delay(150);

        return { success: true, data: SERVICE_CATEGORIES };
    },

    // Get popular services
    async getPopularServices(limit = 6) {
        await delay(250);

        const popularServices = MOCK_SERVICES.slice(0, limit);

        return { success: true, data: popularServices };
    },

    // Get services by category
    async getServicesByCategory(category) {
        await delay(200);

        const services = MOCK_SERVICES.filter(service =>
            service.service_type === category
        );

        const categoryInfo = SERVICE_CATEGORIES.find(cat => cat.id === category);

        return {
            success: true,
            data: services,
            category: categoryInfo
        };
    },

    // Search services
    async searchServices(searchTerm, filters = {}) {
        await delay(400);

        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
        }

        const term = searchTerm.toLowerCase().trim();

        let services = MOCK_SERVICES.filter(service => {
            return (
                service.name.toLowerCase().includes(term) ||
                service.description.toLowerCase().includes(term) ||
                service.service_type.toLowerCase().includes(term)
            );
        });

        // Apply additional filters
        if (filters.category && filters.category !== 'all') {
            services = services.filter(service => service.service_type === filters.category);
        }

        if (filters.priceRange) {
            const [min, max] = filters.priceRange;
            services = services.filter(service => service.base_price >= min && service.base_price <= max);
        }

        // Sort by relevance (can be enhanced with better scoring algorithm)
        services.sort((a, b) => {
            const aScore = (
                (a.name.toLowerCase().includes(term) ? 3 : 0) +
                (a.description.toLowerCase().includes(term) ? 2 : 0)
            );
            const bScore = (
                (b.name.toLowerCase().includes(term) ? 3 : 0) +
                (b.description.toLowerCase().includes(term) ? 2 : 0)
            );
            return bScore - aScore;
        });

        return {
            success: true,
            data: services,
            searchTerm,
            total: services.length
        };
    },

    // Get service reviews
    async getServiceReviews(serviceId, page = 1, limit = 10) {
        await delay(300);

        const service = MOCK_SERVICES.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Mock reviews data
        const allReviews = [
            {
                id: 'review-001',
                serviceId: serviceId,
                customerId: 'user-007',
                customerName: 'Nguyễn Thị Lan Anh',
                rating: 5,
                comment: 'Dịch vụ rất tốt, nhân viên thân thiện và chuyên nghiệp',
                photos: [],
                createdAt: '2024-01-27T12:00:00'
            },
            {
                id: 'review-002',
                serviceId: serviceId,
                customerId: 'user-008',
                customerName: 'Trần Văn Hùng',
                rating: 4,
                comment: 'Chất lượng ok, giá hợp lý',
                photos: [],
                createdAt: '2024-01-26T15:30:00'
            }
        ];

        const startIndex = (page - 1) * limit;
        const reviews = allReviews.slice(startIndex, startIndex + limit);

        return {
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total: allReviews.length,
                    totalPages: Math.ceil(allReviews.length / limit)
                }
            }
        };
    },

    // Calculate dynamic pricing
    async calculateDynamicPrice(serviceId, dateTime) {
        await delay(200);

        const service = MOCK_SERVICES.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        let finalPrice = service.base_price;
        const date = new Date(dateTime);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();

        // Weekend surcharge (Saturday = 6, Sunday = 0)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) {
            finalPrice += Math.floor(service.base_price * 0.1); // 10% weekend surcharge
        }

        // Evening surcharge (after 5 PM)
        const isEvening = hour >= 17;
        if (isEvening) {
            finalPrice += 50000; // 50k evening surcharge
        }

        // Holiday surcharge (can be enhanced with actual holiday data)
        const isHoliday = false; // Placeholder
        if (isHoliday) {
            finalPrice += Math.floor(service.base_price * 0.15); // 15% holiday surcharge
        }

        // Peak hours surcharge (10 AM - 2 PM on weekends)
        const isPeakHours = isWeekend && hour >= 10 && hour < 14;
        if (isPeakHours) {
            finalPrice += 30000; // 30k peak hours surcharge
        }

        const pricing = {
            basePrice: service.base_price,
            finalPrice,
            surcharges: [
                ...(isWeekend ? [{ type: 'weekend', amount: Math.floor(service.base_price * 0.1), description: 'Phụ phí cuối tuần (10%)' }] : []),
                ...(isEvening ? [{ type: 'evening', amount: 50000, description: 'Phụ phí buổi tối (sau 17h)' }] : []),
                ...(isPeakHours ? [{ type: 'peak', amount: 30000, description: 'Phụ phí giờ cao điểm' }] : []),
                ...(isHoliday ? [{ type: 'holiday', amount: Math.floor(service.base_price * 0.15), description: 'Phụ phí ngày lễ (15%)' }] : [])
            ],
            discount: 0, // Can be enhanced with promotional discounts
            dateTime
        };

        return { success: true, data: pricing };
    },

    // ============ MANAGER APIs ============

    // Get all services (for manager)
    async getAllServices() {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền truy cập');
        }

        return {
            success: true,
            data: MOCK_SERVICES
        };
    },

    // Create new service
    async createService(serviceData) {
        await delay(700);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền tạo dịch vụ');
        }

        // Validate required fields
        if (!serviceData.name || !serviceData.name.trim()) {
            throw new Error('Tên dịch vụ là bắt buộc');
        }

        // Transform to backend format for validation
        const backendFormat = transformToBackendFormat(serviceData);

        if (!backendFormat.duration_minutes || backendFormat.duration_minutes <= 0) {
            throw new Error('Thời gian dịch vụ phải lớn hơn 0');
        }

        if (!backendFormat.base_price || backendFormat.base_price < 0) {
            throw new Error('Giá dịch vụ không hợp lệ');
        }

        if (!backendFormat.service_type) {
            throw new Error('Loại dịch vụ là bắt buộc');
        }

        // Create new service (matching official API format)
        const newService = {
            id: generateId('service'),
            name: backendFormat.name,
            description: backendFormat.description,
            duration_minutes: backendFormat.duration_minutes,
            base_price: backendFormat.base_price,
            service_type: backendFormat.service_type,
            requires_area: backendFormat.requires_area,
            image_url: backendFormat.image_url,
            thumbnails: backendFormat.thumbnails
        };

        MOCK_SERVICES.push(newService);

        return {
            success: true,
            data: newService,
            message: 'Tạo dịch vụ thành công'
        };
    },

    // Update service
    async updateService(serviceId, updateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền cập nhật dịch vụ');
        }

        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Transform to backend format for validation
        const backendFormat = transformToBackendFormat(updateData);

        // Validate if fields are provided
        if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
            throw new Error('Tên dịch vụ không được để trống');
        }

        if (updateData.duration_minutes !== undefined) {
            if (backendFormat.duration_minutes <= 0) {
                throw new Error('Thời gian dịch vụ phải lớn hơn 0');
            }
        }

        if (updateData.base_price !== undefined) {
            if (backendFormat.base_price < 0) {
                throw new Error('Giá dịch vụ không hợp lệ');
            }
        }

        // Merge update data with existing service (official API fields only)
        const updatedFields = {};

        if (updateData.name !== undefined) updatedFields.name = updateData.name;
        if (updateData.description !== undefined) updatedFields.description = updateData.description;
        if (updateData.duration_minutes !== undefined) updatedFields.duration_minutes = backendFormat.duration_minutes;
        if (updateData.base_price !== undefined) updatedFields.base_price = backendFormat.base_price;
        if (updateData.service_type !== undefined) updatedFields.service_type = backendFormat.service_type;
        if (updateData.requires_area !== undefined) updatedFields.requires_area = backendFormat.requires_area;
        if (updateData.image_url !== undefined) updatedFields.image_url = backendFormat.image_url;
        if (updateData.thumbnails !== undefined) updatedFields.thumbnails = backendFormat.thumbnails;

        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            ...updatedFields
        };

        return {
            success: true,
            data: MOCK_SERVICES[serviceIndex],
            message: 'Cập nhật dịch vụ thành công'
        };
    },

    // Delete service (hard delete)
    async deleteService(serviceId) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền xóa dịch vụ');
        }

        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
        if (serviceIndex === -1) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Hard delete
        MOCK_SERVICES.splice(serviceIndex, 1);

        return {
            success: true,
            message: 'Xóa dịch vụ thành công'
        };
    }
};

// Service types for manager (matches backend enum)
export const SERVICE_TYPES = ['Chăm sóc & Làm đẹp', 'Huấn luyện', 'Giữ thú cưng', 'Dịch vụ Cafe'];

// Export transformer functions for external use
export { transformToBackendFormat, transformFromBackendFormat };

// Export both named and default
export { serviceApi };
export default serviceApi;
