import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { COLORS } from '../../../../constants/colors';

const StepConfirmation = ({ formData, selectedService }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Xác nhận thông tin nhiệm vụ</Typography>

            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Loại:</Typography>
                    <Typography>{formData.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}</Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Nhiệm vụ:</Typography>
                    <Typography>
                        {formData.type === 'internal' ? formData.internalName : selectedService?.name}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Khung thời gian:</Typography>
                    <Typography>
                        {formData.timeframeType === 'day' && `Ngày: ${formData.date}`}
                        {formData.timeframeType === 'week' && `Tuần: ${formData.week}`}
                        {formData.timeframeType === 'month' && `Tháng: ${formData.month}`}
                        {formData.timeframeType === 'service_period' && selectedService?.startDate
                            ? `Khoảng: ${selectedService.startDate} → ${selectedService.endDate}`
                            : formData.timeframeType === 'service_period'
                                ? `Khoảng: ${formData.servicePeriodStart} → ${formData.servicePeriodEnd}`
                                : ''}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Ca làm:</Typography>
                    <Typography>
                        {formData.shift === 'Khung giờ tùy chỉnh'
                            ? `${formData.customShiftStart} - ${formData.customShiftEnd}`
                            : formData.shift}
                    </Typography>
                </Box>

                <Divider />

                {formData.type === 'internal' ? (
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY, mb: 1 }}>Phân công:</Typography>
                        <Typography variant="body2">Khu vực: {formData.internalAssignment.areaIds.length}</Typography>
                        <Typography variant="body2">Nhóm pet: {formData.internalAssignment.petGroups.length}</Typography>
                        <Typography variant="body2">Nhóm nhân viên: {formData.internalAssignment.staffGroups.length}</Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY, mb: 1 }}>Khung giờ đã chọn:</Typography>
                        {formData.selectedTimeSlots.map(ts => (
                            <Box key={ts} sx={{ ml: 2, mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{ts}</Typography>
                                <Typography variant="caption">
                                    {formData.timeSlotAssignments[ts]?.staffGroups.length || 0} nhóm NV,{' '}
                                    {formData.timeSlotAssignments[ts]?.petGroups.length || 0} nhóm pet,{' '}
                                    {formData.timeSlotAssignments[ts]?.areaIds.length || 0} khu vực
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default StepConfirmation;

