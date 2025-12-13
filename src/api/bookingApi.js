import axios from 'axios';
import apiClient from '../config/config';

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
    // Get cafe service sessions for a specific date (petRequired === false)
    async getCafeSessions(serviceId, date) {
        await delay(250);

        // Validate service and date
        const service = MOCK_SERVICES.find(s => s.id === serviceId);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }

        // Only applicable for cafe_service (petRequired === false) and services with defined period
        if (service.petRequired !== false) {
            throw new Error('Dịch vụ này không phải loại của cửa hàng');
        }

        const dateStr = date;

        // Check date within service period if provided
        if (service.serviceStartDate && service.serviceEndDate) {
            if (dateStr < service.serviceStartDate || dateStr > service.serviceEndDate) {
                return { success: true, data: { date: dateStr, sessions: [] } };
            }
        }

        // Determine session duration and daily time range
        const minutesPerSession = service.duration; // fixed per service
        const dayStartMinutes = service.serviceStartTime ?? 9 * 60; // fallback 09:00
        const dayEndMinutes = service.serviceEndTime ?? 17 * 60;   // fallback 17:00

        // Build sessions between [start, end)
        const sessions = [];
        for (let start = dayStartMinutes; start + minutesPerSession <= dayEndMinutes; start += minutesPerSession) {
            const end = start + minutesPerSession;
            const startHH = String(Math.floor(start / 60)).padStart(2, '0');
            const startMM = String(start % 60).padStart(2, '0');
            const endHH = String(Math.floor(end / 60)).padStart(2, '0');
            const endMM = String(end % 60).padStart(2, '0');
            const sessionId = `${dateStr}-${startHH}:${startMM}`;

            // Compute current participants for this session from existing bookings
            const currentParticipants = MOCK_BOOKINGS.filter(b =>
                b.serviceId === serviceId &&
                b.sessionId === sessionId &&
                b.status !== 'cancelled'
            ).length;

            const capacity = service.maxParticipants ?? 6;
            const remaining = Math.max(capacity - currentParticipants, 0);
            const status = remaining > 0 ? 'available' : 'full';

            sessions.push({
                id: sessionId,
                startTime: `${startHH}:${startMM}`,
                endTime: `${endHH}:${endMM}`,
                duration: minutesPerSession,
                capacity,
                currentParticipants,
                remaining,
                status
            });
        }

        return { success: true, data: { date: dateStr, sessions } };
    },
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

        // For pet care services, pet info is required; for cafe_service, it's not
        const service = MOCK_SERVICES.find(s => s.id === bookingData.service.id);
        if (!service) {
            throw new Error('Không tìm thấy dịch vụ');
        }
        const isCafeService = service.petRequired === false;

        if (!isCafeService && !bookingData.pet?.id) {
            throw new Error('Thiếu thông tin thú cưng');
        }

        if (!bookingData.bookingDateTime) {
            throw new Error('Thiếu thông tin ngày giờ');
        }

        if (!bookingData.customerInfo?.name || !bookingData.customerInfo?.phone) {
            throw new Error('Thiếu thông tin liên hệ');
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

        // Determine payment status based on provided payment data/method
        let paymentStatus = 'unpaid';
        if (bookingData.paymentMethod === 'qr_transfer' || bookingData.paymentMethod === 'credit_card' || bookingData.paymentMethod === 'e_wallet') {
            paymentStatus = bookingData.status === 'completed' ? 'paid' : (bookingData.paymentStatus || 'pending');
        } else if (bookingData.paymentMethod === 'counter_payment') {
            paymentStatus = bookingData.paymentStatus || 'pending';
        }

        const newBooking = {
            id: generateId('booking'),
            customerId: currentUser.id,
            petId: bookingData.pet?.id,
            serviceId: service.id,
            staffId: assignedStaff?.id,
            bookingDateTime: bookingData.bookingDateTime,
            estimatedEndTime: endTime.toISOString(),
            status: bookingData.serviceStatus || (service.autoApprove ? 'confirmed' : 'pending'),
            notes: bookingData.notes || '',
            finalPrice: bookingData.finalPrice || service.price,
            paymentStatus,
            paymentMethod: bookingData.paymentMethod || 'credit_card',
            customerInfo: bookingData.customerInfo,
            service: bookingData.service,
            pet: bookingData.pet,
            // For cafe_service sessions
            sessionId: isCafeService ? bookingData.sessionId : undefined,
            participants: isCafeService ? (bookingData.participants || 1) : undefined,
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
        try {
            const currentUser = getCurrentUser();
            console.log('[bookingApi.getMyBookings] Current user:', currentUser);

            if (!checkPermission(currentUser, 'service_booking')) {
                throw new Error('Không có quyền xem lịch đặt');
            }

            // Get auth token first
            const token = localStorage.getItem('authToken');

            // Decode JWT token to get nameid (customer_id)
            let nameIdFromToken = null;

            if (token) {
                try {
                    // JWT format: header.payload.signature
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        // Decode payload (base64url)
                        const payload = parts[1];
                        // Replace URL-safe base64 characters
                        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                        // Add padding if needed
                        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
                        const decoded = JSON.parse(atob(padded));
                        // nameid can be in different claim names
                        nameIdFromToken = decoded.nameid || decoded.nameId || decoded.sub || decoded.user_id || decoded.id;
                        console.log('[bookingApi.getMyBookings] Decoded token payload:', decoded);
                        console.log('[bookingApi.getMyBookings] nameid from token:', nameIdFromToken);
                    }
                } catch (decodeError) {
                    console.warn('[bookingApi.getMyBookings] Could not decode token:', decodeError);
                }
            }

            // Try to get customer_id from different possible fields
            // For customer role, prefer nameid from token > customer_id > id
            let customerId;
            if (currentUser.role === 'customer') {
                customerId = nameIdFromToken || currentUser.customer_id || currentUser.id;
            } else {
                customerId = currentUser.id;
            }
            console.log('[bookingApi.getMyBookings] Current user:', currentUser);
            console.log('[bookingApi.getMyBookings] Customer ID (final):', customerId);

            if (!customerId) {
                console.error('[bookingApi.getMyBookings] No customer ID found. Current user:', currentUser);
                throw new Error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'all') {
                const statusMap = {
                    'pending': 'PENDING',
                    'confirmed': 'CONFIRMED',
                    'in_progress': 'IN_PROGRESS',
                    'completed': 'COMPLETED',
                    'cancelled': 'CANCELLED'
                };
                params.append('booking_status', statusMap[filters.status] || filters.status.toUpperCase());
            }
            if (filters.serviceId) {
                params.append('service_id', filters.serviceId);
            }
            if (filters.dateFrom) {
                params.append('from_date', filters.dateFrom);
            }
            if (filters.dateTo) {
                params.append('to_date', filters.dateTo);
            }
            params.append('limit', '100'); // Get more bookings

            const queryString = params.toString();
            const url = `https://petcafes.azurewebsites.net/api/customers/${customerId}/bookings${queryString ? `?${queryString}` : ''}`;

            console.log('[bookingApi.getMyBookings] Fetching from:', url);

            // Call API to get bookings
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            const rawText = await response.text();
            let jsonData = null;

            try {
                jsonData = JSON.parse(rawText);
            } catch (e) {
                console.error('[bookingApi.getMyBookings] Error parsing response:', e);
                throw new Error('Phản hồi từ server không hợp lệ');
            }

            if (!response.ok) {
                const errorMsg = jsonData?.message || jsonData?.error || 'Không thể tải lịch sử đặt lịch';
                throw new Error(errorMsg);
            }

            // Parse response data
            const bookingsData = jsonData?.data || jsonData || [];
            console.log('[bookingApi.getMyBookings] Raw bookings data:', bookingsData);
            console.log('[bookingApi.getMyBookings] Is array?', Array.isArray(bookingsData));
            console.log('[bookingApi.getMyBookings] Length:', Array.isArray(bookingsData) ? bookingsData.length : 'N/A');

            // Map API response to component format
            const mappedBookings = Array.isArray(bookingsData) ? bookingsData.map(booking => {
                console.log('[bookingApi.getMyBookings] Mapping booking:', booking.id, booking.service?.name);
                return {
                    id: booking.id,
                    serviceId: booking.service_id || booking.service?.id,
                    service: booking.service ? {
                        id: booking.service.id,
                        name: booking.service.name || 'Dịch vụ không xác định',
                        description: booking.service.description,
                        base_price: booking.service.base_price || 0,
                        image_url: booking.service.image_url,
                        thumbnails: booking.service.thumbnails
                    } : null,
                    slot: booking.slot,
                    team: booking.team,
                    pet_group: booking.slot?.pet_group,
                    area: booking.slot?.area,
                    bookingDateTime: booking.booking_date || booking.created_at,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    finalPrice: booking.slot?.price || booking.service?.base_price || 0,
                    status: (booking.booking_status || 'PENDING').toLowerCase(),
                    booking_status: booking.booking_status || 'PENDING',
                    notes: booking.notes || '',
                    cancel_date: booking.cancel_date,
                    cancel_reason: booking.cancel_reason,
                    paymentStatus: booking.payment_status ? (booking.payment_status === 'PAID' ? 'paid' : 'unpaid') : 'unpaid',
                    payment_status: booking.payment_status,
                    feedback: booking.feedback,
                    // Keep original data for reference
                    ...booking
                };
            }) : [];

            console.log('[bookingApi.getMyBookings] Mapped bookings:', mappedBookings);

            return { success: true, data: mappedBookings };
        } catch (error) {
            console.error('[bookingApi.getMyBookings] Error:', error);
            // Fallback to mock data if API fails (for development)
            if (process.env.NODE_ENV === 'development') {
                console.warn('[bookingApi.getMyBookings] Falling back to mock data');
                const currentUser = getCurrentUser();
                let bookings = MOCK_BOOKINGS.filter(booking =>
                    booking.customerId === currentUser.id
                );
                bookings.sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime));
                return { success: true, data: bookings };
            }
            throw error;
        }
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

/**
 * Get bookings with filters
 * Official API: GET /api/bookings
 * Parameters: booking_status, from_date, to_date, team_id, service_id, customer_id, page, limit
 */
const getBookings = async (params = {}) => {
    try {
        const {
            booking_status,
            from_date,
            to_date,
            team_id,
            service_id,
            customer_id,
            page = 1,
            limit = 10
        } = params;

        const queryParams = new URLSearchParams();

        if (booking_status) queryParams.append('booking_status', booking_status);
        if (from_date) queryParams.append('from_date', from_date);
        if (to_date) queryParams.append('to_date', to_date);
        if (team_id) queryParams.append('team_id', team_id);
        if (service_id) queryParams.append('service_id', service_id);
        if (customer_id) queryParams.append('customer_id', customer_id);
        queryParams.append('page', page);
        queryParams.append('limit', limit);

        const response = await apiClient.get(`/bookings?${queryParams.toString()}`, { timeout: 10000 });

        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                total_items_count: 0,
                page_size: limit,
                total_pages_count: 0,
                page_index: page - 1,
                has_next: false,
                has_previous: false
            }
        };
    } catch (error) {
        console.error('Error fetching bookings:', error);

        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                throw new Error(Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error);
            }
        }

        throw error;
    }
};

/**
 * Update booking
 * Official API: PUT /api/bookings/{id}
 * Request: { booking_status, notes, cancel_reason }
 */
const updateBooking = async (bookingId, bookingData) => {
    try {
        if (!bookingId) {
            throw new Error('ID booking là bắt buộc');
        }

        const requestData = {};
        if (bookingData.booking_status) requestData.booking_status = bookingData.booking_status;
        if (bookingData.notes !== undefined) requestData.notes = bookingData.notes;
        if (bookingData.cancel_reason !== undefined) requestData.cancel_reason = bookingData.cancel_reason;

        const response = await apiClient.put(`/bookings/${bookingId}`, requestData, { timeout: 10000 });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật booking thành công'
        };
    } catch (error) {
        console.error('Error updating booking:', error);

        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.message) {
                throw new Error(Array.isArray(errorData.message) ? errorData.message.join('. ') : errorData.message);
            }
            if (errorData.error) {
                throw new Error(Array.isArray(errorData.error) ? errorData.error.join('. ') : errorData.error);
            }
        }

        throw error;
    }
};

// Export both named and default
export { bookingApi, getBookings, updateBooking };
export default bookingApi;
