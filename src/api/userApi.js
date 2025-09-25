// User API with Role-Based Access Control
// Roles: Manager, Sales Staff, Working Staff, Customer

// Mock database with hardcore data
const MOCK_DATABASE = {
    users: [
        // Managers
        {
            id: 'user-001',
            username: 'manager.admin',
            email: 'admin@petcafe.com',
            password: 'admin123',
            role: 'manager',
            name: 'Nguyễn Thị Quản Lý',
            phone: '0901234567',
            address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
            birthDate: '1985-03-15',
            avatar: '',
            status: 'active',
            permissions: [
                'staff_management',
                'pet_management',
                'service_management',
                'report_access',
                'revenue_tracking',
                'full_access'
            ],
            createdAt: '2023-01-01',
            lastLogin: '2024-01-20'
        },
        {
            id: 'user-002',
            username: 'manager.petcare',
            email: 'manager@petcafe.com',
            password: 'manager123',
            role: 'manager',
            name: 'Trần Văn Giám Đốc',
            phone: '0912345678',
            address: '456 Lê Văn Việt, Q.9, TP.HCM',
            birthDate: '1980-07-22',
            avatar: '',
            status: 'active',
            permissions: [
                'staff_management',
                'pet_management',
                'service_management',
                'report_access',
                'revenue_tracking',
                'full_access'
            ],
            createdAt: '2023-02-15',
            lastLogin: '2024-01-19'
        },

        // Sales Staff
        {
            id: 'user-003',
            username: 'sales.alice',
            email: 'alice@petcafe.com',
            password: 'sales123',
            role: 'sales_staff',
            name: 'Lê Thị Bán Hàng',
            phone: '0923456789',
            address: '789 Điện Biên Phủ, Q.1, TP.HCM',
            birthDate: '1990-11-08',
            avatar: '',
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-03-10',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 25600000,
                monthlyTarget: 15000000,
                completedOrders: 156,
                customerRating: 4.8
            }
        },
        {
            id: 'user-004',
            username: 'sales.bob',
            email: 'bob@petcafe.com',
            password: 'sales456',
            role: 'sales_staff',
            name: 'Phạm Văn Kinh Doanh',
            phone: '0934567890',
            address: '321 Cách Mạng Tháng 8, Q.3, TP.HCM',
            birthDate: '1988-05-14',
            avatar: '',
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-04-05',
            lastLogin: '2024-01-18',
            salesStats: {
                totalSales: 18900000,
                monthlyTarget: 15000000,
                completedOrders: 134,
                customerRating: 4.7
            }
        },

        // Working Staff
        {
            id: 'user-005',
            username: 'staff.charlie',
            email: 'charlie@petcafe.com',
            password: 'staff123',
            role: 'working_staff',
            name: 'Hoàng Thị Chăm Sóc',
            phone: '0945678901',
            address: '654 Võ Văn Tần, Q.3, TP.HCM',
            birthDate: '1992-12-25',
            avatar: '',
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-05-20',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 12,
                completedTasks: 8,
                activePets: 15,
                specialization: 'Chăm sóc chó'
            }
        },
        {
            id: 'user-006',
            username: 'staff.diana',
            email: 'diana@petcafe.com',
            password: 'staff456',
            role: 'working_staff',
            name: 'Vũ Văn Thú Y',
            phone: '0956789012',
            address: '987 Pasteur, Q.1, TP.HCM',
            birthDate: '1991-04-18',
            avatar: '',
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-06-10',
            lastLogin: '2024-01-19',
            workStats: {
                assignedTasks: 18,
                completedTasks: 14,
                activePets: 22,
                specialization: 'Chăm sóc mèo'
            }
        },

        // Customers
        {
            id: 'user-007',
            username: 'customer.eva',
            email: 'eva@gmail.com',
            password: 'customer123',
            role: 'customer',
            name: 'Nguyễn Thị Lan Anh',
            phone: '0967890123',
            address: '147 Hai Bà Trưng, Q.1, TP.HCM',
            birthDate: '1995-09-30',
            avatar: '',
            status: 'active',
            permissions: [
                'service_booking',
                'product_purchase',
                'feedback_submission',
                'notification_receive'
            ],
            createdAt: '2023-07-15',
            lastLogin: '2024-01-20',
            customerProfile: {
                membershipLevel: 'VIP',
                totalSpent: 3500000,
                visitCount: 47,
                pets: ['pet-001', 'pet-002'],
                favoriteServices: ['grooming', 'daycare'],
                loyaltyPoints: 350
            }
        },
        {
            id: 'user-008',
            username: 'customer.frank',
            email: 'frank@yahoo.com',
            password: 'customer456',
            role: 'customer',
            name: 'Trần Văn Hùng',
            phone: '0978901234',
            address: '258 Lý Tự Trọng, Q.1, TP.HCM',
            birthDate: '1987-01-12',
            avatar: '',
            status: 'active',
            permissions: [
                'service_booking',
                'product_purchase',
                'feedback_submission',
                'notification_receive'
            ],
            createdAt: '2023-08-20',
            lastLogin: '2024-01-18',
            customerProfile: {
                membershipLevel: 'Gold',
                totalSpent: 1800000,
                visitCount: 23,
                pets: ['pet-003'],
                favoriteServices: ['training', 'healthcare'],
                loyaltyPoints: 180
            }
        }
    ],

    pets: [
        {
            id: 'pet-001',
            name: 'Bông',
            type: 'Chó',
            breed: 'Golden Retriever',
            age: 3,
            gender: 'Cái',
            ownerId: 'user-007',
            status: 'healthy',
            lastCheckup: '2024-01-15',
            services: ['grooming', 'daycare'],
            notes: 'Rất thân thiện, thích chạy nhảy'
        },
        {
            id: 'pet-002',
            name: 'Miu',
            type: 'Mèo',
            breed: 'Scottish Fold',
            age: 2,
            gender: 'Đực',
            ownerId: 'user-007',
            status: 'healthy',
            lastCheckup: '2024-01-10',
            services: ['grooming'],
            notes: 'Ngủ nhiều, thích được vuốt ve'
        },
        {
            id: 'pet-003',
            name: 'Rex',
            type: 'Chó',
            breed: 'German Shepherd',
            age: 4,
            gender: 'Đực',
            ownerId: 'user-008',
            status: 'healthy',
            lastCheckup: '2024-01-12',
            services: ['training', 'healthcare'],
            notes: 'Thông minh, cần luyện tập thường xuyên'
        }
    ],

    services: [
        {
            id: 'service-001',
            name: 'Grooming cơ bản',
            category: 'grooming',
            price: 150000,
            duration: 90,
            description: 'Tắm, cắt tỉa lông, cắt móng',
            status: 'active'
        },
        {
            id: 'service-002',
            name: 'Grooming cao cấp',
            category: 'grooming',
            price: 300000,
            duration: 120,
            description: 'Tắm, cắt tỉa lông, spa, massage',
            status: 'active'
        },
        {
            id: 'service-003',
            name: 'Daycare theo ngày',
            category: 'daycare',
            price: 200000,
            duration: 480,
            description: 'Chăm sóc, vui chơi cả ngày',
            status: 'active'
        },
        {
            id: 'service-004',
            name: 'Huấn luyện cơ bản',
            category: 'training',
            price: 500000,
            duration: 60,
            description: 'Huấn luyện các lệnh cơ bản',
            status: 'active'
        },
        {
            id: 'service-005',
            name: 'Khám sức khỏe',
            category: 'healthcare',
            price: 350000,
            duration: 45,
            description: 'Khám tổng quát, tư vấn sức khỏe',
            status: 'active'
        }
    ],

    products: [
        {
            id: 'product-001',
            name: 'Thức ăn cho chó Royal Canin',
            category: 'food',
            price: 450000,
            stock: 50,
            description: 'Thức ăn khô cao cấp cho chó 5kg',
            image: '',
            status: 'active'
        },
        {
            id: 'product-002',
            name: 'Thức ăn cho mèo Whiskas',
            category: 'food',
            price: 280000,
            stock: 30,
            description: 'Thức ăn khô cho mèo 3kg',
            image: '',
            status: 'active'
        },
        {
            id: 'product-003',
            name: 'Đồ chơi bóng cao su',
            category: 'toy',
            price: 85000,
            stock: 100,
            description: 'Bóng cao su an toàn cho thú cưng',
            image: '',
            status: 'active'
        }
    ],

    bookings: [
        {
            id: 'booking-001',
            customerId: 'user-007',
            petId: 'pet-001',
            serviceId: 'service-001',
            staffId: 'user-005',
            date: '2024-01-25',
            time: '09:00',
            status: 'confirmed',
            notes: 'Pet rất hiếu động',
            createdAt: '2024-01-20'
        },
        {
            id: 'booking-002',
            customerId: 'user-008',
            petId: 'pet-003',
            serviceId: 'service-004',
            staffId: 'user-006',
            date: '2024-01-26',
            time: '14:00',
            status: 'pending',
            notes: 'Cần huấn luyện ngồi, nằm',
            createdAt: '2024-01-19'
        }
    ],

    tasks: [
        {
            id: 'task-001',
            title: 'Grooming cho Bông',
            description: 'Tắm và cắt tỉa lông cho chó Golden Retriever',
            assignedTo: 'user-005',
            petId: 'pet-001',
            bookingId: 'booking-001',
            dueDate: '2024-01-25',
            status: 'in_progress',
            priority: 'medium',
            createdAt: '2024-01-20'
        },
        {
            id: 'task-002',
            title: 'Huấn luyện Rex',
            description: 'Dạy các lệnh cơ bản cho German Shepherd',
            assignedTo: 'user-006',
            petId: 'pet-003',
            bookingId: 'booking-002',
            dueDate: '2024-01-26',
            status: 'pending',
            priority: 'high',
            createdAt: '2024-01-19'
        }
    ],

    revenue: {
        daily: [
            { date: '2024-01-20', services: 850000, products: 340000, total: 1190000 },
            { date: '2024-01-19', services: 650000, products: 180000, total: 830000 },
            { date: '2024-01-18', services: 1200000, products: 520000, total: 1720000 }
        ],
        monthly: [
            { month: '2024-01', services: 15000000, products: 8500000, total: 23500000 },
            { month: '2023-12', services: 18000000, products: 9200000, total: 27200000 },
            { month: '2023-11', services: 16500000, products: 7800000, total: 24300000 }
        ]
    },

    reports: {
        petStatus: {
            healthy: 45,
            sick: 3,
            recovering: 2,
            total: 50
        },
        serviceUsage: {
            grooming: 35,
            daycare: 20,
            training: 15,
            healthcare: 10
        },
        customerSatisfaction: {
            excellent: 78,
            good: 15,
            average: 5,
            poor: 2
        }
    }
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const checkPermission = (user, permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission) || user.permissions.includes('full_access');
};

const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
};

const setCurrentUser = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
};

// Authentication APIs
export const authApi = {
    // Login
    async login(credentials) {
        await delay(500);

        const { email, password } = credentials;
        const user = MOCK_DATABASE.users.find(u =>
            (u.email === email || u.username === email) && u.password === password
        );

        if (!user) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        if (user.status !== 'active') {
            throw new Error('Tài khoản đã bị khóa');
        }

        // Update last login
        user.lastLogin = new Date().toISOString().split('T')[0];

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        setCurrentUser(userWithoutPassword);

        return {
            success: true,
            user: userWithoutPassword,
            token: `mock-token-${user.id}`,
            message: 'Đăng nhập thành công'
        };
    },

    // Register (Customer only)
    async register(userData) {
        await delay(700);

        const { email, username, phone } = userData;

        // Check if user already exists
        const existingUser = MOCK_DATABASE.users.find(u =>
            u.email === email || u.username === username || u.phone === phone
        );

        if (existingUser) {
            throw new Error('Email, tên đăng nhập hoặc số điện thoại đã được sử dụng');
        }

        const newUser = {
            id: generateId('user'),
            ...userData,
            role: 'customer',
            status: 'active',
            permissions: [
                'service_booking',
                'product_purchase',
                'feedback_submission',
                'notification_receive'
            ],
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString().split('T')[0],
            customerProfile: {
                membershipLevel: 'Bronze',
                totalSpent: 0,
                visitCount: 0,
                pets: [],
                favoriteServices: [],
                loyaltyPoints: 0
            }
        };

        MOCK_DATABASE.users.push(newUser);

        const { password: _, ...userWithoutPassword } = newUser;

        return {
            success: true,
            user: userWithoutPassword,
            message: 'Đăng ký thành công'
        };
    },

    // Logout
    async logout() {
        await delay(200);
        localStorage.removeItem('currentUser');
        return { success: true, message: 'Đăng xuất thành công' };
    },

    // Get current user
    getCurrentUser() {
        return getCurrentUser();
    }
};

// Manager APIs
export const managerApi = {
    // Staff Management
    async getStaff() {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'staff_management')) {
            throw new Error('Không có quyền truy cập');
        }

        const staff = MOCK_DATABASE.users.filter(u =>
            u.role === 'sales_staff' || u.role === 'working_staff'
        );

        return { success: true, data: staff };
    },

    async createStaff(staffData) {
        await delay(700);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'staff_management')) {
            throw new Error('Không có quyền tạo nhân viên');
        }

        const newStaff = {
            id: generateId('user'),
            ...staffData,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: null
        };

        // Set permissions based on role
        if (staffData.role === 'sales_staff') {
            newStaff.permissions = [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ];
            newStaff.salesStats = {
                totalSales: 0,
                monthlyTarget: 15000000,
                completedOrders: 0,
                customerRating: 0
            };
        } else if (staffData.role === 'working_staff') {
            newStaff.permissions = [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ];
            newStaff.workStats = {
                assignedTasks: 0,
                completedTasks: 0,
                activePets: 0,
                specialization: staffData.specialization || 'Chăm sóc tổng quát'
            };
        }

        MOCK_DATABASE.users.push(newStaff);

        return { success: true, data: newStaff, message: 'Tạo nhân viên thành công' };
    },

    async updateStaff(staffId, updateData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'staff_management')) {
            throw new Error('Không có quyền cập nhật nhân viên');
        }

        const staffIndex = MOCK_DATABASE.users.findIndex(u => u.id === staffId);
        if (staffIndex === -1) {
            throw new Error('Không tìm thấy nhân viên');
        }

        MOCK_DATABASE.users[staffIndex] = {
            ...MOCK_DATABASE.users[staffIndex],
            ...updateData
        };

        return {
            success: true,
            data: MOCK_DATABASE.users[staffIndex],
            message: 'Cập nhật nhân viên thành công'
        };
    },

    // Pet Management
    async getAllPets() {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền truy cập');
        }

        return { success: true, data: MOCK_DATABASE.pets };
    },

    // Service Management
    async getServices() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền truy cập');
        }

        return { success: true, data: MOCK_DATABASE.services };
    },

    async createService(serviceData) {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_management')) {
            throw new Error('Không có quyền tạo dịch vụ');
        }

        const newService = {
            id: generateId('service'),
            ...serviceData,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0]
        };

        MOCK_DATABASE.services.push(newService);

        return { success: true, data: newService, message: 'Tạo dịch vụ thành công' };
    },

    // Reports
    async getReports() {
        await delay(800);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'report_access')) {
            throw new Error('Không có quyền xem báo cáo');
        }

        return { success: true, data: MOCK_DATABASE.reports };
    },

    // Revenue Tracking
    async getRevenue(period = 'monthly') {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'revenue_tracking')) {
            throw new Error('Không có quyền xem doanh thu');
        }

        const revenueData = period === 'daily'
            ? MOCK_DATABASE.revenue.daily
            : MOCK_DATABASE.revenue.monthly;

        return { success: true, data: revenueData };
    }
};

// Sales Staff APIs
export const salesApi = {
    // Product Sales
    async getProducts() {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_sales')) {
            throw new Error('Không có quyền truy cập sản phẩm');
        }

        return { success: true, data: MOCK_DATABASE.products };
    },

    async createOrder(orderData) {
        await delay(700);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_sales')) {
            throw new Error('Không có quyền tạo đơn hàng');
        }

        const newOrder = {
            id: generateId('order'),
            ...orderData,
            salesStaffId: currentUser.id,
            status: 'processing',
            createdAt: new Date().toISOString(),
            total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        // Update sales stats
        const staffIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (staffIndex !== -1 && MOCK_DATABASE.users[staffIndex].salesStats) {
            MOCK_DATABASE.users[staffIndex].salesStats.totalSales += newOrder.total;
            MOCK_DATABASE.users[staffIndex].salesStats.completedOrders += 1;
        }

        return { success: true, data: newOrder, message: 'Tạo đơn hàng thành công' };
    },

    // Invoice Management
    async getInvoices() {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'invoice_management')) {
            throw new Error('Không có quyền xem hóa đơn');
        }

        // Mock invoices data
        const invoices = [
            {
                id: 'invoice-001',
                customerId: 'user-007',
                salesStaffId: 'user-003',
                items: [
                    { productId: 'product-001', quantity: 1, price: 450000 }
                ],
                total: 450000,
                status: 'paid',
                createdAt: '2024-01-20'
            }
        ];

        return { success: true, data: invoices };
    },

    // Customer Support
    async getCustomers() {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'customer_support')) {
            throw new Error('Không có quyền xem khách hàng');
        }

        const customers = MOCK_DATABASE.users.filter(u => u.role === 'customer');
        return { success: true, data: customers };
    }
};

// Working Staff APIs
export const workingStaffApi = {
    // Task Management
    async getTasks() {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền xem task');
        }

        const userTasks = MOCK_DATABASE.tasks.filter(task =>
            task.assignedTo === currentUser.id
        );

        return { success: true, data: userTasks };
    },

    async updateTaskStatus(taskId, status) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'task_management')) {
            throw new Error('Không có quyền cập nhật task');
        }

        const taskIndex = MOCK_DATABASE.tasks.findIndex(task =>
            task.id === taskId && task.assignedTo === currentUser.id
        );

        if (taskIndex === -1) {
            throw new Error('Không tìm thấy task hoặc không có quyền cập nhật');
        }

        MOCK_DATABASE.tasks[taskIndex].status = status;

        // Update work stats
        const staffIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (staffIndex !== -1 && MOCK_DATABASE.users[staffIndex].workStats) {
            if (status === 'completed') {
                MOCK_DATABASE.users[staffIndex].workStats.completedTasks += 1;
            }
        }

        return {
            success: true,
            data: MOCK_DATABASE.tasks[taskIndex],
            message: 'Cập nhật task thành công'
        };
    },

    // Pet Status Update
    async updatePetStatus(petId, statusData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_status_update')) {
            throw new Error('Không có quyền cập nhật trạng thái thú cưng');
        }

        const petIndex = MOCK_DATABASE.pets.findIndex(pet => pet.id === petId);
        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        MOCK_DATABASE.pets[petIndex] = {
            ...MOCK_DATABASE.pets[petIndex],
            ...statusData,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser.id
        };

        return {
            success: true,
            data: MOCK_DATABASE.pets[petIndex],
            message: 'Cập nhật trạng thái thú cưng thành công'
        };
    },

    // Service Execution
    async getAssignedServices() {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_execution')) {
            throw new Error('Không có quyền xem dịch vụ được giao');
        }

        const assignedBookings = MOCK_DATABASE.bookings.filter(booking =>
            booking.staffId === currentUser.id
        );

        return { success: true, data: assignedBookings };
    }
};

// Customer APIs
export const customerApi = {
    // Service Booking
    async getAvailableServices() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền đặt dịch vụ');
        }

        const activeServices = MOCK_DATABASE.services.filter(service =>
            service.status === 'active'
        );

        return { success: true, data: activeServices };
    },

    async createBooking(bookingData) {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền đặt dịch vụ');
        }

        const newBooking = {
            id: generateId('booking'),
            ...bookingData,
            customerId: currentUser.id,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        MOCK_DATABASE.bookings.push(newBooking);

        // Update customer visit count
        const customerIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (customerIndex !== -1 && MOCK_DATABASE.users[customerIndex].customerProfile) {
            MOCK_DATABASE.users[customerIndex].customerProfile.visitCount += 1;
        }

        return { success: true, data: newBooking, message: 'Đặt dịch vụ thành công' };
    },

    async getMyBookings() {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền xem lịch đặt');
        }

        const myBookings = MOCK_DATABASE.bookings.filter(booking =>
            booking.customerId === currentUser.id
        );

        return { success: true, data: myBookings };
    },

    // Product Purchase
    async purchaseProducts(purchaseData) {
        await delay(700);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'product_purchase')) {
            throw new Error('Không có quyền mua sản phẩm');
        }

        const newPurchase = {
            id: generateId('purchase'),
            ...purchaseData,
            customerId: currentUser.id,
            status: 'completed',
            createdAt: new Date().toISOString(),
            total: purchaseData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        // Update customer spending
        const customerIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (customerIndex !== -1 && MOCK_DATABASE.users[customerIndex].customerProfile) {
            MOCK_DATABASE.users[customerIndex].customerProfile.totalSpent += newPurchase.total;
            MOCK_DATABASE.users[customerIndex].customerProfile.loyaltyPoints += Math.floor(newPurchase.total / 10000);
        }

        return { success: true, data: newPurchase, message: 'Mua hàng thành công' };
    },

    // Pet Management
    async getMyPets() {
        await delay(300);
        const currentUser = getCurrentUser();

        const myPets = MOCK_DATABASE.pets.filter(pet =>
            pet.ownerId === currentUser.id
        );

        return { success: true, data: myPets };
    },

    async addPet(petData) {
        await delay(500);
        const currentUser = getCurrentUser();

        const newPet = {
            id: generateId('pet'),
            ...petData,
            ownerId: currentUser.id,
            status: 'healthy',
            services: [],
            createdAt: new Date().toISOString()
        };

        MOCK_DATABASE.pets.push(newPet);

        // Update customer pet list
        const customerIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (customerIndex !== -1 && MOCK_DATABASE.users[customerIndex].customerProfile) {
            MOCK_DATABASE.users[customerIndex].customerProfile.pets.push(newPet.id);
        }

        return { success: true, data: newPet, message: 'Thêm thú cưng thành công' };
    },

    // Feedback
    async submitFeedback(feedbackData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_submission')) {
            throw new Error('Không có quyền gửi phản hồi');
        }

        const newFeedback = {
            id: generateId('feedback'),
            ...feedbackData,
            customerId: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'received'
        };

        return { success: true, data: newFeedback, message: 'Gửi phản hồi thành công' };
    },

    // Notifications
    async getNotifications() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền xem thông báo');
        }

        // Mock notifications
        const notifications = [
            {
                id: 'notif-001',
                title: 'Lịch hẹn được xác nhận',
                message: 'Lịch hẹn grooming cho Bông đã được xác nhận vào 25/01/2024 lúc 09:00',
                type: 'booking',
                read: false,
                createdAt: '2024-01-20T10:30:00'
            },
            {
                id: 'notif-002',
                title: 'Khuyến mãi đặc biệt',
                message: 'Giảm 20% cho dịch vụ grooming trong tháng này!',
                type: 'promotion',
                read: true,
                createdAt: '2024-01-19T15:00:00'
            }
        ];

        return { success: true, data: notifications };
    }
};

// General APIs (available to all authenticated users)
export const generalApi = {
    // Profile Management
    async getProfile() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập');
        }

        return { success: true, data: currentUser };
    },

    async updateProfile(profileData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập');
        }

        const userIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) {
            throw new Error('Không tìm thấy người dùng');
        }

        MOCK_DATABASE.users[userIndex] = {
            ...MOCK_DATABASE.users[userIndex],
            ...profileData
        };

        const { password: _, ...updatedUser } = MOCK_DATABASE.users[userIndex];
        setCurrentUser(updatedUser);

        return { success: true, data: updatedUser, message: 'Cập nhật hồ sơ thành công' };
    },

    // Change Password
    async changePassword(passwordData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập');
        }

        const { oldPassword, newPassword } = passwordData;

        const userIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) {
            throw new Error('Không tìm thấy người dùng');
        }

        if (MOCK_DATABASE.users[userIndex].password !== oldPassword) {
            throw new Error('Mật khẩu cũ không đúng');
        }

        MOCK_DATABASE.users[userIndex].password = newPassword;

        return { success: true, message: 'Đổi mật khẩu thành công' };
    }
};

// Export all APIs
export default {
    auth: authApi,
    manager: managerApi,
    sales: salesApi,
    workingStaff: workingStaffApi,
    customer: customerApi,
    general: generalApi
};
