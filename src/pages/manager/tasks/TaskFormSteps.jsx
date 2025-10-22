import React from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Alert, Divider, Autocomplete, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getWorkTypesForTasks } from '../../../api/tasksApi';
import { COLORS } from '../../../constants/colors';
import { InternalAssignment, ServiceAssignment } from './TaskAssignments';
import slotApi from '../../../api/slotApi';
import workshiftApi from '../../../api/workshiftApi';

// ==================== STEP 1: Task Type ====================
export const StepTaskType = ({ formData, setFormData }) => {
    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.ERROR[700] }}>
                Chọn loại nhiệm vụ
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                Chọn loại nhiệm vụ bạn muốn tạo
            </Typography>

            <Stack spacing={2}>
                <Box
                    onClick={() => setFormData({ ...formData, type: 'internal' })}
                    sx={{
                        p: 3,
                        border: `2px solid ${formData.type === 'internal' ? COLORS.PRIMARY[500] : alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: formData.type === 'internal' ? alpha(COLORS.PRIMARY[50], 0.5) : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: COLORS.PRIMARY[400],
                            bgcolor: alpha(COLORS.PRIMARY[50], 0.3)
                        }
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: formData.type === 'internal' ? COLORS.PRIMARY[500] : alpha(COLORS.PRIMARY[200], 0.5),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: 'white' }}>🏢</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Nhiệm vụ nội bộ
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Công việc nội bộ của cửa hàng (dọn dẹp, chăm sóc pet, v.v.)
                            </Typography>
                        </Box>
                        {formData.type === 'internal' && (
                            <Chip
                                label="✓ Đã chọn"
                                size="small"
                                sx={{
                                    bgcolor: COLORS.PRIMARY[500],
                                    color: 'white',
                                    fontWeight: 700
                                }}
                            />
                        )}
                    </Stack>
                </Box>

                <Box
                    onClick={() => setFormData({ ...formData, type: 'service' })}
                    sx={{
                        p: 3,
                        border: `2px solid ${formData.type === 'service' ? COLORS.SECONDARY[500] : alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: formData.type === 'service' ? alpha(COLORS.SECONDARY[50], 0.5) : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: COLORS.SECONDARY[400],
                            bgcolor: alpha(COLORS.SECONDARY[50], 0.3)
                        }
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: formData.type === 'service' ? COLORS.SECONDARY[500] : alpha(COLORS.SECONDARY[200], 0.5),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="h6" sx={{ color: 'white' }}>🎯</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.TEXT.PRIMARY }}>
                                Nhiệm vụ dịch vụ
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                Phục vụ khách hàng và thú cưng của họ
                            </Typography>
                        </Box>
                        {formData.type === 'service' && (
                            <Chip
                                label="✓ Đã chọn"
                                size="small"
                                sx={{
                                    bgcolor: COLORS.SECONDARY[500],
                                    color: 'white',
                                    fontWeight: 700
                                }}
                            />
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

// ==================== STEP 2: Select Task ====================
export const StepSelectTask = ({ formData, setFormData, services, isEditMode }) => {
    const [workTypes, setWorkTypes] = React.useState([]);
    const [loadingWorkTypes, setLoadingWorkTypes] = React.useState(false);

    // Fetch work types for internal tasks
    React.useEffect(() => {
        if (formData.type === 'internal') {
            setLoadingWorkTypes(true);
            getWorkTypesForTasks()
                .then(types => {
                    setWorkTypes(types);
                })
                .catch(error => {
                    console.error('Error loading work types:', error);
                })
                .finally(() => {
                    setLoadingWorkTypes(false);
                });
        }
    }, [formData.type]);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.ERROR[700] }}>
                {formData.type === 'internal' ? 'Chọn nhiệm vụ nội bộ' : 'Chọn dịch vụ'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                {formData.type === 'internal' ? 'Chọn loại công việc nội bộ cần phân công' : 'Chọn dịch vụ cần phân công nhân viên'}
            </Typography>

            {isEditMode && (
                <Alert
                    severity="info"
                    sx={{
                        mb: 3,
                        borderLeft: `4px solid ${COLORS.INFO[500]}`,
                        bgcolor: alpha(COLORS.INFO[50], 0.5)
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <strong>Loại nhiệm vụ:</strong> {formData.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}
                        {' '}<em>(Không thể thay đổi khi chỉnh sửa)</em>
                    </Typography>
                </Alert>
            )}

            {formData.type === 'internal' ? (
                <Stack spacing={2}>
                    {loadingWorkTypes ? (
                        <Alert severity="info">Đang tải danh sách nhiệm vụ...</Alert>
                    ) : (
                        <FormControl fullWidth>
                            <InputLabel>Chọn loại nhiệm vụ</InputLabel>
                            <Select
                                value={formData.internalWorkTypeId || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    internalWorkTypeId: e.target.value,
                                    internalName: workTypes.find(wt => wt.id === e.target.value)?.name || ''
                                })}
                                label="Chọn loại nhiệm vụ"
                            >
                                {workTypes.map(wt => (
                                    <MenuItem key={wt.id} value={wt.id}>
                                        <Box>
                                            <Typography variant="body2">{wt.name}</Typography>
                                            {wt.description && (
                                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                    {wt.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Stack>
            ) : (
                <FormControl fullWidth>
                    <InputLabel>Chọn dịch vụ</InputLabel>
                    <Select
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        label="Chọn dịch vụ"
                    >
                        {(services || []).map(s => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};

// ==================== STEP 3: Timeframe ====================
export const StepTimeframe = ({ formData, setFormData, selectedService }) => {
    const [serviceSlots, setServiceSlots] = React.useState([]);
    const [loadingSlots, setLoadingSlots] = React.useState(false);
    const [availableWeekdays, setAvailableWeekdays] = React.useState([]);

    const WEEKDAY_LABELS_VI = {
        'MONDAY': 'Thứ Hai',
        'TUESDAY': 'Thứ Ba',
        'WEDNESDAY': 'Thứ Tư',
        'THURSDAY': 'Thứ Năm',
        'FRIDAY': 'Thứ Sáu',
        'SATURDAY': 'Thứ Bảy',
        'SUNDAY': 'Chủ Nhật'
    };

    // Fetch service slots and extract available weekdays
    React.useEffect(() => {
        if (formData.type === 'service' && selectedService) {
            setLoadingSlots(true);
            slotApi.getSlotsByService(selectedService.id)
                .then(response => {
                    if (response.success && response.data.length > 0) {
                        setServiceSlots(response.data);

                        // Collect all unique weekdays from applicable_days
                        const weekdaysSet = new Set();
                        response.data.forEach(slot => {
                            if (slot.applicable_days && Array.isArray(slot.applicable_days)) {
                                slot.applicable_days.forEach(day => weekdaysSet.add(day));
                            }
                        });
                        setAvailableWeekdays(Array.from(weekdaysSet));
                    }
                })
                .catch(error => {
                    console.error('Error fetching slots:', error);
                })
                .finally(() => {
                    setLoadingSlots(false);
                });
        }
    }, [formData.type, selectedService]);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.ERROR[700] }}>
                Chọn khung thời gian
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                Xác định thời gian thực hiện nhiệm vụ
            </Typography>

            {formData.type === 'internal' ? (
                <Stack spacing={2}>
                    <RadioGroup
                        value={formData.timeframeType}
                        onChange={(e) => setFormData({ ...formData, timeframeType: e.target.value })}
                    >
                        <FormControlLabel value="day" control={<Radio />} label="Theo ngày" />
                        <FormControlLabel value="week" control={<Radio />} label="Theo tuần" />
                        <FormControlLabel value="month" control={<Radio />} label="Theo tháng" />
                    </RadioGroup>

                    {formData.timeframeType === 'day' && (
                        <TextField
                            type="date"
                            label="Chọn ngày"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                    {formData.timeframeType === 'week' && (
                        <TextField
                            type="week"
                            label="Chọn tuần"
                            value={formData.week}
                            onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                    {formData.timeframeType === 'month' && (
                        <TextField
                            type="month"
                            label="Chọn tháng"
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    )}
                </Stack>
            ) : (
                <Stack spacing={2}>
                    {loadingSlots ? (
                        <Alert severity="info">Đang tải thông tin ca dịch vụ...</Alert>
                    ) : availableWeekdays.length > 0 ? (
                        <>
                            <Typography variant="body2" sx={{ mb: 1, color: COLORS.TEXT.SECONDARY }}>
                                Dịch vụ này có ca vào các ngày dưới đây. Chọn các thứ bạn muốn phân công nhiệm vụ:
                            </Typography>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: 1.5
                            }}>
                                {availableWeekdays.map(day => {
                                    const isSelected = (formData.selectedWeekdays || []).includes(day);
                                    return (
                                        <Box
                                            key={day}
                                            onClick={() => {
                                                const currentSelected = formData.selectedWeekdays || [];
                                                const newSelected = isSelected
                                                    ? currentSelected.filter(d => d !== day)
                                                    : [...currentSelected, day];
                                                setFormData({
                                                    ...formData,
                                                    selectedWeekdays: newSelected,
                                                    timeframeType: 'weekdays'
                                                });
                                            }}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `2px solid ${isSelected ? COLORS.PRIMARY[500] : alpha(COLORS.BORDER.DEFAULT, 0.3)}`,
                                                bgcolor: isSelected ? alpha(COLORS.PRIMARY[50], 0.5) : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: COLORS.PRIMARY[400],
                                                    bgcolor: alpha(COLORS.PRIMARY[50], 0.3),
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                                <Typography variant="body2" sx={{
                                                    fontWeight: isSelected ? 700 : 600,
                                                    color: isSelected ? COLORS.PRIMARY[700] : COLORS.TEXT.PRIMARY
                                                }}>
                                                    {WEEKDAY_LABELS_VI[day] || day}
                                                </Typography>
                                                {isSelected && (
                                                    <Box
                                                        sx={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            bgcolor: COLORS.PRIMARY[500],
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: 12,
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        ✓
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Box>

                            {(formData.selectedWeekdays || []).length > 0 && (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Đã chọn <strong>{formData.selectedWeekdays.length}</strong> ngày: {' '}
                                        {formData.selectedWeekdays.map(d => WEEKDAY_LABELS_VI[d]).join(', ')}
                                    </Typography>
                                </Alert>
                            )}
                        </>
                    ) : (
                        <Alert severity="warning">
                            Dịch vụ này chưa có ca dịch vụ nào. Vui lòng tạo slot cho dịch vụ trước.
                        </Alert>
                    )}
                </Stack>
            )}
        </Box>
    );
};

// ==================== STEP 4: Shift ====================
export const StepShift = ({ formData, setFormData, selectedService }) => {
    const [serviceSlots, setServiceSlots] = React.useState([]);
    const [loadingSlots, setLoadingSlots] = React.useState(false);
    const [workShifts, setWorkShifts] = React.useState([]);
    const [loadingShifts, setLoadingShifts] = React.useState(false);
    const [filteredSlots, setFilteredSlots] = React.useState([]);

    // Fetch work shifts for internal tasks
    React.useEffect(() => {
        if (formData.type === 'internal') {
            setLoadingShifts(true);
            workshiftApi.getAllShifts()
                .then(response => {
                    if (response.success) {
                        setWorkShifts(response.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching work shifts:', error);
                })
                .finally(() => {
                    setLoadingShifts(false);
                });
        }
    }, [formData.type]);

    // Fetch service slots when service task is selected
    React.useEffect(() => {
        if (formData.type === 'service' && selectedService) {
            setLoadingSlots(true);
            slotApi.getSlotsByService(selectedService.id)
                .then(response => {
                    if (response.success) {
                        setServiceSlots(response.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching slots:', error);
                })
                .finally(() => {
                    setLoadingSlots(false);
                });
        }
    }, [formData.type, selectedService]);

    // Filter slots based on selected weekdays
    React.useEffect(() => {
        if (formData.type === 'service' && formData.selectedWeekdays && formData.selectedWeekdays.length > 0 && serviceSlots.length > 0) {
            // Filter slots that have applicable_days overlapping with selectedWeekdays
            const filtered = serviceSlots.filter(slot => {
                if (!slot.applicable_days || slot.applicable_days.length === 0) return false;

                // Check if slot has any of the selected weekdays
                return slot.applicable_days.some(day => formData.selectedWeekdays.includes(day));
            });

            setFilteredSlots(filtered);
        } else {
            setFilteredSlots([]);
        }
    }, [formData.type, formData.selectedWeekdays, serviceSlots]);

    const handleShiftChange = (event) => {
        const selectedShifts = event.target.value;
        setFormData(prev => {
            const newShiftAssignments = { ...prev.shiftAssignments };

            // Add new shifts with empty assignments
            selectedShifts.forEach(shift => {
                if (!newShiftAssignments[shift]) {
                    newShiftAssignments[shift] = {
                        areaIds: [],
                        petGroups: [],
                        staffGroups: []
                    };
                }
            });

            // Remove unselected shifts
            Object.keys(newShiftAssignments).forEach(shift => {
                if (!selectedShifts.includes(shift)) {
                    delete newShiftAssignments[shift];
                }
            });

            return {
                ...prev,
                shifts: selectedShifts,
                shiftAssignments: newShiftAssignments
            };
        });
    };

    // Render for Internal tasks
    if (formData.type === 'internal') {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.ERROR[700] }}>
                    Chọn ca làm việc
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                    {loadingShifts ? 'Đang tải ca làm việc...' : 'Chọn một hoặc nhiều ca làm việc để phân công nhiệm vụ'}
                </Typography>

                {workShifts.length === 0 && !loadingShifts ? (
                    <Alert severity="warning">
                        Chưa có ca làm việc nào. Vui lòng tạo ca làm việc ở trang Quản lý nhân viên.
                    </Alert>
                ) : (
                    <>
                        <FormControl fullWidth>
                            <InputLabel>Ca làm</InputLabel>
                            <Select
                                multiple
                                value={formData.shifts || []}
                                onChange={handleShiftChange}
                                label="Ca làm"
                                disabled={loadingShifts}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((shiftId) => {
                                            const shift = workShifts.find(s => s.id === shiftId);
                                            return shift ? (
                                                <Chip
                                                    key={shiftId}
                                                    label={shift.name}
                                                    size="small"
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {workShifts.map(shift => (
                                    <MenuItem key={shift.id} value={shift.id}>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {shift.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                {shift.start_time} - {shift.end_time} | {shift.duration_hours}h
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {(formData.shifts || []).length > 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    Đã chọn <strong>{formData.shifts.length}</strong> ca làm việc.
                                    Bạn sẽ phân công nhiệm vụ cho từng ca ở bước tiếp theo.
                                </Typography>
                            </Alert>
                        )}
                    </>
                )}
            </Box>
        );
    }

    // Handler for service slot selection
    const handleSlotChange = (event) => {
        const selectedSlots = event.target.value;
        setFormData(prev => {
            const newTimeSlotAssignments = { ...prev.timeSlotAssignments };

            // Add new slots with empty assignments
            selectedSlots.forEach(slotId => {
                if (!newTimeSlotAssignments[slotId]) {
                    newTimeSlotAssignments[slotId] = {
                        areaIds: [],
                        petGroups: [],
                        staffGroups: []
                    };
                }
            });

            // Remove unselected slots
            Object.keys(newTimeSlotAssignments).forEach(slotId => {
                if (!selectedSlots.includes(slotId)) {
                    delete newTimeSlotAssignments[slotId];
                }
            });

            return {
                ...prev,
                selectedTimeSlots: selectedSlots,
                timeSlotAssignments: newTimeSlotAssignments
            };
        });
    };

    // Render for Service tasks - Show service slots
    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.ERROR[700] }}>
                Chọn ca dịch vụ
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: COLORS.TEXT.SECONDARY }}>
                {loadingSlots ? 'Đang tải ca dịch vụ...' : 'Chọn ca từ Giờ hoạt động đã cấu hình cho dịch vụ'}
            </Typography>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2, bgcolor: alpha(COLORS.INFO[50], 0.3) }}>
                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
                    <strong>Lưu ý:</strong> Ca dịch vụ được lấy từ Giờ hoạt động (slots) đã thiết lập cho dịch vụ này.
                    Danh sách chỉ hiển thị các ca có ngày áp dụng (applicable_days) khớp với các thứ bạn đã chọn ở bước trước,
                    và tuân theo khung giờ (start_time - end_time) đã cấu hình.
                </Typography>
            </Alert>

            {serviceSlots.length === 0 && !loadingSlots ? (
                <Alert severity="warning">
                    Dịch vụ này chưa có ca dịch vụ nào. Vui lòng tạo slot cho dịch vụ trước.
                </Alert>
            ) : (
                <>
                    {formData.selectedWeekdays && formData.selectedWeekdays.length > 0 && (
                        <Alert
                            severity={filteredSlots.length > 0 ? "info" : "warning"}
                            sx={{ mb: 2, borderRadius: 2 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Các ngày đã chọn: {formData.selectedWeekdays.map(day => {
                                    const labels = {
                                        'MONDAY': 'Thứ Hai',
                                        'TUESDAY': 'Thứ Ba',
                                        'WEDNESDAY': 'Thứ Tư',
                                        'THURSDAY': 'Thứ Năm',
                                        'FRIDAY': 'Thứ Sáu',
                                        'SATURDAY': 'Thứ Bảy',
                                        'SUNDAY': 'Chủ Nhật'
                                    };
                                    return labels[day] || day;
                                }).join(', ')}
                            </Typography>
                            <Typography variant="body2">
                                {filteredSlots.length > 0
                                    ? `Có ${filteredSlots.length} ca dịch vụ khả dụng cho các ngày này`
                                    : 'Không có ca dịch vụ nào cho các ngày đã chọn.'}
                            </Typography>
                        </Alert>
                    )}
                    <FormControl fullWidth>
                        <InputLabel>Ca dịch vụ</InputLabel>
                        <Select
                            multiple
                            value={formData.selectedTimeSlots || []}
                            onChange={handleSlotChange}
                            label="Ca dịch vụ"
                            disabled={loadingSlots}
                            renderValue={(selected) => {
                                const weekdayLabels = {
                                    'MONDAY': 'T2',
                                    'TUESDAY': 'T3',
                                    'WEDNESDAY': 'T4',
                                    'THURSDAY': 'T5',
                                    'FRIDAY': 'T6',
                                    'SATURDAY': 'T7',
                                    'SUNDAY': 'CN'
                                };

                                return (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((slotId) => {
                                            const slot = serviceSlots.find(s => s.id === slotId);
                                            if (!slot) return null;

                                            const daysStr = (slot.applicable_days || [])
                                                .map(d => weekdayLabels[d] || d)
                                                .join(',');

                                            return (
                                                <Chip
                                                    key={slotId}
                                                    label={`${slot.start_time?.substring(0, 5)}-${slot.end_time?.substring(0, 5)} (${daysStr})`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(COLORS.PRIMARY[100], 0.8),
                                                        color: COLORS.PRIMARY[700],
                                                        fontWeight: 600
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>
                                );
                            }}
                        >
                            {filteredSlots.length > 0 ? (
                                filteredSlots.map(slot => {
                                    const weekdayLabels = {
                                        'MONDAY': 'T2',
                                        'TUESDAY': 'T3',
                                        'WEDNESDAY': 'T4',
                                        'THURSDAY': 'T5',
                                        'FRIDAY': 'T6',
                                        'SATURDAY': 'T7',
                                        'SUNDAY': 'CN'
                                    };

                                    return (
                                        <MenuItem key={slot.id} value={slot.id}>
                                            <Box sx={{ width: '100%' }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.TEXT.PRIMARY }}>
                                                        {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        {(slot.applicable_days || []).map(day => (
                                                            <Chip
                                                                key={day}
                                                                label={weekdayLabels[day] || day}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.7rem',
                                                                    bgcolor: alpha(COLORS.PRIMARY[100], 0.5),
                                                                    color: COLORS.PRIMARY[700],
                                                                    fontWeight: 600,
                                                                    '& .MuiChip-label': { px: 1 }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        </MenuItem>
                                    );
                                })
                            ) : (
                                <MenuItem disabled>
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                        {formData.selectedWeekdays && formData.selectedWeekdays.length > 0
                                            ? 'Không có ca dịch vụ nào cho các ngày đã chọn'
                                            : 'Vui lòng chọn các thứ trong tuần trước'}
                                    </Typography>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {(formData.selectedTimeSlots || []).length > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                Đã chọn <strong>{formData.selectedTimeSlots.length}</strong> ca dịch vụ.
                                Bạn sẽ phân công nhiệm vụ cho từng ca ở bước tiếp theo.
                            </Typography>
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
};

// ==================== STEP 5: Assignment ====================
export const StepAssignment = ({
    formData,
    setFormData,
    areas,
    staff,
    selectedService,
    petGroupsMap,
    openStaffGroupDialog,
    openPetGroupDialog,
    editStaffGroup
}) => {
    if (formData.type === 'internal') {
        return (
            <InternalAssignment
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                staff={staff}
                petGroupsMap={petGroupsMap}
                openStaffGroupDialog={openStaffGroupDialog}
                openPetGroupDialog={openPetGroupDialog}
                editStaffGroup={editStaffGroup}
            />
        );
    } else {
        return (
            <ServiceAssignment
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                staff={staff}
                selectedService={selectedService}
                petGroupsMap={petGroupsMap}
                openStaffGroupDialog={openStaffGroupDialog}
                openPetGroupDialog={openPetGroupDialog}
                editStaffGroup={editStaffGroup}
            />
        );
    }
};

// ==================== STEP 6: Confirmation ====================
export const StepConfirmation = ({ formData, selectedService, areas, staff, petGroupsMap }) => {
    const [allShifts, setAllShifts] = React.useState([]);
    const [allSlots, setAllSlots] = React.useState([]);

    // Load all shifts to get full shift details
    React.useEffect(() => {
        const loadShifts = async () => {
            try {
                const response = await workshiftApi.getAllShifts();
                setAllShifts(response?.data || []);
            } catch (err) {
                console.error('Error loading shifts:', err);
                setAllShifts([]);
            }
        };
        loadShifts();
    }, []);

    // Load all slots for service tasks
    React.useEffect(() => {
        const loadSlots = async () => {
            if (formData.type === 'service' && selectedService?.id) {
                try {
                    const response = await slotApi.getSlotsByService(selectedService.id);
                    setAllSlots(response?.data || []);
                } catch (err) {
                    console.error('Error loading slots:', err);
                    setAllSlots([]);
                }
            }
        };
        loadSlots();
    }, [formData.type, selectedService?.id]);

    // Get shift details by ID
    const getShiftDetails = (shiftId) => {
        return (allShifts || []).find(s => s.id === shiftId);
    };

    // Get slot details by ID
    const getSlotDetails = (slotId) => {
        return (allSlots || []).find(s => s.id === slotId);
    };

    const renderAssignmentDetails = (assignment, prefix = '') => {
        return (
            <Box sx={{ ml: prefix ? 2 : 0, mt: 2 }}>
                {/* Khu vực */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1 }}>
                        📍 Khu vực ({assignment?.areaIds?.length || 0})
                    </Typography>
                    {(assignment?.areaIds || []).length > 0 ? (
                        <Stack spacing={0.5} sx={{ ml: 2 }}>
                            {(assignment.areaIds || []).map(areaId => {
                                const area = (areas || []).find(a => a.id === areaId);
                                return (
                                    <Typography key={areaId} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.PRIMARY[500] }} />
                                        {area?.name || areaId}
                                    </Typography>
                                );
                            })}
                        </Stack>
                    ) : (
                        <Typography variant="body2" sx={{ ml: 2, color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                            Chưa chọn khu vực
                        </Typography>
                    )}
                </Box>

                {/* Nhóm pet */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1 }}>
                        🐾 Nhóm pet ({assignment?.petGroups?.length || 0})
                    </Typography>
                    {(assignment?.petGroups || []).length > 0 ? (
                        <Stack spacing={0.5} sx={{ ml: 2 }}>
                            {(assignment.petGroups || []).map((pg, idx) => (
                                <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.SECONDARY[500] }} />
                                    {pg.groupName} ({pg.count} con)
                                </Typography>
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2" sx={{ ml: 2, color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                            Không có nhóm pet
                        </Typography>
                    )}
                </Box>

                {/* Nhóm nhân viên */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ERROR[600], mb: 1 }}>
                        👥 Nhóm nhân viên ({assignment?.staffGroups?.length || 0})
                    </Typography>
                    {(assignment?.staffGroups || []).length > 0 ? (
                        <Stack spacing={1.5} sx={{ ml: 2 }}>
                            {[...(assignment.staffGroups || [])]
                                .sort((a, b) => {
                                    // Sort by date
                                    if (a.assignedDate && b.assignedDate) {
                                        return new Date(a.assignedDate) - new Date(b.assignedDate);
                                    }
                                    return 0;
                                })
                                .map((sg, idx) => {
                                    const leader = (staff || []).find(s => s.id === sg.leaderId);
                                    return (
                                        <Box key={idx} sx={{
                                            p: 1.5,
                                            borderRadius: 1,
                                            backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5),
                                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`
                                        }}>
                                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {sg.name}
                                                </Typography>
                                                {sg.assignedDayName && sg.assignedDate && (
                                                    <Chip
                                                        label={`${sg.assignedDayName}, ${sg.assignedDate}`}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.65rem',
                                                            backgroundColor: alpha(COLORS.PRIMARY[500], 0.1),
                                                            color: COLORS.PRIMARY[700],
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                Leader: {leader?.full_name || '—'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                Thành viên ({sg.staffIds?.length || 0}):
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                                {[...(sg.staffIds || [])].sort((a, b) => {
                                                    // Sắp xếp: Leader lên đầu
                                                    if (a === sg.leaderId) return -1;
                                                    if (b === sg.leaderId) return 1;
                                                    return 0;
                                                }).map(staffId => {
                                                    const member = (staff || []).find(s => s.id === staffId);
                                                    return member ? (
                                                        <Chip
                                                            key={staffId}
                                                            label={member.full_name}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                                backgroundColor: staffId === sg.leaderId
                                                                    ? alpha(COLORS.ERROR[100], 0.7)
                                                                    : alpha(COLORS.SECONDARY[100], 0.7),
                                                                color: staffId === sg.leaderId
                                                                    ? COLORS.ERROR[700]
                                                                    : COLORS.SECONDARY[700]
                                                            }}
                                                        />
                                                    ) : null;
                                                })}
                                            </Stack>
                                        </Box>
                                    );
                                })
                            }
                        </Stack>
                    ) : (
                        <Typography variant="body2" sx={{ ml: 2, color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                            Chưa có nhóm nhân viên
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                Xác nhận thông tin nhiệm vụ
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT.SECONDARY }}>
                Kiểm tra lại thông tin trước khi tạo nhiệm vụ
            </Typography>

            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Loại:</Typography>
                    <Typography>{formData.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}</Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Nhiệm vụ:</Typography>
                    <Typography>
                        {formData.type === 'internal' ? (formData.internalName || '') : (selectedService?.name || '')}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>Khung thời gian:</Typography>
                    <Typography>
                        {formData.timeframeType === 'weekdays' && formData.selectedWeekdays && (
                            <>
                                Các ngày: {formData.selectedWeekdays.map(day => {
                                    const labels = {
                                        'MONDAY': 'Thứ Hai',
                                        'TUESDAY': 'Thứ Ba',
                                        'WEDNESDAY': 'Thứ Tư',
                                        'THURSDAY': 'Thứ Năm',
                                        'FRIDAY': 'Thứ Sáu',
                                        'SATURDAY': 'Thứ Bảy',
                                        'SUNDAY': 'Chủ Nhật'
                                    };
                                    return labels[day] || day;
                                }).join(', ')}
                            </>
                        )}
                        {formData.timeframeType === 'day' && `Ngày: ${formData.date}`}
                        {formData.timeframeType === 'week' && (() => {
                            if (!formData.week) return 'Tuần: —';
                            const [year, weekNum] = formData.week.split('-W').map(Number);
                            const firstDay = new Date(year, 0, 1 + (weekNum - 1) * 7);
                            const dayOfWeek = firstDay.getDay();
                            const monday = new Date(firstDay);
                            monday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
                            const sunday = new Date(monday);
                            sunday.setDate(monday.getDate() + 6);
                            const formatDate = (d) => d.toISOString().split('T')[0];
                            return `Tuần ${weekNum}/${year}: ${formatDate(monday)} → ${formatDate(sunday)}`;
                        })()}
                        {formData.timeframeType === 'month' && (() => {
                            if (!formData.month) return 'Tháng: —';
                            const [year, monthNum] = formData.month.split('-').map(Number);
                            const firstDay = new Date(year, monthNum - 1, 1);
                            const lastDay = new Date(year, monthNum, 0);
                            const formatDate = (d) => d.toISOString().split('T')[0];
                            return `Tháng ${monthNum}/${year}: ${formatDate(firstDay)} → ${formatDate(lastDay)}`;
                        })()}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: COLORS.TEXT.SECONDARY }}>
                        Ca làm ({formData.type === 'internal' ? (formData.shifts || []).length : (formData.selectedTimeSlots || []).length}):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                        {formData.type === 'internal' ? (
                            // Internal tasks: show shifts
                            (formData.shifts || []).length > 0 ? (
                                (formData.shifts || []).map(shiftId => {
                                    const shiftDetails = getShiftDetails(shiftId);
                                    return (
                                        <Chip
                                            key={shiftId}
                                            label={shiftDetails
                                                ? `${shiftDetails.name} (${shiftDetails.start_time?.substring(0, 5)} - ${shiftDetails.end_time?.substring(0, 5)})`
                                                : shiftId}
                                            size="small"
                                            sx={{
                                                background: alpha(COLORS.PRIMARY[100], 0.8),
                                                color: COLORS.PRIMARY[700],
                                                fontWeight: 600,
                                                height: 'auto',
                                                py: 0.5,
                                                '& .MuiChip-label': {
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>—</Typography>
                            )
                        ) : (
                            // Service tasks: show slots
                            (formData.selectedTimeSlots || []).length > 0 ? (
                                (formData.selectedTimeSlots || []).map(slotId => {
                                    const slotDetails = getSlotDetails(slotId);
                                    return (
                                        <Chip
                                            key={slotId}
                                            label={slotDetails
                                                ? `${slotDetails.start_time?.substring(0, 5)} - ${slotDetails.end_time?.substring(0, 5)}`
                                                : slotId}
                                            size="small"
                                            sx={{
                                                background: alpha(COLORS.PRIMARY[100], 0.8),
                                                color: COLORS.PRIMARY[700],
                                                fontWeight: 600,
                                                height: 'auto',
                                                py: 0.5,
                                                '& .MuiChip-label': {
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>—</Typography>
                            )
                        )}
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[700], mb: 1 }}>
                        Chi tiết phân công
                    </Typography>

                    <Stack spacing={2}>
                        {formData.type === 'internal' ? (
                            // Internal tasks: show shift assignments
                            <>
                                {(formData.shifts || []).map(shiftId => {
                                    const shiftDetails = getShiftDetails(shiftId);
                                    return (
                                        <Box
                                            key={shiftId}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3),
                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                                            }}
                                        >
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], mb: 1 }}>
                                                🕐 Ca làm: {shiftDetails
                                                    ? `${shiftDetails.name} (${shiftDetails.start_time?.substring(0, 5)} - ${shiftDetails.end_time?.substring(0, 5)})`
                                                    : shiftId}
                                            </Typography>
                                            {renderAssignmentDetails(formData.shiftAssignments?.[shiftId])}
                                        </Box>
                                    );
                                })}
                                {(formData.shifts || []).length === 0 && (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                        Chưa chọn ca làm việc nào
                                    </Typography>
                                )}
                            </>
                        ) : (
                            // Service tasks: show slot assignments
                            <>
                                {(formData.selectedTimeSlots || []).map(slotId => {
                                    const slotDetails = getSlotDetails(slotId);
                                    return (
                                        <Box
                                            key={slotId}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3),
                                                border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                                            }}
                                        >
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], mb: 1 }}>
                                                ⏰ Khung giờ: {slotDetails
                                                    ? `${slotDetails.start_time?.substring(0, 5)} - ${slotDetails.end_time?.substring(0, 5)}`
                                                    : slotId}
                                            </Typography>
                                            {renderAssignmentDetails(formData.timeSlotAssignments?.[slotId])}
                                        </Box>
                                    );
                                })}
                                {(formData.selectedTimeSlots || []).length === 0 && (
                                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                        Chưa chọn khung giờ nào
                                    </Typography>
                                )}
                            </>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

