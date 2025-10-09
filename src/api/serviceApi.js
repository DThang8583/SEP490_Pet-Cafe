import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Mock database for services
const MOCK_SERVICES = [
    {
        id: 'service-001',
        name: 'Tắm và chải lông cơ bản',
        category: 'grooming',
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
        category: 'grooming',
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
        category: 'daycare',
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
        category: 'training',
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
        name: 'Khám sức khỏe tổng quát',
        category: 'healthcare',
        price: 350000,
        duration: 45,
        description: 'Khám sức khỏe tổng quát và tư vấn chăm sóc',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 1 - Phòng khám',
        rating: 4.9,
        reviewCount: 94,
        features: [
            'Khám lâm sàng toàn diện',
            'Kiểm tra các chỉ số sinh hiệu',
            'Tư vấn dinh dưỡng và chăm sóc',
            'Lập kế hoạch tiêm phòng',
            'Báo cáo sức khỏe chi tiết'
        ],
        staffRequired: 1,
        autoApprove: false,
        requiresVet: true
    },
    {
        id: 'service-006',
        name: 'Tắm và vệ sinh nhanh',
        category: 'grooming',
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
        id: 'service-007',
        name: 'Chăm sóc đặc biệt',
        category: 'healthcare',
        price: 450000,
        duration: 90,
        description: 'Chăm sóc đặc biệt cho thú cưng già hoặc có vấn đề sức khỏe',
        petRequired: true,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1601758003122-479da8c9f621?q=80&w=800&auto=format&fit=crop',
        location: 'Tầng 1 - Phòng chăm sóc đặc biệt',
        rating: 4.8,
        reviewCount: 45,
        features: [
            'Chăm sóc chuyên biệt cho thú cưng già',
            'Theo dõi sức khỏe liên tục',
            'Môi trường yên tĩnh và thoải mái',
            'Nhân viên có kinh nghiệm cao',
            'Báo cáo chi tiết cho chủ'
        ],
        staffRequired: 2,
        autoApprove: false,
        requiresVet: true
    },
    {
        id: 'service-008',
        name: 'Tương tác với thú cưng cafe',
        category: 'cafe_service',
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
        category: 'cafe_service',
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
        id: 'grooming',
        name: 'Grooming & Chăm sóc',
        description: 'Dịch vụ tắm gội, cắt tỉa lông và chăm sóc ngoại hình',
        icon: 'spa',
        color: '#4CAF50'
    },
    {
        id: 'training',
        name: 'Huấn luyện',
        description: 'Dịch vụ huấn luyện và giáo dục thú cưng',
        icon: 'school',
        color: '#2196F3'
    },
    {
        id: 'healthcare',
        name: 'Chăm sóc sức khỏe',
        description: 'Dịch vụ khám sức khỏe và chăm sóc y tế',
        icon: 'local_hospital',
        color: '#F44336'
    },
    {
        id: 'daycare',
        name: 'Giữ thú cưng',
        description: 'Dịch vụ giữ và chăm sóc thú cưng theo giờ/ngày',
        icon: 'home',
        color: '#FF9800'
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

        const newService = {
            id: generateId('service'),
            ...serviceData,
            status: 'active',
            rating: 0,
            reviewCount: 0,
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

        MOCK_SERVICES[serviceIndex] = {
            ...MOCK_SERVICES[serviceIndex],
            ...updateData,
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

// Service types for manager
export const SERVICE_TYPES = ['Training', 'Spa', 'Grooming', 'Entertainment', 'Consultation', 'Photography', 'Healthcare', 'Daycare', 'Cafe_Service'];

// Export both named and default
export { serviceApi };
export default serviceApi;
