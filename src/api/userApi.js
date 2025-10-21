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
            salary: 8000000,
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
            salary: 7500000,
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

        // Thêm 10 Sales Staff
        {
            id: 'user-007',
            username: 'sales.minh',
            email: 'minh.nguyen@petcafe.com',
            password: 'sales789',
            role: 'sales_staff',
            name: 'Nguyễn Văn Minh',
            phone: '0967890123',
            address: '45 Lê Duẩn, Q.1, TP.HCM',
            birthDate: '1993-03-20',
            avatar: '',
            salary: 8200000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-07-12',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 21300000,
                monthlyTarget: 15000000,
                completedOrders: 142,
                customerRating: 4.6
            }
        },
        {
            id: 'user-008',
            username: 'sales.thu',
            email: 'thu.tran@petcafe.com',
            password: 'sales111',
            role: 'sales_staff',
            name: 'Trần Thị Thu',
            phone: '0978901234',
            address: '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
            birthDate: '1995-06-15',
            avatar: '',
            salary: 7800000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-08-05',
            lastLogin: '2024-01-19',
            salesStats: {
                totalSales: 19800000,
                monthlyTarget: 15000000,
                completedOrders: 128,
                customerRating: 4.9
            }
        },
        {
            id: 'user-009',
            username: 'sales.khanh',
            email: 'khanh.le@petcafe.com',
            password: 'sales222',
            role: 'sales_staff',
            name: 'Lê Minh Khánh',
            phone: '0989012345',
            address: '78 Võ Thị Sáu, Q.3, TP.HCM',
            birthDate: '1992-09-10',
            avatar: '',
            salary: 8500000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-09-20',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 27500000,
                monthlyTarget: 15000000,
                completedOrders: 168,
                customerRating: 4.8
            }
        },
        {
            id: 'user-010',
            username: 'sales.hoa',
            email: 'hoa.pham@petcafe.com',
            password: 'sales333',
            role: 'sales_staff',
            name: 'Phạm Thị Hoa',
            phone: '0990123456',
            address: '234 Hai Bà Trưng, Q.1, TP.HCM',
            birthDate: '1994-12-05',
            avatar: '',
            salary: 7600000,
            status: 'on_leave',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-10-15',
            lastLogin: '2024-01-15',
            salesStats: {
                totalSales: 16200000,
                monthlyTarget: 15000000,
                completedOrders: 115,
                customerRating: 4.5
            }
        },
        {
            id: 'user-011',
            username: 'sales.long',
            email: 'long.vo@petcafe.com',
            password: 'sales444',
            role: 'sales_staff',
            name: 'Võ Thành Long',
            phone: '0901234567',
            address: '567 Lý Thường Kiệt, Q.10, TP.HCM',
            birthDate: '1991-04-25',
            avatar: '',
            salary: 8800000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-11-01',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 29100000,
                monthlyTarget: 15000000,
                completedOrders: 175,
                customerRating: 4.9
            }
        },
        {
            id: 'user-012',
            username: 'sales.lan',
            email: 'lan.hoang@petcafe.com',
            password: 'sales555',
            role: 'sales_staff',
            name: 'Hoàng Thị Lan',
            phone: '0912345678',
            address: '89 Trần Hưng Đạo, Q.5, TP.HCM',
            birthDate: '1996-07-18',
            avatar: '',
            salary: 7400000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-11-20',
            lastLogin: '2024-01-19',
            salesStats: {
                totalSales: 17800000,
                monthlyTarget: 15000000,
                completedOrders: 122,
                customerRating: 4.7
            }
        },
        {
            id: 'user-013',
            username: 'sales.nam',
            email: 'nam.dang@petcafe.com',
            password: 'sales666',
            role: 'sales_staff',
            name: 'Đặng Hoàng Nam',
            phone: '0923456789',
            address: '345 Nguyễn Đình Chiểu, Q.3, TP.HCM',
            birthDate: '1993-11-30',
            avatar: '',
            salary: 8100000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2023-12-10',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 23400000,
                monthlyTarget: 15000000,
                completedOrders: 151,
                customerRating: 4.8
            }
        },
        {
            id: 'user-014',
            username: 'sales.my',
            email: 'my.bui@petcafe.com',
            password: 'sales777',
            role: 'sales_staff',
            name: 'Bùi Thị Mỹ',
            phone: '0934567890',
            address: '678 Phan Xích Long, Q.Phú Nhuận, TP.HCM',
            birthDate: '1994-02-14',
            avatar: '',
            salary: 7900000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2024-01-05',
            lastLogin: '2024-01-20',
            salesStats: {
                totalSales: 8500000,
                monthlyTarget: 15000000,
                completedOrders: 45,
                customerRating: 4.6
            }
        },
        {
            id: 'user-015',
            username: 'sales.tuan',
            email: 'tuan.ngo@petcafe.com',
            password: 'sales888',
            role: 'sales_staff',
            name: 'Ngô Anh Tuấn',
            phone: '0945678901',
            address: '901 Lê Văn Sỹ, Q.3, TP.HCM',
            birthDate: '1992-08-08',
            avatar: '',
            salary: 8300000,
            status: 'active',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2024-01-15',
            lastLogin: '2024-01-19',
            salesStats: {
                totalSales: 4200000,
                monthlyTarget: 15000000,
                completedOrders: 28,
                customerRating: 4.5
            }
        },
        {
            id: 'user-016',
            username: 'sales.linh',
            email: 'linh.duong@petcafe.com',
            password: 'sales999',
            role: 'sales_staff',
            name: 'Dương Khánh Linh',
            phone: '0956789012',
            address: '212 Hoàng Văn Thụ, Q.Tân Bình, TP.HCM',
            birthDate: '1995-05-22',
            avatar: '',
            salary: 7700000,
            status: 'on_leave',
            permissions: [
                'product_sales',
                'invoice_management',
                'customer_support',
                'payment_processing'
            ],
            createdAt: '2024-01-18',
            lastLogin: '2024-01-18',
            salesStats: {
                totalSales: 1800000,
                monthlyTarget: 15000000,
                completedOrders: 12,
                customerRating: 4.4
            }
        },

        // Working Staff - Thêm 15 người
        {
            id: '93185191-488d-45ae-b6c5-68a6f8e22bee',
            username: 'staff.levanc',
            email: 'levanc@petcafe.com',
            password: 'staff123',
            role: 'working_staff',
            name: 'Lê Văn C',
            phone: '0935678901',
            address: '111 Trần Hưng Đạo, Q.5, TP.HCM',
            birthDate: '1989-08-10',
            avatar: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F9c80b9cb-22f6-4013-94d3-8b164f1bad07.jpg?alt=media&token=10f52795-d2db-41c9-b0f7-5b336d528f03',
            salary: 8500000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management',
                'shift_management'
            ],
            createdAt: '2023-04-01',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 25,
                completedTasks: 22,
                activePets: 18,
                specialization: 'Tắm rửa thú cưng'
            }
        },
        {
            id: 'user-017',
            username: 'staff.charlie',
            email: 'charlie@petcafe.com',
            password: 'staff123',
            role: 'working_staff',
            name: 'Hoàng Thị Chăm Sóc',
            phone: '0945678901',
            address: '654 Võ Văn Tần, Q.3, TP.HCM',
            birthDate: '1992-12-25',
            avatar: '',
            salary: 7000000,
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
            id: 'user-018',
            username: 'staff.diana',
            email: 'diana@petcafe.com',
            password: 'staff456',
            role: 'working_staff',
            name: 'Vũ Văn Thú Y',
            phone: '0956789012',
            address: '987 Pasteur, Q.1, TP.HCM',
            birthDate: '1991-04-18',
            avatar: '',
            salary: 7500000,
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
        {
            id: 'user-019',
            username: 'staff.hung',
            email: 'hung.nguyen@petcafe.com',
            password: 'staff789',
            role: 'working_staff',
            name: 'Nguyễn Quốc Hùng',
            phone: '0967890123',
            address: '123 Bà Huyện Thanh Quan, Q.3, TP.HCM',
            birthDate: '1990-01-15',
            avatar: '',
            salary: 8000000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-06-25',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 20,
                completedTasks: 18,
                activePets: 28,
                specialization: 'Huấn luyện chó'
            }
        },
        {
            id: 'user-020',
            username: 'staff.mai',
            email: 'mai.pham@petcafe.com',
            password: 'staff101',
            role: 'working_staff',
            name: 'Phạm Thị Mai',
            phone: '0978901234',
            address: '456 Cộng Hòa, Q.Tân Bình, TP.HCM',
            birthDate: '1993-05-08',
            avatar: '',
            salary: 7200000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-07-10',
            lastLogin: '2024-01-19',
            workStats: {
                assignedTasks: 15,
                completedTasks: 12,
                activePets: 19,
                specialization: 'Grooming'
            }
        },
        {
            id: 'user-021',
            username: 'staff.dat',
            email: 'dat.le@petcafe.com',
            password: 'staff202',
            role: 'working_staff',
            name: 'Lê Hoàng Đạt',
            phone: '0989012345',
            address: '789 Hoàng Diệu, Q.4, TP.HCM',
            birthDate: '1994-09-20',
            avatar: '',
            salary: 7800000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-08-15',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 16,
                completedTasks: 15,
                activePets: 21,
                specialization: 'Spa thú cưng'
            }
        },
        {
            id: 'user-022',
            username: 'staff.tam',
            email: 'tam.tran@petcafe.com',
            password: 'staff303',
            role: 'working_staff',
            name: 'Trần Minh Tâm',
            phone: '0990123456',
            address: '234 Trường Chinh, Q.12, TP.HCM',
            birthDate: '1992-03-12',
            avatar: '',
            salary: 7400000,
            status: 'on_leave',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-09-05',
            lastLogin: '2024-01-10',
            workStats: {
                assignedTasks: 10,
                completedTasks: 9,
                activePets: 13,
                specialization: 'Chăm sóc mèo'
            }
        },
        {
            id: 'user-023',
            username: 'staff.thuy',
            email: 'thuy.vo@petcafe.com',
            password: 'staff404',
            role: 'working_staff',
            name: 'Võ Thị Thúy',
            phone: '0901234567',
            address: '567 Phan Văn Trị, Q.Gò Vấp, TP.HCM',
            birthDate: '1995-07-28',
            avatar: '',
            salary: 6800000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-10-01',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 14,
                completedTasks: 11,
                activePets: 17,
                specialization: 'Vệ sinh thú cưng'
            }
        },
        {
            id: 'user-024',
            username: 'staff.quan',
            email: 'quan.hoang@petcafe.com',
            password: 'staff505',
            role: 'working_staff',
            name: 'Hoàng Minh Quân',
            phone: '0912345678',
            address: '890 Lạc Long Quân, Q.11, TP.HCM',
            birthDate: '1991-11-05',
            avatar: '',
            salary: 8200000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-10-20',
            lastLogin: '2024-01-19',
            workStats: {
                assignedTasks: 22,
                completedTasks: 20,
                activePets: 30,
                specialization: 'Thú y'
            }
        },
        {
            id: 'user-025',
            username: 'staff.nhi',
            email: 'nhi.bui@petcafe.com',
            password: 'staff606',
            role: 'working_staff',
            name: 'Bùi Thị Nhi',
            phone: '0923456789',
            address: '123 Quang Trung, Q.Gò Vấp, TP.HCM',
            birthDate: '1996-02-14',
            avatar: '',
            salary: 7100000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-11-15',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 13,
                completedTasks: 10,
                activePets: 16,
                specialization: 'Chăm sóc chó'
            }
        },
        {
            id: 'user-026',
            username: 'staff.hieu',
            email: 'hieu.dang@petcafe.com',
            password: 'staff707',
            role: 'working_staff',
            name: 'Đặng Trung Hiếu',
            phone: '0934567890',
            address: '456 Nguyễn Oanh, Q.Gò Vấp, TP.HCM',
            birthDate: '1993-08-30',
            avatar: '',
            salary: 7600000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-12-01',
            lastLogin: '2024-01-19',
            workStats: {
                assignedTasks: 17,
                completedTasks: 14,
                activePets: 23,
                specialization: 'Huấn luyện'
            }
        },
        {
            id: 'user-027',
            username: 'staff.anh',
            email: 'anh.nguyen@petcafe.com',
            password: 'staff808',
            role: 'working_staff',
            name: 'Nguyễn Thị Anh',
            phone: '0945678901',
            address: '789 Lê Đức Thọ, Q.Gò Vấp, TP.HCM',
            birthDate: '1994-12-18',
            avatar: '',
            salary: 7300000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2023-12-20',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 11,
                completedTasks: 9,
                activePets: 14,
                specialization: 'Grooming'
            }
        },
        {
            id: 'user-028',
            username: 'staff.khoa',
            email: 'khoa.pham@petcafe.com',
            password: 'staff909',
            role: 'working_staff',
            name: 'Phạm Anh Khoa',
            phone: '0956789012',
            address: '321 Phạm Văn Đồng, Q.Thủ Đức, TP.HCM',
            birthDate: '1992-06-22',
            avatar: '',
            salary: 7900000,
            status: 'on_leave',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2024-01-05',
            lastLogin: '2024-01-12',
            workStats: {
                assignedTasks: 8,
                completedTasks: 7,
                activePets: 11,
                specialization: 'Spa thú cưng'
            }
        },
        {
            id: 'user-029',
            username: 'staff.phuong',
            email: 'phuong.le@petcafe.com',
            password: 'staff1010',
            role: 'working_staff',
            name: 'Lê Thị Phương',
            phone: '0967890123',
            address: '654 Kha Vạn Cân, Q.Thủ Đức, TP.HCM',
            birthDate: '1995-10-10',
            avatar: '',
            salary: 6900000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2024-01-10',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 9,
                completedTasks: 7,
                activePets: 12,
                specialization: 'Chăm sóc mèo'
            }
        },
        {
            id: 'user-030',
            username: 'staff.binh',
            email: 'binh.tran@petcafe.com',
            password: 'staff1111',
            role: 'working_staff',
            name: 'Trần Văn Bình',
            phone: '0978901234',
            address: '987 Võ Văn Ngân, Q.Thủ Đức, TP.HCM',
            birthDate: '1990-04-05',
            avatar: '',
            salary: 8500000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2024-01-12',
            lastLogin: '2024-01-19',
            workStats: {
                assignedTasks: 19,
                completedTasks: 17,
                activePets: 26,
                specialization: 'Thú y'
            }
        },
        {
            id: 'user-031',
            username: 'staff.yen',
            email: 'yen.hoang@petcafe.com',
            password: 'staff1212',
            role: 'working_staff',
            name: 'Hoàng Thị Yến',
            phone: '0989012345',
            address: '147 Tô Ngọc Vân, Q.Thủ Đức, TP.HCM',
            birthDate: '1997-01-20',
            avatar: '',
            salary: 7000000,
            status: 'active',
            permissions: [
                'task_management',
                'pet_status_update',
                'service_execution',
                'booking_management'
            ],
            createdAt: '2024-01-15',
            lastLogin: '2024-01-20',
            workStats: {
                assignedTasks: 10,
                completedTasks: 8,
                activePets: 13,
                specialization: 'Vệ sinh thú cưng'
            }
        },

        // Customers
        {
            id: 'user-032',
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
            id: 'user-033',
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
            ownerId: 'user-032',
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
            ownerId: 'user-032',
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
            ownerId: 'user-033',
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
            description: 'Tắm, cắt tỉa lông, cắt móng cơ bản cho thú cưng',
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
            name: 'Grooming cao cấp',
            category: 'grooming',
            price: 300000,
            duration: 120,
            description: 'Dịch vụ grooming cao cấp với spa và massage thư giãn',
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
            name: 'Huấn luyện cơ bản',
            category: 'training',
            price: 500000,
            duration: 60,
            description: 'Huấn luyện các lệnh cơ bản và kỹ năng xã hội',
            status: 'active',
            image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?q=80&w=800&auto=format&fit=crop',
            location: 'Tầng 3 - Sân tập',
            rating: 4.7,
            reviewCount: 73,
            features: [
                'Huấn luyện lệnh cơ bản (ngồi, nằm, ở lại)',
                'Kỹ năng xã hội với người và thú khác',
                'Sửa các thói quen xấu',
                'Tư vấn chăm sóc tại nhà',
                'Chứng chỉ hoàn thành khóa học'
            ],
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
            customerId: 'user-032',
            petId: 'pet-001',
            serviceId: 'service-001',
            staffId: 'user-005',
            bookingDateTime: '2024-01-25T09:00:00',
            estimatedEndTime: '10:30',
            status: 'confirmed',
            notes: 'Pet rất hiếu động',
            finalPrice: 150000,
            paymentStatus: 'paid',
            paymentMethod: 'credit_card',
            customerInfo: {
                name: 'Nguyễn Thị Lan Anh',
                phone: '0967890123',
                email: 'eva@gmail.com',
                address: '147 Hai Bà Trưng, Q.1, TP.HCM'
            },
            createdAt: '2024-01-20T10:30:00',
            updatedAt: '2024-01-20T11:00:00'
        },
        {
            id: 'booking-002',
            customerId: 'user-033',
            petId: 'pet-003',
            serviceId: 'service-004',
            staffId: 'user-006',
            bookingDateTime: '2024-01-26T14:00:00',
            estimatedEndTime: '15:00',
            status: 'pending',
            notes: 'Cần huấn luyện ngồi, nằm',
            finalPrice: 500000,
            paymentStatus: 'paid',
            paymentMethod: 'e_wallet',
            customerInfo: {
                name: 'Trần Văn Hùng',
                phone: '0978901234',
                email: 'frank@yahoo.com',
                address: '258 Lý Tự Trọng, Q.1, TP.HCM'
            },
            createdAt: '2024-01-19T15:20:00',
            updatedAt: '2024-01-19T15:20:00'
        },
        {
            id: 'booking-003',
            customerId: 'user-032',
            petId: 'pet-002',
            serviceId: 'service-006',
            staffId: 'user-005',
            bookingDateTime: '2024-01-27T10:30:00',
            estimatedEndTime: '11:00',
            status: 'completed',
            notes: 'Tắm nhanh cho mèo',
            finalPrice: 80000,
            paymentStatus: 'paid',
            paymentMethod: 'bank_transfer',
            customerInfo: {
                name: 'Nguyễn Thị Lan Anh',
                phone: '0967890123',
                email: 'eva@gmail.com',
                address: '147 Hai Bà Trưng, Q.1, TP.HCM'
            },
            feedback: {
                overallRating: 5,
                serviceQuality: 5,
                staffFriendliness: 5,
                cleanliness: 4,
                valueForMoney: 5,
                comment: 'Dịch vụ rất tốt, nhân viên thân thiện',
                recommend: 'yes',
                submittedAt: '2024-01-27T12:00:00'
            },
            createdAt: '2024-01-26T09:15:00',
            updatedAt: '2024-01-27T11:30:00'
        }
    ],

    // Staff schedules for availability checking
    staffSchedules: [
        {
            staffId: 'user-005',
            date: '2024-01-25',
            shifts: [
                { start: '08:00', end: '12:00', available: true },
                { start: '13:00', end: '17:00', available: true }
            ],
            bookedSlots: [
                { start: '09:00', end: '10:30', bookingId: 'booking-001' }
            ]
        },
        {
            staffId: 'user-006',
            date: '2024-01-26',
            shifts: [
                { start: '09:00', end: '13:00', available: true },
                { start: '14:00', end: '18:00', available: true }
            ],
            bookedSlots: [
                { start: '14:00', end: '15:00', bookingId: 'booking-002' }
            ]
        }
    ],

    // Notifications for staff and customers
    notifications: [
        {
            id: 'notif-001',
            userId: 'user-005',
            type: 'booking_assigned',
            title: 'Lịch hẹn mới được giao',
            message: 'Bạn có lịch hẹn grooming cho Bông vào 25/01 lúc 09:00',
            bookingId: 'booking-001',
            read: false,
            createdAt: '2024-01-20T11:00:00'
        },
        {
            id: 'notif-002',
            userId: 'user-032',
            type: 'booking_confirmed',
            title: 'Lịch hẹn được xác nhận',
            message: 'Lịch hẹn grooming cho Bông đã được xác nhận',
            bookingId: 'booking-001',
            read: false,
            createdAt: '2024-01-20T11:00:00'
        },
        {
            id: 'notif-003',
            userId: 'user-032',
            type: 'service_completed',
            title: 'Dịch vụ hoàn thành',
            message: 'Dịch vụ tắm nhanh cho Miu đã hoàn thành. Hãy đánh giá dịch vụ!',
            bookingId: 'booking-003',
            read: false,
            createdAt: '2024-01-27T11:30:00'
        }
    ],

    // Feedback and reviews
    feedbacks: [
        {
            id: 'feedback-001',
            bookingId: 'booking-003',
            customerId: 'user-032',
            serviceId: 'service-006',
            overallRating: 5,
            serviceQuality: 5,
            staffFriendliness: 5,
            cleanliness: 4,
            valueForMoney: 5,
            comment: 'Dịch vụ rất tốt, nhân viên thân thiện và chuyên nghiệp',
            recommend: 'yes',
            improvements: 'Có thể cải thiện thêm về không gian chờ',
            photos: [],
            submittedAt: '2024-01-27T12:00:00'
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

        const staff = MOCK_DATABASE.users
            .filter(u => u.role === 'sales_staff' || u.role === 'working_staff')
            .map(user => {
                // Map data for compatibility with StaffPage
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    full_name: user.full_name || user.name,
                    avatar_url: user.avatar_url || user.avatar || ''
                };
            });

        return { success: true, data: staff };
    },

    async createStaff(staffData) {
        await delay(700);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'staff_management')) {
            throw new Error('Không có quyền tạo nhân viên');
        }

        // Map full_name to name for consistency with database
        const newStaff = {
            id: generateId('user'),
            username: staffData.email.split('@')[0], // Generate username from email
            email: staffData.email,
            password: staffData.password,
            role: staffData.role,
            name: staffData.full_name || staffData.name,
            full_name: staffData.full_name || staffData.name, // Keep both for compatibility
            phone: staffData.phone,
            address: staffData.address,
            salary: staffData.salary,
            birthDate: staffData.birthDate || '',
            avatar: staffData.avatar_url || '',
            avatar_url: staffData.avatar_url || '',
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

        // Remove password from response
        const { password: _, ...staffWithoutPassword } = newStaff;

        return { success: true, data: staffWithoutPassword, message: 'Tạo nhân viên thành công' };
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

        // Map full_name to name for consistency
        if (updateData.full_name) {
            updateData.name = updateData.full_name;
        }
        if (updateData.avatar_url) {
            updateData.avatar = updateData.avatar_url;
        }

        MOCK_DATABASE.users[staffIndex] = {
            ...MOCK_DATABASE.users[staffIndex],
            ...updateData
        };

        // Remove password from response if it exists
        const { password: _, ...staffWithoutPassword } = MOCK_DATABASE.users[staffIndex];

        return {
            success: true,
            data: staffWithoutPassword,
            message: 'Cập nhật nhân viên thành công'
        };
    },

    async deleteStaff(staffId) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'staff_management')) {
            throw new Error('Không có quyền xóa nhân viên');
        }

        const staffIndex = MOCK_DATABASE.users.findIndex(u => u.id === staffId);
        if (staffIndex === -1) {
            throw new Error('Không tìm thấy nhân viên');
        }

        const staff = MOCK_DATABASE.users[staffIndex];

        // Check if staff can be deleted (không thể xóa nếu đang có booking active)
        const hasActiveBookings = MOCK_DATABASE.bookings.some(booking =>
            booking.staffId === staffId &&
            (booking.status === 'confirmed' || booking.status === 'pending')
        );

        if (hasActiveBookings) {
            throw new Error('Không thể xóa nhân viên đang có lịch hẹn đang hoạt động');
        }

        // Remove staff from database
        MOCK_DATABASE.users.splice(staffIndex, 1);

        return {
            success: true,
            message: 'Xóa nhân viên thành công'
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
                customerId: 'user-032',
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

    // Check availability for a specific date and service
    async checkAvailability(serviceId, date) {
        await delay(800);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền kiểm tra lịch trống');
        }

        const service = MOCK_DATABASE.services.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Generate time slots for the day (9 AM to 6 PM)
        const slots = [];
        const startHour = 9;
        const endHour = 18;
        const slotDuration = 30; // 30 minutes per slot

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Check if this slot conflicts with existing bookings
                const hasConflict = MOCK_DATABASE.bookings.some(booking => {
                    const bookingDate = booking.bookingDateTime.split('T')[0];
                    const bookingTime = booking.bookingDateTime.split('T')[1].substring(0, 5);

                    if (bookingDate === date && booking.status !== 'cancelled') {
                        const bookingStart = new Date(`${date}T${bookingTime}`);
                        const bookingEnd = new Date(bookingStart.getTime() + (booking.service?.duration || 60) * 60000);
                        const slotStart = new Date(`${date}T${timeString}`);
                        const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);

                        return (slotStart < bookingEnd && slotEnd > bookingStart);
                    }
                    return false;
                });

                // Calculate dynamic pricing (evening surcharge, weekend surcharge)
                let price = service.price;
                const dayOfWeek = new Date(date).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isEvening = hour >= 17;

                if (isWeekend) price += Math.floor(service.price * 0.1); // 10% weekend surcharge
                if (isEvening) price += 50000; // Evening surcharge

                slots.push({
                    time: timeString,
                    available: !hasConflict,
                    price: price,
                    duration: service.duration,
                    endTime: new Date(new Date(`${date}T${timeString}`).getTime() + service.duration * 60000)
                        .toTimeString().substring(0, 5)
                });
            }
        }

        return {
            success: true,
            data: {
                date,
                service,
                slots: slots.filter(slot => {
                    // Only return slots that can accommodate the full service duration
                    const slotStart = new Date(`${date}T${slot.time}`);
                    const serviceEnd = new Date(slotStart.getTime() + service.duration * 60000);
                    return serviceEnd.getHours() <= endHour;
                })
            }
        };
    },

    async createBooking(bookingData) {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền đặt dịch vụ');
        }

        // Find service details
        const service = MOCK_DATABASE.services.find(s => s.id === bookingData.service?.id);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Auto-assign staff based on service requirements
        const availableStaff = MOCK_DATABASE.users.filter(user =>
            user.role === 'working_staff' && user.status === 'active'
        );

        const assignedStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];

        const newBooking = {
            id: generateId('booking'),
            customerId: currentUser.id,
            petId: bookingData.pet?.id,
            serviceId: service.id,
            staffId: assignedStaff?.id,
            bookingDateTime: bookingData.bookingDateTime,
            estimatedEndTime: bookingData.estimatedEndTime,
            status: service.autoApprove ? 'confirmed' : 'pending',
            notes: bookingData.notes || '',
            finalPrice: bookingData.finalPrice || service.price,
            paymentStatus: 'paid',
            paymentMethod: bookingData.paymentMethod || 'credit_card',
            customerInfo: bookingData.customerInfo,
            service: service,
            pet: bookingData.pet,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        MOCK_DATABASE.bookings.push(newBooking);

        // Create notifications
        if (assignedStaff) {
            const staffNotification = {
                id: generateId('notif'),
                userId: assignedStaff.id,
                type: 'booking_assigned',
                title: 'Lịch hẹn mới được giao',
                message: `Bạn có lịch hẹn ${service.name} cho ${bookingData.pet?.name} vào ${new Date(bookingData.bookingDateTime).toLocaleDateString('vi-VN')}`,
                bookingId: newBooking.id,
                read: false,
                createdAt: new Date().toISOString()
            };
            MOCK_DATABASE.notifications.push(staffNotification);
        }

        const customerNotification = {
            id: generateId('notif'),
            userId: currentUser.id,
            type: service.autoApprove ? 'booking_confirmed' : 'booking_received',
            title: service.autoApprove ? 'Lịch hẹn được xác nhận' : 'Đã nhận yêu cầu đặt lịch',
            message: service.autoApprove ?
                `Lịch hẹn ${service.name} đã được xác nhận` :
                `Yêu cầu đặt lịch ${service.name} đang được xử lý`,
            bookingId: newBooking.id,
            read: false,
            createdAt: new Date().toISOString()
        };
        MOCK_DATABASE.notifications.push(customerNotification);

        // Update customer visit count
        const customerIndex = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
        if (customerIndex !== -1 && MOCK_DATABASE.users[customerIndex].customerProfile) {
            MOCK_DATABASE.users[customerIndex].customerProfile.visitCount += 1;
        }

        return {
            success: true,
            data: newBooking,
            message: service.autoApprove ?
                'Đặt dịch vụ thành công và đã được xác nhận!' :
                'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ xác nhận sớm nhất.'
        };
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
            submittedAt: new Date().toISOString(),
            status: 'received'
        };

        MOCK_DATABASE.feedbacks.push(newFeedback);

        // Update booking with feedback
        if (feedbackData.bookingId) {
            const bookingIndex = MOCK_DATABASE.bookings.findIndex(b => b.id === feedbackData.bookingId);
            if (bookingIndex !== -1) {
                MOCK_DATABASE.bookings[bookingIndex].feedback = {
                    overallRating: feedbackData.overallRating,
                    serviceQuality: feedbackData.serviceQuality,
                    staffFriendliness: feedbackData.staffFriendliness,
                    cleanliness: feedbackData.cleanliness,
                    valueForMoney: feedbackData.valueForMoney,
                    comment: feedbackData.comment,
                    recommend: feedbackData.recommend,
                    submittedAt: new Date().toISOString()
                };
                MOCK_DATABASE.bookings[bookingIndex].updatedAt = new Date().toISOString();
            }
        }

        // Update service rating
        if (feedbackData.serviceId && feedbackData.overallRating) {
            const serviceIndex = MOCK_DATABASE.services.findIndex(s => s.id === feedbackData.serviceId);
            if (serviceIndex !== -1) {
                const service = MOCK_DATABASE.services[serviceIndex];
                const currentTotal = (service.rating || 0) * (service.reviewCount || 0);
                const newReviewCount = (service.reviewCount || 0) + 1;
                const newRating = (currentTotal + feedbackData.overallRating) / newReviewCount;

                MOCK_DATABASE.services[serviceIndex].rating = Math.round(newRating * 10) / 10;
                MOCK_DATABASE.services[serviceIndex].reviewCount = newReviewCount;
            }
        }

        // Create notification for management
        const managementNotification = {
            id: generateId('notif'),
            userId: 'user-001', // Manager
            type: 'feedback_received',
            title: 'Phản hồi mới từ khách hàng',
            message: `${currentUser.name} đã gửi phản hồi với ${feedbackData.overallRating} sao`,
            feedbackId: newFeedback.id,
            read: false,
            createdAt: new Date().toISOString()
        };
        MOCK_DATABASE.notifications.push(managementNotification);

        return { success: true, data: newFeedback, message: 'Gửi phản hồi thành công' };
    },

    // Get booking history with filters
    async getBookingHistory(filters = {}) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền xem lịch sử đặt lịch');
        }

        let bookings = MOCK_DATABASE.bookings.filter(booking =>
            booking.customerId === currentUser.id
        );

        // Apply filters
        if (filters.status) {
            bookings = bookings.filter(booking => booking.status === filters.status);
        }

        if (filters.serviceId) {
            bookings = bookings.filter(booking => booking.serviceId === filters.serviceId);
        }

        if (filters.dateFrom) {
            bookings = bookings.filter(booking =>
                new Date(booking.bookingDateTime) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            bookings = bookings.filter(booking =>
                new Date(booking.bookingDateTime) <= new Date(filters.dateTo)
            );
        }

        // Sort by booking date (newest first)
        bookings.sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime));

        // Add service and pet details
        const enrichedBookings = bookings.map(booking => {
            const service = MOCK_DATABASE.services.find(s => s.id === booking.serviceId);
            const pet = MOCK_DATABASE.pets.find(p => p.id === booking.petId);
            const staff = MOCK_DATABASE.users.find(u => u.id === booking.staffId);

            return {
                ...booking,
                service,
                pet,
                staff: staff ? {
                    id: staff.id,
                    name: staff.name,
                    specialization: staff.workStats?.specialization
                } : null
            };
        });

        return { success: true, data: enrichedBookings };
    },

    // Cancel booking
    async cancelBooking(bookingId, reason) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền hủy đặt lịch');
        }

        const bookingIndex = MOCK_DATABASE.bookings.findIndex(b =>
            b.id === bookingId && b.customerId === currentUser.id
        );

        if (bookingIndex === -1) {
            throw new Error('Không tìm thấy lịch đặt hoặc không có quyền hủy');
        }

        const booking = MOCK_DATABASE.bookings[bookingIndex];

        // Check if booking can be cancelled (not within 2 hours of appointment)
        const bookingTime = new Date(booking.bookingDateTime);
        const now = new Date();
        const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

        if (hoursUntilBooking < 2 && booking.status === 'confirmed') {
            throw new Error('Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ hẹn');
        }

        // Update booking status
        MOCK_DATABASE.bookings[bookingIndex].status = 'cancelled';
        MOCK_DATABASE.bookings[bookingIndex].cancelReason = reason;
        MOCK_DATABASE.bookings[bookingIndex].cancelledAt = new Date().toISOString();
        MOCK_DATABASE.bookings[bookingIndex].updatedAt = new Date().toISOString();

        // Create notifications
        if (booking.staffId) {
            const staffNotification = {
                id: generateId('notif'),
                userId: booking.staffId,
                type: 'booking_cancelled',
                title: 'Lịch hẹn bị hủy',
                message: `Lịch hẹn vào ${new Date(booking.bookingDateTime).toLocaleDateString('vi-VN')} đã bị hủy`,
                bookingId: booking.id,
                read: false,
                createdAt: new Date().toISOString()
            };
            MOCK_DATABASE.notifications.push(staffNotification);
        }

        return {
            success: true,
            data: MOCK_DATABASE.bookings[bookingIndex],
            message: 'Hủy lịch hẹn thành công'
        };
    },

    // Reschedule booking
    async rescheduleBooking(bookingId, newDateTime) {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền đổi lịch');
        }

        const bookingIndex = MOCK_DATABASE.bookings.findIndex(b =>
            b.id === bookingId && b.customerId === currentUser.id
        );

        if (bookingIndex === -1) {
            throw new Error('Không tìm thấy lịch đặt hoặc không có quyền đổi lịch');
        }

        const booking = MOCK_DATABASE.bookings[bookingIndex];

        // Check if booking can be rescheduled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            throw new Error('Không thể đổi lịch cho booking đã hoàn thành hoặc đã hủy');
        }

        const oldDateTime = booking.bookingDateTime;

        // Update booking
        MOCK_DATABASE.bookings[bookingIndex].bookingDateTime = newDateTime;
        MOCK_DATABASE.bookings[bookingIndex].status = 'pending'; // Require re-confirmation
        MOCK_DATABASE.bookings[bookingIndex].updatedAt = new Date().toISOString();

        // Create notifications
        if (booking.staffId) {
            const staffNotification = {
                id: generateId('notif'),
                userId: booking.staffId,
                type: 'booking_rescheduled',
                title: 'Lịch hẹn được đổi giờ',
                message: `Lịch hẹn đã được đổi từ ${new Date(oldDateTime).toLocaleString('vi-VN')} sang ${new Date(newDateTime).toLocaleString('vi-VN')}`,
                bookingId: booking.id,
                read: false,
                createdAt: new Date().toISOString()
            };
            MOCK_DATABASE.notifications.push(staffNotification);
        }

        return {
            success: true,
            data: MOCK_DATABASE.bookings[bookingIndex],
            message: 'Đổi lịch thành công! Chúng tôi sẽ xác nhận lại lịch mới.'
        };
    },

    // Notifications
    async getNotifications() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'notification_receive')) {
            throw new Error('Không có quyền xem thông báo');
        }

        const userNotifications = MOCK_DATABASE.notifications
            .filter(notif => notif.userId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { success: true, data: userNotifications };
    },

    // Mark notification as read
    async markNotificationRead(notificationId) {
        await delay(200);
        const currentUser = getCurrentUser();

        const notificationIndex = MOCK_DATABASE.notifications.findIndex(n =>
            n.id === notificationId && n.userId === currentUser.id
        );

        if (notificationIndex !== -1) {
            MOCK_DATABASE.notifications[notificationIndex].read = true;
            MOCK_DATABASE.notifications[notificationIndex].readAt = new Date().toISOString();
        }

        return { success: true, message: 'Đã đánh dấu đã đọc' };
    },

    // Mark all notifications as read
    async markAllNotificationsRead() {
        await delay(300);
        const currentUser = getCurrentUser();

        MOCK_DATABASE.notifications
            .filter(n => n.userId === currentUser.id && !n.read)
            .forEach(notification => {
                notification.read = true;
                notification.readAt = new Date().toISOString();
            });

        return { success: true, message: 'Đã đánh dấu tất cả thông báo đã đọc' };
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
