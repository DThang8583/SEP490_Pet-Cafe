import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    Stack,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    alpha,
    CircularProgress
} from '@mui/material';
import {
    AttachMoney,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Refresh,
    People,
    EventAvailable,
    Payment,
    Groups,
    PersonAdd,
    TaskAlt,
    Inventory2,
    Insights
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from 'recharts';
import { COLORS } from '../../constants/colors';
import Loading from '../../components/loading/Loading';
import AlertModal from '../../components/modals/AlertModal';
import statisticsApi from '../../api/statisticsApi';

const formatCurrency = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
};

const formatMonthLabel = (monthString) => {
    if (!monthString) return '—';
    try {
        const [year, month] = monthString.split('-');
        return `${month.padStart(2, '0')}/${year}`;
    } catch (error) {
        return monthString;
    }
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (error) {
        return value;
    }
};

const SectionContainer = ({ title, color = COLORS.PRIMARY[600], actions, children }) => (
    <Box sx={{ mb: 5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color }}>
                {title}
            </Typography>
            {actions}
        </Stack>
        {children}
    </Box>
);

const EmptyState = ({ message }) => (
    <Box
        sx={{
            py: 6,
            px: 3,
            textAlign: 'center',
            color: 'text.secondary',
            borderRadius: 2,
            background: alpha(COLORS.PRIMARY[100], 0.15)
        }}
    >
        <Typography variant="body2">{message || 'Không có dữ liệu hiển thị.'}</Typography>
    </Box>
);

const SummaryCard = ({ icon, label, value, caption, color = COLORS.PRIMARY[500] }) => (
    <Paper
        sx={{
            p: 3,
            borderRadius: 3,
            height: '100%',
            border: '1px solid',
            borderColor: alpha(color, 0.25),
            boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.08)'
        }}
    >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            {icon && (
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: alpha(color, 0.12),
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {icon}
                </Box>
            )}
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}
            >
                {label}
            </Typography>
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800, color, mb: caption ? 1 : 0 }}>
            {value}
        </Typography>
        {caption && (
            <Typography variant="body2" color="text.secondary">
                {caption}
            </Typography>
        )}
    </Paper>
);

const SummaryGrid = ({ items = [], columns = { xs: 12, sm: 6, md: 3, lg: 3 }, spacing = 3 }) => (
    <Grid container spacing={spacing} sx={{ mb: items.length ? spacing : 0 }}>
        {items.map((item, index) => (
            <Grid
                item
                key={item.label || index}
                xs={columns.xs ?? 12}
                sm={columns.sm ?? 6}
                md={columns.md ?? 3}
                lg={columns.lg ?? columns.md ?? 3}
            >
                <SummaryCard {...item} />
            </Grid>
        ))}
    </Grid>
);

const CardSection = ({ title, color = COLORS.PRIMARY[600], hasData = true, emptyMessage, children }) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0px 18px 35px rgba(15, 23, 42, 0.08)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color, mb: 2 }}>
                {title}
            </Typography>
            {hasData ? children : <EmptyState message={emptyMessage} />}
        </CardContent>
    </Card>
);

const DashboardPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('month'); // day, week, month, year
    const [revenueData, setRevenueData] = useState(null);
    const [ordersData, setOrdersData] = useState(null);
    const [productsData, setProductsData] = useState(null);
    const [servicesData, setServicesData] = useState(null);
    const [slotsData, setSlotsData] = useState(null);
    const [feedbacksData, setFeedbacksData] = useState(null);
    const [petsData, setPetsData] = useState(null);
    const [petsHealthData, setPetsHealthData] = useState(null);
    const [petGroupsData, setPetGroupsData] = useState(null);
    const [employeesData, setEmployeesData] = useState(null);
    const [teamsData, setTeamsData] = useState(null);
    const [employeesPerformanceData, setEmployeesPerformanceData] = useState(null);
    const [tasksData, setTasksData] = useState(null);
    const [dailyTasksData, setDailyTasksData] = useState(null);
    const [workShiftsData, setWorkShiftsData] = useState(null);
    const [customersStats, setCustomersStats] = useState(null);
    const [inventoryStats, setInventoryStats] = useState(null);
    const [overviewStats, setOverviewStats] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'info', title: 'Thông báo' });

    // Load statistics data
    const loadStatistics = async () => {
        try {
            setIsLoading(true);

            const params = { period };

            // Load all statistics in parallel
            const [
                revenueResponse,
                ordersResponse,
                productsResponse,
                servicesResponse,
                slotsResponse,
                feedbacksResponse,
                petsResponse,
                petsHealthResponse,
                petGroupsResponse,
                employeesResponse,
                teamsResponse,
                employeesPerformanceResponse,
                tasksResponse,
                dailyTasksResponse,
                workShiftsResponse,
                customersResponse,
                inventoryResponse,
                overviewResponse
            ] = await Promise.allSettled([
                statisticsApi.getRevenueStatistics(params),
                statisticsApi.getOrdersStatistics(params),
                statisticsApi.getProductsStatistics(params),
                statisticsApi.getServicesStatistics(params),
                statisticsApi.getSlotsStatistics(params), // slots uses same params (period can be converted to start_date/end_date)
                statisticsApi.getFeedbacksStatistics(),
                statisticsApi.getPetsStatistics(),
                statisticsApi.getPetsHealthStatistics(),
                statisticsApi.getPetGroupsStatistics(),
                statisticsApi.getEmployeesStatistics(),
                statisticsApi.getTeamsStatistics(),
                statisticsApi.getEmployeesPerformanceStatistics(params),
                statisticsApi.getTasksStatistics(),
                statisticsApi.getDailyTasksStatistics(params),
                statisticsApi.getWorkShiftsStatistics(),
                statisticsApi.getCustomersStatistics(params),
                statisticsApi.getInventoryStatistics(),
                statisticsApi.getDashboardOverviewStatistics()
            ]);

            if (revenueResponse.status === 'fulfilled') {
                setRevenueData(revenueResponse.value);
            } else {
                console.error('Failed to load revenue statistics:', revenueResponse.reason);
            }

            if (ordersResponse.status === 'fulfilled') {
                setOrdersData(ordersResponse.value);
            } else {
                console.error('Failed to load orders statistics:', ordersResponse.reason);
            }

            if (productsResponse.status === 'fulfilled') {
                setProductsData(productsResponse.value);
            } else {
                console.error('Failed to load products statistics:', productsResponse.reason);
            }

            if (servicesResponse.status === 'fulfilled') {
                setServicesData(servicesResponse.value);
            } else {
                console.error('Failed to load services statistics:', servicesResponse.reason);
            }

            if (slotsResponse.status === 'fulfilled') {
                setSlotsData(slotsResponse.value);
            } else {
                console.error('Failed to load slots statistics:', slotsResponse.reason);
            }

            if (feedbacksResponse.status === 'fulfilled') {
                setFeedbacksData(feedbacksResponse.value);
            } else {
                console.error('Failed to load feedbacks statistics:', feedbacksResponse.reason);
            }

            if (petsResponse.status === 'fulfilled') {
                setPetsData(petsResponse.value);
            } else {
                console.error('Failed to load pets statistics:', petsResponse.reason);
            }

            if (petsHealthResponse.status === 'fulfilled') {
                setPetsHealthData(petsHealthResponse.value);
            } else {
                console.error('Failed to load pets health statistics:', petsHealthResponse.reason);
            }

            if (petGroupsResponse.status === 'fulfilled') {
                setPetGroupsData(petGroupsResponse.value);
            } else {
                console.error('Failed to load pet groups statistics:', petGroupsResponse.reason);
            }

            if (employeesResponse.status === 'fulfilled') {
                setEmployeesData(employeesResponse.value);
            } else {
                console.error('Failed to load employees statistics:', employeesResponse.reason);
            }

            if (teamsResponse.status === 'fulfilled') {
                setTeamsData(teamsResponse.value);
            } else {
                console.error('Failed to load teams statistics:', teamsResponse.reason);
            }

            if (employeesPerformanceResponse.status === 'fulfilled') {
                setEmployeesPerformanceData(employeesPerformanceResponse.value);
            } else {
                console.error('Failed to load employees performance statistics:', employeesPerformanceResponse.reason);
            }

            if (tasksResponse.status === 'fulfilled') {
                setTasksData(tasksResponse.value);
            } else {
                console.error('Failed to load tasks statistics:', tasksResponse.reason);
            }

            if (dailyTasksResponse.status === 'fulfilled') {
                setDailyTasksData(dailyTasksResponse.value);
            } else {
                console.error('Failed to load daily tasks statistics:', dailyTasksResponse.reason);
            }

            if (workShiftsResponse.status === 'fulfilled') {
                setWorkShiftsData(workShiftsResponse.value);
            } else {
                console.error('Failed to load work shifts statistics:', workShiftsResponse.reason);
            }

            if (customersResponse.status === 'fulfilled') {
                setCustomersStats(customersResponse.value);
            } else {
                console.error('Failed to load customers statistics:', customersResponse.reason);
            }

            if (inventoryResponse.status === 'fulfilled') {
                setInventoryStats(inventoryResponse.value);
            } else {
                console.error('Failed to load inventory statistics:', inventoryResponse.reason);
            }

            if (overviewResponse.status === 'fulfilled') {
                setOverviewStats(overviewResponse.value);
            } else {
                console.error('Failed to load dashboard overview statistics:', overviewResponse.reason);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            setAlert({
                open: true,
                title: 'Lỗi',
                message: error.message || 'Không thể tải dữ liệu thống kê',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStatistics();
    }, [period]);

    const handleRefresh = () => {
        loadStatistics();
    };

    const getGrowthColor = (growthRate) => {
        if (!growthRate && growthRate !== 0) return COLORS.GRAY[500];
        return growthRate >= 0 ? COLORS.SUCCESS[600] : COLORS.ERROR[600];
    };

    const getGrowthIcon = (growthRate) => {
        if (!growthRate && growthRate !== 0) return null;
        return growthRate >= 0 ? <TrendingUp /> : <TrendingDown />;
    };

    if (isLoading) {
        return (
            <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
                <Loading fullScreen={false} variant="cafe" size="large" message="Đang tải dữ liệu thống kê..." />
            </Box>
        );
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%', py: 3 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.PRIMARY[600] }}>
                        Dashboard
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Chu kỳ</InputLabel>
                            <Select
                                label="Chu kỳ"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            >
                                <MenuItem value="day">Ngày</MenuItem>
                                <MenuItem value="week">Tuần</MenuItem>
                                <MenuItem value="month">Tháng</MenuItem>
                                <MenuItem value="year">Năm</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={handleRefresh}
                            sx={{
                                borderColor: COLORS.PRIMARY[300],
                                color: COLORS.PRIMARY[600],
                                '&:hover': {
                                    borderColor: COLORS.PRIMARY[500],
                                    backgroundColor: alpha(COLORS.PRIMARY[50], 0.8)
                                }
                            }}
                        >
                            Làm mới
                        </Button>
                    </Stack>
                </Box>

                {/* Dashboard Overview */}
                {overviewStats && (
                    <SectionContainer title="Tổng quan nhanh" color={COLORS.PRIMARY[600]}>
                        <SummaryGrid
                            columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                            items={[
                                {
                                    label: 'Doanh thu hôm nay',
                                    value: formatCurrency(overviewStats.revenue?.today || 0),
                                    caption: `Tuần này ${formatCurrency(overviewStats.revenue?.this_week || 0)} · Tháng này ${formatCurrency(overviewStats.revenue?.this_month || 0)}`,
                                    color: COLORS.SUCCESS[500],
                                    icon: <AttachMoney fontSize="medium" />
                                },
                                {
                                    label: 'Đơn hàng hôm nay',
                                    value: formatNumber(overviewStats.orders?.today || 0),
                                    caption: `Tỷ lệ thành công ${(overviewStats.orders?.success_rate ?? 0).toFixed(1)}%`,
                                    color: COLORS.PRIMARY[500],
                                    icon: <ShoppingCart fontSize="medium" />
                                },
                                {
                                    label: 'Thanh toán thành công',
                                    value: formatNumber(overviewStats.payment?.successful_payments || 0),
                                    caption: `Tỷ lệ ${(overviewStats.payment?.success_rate ?? 0).toFixed(1)}% · Thất bại ${formatNumber(overviewStats.payment?.failed_payments || 0)}`,
                                    color: COLORS.SECONDARY[500],
                                    icon: <Payment fontSize="medium" />
                                },
                                {
                                    label: 'Booking hoàn thành',
                                    value: formatNumber(overviewStats.bookings?.completed || 0),
                                    caption: `Đang chờ ${formatNumber(overviewStats.bookings?.pending || 0)} · Tháng này ${formatNumber(overviewStats.bookings?.this_month || 0)}`,
                                    color: COLORS.WARNING[500],
                                    icon: <EventAvailable fontSize="medium" />
                                },
                                {
                                    label: 'Khách mới (tháng)',
                                    value: formatNumber(overviewStats.customers?.new_this_month || 0),
                                    caption: `Hôm nay ${formatNumber(overviewStats.customers?.new_today || 0)} · Tuần này ${formatNumber(overviewStats.customers?.new_this_week || 0)}`,
                                    color: COLORS.PRIMARY[400],
                                    icon: <PersonAdd fontSize="medium" />
                                },
                                {
                                    label: 'Task đang chờ',
                                    value: formatNumber(overviewStats.tasks?.pending || 0),
                                    caption: `Hoàn thành ${(overviewStats.tasks?.completion_rate ?? 0).toFixed(1)}% · Đang xử lý ${formatNumber(overviewStats.tasks?.in_progress || 0)}`,
                                    color: COLORS.INFO[500],
                                    icon: <TaskAlt fontSize="medium" />
                                },
                                {
                                    label: 'Nhân viên làm việc',
                                    value: formatNumber(overviewStats.employees?.working_today || 0),
                                    caption: `Đang hoạt động ${formatNumber(overviewStats.employees?.active || 0)}`,
                                    color: COLORS.SECONDARY[500],
                                    icon: <Groups fontSize="medium" />
                                }
                            ]}
                        />
                    </SectionContainer>
                )}

                {/* Tasks Section */}
                {tasksData && (
                    <SectionContainer title="Thống kê Task" color={COLORS.INFO[600]}>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Tổng số task',
                                    value: formatNumber(tasksData.total_tasks || 0),
                                    caption: 'Tổng khối lượng công việc hiện tại',
                                    color: COLORS.INFO[500],
                                    icon: <Insights fontSize="medium" />
                                },
                                {
                                    label: 'Tỷ lệ hoàn thành',
                                    value: `${(tasksData.completion_rate ?? 0).toFixed(1)}%`,
                                    caption: 'Hiệu quả xử lý task',
                                    color: COLORS.SUCCESS[500],
                                    icon: <TaskAlt fontSize="medium" />
                                },
                                {
                                    label: 'Task công khai',
                                    value: formatNumber(tasksData.task_public_private?.public_tasks || 0),
                                    caption: 'Công việc chia sẻ toàn hệ thống',
                                    color: COLORS.PRIMARY[500],
                                    icon: <People fontSize="medium" />
                                },
                                {
                                    label: 'Task riêng tư',
                                    value: formatNumber(tasksData.task_public_private?.private_tasks || 0),
                                    caption: 'Công việc nội bộ, bảo mật',
                                    color: COLORS.SECONDARY[500],
                                    icon: <TrendingDown fontSize="medium" />
                                }
                            ]}
                        />

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Task theo trạng thái"
                                    color={COLORS.INFO[600]}
                                    hasData={Boolean(tasksData.tasks_by_status?.length)}
                                    emptyMessage="Chưa có dữ liệu task theo trạng thái."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={tasksData.tasks_by_status}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="status"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="count"
                                                fill={COLORS.INFO[500]}
                                                name="Số lượng"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Task theo mức độ ưu tiên"
                                    color={COLORS.INFO[600]}
                                    hasData={Boolean(tasksData.tasks_by_priority?.length)}
                                    emptyMessage="Chưa có dữ liệu task theo mức độ ưu tiên."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={tasksData.tasks_by_priority}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="priority"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="count"
                                                fill={COLORS.WARNING[500]}
                                                name="Số lượng"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>

                        <CardSection
                            title="Task theo loại công việc"
                            color={COLORS.INFO[600]}
                            hasData={Boolean(tasksData.tasks_by_work_type?.length)}
                            emptyMessage="Chưa có dữ liệu task theo loại công việc."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={tasksData.tasks_by_work_type}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="work_type_name"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.INFO[500]}
                                        name="Số lượng"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Revenue Section */}
                {revenueData && (
                    <SectionContainer title="Thống kê Doanh thu" color={COLORS.SUCCESS[600]}>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Tổng doanh thu',
                                    value: formatCurrency(revenueData.total_revenue || 0),
                                    caption:
                                        revenueData.growth_rate !== undefined && revenueData.growth_rate !== null
                                            ? `Tăng trưởng ${revenueData.growth_rate >= 0 ? '+' : ''}${(revenueData.growth_rate || 0).toFixed(1)}%`
                                            : undefined,
                                    color: COLORS.SUCCESS[500],
                                    icon: <AttachMoney fontSize="medium" />
                                },
                                {
                                    label: 'Doanh thu kỳ trước',
                                    value: formatCurrency(revenueData.previous_period_revenue || 0),
                                    caption: 'So sánh đối chiếu với kỳ hiện tại',
                                    color: COLORS.INFO[500],
                                    icon: <Insights fontSize="medium" />
                                },
                                {
                                    label: 'Giá trị đơn hàng TB',
                                    value: formatCurrency(revenueData.average_order_value || 0),
                                    caption: 'Giá trị trung bình mỗi hóa đơn',
                                    color: COLORS.WARNING[500],
                                    icon: <ShoppingCart fontSize="medium" />
                                },
                                {
                                    label: 'Doanh thu theo thanh toán',
                                    value: formatCurrency(revenueData.total_revenue_by_payment_method || 0),
                                    caption: 'Tổng doanh thu từ các phương thức thanh toán',
                                    color: COLORS.PRIMARY[500],
                                    icon: <Payment fontSize="medium" />
                                }
                            ]}
                        />

                        <CardSection
                            title="Doanh thu theo chu kỳ"
                            color={COLORS.SUCCESS[600]}
                            hasData={Boolean(revenueData.revenue_by_period && revenueData.revenue_by_period.length)}
                            emptyMessage="Chưa có dữ liệu doanh thu theo chu kỳ"
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={revenueData.revenue_by_period}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                            return value;
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="revenue"
                                        fill={COLORS.SUCCESS[500]}
                                        name="Doanh thu"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Doanh thu theo phương thức thanh toán"
                                    color={COLORS.PRIMARY[600]}
                                    hasData={Boolean(revenueData.revenue_by_payment_method?.length)}
                                    emptyMessage="Chưa có dữ liệu theo phương thức thanh toán"
                                >
                                    <Stack spacing={1.5}>
                                        {revenueData.revenue_by_payment_method?.map((item, index) => (
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
                                                    {item.payment_method || 'Không xác định'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.PRIMARY[700] }}>
                                                    {formatCurrency(item.revenue || 0)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Doanh thu theo trạng thái đơn hàng"
                                    color={COLORS.SUCCESS[600]}
                                    hasData={Boolean(revenueData.revenue_by_order_status?.length)}
                                    emptyMessage="Chưa có dữ liệu theo trạng thái đơn hàng"
                                >
                                    <Stack spacing={1.5}>
                                        {revenueData.revenue_by_order_status?.map((item, index) => (
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
                                                    {item.order_status || 'Không xác định'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                                    {formatCurrency(item.revenue || 0)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardSection>
                            </Grid>
                        </Grid>
                    </SectionContainer>
                )}

                {/* Orders Section */}
                {ordersData && (
                    <SectionContainer title="Thống kê Đơn hàng" color={COLORS.PRIMARY[600]}>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Tổng đơn hàng',
                                    value: formatNumber(ordersData.total_orders || 0),
                                    caption:
                                        ordersData.growth_rate !== undefined && ordersData.growth_rate !== null
                                            ? `Tăng trưởng ${ordersData.growth_rate >= 0 ? '+' : ''}${(ordersData.growth_rate || 0).toFixed(1)}%`
                                            : undefined,
                                    color: COLORS.PRIMARY[500],
                                    icon: <ShoppingCart fontSize="medium" />
                                },
                                {
                                    label: 'Đơn hàng kỳ trước',
                                    value: formatNumber(ordersData.previous_period_orders || 0),
                                    caption: 'Hiệu suất so với kỳ trước',
                                    color: COLORS.INFO[500],
                                    icon: <Insights fontSize="medium" />
                                },
                                {
                                    label: 'Thời gian xử lý TB',
                                    value: ordersData.average_order_processing_time
                                        ? `${ordersData.average_order_processing_time.toFixed(1)} phút`
                                        : '—',
                                    caption: 'Thời gian xử lý trung bình mỗi đơn',
                                    color: COLORS.WARNING[500],
                                    icon: <TrendingUp fontSize="medium" />
                                }
                            ]}
                        />

                        <CardSection
                            title="Đơn hàng theo chu kỳ"
                            color={COLORS.PRIMARY[600]}
                            hasData={Boolean(ordersData.orders_by_period && ordersData.orders_by_period.length)}
                            emptyMessage="Chưa có dữ liệu đơn hàng theo chu kỳ"
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={ordersData.orders_by_period}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.PRIMARY[500]}
                                        name="Số lượng đơn"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Đơn hàng theo trạng thái"
                                    color={COLORS.PRIMARY[600]}
                                    hasData={Boolean(ordersData.orders_by_status?.length)}
                                    emptyMessage="Chưa có dữ liệu trạng thái đơn hàng"
                                >
                                    <Stack spacing={1.5}>
                                        {ordersData.orders_by_status?.map((item, index) => (
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
                                                    {item.status || 'Không xác định'}
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
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Top khách hàng theo doanh thu"
                                    color={COLORS.PRIMARY[600]}
                                    hasData={Boolean(ordersData.top_customers_by_revenue?.length)}
                                    emptyMessage="Chưa có dữ liệu khách hàng theo doanh thu"
                                >
                                    <Stack spacing={1.5}>
                                        {ordersData.top_customers_by_revenue?.map((item, index) => (
                                            <Stack
                                                key={index}
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.SECONDARY[100], 0.35) }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <People sx={{ fontSize: 20, color: COLORS.SECONDARY[500] }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {item.customer_name || 'Không xác định'}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.SECONDARY[700] }}>
                                                    {formatCurrency(item.revenue || 0)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12}>
                                <CardSection
                                    title="Top khách hàng theo số lượng đơn"
                                    color={COLORS.PRIMARY[600]}
                                    hasData={Boolean(ordersData.top_customers_by_order_count?.length)}
                                    emptyMessage="Chưa có dữ liệu khách hàng theo số đơn hàng"
                                >
                                    <Stack spacing={1.5}>
                                        {ordersData.top_customers_by_order_count?.map((item, index) => (
                                            <Stack
                                                key={index}
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.25) }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <People sx={{ fontSize: 20, color: COLORS.PRIMARY[500] }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {item.customer_name || 'Không xác định'}
                                                    </Typography>
                                                </Stack>
                                                <Chip
                                                    label={formatNumber(item.order_count || 0)}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                    color="primary"
                                                />
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardSection>
                            </Grid>
                        </Grid>
                    </SectionContainer>
                )}

                {/* Products Section */}
                {productsData && (
                    <SectionContainer title="Thống kê Sản phẩm" color={COLORS.WARNING[600]}>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Tổng số sản phẩm',
                                    value: formatNumber(productsData.total_products || 0),
                                    caption: 'Số lượng mặt hàng đang kinh doanh',
                                    color: COLORS.WARNING[500],
                                    icon: <Inventory2 fontSize="medium" />
                                },
                                {
                                    label: 'Giá trị tồn kho',
                                    value: formatCurrency(productsData.total_inventory_value || 0),
                                    caption: 'Tổng giá trị hàng tồn kho hiện tại',
                                    color: COLORS.INFO[500],
                                    icon: <Insights fontSize="medium" />
                                },
                                {
                                    label: 'Sản phẩm sắp hết',
                                    value: formatNumber(productsData.low_stock_products?.length || 0),
                                    caption: 'Mặt hàng cần bổ sung kho',
                                    color: COLORS.ERROR[500],
                                    icon: <TrendingDown fontSize="medium" />
                                },
                                {
                                    label: 'Sản phẩm lâu bán',
                                    value: formatNumber(productsData.no_sales_products?.length || 0),
                                    caption: 'Chưa ghi nhận doanh thu',
                                    color: COLORS.PRIMARY[500],
                                    icon: <Insights fontSize="medium" />
                                }
                            ]}
                        />

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Top sản phẩm bán chạy (số lượng)"
                                    color={COLORS.WARNING[600]}
                                    hasData={Boolean(productsData.top_selling_by_quantity?.length)}
                                    emptyMessage="Chưa có dữ liệu top sản phẩm theo số lượng."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={productsData.top_selling_by_quantity}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="product_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="quantity"
                                                fill={COLORS.WARNING[500]}
                                                name="Số lượng"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Top sản phẩm bán chạy (doanh thu)"
                                    color={COLORS.SUCCESS[600]}
                                    hasData={Boolean(productsData.top_selling_by_revenue?.length)}
                                    emptyMessage="Chưa có dữ liệu top sản phẩm theo doanh thu."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={productsData.top_selling_by_revenue}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="product_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                                    return value;
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="revenue"
                                                fill={COLORS.SUCCESS[500]}
                                                name="Doanh thu"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>

                        <CardSection
                            title="Sản phẩm không bán được"
                            color={COLORS.ERROR[600]}
                            hasData={Boolean(productsData.no_sales_products?.length)}
                            emptyMessage="Tất cả sản phẩm đều có giao dịch gần đây."
                        >
                            <Stack spacing={1.5}>
                                {productsData.no_sales_products?.map((item, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.ERROR[100], 0.35) }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.product_name || 'Không xác định'}
                                        </Typography>
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
                    </SectionContainer>
                )}

                {/* Services Section */}
                {servicesData && (
                    <SectionContainer title="Thống kê Dịch vụ" color={COLORS.INFO[600]}>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Tổng số booking',
                                    value: formatNumber(servicesData.total_bookings || 0),
                                    caption: 'Số lượng booking đã ghi nhận',
                                    color: COLORS.INFO[500],
                                    icon: <EventAvailable fontSize="medium" />
                                },
                                {
                                    label: 'Tỷ lệ hoàn thành',
                                    value: `${(servicesData.completion_rate ?? 0).toFixed(1)}%`,
                                    caption: 'Tỷ lệ dịch vụ hoàn thành thành công',
                                    color: COLORS.SUCCESS[500],
                                    icon: <TaskAlt fontSize="medium" />
                                },
                                {
                                    label: 'Tỷ lệ hủy',
                                    value: `${(servicesData.cancellation_rate ?? 0).toFixed(1)}%`,
                                    caption: 'Tỷ lệ dịch vụ bị hủy',
                                    color: COLORS.ERROR[500],
                                    icon: <TrendingDown fontSize="medium" />
                                }
                            ]}
                        />

                        <CardSection
                            title="Booking theo chu kỳ"
                            color={COLORS.INFO[600]}
                            hasData={Boolean(servicesData.bookings_by_period && servicesData.bookings_by_period.length)}
                            emptyMessage="Chưa có dữ liệu booking theo chu kỳ."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={servicesData.bookings_by_period}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.INFO[500]}
                                        name="Số lượng booking"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Top dịch vụ phổ biến"
                                    color={COLORS.INFO[600]}
                                    hasData={Boolean(servicesData.top_services?.length)}
                                    emptyMessage="Chưa có dữ liệu các dịch vụ phổ biến."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={servicesData.top_services}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="service_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="booking_count"
                                                fill={COLORS.INFO[500]}
                                                name="Số lượng booking"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Doanh thu theo dịch vụ"
                                    color={COLORS.SUCCESS[600]}
                                    hasData={Boolean(servicesData.service_revenues?.length)}
                                    emptyMessage="Chưa có dữ liệu doanh thu dịch vụ."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={servicesData.service_revenues}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="service_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                                    return value;
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="revenue"
                                                fill={COLORS.SUCCESS[500]}
                                                name="Doanh thu"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>
                    </SectionContainer>
                )}

                {/* Pets Section */}
                {petsData && (
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
                                    icon: <TrendingUp fontSize="medium" />
                                }
                            ]}
                        />

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Thú cưng theo loài"
                                    color={COLORS.SECONDARY[600]}
                                    hasData={Boolean(petsData.pets_by_species?.length)}
                                    emptyMessage="Chưa có dữ liệu phân loại theo loài."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={petsData.pets_by_species}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="species_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="count" fill={COLORS.SECONDARY[500]} name="Số lượng" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Thú cưng theo giống"
                                    color={COLORS.SECONDARY[600]}
                                    hasData={Boolean(petsData.pets_by_breed?.length)}
                                    emptyMessage="Chưa có dữ liệu phân loại theo giống."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={petsData.pets_by_breed}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="breed_name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="count" fill={COLORS.INFO[500]} name="Số lượng" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Thú cưng theo nhóm tuổi"
                                    color={COLORS.SECONDARY[600]}
                                    hasData={Boolean(petsData.pets_by_age_group?.length)}
                                    emptyMessage="Chưa có dữ liệu theo nhóm tuổi."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={petsData.pets_by_age_group}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="count" fill={COLORS.WARNING[500]} name="Số lượng" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Thú cưng theo giới tính"
                                    color={COLORS.SECONDARY[600]}
                                    hasData={Boolean(petsData.pets_by_gender?.length)}
                                    emptyMessage="Chưa có dữ liệu theo giới tính."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={petsData.pets_by_gender}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="count" fill={COLORS.PRIMARY[500]} name="Số lượng" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>

                        <CardSection
                            title="Thú cưng nhập mới theo tháng"
                            color={COLORS.SECONDARY[600]}
                            hasData={Boolean(petsData.pet_arrivals_by_month?.length)}
                            emptyMessage="Chưa có dữ liệu thú cưng nhập mới."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={petsData.pet_arrivals_by_month.map((item) => ({
                                        ...item,
                                        label: formatMonthLabel(item.month)
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill={COLORS.SECONDARY[500]} name="Số lượng" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Pets Health Section */}
                {petsHealthData && (
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={petsHealthData.health_checks_by_month.map((item) => ({
                                        ...item,
                                        label: formatMonthLabel(item.month)
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill={COLORS.SUCCESS[500]} name="Số lượt khám" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
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
                )}

                {/* Pet Groups Section */}
                {petGroupsData && (
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
                )}

                {/* Slots Section */}
                {slotsData && (
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
                            columns={{ xs: 12, sm: 6, md: 4 }}
                        />

                        <CardSection
                            title="Tình trạng slot theo ngày"
                            color={COLORS.SECONDARY[600]}
                            hasData={Boolean(slotsData.slot_availability_by_day?.length)}
                            emptyMessage="Chưa có dữ liệu lịch sử slot theo ngày."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart
                                    data={slotsData.slot_availability_by_day.map(item => ({
                                        ...item,
                                        date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="available" stackId="a" fill={COLORS.SUCCESS[500]} name="Còn trống" />
                                    <Bar dataKey="occupied" stackId="a" fill={COLORS.ERROR[500]} name="Đã đặt" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <CardSection
                            title="Số lượng slot theo khu vực"
                            color={COLORS.SECONDARY[600]}
                            hasData={Boolean(slotsData.slot_by_area?.length)}
                            emptyMessage="Chưa có dữ liệu phân bổ slot theo khu vực."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={slotsData.slot_by_area}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="area_name"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="slot_count"
                                        fill={COLORS.SECONDARY[500]}
                                        name="Số lượng slot"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Feedbacks Section */}
                {feedbacksData && (
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
                            columns={{ xs: 12, sm: 6, md: 3 }}
                        />

                        <CardSection
                            title="Phân bố điểm đánh giá"
                            color={COLORS.PRIMARY[600]}
                            hasData={Boolean(feedbacksData.rating_distribution?.length)}
                            emptyMessage="Chưa có dữ liệu phân bố điểm đánh giá."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={feedbacksData.rating_distribution}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="rating"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'percentage') return `${value}%`;
                                            return formatNumber(value);
                                        }}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.WARNING[500]}
                                        name="Số lượng"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <CardSection
                            title="Dịch vụ được đánh giá cao nhất"
                            color={COLORS.PRIMARY[600]}
                            hasData={Boolean(feedbacksData.top_rated_services?.length)}
                            emptyMessage="Chưa có dữ liệu dịch vụ được đánh giá cao."
                        >
                            <Stack spacing={1.5}>
                                {feedbacksData.top_rated_services?.map((item, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.35) }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.service_name || 'Không xác định'}
                                        </Typography>
                                        <Chip
                                            label={`${item.average_rating?.toFixed(1) || 0} ⭐`}
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                            color="warning"
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Employees Section */}
                {employeesData && (
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={employeesData.new_employees_by_month.map(item => ({
                                        ...item,
                                        month: formatMonthLabel(item.month)
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.PRIMARY[500]}
                                        name="Số lượng nhân viên mới"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <CardSection
                            title="Nhân viên theo vai trò"
                            color={COLORS.PRIMARY[600]}
                            hasData={Boolean(employeesData.employees_by_sub_role?.length)}
                            emptyMessage="Chưa có dữ liệu phân bổ vai trò nhân viên."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={employeesData.employees_by_sub_role}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="sub_role"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.INFO[500]}
                                        name="Số lượng"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Teams Section */}
                {teamsData && (
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={teamsData.teams_by_status}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="status"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.SECONDARY[500]}
                                        name="Số lượng"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Employees Performance Section */}
                {employeesPerformanceData && (
                    <SectionContainer title="Hiệu suất Nhân viên" color={COLORS.PRIMARY[600]}>
                        {!employeesPerformanceData.employee_booking_completions?.length &&
                            !employeesPerformanceData.employee_task_completions?.length &&
                            !employeesPerformanceData.top_performing_employees?.length ? (
                            <EmptyState message="Chưa có dữ liệu hiệu suất nhân viên cho chu kỳ này." />
                        ) : (
                            <>
                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <CardSection
                                            title="Hoàn thành booking theo nhân viên"
                                            color={COLORS.PRIMARY[600]}
                                            hasData={Boolean(employeesPerformanceData.employee_booking_completions?.length)}
                                            emptyMessage="Chưa có dữ liệu hoàn thành booking."
                                        >
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart
                                                    data={employeesPerformanceData.employee_booking_completions}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="employee_name"
                                                        tick={{ fontSize: 12 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={100}
                                                    />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value) => formatNumber(value)}
                                                        contentStyle={{
                                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="completion_count"
                                                        fill={COLORS.SUCCESS[500]}
                                                        name="Số lượng hoàn thành"
                                                        radius={[8, 8, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardSection>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CardSection
                                            title="Hoàn thành task theo nhân viên"
                                            color={COLORS.PRIMARY[600]}
                                            hasData={Boolean(employeesPerformanceData.employee_task_completions?.length)}
                                            emptyMessage="Chưa có dữ liệu hoàn thành task."
                                        >
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart
                                                    data={employeesPerformanceData.employee_task_completions}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="employee_name"
                                                        tick={{ fontSize: 12 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={100}
                                                    />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value) => formatNumber(value)}
                                                        contentStyle={{
                                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="completion_count"
                                                        fill={COLORS.INFO[500]}
                                                        name="Số lượng hoàn thành"
                                                        radius={[8, 8, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardSection>
                                    </Grid>
                                </Grid>

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
                )}


                {/* Daily Tasks Section */}
                {dailyTasksData && (
                    <SectionContainer title="Thống kê Task Hàng ngày" color={COLORS.WARNING[600]}>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Task hàng ngày theo chu kỳ"
                                    color={COLORS.WARNING[600]}
                                    hasData={Boolean(dailyTasksData.daily_tasks_by_period?.length)}
                                    emptyMessage="Chưa có dữ liệu task hàng ngày theo chu kỳ."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart
                                            data={dailyTasksData.daily_tasks_by_period.map(item => ({
                                                ...item,
                                                period: formatMonthLabel(item.period)
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="period"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="completed" stackId="a" fill={COLORS.SUCCESS[500]} name="Đã hoàn thành" />
                                            <Bar dataKey="pending" stackId="a" fill={COLORS.WARNING[500]} name="Đang chờ" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <CardSection
                                    title="Task hàng ngày theo trạng thái"
                                    color={COLORS.WARNING[600]}
                                    hasData={Boolean(dailyTasksData.daily_tasks_by_status?.length)}
                                    emptyMessage="Chưa có dữ liệu task hàng ngày theo trạng thái."
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={dailyTasksData.daily_tasks_by_status}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="status"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatNumber(value)}
                                                contentStyle={{
                                                    backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                                    border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="count"
                                                fill={COLORS.WARNING[500]}
                                                name="Số lượng"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardSection>
                            </Grid>
                        </Grid>

                        <CardSection
                            title="Task hàng ngày theo đội nhóm"
                            color={COLORS.WARNING[600]}
                            hasData={Boolean(dailyTasksData.daily_tasks_by_team?.length)}
                            emptyMessage="Chưa có dữ liệu task hàng ngày theo đội nhóm."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={dailyTasksData.daily_tasks_by_team}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="team_name"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="task_count"
                                        fill={COLORS.WARNING[500]}
                                        name="Số lượng task"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>

                        <CardSection
                            title="Task quá hạn"
                            color={COLORS.ERROR[600]}
                            hasData={Boolean(dailyTasksData.overdue_tasks?.length)}
                            emptyMessage="Không có task nào quá hạn."
                        >
                            <Stack spacing={1.5}>
                                {dailyTasksData.overdue_tasks?.map((item, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.ERROR[100], 0.35) }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {item.task_title || 'Không xác định'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Hạn: {formatDateTime(item.due_date)}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={`Quá hạn ${item.days_overdue || 0} ngày`}
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                            color="error"
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Work Shifts Section */}
                {workShiftsData && (
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
                            columns={{ xs: 12, sm: 6, md: 4 }}
                        />

                        <CardSection
                            title="Phân bổ nhân viên theo ca làm việc"
                            color={COLORS.SECONDARY[600]}
                            hasData={Boolean(workShiftsData.work_shift_assignments?.length)}
                            emptyMessage="Chưa có dữ liệu phân bổ nhân viên theo ca."
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={workShiftsData.work_shift_assignments}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="work_shift_name"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="employee_count"
                                        fill={COLORS.SECONDARY[500]}
                                        name="Số lượng nhân viên"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Customers Statistics */}
                {customersStats && (
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={customersStats.new_customers_by_period.map(item => ({
                                        ...item,
                                        period: formatMonthLabel(item.period)
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatNumber(value)}
                                        contentStyle={{
                                            backgroundColor: COLORS.BACKGROUND.DEFAULT,
                                            border: `1px solid ${COLORS.BORDER.DEFAULT}`,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.PRIMARY[500]}
                                        name="Số lượng khách mới"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardSection>
                    </SectionContainer>
                )}

                {/* Inventory Section */}
                {inventoryStats && (
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
                            columns={{ xs: 12, sm: 6, md: 4 }}
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
                )}

                {/* Detailed Statistics */}
                {(revenueData?.revenue_by_payment_method?.length ||
                    ordersData?.orders_by_status?.length ||
                    servicesData?.bookings_by_status?.length ||
                    ordersData?.top_customers_by_revenue?.length ||
                    ordersData?.top_customers_by_order_count?.length) && (
                        <SectionContainer title="Thông tin chi tiết" color={COLORS.PRIMARY[600]}>
                            <Grid container spacing={3}>
                                {revenueData?.revenue_by_payment_method?.length ? (
                                    <Grid item xs={12} md={6}>
                                        <CardSection
                                            title="Doanh thu theo phương thức thanh toán"
                                            color={COLORS.PRIMARY[600]}
                                            hasData
                                        >
                                            <Stack spacing={1.5}>
                                                {revenueData.revenue_by_payment_method.map((item, index) => (
                                                    <Stack
                                                        key={index}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.35) }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.payment_method || 'Không xác định'}
                                                        </Typography>
                                                        <Chip
                                                            label={formatCurrency(item.revenue || 0)}
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardSection>
                                    </Grid>
                                ) : null}

                                {ordersData?.orders_by_status?.length ? (
                                    <Grid item xs={12} md={6}>
                                        <CardSection title="Đơn hàng theo trạng thái" color={COLORS.PRIMARY[600]} hasData>
                                            <Stack spacing={1.5}>
                                                {ordersData.orders_by_status.map((item, index) => (
                                                    <Stack
                                                        key={index}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.25) }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.status || 'Không xác định'}
                                                        </Typography>
                                                        <Chip
                                                            label={formatNumber(item.count || 0)}
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardSection>
                                    </Grid>
                                ) : null}

                                {servicesData?.bookings_by_status?.length ? (
                                    <Grid item xs={12} md={6}>
                                        <CardSection title="Booking theo trạng thái" color={COLORS.INFO[600]} hasData>
                                            <Stack spacing={1.5}>
                                                {servicesData.bookings_by_status.map((item, index) => (
                                                    <Stack
                                                        key={index}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.INFO[100], 0.35) }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.status || 'Không xác định'}
                                                        </Typography>
                                                        <Chip
                                                            label={formatNumber(item.count || 0)}
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardSection>
                                    </Grid>
                                ) : null}

                                {ordersData?.top_customers_by_revenue?.length ? (
                                    <Grid item xs={12} md={6}>
                                        <CardSection title="Top khách hàng theo doanh thu" color={COLORS.PRIMARY[600]} hasData>
                                            <Stack spacing={1.5}>
                                                {ordersData.top_customers_by_revenue.map((item, index) => (
                                                    <Stack
                                                        key={index}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.SECONDARY[100], 0.35) }}
                                                    >
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <People sx={{ fontSize: 20, color: COLORS.SECONDARY[500] }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {item.customer_name || 'Không xác định'}
                                                            </Typography>
                                                        </Stack>
                                                        <Chip
                                                            label={formatCurrency(item.revenue || 0)}
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardSection>
                                    </Grid>
                                ) : null}

                                {ordersData?.top_customers_by_order_count?.length ? (
                                    <Grid item xs={12} md={6}>
                                        <CardSection title="Top khách hàng theo số lượng đơn" color={COLORS.PRIMARY[600]} hasData>
                                            <Stack spacing={1.5}>
                                                {ordersData.top_customers_by_order_count.map((item, index) => (
                                                    <Stack
                                                        key={index}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{ px: 2, py: 1.5, borderRadius: 2, background: alpha(COLORS.PRIMARY[100], 0.35) }}
                                                    >
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <People sx={{ fontSize: 20, color: COLORS.PRIMARY[500] }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {item.customer_name || 'Không xác định'}
                                                            </Typography>
                                                        </Stack>
                                                        <Chip
                                                            label={formatNumber(item.order_count || 0)}
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardSection>
                                    </Grid>
                                ) : null}
                            </Grid>
                        </SectionContainer>
                    )}
            </Container>

            {/* Alert Modal */}
            <AlertModal
                open={alert.open}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </Box>
    );
};

export default DashboardPage;
