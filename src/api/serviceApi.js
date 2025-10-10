/**
 * SERVICE API - Data Mapping & Mock Implementation
 * 
 * ============================================
 * FIELD MAPPING: FRONTEND ↔ BACKEND
 * ============================================
 * 
 * | Frontend Field | Backend Field      | Type     | Required | Description                    |
 * |----------------|-------------------|----------|----------|--------------------------------|
 * | name           | name              | string   | ✅ Yes   | Service name                   |
 * | description    | description       | string   | ⚠️ Opt   | Service description            |
 * | duration       | duration_minutes  | number   | ✅ Yes   | Service duration in minutes    |
 * | price          | base_price        | number   | ✅ Yes   | Base price in VND              |
 * | category       | service_type      | string   | ✅ Yes   | Service type/category          |
 * | petRequired    | requires_area     | boolean  | ⚠️ Opt   | Whether service requires area  |
 * | image          | image_url         | string   | ⚠️ Opt   | Main image URL                 |
 * | thumbnails     | thumbnails        | string[] | ⚠️ Opt   | Array of thumbnail URLs        |
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
 * FRONTEND SCHEMA (Current)
 * ============================================
 * {
 *   id: "string",
 *   name: "string",
 *   description: "string",
 *   duration: 90,           // minutes
 *   price: 150000,          // VND
 *   category: "Chăm sóc & Làm đẹp",
 *   petRequired: true,
 *   image: "url",
 *   thumbnails: [],
 *   status: "active",
 *   rating: 4.5,
 *   reviewCount: 128,
 *   features: [],
 *   location: "string",
 *   staffRequired: 1,
 *   autoApprove: true
 * }
 * 
 * ============================================
 * TRANSFORMER FUNCTIONS
 * ============================================
 * 
 * transformToBackendFormat(frontendService)
 * - Converts frontend service object to backend API format
 * 
 * Example:
 *   const frontendService = {
 *     name: "Tắm và chải lông",
 *     description: "Dịch vụ tắm cơ bản",
 *     duration: 90,
 *     price: 150000,
 *     category: "Chăm sóc & Làm đẹp",
 *     petRequired: true,
 *     image: "https://example.com/image.jpg"
 *   };
 * 
 *   const backendFormat = transformToBackendFormat(frontendService);
 *   // Result: {
 *   //   name: "Tắm và chải lông",
 *   //   description: "Dịch vụ tắm cơ bản",
 *   //   duration_minutes: 90,
 *   //   base_price: 150000,
 *   //   service_type: "Chăm sóc & Làm đẹp",
 *   //   requires_area: true,
 *   //   image_url: "https://example.com/image.jpg",
 *   //   thumbnails: []
 *   // }
 * 
 * transformFromBackendFormat(backendService)
 * - Converts backend API response to frontend format
 * - Maintains BOTH naming conventions for backward compatibility
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
 * VALIDATION RULES
 * ============================================
 * 1. name: Required, non-empty string
 * 2. duration_minutes: Required, must be > 0
 * 3. base_price: Required, must be >= 0
 * 4. service_type: Required, must be one of SERVICE_TYPES
 * 
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 * 
 * // Creating a Service
 * const createService = async (formData) => {
 *   try {
 *     // Frontend can use either naming convention
 *     const serviceData = {
 *       name: formData.name,
 *       description: formData.description,
 *       duration: formData.duration,        // or duration_minutes
 *       price: formData.price,              // or base_price
 *       category: formData.category,        // or service_type
 *       petRequired: formData.petRequired,  // or requires_area
 *       image: formData.image,              // or image_url
 *       thumbnails: formData.thumbnails || []
 *     };
 * 
 *     const response = await serviceApi.createService(serviceData);
 *     // Response will have both naming conventions
 *     console.log(response.data);
 *   } catch (error) {
 *     console.error('Error creating service:', error.message);
 *   }
 * };
 * 
 * // Updating a Service
 * const updateService = async (serviceId, updates) => {
 *   try {
 *     // Can mix both naming conventions
 *     const updateData = {
 *       name: updates.name,
 *       duration_minutes: updates.duration,  // Mixed convention
 *       base_price: updates.price,           // Mixed convention
 *       service_type: updates.category       // Mixed convention
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
        duration_minutes: frontendService.duration || frontendService.duration_minutes || 0,
        base_price: frontendService.price || frontendService.base_price || 0,
        service_type: frontendService.category || frontendService.service_type || 'Chăm sóc & Làm đẹp',
        requires_area: frontendService.petRequired !== undefined ? frontendService.petRequired :
            (frontendService.requires_area !== undefined ? frontendService.requires_area : false),
        image_url: frontendService.image || frontendService.image_url || '',
        thumbnails: frontendService.thumbnails || []
    };
};

// Transform backend API response to frontend format
const transformFromBackendFormat = (backendService) => {
    return {
        id: backendService.id,
        name: backendService.name,
        description: backendService.description,
        duration: backendService.duration_minutes,
        duration_minutes: backendService.duration_minutes, // Keep both for compatibility
        price: backendService.base_price,
        base_price: backendService.base_price, // Keep both for compatibility
        category: backendService.service_type,
        service_type: backendService.service_type, // Keep both for compatibility
        petRequired: backendService.requires_area,
        requires_area: backendService.requires_area, // Keep both for compatibility
        image: backendService.image_url,
        image_url: backendService.image_url, // Keep both for compatibility
        thumbnails: backendService.thumbnails || [],
        status: backendService.status || 'active',
        rating: backendService.rating || 0,
        reviewCount: backendService.review_count || backendService.reviewCount || 0,
        createdAt: backendService.created_at || backendService.createdAt,
        updatedAt: backendService.updated_at || backendService.updatedAt
    };
};

// Mock database for services
const MOCK_SERVICES = [
    {
        id: 'service-001',
        name: 'Tắm và chải lông cơ bản',
        category: 'Chăm sóc & Làm đẹp',
        subCategory: 'bathing',
        price: 150000,
        duration: 90,
        durationBySize: {
            small: 60,    // Chó/mèo nhỏ: 1 giờ
            medium: 90,   // Chó/mèo vừa: 1.5 giờ
            large: 120    // Chó lớn: 2 giờ
        },
        description: 'Tắm sạch và chải lông mượt mà cho thú cưng của bạn',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 1 - Khu Grooming',
        rating: 4.5,
        reviewCount: 128,
        features: [
            'Tắm gội với sữa tắm chuyên dụng',
            'Cắt tỉa lông theo yêu cầu',
            'Cắt móng chân an toàn',
            'Vệ sinh tai và mắt',
            'Sấy khô và chải lông'
        ],
        staffRequired: 1,
        autoApprove: true
    },
    {
        id: 'service-002',
        name: 'Cắt tỉa lông chuyên nghiệp',
        category: 'Chăm sóc & Làm đẹp',
        subCategory: 'trimming',
        price: 300000,
        duration: 120,
        durationByBreed: {
            'Poodle': 180,
            'Golden Retriever': 150,
            'Husky': 120,
            'Chihuahua': 60,
            'Persian': 150,
            'British Shorthair': 90,
            default: 120
        },
        description: 'Cắt tỉa lông chuyên nghiệp theo kiểu dáng và giống thú cưng',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 1 - Khu VIP',
        rating: 4.8,
        reviewCount: 89,
        features: [
            'Tắm gội cao cấp với tinh dầu thảo mộc',
            'Cắt tỉa lông theo phong cách',
            'Spa thư giãn và massage',
            'Vệ sinh toàn diện',
            'Sấy tạo kiểu chuyên nghiệp',
            'Nước hoa thú cưng'
        ],
        staffRequired: 2,
        autoApprove: false
    },
    {
        id: 'service-003',
        name: 'Daycare theo ngày',
        category: 'Giữ thú cưng',
        price: 200000,
        duration: 480,
        description: 'Chăm sóc thú cưng cả ngày với hoạt động vui chơi',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 2 - Khu vui chơi',
        rating: 4.6,
        reviewCount: 156,
        features: [
            'Chăm sóc 8 tiếng liên tục',
            'Hoạt động vui chơi theo nhóm',
            'Bữa ăn và nước uống',
            'Giám sát sức khỏe thường xuyên',
            'Báo cáo hàng ngày cho chủ',
            'Không gian an toàn và sạch sẽ'
        ],
        staffRequired: 2,
        autoApprove: true,
        maxCapacity: 15
    },
    {
        id: 'service-004',
        name: 'Trải nghiệm huấn luyện thú cưng',
        category: 'Huấn luyện',
        price: 500000,
        duration: 60,
        description: 'Trải nghiệm huấn luyện cùng thú cưng được đào tạo của quán, học cách giao tiếp và hiểu thú cưng',
        subCategory: 'experience',
        petRequired: false, // Sử dụng pet của quán
        includesPets: ['Chó Golden "Buddy"', 'Chó Labrador "Luna"', 'Mèo British "Milo"'],
        maxParticipants: 4,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 3 - Sân tập',
        rating: 4.7,
        reviewCount: 73,
        features: [
            'Tương tác với thú cưng được huấn luyện của quán',
            'Học các lệnh cơ bản (ngồi, nằm, đứng, lại đây)',
            'Trải nghiệm cho ăn và chơi đùa cùng pet',
            'Hiểu về tâm lý và hành vi thú cưng',
            'Hướng dẫn cách chăm sóc thú cưng đúng cách',
            'Chụp ảnh kỷ niệm với các bé'
        ],
        petRequired: false, // Sử dụng pet của quán
        includesPets: ['Chó Golden "Buddy"', 'Chó Labrador "Luna"', 'Mèo British "Milo"'],
        maxParticipants: 4,
        staffRequired: 1,
        autoApprove: false,
        requiresConsultation: true
    },
    {
        id: 'service-005',
        name: 'Tắm và vệ sinh nhanh',
        category: 'Chăm sóc & Làm đẹp',
        price: 80000,
        duration: 30,
        description: 'Dịch vụ tắm và vệ sinh nhanh cho thú cưng',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 1 - Khu tắm nhanh',
        rating: 4.3,
        reviewCount: 201,
        features: [
            'Tắm gội nhanh chóng',
            'Vệ sinh tai, mắt cơ bản',
            'Sấy khô',
            'Phù hợp cho thú cưng nhỏ'
        ],
        staffRequired: 1,
        autoApprove: true
    },
    {
        id: 'service-008',
        name: 'Tương tác với thú cưng cafe',
        category: 'Dịch vụ Cafe',
        price: 100000,
        duration: 30,
        description: 'Trải nghiệm tương tác và chơi đùa với các thú cưng đáng yêu của cafe',
        petRequired: false,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 2 - Khu tương tác',
        rating: 4.9,
        reviewCount: 267,
        features: [
            'Tương tác với nhiều loài thú cưng',
            'Chụp ảnh kỷ niệm',
            'Học cách chăm sóc thú cưng',
            'Môi trường thân thiện và an toàn',
            'Hướng dẫn viên chuyên nghiệp'
        ],
        staffRequired: 1,
        autoApprove: true,
        maxParticipants: 6,
        // Thời gian diễn ra: 09:00-16:00 từ 10/10/2025 đến 15/10/2025
        // Thời gian đăng ký: 09:00-17:00 từ 01/10/2025 đến 07/10/2025
        serviceStartDate: '2025-10-10',
        serviceEndDate: '2025-10-15',
        serviceStartTime: 9 * 60, // 09:00
        serviceEndTime: 16 * 60,  // 16:00
        registrationStartDate: '2025-10-01',
        registrationEndDate: '2025-10-07',
        registrationStartTime: 9 * 60,  // 09:00
        registrationEndTime: 17 * 60   // 17:00
    },
    {
        id: 'service-009',
        name: 'Workshop chăm sóc thú cưng cơ bản',
        category: 'Dịch vụ Cafe',
        price: 200000,
        duration: 120,
        description: 'Học các kỹ thuật chăm sóc thú cưng cơ bản từ các chuyên gia',
        petRequired: false,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 3 - Phòng workshop',
        rating: 4.8,
        reviewCount: 89,
        features: [
            'Học cách tắm và chải lông đúng cách',
            'Kỹ thuật cắt móng an toàn',
            'Nhận biết dấu hiệu sức khỏe',
            'Chế độ dinh dưỡng hợp lý',
            'Tài liệu hướng dẫn chi tiết'
        ],
        staffRequired: 2,
        autoApprove: true,
        maxParticipants: 12,
        // Thời gian diễn ra: 10:00-17:00 từ 12/10/2025 đến 17/10/2025
        // Thời gian đăng ký: 09:00-17:00 từ 05/10/2025 đến 10/10/2025
        serviceStartDate: '2025-10-12',
        serviceEndDate: '2025-10-17',
        serviceStartTime: 10 * 60, // 10:00
        serviceEndTime: 17 * 60,   // 17:00
        registrationStartDate: '2025-10-05',
        registrationEndDate: '2025-10-10',
        registrationStartTime: 9 * 60,   // 09:00
        registrationEndTime: 17 * 60     // 17:00
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

        let services = MOCK_SERVICES.filter(service => service.status === 'active');

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            services = services.filter(service => service.category === filters.category);
        }

        if (filters.priceMin) {
            services = services.filter(service => service.price >= filters.priceMin);
        }

        if (filters.priceMax) {
            services = services.filter(service => service.price <= filters.priceMax);
        }

        if (filters.minRating) {
            services = services.filter(service => (service.rating || 0) >= filters.minRating);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            services = services.filter(service =>
                service.name.toLowerCase().includes(searchTerm) ||
                service.description.toLowerCase().includes(searchTerm) ||
                service.features.some(feature => feature.toLowerCase().includes(searchTerm))
            );
        }

        // Sort services
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    services.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    services.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    services.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'duration':
                    services.sort((a, b) => a.duration - b.duration);
                    break;
                case 'popular':
                    services.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
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

        if (service.status !== 'active') {
            throw new Error('Dịch vụ hiện không khả dụng');
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

        const popularServices = MOCK_SERVICES
            .filter(service => service.status === 'active')
            .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
            .slice(0, limit);

        return { success: true, data: popularServices };
    },

    // Get services by category
    async getServicesByCategory(category) {
        await delay(200);

        const services = MOCK_SERVICES.filter(service =>
            service.status === 'active' && service.category === category
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
            if (service.status !== 'active') return false;

            return (
                service.name.toLowerCase().includes(term) ||
                service.description.toLowerCase().includes(term) ||
                service.features.some(feature => feature.toLowerCase().includes(term)) ||
                service.category.toLowerCase().includes(term)
            );
        });

        // Apply additional filters
        if (filters.category && filters.category !== 'all') {
            services = services.filter(service => service.category === filters.category);
        }

        if (filters.priceRange) {
            const [min, max] = filters.priceRange;
            services = services.filter(service => service.price >= min && service.price <= max);
        }

        if (filters.minRating) {
            services = services.filter(service => (service.rating || 0) >= filters.minRating);
        }

        // Sort by relevance (can be enhanced with better scoring algorithm)
        services.sort((a, b) => {
            const aScore = (
                (a.name.toLowerCase().includes(term) ? 3 : 0) +
                (a.description.toLowerCase().includes(term) ? 2 : 0) +
                (a.features.some(f => f.toLowerCase().includes(term)) ? 1 : 0)
            );
            const bScore = (
                (b.name.toLowerCase().includes(term) ? 3 : 0) +
                (b.description.toLowerCase().includes(term) ? 2 : 0) +
                (b.features.some(f => f.toLowerCase().includes(term)) ? 1 : 0)
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

        let finalPrice = service.price;
        const date = new Date(dateTime);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();

        // Weekend surcharge (Saturday = 6, Sunday = 0)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) {
            finalPrice += Math.floor(service.price * 0.1); // 10% weekend surcharge
        }

        // Evening surcharge (after 5 PM)
        const isEvening = hour >= 17;
        if (isEvening) {
            finalPrice += 50000; // 50k evening surcharge
        }

        // Holiday surcharge (can be enhanced with actual holiday data)
        const isHoliday = false; // Placeholder
        if (isHoliday) {
            finalPrice += Math.floor(service.price * 0.15); // 15% holiday surcharge
        }

        // Peak hours surcharge (10 AM - 2 PM on weekends)
        const isPeakHours = isWeekend && hour >= 10 && hour < 14;
        if (isPeakHours) {
            finalPrice += 30000; // 30k peak hours surcharge
        }

        const pricing = {
            basePrice: service.price,
            finalPrice,
            surcharges: [
                ...(isWeekend ? [{ type: 'weekend', amount: Math.floor(service.price * 0.1), description: 'Phụ phí cuối tuần (10%)' }] : []),
                ...(isEvening ? [{ type: 'evening', amount: 50000, description: 'Phụ phí buổi tối (sau 17h)' }] : []),
                ...(isPeakHours ? [{ type: 'peak', amount: 30000, description: 'Phụ phí giờ cao điểm' }] : []),
                ...(isHoliday ? [{ type: 'holiday', amount: Math.floor(service.price * 0.15), description: 'Phụ phí ngày lễ (15%)' }] : [])
            ],
            discount: 0, // Can be enhanced with promotional discounts
            dateTime
        };

        return { success: true, data: pricing };
    },

    // Update service rating (internal use)
    updateServiceRating(serviceId, newRating) {
        const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
        if (serviceIndex !== -1) {
            const service = MOCK_SERVICES[serviceIndex];
            const currentTotal = (service.rating || 0) * (service.reviewCount || 0);
            const newReviewCount = (service.reviewCount || 0) + 1;
            const updatedRating = (currentTotal + newRating) / newReviewCount;

            MOCK_SERVICES[serviceIndex].rating = Math.round(updatedRating * 10) / 10;
            MOCK_SERVICES[serviceIndex].reviewCount = newReviewCount;

            return MOCK_SERVICES[serviceIndex];
        }
        return null;
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

        // Create new service in frontend format (for mock database compatibility)
        const newService = {
            id: generateId('service'),
            name: serviceData.name,
            description: serviceData.description || '',
            duration: backendFormat.duration_minutes,
            duration_minutes: backendFormat.duration_minutes, // Keep both formats
            price: backendFormat.base_price,
            base_price: backendFormat.base_price, // Keep both formats
            category: backendFormat.service_type,
            service_type: backendFormat.service_type, // Keep both formats
            petRequired: backendFormat.requires_area,
            requires_area: backendFormat.requires_area, // Keep both formats
            image: backendFormat.image_url,
            image_url: backendFormat.image_url, // Keep both formats
            thumbnails: backendFormat.thumbnails || [],
            status: 'active',
            rating: 0,
            reviewCount: 0,
            features: serviceData.features || [],
            location: serviceData.location || '',
            staffRequired: serviceData.staffRequired || 1,
            autoApprove: serviceData.autoApprove !== undefined ? serviceData.autoApprove : true,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
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

        if (updateData.duration !== undefined || updateData.duration_minutes !== undefined) {
            if (backendFormat.duration_minutes <= 0) {
                throw new Error('Thời gian dịch vụ phải lớn hơn 0');
            }
        }

        if (updateData.price !== undefined || updateData.base_price !== undefined) {
            if (backendFormat.base_price < 0) {
                throw new Error('Giá dịch vụ không hợp lệ');
            }
        }

        // Merge update data with existing service (support both formats)
        const updatedFields = {};

        if (updateData.name !== undefined) updatedFields.name = updateData.name;
        if (updateData.description !== undefined) updatedFields.description = updateData.description;

        if (updateData.duration !== undefined || updateData.duration_minutes !== undefined) {
            updatedFields.duration = backendFormat.duration_minutes;
            updatedFields.duration_minutes = backendFormat.duration_minutes;
        }

        if (updateData.price !== undefined || updateData.base_price !== undefined) {
            updatedFields.price = backendFormat.base_price;
            updatedFields.base_price = backendFormat.base_price;
        }

        if (updateData.category !== undefined || updateData.service_type !== undefined) {
            updatedFields.category = backendFormat.service_type;
            updatedFields.service_type = backendFormat.service_type;
        }

        if (updateData.petRequired !== undefined || updateData.requires_area !== undefined) {
            updatedFields.petRequired = backendFormat.requires_area;
            updatedFields.requires_area = backendFormat.requires_area;
        }

        if (updateData.image !== undefined || updateData.image_url !== undefined) {
            updatedFields.image = backendFormat.image_url;
            updatedFields.image_url = backendFormat.image_url;
        }

        if (updateData.thumbnails !== undefined) {
            updatedFields.thumbnails = backendFormat.thumbnails;
        }

        // Apply other fields that don't need transformation
        if (updateData.features !== undefined) updatedFields.features = updateData.features;
        if (updateData.location !== undefined) updatedFields.location = updateData.location;
        if (updateData.staffRequired !== undefined) updatedFields.staffRequired = updateData.staffRequired;
        if (updateData.autoApprove !== undefined) updatedFields.autoApprove = updateData.autoApprove;
        if (updateData.status !== undefined) updatedFields.status = updateData.status;

        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.id
        };

        return {
            success: true,
            data: MOCK_SERVICES[serviceIndex],
            message: 'Cập nhật dịch vụ thành công'
        };
    },

    // Delete service
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

        // Soft delete - just mark as inactive
        MOCK_SERVICES[serviceIndex].status = 'inactive';
        MOCK_SERVICES[serviceIndex].deletedAt = new Date().toISOString();
        MOCK_SERVICES[serviceIndex].deletedBy = currentUser.id;

        // Or hard delete (uncomment if needed)
        // MOCK_SERVICES.splice(serviceIndex, 1);

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
