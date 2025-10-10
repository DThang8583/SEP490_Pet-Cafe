import React from 'react';
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Alert, Divider, Autocomplete, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { INTERNAL_TEMPLATES } from '../../../api/tasksApi';
import { COLORS } from '../../../constants/colors';
import { InternalAssignment, ServiceAssignment } from './Assignments';
import slotApi from '../../../api/slotApi';
import workshiftApi from '../../../api/workshiftApi';

// ==================== STEP 1: Task Type ====================
export const StepTaskType = ({ formData, setFormData }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn loại nhiệm vụ</Typography>
            <RadioGroup value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <FormControlLabel value="internal" control={<Radio />} label="Nội bộ" />
                <FormControlLabel value="service" control={<Radio />} label="Dịch vụ" />
            </RadioGroup>
        </Box>
    );
};

// ==================== STEP 2: Select Task ====================
export const StepSelectTask = ({ formData, setFormData, services, isEditMode }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {formData.type === 'internal' ? 'Chọn nhiệm vụ nội bộ' : 'Chọn dịch vụ'}
            </Typography>

            {isEditMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>Loại nhiệm vụ:</strong> {formData.type === 'internal' ? 'Nội bộ' : 'Dịch vụ'}
                        {' '}<em>(Không thể thay đổi khi chỉnh sửa)</em>
                    </Typography>
                </Alert>
            )}

            {formData.type === 'internal' ? (
                <Autocomplete
                    freeSolo
                    options={(INTERNAL_TEMPLATES || []).map(t => t.name)}
                    value={formData.internalName || ''}
                    onChange={(event, newValue) => {
                        setFormData({ ...formData, internalName: newValue || '' });
                    }}
                    onInputChange={(event, newInputValue) => {
                        setFormData({ ...formData, internalName: newInputValue || '' });
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Chọn từ mẫu hoặc nhập tên tùy chỉnh"
                            placeholder="Nhập để tìm kiếm hoặc tạo mới..."
                            fullWidth
                        />
                    )}
                />
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
    const [slotDates, setSlotDates] = React.useState({ start: null, end: null });

    // Fetch slot dates from applicable_days
    React.useEffect(() => {
        if (formData.type === 'service' && selectedService) {
            const fetchSlotDates = async () => {
                try {
                    const response = await slotApi.getSlotsByService(selectedService.id);
                    if (response.success && response.data.length > 0) {
                        // Get min and max dates from all slots' applicable_days
                        let minDate = null;
                        let maxDate = null;

                        response.data.forEach(slot => {
                            if (slot.applicable_days && slot.applicable_days.length > 0) {
                                const slotDates = slot.applicable_days.map(d => new Date(d));
                                const slotMin = new Date(Math.min(...slotDates));
                                const slotMax = new Date(Math.max(...slotDates));

                                if (!minDate || slotMin < minDate) minDate = slotMin;
                                if (!maxDate || slotMax > maxDate) maxDate = slotMax;
                            }
                        });

                        if (minDate && maxDate) {
                            const formatDate = (date) => date.toISOString().split('T')[0];
                            const serviceStart = formatDate(minDate);
                            const serviceEnd = formatDate(maxDate);
                            setSlotDates({ start: serviceStart, end: serviceEnd });

                            // Auto-fill when selecting service_period
                            if (formData.timeframeType === 'service_period') {
                                if (serviceStart && !formData.servicePeriodStart) {
                                    setFormData(prev => ({ ...prev, servicePeriodStart: serviceStart }));
                                }
                                if (serviceEnd && !formData.servicePeriodEnd) {
                                    setFormData(prev => ({ ...prev, servicePeriodEnd: serviceEnd }));
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching slot dates:', error);
                }
            };

            fetchSlotDates();
        }
    }, [formData.type, formData.timeframeType, selectedService, formData.servicePeriodStart, formData.servicePeriodEnd, setFormData]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn khung thời gian</Typography>

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
                    <RadioGroup
                        value={formData.timeframeType}
                        onChange={(e) => setFormData({ ...formData, timeframeType: e.target.value })}
                    >
                        <FormControlLabel value="day" control={<Radio />} label="Theo ngày" />
                        <FormControlLabel value="service_period" control={<Radio />} label="Theo khoảng thời gian dịch vụ" />
                    </RadioGroup>

                    {selectedService && slotDates.start && slotDates.end && (
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Dịch vụ <strong>{selectedService.name}</strong> diễn ra từ <strong>{slotDates.start}</strong> đến <strong>{slotDates.end}</strong>
                            {' '}(từ slot applicable_days)
                        </Alert>
                    )}

                    {formData.timeframeType === 'day' && (
                        <TextField
                            type="date"
                            label="Chọn ngày"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: slotDates.start || undefined,
                                max: slotDates.end || undefined
                            }}
                            helperText={slotDates.start && slotDates.end
                                ? `Chỉ được chọn ngày trong khoảng ${slotDates.start} - ${slotDates.end}`
                                : ''
                            }
                            fullWidth
                        />
                    )}

                    {formData.timeframeType === 'service_period' && (
                        <Stack spacing={2}>
                            <TextField
                                type="date"
                                label="Ngày bắt đầu"
                                value={formData.servicePeriodStart || slotDates.start || ''}
                                onChange={(e) => setFormData({ ...formData, servicePeriodStart: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: slotDates.start || undefined,
                                    max: slotDates.end || undefined
                                }}
                                helperText={slotDates.start && slotDates.end
                                    ? `Phải trong khoảng ${slotDates.start} - ${slotDates.end}`
                                    : ''
                                }
                                fullWidth
                            />
                            <TextField
                                type="date"
                                label="Ngày kết thúc"
                                value={formData.servicePeriodEnd || slotDates.end || ''}
                                onChange={(e) => setFormData({ ...formData, servicePeriodEnd: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: formData.servicePeriodStart || slotDates.start || undefined,
                                    max: slotDates.end || undefined
                                }}
                                helperText={slotDates.start && slotDates.end
                                    ? `Phải trong khoảng ${slotDates.start} - ${slotDates.end}`
                                    : ''
                                }
                                fullWidth
                            />
                        </Stack>
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
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn ca làm</Typography>
                <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                    {loadingShifts ? 'Đang tải ca làm việc...' : 'Bạn có thể chọn một hoặc nhiều ca làm việc cho nhiệm vụ này'}
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

    // Render for Service tasks - Show service slots
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn ca dịch vụ</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY }}>
                {loadingSlots ? 'Đang tải ca dịch vụ...' : 'Chọn một hoặc nhiều ca dịch vụ cho nhiệm vụ này'}
            </Typography>

            {serviceSlots.length === 0 && !loadingSlots ? (
                <Alert severity="warning">
                    Dịch vụ này chưa có ca dịch vụ nào. Vui lòng tạo slot cho dịch vụ trước.
                </Alert>
            ) : (
                <>
                    <FormControl fullWidth>
                        <InputLabel>Ca dịch vụ</InputLabel>
                        <Select
                            multiple
                            value={formData.shifts || []}
                            onChange={handleShiftChange}
                            label="Ca dịch vụ"
                            disabled={loadingSlots}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((slotId) => {
                                        const slot = serviceSlots.find(s => s.id === slotId);
                                        return slot ? (
                                            <Chip
                                                key={slotId}
                                                label={`${slot.start_time} - ${slot.end_time}`}
                                                size="small"
                                            />
                                        ) : null;
                                    })}
                                </Box>
                            )}
                        >
                            {serviceSlots.map(slot => (
                                <MenuItem key={slot.id} value={slot.id}>
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {slot.start_time} - {slot.end_time}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Khu vực: {slot.area_id} | Sức chứa: {slot.max_capacity} | Giá: {slot.price?.toLocaleString('vi-VN')}đ
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {(formData.shifts || []).length > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                Đã chọn <strong>{formData.shifts.length}</strong> ca dịch vụ.
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
                openStaffGroupDialog={openStaffGroupDialog}
                openPetGroupDialog={openPetGroupDialog}
                editStaffGroup={editStaffGroup}
            />
        );
    }
};

// ==================== STEP 6: Confirmation ====================
export const StepConfirmation = ({ formData, selectedService, areas, staff, petGroupsMap }) => {
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
                            {(assignment.staffGroups || []).map((sg, idx) => {
                                const leader = (staff || []).find(s => s.id === sg.leaderId);
                                return (
                                    <Box key={idx} sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.5),
                                        border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                            {sg.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                            Leader: {leader?.full_name || '—'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                            Thành viên ({sg.staffIds?.length || 0}):
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
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
                            })}
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
                        {formData.type === 'internal' ? (formData.internalName || '') : (selectedService?.name || '')}
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
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {(formData.shifts || []).length > 0 ? (
                            (formData.shifts || []).map(shift => (
                                <Chip
                                    key={shift}
                                    label={shift}
                                    size="small"
                                    sx={{
                                        background: alpha(COLORS.PRIMARY[100], 0.8),
                                        color: COLORS.PRIMARY[700],
                                        fontWeight: 700
                                    }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>—</Typography>
                        )}
                    </Stack>
                </Box>

                <Divider />

                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ERROR[700], mb: 1 }}>
                        📋 Chi tiết phân công
                    </Typography>

                    <Stack spacing={2}>
                        {(formData.shifts || []).map(shift => (
                            <Box
                                key={shift}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: alpha(COLORS.BACKGROUND.NEUTRAL, 0.3),
                                    border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700], mb: 1 }}>
                                    🕐 Ca làm: {shift}
                                </Typography>
                                {renderAssignmentDetails(formData.shiftAssignments?.[shift])}
                            </Box>
                        ))}
                        {(formData.shifts || []).length === 0 && (
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontStyle: 'italic' }}>
                                Chưa chọn ca làm việc nào
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

