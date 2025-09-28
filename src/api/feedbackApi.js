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
        'customer': ['feedback_submission', 'feedback_view_own'],
        'working_staff': ['feedback_view_assigned'],
        'manager': ['feedback_management', 'feedback_analytics'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock feedback database
let MOCK_FEEDBACKS = [
    {
        id: 'feedback-001',
        bookingId: 'booking-003',
        customerId: 'user-007',
        serviceId: 'service-006',
        staffId: 'user-005',
        overallRating: 5,
        serviceQuality: 5,
        staffFriendliness: 5,
        cleanliness: 4,
        valueForMoney: 5,
        averageRating: 4.8,
        comment: 'Dịch vụ rất tốt, nhân viên thân thiện và chuyên nghiệp. Miu rất thích được tắm ở đây.',
        recommend: 'yes',
        improvements: 'Có thể cải thiện thêm về không gian chờ để khách hàng thoải mái hơn',
        photos: [],
        tags: ['excellent_service', 'friendly_staff', 'clean_facility'],
        submittedAt: '2024-01-27T12:00:00',
        status: 'approved'
    },
    {
        id: 'feedback-002',
        bookingId: 'booking-001',
        customerId: 'user-007',
        serviceId: 'service-001',
        staffId: 'user-005',
        overallRating: 4,
        serviceQuality: 4,
        staffFriendliness: 5,
        cleanliness: 4,
        valueForMoney: 4,
        averageRating: 4.2,
        comment: 'Dịch vụ tốt, Bông rất thích. Nhân viên rất chu đáo.',
        recommend: 'yes',
        improvements: '',
        photos: [],
        tags: ['good_service', 'caring_staff'],
        submittedAt: '2024-01-25T11:30:00',
        status: 'approved'
    }
];

// Rating criteria
const RATING_CRITERIA = [
    {
        key: 'serviceQuality',
        label: 'Chất lượng dịch vụ',
        description: 'Đánh giá về chất lượng dịch vụ chăm sóc thú cưng',
        weight: 0.3
    },
    {
        key: 'staffFriendliness',
        label: 'Thái độ nhân viên',
        description: 'Sự thân thiện và chuyên nghiệp của nhân viên',
        weight: 0.25
    },
    {
        key: 'cleanliness',
        label: 'Vệ sinh sạch sẽ',
        description: 'Độ sạch sẽ của không gian và dụng cụ',
        weight: 0.2
    },
    {
        key: 'valueForMoney',
        label: 'Giá trị đồng tiền',
        description: 'Mức độ xứng đáng giữa giá cả và chất lượng',
        weight: 0.25
    }
];

// Feedback APIs
const feedbackApi = {
    // Submit feedback
    async submitFeedback(feedbackData) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_submission')) {
            throw new Error('Không có quyền gửi phản hồi');
        }

        // Validate required fields
        if (!feedbackData.bookingId) {
            throw new Error('Thiếu thông tin booking');
        }

        if (!feedbackData.overallRating || feedbackData.overallRating < 1 || feedbackData.overallRating > 5) {
            throw new Error('Đánh giá tổng thể phải từ 1-5 sao');
        }

        if (!feedbackData.comment || feedbackData.comment.trim().length < 10) {
            throw new Error('Nhận xét phải có ít nhất 10 ký tự');
        }

        if (!feedbackData.recommend) {
            throw new Error('Thiếu thông tin giới thiệu');
        }

        // Calculate average rating from detailed ratings
        const detailRatings = [
            feedbackData.serviceQuality,
            feedbackData.staffFriendliness,
            feedbackData.cleanliness,
            feedbackData.valueForMoney
        ].filter(rating => rating > 0);

        const averageRating = detailRatings.length > 0 ?
            detailRatings.reduce((sum, rating) => sum + rating, 0) / detailRatings.length :
            feedbackData.overallRating;

        // Auto-generate tags based on ratings and content
        const tags = [];
        if (feedbackData.overallRating >= 5) tags.push('excellent_service');
        else if (feedbackData.overallRating >= 4) tags.push('good_service');
        else if (feedbackData.overallRating >= 3) tags.push('average_service');
        else tags.push('needs_improvement');

        if (feedbackData.staffFriendliness >= 5) tags.push('friendly_staff');
        if (feedbackData.cleanliness >= 5) tags.push('clean_facility');
        if (feedbackData.valueForMoney >= 5) tags.push('good_value');
        if (feedbackData.recommend === 'yes') tags.push('recommended');

        const newFeedback = {
            id: generateId('feedback'),
            bookingId: feedbackData.bookingId,
            customerId: currentUser.id,
            serviceId: feedbackData.serviceId,
            staffId: feedbackData.staffId,
            overallRating: feedbackData.overallRating,
            serviceQuality: feedbackData.serviceQuality || 0,
            staffFriendliness: feedbackData.staffFriendliness || 0,
            cleanliness: feedbackData.cleanliness || 0,
            valueForMoney: feedbackData.valueForMoney || 0,
            averageRating: Math.round(averageRating * 10) / 10,
            comment: feedbackData.comment.trim(),
            recommend: feedbackData.recommend,
            improvements: feedbackData.improvements?.trim() || '',
            photos: feedbackData.photos || [],
            tags: tags,
            submittedAt: new Date().toISOString(),
            status: 'pending_review' // Will be approved by manager
        };

        MOCK_FEEDBACKS.push(newFeedback);

        return {
            success: true,
            data: newFeedback,
            message: 'Gửi phản hồi thành công. Cảm ơn bạn đã chia sẻ!'
        };
    },

    // Get feedback by booking ID
    async getFeedbackByBooking(bookingId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_view_own')) {
            throw new Error('Không có quyền xem phản hồi');
        }

        const feedback = MOCK_FEEDBACKS.find(f =>
            f.bookingId === bookingId && f.customerId === currentUser.id
        );

        if (!feedback) {
            return { success: true, data: null, message: 'Chưa có phản hồi cho booking này' };
        }

        return { success: true, data: feedback };
    },

    // Get customer's feedback history
    async getMyFeedbacks(page = 1, limit = 10) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_view_own')) {
            throw new Error('Không có quyền xem lịch sử phản hồi');
        }

        let feedbacks = MOCK_FEEDBACKS.filter(f => f.customerId === currentUser.id);

        // Sort by submission date (newest first)
        feedbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        // Pagination
        const total = feedbacks.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedFeedbacks = feedbacks.slice(startIndex, startIndex + limit);

        return {
            success: true,
            data: {
                feedbacks: paginatedFeedbacks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        };
    },

    // Get service feedbacks (public)
    async getServiceFeedbacks(serviceId, page = 1, limit = 10, filters = {}) {
        await delay(300);

        let feedbacks = MOCK_FEEDBACKS.filter(f =>
            f.serviceId === serviceId && f.status === 'approved'
        );

        // Apply filters
        if (filters.minRating) {
            feedbacks = feedbacks.filter(f => f.overallRating >= filters.minRating);
        }

        if (filters.hasPhotos) {
            feedbacks = feedbacks.filter(f => f.photos && f.photos.length > 0);
        }

        if (filters.verified) {
            feedbacks = feedbacks.filter(f => f.verified === true);
        }

        // Sort options
        switch (filters.sortBy) {
            case 'rating_high':
                feedbacks.sort((a, b) => b.overallRating - a.overallRating);
                break;
            case 'rating_low':
                feedbacks.sort((a, b) => a.overallRating - b.overallRating);
                break;
            case 'helpful':
                feedbacks.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
                break;
            default:
                feedbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        }

        // Pagination
        const total = feedbacks.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedFeedbacks = feedbacks.slice(startIndex, startIndex + limit);

        // Calculate statistics
        const stats = {
            totalFeedbacks: total,
            averageRating: total > 0 ? feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / total : 0,
            ratingDistribution: {
                5: feedbacks.filter(f => f.overallRating === 5).length,
                4: feedbacks.filter(f => f.overallRating === 4).length,
                3: feedbacks.filter(f => f.overallRating === 3).length,
                2: feedbacks.filter(f => f.overallRating === 2).length,
                1: feedbacks.filter(f => f.overallRating === 1).length
            },
            recommendationRate: total > 0 ?
                (feedbacks.filter(f => f.recommend === 'yes').length / total) * 100 : 0
        };

        return {
            success: true,
            data: {
                feedbacks: paginatedFeedbacks,
                stats,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        };
    },

    // Get feedback analytics (for management)
    async getFeedbackAnalytics(timeRange = 'month') {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_analytics')) {
            throw new Error('Không có quyền xem phân tích phản hồi');
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

        const feedbacksInRange = MOCK_FEEDBACKS.filter(f =>
            new Date(f.submittedAt) >= startDate
        );

        const analytics = {
            total: feedbacksInRange.length,
            averageRating: feedbacksInRange.length > 0 ?
                feedbacksInRange.reduce((sum, f) => sum + f.overallRating, 0) / feedbacksInRange.length : 0,

            criteriaAverages: {
                serviceQuality: feedbacksInRange.length > 0 ?
                    feedbacksInRange.reduce((sum, f) => sum + (f.serviceQuality || 0), 0) / feedbacksInRange.length : 0,
                staffFriendliness: feedbacksInRange.length > 0 ?
                    feedbacksInRange.reduce((sum, f) => sum + (f.staffFriendliness || 0), 0) / feedbacksInRange.length : 0,
                cleanliness: feedbacksInRange.length > 0 ?
                    feedbacksInRange.reduce((sum, f) => sum + (f.cleanliness || 0), 0) / feedbacksInRange.length : 0,
                valueForMoney: feedbacksInRange.length > 0 ?
                    feedbacksInRange.reduce((sum, f) => sum + (f.valueForMoney || 0), 0) / feedbacksInRange.length : 0
            },

            ratingDistribution: {
                5: feedbacksInRange.filter(f => f.overallRating === 5).length,
                4: feedbacksInRange.filter(f => f.overallRating === 4).length,
                3: feedbacksInRange.filter(f => f.overallRating === 3).length,
                2: feedbacksInRange.filter(f => f.overallRating === 2).length,
                1: feedbacksInRange.filter(f => f.overallRating === 1).length
            },

            recommendationStats: {
                yes: feedbacksInRange.filter(f => f.recommend === 'yes').length,
                maybe: feedbacksInRange.filter(f => f.recommend === 'maybe').length,
                no: feedbacksInRange.filter(f => f.recommend === 'no').length,
                rate: feedbacksInRange.length > 0 ?
                    (feedbacksInRange.filter(f => f.recommend === 'yes').length / feedbacksInRange.length) * 100 : 0
            },

            topTags: [
                { tag: 'excellent_service', count: feedbacksInRange.filter(f => f.tags?.includes('excellent_service')).length },
                { tag: 'friendly_staff', count: feedbacksInRange.filter(f => f.tags?.includes('friendly_staff')).length },
                { tag: 'clean_facility', count: feedbacksInRange.filter(f => f.tags?.includes('clean_facility')).length },
                { tag: 'good_value', count: feedbacksInRange.filter(f => f.tags?.includes('good_value')).length },
                { tag: 'recommended', count: feedbacksInRange.filter(f => f.tags?.includes('recommended')).length }
            ].sort((a, b) => b.count - a.count),

            serviceBreakdown: {},
            staffBreakdown: {},

            sentimentAnalysis: {
                positive: feedbacksInRange.filter(f => f.overallRating >= 4).length,
                neutral: feedbacksInRange.filter(f => f.overallRating === 3).length,
                negative: feedbacksInRange.filter(f => f.overallRating <= 2).length
            },

            improvementSuggestions: feedbacksInRange
                .filter(f => f.improvements && f.improvements.trim())
                .map(f => ({
                    suggestion: f.improvements,
                    rating: f.overallRating,
                    serviceId: f.serviceId,
                    submittedAt: f.submittedAt
                }))
                .slice(0, 10) // Top 10 recent suggestions
        };

        // Calculate service breakdown
        const serviceIds = [...new Set(feedbacksInRange.map(f => f.serviceId))];
        serviceIds.forEach(serviceId => {
            const serviceFeedbacks = feedbacksInRange.filter(f => f.serviceId === serviceId);
            analytics.serviceBreakdown[serviceId] = {
                count: serviceFeedbacks.length,
                averageRating: serviceFeedbacks.reduce((sum, f) => sum + f.overallRating, 0) / serviceFeedbacks.length,
                recommendationRate: (serviceFeedbacks.filter(f => f.recommend === 'yes').length / serviceFeedbacks.length) * 100
            };
        });

        // Calculate staff breakdown
        const staffIds = [...new Set(feedbacksInRange.map(f => f.staffId))];
        staffIds.forEach(staffId => {
            const staffFeedbacks = feedbacksInRange.filter(f => f.staffId === staffId);
            analytics.staffBreakdown[staffId] = {
                count: staffFeedbacks.length,
                averageRating: staffFeedbacks.reduce((sum, f) => sum + f.overallRating, 0) / staffFeedbacks.length,
                friendlinessRating: staffFeedbacks.reduce((sum, f) => sum + (f.staffFriendliness || 0), 0) / staffFeedbacks.length
            };
        });

        return { success: true, data: analytics };
    },

    // Get customer feedback history
    async getMyFeedbacks(page = 1, limit = 10) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'feedback_view_own')) {
            throw new Error('Không có quyền xem phản hồi của mình');
        }

        let feedbacks = MOCK_FEEDBACKS.filter(f => f.customerId === currentUser.id);

        // Sort by submission date (newest first)
        feedbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        // Pagination
        const total = feedbacks.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedFeedbacks = feedbacks.slice(startIndex, startIndex + limit);

        return {
            success: true,
            data: {
                feedbacks: paginatedFeedbacks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        };
    },

    // Update feedback (edit before approval)
    async updateFeedback(feedbackId, updates) {
        await delay(300);
        const currentUser = getCurrentUser();

        const feedbackIndex = MOCK_FEEDBACKS.findIndex(f =>
            f.id === feedbackId && f.customerId === currentUser.id
        );

        if (feedbackIndex === -1) {
            throw new Error('Không tìm thấy phản hồi hoặc không có quyền chỉnh sửa');
        }

        const feedback = MOCK_FEEDBACKS[feedbackIndex];

        if (feedback.status === 'approved') {
            throw new Error('Không thể chỉnh sửa phản hồi đã được phê duyệt');
        }

        // Update allowed fields
        const allowedFields = ['overallRating', 'serviceQuality', 'staffFriendliness', 'cleanliness', 'valueForMoney', 'comment', 'recommend', 'improvements'];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                MOCK_FEEDBACKS[feedbackIndex][field] = updates[field];
            }
        });

        // Recalculate average rating
        const detailRatings = [
            updates.serviceQuality || feedback.serviceQuality,
            updates.staffFriendliness || feedback.staffFriendliness,
            updates.cleanliness || feedback.cleanliness,
            updates.valueForMoney || feedback.valueForMoney
        ].filter(rating => rating > 0);

        if (detailRatings.length > 0) {
            MOCK_FEEDBACKS[feedbackIndex].averageRating = Math.round(
                (detailRatings.reduce((sum, rating) => sum + rating, 0) / detailRatings.length) * 10
            ) / 10;
        }

        MOCK_FEEDBACKS[feedbackIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_FEEDBACKS[feedbackIndex],
            message: 'Cập nhật phản hồi thành công'
        };
    },

    // Delete feedback (before approval)
    async deleteFeedback(feedbackId) {
        await delay(250);
        const currentUser = getCurrentUser();

        const feedbackIndex = MOCK_FEEDBACKS.findIndex(f =>
            f.id === feedbackId && f.customerId === currentUser.id
        );

        if (feedbackIndex === -1) {
            throw new Error('Không tìm thấy phản hồi hoặc không có quyền xóa');
        }

        const feedback = MOCK_FEEDBACKS[feedbackIndex];

        if (feedback.status === 'approved') {
            throw new Error('Không thể xóa phản hồi đã được phê duyệt');
        }

        const deletedFeedback = MOCK_FEEDBACKS[feedbackIndex];
        MOCK_FEEDBACKS.splice(feedbackIndex, 1);

        return {
            success: true,
            data: deletedFeedback,
            message: 'Xóa phản hồi thành công'
        };
    },

    // Get feedback statistics
    async getFeedbackStats(serviceId = null, staffId = null) {
        await delay(200);

        let feedbacks = MOCK_FEEDBACKS.filter(f => f.status === 'approved');

        // Filter by service or staff if specified
        if (serviceId) {
            feedbacks = feedbacks.filter(f => f.serviceId === serviceId);
        }

        if (staffId) {
            feedbacks = feedbacks.filter(f => f.staffId === staffId);
        }

        if (feedbacks.length === 0) {
            return {
                success: true,
                data: {
                    totalFeedbacks: 0,
                    averageRating: 0,
                    recommendationRate: 0,
                    criteriaAverages: {},
                    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                }
            };
        }

        const stats = {
            totalFeedbacks: feedbacks.length,
            averageRating: Math.round((feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length) * 10) / 10,

            criteriaAverages: {
                serviceQuality: Math.round((feedbacks.reduce((sum, f) => sum + (f.serviceQuality || 0), 0) / feedbacks.length) * 10) / 10,
                staffFriendliness: Math.round((feedbacks.reduce((sum, f) => sum + (f.staffFriendliness || 0), 0) / feedbacks.length) * 10) / 10,
                cleanliness: Math.round((feedbacks.reduce((sum, f) => sum + (f.cleanliness || 0), 0) / feedbacks.length) * 10) / 10,
                valueForMoney: Math.round((feedbacks.reduce((sum, f) => sum + (f.valueForMoney || 0), 0) / feedbacks.length) * 10) / 10
            },

            ratingDistribution: {
                5: feedbacks.filter(f => f.overallRating === 5).length,
                4: feedbacks.filter(f => f.overallRating === 4).length,
                3: feedbacks.filter(f => f.overallRating === 3).length,
                2: feedbacks.filter(f => f.overallRating === 2).length,
                1: feedbacks.filter(f => f.overallRating === 1).length
            },

            recommendationRate: Math.round((feedbacks.filter(f => f.recommend === 'yes').length / feedbacks.length) * 100),

            topTags: [
                { tag: 'excellent_service', count: feedbacks.filter(f => f.tags?.includes('excellent_service')).length },
                { tag: 'friendly_staff', count: feedbacks.filter(f => f.tags?.includes('friendly_staff')).length },
                { tag: 'clean_facility', count: feedbacks.filter(f => f.tags?.includes('clean_facility')).length },
                { tag: 'good_value', count: feedbacks.filter(f => f.tags?.includes('good_value')).length }
            ].sort((a, b) => b.count - a.count),

            sentimentTrend: {
                positive: feedbacks.filter(f => f.overallRating >= 4).length,
                neutral: feedbacks.filter(f => f.overallRating === 3).length,
                negative: feedbacks.filter(f => f.overallRating <= 2).length
            }
        };

        return { success: true, data: stats };
    },

    // Get rating criteria
    async getRatingCriteria() {
        await delay(100);

        return { success: true, data: RATING_CRITERIA };
    }
};

// Export both named and default
export { feedbackApi };
export default feedbackApi;
