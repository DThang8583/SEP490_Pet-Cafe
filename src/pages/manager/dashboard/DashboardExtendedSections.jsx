import React from 'react';
import { Typography, Stack, Chip, alpha, Box } from '@mui/material';
import { People, TaskAlt, TrendingDown, Groups, PersonAdd, Insights, EventAvailable, Inventory2, AttachMoney } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { SectionContainer, SummaryGrid, CardSection, EmptyState, formatCurrency, formatNumber, formatMonthLabel, formatDateTime, SimpleBarChart, StackedBarChart } from './DashboardUtils';

// ========== PETS SECTION ==========
export const PetsSection = ({ petsData }) => {
    if (!petsData) return null;

    return (
        <SectionContainer title="Thống kê Thú cưng" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng thú cưng',
                        value: formatNumber(petsData.total_pets || 0),
                        caption: 'Số lượng thú cưng hiện có trong hệ thống',
                        color: COLORS.SECONDARY[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Số loài',
                        value: formatNumber(petsData.pets_by_species?.length || 0),
                        caption: 'Phân loại theo loài (chó, mèo...)',
                        color: COLORS.SUCCESS[500],
                        icon: <Insights fontSize="medium" />
                    },
                    {
                        label: 'Số giống',
                        value: formatNumber(petsData.pets_by_breed?.length || 0),
                        caption: 'Đa dạng giống thú cưng hiện có',
                        color: COLORS.INFO[500],
                        icon: <People fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Thú cưng theo loài"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(petsData.pets_by_species?.length)}
                emptyMessage="Chưa có dữ liệu phân loại theo loài."
            >
                <SimpleBarChart
                    data={petsData.pets_by_species}
                    dataKey="count"
                    xAxisKey="species_name"
                    fill={COLORS.SECONDARY[500]}
                    name="Số lượng"
                    xAxisAngle={-45}
                />
            </CardSection>

            <CardSection
                title="Thú cưng nhập mới theo tháng"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(petsData.pet_arrivals_by_month?.length)}
                emptyMessage="Chưa có dữ liệu thú cưng nhập mới."
            >
                <SimpleBarChart
                    data={petsData.pet_arrivals_by_month?.map((item) => ({
                        ...item,
                        label: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="label"
                    fill={COLORS.SECONDARY[500]}
                    name="Số lượng"
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== PETS HEALTH SECTION ==========
export const PetsHealthSection = ({ petsHealthData }) => {
    if (!petsHealthData) return null;

    return (
        <SectionContainer title="Sức khỏe Thú cưng" color={COLORS.SUCCESS[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Có hồ sơ sức khỏe',
                        value: formatNumber(petsHealthData.pets_with_health_records || 0),
                        caption: 'Thú cưng đã được cập nhật hồ sơ chăm sóc',
                        color: COLORS.SUCCESS[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Đã tiêm phòng',
                        value: formatNumber(petsHealthData.vaccination_status?.vaccinated_count || 0),
                        caption: `Tỷ lệ tiêm ${(petsHealthData.vaccination_status?.vaccination_rate ?? 0).toFixed(1)}%`,
                        color: COLORS.INFO[500],
                        icon: <TaskAlt fontSize="medium" />
                    },
                    {
                        label: 'Chưa tiêm phòng',
                        value: formatNumber(petsHealthData.vaccination_status?.not_vaccinated_count || 0),
                        caption: 'Cần theo dõi và lên lịch tiêm phù hợp',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Khám sức khỏe theo tháng"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(petsHealthData.health_checks_by_month?.length)}
                emptyMessage="Chưa có dữ liệu khám sức khỏe theo tháng."
            >
                <SimpleBarChart
                    data={petsHealthData.health_checks_by_month?.map((item) => ({
                        ...item,
                        label: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="label"
                    fill={COLORS.SUCCESS[500]}
                    name="Số lượt khám"
                />
            </CardSection>

            <CardSection
                title="Lịch tiêm phòng sắp tới"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(petsHealthData.upcoming_vaccinations?.length)}
                emptyMessage="Chưa có lịch tiêm phòng trong giai đoạn này."
            >
                <Stack spacing={1.5}>
                    {petsHealthData.upcoming_vaccinations?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.SUCCESS[100], 0.35) }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.pet_name || '—'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.vaccine_type_name || '—'}
                                </Typography>
                            </Stack>
                            <Chip
                                label={formatDateTime(item.scheduled_date)}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="success"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>
        </SectionContainer>
    );
};

// ========== PET GROUPS SECTION ==========
export const PetGroupsSection = ({ petGroupsData }) => {
    if (!petGroupsData) return null;

    return (
        <SectionContainer title="Nhóm Thú cưng" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số nhóm',
                        value: formatNumber(petGroupsData.total_groups || 0),
                        caption: 'Các nhóm thú cưng được thiết lập',
                        color: COLORS.PRIMARY[500],
                        icon: <Groups fontSize="medium" />
                    },
                    {
                        label: 'Nhóm có thú cưng',
                        value: formatNumber(
                            petGroupsData.pet_group_details?.filter((item) => (item.pet_count || 0) > 0).length || 0
                        ),
                        caption: 'Nhóm đang hoạt động',
                        color: COLORS.SUCCESS[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Nhóm trống',
                        value: formatNumber(
                            petGroupsData.pet_group_details?.filter((item) => (item.pet_count || 0) === 0).length || 0
                        ),
                        caption: 'Nhóm chưa được phân bổ thú cưng',
                        color: COLORS.WARNING[500],
                        icon: <TrendingDown fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Chi tiết nhóm thú cưng"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(petGroupsData.pet_group_details?.length)}
                emptyMessage="Chưa có nhóm thú cưng trong hệ thống."
            >
                <Stack spacing={1.5}>
                    {petGroupsData.pet_group_details?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.35) }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.group_name || '—'}
                            </Typography>
                            <Chip
                                label={`${formatNumber(item.pet_count || 0)} thú cưng`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color={(item.pet_count || 0) > 0 ? 'success' : 'default'}
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>
        </SectionContainer>
    );
};

// ========== SLOTS SECTION ==========
export const SlotsSection = ({ slotsData }) => {
    if (!slotsData) return null;

    return (
        <SectionContainer title="Thống kê Slot" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tỷ lệ sử dụng slot',
                        value: `${(slotsData.utilization_rate ?? 0).toFixed(1)}%`,
                        caption: 'Hiệu suất phân bổ slot hiện tại',
                        color: COLORS.SECONDARY[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Tình trạng slot theo ngày"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(slotsData.slot_availability_by_day?.length)}
                emptyMessage="Chưa có dữ liệu lịch sử slot theo ngày."
            >
                <StackedBarChart
                    data={slotsData.slot_availability_by_day?.map(item => ({
                        ...item,
                        date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                    }))}
                    xAxisKey="date"
                    xAxisAngle={-45}
                    bars={[
                        { dataKey: 'available', fill: COLORS.SUCCESS[500], name: 'Còn trống', stackId: 'a' },
                        { dataKey: 'occupied', fill: COLORS.ERROR[500], name: 'Đã đặt', stackId: 'a' }
                    ]}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== FEEDBACKS SECTION ==========
export const FeedbacksSection = ({ feedbacksData }) => {
    if (!feedbacksData) return null;

    return (
        <SectionContainer title="Thống kê Đánh giá" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số đánh giá',
                        value: formatNumber(feedbacksData.total_feedbacks || 0),
                        caption: 'Tổng khối lượng phản hồi của khách hàng',
                        color: COLORS.PRIMARY[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Điểm trung bình',
                        value: feedbacksData.average_rating?.toFixed(1) || '0.0',
                        caption: 'Chất lượng dịch vụ được khách hàng đánh giá',
                        color: COLORS.WARNING[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Phân bố điểm đánh giá"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(feedbacksData.rating_distribution?.length)}
                emptyMessage="Chưa có dữ liệu phân bố điểm đánh giá."
            >
                <SimpleBarChart
                    data={feedbacksData.rating_distribution}
                    dataKey="count"
                    xAxisKey="rating"
                    fill={COLORS.WARNING[500]}
                    name="Số lượng"
                    xAxisHeight={60}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== EMPLOYEES SECTION ==========
export const EmployeesSection = ({ employeesData }) => {
    if (!employeesData) return null;

    return (
        <SectionContainer title="Thống kê Nhân viên" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số nhân viên',
                        value: formatNumber(employeesData.total_employees || 0),
                        caption: 'Quy mô lực lượng nhân sự hiện tại',
                        color: COLORS.PRIMARY[500],
                        icon: <Groups fontSize="medium" />
                    },
                    {
                        label: 'Nhân viên hoạt động',
                        value: formatNumber(employeesData.active_employees || 0),
                        caption: 'Số nhân viên đang hoạt động',
                        color: COLORS.SUCCESS[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Nhân viên không hoạt động',
                        value: formatNumber(employeesData.inactive_employees || 0),
                        caption: 'Nhân viên nghỉ phép / ngưng hoạt động',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    },
                    {
                        label: 'Tổng chi phí lương',
                        value: formatCurrency(employeesData.total_salary_cost || 0),
                        caption: 'Chi phí nhân sự đang ghi nhận',
                        color: COLORS.WARNING[500],
                        icon: <AttachMoney fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Nhân viên mới theo tháng"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(employeesData.new_employees_by_month?.length)}
                emptyMessage="Chưa có dữ liệu nhân viên mới theo tháng."
            >
                <SimpleBarChart
                    data={employeesData.new_employees_by_month?.map(item => ({
                        ...item,
                        month: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="month"
                    fill={COLORS.PRIMARY[500]}
                    name="Số lượng nhân viên mới"
                    xAxisAngle={-45}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== TEAMS SECTION ==========
export const TeamsSection = ({ teamsData }) => {
    if (!teamsData) return null;

    return (
        <SectionContainer title="Thống kê Nhóm" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số đội nhóm',
                        value: formatNumber(teamsData.total_teams || 0),
                        caption: 'Tổng số nhóm trong hệ thống',
                        color: COLORS.SECONDARY[500],
                        icon: <Groups fontSize="medium" />
                    },
                    {
                        label: 'Nhóm hoạt động',
                        value: formatNumber(teamsData.active_teams || 0),
                        caption: 'Nhóm đang hoạt động tích cực',
                        color: COLORS.SUCCESS[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Nhóm không hoạt động',
                        value: formatNumber(teamsData.inactive_teams || 0),
                        caption: 'Nhóm cần tái cấu trúc hoặc hỗ trợ',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    },
                    {
                        label: 'Thành viên trung bình',
                        value: `${(teamsData.average_members_per_team ?? 0).toFixed(1)} người`,
                        caption: 'Số thành viên trung bình trên mỗi nhóm',
                        color: COLORS.INFO[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Đội nhóm theo trạng thái"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(teamsData.teams_by_status?.length)}
                emptyMessage="Chưa có dữ liệu phân bố đội nhóm theo trạng thái."
            >
                <SimpleBarChart
                    data={teamsData.teams_by_status}
                    dataKey="count"
                    xAxisKey="status"
                    fill={COLORS.SECONDARY[500]}
                    name="Số lượng"
                    xAxisAngle={-45}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== EMPLOYEES PERFORMANCE SECTION ==========
export const EmployeesPerformanceSection = ({ employeesPerformanceData }) => {
    if (!employeesPerformanceData) return null;

    return (
        <SectionContainer title="Hiệu suất Nhân viên" color={COLORS.PRIMARY[600]}>
            {!employeesPerformanceData.employee_booking_completions?.length &&
                !employeesPerformanceData.employee_task_completions?.length &&
                !employeesPerformanceData.top_performing_employees?.length ? (
                <EmptyState message="Chưa có dữ liệu hiệu suất nhân viên cho chu kỳ này." />
            ) : (
                <>
                    <CardSection
                        title="Hoàn thành booking theo nhân viên"
                        color={COLORS.PRIMARY[600]}
                        hasData={Boolean(employeesPerformanceData.employee_booking_completions?.length)}
                        emptyMessage="Chưa có dữ liệu hoàn thành booking."
                    >
                        <SimpleBarChart
                            data={employeesPerformanceData.employee_booking_completions}
                            dataKey="completion_count"
                            xAxisKey="employee_name"
                            fill={COLORS.SUCCESS[500]}
                            name="Số lượng hoàn thành"
                            xAxisAngle={-45}
                            xAxisHeight={100}
                        />
                    </CardSection>

                    <CardSection
                        title="Nhân viên có hiệu suất cao nhất"
                        color={COLORS.PRIMARY[600]}
                        hasData={Boolean(employeesPerformanceData.top_performing_employees?.length)}
                        emptyMessage="Chưa có dữ liệu xếp hạng hiệu suất nhân viên."
                    >
                        <Stack spacing={1.5}>
                            {employeesPerformanceData.top_performing_employees?.map((item, index) => (
                                <Stack
                                    key={index}
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.35) }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {item.employee_name || 'Không xác định'}
                                    </Typography>
                                    <Chip
                                        label={`Điểm: ${item.performance_score?.toFixed(1) || 0}`}
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                        color="success"
                                    />
                                </Stack>
                            ))}
                        </Stack>
                    </CardSection>
                </>
            )}
        </SectionContainer>
    );
};

// ========== DAILY TASKS SECTION ==========
export const DailyTasksSection = ({ dailyTasksData }) => {
    if (!dailyTasksData) return null;

    return (
        <SectionContainer title="Thống kê Task Hàng ngày" color={COLORS.WARNING[600]}>
            <CardSection
                title="Task hàng ngày theo chu kỳ"
                color={COLORS.WARNING[600]}
                hasData={Boolean(dailyTasksData.daily_tasks_by_period?.length)}
                emptyMessage="Chưa có dữ liệu task hàng ngày theo chu kỳ."
            >
                <StackedBarChart
                    data={dailyTasksData.daily_tasks_by_period?.map(item => ({
                        ...item,
                        period: formatMonthLabel(item.period)
                    }))}
                    xAxisKey="period"
                    xAxisAngle={-45}
                    bars={[
                        { dataKey: 'completed', fill: COLORS.SUCCESS[500], name: 'Đã hoàn thành', stackId: 'a' },
                        { dataKey: 'pending', fill: COLORS.WARNING[500], name: 'Đang chờ', stackId: 'a' }
                    ]}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== WORK SHIFTS SECTION ==========
export const WorkShiftsSection = ({ workShiftsData }) => {
    if (!workShiftsData) return null;

    return (
        <SectionContainer title="Thống kê Ca làm việc" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số ca làm việc',
                        value: formatNumber(workShiftsData.total_work_shifts || 0),
                        caption: 'Tổng số ca đang cấu hình',
                        color: COLORS.SECONDARY[500],
                        icon: <EventAvailable fontSize="medium" />
                    },
                    {
                        label: 'Tỷ lệ sử dụng ca',
                        value: `${(workShiftsData.utilization_rate ?? 0).toFixed(1)}%`,
                        caption: 'Hiệu quả phân bổ ca hiện tại',
                        color: COLORS.INFO[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Phân bổ nhân viên theo ca làm việc"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(workShiftsData.work_shift_assignments?.length)}
                emptyMessage="Chưa có dữ liệu phân bổ nhân viên theo ca."
            >
                <SimpleBarChart
                    data={workShiftsData.work_shift_assignments}
                    dataKey="employee_count"
                    xAxisKey="work_shift_name"
                    fill={COLORS.SECONDARY[500]}
                    name="Số lượng nhân viên"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== CUSTOMERS SECTION ==========
export const CustomersSection = ({ customersStats }) => {
    if (!customersStats) return null;

    return (
        <SectionContainer title="Thống kê Khách hàng" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng khách hàng',
                        value: formatNumber(customersStats.total_customers || 0),
                        caption: 'Số lượng khách hàng đang có',
                        color: COLORS.PRIMARY[500],
                        icon: <People fontSize="medium" />
                    },
                    {
                        label: 'Khách hàng hoạt động',
                        value: formatNumber(customersStats.active_customers || 0),
                        caption: 'Khách hàng đang tương tác',
                        color: COLORS.SUCCESS[500],
                        icon: <PersonAdd fontSize="medium" />
                    },
                    {
                        label: 'Khách hàng không hoạt động',
                        value: formatNumber(customersStats.inactive_customers || 0),
                        caption: 'Đã dừng tương tác, cần kích hoạt lại',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    },
                    {
                        label: 'Tổng điểm thưởng',
                        value: formatNumber(customersStats.total_loyalty_points || 0),
                        caption: 'Điểm tích lũy của khách hàng',
                        color: COLORS.WARNING[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Khách hàng mới theo chu kỳ"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(customersStats.new_customers_by_period?.length)}
                emptyMessage="Chưa có dữ liệu khách hàng mới theo chu kỳ."
            >
                <SimpleBarChart
                    data={customersStats.new_customers_by_period?.map(item => ({
                        ...item,
                        period: formatMonthLabel(item.period)
                    }))}
                    dataKey="count"
                    xAxisKey="period"
                    fill={COLORS.PRIMARY[500]}
                    name="Số lượng khách mới"
                    xAxisAngle={-45}
                />
            </CardSection>
        </SectionContainer>
    );
};

// ========== INVENTORY SECTION ==========
export const InventorySection = ({ inventoryStats }) => {
    if (!inventoryStats) return null;

    return (
        <SectionContainer title="Thống kê Kho hàng" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng số sản phẩm',
                        value: formatNumber(inventoryStats.total_products || 0),
                        caption: 'Đa dạng mặt hàng trong kho',
                        color: COLORS.SECONDARY[500],
                        icon: <Inventory2 fontSize="medium" />
                    },
                    {
                        label: 'Giá trị tồn kho',
                        value: formatCurrency(inventoryStats.total_inventory_value || 0),
                        caption: 'Tổng giá trị tài sản tồn kho',
                        color: COLORS.INFO[500],
                        icon: <AttachMoney fontSize="medium" />
                    },
                    {
                        label: 'Sản phẩm tồn kho lâu',
                        value: formatNumber(inventoryStats.long_stock_products?.length || 0),
                        caption: 'Cần ưu tiên xử lý hoặc khuyến mãi',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Sản phẩm tồn kho lâu"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(inventoryStats.long_stock_products?.length)}
                emptyMessage="Kho không có sản phẩm lưu kho lâu."
            >
                <Stack spacing={1.5}>
                    {inventoryStats.long_stock_products?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.SECONDARY[100], 0.35) }}
                        >
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.product_name || 'Không xác định'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tồn kho: {formatNumber(item.stock_quantity || 0)} · Ngày trong kho: {formatNumber(item.days_in_stock || 0)}
                                </Typography>
                            </Box>
                            <Chip
                                label={formatDateTime(item.created_at)}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="default"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>
        </SectionContainer>
    );
};

