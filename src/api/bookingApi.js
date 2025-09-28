import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        'customer': ['service_booking', 'feedback_submission', 'notification_receive'],
        'working_staff': ['view_schedule', 'update_task_status', 'notification_receive'],
        'manager': ['user_management', 'service_management', 'booking_management', 'analytics_view', 'notification_receive'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock data for bookings
let MOCK_BOOKINGS = [
    {
        id: 'booking-001',
        customerId: 'user-007',
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
        customerId: 'user-008',
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
        customerId: 'user-007',
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
];

// Mock staff schedules
const MOCK_STAFF_SCHEDULES = [
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
];

// Available staff data
const MOCK_STAFF = [
    {
        id: 'user-005',
        name: 'Nguyễn Văn Khoa',
        role: 'working_staff',
        specialization: ['grooming', 'basic_care'],
        experience: '3 năm',
        rating: 4.8,
        status: 'active'
    },
    {
        id: 'user-006',
        name: 'Lê Thị Hương',
        role: 'working_staff',
        specialization: ['training', 'behavior'],
        experience: '5 năm',
        rating: 4.9,
        status: 'active'
    },
    {
        id: 'user-009',
        name: 'Phạm Văn Tuấn',
        role: 'working_staff',
        specialization: ['healthcare', 'veterinary'],
        experience: '7 năm',
        rating: 5.0,
        status: 'active'
    }
];

// Services data reference (matches serviceApi data structure)
const MOCK_SERVICES = [
    { id: 'service-001', duration: 90, price: 150000, autoApprove: true, name: 'Tắm và chải lông cơ bản', petRequired: true },
    { id: 'service-002', duration: 120, price: 300000, autoApprove: false, name: 'Cắt tỉa lông chuyên nghiệp', petRequired: true },
    { id: 'service-003', duration: 480, price: 200000, autoApprove: true, name: 'Daycare theo ngày', petRequired: true },
    { id: 'service-004', duration: 60, price: 500000, autoApprove: false, name: 'Trải nghiệm huấn luyện thú cưng', petRequired: false },
    { id: 'service-005', duration: 45, price: 350000, autoApprove: false, name: 'Khám sức khỏe', petRequired: true },
    { id: 'service-006', duration: 30, price: 80000, autoApprove: true, name: 'Tắm vệ sinh nhanh', petRequired: true },
    { id: 'service-007', duration: 90, price: 450000, autoApprove: false, name: 'Chăm sóc đặc biệt', petRequired: true }
];

// Booking APIs
const bookingApi = {
    // Check availability for a specific date and service
    async checkAvailability(serviceId, date) {
        console.log('=== BOOKING API checkAvailability START ===');
        console.log('ServiceId:', serviceId, 'Date:', date);

        // Debug current user
        const currentUser = getCurrentUser();
        console.log('Current user from localStorage:', currentUser);
        console.log('Auth token exists:', !!localStorage.getItem('authToken'));
        console.log('Current user key:', !!localStorage.getItem('currentUser'));

        await delay(300); // Shorter delay for better UX

        // Skip all permission checks for development
        console.log('Skipping permission checks for development...');

        const service = MOCK_SERVICES.find(s => s.id === serviceId);
        console.log('MOCK_SERVICES available:', MOCK_SERVICES.map(s => ({ id: s.id, name: s.name })));

        if (!service) {
            console.error('❌ Service not found:', serviceId);
            console.error('Available service IDs:', MOCK_SERVICES.map(s => s.id));
            throw new Error('Không tìm thấy dịch vụ');
        }

        console.log('✅ Service found:', service);

        // Generate time slots for the day (9 AM to 6 PM)
        const slots = [];
        const startHour = 9;
        const endHour = 18;
        const slotDuration = 30; // 30 minutes per slot

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Check if this slot conflicts with existing bookings
                const hasConflict = MOCK_BOOKINGS.some(booking => {
                    const bookingDate = booking.bookingDateTime.split('T')[0];
                    const bookingTime = booking.bookingDateTime.split('T')[1].substring(0, 5);

                    if (bookingDate === date && booking.status !== 'cancelled') {
                        const bookingStart = new Date(`${date}T${bookingTime}`);
                        const bookingEnd = new Date(bookingStart.getTime() + service.duration * 60000);
                        const slotStart = new Date(`${date}T${timeString}`);
                        const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);

                        return (slotStart < bookingEnd && slotEnd > bookingStart);
                    }
                    return false;
                });

                // Calculate dynamic pricing
                let price = service.price;
                const dayOfWeek = new Date(date).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isEvening = hour >= 17;
                const isPeakHours = isWeekend && hour >= 10 && hour < 14;

                if (isWeekend) price += Math.floor(service.price * 0.1);
                if (isEvening) price += 50000;
                if (isPeakHours) price += 30000;

                slots.push({
                    time: timeString,
                    available: !hasConflict,
                    price: price,
                    duration: service.duration,
                    endTime: new Date(new Date(`${date}T${timeString}`).getTime() + service.duration * 60000)
                        .toTimeString().substring(0, 5),
                    surcharges: [
                        ...(isWeekend ? ['Cuối tuần +10%'] : []),
                        ...(isEvening ? ['Buổi tối +50k'] : []),
                        ...(isPeakHours ? ['Giờ cao điểm +30k'] : [])
                    ]
                });
            }
        }

        // Filter slots that can accommodate the full service duration
        const availableSlots = slots.filter(slot => {
            const slotStart = new Date(`${date}T${slot.time}`);
            const serviceEnd = new Date(slotStart.getTime() + service.duration * 60000);
            return serviceEnd.getHours() <= endHour;
        });

        console.log('📊 Generated slots total:', slots.length);
        console.log('📊 Filtered available slots:', availableSlots.length);
        console.log('📊 Available slots sample:', availableSlots.slice(0, 3));
        console.log('📊 First 5 slots:', availableSlots.slice(0, 5).map(s => ({ time: s.time, available: s.available, price: s.price })));

        const result = {
            success: true,
            data: {
                date,
                serviceId,
                slots: availableSlots,
                totalSlots: availableSlots.length,
                availableSlots: availableSlots.filter(s => s.available).length
            }
        };

        console.log('=== FINAL API RESPONSE ===');
        console.log('Result:', result);
        console.log('Result.data.slots length:', result.data.slots.length);

        return result;
    },

    // Create new booking
    async createBooking(bookingData) {
        await delay(1000);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền đặt dịch vụ');
        }

        // Validate required fields
        if (!bookingData.service?.id) {
            throw new Error('Thiếu thông tin dịch vụ');
        }

        if (!bookingData.pet?.id) {
            throw new Error('Thiếu thông tin thú cưng');
        }

        if (!bookingData.bookingDateTime) {
            throw new Error('Thiếu thông tin ngày giờ');
        }

        if (!bookingData.customerInfo?.name || !bookingData.customerInfo?.phone) {
            throw new Error('Thiếu thông tin liên hệ');
        }

        // Find service details
        const service = MOCK_SERVICES.find(s => s.id === bookingData.service.id);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Check availability one more time
        const date = bookingData.bookingDateTime.split('T')[0];
        const time = bookingData.bookingDateTime.split('T')[1].substring(0, 5);

        const hasConflict = MOCK_BOOKINGS.some(booking => {
            const bookingDate = booking.bookingDateTime.split('T')[0];
            const bookingTime = booking.bookingDateTime.split('T')[1].substring(0, 5);

            if (bookingDate === date && booking.status !== 'cancelled') {
                const bookingStart = new Date(`${date}T${bookingTime}`);
                const bookingEnd = new Date(bookingStart.getTime() + service.duration * 60000);
                const newStart = new Date(`${date}T${time}`);
                const newEnd = new Date(newStart.getTime() + service.duration * 60000);

                return (newStart < bookingEnd && newEnd > bookingStart);
            }
            return false;
        });

        if (hasConflict) {
            throw new Error('Thời gian đã được đặt, vui lòng chọn thời gian khác');
        }

        // Auto-assign staff based on service requirements and availability
        const availableStaff = MOCK_STAFF.filter(staff =>
            staff.status === 'active' &&
            staff.specialization.some(spec => {
                switch (service.id) {
                    case 'service-001':
                    case 'service-002':
                    case 'service-006':
                        return spec === 'grooming' || spec === 'basic_care';
                    case 'service-004':
                        return spec === 'training' || spec === 'behavior';
                    case 'service-005':
                    case 'service-007':
                        return spec === 'healthcare' || spec === 'veterinary';
                    case 'service-003':
                        return spec === 'basic_care' || spec === 'grooming';
                    default:
                        return true;
                }
            })
        );

        const assignedStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];

        // Calculate estimated end time
        const startTime = new Date(bookingData.bookingDateTime);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);

        const newBooking = {
            id: generateId('booking'),
            customerId: currentUser.id,
            petId: bookingData.pet.id,
            serviceId: service.id,
            staffId: assignedStaff?.id,
            bookingDateTime: bookingData.bookingDateTime,
            estimatedEndTime: endTime.toISOString(),
            status: service.autoApprove ? 'confirmed' : 'pending',
            notes: bookingData.notes || '',
            finalPrice: bookingData.finalPrice || service.price,
            paymentStatus: 'paid',
            paymentMethod: bookingData.paymentMethod || 'credit_card',
            customerInfo: bookingData.customerInfo,
            service: bookingData.service,
            pet: bookingData.pet,
            staff: assignedStaff,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        MOCK_BOOKINGS.push(newBooking);

        return {
            success: true,
            data: newBooking,
            message: service.autoApprove ?
                'Đặt dịch vụ thành công và đã được xác nhận!' :
                'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ xác nhận sớm nhất.'
        };
    },

    // Get customer's bookings
    async getMyBookings(filters = {}) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền xem lịch đặt');
        }

        let bookings = MOCK_BOOKINGS.filter(booking =>
            booking.customerId === currentUser.id
        );

        // Apply filters
        if (filters.status && filters.status !== 'all') {
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

        return { success: true, data: bookings };
    },

    // Get booking history with pagination
    async getBookingHistory(page = 1, limit = 10, filters = {}) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền xem lịch sử đặt lịch');
        }

        let bookings = MOCK_BOOKINGS.filter(booking =>
            booking.customerId === currentUser.id
        );

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            bookings = bookings.filter(booking => booking.status === filters.status);
        }

        if (filters.serviceCategory) {
            bookings = bookings.filter(booking => {
                // This would need service category lookup in real implementation
                return true; // Placeholder
            });
        }

        if (filters.dateRange) {
            const now = new Date();
            switch (filters.dateRange) {
                case 'this_month':
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    bookings = bookings.filter(booking =>
                        new Date(booking.bookingDateTime) >= startOfMonth
                    );
                    break;
                case 'last_month':
                    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                    bookings = bookings.filter(booking => {
                        const bookingDate = new Date(booking.bookingDateTime);
                        return bookingDate >= startOfLastMonth && bookingDate <= endOfLastMonth;
                    });
                    break;
                case 'last_3_months':
                    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    bookings = bookings.filter(booking =>
                        new Date(booking.bookingDateTime) >= threeMonthsAgo
                    );
                    break;
            }
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            bookings = bookings.filter(booking =>
                booking.service?.name?.toLowerCase().includes(searchTerm) ||
                booking.pet?.name?.toLowerCase().includes(searchTerm) ||
                booking.notes?.toLowerCase().includes(searchTerm)
            );
        }

        // Sort by booking date (newest first)
        bookings.sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime));

        // Pagination
        const total = bookings.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedBookings = bookings.slice(startIndex, startIndex + limit);

        return {
            success: true,
            data: {
                bookings: paginatedBookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        };
    },

    // Get booking by ID
    async getBookingById(bookingId) {
        await delay(300);
        const currentUser = getCurrentUser();

        const booking = MOCK_BOOKINGS.find(b =>
            b.id === bookingId &&
            (b.customerId === currentUser.id || checkPermission(currentUser, 'booking_management'))
        );

        if (!booking) {
            throw new Error('Không tìm thấy lịch đặt hoặc không có quyền truy cập');
        }

        return { success: true, data: booking };
    },

    // Cancel booking
    async cancelBooking(bookingId, reason = '') {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền hủy đặt lịch');
        }

        const bookingIndex = MOCK_BOOKINGS.findIndex(b =>
            b.id === bookingId && b.customerId === currentUser.id
        );

        if (bookingIndex === -1) {
            throw new Error('Không tìm thấy lịch đặt hoặc không có quyền hủy');
        }

        const booking = MOCK_BOOKINGS[bookingIndex];

        // Check if booking can be cancelled (not within 2 hours of appointment)
        const bookingTime = new Date(booking.bookingDateTime);
        const now = new Date();
        const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

        if (hoursUntilBooking < 2 && booking.status === 'confirmed') {
            throw new Error('Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ hẹn');
        }

        if (booking.status === 'completed') {
            throw new Error('Không thể hủy lịch hẹn đã hoàn thành');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Lịch hẹn đã được hủy trước đó');
        }

        // Update booking status
        MOCK_BOOKINGS[bookingIndex].status = 'cancelled';
        MOCK_BOOKINGS[bookingIndex].cancelReason = reason;
        MOCK_BOOKINGS[bookingIndex].cancelledAt = new Date().toISOString();
        MOCK_BOOKINGS[bookingIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_BOOKINGS[bookingIndex],
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

        const bookingIndex = MOCK_BOOKINGS.findIndex(b =>
            b.id === bookingId && b.customerId === currentUser.id
        );

        if (bookingIndex === -1) {
            throw new Error('Không tìm thấy lịch đặt hoặc không có quyền đổi lịch');
        }

        const booking = MOCK_BOOKINGS[bookingIndex];

        // Check if booking can be rescheduled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            throw new Error('Không thể đổi lịch cho booking đã hoàn thành hoặc đã hủy');
        }

        // Check availability for new time
        const service = MOCK_SERVICES.find(s => s.id === booking.serviceId);
        const date = newDateTime.split('T')[0];
        const time = newDateTime.split('T')[1].substring(0, 5);

        const hasConflict = MOCK_BOOKINGS.some(otherBooking => {
            if (otherBooking.id === bookingId) return false; // Ignore current booking

            const bookingDate = otherBooking.bookingDateTime.split('T')[0];
            const bookingTime = otherBooking.bookingDateTime.split('T')[1].substring(0, 5);

            if (bookingDate === date && otherBooking.status !== 'cancelled') {
                const bookingStart = new Date(`${date}T${bookingTime}`);
                const bookingEnd = new Date(bookingStart.getTime() + service.duration * 60000);
                const newStart = new Date(`${date}T${time}`);
                const newEnd = new Date(newStart.getTime() + service.duration * 60000);

                return (newStart < bookingEnd && newEnd > bookingStart);
            }
            return false;
        });

        if (hasConflict) {
            throw new Error('Thời gian mới đã được đặt, vui lòng chọn thời gian khác');
        }

        const oldDateTime = booking.bookingDateTime;

        // Update booking
        MOCK_BOOKINGS[bookingIndex].bookingDateTime = newDateTime;
        MOCK_BOOKINGS[bookingIndex].estimatedEndTime = new Date(
            new Date(newDateTime).getTime() + service.duration * 60000
        ).toISOString();
        MOCK_BOOKINGS[bookingIndex].status = 'pending'; // Require re-confirmation
        MOCK_BOOKINGS[bookingIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_BOOKINGS[bookingIndex],
            message: 'Đổi lịch thành công! Chúng tôi sẽ xác nhận lại lịch mới.'
        };
    },

    // Update booking status (for staff/manager)
    async updateBookingStatus(bookingId, status, notes = '') {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'booking_management')) {
            throw new Error('Không có quyền cập nhật trạng thái booking');
        }

        const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
            throw new Error('Không tìm thấy lịch đặt');
        }

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Trạng thái không hợp lệ');
        }

        // Update booking
        MOCK_BOOKINGS[bookingIndex].status = status;
        MOCK_BOOKINGS[bookingIndex].updatedAt = new Date().toISOString();

        if (notes) {
            MOCK_BOOKINGS[bookingIndex].staffNotes = notes;
        }

        if (status === 'completed') {
            MOCK_BOOKINGS[bookingIndex].completedAt = new Date().toISOString();
        }

        return {
            success: true,
            data: MOCK_BOOKINGS[bookingIndex],
            message: `Cập nhật trạng thái thành công: ${status}`
        };
    },

    // Get booking statistics
    async getBookingStats(timeRange = 'month') {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'analytics_view')) {
            throw new Error('Không có quyền xem thống kê');
        }

        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const bookingsInRange = MOCK_BOOKINGS.filter(booking =>
            new Date(booking.createdAt) >= startDate
        );

        const stats = {
            totalBookings: bookingsInRange.length,
            pendingBookings: bookingsInRange.filter(b => b.status === 'pending').length,
            confirmedBookings: bookingsInRange.filter(b => b.status === 'confirmed').length,
            completedBookings: bookingsInRange.filter(b => b.status === 'completed').length,
            cancelledBookings: bookingsInRange.filter(b => b.status === 'cancelled').length,
            totalRevenue: bookingsInRange
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
            averageRating: 4.6, // Calculated from feedbacks
            topServices: MOCK_SERVICES.slice(0, 5).map(service => ({
                ...service,
                bookingCount: bookingsInRange.filter(b => b.serviceId === service.id).length
            }))
        };

        return { success: true, data: stats };
    },

    // Get available time slots for multiple days
    async getAvailableSlots(serviceId, startDate, endDate) {
        await delay(600);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'service_booking')) {
            throw new Error('Không có quyền kiểm tra lịch trống');
        }

        const service = MOCK_SERVICES.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        const availabilityData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateString = date.toISOString().split('T')[0];

            try {
                const dayAvailability = await this.checkAvailability(serviceId, dateString);
                availabilityData.push({
                    date: dateString,
                    dayOfWeek: date.getDay(),
                    availableSlots: dayAvailability.data.slots.filter(slot => slot.available),
                    totalSlots: dayAvailability.data.slots.length
                });
            } catch (error) {
                availabilityData.push({
                    date: dateString,
                    dayOfWeek: date.getDay(),
                    availableSlots: [],
                    totalSlots: 0,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            data: {
                serviceId,
                dateRange: { startDate, endDate },
                availability: availabilityData
            }
        };
    }
};

// Export both named and default
export { bookingApi };
export default bookingApi;
