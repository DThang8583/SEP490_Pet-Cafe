import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Rating,
  Chip,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import { Feedback, Close, Send, Edit, Schedule } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import feedbackApi from '../../api/feedbackApi';

const FeedbackModal = ({ open, onClose, booking }) => {
  // =========================
  // STATE
  // =========================
  const [feedbackId, setFeedbackId] = useState(null);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [feedbackData, setFeedbackData] = useState({
    overallRating: 0,
    comment: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // =========================
  // LOAD FEEDBACK KHI MỞ MODAL
  // =========================
  useEffect(() => {
    if (!open || !booking?.id) return;

    const loadFeedback = async () => {
      setLoading(true);
      try {
        const res = await feedbackApi.getAllFeedbacks();
        const list = res?.data || [];

        // 🔥 LẤY ĐÚNG FEEDBACK THEO BOOKING
        const fb = list.find(
          f => f.customer_booking_id === booking.id
        );

        if (fb) {
          setFeedbackId(fb.id); // ✅ ID FEEDBACK
          setFeedbackData({
            overallRating: fb.rating,
            comment: fb.comment
          });
          setHasFeedback(true);
          setIsEditing(false);
        } else {
          setFeedbackId(null);
          setFeedbackData({ overallRating: 0, comment: '' });
          setHasFeedback(false);
          setIsEditing(true);
        }

        setErrors({});
        setSuccessMessage('');
      } catch (err) {
        console.error('[FeedbackModal] Load feedback failed', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [open, booking?.id]);

  const canEdit = !hasFeedback || isEditing;

  // =========================
  // SUBMIT / UPDATE
  // =========================
  const handleSubmit = async () => {
    if (!feedbackData.overallRating || !feedbackData.comment.trim()) {
      setErrors({ submit: 'Vui lòng nhập đủ số sao và nhận xét' });
      return;
    }

    setSubmitting(true);
    try {
      if (hasFeedback && feedbackId) {
        // UPDATE
        await feedbackApi.updateFeedback({
          feedbackId,
          bookingId: booking.id,
          serviceId: booking.service.id,
          rating: feedbackData.overallRating,
          comment: feedbackData.comment
        });
        setSuccessMessage('Cập nhật đánh giá thành công');
      } else {
        // CREATE
        await feedbackApi.submitFeedback({
          bookingId: booking.id,
          serviceId: booking.service.id,
          rating: feedbackData.overallRating,
          comment: feedbackData.comment
        });
        setSuccessMessage('Gửi đánh giá thành công');
        setHasFeedback(true);
      }

      setIsEditing(false);
    } catch (err) {
      setErrors({ submit: err.message || 'Lỗi khi lưu đánh giá' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* HEADER */}
      <DialogTitle sx={{ background: COLORS.WARNING[600], color: '#fff' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={1} alignItems="center">
            <Feedback />
            <Typography fontWeight="bold">Đánh giá dịch vụ</Typography>
          </Box>
          <Button onClick={onClose} sx={{ color: '#fff' }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ p: 4 }}>
        {loading ? (
          <Box textAlign="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={4}>
            {/* SERVICE INFO */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                borderRadius: 3,
                background: alpha(COLORS.INFO[50], 0.9)
              }}
            >
              <Box>
                <Typography fontWeight="bold">
                  {booking.service?.name}
                </Typography>
                <Chip
                  icon={<Schedule />}
                  label={new Date(booking.bookingDateTime).toLocaleDateString('vi-VN')}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Avatar sx={{ bgcolor: COLORS.SECONDARY[500] }}>
                {booking.pet?.name?.charAt(0)}
              </Avatar>
            </Box>

            {/* RATING */}
            <Box textAlign="center">
              <Typography fontWeight="bold" mb={1}>
                Đánh giá tổng thể
              </Typography>
              <Rating
                value={feedbackData.overallRating}
                disabled={!canEdit}
                onChange={(_, v) =>
                  setFeedbackData(prev => ({ ...prev, overallRating: v }))
                }
                size="large"
              />
            </Box>

            {/* COMMENT */}
            <TextField
              multiline
              rows={4}
              fullWidth
              disabled={!canEdit}
              value={feedbackData.comment}
              onChange={e =>
                setFeedbackData(prev => ({ ...prev, comment: e.target.value }))
              }
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />

            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
          </Stack>
        )}
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ p: 3 }}>
        {hasFeedback && !isEditing ? (
          <Button startIcon={<Edit />} onClick={() => setIsEditing(true)}>
            Sửa đánh giá
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Send />}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? 'Đang lưu...'
              : hasFeedback
              ? 'Cập nhật đánh giá'
              : 'Gửi đánh giá'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
