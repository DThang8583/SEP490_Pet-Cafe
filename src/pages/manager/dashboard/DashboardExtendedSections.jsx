import React, { useState, useEffect, useRef } from 'react';
import { Typography, Stack, Chip, alpha, Box, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Tooltip, Grid, Divider } from '@mui/material';
import { People, TaskAlt, TrendingDown, Groups, PersonAdd, Insights, EventAvailable, Inventory2, AttachMoney, Payment, Visibility, ArrowBack, ContentCopy, CheckCircle } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import { SectionContainer, SummaryGrid, CardSection, EmptyState, formatCurrency, formatNumber, formatMonthLabel, formatDateTime, SimpleBarChart, StackedBarChart, PieChartComponent, LineChartComponent } from './DashboardUtils';
import { getTransactions } from '../../../api/transactionsApi';
import Pagination from '../../../components/common/Pagination';
import Loading from '../../../components/loading/Loading';

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
                <PieChartComponent
                    data={petsData.pets_by_species}
                    dataKey="count"
                    nameKey="species_name"
                    colors={[COLORS.SECONDARY[500], COLORS.SUCCESS[500], COLORS.INFO[500], COLORS.WARNING[500]]}
                />
            </CardSection>

            <CardSection
                title="Thú cưng theo giống"
                color={COLORS.INFO[600]}
                hasData={Boolean(petsData.pets_by_breed?.length)}
                emptyMessage="Chưa có dữ liệu phân loại theo giống."
            >
                <SimpleBarChart
                    data={petsData.pets_by_breed}
                    dataKey="count"
                    xAxisKey="breed_name"
                    fill={COLORS.INFO[500]}
                    name="Số lượng"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>

            <CardSection
                title="Thú cưng theo nhóm tuổi"
                color={COLORS.WARNING[600]}
                hasData={Boolean(petsData.pets_by_age_group?.length)}
                emptyMessage="Chưa có dữ liệu phân loại theo nhóm tuổi."
            >
                <SimpleBarChart
                    data={petsData.pets_by_age_group}
                    dataKey="count"
                    xAxisKey="age_group"
                    fill={COLORS.WARNING[500]}
                    name="Số lượng"
                />
            </CardSection>

            <CardSection
                title="Thú cưng theo giới tính"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(petsData.pets_by_gender?.length)}
                emptyMessage="Chưa có dữ liệu phân loại theo giới tính."
            >
                <Stack spacing={1.5}>
                    {petsData.pets_by_gender?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.PRIMARY[100], 0.35)
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.gender === 'Male' ? 'Đực' : item.gender === 'Female' ? 'Cái' : item.gender || 'Không xác định'}
                            </Typography>
                            <Chip
                                label={formatNumber(item.count || 0)}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="primary"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>

            <CardSection
                title="Thú cưng nhập mới theo tháng"
                color={COLORS.SECONDARY[600]}
                hasData={Boolean(petsData.pet_arrivals_by_month?.length)}
                emptyMessage="Chưa có dữ liệu thú cưng nhập mới."
            >
                <LineChartComponent
                    data={petsData.pet_arrivals_by_month?.map((item) => ({
                        ...item,
                        label: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="label"
                    name="Số lượng"
                    stroke={COLORS.SECONDARY[500]}
                    showArea={true}
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
                <LineChartComponent
                    data={petsHealthData.health_checks_by_month?.map((item) => ({
                        ...item,
                        label: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="label"
                    name="Số lượt khám"
                    stroke={COLORS.SUCCESS[500]}
                    showArea={true}
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
        <SectionContainer title="Thống kê Ca" color={COLORS.SECONDARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tỷ lệ sử dụng Ca',
                        value: `${(slotsData.utilization_rate ?? 0).toFixed(1)}%`,
                        caption: 'Hiệu suất phân bổ ca hiện tại',
                        color: COLORS.SECONDARY[500],
                        icon: <Insights fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Tình trạng Ca theo ngày"
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

            <CardSection
                title="Ca theo khu vực"
                color={COLORS.INFO[600]}
                hasData={Boolean(slotsData.slot_by_area?.length)}
                emptyMessage="Chưa có dữ liệu ca theo khu vực."
            >
                <Stack spacing={1.5}>
                    {slotsData.slot_by_area?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.INFO[100], 0.35)
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.area_name || 'Không xác định'}
                            </Typography>
                            <Chip
                                label={`${formatNumber(item.slot_count || 0)} ca`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="info"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>

            {slotsData.slot_by_time_slot && slotsData.slot_by_time_slot.length > 0 && (
                <CardSection
                    title="Slot theo khung giờ"
                    color={COLORS.WARNING[600]}
                    hasData={Boolean(slotsData.slot_by_time_slot?.length)}
                    emptyMessage="Chưa có dữ liệu slot theo khung giờ."
                >
                    <SimpleBarChart
                        data={slotsData.slot_by_time_slot}
                        dataKey="slot_count"
                        xAxisKey="time_slot"
                        fill={COLORS.WARNING[500]}
                        name="Số lượng slot"
                        xAxisAngle={-45}
                        xAxisHeight={100}
                    />
                </CardSection>
            )}
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
                <PieChartComponent
                    data={feedbacksData.rating_distribution?.map(item => ({
                        ...item,
                        name: `${item.rating} sao`
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.ERROR[500], COLORS.WARNING[500], COLORS.INFO[500], COLORS.SUCCESS[500], COLORS.PRIMARY[500]]}
                />
            </CardSection>

            <CardSection
                title="Top dịch vụ được đánh giá cao"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(feedbacksData.top_rated_services?.length)}
                emptyMessage="Chưa có dữ liệu top dịch vụ được đánh giá cao."
            >
                <Stack spacing={1.5}>
                    {feedbacksData.top_rated_services?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.SUCCESS[100], 0.35)
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.service_name || 'Không xác định'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {item.average_rating && (
                                    <Chip
                                        label={`${item.average_rating.toFixed(1)} ⭐`}
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                        color="success"
                                    />
                                )}
                                {item.rating_count !== undefined && (
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.SUCCESS[700] }}>
                                        ({formatNumber(item.rating_count)} đánh giá)
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
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
                title="Nhân viên theo vai trò"
                color={COLORS.INFO[600]}
                hasData={Boolean(employeesData.employees_by_sub_role?.length)}
                emptyMessage="Chưa có dữ liệu nhân viên theo vai trò."
            >
                <Stack spacing={1.5}>
                    {employeesData.employees_by_sub_role?.map((item, index) => {
                        // Việt hóa vai trò
                        const roleLabel = item.sub_role === 'WORKING_STAFF'
                            ? 'Nhân viên chăm sóc'
                            : item.sub_role === 'SALE_STAFF'
                                ? 'Nhân viên bán hàng'
                                : item.sub_role === 'MANAGER'
                                    ? 'Quản lý'
                                    : item.sub_role?.trim() || 'Không xác định';

                        return (
                            <Stack
                                key={index}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: alpha(COLORS.INFO[100], 0.35)
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {roleLabel}
                                </Typography>
                                <Chip
                                    label={formatNumber(item.count || 0)}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                    color="info"
                                />
                            </Stack>
                        );
                    })}
                </Stack>
            </CardSection>

            <CardSection
                title="Nhân viên mới theo tháng"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(employeesData.new_employees_by_month?.length)}
                emptyMessage="Chưa có dữ liệu nhân viên mới theo tháng."
            >
                <LineChartComponent
                    data={employeesData.new_employees_by_month?.map(item => ({
                        ...item,
                        month: formatMonthLabel(item.month)
                    }))}
                    dataKey="count"
                    xAxisKey="month"
                    name="Số lượng nhân viên mới"
                    stroke={COLORS.PRIMARY[500]}
                    xAxisAngle={-45}
                    showArea={true}
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
                <PieChartComponent
                    data={teamsData.teams_by_status?.map(item => ({
                        ...item,
                        name: item.status === 'ACTIVE' ? 'Hoạt động'
                            : item.status === 'INACTIVE' ? 'Không hoạt động'
                                : item.status || 'Không xác định'
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.SUCCESS[500], COLORS.ERROR[500], COLORS.WARNING[500]]}
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
                        title="Hoàn thành task theo nhân viên"
                        color={COLORS.INFO[600]}
                        hasData={Boolean(employeesPerformanceData.employee_task_completions?.length)}
                        emptyMessage="Chưa có dữ liệu hoàn thành task."
                    >
                        <SimpleBarChart
                            data={employeesPerformanceData.employee_task_completions}
                            dataKey="completion_count"
                            xAxisKey="employee_name"
                            fill={COLORS.INFO[500]}
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
        <SectionContainer title="Thống kê Nhiệm vụ hàng ngày" color={COLORS.WARNING[600]}>
            <CardSection
                title="Nhiệm vụ hàng ngày theo chu kỳ"
                color={COLORS.WARNING[600]}
                hasData={Boolean(dailyTasksData.daily_tasks_by_period?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ hàng ngày theo chu kỳ."
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

            <CardSection
                title="Nhiệm vụ hàng ngày theo trạng thái"
                color={COLORS.INFO[600]}
                hasData={Boolean(dailyTasksData.daily_tasks_by_status?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ hàng ngày theo trạng thái."
            >
                <PieChartComponent
                    data={dailyTasksData.daily_tasks_by_status?.map(item => ({
                        ...item,
                        name: item.status === 'COMPLETED'
                            ? 'Đã hoàn thành'
                            : item.status === 'SCHEDULED'
                                ? 'Đã lên lịch'
                                : item.status === 'IN_PROGRESS'
                                    ? 'Đang xử lý'
                                    : item.status === 'CANCELLED'
                                        ? 'Đã hủy'
                                        : item.status || 'Không xác định'
                    }))}
                    dataKey="count"
                    nameKey="name"
                    colors={[COLORS.SUCCESS[500], COLORS.INFO[500], COLORS.WARNING[500], COLORS.ERROR[500]]}
                />
            </CardSection>

            <CardSection
                title="Nhiệm vụ hàng ngày theo nhóm"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(dailyTasksData.daily_tasks_by_team?.length)}
                emptyMessage="Chưa có dữ liệu nhiệm vụ hàng ngày theo nhóm."
            >
                <SimpleBarChart
                    data={dailyTasksData.daily_tasks_by_team}
                    dataKey="task_count"
                    xAxisKey="team_name"
                    fill={COLORS.PRIMARY[500]}
                    name="Số lượng task"
                    xAxisAngle={-45}
                    xAxisHeight={100}
                />
            </CardSection>

            <CardSection
                title="Nhiệm vụ quá hạn"
                color={COLORS.ERROR[600]}
                hasData={Boolean(dailyTasksData.overdue_tasks?.length)}
                emptyMessage="Không có nhiệm vụ quá hạn."
            >
                <Stack spacing={1.5}>
                    {dailyTasksData.overdue_tasks?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.ERROR[100], 0.35)
                            }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.task_title || 'Không xác định'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    Hạn: {item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN') : '—'} ·
                                    Quá hạn: {formatNumber(item.days_overdue || 0)} ngày
                                </Typography>
                            </Stack>
                            <Chip
                                label={`${formatNumber(item.days_overdue || 0)} ngày`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="error"
                            />
                        </Stack>
                    ))}
                </Stack>
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
                    }
                ]}
            />

            <CardSection
                title="Khách hàng mới theo chu kỳ"
                color={COLORS.PRIMARY[600]}
                hasData={Boolean(customersStats.new_customers_by_period?.length)}
                emptyMessage="Chưa có dữ liệu khách hàng mới theo chu kỳ."
            >
                <LineChartComponent
                    data={customersStats.new_customers_by_period?.map(item => ({
                        ...item,
                        period: formatMonthLabel(item.period)
                    }))}
                    dataKey="count"
                    xAxisKey="period"
                    name="Số lượng khách mới"
                    stroke={COLORS.PRIMARY[500]}
                    xAxisAngle={-45}
                    showArea={true}
                />
            </CardSection>

            <CardSection
                title="Top khách hàng theo số lượng đơn"
                color={COLORS.SUCCESS[600]}
                hasData={Boolean(customersStats.top_customers_by_order_count?.length)}
                emptyMessage="Chưa có dữ liệu top khách hàng theo số lượng đơn."
            >
                <Stack spacing={1.5}>
                    {customersStats.top_customers_by_order_count?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.SUCCESS[100], 0.35)
                            }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.customer_name || 'Không xác định'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    {formatNumber(item.order_count || 0)} đơn · {formatCurrency(item.total_revenue || 0)}
                                </Typography>
                            </Stack>
                            <Chip
                                label={`${formatNumber(item.order_count || 0)} đơn`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="success"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>

            <CardSection
                title="Top khách hàng theo doanh thu"
                color={COLORS.WARNING[600]}
                hasData={Boolean(customersStats.top_customers_by_revenue?.length)}
                emptyMessage="Chưa có dữ liệu top khách hàng theo doanh thu."
            >
                <Stack spacing={1.5}>
                    {customersStats.top_customers_by_revenue?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: alpha(COLORS.WARNING[100], 0.35)
                            }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.customer_name || 'Không xác định'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                    {formatNumber(item.order_count || 0)} đơn · {formatCurrency(item.total_revenue || 0)}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.WARNING[700] }}>
                                {formatCurrency(item.total_revenue || 0)}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
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
                        label: 'Giá trị tổng sản phẩm',
                        value: formatCurrency(inventoryStats.total_inventory_value || 0),
                        caption: 'Tổng giá trị sản phẩm',
                        color: COLORS.INFO[500],
                        icon: <AttachMoney fontSize="medium" />
                    },
                    {
                        label: 'Sản phẩm sắp hết',
                        value: formatNumber(inventoryStats.low_stock_products?.length || 0),
                        caption: 'Cần bổ sung kho ngay',
                        color: COLORS.WARNING[500],
                        icon: <TrendingDown fontSize="medium" />
                    },
                    {
                        label: 'Sản phẩm bán chậm',
                        value: formatNumber(inventoryStats.long_stock_products?.length || 0),
                        caption: 'Cần ưu tiên xử lý hoặc khuyến mãi',
                        color: COLORS.ERROR[500],
                        icon: <TrendingDown fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Sản phẩm sắp hết"
                color={COLORS.WARNING[600]}
                hasData={Boolean(inventoryStats.low_stock_products?.length)}
                emptyMessage="Tất cả sản phẩm đều đủ tồn kho."
            >
                <Stack spacing={1.5}>
                    {inventoryStats.low_stock_products?.map((item, index) => (
                        <Stack
                            key={index}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.WARNING[100], 0.35) }}
                        >
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.product_name || 'Không xác định'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tồn kho: {formatNumber(item.stock_quantity || 0)}
                                </Typography>
                            </Box>
                            <Chip
                                label={`Tồn kho: ${formatNumber(item.stock_quantity || 0)}`}
                                size="small"
                                sx={{ fontWeight: 600 }}
                                color="warning"
                            />
                        </Stack>
                    ))}
                </Stack>
            </CardSection>

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
                                    Số lượng bán trong ngày: {formatNumber(item.stock_quantity || 0)} · Mức tối thiểu: {formatNumber(item.days_in_stock || 0)}
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

// ========== TRANSACTIONS SECTION ==========
const formatVnd = (val) => {
    const n = Number(val || 0);
    return n.toLocaleString("vi-VN") + " ₫";
};

const mapPaymentMethodTransactions = (method) => {
    switch ((method || '').toUpperCase()) {
        case 'ONLINE':
        case 'QR':
            return 'Thanh toán online';
        case 'AT_COUNTER':
        case 'COUNTER':
            return 'Tại quầy';
        case 'CASH':
            return 'Tiền mặt';
        case 'CARD':
            return 'Thẻ';
        default:
            return method || 'Không xác định';
    }
};

const mapOrderStatusTransactions = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'PAID':
            return 'Hoàn thành';
        case 'PENDING':
            return 'Đang xử lý';
        case 'CANCELLED':
            return 'Đã hủy';
        case 'REFUNDED':
            return 'Đã hoàn tiền';
        case 'EXPIRED':
            return 'Hết hạn';
        default:
            return status || 'Không xác định';
    }
};

const mapPaymentStatusTransactions = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'PAID':
            return 'Đã thanh toán';
        case 'PENDING':
            return 'Chưa thanh toán';
        case 'CANCELLED':
            return 'Đã hủy';
        case 'REFUNDED':
            return 'Đã hoàn tiền';
        case 'EXPIRED':
            return 'Hết hạn';
        case 'FAILED':
            return 'Thất bại';
        default:
            return status || 'Không xác định';
    }
};

const mapTransactionStatus = (desc) => {
    switch ((desc || '').toLowerCase()) {
        case 'success':
            return 'Thành công';
        case 'failed':
            return 'Thất bại';
        case 'pending':
            return 'Đang xử lý';
        default:
            return desc || 'Không xác định';
    }
};

const formatDateTransactions = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return '—';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (error) {
        return dateString;
    }
};

const DetailItemTransactions = ({ label, children }) => (
    <Box sx={{ mb: 1 }}>
        <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            gutterBottom
        >
            {label}
        </Typography>
        {children}
    </Box>
);

export const TransactionsSection = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [copiedText, setCopiedText] = useState(null);

    // Filter states
    const [orderCode, setOrderCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [status, setStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadTransactions = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                limit,
            };

            if (orderCode.trim()) {
                params.OrderCode = orderCode.trim();
            }
            if (paymentMethod) {
                params.PaymentMethod = paymentMethod;
            }
            if (status) {
                params.Status = status;
            }
            if (startDate) {
                params.StartDate = startDate;
            }
            if (endDate) {
                params.EndDate = endDate;
            }

            const response = await getTransactions(params);

            let data = [];
            let totalCount = 0;
            let totalPagesCount = 0;

            if (Array.isArray(response?.data)) {
                data = response.data;
                const pagination = response.pagination || {};
                totalCount = pagination.total_items_count ?? data.length;
                totalPagesCount = pagination.total_pages_count ?? (Math.ceil(totalCount / limit) || 1);
            } else if (Array.isArray(response)) {
                data = response;
                totalCount = data.length;
                totalPagesCount = Math.ceil(totalCount / limit) || 1;
            }

            // Client-side filtering for Status and PaymentMethod
            let finalData = data;

            if (status) {
                const statusUpper = status.toUpperCase();
                finalData = finalData.filter((tx) => {
                    const orderStatus = (tx.order?.status || '').toUpperCase();
                    const paymentStatus = (tx.order?.payment_status || '').toUpperCase();
                    return orderStatus === statusUpper || paymentStatus === statusUpper;
                });
            }

            if (paymentMethod) {
                const methodUpper = paymentMethod.toUpperCase();
                finalData = finalData.filter((tx) => {
                    const orderPaymentMethod = (tx.order?.payment_method || '').toUpperCase();
                    if (methodUpper === 'ONLINE' || methodUpper === 'QR') {
                        return orderPaymentMethod === 'ONLINE' || orderPaymentMethod === 'QR';
                    }
                    if (methodUpper === 'AT_COUNTER' || methodUpper === 'COUNTER') {
                        return orderPaymentMethod === 'AT_COUNTER' || orderPaymentMethod === 'COUNTER' || orderPaymentMethod === 'CASH';
                    }
                    if (methodUpper === 'CASH') {
                        return orderPaymentMethod === 'CASH' || orderPaymentMethod === 'AT_COUNTER';
                    }
                    if (methodUpper === 'CARD') {
                        return orderPaymentMethod === 'CARD';
                    }
                    return orderPaymentMethod === methodUpper;
                });
            }

            if (status || paymentMethod) {
                totalCount = finalData.length;
                totalPagesCount = Math.ceil(totalCount / limit) || 1;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                finalData = finalData.slice(startIndex, endIndex);
            }

            setTransactions(finalData);
            setTotal(totalCount);
            setTotalPages(totalPagesCount);
        } catch (e) {
            setError(e.message || 'Không thể tải giao dịch');
            setTransactions([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const prevFiltersRef = useRef({ orderCode, paymentMethod, status, startDate, endDate });

    useEffect(() => {
        const filtersChanged =
            prevFiltersRef.current.orderCode !== orderCode ||
            prevFiltersRef.current.paymentMethod !== paymentMethod ||
            prevFiltersRef.current.status !== status ||
            prevFiltersRef.current.startDate !== startDate ||
            prevFiltersRef.current.endDate !== endDate;

        if (filtersChanged && page !== 1) {
            setPage(1);
            prevFiltersRef.current = { orderCode, paymentMethod, status, startDate, endDate };
            return;
        }

        prevFiltersRef.current = { orderCode, paymentMethod, status, startDate, endDate };
        loadTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, orderCode, paymentMethod, status, startDate, endDate]);

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setDetailDialogOpen(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedTransaction(null);
    };

    const handleCopy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(label);
            setTimeout(() => setCopiedText(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Calculate statistics
    const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const successCount = transactions.filter(tx => tx.desc === 'success').length;

    return (
        <SectionContainer title="Giao dịch" color={COLORS.PRIMARY[600]}>
            <SummaryGrid
                items={[
                    {
                        label: 'Tổng giao dịch',
                        value: formatNumber(total),
                        caption: 'Tổng số giao dịch trong hệ thống',
                        color: COLORS.PRIMARY[500],
                        icon: <Payment fontSize="medium" />
                    },
                    {
                        label: 'Tổng số tiền',
                        value: formatCurrency(totalAmount),
                        caption: 'Tổng giá trị giao dịch',
                        color: COLORS.SUCCESS[500],
                        icon: <AttachMoney fontSize="medium" />
                    },
                    {
                        label: 'Giao dịch thành công',
                        value: formatNumber(successCount),
                        caption: 'Số giao dịch đã hoàn thành',
                        color: COLORS.SUCCESS[500],
                        icon: <CheckCircle fontSize="medium" />
                    }
                ]}
            />

            <CardSection
                title="Bộ lọc"
                color={COLORS.PRIMARY[600]}
                hasData={true}
            >
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                        '& > *': {
                            flex: 1,
                            minWidth: 0
                        }
                    }}
                >
                    <TextField
                        size="small"
                        label="Mã đơn hàng"
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value)}
                        placeholder="Nhập mã đơn hàng"
                    />
                    <FormControl size="small" sx={{ minWidth: 0, flex: '1 1 calc(20% + 2px)' }}>
                        <InputLabel>Phương thức thanh toán</InputLabel>
                        <Select
                            value={paymentMethod}
                            label="Phương thức thanh toán"
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="ONLINE">Thanh toán online</MenuItem>
                            <MenuItem value="AT_COUNTER">Tại quầy</MenuItem>
                            <MenuItem value="CASH">Tiền mặt</MenuItem>
                            <MenuItem value="CARD">Thẻ</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={status}
                            label="Trạng thái"
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="PAID">Đã thanh toán</MenuItem>
                            <MenuItem value="PENDING">Đang chờ</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                            <MenuItem value="REFUNDED">Đã hoàn tiền</MenuItem>
                            <MenuItem value="EXPIRED">Hết hạn</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label="Từ ngày"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        size="small"
                        label="Đến ngày"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </CardSection>

            <CardSection
                title="Danh sách giao dịch"
                color={COLORS.PRIMARY[600]}
                hasData={!loading}
                emptyMessage="Chưa có giao dịch nào"
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Loading message="Đang tải giao dịch..." size="medium" fullScreen={false} />
                    </Box>
                ) : transactions.length === 0 ? (
                    <EmptyState message="Không có giao dịch nào. Vui lòng thử lại hoặc thay đổi bộ lọc." />
                ) : (
                    <>
                        <TableContainer component={Paper} sx={{ boxShadow: 'none', maxHeight: 600, overflow: 'auto' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.PRIMARY[50] }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Mã đơn hàng</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Phương thức</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Ngày giao dịch</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow
                                            key={transaction.id}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: COLORS.PRIMARY[50]
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                {transaction.order?.order_number || transaction.order_code || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.order?.full_name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.order?.phone || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: COLORS.SUCCESS[600] }}>
                                                {formatCurrency(transaction.amount || 0)}
                                            </TableCell>
                                            <TableCell>
                                                {mapPaymentMethodTransactions(transaction.order?.payment_method)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={mapTransactionStatus(transaction.desc)}
                                                    color={transaction.desc === 'success' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDateTransactions(transaction.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(transaction)}
                                                    sx={{ color: COLORS.PRIMARY[600] }}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {totalPages > 0 && total > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    itemsPerPage={limit}
                                    onItemsPerPageChange={(newLimit) => {
                                        setLimit(newLimit);
                                        setPage(1);
                                    }}
                                    totalItems={total}
                                    showItemsPerPage={true}
                                    itemsPerPageOptions={[10, 20, 50, 100]}
                                />
                            </Box>
                        )}
                    </>
                )}
            </CardSection>

            {/* Dialog chi tiết giao dịch */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetailDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Chi tiết giao dịch
                    </Typography>
                    <IconButton
                        onClick={handleCloseDetailDialog}
                        size="small"
                    >
                        <ArrowBack />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 2 }}>
                    {selectedTransaction && (
                        <Stack spacing={2.5}>
                            {/* Tóm tắt giao dịch */}
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1.5,
                                    bgcolor: COLORS.BACKGROUND.NEUTRAL,
                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                }}
                            >
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                >
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Mã đơn hàng
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {selectedTransaction.order_code ||
                                                selectedTransaction?.order?.payment_info?.order_code ||
                                                selectedTransaction?.order?.order_number ||
                                                '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                            Ngày tạo
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDateTransactions(selectedTransaction.created_at)}
                                        </Typography>
                                    </Box>
                                    <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Số tiền giao dịch
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[600] }}>
                                            {formatVnd(selectedTransaction.amount)}
                                        </Typography>
                                        {selectedTransaction?.order && (
                                            <Chip
                                                label={selectedTransaction.order.payment_status
                                                    ? mapPaymentStatusTransactions(selectedTransaction.order.payment_status)
                                                    : mapOrderStatusTransactions(selectedTransaction.order.status)}
                                                color={(selectedTransaction.order.payment_status || selectedTransaction.order.status) === 'PAID' ? 'success' : 'default'}
                                                size="small"
                                                sx={{ mt: 0.5 }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Thông tin giao dịch */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.TEXT.PRIMARY }}>
                                    Thông tin giao dịch
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItemTransactions label="Mã giao dịch">
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                    {selectedTransaction.id || '—'}
                                                </Typography>
                                                {selectedTransaction.id && (
                                                    <Tooltip title={copiedText === 'transaction_id' ? 'Đã sao chép!' : 'Sao chép'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(selectedTransaction.id, 'transaction_id')}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            {copiedText === 'transaction_id' ? (
                                                                <CheckCircle fontSize="small" />
                                                            ) : (
                                                                <ContentCopy fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </DetailItemTransactions>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItemTransactions label="Mã tham chiếu">
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                    {selectedTransaction.reference || '—'}
                                                </Typography>
                                                {selectedTransaction.reference && (
                                                    <Tooltip title={copiedText === 'reference' ? 'Đã sao chép!' : 'Sao chép'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(selectedTransaction.reference, 'reference')}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            {copiedText === 'reference' ? (
                                                                <CheckCircle fontSize="small" />
                                                            ) : (
                                                                <ContentCopy fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </DetailItemTransactions>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <DetailItemTransactions label="Mô tả">
                                            <Typography variant="body2">
                                                {selectedTransaction.description || '—'}
                                            </Typography>
                                        </DetailItemTransactions>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItemTransactions label="Trạng thái giao dịch">
                                            <Chip
                                                label={mapTransactionStatus(selectedTransaction.desc)}
                                                color={selectedTransaction.desc === 'success' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </DetailItemTransactions>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Thông tin đơn hàng */}
                            {selectedTransaction?.order && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.TEXT.PRIMARY }}>
                                        Thông tin đơn hàng
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Khách hàng / Người thanh toán">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selectedTransaction.order.full_name || '—'}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Số điện thoại">
                                                <Typography variant="body2">
                                                    {selectedTransaction.order.phone || '—'}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <DetailItemTransactions label="Địa chỉ">
                                                <Typography variant="body2">
                                                    {selectedTransaction.order.address || '—'}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Trạng thái đơn hàng">
                                                <Chip
                                                    label={mapOrderStatusTransactions(selectedTransaction.order.status)}
                                                    color={selectedTransaction.order.status === 'PAID' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Phương thức thanh toán">
                                                <Typography variant="body2">
                                                    {mapPaymentMethodTransactions(selectedTransaction.order.payment_method)}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Trạng thái thanh toán">
                                                <Chip
                                                    label={mapPaymentStatusTransactions(selectedTransaction.order.payment_status)}
                                                    color={selectedTransaction.order.payment_status === 'PAID' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Loại đơn hàng">
                                                <Typography variant="body2">
                                                    {selectedTransaction.order.type === 'CUSTOMER'
                                                        ? 'Khách hàng'
                                                        : selectedTransaction.order.type === 'EMPLOYEE'
                                                            ? 'Nhân viên'
                                                            : selectedTransaction.order.type || '—'}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Tổng tiền">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {formatVnd(selectedTransaction.order.total_amount)}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <DetailItemTransactions label="Thành tiền">
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.SUCCESS[600] }}>
                                                    {formatVnd(selectedTransaction.order.final_amount)}
                                                </Typography>
                                            </DetailItemTransactions>
                                        </Grid>
                                        {selectedTransaction.order.order_date && selectedTransaction.order.order_date !== '0001-01-01T00:00:00' && (
                                            <Grid item xs={12} sm={6}>
                                                <DetailItemTransactions label="Ngày đơn hàng">
                                                    <Typography variant="body2">
                                                        {formatDateTransactions(selectedTransaction.order.order_date)}
                                                    </Typography>
                                                </DetailItemTransactions>
                                            </Grid>
                                        )}
                                        {selectedTransaction.order.notes && (
                                            <Grid item xs={12}>
                                                <DetailItemTransactions label="Ghi chú">
                                                    <Typography variant="body2">
                                                        {selectedTransaction.order.notes}
                                                    </Typography>
                                                </DetailItemTransactions>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button
                        onClick={handleCloseDetailDialog}
                        variant="contained"
                        sx={{ fontWeight: 500 }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </SectionContainer>
    );
};

