import axios from 'axios';

const API_BASE_URL = 'https://petcafes.azurewebsites.net/api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`
});

const feedbackApi = {
  // =============================
  // GET tất cả feedback
  // =============================
  async getAllFeedbacks() {
    const res = await axios.get(`${API_BASE_URL}/feedbacks`, {
      headers: authHeader()
    });
    return res.data;
  },

  // =============================
  // CREATE feedback (POST)
  // =============================
  async submitFeedback({ bookingId, serviceId, rating, comment }) {
    if (!rating || rating < 1) {
      throw new Error('Rating không hợp lệ');
    }

    return axios.post(
      `${API_BASE_URL}/feedbacks`,
      {
        customer_booking_id: bookingId,
        service_id: serviceId,
        rating,
        comment
      },
      { headers: authHeader() }
    );
  },

  // =============================
  // UPDATE feedback (PUT)
  // =============================
  async updateFeedback({
    feedbackId,
    bookingId,
    serviceId,
    rating,
    comment
  }) {
    if (!feedbackId) throw new Error('Thiếu feedbackId');
    if (!rating || rating < 1) throw new Error('Rating không hợp lệ');

    return axios.put(
      `${API_BASE_URL}/feedbacks/${feedbackId}`,
      {
        customer_booking_id: bookingId,
        service_id: serviceId,
        rating,
        comment
      },
      { headers: authHeader() }
    );
  }
};

export default feedbackApi;
